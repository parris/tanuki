import getAttr from 'lodash/get';
import * as queryString from 'query-string';
import fetch from 'node-fetch';

import fetchgql from './fetchgql';

export async function connectService(serviceName, userId, userData, sessionToken) {
  const accountData = await fetchgql({
    query: `query {
      connectedAccountByUserIdAndAccountType(userId: ${userId}, accountType: "${serviceName}") {
        id
      }
    }`,
  }, sessionToken);

  const oldConnectionId = getAttr(accountData, 'data.connectedAccountByUserIdAndAccountType.id', null);

  if (oldConnectionId) {
    const patch = { accessToken: userData.access_token, response: userData, refreshToken: null };
    if (userData.refresh_token) {
      patch.refreshToken = userData.refresh_token;
    }
    const { data } = await fetchgql({
      query: `mutation UpdateConnectedAccount($input: UpdateConnectedAccountByIdInput!) {
        updateConnectedAccountById(input: $input) {
          connectedAccount {
            id
            accessToken
          }
        }
      }
      `,
      variables: {
        input: {
          id: oldConnectionId,
          connectedAccountPatch: patch,
        },
      },
    }, sessionToken);

    return getAttr(data, 'updateConnectedAccountById.connectedAccount', {});
  }

  const { data } = await fetchgql({
    query: `mutation CreateConnectedAccount($input: CreateConnectedAccountInput!) {
      createConnectedAccount(input: $input) {
        connectedAccount {
          id
          accessToken
        }
      }
    }
    `,
    variables: {
      input: { connectedAccount: { userId, accountType: serviceName, accessToken: userData.access_token, refreshToken: userData.refresh_token, response: userData } },
    },
  }, sessionToken);

  return getAttr(data, 'createConnectedAccount.connectedAccount', {});
}

export const serviceSettings = {
  google: {
    accessTokenRequestURL: 'https://www.googleapis.com/oauth2/v4/token',
    redirectURI: `${process.env.HOST ?? ''}/services/oauth-redirect?service=google`,
    accessTokenRequestBody: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  instagram: {
    accessTokenRequestURL: 'https://api.instagram.com/oauth/access_token',
    redirectURI: `${process.env.HOST ?? ''}/services/oauth-redirect?service=instagram`,
    accessTokenRequestBody: {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
    },
  },
  mailchimp: {
    accessTokenRequestURL: 'https://login.mailchimp.com/oauth2/token',
    redirectURI: `${(process.env.HOST ?? '').includes('localhost') ? 'http://127.0.0.1:3000' : process.env.HOST}/services/oauth-redirect?service=mailchimp`,
    accessTokenRequestBody: {
      client_id: process.env.MAILCHIMP_CLIENT_ID,
      client_secret: process.env.MAILCHIMP_CLIENT_SECRET,
    },
    appendMeta: async (userData) => {
      const metadata = await fetch('https://login.mailchimp.com/oauth2/metadata', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `OAuth ${userData.access_token}`,
        },
      }).then((res) => res.json());
      return { ...userData, dc: metadata.dc };
    },
  },
};

export async function getAccessToken(serviceName, code) {
  return fetch(
    serviceSettings[serviceName].accessTokenRequestURL,
    {
      method: 'POST',
      body: queryString.stringify({
        ...serviceSettings[serviceName].accessTokenRequestBody,
        redirect_uri: serviceSettings[serviceName].redirectURI,
        grant_type: 'authorization_code',
        code,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    },
  ).then((res) => res.json());
}

export async function refreshAccessToken(serviceName, refreshToken, userId, sessionToken) {
  let userData = await fetch(
    serviceSettings[serviceName].accessTokenRequestURL,
    {
      method: 'POST',
      body: queryString.stringify({
        ...serviceSettings[serviceName].accessTokenRequestBody,
        redirect_uri: serviceSettings[serviceName].redirectURI,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    },
  ).then((res) => res.json());

  if (serviceSettings[serviceName].appendMeta) {
    userData = await serviceSettings[serviceName].appendMeta(userData);
  }

  return connectService(serviceName, userId, userData, sessionToken);
}

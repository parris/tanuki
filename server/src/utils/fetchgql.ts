import fetch from 'node-fetch';

export default (gql, sessionToken, host = process.env.HOST) => (
  fetch(
    `${host}/graphql`,
    {
      method: 'POST',
      body: JSON.stringify(gql),
      headers: {
        Accept: 'application/json',
        Authorization: `bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    },
  ).then((res) => res.json())
);

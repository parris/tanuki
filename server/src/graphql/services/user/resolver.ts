import * as getAttr from 'just-safe-get';
import * as iz from 'iz';
import * as validators from 'iz/lib/validators';
import * as bcrypt from 'bcrypt';

import createRandomString, { createJWT, decodeJWT } from '../../../utils/security';
import { adminJWTToSql, JWTToSql } from '../../../utils/jwtToSql';
import hashPassword from '../../../utils/hashPassword';
import { createSessionToken } from '../../../utils/sessions';
import { userPrivateToPublicId, userPublicToPrivateId } from '../../../utils/user';
import { text as fpEmailText, html as fpEmailHTML } from '../../../emails/forgotPassword';
import mailTransport from '../../../emails/mailTransport';
import { Context } from 'postgraphile';
import { UserRole } from '../../../types';

const saltRounds = 10;

export const adminOnlyQuery = async (resolver, _source, _args, { jwtClaims }) => {
  const jwt = jwtClaims;
  try {
    if (jwt?.role !== 'tanuki_admin') {
      throw new Error('Unauthorized');
    }
  } catch (e) {
    throw new Error(e.message);
  }
  return resolver();
};

export const adminOrOwnerOnlyField = async (resolver, user, _args, { jwtClaims }) => {
  let unmaskedValue = await resolver();
  let jwt = jwtClaims;
  try {
    if (jwt?.role !== 'tanuki_admin' && jwt?.user_id !== user.$userId) {
      unmaskedValue = null;
    }
  } catch (e) {
    throw new Error(e.message);
  }
  return unmaskedValue;
};

export const adminWritableFields = (protectedFieldNames = []) => async (resolver, _source, _args, { jwtClaims }, info) => {
  const jwt = jwtClaims;
  // This huge mapping let's us extract all of the arguments out of all the queries. If there are any violations we don't proceed
  // I wish we could isolate failures like this a bit better to some specific part of a query.
  const fields = getAttr(info, 'fieldNodes', [])
    .map((fieldNodes) => (getAttr(fieldNodes, 'arguments', []))).flat()
    .map((fieldNodeArguments) => (getAttr(fieldNodeArguments, 'value.fields', []))).flat()
    .map((field) => (getAttr(field, 'value.fields', []))).flat()
    .map((field) => getAttr(field, 'name.value', ''));

  let authorized = false;

  try {
    const hasProtectedFields = protectedFieldNames.reduce((memo, protectedField) => (memo || fields.includes(protectedField)), false);
    if (!hasProtectedFields || (hasProtectedFields && jwt?.role === 'tanuki_admin')) {
      authorized = true;
    }
  } catch (e) {
    authorized = false;
  }

  if (!authorized) {
    throw new Error('Unauthorized - some fields you are trying to write to are protected.');
  }

  return resolver();
};

export const validateCredentials = async (resolver, _source, { input: { email, password } }) => {
  email = email.trim().toLowerCase();

  if (!iz({ value: email, validators }).email().required().valid) {
    throw new Error('Please use a valid email address');
  }
  if (!iz({ value: password, validators }).minLength(8).required().valid) {
    throw new Error('Passwords must be at least 8 characters long');
  }

  return resolver();
};

export const getUser = async (
  sql,
  { userId } : any, // parent
  _args : any,
  { pgClient, ...contextArgs }: any, // context
  { graphile: { selectGraphQLResultFromTable } } : any, // context
  _resolveInfo: any,
) => {
  try {
    await pgClient.query(JWTToSql(contextArgs.jwtToken));
    const userRows = await selectGraphQLResultFromTable(
      sql.fragment`public.user`,
      (tableAlias, sqlBuilder) => {
        sqlBuilder.where(sql.fragment`${tableAlias}.id = ${sql.value(userId)}`);
      },
    );

    return userRows[0];
  } catch (e) {
    throw new Error(e);
  }
};

const createSessionAndUpdateContext = async (user: { id: number, role: string }, context: Context<any>) : Promise<string> => {
  const newJWT = createJWT(
    user.id.toString(),
    user.role,
  ).toString();

  context.jwtToken = newJWT;
  context.jwtClaims = decodeJWT(newJWT);
  context.jwtRole = [context.jwtClaims.role];
  context.pgRole = context.jwtClaims.role;

  return createSessionToken(user.id, UserRole[user.role]);
}

export const register = async (_, { input: { email, password, verifyPassword } }, context) => {
  const { pgClient } = context;

  email = email.trim().toLowerCase();

  if (password !== verifyPassword) {
    throw new Error('Passwords must match. Please try again');
  }
  if (!iz({ value: password, validators }).minLength(8).required().valid) {
    throw new Error('Passwords must be at least 8 characters long');
  }
  if (!iz({ value: email, validators }).email().required().valid) {
    throw new Error('Please use a valid email address');
  }

  try {
    await pgClient.query(adminJWTToSql());
    const salt : string = await bcrypt.genSalt(saltRounds);
    const passHash = await hashPassword(password, salt);

    const createdUser = await pgClient.query(
      'INSERT INTO user (email, password_hash, password_salt) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, passHash, salt],
    );

    if (createdUser.rowCount === 0) {
      throw new Error('Error please try again');
    }
    await pgClient.query('commit');

    const sessionToken = createSessionAndUpdateContext(createdUser.rows[0], context);

    return {
      sessionToken,
      userId: createdUser.rows[0].id,
    };
  } catch (e) {
    throw new Error(e);
  }
};

export const currentUser = async (_, _2, context) => {
  const { jwtClaims, jwtToken } = context;
  const jwt = jwtClaims;
  return { sessionToken: jwtToken, userId: jwt.user_id }
};

export const login = async (_, { input: { email, password } }, context) => {
  const { pgClient } = context;

  email = email.trim().toLowerCase();

  try {
    await pgClient.query(adminJWTToSql());

    const user = await pgClient.query('SELECT * FROM user WHERE email = $1', [email]);

    if (user.rowCount === 0) {
      throw new Error('Error please try again');
    }

    const salt : string = user.rows[0].password_salt;
    const passHash = await hashPassword(password, salt);

    if (passHash !== user.rows[0].password_hash) {
      throw new Error('Error please try again');
    }

    const sessionToken = createSessionAndUpdateContext(user.rows[0], context);

    return {
      sessionToken,
      userId: user.rows[0].id,
    };
  } catch (e) {
    throw new Error(e);
  }
};

export const updatePassword = async (_, { input: { oldPassword, password, verifyPassword } }, { jwtClaims, pgClient }) => {
  const jwt = jwtClaims;
  if (password !== verifyPassword) {
    throw new Error('Passwords must match. Please try again');
  }
  if (!iz({ value: password, validators }).minLength(8).required().valid) {
    throw new Error('Passwords must be at least 8 characters long');
  }

  let salt = '';

  try {
    await pgClient.query(adminJWTToSql());
    const result = await pgClient.query(
      'SELECT password_salt FROM user WHERE id = $1',
      [jwt.user_id],
    );
    const { rows: [row] } = result;
    salt = row.password_salt;
    const oldPassHash = await hashPassword(oldPassword, salt);
    const result2 = await pgClient.query(
      'SELECT id, password_salt FROM user WHERE id = $1 and password_hash = $2',
      [jwt.user_id, oldPassHash],
    );
    if (result2.rowCount === 0) {
      throw new Error('Old password is incorrect, please try again.');
    }
    await pgClient.query('commit');
  } catch (e) {
    throw new Error(e);
  }

  try {
    await pgClient.query(adminJWTToSql());
    const newPassHash = await hashPassword(password, salt);
    await pgClient.query(
      'UPDATE user SET password_hash = $1 WHERE id = $2',
      [newPassHash, jwt.user_id],
    );
    await pgClient.query('commit');
    return { success: true };
  } catch (e) {
    throw new Error(e);
  }
};

export const updateEmail = async (_, { newEmail }, { jwtClaims, pgClient }) => {
  const jwt = jwtClaims;

  newEmail = newEmail.trim().toLowerCase();

  if (!iz({ value: newEmail, validators }).email().required().valid) {
    throw new Error('Please use a valid email address');
  }

  try {
    await pgClient.query(adminJWTToSql());
    await pgClient.query(
      'UPDATE user SET email = $1 WHERE id = $2',
      [newEmail, jwt.user_id],
    );
    await pgClient.query('commit');
    return { success: true };
  } catch (e) {
    throw new Error(e);
  }
};

export const forgotPassword = async (_, { email }, context) => {
  const { pgClient } = context;

  email = email.trim().toLowerCase();

  if (!iz({ value: email, validators }).email().required().valid) {
    throw new Error('The email address specified is invalid');
  }

  const token = createRandomString(6, '0123456789');

  await pgClient.query('begin');
  try {
    await pgClient.query(adminJWTToSql());
    await pgClient.query(
      'UPDATE user SET password_reset_token = $1 WHERE email = $2 returning *',
      [token, email],
    );
    const { rows: [user] } = await pgClient.query(
      'SELECT id FROM user WHERE email = $1',
      [email],
    );
    await pgClient.query('commit');

    const emailVars = {
      publicUserId: userPrivateToPublicId(user.id),
      token,
    };

    await mailTransport().sendMail({
      from: `"${process.env.SERVICE_NAME}" <no-reply@${process.env.HOST}>`,
      to: email,
      subject: `Reset Password - ${process.env.SERVICE_NAME}`,
      text: fpEmailText(emailVars),
      html: fpEmailHTML(emailVars),
    });
  } catch (e) {
    await pgClient.query('rollback');

    // We don't want to re-throw. No one should know if this account exists or not.
    return { success: true };
  }

  return { success: true };
}

export const finishForgotPassword = async (_, { input: { userId, password, verifyPassword, token } }, context) => {
  const { pgClient } = context;

  if (password !== verifyPassword) {
    throw new Error('Passwords must match. Please try again');
  }

  if (!token || token.length < 1) {
    throw new Error('Password reset token is invalid');
  }

  if (!userId) {
    throw new Error('userId must be defined and valid');
  }

  const privateuserId = userPublicToPrivateId(userId);

  if (!iz({ value: password, validators }).minLength(6).maxLength(72).required().valid) {
    throw new Error('You must specify a password that is at least 6 characters long.');
  }

  await pgClient.query('begin');
  try {
    await pgClient.query(adminJWTToSql());
    const { rows: [row] } = await pgClient.query('SELECT password_salt, password_reset_token, role FROM user WHERE id = $1', [privateuserId]);
    if (row.password_reset_token === null || row.password_reset_token !== token) {
      throw new Error('Password reset token is invalid');
    }
    const passwordHash = await hashPassword(password, row.password_salt);
    const user = await pgClient.query(
      "UPDATE user SET password_hash = $1, password_reset_token = null WHERE id = $2 RETURNING *",
      [passwordHash, privateuserId],
    );
    await pgClient.query('commit');

    const sessionToken = createSessionAndUpdateContext(user.rows[0], context);

    return {
      sessionToken,
      userId: privateuserId,
    };
  } catch (e) {
    await pgClient.query('rollback');
    throw e;
  }
};

export const finishForgotPasswordWithEmail = async (_, args, context) => {
  let { email } = args.input;
  email = email.trim().toLowerCase();

  try {
    await context.pgClient.query(adminJWTToSql());
    const user = await context.pgClient.query("SELECT id FROM user where email = $1", [email]);
    args.input.userId = userPrivateToPublicId(BigInt(parseInt(user.rows[0].id, 10)));
    return await finishForgotPassword(_, args, context);
  } catch (e) {
    await context.pgClient.query('rollback');
    throw e;
  }
};

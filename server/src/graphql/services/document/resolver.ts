import * as are from 'iz/lib/are';
import * as validators from 'iz/lib/validators';
import Hashids from 'hashids/dist/hashids';
import { JWTToSql } from '../../../utils/jwtToSql';

const hashIdLength = parseInt(process.env.GENERIC_HASHID_LENGTH ?? '6', 10);
const tokenAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';

export const documentChanged = async (
  sql,
  parent,
  _args,
  _context,
  { graphile: { selectGraphQLResultFromTable } },
  _graphile,
) => {
  if (!parent || !parent.event || !parent.event.subject) {
    return null;
  }
  const rows = await selectGraphQLResultFromTable(
    sql.fragment`public.document`,
    (tableAlias, sqlBuilder) => {
      sqlBuilder.where(sql.fragment`${tableAlias}.id = ${sql.value(parent.event.subject)}`);
    },
  );
  return rows[0];
};

const eventTypeChangeValidator = {
  bodyInsertNode: (change) => {
    if (!(change.parentId === null || typeof change.parentId === 'string')) {
      throw new Error('bodyInsertNode events must have parentId defined as null or a string.');
    }
    if (typeof change.node !== 'object') {
      throw new Error('bodyInsertNode events must have a "node" defined as an object.');
    }
    if (!(change.node.parentId === null || typeof change.node.parentId === 'string')) {
      throw new Error('change.node.parentId must be null or a string.');
    }
    if (change.parentId !== change.node.parentId) {
      throw new Error('change.node.parentId must match change.parentId.');
    }
    if (typeof change.position !== 'number') {
      throw new Error('bodyInsertNode events require a position to understand where in the parent to insert the new node.');
    }
  },
  bodyMoveNode: (change) => {
    if (!(typeof change.nodeId === 'string')) {
      throw new Error('bodyMoveNode events must have nodeId defined as a string');
    }
    if (!(change.newParentId === null || typeof change.newParentId === 'string')) {
      throw new Error('bodyMoveNode events must have newParentId defined as null or a string');
    }
    if (typeof change.position !== 'number') {
      throw new Error('bodyMoveNode requires a position, to understand where in the parent to insert the new node.');
    }
  },
  bodyPatchNode: (change) => {
    if (!(typeof change.nodeId === 'string')) {
      throw new Error('bodyPatchNode events must have nodeId defined as a string');
    }
    if (change.node === null || typeof change.node !== 'object') {
      throw new Error('bodyPatchNode events must have a "node" defined as an object.');
    }
  },
};

const processEventData = {
  bodyInsertNode: (change, args, documentId) => {
    if (!(change.node.childIds instanceof Array)) {
      change.node.childIds = [];
    }
    change.nodeId = generateNodeId(documentId);
    change.node.id = change.nodeId;
    args.input.documentChange.change = JSON.stringify(change);
  },
  bodyPatchNode: (change) => {
    // not allowed to update these during a patch
    delete change.node.id;
    delete change.node.parentId;
    delete change.node.childIds;
  },
};

const eventTypeUpdater = {
  bodyInsertNode: async (pgClient, jwtToken, documentId, change) => {
    const sanitizedId = change.nodeId.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedParentId = typeof change.parentId === 'string' ? change.parentId.replace(/[^a-zA-Z0-9-_]/g, '') : null;
    try {
      await pgClient.query('begin');
      await pgClient.query(JWTToSql(jwtToken));
      await pgClient.query(
        `UPDATE public.document SET draft = jsonb_set(draft, '{body,nodes,"${sanitizedId}"}', $2::jsonb, true) WHERE id = $1::int;`,
        [documentId, JSON.stringify(change.node)],
      );
      if (change.parentId) {
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_insert(draft, '{body,nodes,"${sanitizedParentId}",childIds,${change.position}}'::text[], to_jsonb($2::text)) WHERE id = $1::int;`,
          [documentId, change.nodeId],
        );
      } else {
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_insert(draft, '{body,root,${change.position}}'::text[], to_jsonb($2::text)) WHERE id = $1::int;`,
          [documentId, change.nodeId],
        );
      }
      await pgClient.query('commit');
    } catch (e) {
      throw new Error('Could not update draft');
    }
  },
  bodyMoveNode: async (pgClient, jwtToken, documentId, change) => {
    const sanitizedId = change.nodeId.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedNewParentId = typeof change.newParentId === 'string' ? change.newParentId.replace(/[^a-zA-Z0-9-_]/g, '') : null;
    try {
      await pgClient.query('begin');
      await pgClient.query(JWTToSql(jwtToken));
      // remove from old parent
      await pgClient.query(
        `UPDATE public.document SET draft = (
          CASE
            WHEN (draft->'body'->'nodes'->'"${sanitizedId}"'->'parentId') IS NULL
            THEN jsonb_set(draft, ARRAY['body','root'], (draft->'body'->'root') - '${sanitizedId}', true)
            WHEN (draft->'body'->'nodes'->'"${sanitizedId}"'->'parentId') IS NOT NULL
            THEN jsonb_set(draft, ARRAY['body','nodes',draft#>>'{body,nodes,"${sanitizedId}",parentId}','childIds'], (draft->'body'->'nodes'->'${sanitizedId}'->'childIds') - '${sanitizedId}', true)
          END)
          WHERE id = $1::int;`,
        [documentId],
      );
      if (change.newParentId) {
        // set parentId on this object
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_set(draft, '{body,nodes,${sanitizedId},parentId}', '"${sanitizedNewParentId}"'::jsonb, true) WHERE id = $1::int;`,
          [documentId],
        );
        // add to new parent's childIds
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_insert(draft, '{body,nodes,${sanitizedNewParentId},childIds,${change.position}}'::text[], to_jsonb($2::text)) WHERE id = $1::int;`,
          [documentId, sanitizedId],
        );
      } else {
        // set parentId on this object to null
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_set(draft, '{body,nodes,${sanitizedId},parentId}', 'null'::jsonb, true) WHERE id = $1::int;`,
          [documentId],
        );
        // add to new parent's childIds
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_insert(draft, '{body,root,${change.position}}'::text[], to_jsonb($2::text)) WHERE id = $1::int;`,
          [documentId, sanitizedId],
        );
      }
      await pgClient.query('commit');
    } catch (e) {
      throw new Error('Could not update draft');
    }
  },
  bodyPatchNode: async (pgClient, jwtToken, documentId, change) => {
    const sanitizedId = change.nodeId.replace(/[^a-zA-Z0-9-_]/g, '');
    try {
      await pgClient.query('begin');
      await pgClient.query(JWTToSql(jwtToken));
      await pgClient.query(
        `UPDATE public.document SET draft = jsonb_set(draft, '{body,nodes,"${sanitizedId}"}', draft->'body'->'nodes'->'${sanitizedId}' || $2::jsonb, true) WHERE id = $1::int;`,
        [documentId, JSON.stringify(change.node)],
      );
      await pgClient.query('commit');
    } catch (e) {
      throw new Error('Could not update draft');
    }
  },
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generateNodeId = (documentId) => {
  const hashids = new Hashids(`DocumentNode${documentId}` as string, hashIdLength as number, tokenAlphabet);
  // if you insert in the same millisecond for the same document, then theres a 1 in a 10 million chance of a chance for collision
  // also note - this is an underscore instead of a dash to just avoid all confusion between escaping and subtraction in sql
  return `${hashids.encode(Date.now())}_${hashids.encode(getRandomInt(0, 9999999))}`;
}

export const wrapCreateDocumentChange = async (resolve, _source, args, context, _resolveInfo) => {
  const documentId = args.input.documentChange.documentId;
  const change = args.input.documentChange.change;
  let parsedChange;

  try {
    parsedChange = JSON.parse(change);
  } catch (e) {
    throw new Error('Change must be valid JSON');
  }

  const validEventTypes = ['bodyInsertNode', 'bodyMoveNode', 'bodyPatchNode', 'bodyDeleteNode', 'metaUpdate'];
  const changeValidator = are(
    {
      eventType: [
        { rule: 'inArray', args: [validEventTypes], error: `change.eventType must be one of: ${validEventTypes.join(', ')}` },
        { rule: 'required', error: 'eventType is required for each change' },
      ],
    },
    validators,
  ).for(parsedChange);

  if (!changeValidator.valid) {
    throw new Error(`Invalid change: ${JSON.stringify(changeValidator.invalidFields)}`);
  }

  if (eventTypeChangeValidator[parsedChange.eventType]) {
    eventTypeChangeValidator[parsedChange.eventType](parsedChange);
  }
  if (processEventData[parsedChange.eventType]) {
    processEventData[parsedChange.eventType](parsedChange, args, documentId);
  }

  const output = await resolve();

  if (eventTypeUpdater[parsedChange.eventType]) {
    await eventTypeUpdater[parsedChange.eventType](context.pgClient, context.jwtToken, documentId, parsedChange);
  }

  return output;
};

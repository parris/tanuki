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
  'bodyInsertComponent': (change) => {
    if (!(change.parentId === null || typeof change.parentId === 'string')) {
      throw new Error('bodyInsertComponent events must have parentId defined as null or a string');
    }
    if (typeof change.position !== 'number') {
      throw new Error('bodyInsertComponent requires a position, to understand where in the parent to insert the new component.');
    }
  }
};

const eventTypeUpdater = {
  'bodyInsertComponent': async (pgClient, jwtToken, documentId, change) => {
    const sanitizedId = change.id.replace("'", '');
    const sanitizedParentId = typeof change.parentId === 'string' ? change.parentId.replace("'", '') : null;
    try {
      await pgClient.query('begin');
      await pgClient.query(JWTToSql(jwtToken));
      await pgClient.query(
        `UPDATE public.document SET draft = jsonb_set(draft, '{body,nodes,"${sanitizedId}"}', $2::jsonb, true) WHERE id = $1::int;`,
        [documentId, JSON.stringify(change.component)],
      );
      if (change.parentId) {
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_insert(draft, '{body,nodes,"${sanitizedParentId}",childIds,${change.position}}'::text[], to_jsonb($2::text)) WHERE id = $1::int;`,
          [documentId, change.id],
        );
      } else {
        await pgClient.query(
          `UPDATE public.document SET draft = jsonb_insert(draft, '{body,root,${change.position}}'::text[], to_jsonb($2::text)) WHERE id = $1::int;`,
          [documentId, change.id],
        );
      }
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

const generateComponentId = (documentId) => {
  const hashids = new Hashids(`DocumentComponent${documentId}` as string, hashIdLength as number, tokenAlphabet);
  // if you insert in the same millisecond for the same document, then theres a 1 in a 10 million chance of a chance for collision
  return `${hashids.encode(Date.now())}-${hashids.encode(getRandomInt(0, 9999999))}`;
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

  const validEventTypes = ['bodyInsertComponent', 'bodyMoveComponent', 'bodyUpdateComponent', 'bodyDeleteComponent', 'metaUpdate'];
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

  if (parsedChange.eventType === 'bodyInsertComponent') {
    parsedChange.id = generateComponentId(documentId);
    args.input.documentChange.change = JSON.stringify(parsedChange);
  }

  const output = await resolve();

  if (eventTypeUpdater[parsedChange.eventType]) {
    await eventTypeUpdater[parsedChange.eventType](context.pgClient, context.jwtToken, documentId, parsedChange);
  }

  return output;
};

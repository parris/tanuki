import { QueryBuilder } from 'knex';
import { GraphQLObjectType, GraphQLResolveInfo, SelectionNode } from 'graphql';
import { snakeCase } from 'snake-case';

import { ResolverFn } from '../generated/graphql';
import postgres from "../utils/postgres";
import { IModel, Relationship } from './utils';
import models, { graphqlTypeToModel } from './extensions/model';

const maxDepth = 3;
const pageSize = 10;

type SQLJoin = {
  table: string;
  as: string;
  asIndex: number;
  from: string;
  to: string;
}

type CollectFieldsInput = {
  model: {
    model: IModel,
    alias: string,
  },
  selectionSet: SelectionNode[],
  currentDepth: number,
  prefix: string,
};

type CollectFieldsOutput = {
  modelMap: Record<string, IModel>,
  fields: string[],
  from: string,
  as: string,
  joins: SQLJoin[]
};

type CollectFieldsRecurseOutput = {
  fields: string[],
  joins: SQLJoin[]
};

type ModelAndSelectionSet = {
  fieldName: string,
  model: {
    model: IModel,
    alias: string,
  },
  relationship: Relationship,
  selectionSet: SelectionNode[],
};

export function collectFieldsAndJoins(
  startingModel: IModel,
  info: GraphQLResolveInfo,
): CollectFieldsOutput {
  let aliasCounter = 0;
  const modelMap: Record<string, IModel> = {};

  function recurse({
    model,
    selectionSet,
    currentDepth = 0,
    prefix = '',
  }: CollectFieldsInput): CollectFieldsRecurseOutput {
    if (currentDepth >= maxDepth) {
      return { fields: [], joins: [] } as CollectFieldsRecurseOutput;
    }

    let initialFields: string[] = selectionSet
      .map((sel) => model.model.dbFields[(sel as any).name.value as string] ? ((sel as any).name.value) as string : null)
      .filter((field) => field) as string[];

    if (!initialFields.includes(model.model.primaryKey)) {
      initialFields.includes(model.model.primaryKey)
    }
    initialFields = initialFields.map((field) => `${model.alias}.${field} as ${prefix}${field}`);

    const modelAndSelects: ModelAndSelectionSet[] = selectionSet
      .map<(ModelAndSelectionSet | null)>((sel): (ModelAndSelectionSet | null) => {
        const fieldName = (sel as any).name.value as string;
        const relationship = (model.model.hasMany?.[fieldName] || model.model.hasOne?.[fieldName]);
        if (relationship) {
          let selections = (sel as any).selectionSet.selections;
          const fieldNames = selections.map((sel) => sel.name.value);
          // skip pagination
          // this kinda sucks, using info would be better
          if (fieldNames.length === 2 && fieldNames.includes('cursor') && fieldNames.includes('nodes')) {
            selections = selections[fieldNames.indexOf('nodes')].selectionSet.selections;
          }
          return {
            fieldName,
            selectionSet: selections,
            model: {
              model: models[relationship.model],
              alias: `t${++aliasCounter}`,
            },
            relationship,
          };
        }
        return null;
      })
      .filter<ModelAndSelectionSet>((rel, _index, _array): rel is ModelAndSelectionSet => Boolean(rel));

    modelAndSelects.forEach((item) => {
      modelMap[item.model.alias] = item.model.model;
    });

    const nestedResults: CollectFieldsOutput[] = modelAndSelects
      .map<CollectFieldsOutput>((rel) => {
        const collected = recurse({
          model: rel.model,
          selectionSet: rel.selectionSet || [],
          currentDepth: currentDepth + 1,
          prefix: `${prefix}${rel.fieldName}.`,
        });
        return {
          fields: collected.fields,
          joins: collected.joins.concat([
            {
              table: rel.model.model.table,
              as: rel.model.alias,
              asIndex: parseInt(rel.model.alias.replace('t', ''), 10),
              from: `${model.alias}.${rel.relationship.localField ?? 'id'}`,
              to: `${rel.model.alias}.${rel.relationship.foreignField}`,
            } as SQLJoin
          ]),
        } as CollectFieldsOutput;
      });

    return {
      fields: initialFields.concat(...nestedResults.map((res) => res.fields)),
      joins: nestedResults.map((res) => res.joins).flat(),
    };
  }

  const selectionSet = info.fieldNodes[0].selectionSet?.selections ?? [];
  const fieldsAndJoins = recurse({
    model: { model: startingModel, alias: `t${aliasCounter}` },
    selectionSet,
  } as CollectFieldsInput);

  return {
    modelMap,
    from: startingModel.table,
    as: 't0',
    ...fieldsAndJoins,
  }
}

function buildResultObject(result: object[], info: GraphQLResolveInfo) {
  const root = {};
  const otherObjects = {};

  function parentGQLToModel(col: string, parent): IModel {
    let remainingPieces = col.split('.');
    let currentParent = parent;
    while(remainingPieces.length > 1) {
      let type = currentParent._fields[remainingPieces[0]].type;
      // use the pagination model type
      if (type.name.includes('Pagination')) {
        type = type._fields.nodes.type;
      }
      currentParent = type.ofType || type;
      remainingPieces = remainingPieces.slice(1);
    }
    return graphqlTypeToModel[currentParent.name];
  }

  const columnsToProcess: string[] = [];

  // get all objects
  result.forEach((row) => {
    Object.keys(row).forEach((col) => {
      const pieces = col.split('.');
      if (pieces.length === 1) {
        root[col] = row[col];
      } else {
        const type = pieces[pieces.length - 2];
        if (!otherObjects[type]) { otherObjects[type] = {}; }
        const model = parentGQLToModel(col, (info.returnType as any));

        const rootObjectPieces = col.split('.');
        const rootObjectString = rootObjectPieces.slice(0, rootObjectPieces.length - 1).join('.');
        const primaryKeyValue = row[`${rootObjectString}.${model.primaryKey}`];

        if (!otherObjects[type][primaryKeyValue]) {
          otherObjects[type][primaryKeyValue] = {};
          const colPieces = col.split('.');
          const rootPieces = colPieces.slice(0, colPieces.length - 1).join('.');
          columnsToProcess.push(`${rootPieces}.${model.primaryKey}`);
        }
        otherObjects[type][primaryKeyValue][pieces[pieces.length - 1]] = row[col]
      }
    });
  });

  result.forEach((row) => {
    Object.keys(row)
      .filter((col) => columnsToProcess.includes(col))
      .sort((a, b) => {
        const aLen = a.split('.').length;
        const bLen = b.split('.').length;
        if (aLen < bLen) { return -1; }
        if (aLen > bLen) { return 1; }
        return 0;
      })
      .forEach((col) => {
        let currentParent = root;
        let remainingPieces = col.split('.');
        let currentColumn = remainingPieces[0];
        let previousColumns: string[] = [];
        // let previousParentType = (info.returnType as any);
        let currentParentType = (info.returnType as any)._fields[currentColumn].type;
        remainingPieces = remainingPieces;

        while(remainingPieces.length > 0) {
          if (currentParentType.name && currentParentType.name.includes('Pagination')) {
            if (!currentParent[currentColumn]) {
              currentParent[currentColumn] = {
                cursor: null,
                nodes: [],
              };
            }

            currentParentType = currentParentType._fields.nodes.type.ofType;

            // if just the primary key is left let's assign
            if (remainingPieces.length === 2) {
              const obj = otherObjects[currentColumn][row[col]];
              currentParent[currentColumn].nodes.push(obj)
              currentParent = obj;
            } else {
              // if this is nested we need to select the right relationship
              // we do have the data we need in this row actually....
              const lastModelPK = graphqlTypeToModel[currentParentType.name].primaryKey;
              const lastModelPKValue = row[previousColumns.concat([currentColumn, lastModelPK]).join('.')];
              const nestedParent = otherObjects[currentColumn][lastModelPKValue];
              currentParent = nestedParent;
            }
          } else if (currentParentType instanceof GraphQLObjectType) {
            if (!currentParent[currentColumn]) {
              currentParent[currentColumn] = otherObjects[currentColumn][row[col]];
            }
            currentParent = currentParent[currentColumn];
          }

          remainingPieces = remainingPieces.slice(1);
          currentColumn = remainingPieces[0];
          previousColumns.push(currentColumn);
          // previousParentType = currentParentType;
          currentParentType = currentColumn ? currentParentType._fields[currentColumn].type : null;
        }
      });
  });

  return root;
}

export async function buildGetOneQuery(model: IModel, byInputArg: string, args: any, info: GraphQLResolveInfo) {
  const queryInfo = collectFieldsAndJoins(model, info)

  let queryBuilder = postgres
    .select(queryInfo.fields)
    .from({ [queryInfo.as]: model.table });

  queryBuilder = queryInfo.joins.sort((a, b) => {
    if (a.asIndex < b.asIndex) { return -1; }
    if (a.asIndex === b.asIndex) { return 0; }
    return 1;
  }).reduce<QueryBuilder>((qb, join) => {
    return qb.leftJoin(
      postgres(join.table).as(join.as).limit(pageSize),
      function() { this.on(join.from, '=', join.to); },
    );
  }, queryBuilder);

  queryBuilder = queryBuilder.where({ [`${queryInfo.as}.${snakeCase(byInputArg)}`]: args[byInputArg] });

  let pgResult = (await queryBuilder) ?? null;
  const query = queryBuilder.toString();
  let resultTree: Object | null = null;

  if (pgResult) {
    resultTree = buildResultObject(pgResult, info);
  }

  return { data: resultTree, query, queryInfo };
};

export function getOne<T>(model: IModel, byInputArg: string): ResolverFn<T, any, any, any> {
  return async (_root, args, _context, info: GraphQLResolveInfo): Promise<T> => {
    if (!args[byInputArg]) {
      throw new Error(`${byInputArg} missing`);
    }

    const result = await buildGetOneQuery(
      model,
      byInputArg,
      args,
      info,
    );

    return result.data as T;
  };
}

// export function insert<T>(tableName: string, byInputArg: string): ((_root: any, args: any, _context: any) => Promise<T>) {
//   return async (_root, args, _context): Promise<T> => {
//     if (!args[byInputArg]) {
//       throw new Error(`${byInputArg} missing`);
//     }
//     const id: string = (await postgres.insert({}).into(tableName))[0]
//     return postgres(tableName).where({ id: args[byInputArg] }).first() ?? {};
//   };
// }

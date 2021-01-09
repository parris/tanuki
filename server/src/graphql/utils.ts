import * as camelcase from 'camelcase';
import * as pluralize from 'pluralize';

export function dbFields(fields: string[]): Record<string, string> {
  return fields.reduce((memo, fieldName) => {
    memo[camelcase(fieldName)] = fieldName;
    return memo;
  }, {});
}

export function hasMany(fields: string[]): Record<string, string> {
  return fields.reduce((memo, fieldName) => {
    memo[pluralize(fieldName, 1)] = fieldName;
    return memo;
  }, {});
}

export type Relationship = {
  model: string,
  foreignField: string,
  localField?: string,
}

export interface IModel {
  table: string;
  primaryKey: string;
  dbFields: Record<string, string>;

  hasMany?: {
    [graphqlQueryName: string]: Relationship,
  },

  hasOne?: {
    [graphqlQueryName: string]: Relationship,
  },
}

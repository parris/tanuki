import { GraphQLFieldResolver, GraphQLResolveInfo, GraphQLObjectType, GraphQLFieldConfig } from "graphql";
import { Build, Context } from "postgraphile";
import { GraphQLSchemaValidationOptions } from "graphql/type/schema";

export type JWTToken = {
  user_id: number,
  role: string,
  iat: number,
  exp: number,
  aud: string,
  iss: string,
};

export enum UserRole {
  tanuki_anonymous = 'tanuki_anonymous',
  tanuki_contributor = 'tanuki_contributor',
  tanuki_admin = 'tanuki_admin',
};

// Workaround for a bug in postgraphile - remove in the future
export declare type ResolverWrapperFn<TSource = any, TContext = any, TArgs = {
  [argName: string]: any;
}> = (resolve: GraphQLFieldResolver<TSource, TContext, TArgs>, source: TSource, args: TArgs, context: TContext, resolveInfo: GraphQLResolveInfo) => any;
export interface ResolverWrapperRequirements {
  childColumns?: Array<{
      column: string;
      alias: string;
  }>;
  siblingColumns?: Array<{
      column: string;
      alias: string;
  }>;
}
export interface ResolverWrapperRule {
  requires?: ResolverWrapperRequirements;
  resolve?: ResolverWrapperFn;
}
export interface ResolverWrapperRules {
  [typeName: string]: {
      [fieldName: string]: ResolverWrapperRule | ResolverWrapperFn;
  };
}
export declare type ResolverWrapperRulesGenerator = (options: GraphQLSchemaValidationOptions) => ResolverWrapperRules;
export declare type ResolverWrapperFilter<T> = (context: Context<GraphQLObjectType>, build: Build, field: GraphQLFieldConfig<any, any>, options: GraphQLSchemaValidationOptions) => T | null;
export declare type ResolverWrapperFilterRule<T> = (match: T) => ResolverWrapperRule | ResolverWrapperFn;

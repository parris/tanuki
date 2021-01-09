/* tslint:disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSON: any;
};

export enum TanukiDocumentChangeType {
  AddComponent = 'ADD_COMPONENT',
  MoveComponent = 'MOVE_COMPONENT',
  EditComponent = 'EDIT_COMPONENT',
  RemoveComponent = 'REMOVE_COMPONENT'
}

export type TanukiDocumentChange = {
  __typename?: 'TanukiDocumentChange';
  userId: Scalars['ID'];
  changeType: TanukiDocumentChangeType;
  changeParams: Scalars['JSON'];
  reverseChangeType: TanukiDocumentChangeType;
  reverseChangeParams: Scalars['JSON'];
};

export type TanukiDocumentChangeInput = {
  changeType: TanukiDocumentChangeType;
  changeParams: Scalars['JSON'];
  reverseChangeType: TanukiDocumentChangeType;
  reverseChangeParams: Scalars['JSON'];
};

export type TanukiDocumentPublishHistory = {
  __typename?: 'TanukiDocumentPublishHistory';
  nodes: Array<Maybe<Scalars['JSON']>>;
  nextCursor?: Maybe<Scalars['ID']>;
};

export type TanukiScreenUnpublishMetaChanges = {
  __typename?: 'TanukiScreenUnpublishMetaChanges';
  name?: Maybe<Scalars['String']>;
};

export type TanukiScreen = {
  __typename?: 'TanukiScreen';
  id: Scalars['ID'];
  ownerId: Scalars['ID'];
  name: Scalars['String'];
  archived: Scalars['Boolean'];
  changesSinceLastPublish: Array<TanukiDocumentChange>;
  latestDocument: Scalars['JSON'];
  documentPublishHistory: TanukiDocumentPublishHistory;
  unpublishedMetaChanges: TanukiScreenUnpublishMetaChanges;
};


export type TanukiScreenDocumentPublishHistoryArgs = {
  cursor?: Maybe<Scalars['ID']>;
};

export type TanukiScreenFilter = {
  cursor?: Maybe<Scalars['ID']>;
  archived?: Maybe<Scalars['Boolean']>;
};

export type TanukiScreenPatchInput = {
  name?: Maybe<Scalars['String']>;
  archived?: Maybe<Scalars['Boolean']>;
};

export type TanukiScreensPayload = {
  __typename?: 'TanukiScreensPayload';
  nodes: Array<Maybe<TanukiScreen>>;
  nextCursor?: Maybe<Scalars['ID']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  _root?: Maybe<Scalars['Boolean']>;
  tanukiDocumentUpdate: TanukiDocumentChange;
};


export type SubscriptionTanukiDocumentUpdateArgs = {
  screenId: Scalars['ID'];
};

export type Mutation = {
  __typename?: 'Mutation';
  tanukiCreateOrUpdateUser?: Maybe<TanukiUser>;
  tanukiCreateScreen?: Maybe<TanukiScreen>;
  tanukiEditScreenMeta?: Maybe<TanukiScreen>;
  tanukiScreenPublish?: Maybe<TanukiScreen>;
  tanukiUpdateDocument?: Maybe<TanukiScreen>;
};


export type MutationTanukiCreateOrUpdateUserArgs = {
  user?: Maybe<TanukiUserInput>;
};


export type MutationTanukiEditScreenMetaArgs = {
  id: Scalars['ID'];
  screenMeta?: Maybe<TanukiScreenPatchInput>;
};


export type MutationTanukiScreenPublishArgs = {
  id: Scalars['ID'];
};


export type MutationTanukiUpdateDocumentArgs = {
  screenId: Scalars['ID'];
  diffs: Array<TanukiDocumentChangeInput>;
};

export type Query = {
  __typename?: 'Query';
  screenById?: Maybe<TanukiScreen>;
  screens: TanukiScreensPayload;
  tanukiUserById?: Maybe<TanukiUser>;
};


export type QueryScreenByIdArgs = {
  id: Scalars['ID'];
};


export type QueryScreensArgs = {
  filter?: Maybe<TanukiScreenFilter>;
};


export type QueryTanukiUserByIdArgs = {
  id: Scalars['ID'];
};

export type FakeScreen = {
  __typename?: 'FakeScreen';
  id: Scalars['ID'];
  name: Scalars['String'];
  ownerByOwnerId?: Maybe<TanukiUser>;
};

export type FakeScreenPagination = {
  __typename?: 'FakeScreenPagination';
  cursor?: Maybe<Scalars['ID']>;
  nodes?: Maybe<Array<Maybe<FakeScreen>>>;
};

export type TanukiUser = {
  __typename?: 'TanukiUser';
  id: Scalars['ID'];
  name: Scalars['String'];
  test?: Maybe<Scalars['String']>;
  screens?: Maybe<FakeScreenPagination>;
};

export type TanukiUserInput = {
  id: Scalars['ID'];
  name: Scalars['String'];
};


export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  TanukiDocumentChangeType: TanukiDocumentChangeType;
  TanukiDocumentChange: ResolverTypeWrapper<TanukiDocumentChange>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  TanukiDocumentChangeInput: TanukiDocumentChangeInput;
  TanukiDocumentPublishHistory: ResolverTypeWrapper<TanukiDocumentPublishHistory>;
  TanukiScreenUnpublishMetaChanges: ResolverTypeWrapper<TanukiScreenUnpublishMetaChanges>;
  String: ResolverTypeWrapper<Scalars['String']>;
  TanukiScreen: ResolverTypeWrapper<TanukiScreen>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  TanukiScreenFilter: TanukiScreenFilter;
  TanukiScreenPatchInput: TanukiScreenPatchInput;
  TanukiScreensPayload: ResolverTypeWrapper<TanukiScreensPayload>;
  Subscription: ResolverTypeWrapper<{}>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  FakeScreen: ResolverTypeWrapper<FakeScreen>;
  FakeScreenPagination: ResolverTypeWrapper<FakeScreenPagination>;
  TanukiUser: ResolverTypeWrapper<TanukiUser>;
  TanukiUserInput: TanukiUserInput;
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  TanukiDocumentChange: TanukiDocumentChange;
  ID: Scalars['ID'];
  TanukiDocumentChangeInput: TanukiDocumentChangeInput;
  TanukiDocumentPublishHistory: TanukiDocumentPublishHistory;
  TanukiScreenUnpublishMetaChanges: TanukiScreenUnpublishMetaChanges;
  String: Scalars['String'];
  TanukiScreen: TanukiScreen;
  Boolean: Scalars['Boolean'];
  TanukiScreenFilter: TanukiScreenFilter;
  TanukiScreenPatchInput: TanukiScreenPatchInput;
  TanukiScreensPayload: TanukiScreensPayload;
  Subscription: {};
  Mutation: {};
  Query: {};
  FakeScreen: FakeScreen;
  FakeScreenPagination: FakeScreenPagination;
  TanukiUser: TanukiUser;
  TanukiUserInput: TanukiUserInput;
  JSON: Scalars['JSON'];
}>;

export type TanukiDocumentChangeResolvers<ContextType = any, ParentType extends ResolversParentTypes['TanukiDocumentChange'] = ResolversParentTypes['TanukiDocumentChange']> = ResolversObject<{
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  changeType?: Resolver<ResolversTypes['TanukiDocumentChangeType'], ParentType, ContextType>;
  changeParams?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  reverseChangeType?: Resolver<ResolversTypes['TanukiDocumentChangeType'], ParentType, ContextType>;
  reverseChangeParams?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TanukiDocumentPublishHistoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['TanukiDocumentPublishHistory'] = ResolversParentTypes['TanukiDocumentPublishHistory']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<ResolversTypes['JSON']>>, ParentType, ContextType>;
  nextCursor?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TanukiScreenUnpublishMetaChangesResolvers<ContextType = any, ParentType extends ResolversParentTypes['TanukiScreenUnpublishMetaChanges'] = ResolversParentTypes['TanukiScreenUnpublishMetaChanges']> = ResolversObject<{
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TanukiScreenResolvers<ContextType = any, ParentType extends ResolversParentTypes['TanukiScreen'] = ResolversParentTypes['TanukiScreen']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  ownerId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  archived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  changesSinceLastPublish?: Resolver<Array<ResolversTypes['TanukiDocumentChange']>, ParentType, ContextType>;
  latestDocument?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  documentPublishHistory?: Resolver<ResolversTypes['TanukiDocumentPublishHistory'], ParentType, ContextType, RequireFields<TanukiScreenDocumentPublishHistoryArgs, never>>;
  unpublishedMetaChanges?: Resolver<ResolversTypes['TanukiScreenUnpublishMetaChanges'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TanukiScreensPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['TanukiScreensPayload'] = ResolversParentTypes['TanukiScreensPayload']> = ResolversObject<{
  nodes?: Resolver<Array<Maybe<ResolversTypes['TanukiScreen']>>, ParentType, ContextType>;
  nextCursor?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  _root?: SubscriptionResolver<Maybe<ResolversTypes['Boolean']>, "_root", ParentType, ContextType>;
  tanukiDocumentUpdate?: SubscriptionResolver<ResolversTypes['TanukiDocumentChange'], "tanukiDocumentUpdate", ParentType, ContextType, RequireFields<SubscriptionTanukiDocumentUpdateArgs, 'screenId'>>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  tanukiCreateOrUpdateUser?: Resolver<Maybe<ResolversTypes['TanukiUser']>, ParentType, ContextType, RequireFields<MutationTanukiCreateOrUpdateUserArgs, never>>;
  tanukiCreateScreen?: Resolver<Maybe<ResolversTypes['TanukiScreen']>, ParentType, ContextType>;
  tanukiEditScreenMeta?: Resolver<Maybe<ResolversTypes['TanukiScreen']>, ParentType, ContextType, RequireFields<MutationTanukiEditScreenMetaArgs, 'id'>>;
  tanukiScreenPublish?: Resolver<Maybe<ResolversTypes['TanukiScreen']>, ParentType, ContextType, RequireFields<MutationTanukiScreenPublishArgs, 'id'>>;
  tanukiUpdateDocument?: Resolver<Maybe<ResolversTypes['TanukiScreen']>, ParentType, ContextType, RequireFields<MutationTanukiUpdateDocumentArgs, 'screenId' | 'diffs'>>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  screenById?: Resolver<Maybe<ResolversTypes['TanukiScreen']>, ParentType, ContextType, RequireFields<QueryScreenByIdArgs, 'id'>>;
  screens?: Resolver<ResolversTypes['TanukiScreensPayload'], ParentType, ContextType, RequireFields<QueryScreensArgs, never>>;
  tanukiUserById?: Resolver<Maybe<ResolversTypes['TanukiUser']>, ParentType, ContextType, RequireFields<QueryTanukiUserByIdArgs, 'id'>>;
}>;

export type FakeScreenResolvers<ContextType = any, ParentType extends ResolversParentTypes['FakeScreen'] = ResolversParentTypes['FakeScreen']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ownerByOwnerId?: Resolver<Maybe<ResolversTypes['TanukiUser']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FakeScreenPaginationResolvers<ContextType = any, ParentType extends ResolversParentTypes['FakeScreenPagination'] = ResolversParentTypes['FakeScreenPagination']> = ResolversObject<{
  cursor?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  nodes?: Resolver<Maybe<Array<Maybe<ResolversTypes['FakeScreen']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TanukiUserResolvers<ContextType = any, ParentType extends ResolversParentTypes['TanukiUser'] = ResolversParentTypes['TanukiUser']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  test?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  screens?: Resolver<Maybe<ResolversTypes['FakeScreenPagination']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type Resolvers<ContextType = any> = ResolversObject<{
  TanukiDocumentChange?: TanukiDocumentChangeResolvers<ContextType>;
  TanukiDocumentPublishHistory?: TanukiDocumentPublishHistoryResolvers<ContextType>;
  TanukiScreenUnpublishMetaChanges?: TanukiScreenUnpublishMetaChangesResolvers<ContextType>;
  TanukiScreen?: TanukiScreenResolvers<ContextType>;
  TanukiScreensPayload?: TanukiScreensPayloadResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  FakeScreen?: FakeScreenResolvers<ContextType>;
  FakeScreenPagination?: FakeScreenPaginationResolvers<ContextType>;
  TanukiUser?: TanukiUserResolvers<ContextType>;
  JSON?: GraphQLScalarType;
}>;


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;

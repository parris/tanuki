import { dbFields, IModel } from '../utils';
import screen from './Screen/model';
import user from './User/model';

const paginationModel = {
  table: '',
  primaryKey: '',
  dbFields: dbFields([]),
} as IModel;

export const graphqlTypeToModel: Record<string, IModel> = {
  FakeScreen: screen,
  FakeScreenPagination: paginationModel,
  TanukiUser: user,
};

export default {
  screen,
  user,
};

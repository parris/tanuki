import { IModel, dbFields } from '../../utils';

export default {
  table: 'user',
  primaryKey: 'id',
  dbFields: dbFields([
    'id',
    'name',
  ]),
  hasMany: {
    screens: {
      model: 'screen',
      foreignField: 'owner_id',
    },
  },
} as IModel;

import { IModel, dbFields } from "../../utils";

export default {
  table: 'screen',
  primaryKey: 'id',
  dbFields: dbFields([
    'id',
    'owner_id',
    'name',
    'archived',
    'changes_since_last_publish',
    'latest_document',
    'document_publish_history',
    'unpublished_meta_changes',
  ]),
  hasOne: {
    ownerByOwnerId: {
      localField: 'owner_id',
      model: 'user',
      foreignField: 'id',
    },
  },
} as IModel;

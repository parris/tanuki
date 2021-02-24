import * as Knex from 'knex';

export const up = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.createTable('document_change', (table) => {
      table.bigIncrements('id');
      table.bigInteger('document_id')
        .unsigned().notNullable()
        .references('id').inTable('document')
        .onDelete('cascade');
      table.bigInteger('creator_id')
        .unsigned().notNullable()
        .references('id').inTable('user')
        .onDelete('cascade');
      table.jsonb('change').notNullable().defaultTo('{}');
      table.timestamps(true, true);
    }),
    db.schema.raw(`comment on table public.document_change is E'@omit delete,all';`),
    db.schema.raw('ALTER TABLE public.document_change ENABLE ROW LEVEL SECURITY;'),
    db.schema.raw('GRANT SELECT ON TABLE public.document_change TO tanuki_contributor, tanuki_admin;'),
    db.schema.raw('GRANT UPDATE, INSERT, DELETE ON TABLE public.document_change TO tanuki_contributor, tanuki_admin;'),
    db.schema.raw('GRANT USAGE ON SEQUENCE public.document_change_id_seq TO tanuki_contributor, tanuki_admin'),

    db.schema.raw('CREATE POLICY select_documents_all ON public.document_change FOR SELECT TO tanuki_contributor, tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY insert_documents_contributor ON public.document_change FOR INSERT TO tanuki_contributor WITH CHECK (true);'),
    db.schema.raw("CREATE POLICY update_documents_contributor ON public.document_change FOR UPDATE TO tanuki_contributor USING (true);"),
    db.schema.raw("CREATE POLICY delete_documents_contributor ON public.document_change FOR UPDATE TO tanuki_contributor USING (true);"),

    db.schema.raw('CREATE POLICY select_documents_admin ON public.document_change FOR SELECT TO tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY update_documents_admin ON public.document_change FOR UPDATE TO tanuki_admin USING (true) WITH CHECK (true);'),
    db.schema.raw('CREATE POLICY delete_documents_admin ON public.document_change FOR DELETE TO tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY insert_documents_admin ON public.document_change FOR INSERT TO tanuki_admin WITH CHECK (true);'),
    db.schema.raw(`
      CREATE TRIGGER document_change_update
        AFTER UPDATE ON public.document_change
        FOR EACH ROW
        EXECUTE PROCEDURE public.graphql_subscription(
          'documentChangeUpdate',
          'graphql:documentChangeUpdated:$1',
          'document_id'
        );
    `),
    db.schema.raw(`
      CREATE TRIGGER document_change_update_time_trigger BEFORE UPDATE
        ON public.document_change FOR EACH ROW EXECUTE PROCEDURE
        update_updated_at_timestamp();
    `),
  ])
);

export const down = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.raw('DROP TRIGGER document_change_update ON "document_change"'),
    db.schema.raw('DROP TRIGGER document_change_update_time_trigger ON "document_change"'),
    db.schema.dropTableIfExists('document_change'),
  ])
);

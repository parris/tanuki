import * as Knex from 'knex';

export const up = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.createTable('document', (table) => {
      table.bigIncrements('id');
      table.bigInteger('creator_id')
        .unsigned().references('id').inTable('user')
        .onDelete('cascade');
      table.string('name').index();
      table.boolean('archived').defaultTo(false).index();
      table.jsonb('published').defaultTo('{}').index();
      table.specificType('unpublished_changes', 'jsonb[]');
      table.jsonb('draft').defaultTo('{}');
      table.specificType('published_revisions', 'jsonb[]');
      table.timestamps(true, true);
      table.timestamp('published_at').nullable().defaultTo(null);
    }),
    db.schema.raw(`comment on table public.document is E'@omit delete,all';`),
    db.schema.raw('ALTER TABLE public.document ENABLE ROW LEVEL SECURITY;'),
    db.schema.raw('GRANT SELECT ON TABLE public.document TO tanuki_anonymous, tanuki_contributor, tanuki_admin;'),
    db.schema.raw('GRANT UPDATE, INSERT, DELETE ON TABLE public.document TO tanuki_contributor, tanuki_admin;'),
    db.schema.raw('GRANT USAGE ON SEQUENCE public.document_id_seq TO tanuki_contributor, tanuki_admin'),

    db.schema.raw('CREATE POLICY select_documents_all ON public.document FOR SELECT TO tanuki_anonymous, tanuki_contributor, tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY insert_documents_contributor ON public.document FOR INSERT TO tanuki_contributor WITH CHECK (true);'),
    db.schema.raw("CREATE POLICY update_documents_contributor ON public.document FOR UPDATE TO tanuki_contributor USING (document.creator_id = current_setting('jwt.claims.user_id')::integer) WITH CHECK (document.creator_id = current_setting('jwt.claims.user_id')::integer);"),
    db.schema.raw("CREATE POLICY delete_documents_contributor ON public.document FOR UPDATE TO tanuki_contributor USING (document.creator_id = current_setting('jwt.claims.user_id')::integer);"),

    db.schema.raw('CREATE POLICY select_documents_admin ON public.document FOR SELECT TO tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY update_documents_admin ON public.document FOR UPDATE TO tanuki_admin USING (true) WITH CHECK (true);'),
    db.schema.raw('CREATE POLICY delete_documents_admin ON public.document FOR DELETE TO tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY insert_documents_admin ON public.document FOR INSERT TO tanuki_admin WITH CHECK (true);'),
  ])
);

export const down = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.dropTableIfExists('document'),
  ])
);

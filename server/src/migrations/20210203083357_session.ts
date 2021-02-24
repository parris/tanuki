export const up = (db: any) : Promise<any[]> => (
  Promise.all([
    db.schema.createTable('public.session', (table) => {
      table.bigIncrements();
      table.bigInteger('user_id')
        .unsigned().references('id').inTable('user')
        .onDelete('cascade');
      table.specificType('role', 'user_role').notNull().defaultTo('tanuki_contributor');
      table.timestamp('created_at');
      table.timestamp('last_used_at');
    }),
    db.schema.raw(`comment on table public.session is E'@omit create,read,update,delete,filter,order,all,many,execute';`),
    db.schema.raw('ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;'),
    db.schema.raw('GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE public.session TO tanuki_admin;'),
    db.schema.raw('GRANT USAGE ON SEQUENCE public.session_id_seq TO tanuki_admin'),

    db.schema.raw('CREATE POLICY select_sessions_admin ON public.session FOR SELECT TO tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY update_sessions_admin ON public.session FOR UPDATE TO tanuki_admin USING (true) WITH CHECK (true);'),
    db.schema.raw('CREATE POLICY delete_sessions_admin ON public.session FOR DELETE TO tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY insert_sessions_admin ON public.session FOR INSERT TO tanuki_admin WITH CHECK (true);'),
  ])
);

export const down = (db: any) : Promise<any[]> => (
  Promise.all([
    db.schema.raw('DROP POLICY IF EXISTS select_sessions_admin ON "session";'),
    db.schema.raw('DROP POLICY IF EXISTS update_sessions_admin ON "session";'),
    db.schema.raw('DROP POLICY IF EXISTS delete_sessions_admin ON "session";'),
    db.schema.raw('DROP POLICY IF EXISTS insert_sessions_admin ON "session";'),
    db.schema.dropTable('session'),
  ])
);

export const up = (db: any) : Promise<any[]> => (
  Promise.all([
    db.schema.raw('ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM public;'),
    db.schema.raw("CREATE TYPE public.user_role AS ENUM ('tanuki_anonymous', 'tanuki_contributor', 'tanuki_admin')"),
    db.schema.raw('CREATE ROLE tanuki_anonymous;'),
    db.schema.raw('CREATE ROLE tanuki_contributor;'),
    db.schema.raw('CREATE ROLE tanuki_admin;'),
    db.schema.raw('GRANT USAGE ON SCHEMA public to tanuki_anonymous, tanuki_contributor, tanuki_admin;'),
    db.schema.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";'),
    db.schema.createTable('public.user', (table) => {
      table.bigIncrements();
      table.string('email').notNull().defaultTo('').unique();
      table.string('password_hash').notNull().defaultTo('');
      table.string('password_salt').notNull().defaultTo('');
      table.string('password_reset_token').nullable().defaultTo('');
      table.specificType('role', 'user_role').notNull().defaultTo('tanuki_contributor');
      table.boolean('verified').notNull().defaultTo(false);
      table.string('verify_token').nullable().defaultTo('');
      table.string('avatar_image', 1024).defaultTo('');
      table.jsonb('avatar_crop').defaultTo('{}');
      table.timestamps(true, true);
    }),

    db.schema.raw(`comment on table public.user is E'@omit create,all';`),
    db.schema.raw(`
      CREATE TYPE public.jwt_token AS (
        role text,
        user_id integer,
        exp INTEGER
      );
    `),
  ]).then(() => Promise.all([
    db.schema.raw('GRANT SELECT ON TABLE public.user TO tanuki_anonymous, tanuki_contributor, tanuki_admin;'),
    db.schema.raw('GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE public.user TO tanuki_admin;'),
    db.schema.raw('GRANT USAGE ON SEQUENCE public.user_id_seq TO tanuki_anonymous, tanuki_contributor, tanuki_admin'),

    db.schema.raw('grant tanuki_anonymous to CURRENT_USER;'),
    db.schema.raw('grant tanuki_contributor to CURRENT_USER;'),
    db.schema.raw('grant tanuki_admin to CURRENT_USER;'),

    db.schema.raw('ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;'),
    db.schema.raw('CREATE POLICY select_user ON public.user FOR SELECT TO tanuki_anonymous, tanuki_contributor, tanuki_admin USING (true);'),
    db.schema.raw('CREATE POLICY insert_user ON public.user FOR INSERT WITH CHECK (true);'),
    db.schema.raw("CREATE POLICY update_user ON public.user FOR UPDATE USING (id = current_setting('jwt.claims.user_id')::integer) WITH CHECK (id = current_setting('jwt.claims.user_id')::integer);"),
    db.schema.raw("CREATE POLICY update_user_admin ON public.user FOR UPDATE USING (true) WITH CHECK (true);"),
    db.schema.raw('CREATE POLICY delete_user ON public.user FOR DELETE TO tanuki_admin USING (true);'),

    db('user').insert([{
      id: 0,
      email: `tanuki-bot@${process.env.HOST_DOMAIN}`,
      password_hash: '',
      password_salt: 'abcd123xyzwaq',
      role: 'tanuki_admin',
      verified: true,
    }]),
  ]))
);

export const down = (db: any) : Promise<any[]> => (
  Promise.all([
    db.schema.dropTableIfExists('public.user'),
    db.schema.raw('DROP TYPE IF EXISTS public.jwt_token'),
    db.schema.raw('DROP TYPE IF EXISTS public.user_role'),
  ]).then(() => Promise.all([
    db.schema.raw('REVOKE ALL PRIVILEGES ON SCHEMA public FROM tanuki_anonymous;'),
    db.schema.raw('REVOKE ALL PRIVILEGES ON SCHEMA public FROM tanuki_contributor;'),
    db.schema.raw('REVOKE ALL PRIVILEGES ON SCHEMA public FROM tanuki_admin;'),
  ])).then(() => Promise.all([
    db.schema.raw('DROP ROLE tanuki_anonymous;'),
    db.schema.raw('DROP ROLE tanuki_contributor;'),
    db.schema.raw('DROP ROLE tanuki_admin;'),
  ]))
);

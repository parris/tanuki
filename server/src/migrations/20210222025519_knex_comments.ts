export const up = (db: any) : Promise<any[]> => (
  Promise.all([
    db.schema.raw(`comment on table public.knex_migrations is E'@omit create,read,update,delete,filter,order,all,many,execute';`),
    db.schema.raw(`comment on table public.knex_migrations_lock is E'@omit create,read,update,delete,filter,order,all,many,execute';`),
  ])
);

export const down = (db: any) : Promise<any[]> => (
  Promise.all([
    db.schema.raw(`comment on table public.knex_migrations is E'';`),
    db.schema.raw(`comment on table public.knex_migrations_lock is E'';`),
  ])
);

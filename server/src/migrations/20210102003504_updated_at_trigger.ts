import * as Knex from 'knex';

export const up = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
    `),
    db.schema.raw(`
      CREATE TRIGGER user_update_time_trigger BEFORE UPDATE
        ON public.user FOR EACH ROW EXECUTE PROCEDURE
        update_updated_at_timestamp();
    `),
    db.schema.raw(`
      CREATE TRIGGER screen_update_time_trigger BEFORE UPDATE
        ON public.screen FOR EACH ROW EXECUTE PROCEDURE
        update_updated_at_timestamp();
    `),
  ])
);

export const down = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.raw('DROP TRIGGER screen_update_time_trigger ON public."screen";'),
    db.schema.raw('DROP TRIGGER user_update_time_trigger ON public."user";'),
    db.schema.raw('DROP FUNCTION update_updated_at_timestamp'),
  ])
);

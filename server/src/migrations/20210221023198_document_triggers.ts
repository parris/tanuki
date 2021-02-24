import * as Knex from 'knex';

export const up = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.raw(`
      create function public.graphql_subscription() returns trigger as $$
      declare
        v_process_new bool = (TG_OP = 'INSERT' OR TG_OP = 'UPDATE');
        v_process_old bool = (TG_OP = 'UPDATE' OR TG_OP = 'DELETE');
        v_event text = TG_ARGV[0];
        v_topic_template text = TG_ARGV[1];
        v_attribute text = TG_ARGV[2];
        v_record record;
        v_sub text;
        v_topic text;
        v_i int = 0;
        v_last_topic text;
      begin
        -- On UPDATE sometimes topic may be changed for NEW record,
        -- so we need notify to both topics NEW and OLD.
        for v_i in 0..1 loop
          if (v_i = 0) and v_process_new is true then
            v_record = new;
          elsif (v_i = 1) and v_process_old is true then
            v_record = old;
          else
            continue;
          end if;
          if v_attribute is not null then
            execute 'select $1.' || quote_ident(v_attribute)
              using v_record
              into v_sub;
          end if;
          if v_sub is not null then
            v_topic = replace(v_topic_template, '$1', v_sub);
          else
            v_topic = v_topic_template;
          end if;
          if v_topic is distinct from v_last_topic then
            -- This if statement prevents us from triggering the same notification twice
            v_last_topic = v_topic;
            perform pg_notify(v_topic, json_build_object(
              'event', v_event,
              'subject', v_sub
            )::text);
          end if;
        end loop;
        return v_record;
      end;
      $$ language plpgsql volatile set search_path from current;
    `),
    db.schema.raw(`
      CREATE TRIGGER document_update
        AFTER UPDATE ON public.document
        FOR EACH ROW
        EXECUTE PROCEDURE public.graphql_subscription(
          'documentUpdate',
          'graphql:documentUpdate:$1',
          'id'
        );
    `),
  ])
);

export const down = (db: Knex) : Promise<any[]> => (
  Promise.all([
    db.schema.raw('DROP TRIGGER document_update ON "document"'),
    db.schema.raw('DROP FUNCTION IF EXISTS public.graphql_subscription()'),
  ])
);

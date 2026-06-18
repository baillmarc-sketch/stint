-- Stint — enable Supabase Realtime on messages so threads update live.
-- Idempotent: only adds the table if the realtime publication exists and the
-- table isn't already a member.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     )
  then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

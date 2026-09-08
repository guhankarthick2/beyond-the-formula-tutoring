-- Live admin badge when question reports are filed / resolved / deleted
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'question_reports'
  ) then
    alter publication supabase_realtime add table public.question_reports;
  end if;
end $$;

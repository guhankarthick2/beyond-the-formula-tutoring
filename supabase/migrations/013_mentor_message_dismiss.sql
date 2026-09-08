-- Students can dismiss mentor messages (hide from their inbox).
-- Admins can hard-delete for moderation. No edit after send.

alter table public.mentor_messages
  add column if not exists dismissed_at timestamptz;

create or replace function public.dismiss_mentor_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.mentor_messages
  set dismissed_at = now()
  where id = p_message_id
    and student_id = auth.uid()
    and dismissed_at is null;

  if not found then
    raise exception 'Message not found';
  end if;
end;
$$;

grant execute on function public.dismiss_mentor_message(uuid) to authenticated;

drop policy if exists "messages_admin_delete" on public.mentor_messages;
create policy "messages_admin_delete"
  on public.mentor_messages for delete to authenticated
  using (public.is_admin());

-- Live badge updates when mentors send / students dismiss
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mentor_messages'
  ) then
    alter publication supabase_realtime add table public.mentor_messages;
  end if;
end $$;

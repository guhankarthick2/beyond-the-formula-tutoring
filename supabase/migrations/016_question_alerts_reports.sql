-- Mentor alerts for open questions, close by author/mentor/admin, and report-to-admin.

-- Per-mentor dismissals so a tutor can clear an alert without closing the thread
create table if not exists public.question_alert_dismissals (
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.stuck_questions (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (tutor_id, question_id)
);

create index if not exists question_alert_dismissals_question_idx
  on public.question_alert_dismissals (question_id);

alter table public.question_alert_dismissals enable row level security;

drop policy if exists "question_alert_dismissals_select_own" on public.question_alert_dismissals;
create policy "question_alert_dismissals_select_own"
  on public.question_alert_dismissals for select to authenticated
  using (tutor_id = auth.uid() or public.is_admin());

drop policy if exists "question_alert_dismissals_insert_own" on public.question_alert_dismissals;
create policy "question_alert_dismissals_insert_own"
  on public.question_alert_dismissals for insert to authenticated
  with check (tutor_id = auth.uid() and public.is_approved_tutor());

drop policy if exists "question_alert_dismissals_delete_own" on public.question_alert_dismissals;
create policy "question_alert_dismissals_delete_own"
  on public.question_alert_dismissals for delete to authenticated
  using (tutor_id = auth.uid() or public.is_admin());

create or replace function public.dismiss_question_alert(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not public.is_approved_tutor() then
    raise exception 'Only approved mentors can dismiss question alerts';
  end if;

  insert into public.question_alert_dismissals (tutor_id, question_id)
  values (auth.uid(), p_question_id)
  on conflict (tutor_id, question_id) do nothing;
end;
$$;

grant execute on function public.dismiss_question_alert(uuid) to authenticated;

-- Close when the asker, an approved mentor, or an admin is satisfied
create or replace function public.close_stuck_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.stuck_questions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into q from public.stuck_questions where id = p_question_id;
  if not found then
    raise exception 'Question not found';
  end if;

  if q.author_id <> auth.uid()
     and not public.is_approved_tutor()
     and not public.is_admin() then
    raise exception 'Not allowed to close this question';
  end if;

  update public.stuck_questions
  set status = 'closed'
  where id = p_question_id
    and status <> 'closed';
end;
$$;

grant execute on function public.close_stuck_question(uuid) to authenticated;

-- Any signed-in user can mark open → answered after a reply
create or replace function public.mark_stuck_answered(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.stuck_questions
  set status = 'answered'
  where id = p_question_id
    and status = 'open';
end;
$$;

grant execute on function public.mark_stuck_answered(uuid) to authenticated;

-- Inappropriate content reports (admins moderate + optional email notify)
create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.stuck_questions (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (question_id, reporter_id)
);

create index if not exists question_reports_open_idx
  on public.question_reports (created_at desc)
  where resolved_at is null;

create index if not exists question_reports_question_idx
  on public.question_reports (question_id);

alter table public.question_reports enable row level security;

drop policy if exists "question_reports_insert_own" on public.question_reports;
create policy "question_reports_insert_own"
  on public.question_reports for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "question_reports_select_admin_or_own" on public.question_reports;
create policy "question_reports_select_admin_or_own"
  on public.question_reports for select to authenticated
  using (public.is_admin() or reporter_id = auth.uid());

drop policy if exists "question_reports_update_admin" on public.question_reports;
create policy "question_reports_update_admin"
  on public.question_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "question_reports_delete_admin" on public.question_reports;
create policy "question_reports_delete_admin"
  on public.question_reports for delete to authenticated
  using (public.is_admin());

create or replace function public.resolve_question_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  update public.question_reports
  set resolved_at = now()
  where id = p_report_id
    and resolved_at is null;
end;
$$;

grant execute on function public.resolve_question_report(uuid) to authenticated;

-- Live mentor badge when new open questions appear
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'stuck_questions'
  ) then
    alter publication supabase_realtime add table public.stuck_questions;
  end if;
end $$;

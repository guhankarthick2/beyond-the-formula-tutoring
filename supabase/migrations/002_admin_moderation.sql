-- Run this in Supabase SQL Editor if you already applied schema.sql earlier.
-- Safe to re-run: drops/recreates policies and functions used for admin moderation.

-- Delete policies
drop policy if exists "questions_admin_delete" on public.stuck_questions;
create policy "questions_admin_delete"
  on public.stuck_questions for delete to authenticated
  using (public.is_admin());

drop policy if exists "answers_admin_delete" on public.stuck_answers;
create policy "answers_admin_delete"
  on public.stuck_answers for delete to authenticated
  using (public.is_admin());

drop policy if exists "requests_admin_delete" on public.session_requests;
create policy "requests_admin_delete"
  on public.session_requests for delete to authenticated
  using (public.is_admin());

drop policy if exists "slots_admin_delete" on public.availability_slots;
create policy "slots_admin_delete"
  on public.availability_slots for delete to authenticated
  using (public.is_admin());

drop policy if exists "bookings_admin_delete" on public.bookings;
create policy "bookings_admin_delete"
  on public.bookings for delete to authenticated
  using (public.is_admin());

create or replace function public.admin_purge_stuck_older_than(p_days int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;
  if p_days < 1 then
    raise exception 'Days must be at least 1';
  end if;

  delete from public.stuck_questions
  where created_at < now() - make_interval(days => p_days);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.admin_purge_stuck_older_than(int) to authenticated;

create or replace function public.admin_purge_requests_older_than(p_days int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;
  if p_days < 1 then
    raise exception 'Days must be at least 1';
  end if;

  delete from public.session_requests
  where created_at < now() - make_interval(days => p_days);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.admin_purge_requests_older_than(int) to authenticated;

create or replace function public.admin_purge_past_slots(p_days int default 0)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;
  if p_days < 0 then
    raise exception 'Days cannot be negative';
  end if;

  delete from public.availability_slots
  where session_date < (current_date - p_days);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.admin_purge_past_slots(int) to authenticated;

create or replace function public.admin_moderate_display_name(p_user_id uuid, p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;
  if char_length(trim(p_display_name)) < 2 then
    raise exception 'Display name too short';
  end if;

  perform set_config('app.allow_tutor_apply', 'on', true);

  update public.profiles
  set display_name = left(trim(p_display_name), 40)
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_moderate_display_name(uuid, text) to authenticated;

create or replace function public.admin_set_tutor_status(
  p_user_id uuid,
  p_tutor_status public.tutor_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  select role into target_role from public.profiles where id = p_user_id;
  if target_role is null then
    raise exception 'User not found';
  end if;
  if target_role = 'admin' and p_user_id <> auth.uid() then
    raise exception 'Cannot change another admin via this tool';
  end if;

  perform set_config('app.allow_tutor_apply', 'on', true);

  update public.profiles
  set
    tutor_status = p_tutor_status,
    role = case
      when role = 'admin' then 'admin'::public.user_role
      when p_tutor_status = 'approved' then 'tutor'::public.user_role
      else 'student'::public.user_role
    end
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_tutor_status(uuid, public.tutor_status) to authenticated;

-- Fix infinite recursion between availability_slots <-> bookings RLS policies.
-- Policies must not subquery each other under invoker RLS; use SECURITY DEFINER helpers.

create or replace function public.user_owns_slot(p_slot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.availability_slots s
    where s.id = p_slot_id
      and s.tutor_id = auth.uid()
  );
$$;

create or replace function public.user_booked_slot(p_slot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.slot_id = p_slot_id
      and b.student_id = auth.uid()
  );
$$;

create or replace function public.tutor_has_roster_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    join public.availability_slots s on s.id = b.slot_id
    where b.student_id = p_student_id
      and s.tutor_id = auth.uid()
  );
$$;

grant execute on function public.user_owns_slot(uuid) to authenticated, anon;
grant execute on function public.user_booked_slot(uuid) to authenticated, anon;
grant execute on function public.tutor_has_roster_student(uuid) to authenticated;

drop policy if exists "slots_select_authenticated" on public.availability_slots;
create policy "slots_select_authenticated"
  on public.availability_slots for select to authenticated
  using (
    status = 'open'
    or tutor_id = auth.uid()
    or public.is_admin()
    or public.user_booked_slot(id)
  );

drop policy if exists "bookings_select_participants" on public.bookings;
create policy "bookings_select_participants"
  on public.bookings for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin()
    or public.user_owns_slot(slot_id)
  );

-- Homework / mentor messages also joined slots+bookings under RLS (same recursion risk).
drop policy if exists "homework_select_enrolled_or_tutor" on public.session_homework;
create policy "homework_select_enrolled_or_tutor"
  on public.session_homework for select to authenticated
  using (
    tutor_id = auth.uid()
    or public.is_admin()
    or public.user_booked_slot(slot_id)
  );

drop policy if exists "messages_select_participants" on public.mentor_messages;
create policy "messages_select_participants"
  on public.mentor_messages for select to authenticated
  using (
    student_id = auth.uid()
    or tutor_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "messages_insert_tutor" on public.mentor_messages;
create policy "messages_insert_tutor"
  on public.mentor_messages for insert to authenticated
  with check (
    tutor_id = auth.uid()
    and public.is_approved_tutor()
    and public.tutor_has_roster_student(student_id)
  );

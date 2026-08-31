-- Student hub: public slots, homework, mentor messages, page views
-- Run after schema.sql in Supabase SQL Editor

-- Allow anyone to browse open upcoming sessions (public schedule)
create policy "slots_select_public_open"
  on public.availability_slots for select
  using (status = 'open' and session_date >= current_date);

-- Session homework (visible to enrolled students on that slot)
create table if not exists public.session_homework (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 5 and 4000),
  due_date date,
  created_at timestamptz not null default now()
);

create index session_homework_slot_idx on public.session_homework (slot_id);

create table if not exists public.homework_completions (
  homework_id uuid not null references public.session_homework (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (homework_id, student_id)
);

-- Persistent mentor → student messages (roster students only)
create table if not exists public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index mentor_messages_student_idx on public.mentor_messages (student_id, created_at desc);
create index mentor_messages_tutor_idx on public.mentor_messages (tutor_id, created_at desc);

-- Anonymous page view tracking for impact stats
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null check (char_length(path) between 1 and 200),
  created_at timestamptz not null default now()
);

alter table public.session_homework enable row level security;
alter table public.homework_completions enable row level security;
alter table public.mentor_messages enable row level security;
alter table public.page_views enable row level security;

-- Homework: tutors manage own; students see homework for slots they booked
create policy "homework_select_enrolled_or_tutor"
  on public.session_homework for select to authenticated
  using (
    tutor_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.slot_id = session_homework.slot_id and b.student_id = auth.uid()
    )
  );

create policy "homework_insert_tutor"
  on public.session_homework for insert to authenticated
  with check (tutor_id = auth.uid() and public.is_approved_tutor());

create policy "homework_update_tutor"
  on public.session_homework for update to authenticated
  using (tutor_id = auth.uid() or public.is_admin())
  with check (tutor_id = auth.uid() or public.is_admin());

create policy "homework_delete_tutor"
  on public.session_homework for delete to authenticated
  using (tutor_id = auth.uid() or public.is_admin());

-- Completions
create policy "completions_select_own_or_tutor"
  on public.homework_completions for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.session_homework h
      where h.id = homework_completions.homework_id and h.tutor_id = auth.uid()
    )
  );

create policy "completions_insert_student"
  on public.homework_completions for insert to authenticated
  with check (student_id = auth.uid());

create policy "completions_delete_student"
  on public.homework_completions for delete to authenticated
  using (student_id = auth.uid() or public.is_admin());

-- Messages: tutor sends to roster students; student reads own
create policy "messages_select_participants"
  on public.mentor_messages for select to authenticated
  using (
    student_id = auth.uid()
    or tutor_id = auth.uid()
    or public.is_admin()
  );

create policy "messages_insert_tutor"
  on public.mentor_messages for insert to authenticated
  with check (
    tutor_id = auth.uid()
    and public.is_approved_tutor()
    and exists (
      select 1 from public.bookings b
      join public.availability_slots s on s.id = b.slot_id
      where b.student_id = mentor_messages.student_id and s.tutor_id = auth.uid()
    )
  );

-- Page views: anyone can insert; admins read aggregates
create policy "page_views_insert_anon"
  on public.page_views for insert
  with check (true);

create policy "page_views_select_admin"
  on public.page_views for select to authenticated
  using (public.is_admin());

-- Public impact stats (counts only, no PII)
create or replace function public.public_impact_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'sessions_completed', (
      select count(*)::int from public.availability_slots
      where status = 'booked' and session_date < current_date
    ),
    'students_enrolled', (
      select count(distinct student_id)::int from public.bookings
    ),
    'students_benefited', (
      select count(distinct id)::int from public.profiles where role = 'student'
    ),
    'mentors_active', (
      select count(*)::int from public.profiles
      where tutor_status = 'approved' and role in ('tutor', 'admin')
    ),
    'page_visits', (select count(*)::int from public.page_views),
    'open_sessions', (
      select count(*)::int from public.availability_slots
      where status = 'open' and session_date >= current_date
    )
  );
$$;

grant execute on function public.public_impact_stats() to anon, authenticated;

-- Public schedule: allow reading approved mentor display names (no emails in profiles table)
create policy "profiles_select_public_tutors"
  on public.profiles for select
  using (tutor_status = 'approved' or role = 'admin');

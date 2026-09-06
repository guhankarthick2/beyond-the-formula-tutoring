-- Beyond The Formula Tutoring — Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create type public.user_role as enum ('student', 'tutor', 'admin');
create type public.tutor_status as enum ('none', 'pending', 'approved', 'rejected');
create type public.slot_status as enum ('open', 'booked', 'cancelled');
create type public.request_status as enum ('open', 'claimed', 'booked', 'cancelled');
create type public.question_status as enum ('open', 'answered', 'closed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  role public.user_role not null default 'student',
  tutor_status public.tutor_status not null default 'none',
  video_watched boolean not null default false,
  expectations_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  youtube_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tutor open slots. topic_id null = "Any topic"
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  session_date date not null,
  time_note text not null default '' check (char_length(time_note) <= 120),
  meeting_url text not null default '' check (char_length(meeting_url) <= 500),
  status public.slot_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null unique references public.availability_slots (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.session_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  preferred_date date not null,
  note text not null default '' check (char_length(note) <= 1000),
  watched_recording boolean not null default false,
  status public.request_status not null default 'open',
  claimed_by uuid references public.profiles (id) on delete set null,
  proposed_date date,
  proposed_time_note text not null default '' check (char_length(proposed_time_note) <= 120),
  meeting_url text not null default '' check (char_length(meeting_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stuck_questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  title text not null check (char_length(title) between 5 and 120),
  body text not null check (char_length(body) between 20 and 4000),
  status public.question_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.stuck_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.stuck_questions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 10 and 4000),
  is_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

create index availability_slots_open_date_idx on public.availability_slots (session_date)
  where status = 'open';
create index session_requests_open_idx on public.session_requests (preferred_date)
  where status = 'open';
create index stuck_questions_topic_idx on public.stuck_questions (topic_id, created_at desc);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_name text;
  email_local text;
begin
  email_local := split_part(coalesce(new.email, ''), '@', 1);

  chosen_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(email_local), ''),
    'Learner'
  );

  if char_length(chosen_name) < 2 then
    chosen_name := 'Learner';
  end if;
  if char_length(chosen_name) > 40 then
    chosen_name := left(chosen_name, 40);
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, chosen_name);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers for RLS
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_approved_tutor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and tutor_status = 'approved'
      and role in ('tutor', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- SECURITY DEFINER helpers avoid RLS recursion between slots <-> bookings
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

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger session_requests_updated_at
  before update on public.session_requests
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.session_requests enable row level security;
alter table public.stuck_questions enable row level security;
alter table public.stuck_answers enable row level security;

-- Profiles: anyone authenticated can read display names (no emails exposed)
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (true);

-- Users may only change their display name themselves.
-- Role / tutor_status / flags change via apply_as_tutor() or admin.
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.allow_tutor_apply', true) = 'on' then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;
  -- SQL Editor / service role have no JWT; RLS still blocks anon clients.
  if auth.uid() is null then
    return new;
  end if;
  if new.id <> auth.uid() then
    raise exception 'Cannot update another profile';
  end if;
  if new.role is distinct from old.role
     or new.tutor_status is distinct from old.tutor_status
     or new.video_watched is distinct from old.video_watched
     or new.expectations_accepted is distinct from old.expectations_accepted then
    raise exception 'Use apply_as_tutor() or ask an admin to change tutor status';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Topics: public can read active topics (no login required on home page)
create policy "topics_select_active"
  on public.topics for select
  using (active = true or public.is_admin());

create policy "topics_admin_write"
  on public.topics for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Availability slots
create policy "slots_select_authenticated"
  on public.availability_slots for select to authenticated
  using (
    status = 'open'
    or tutor_id = auth.uid()
    or public.is_admin()
    or public.user_booked_slot(id)
  );

create policy "slots_insert_tutor"
  on public.availability_slots for insert to authenticated
  with check (tutor_id = auth.uid() and public.is_approved_tutor());

create policy "slots_insert_admin"
  on public.availability_slots for insert to authenticated
  with check (public.is_admin());

create policy "slots_update_tutor_or_admin"
  on public.availability_slots for update to authenticated
  using (tutor_id = auth.uid() or public.is_admin())
  with check (tutor_id = auth.uid() or public.is_admin());

-- Bookings
create policy "bookings_select_participants"
  on public.bookings for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin()
    or public.user_owns_slot(slot_id)
  );

create policy "bookings_insert_student"
  on public.bookings for insert to authenticated
  with check (student_id = auth.uid());

-- Session requests
create policy "requests_select"
  on public.session_requests for select to authenticated
  using (
    status = 'open'
    or student_id = auth.uid()
    or claimed_by = auth.uid()
    or public.is_admin()
    or public.is_approved_tutor()
  );

create policy "requests_insert_student"
  on public.session_requests for insert to authenticated
  with check (student_id = auth.uid());

create policy "requests_update_participants"
  on public.session_requests for update to authenticated
  using (
    student_id = auth.uid()
    or claimed_by = auth.uid()
    or public.is_approved_tutor()
    or public.is_admin()
  )
  with check (
    student_id = auth.uid()
    or claimed_by = auth.uid()
    or public.is_approved_tutor()
    or public.is_admin()
  );

-- Stuck questions / answers (text only — no media)
create policy "questions_select_authenticated"
  on public.stuck_questions for select to authenticated
  using (true);

create policy "questions_insert_authenticated"
  on public.stuck_questions for insert to authenticated
  with check (author_id = auth.uid());

create policy "questions_update_author_or_admin"
  on public.stuck_questions for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "answers_select_authenticated"
  on public.stuck_answers for select to authenticated
  using (true);

create policy "answers_insert_authenticated"
  on public.stuck_answers for insert to authenticated
  with check (author_id = auth.uid());

create policy "answers_update_author_or_admin"
  on public.stuck_answers for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

-- Admin delete / moderation
create policy "questions_admin_delete"
  on public.stuck_questions for delete to authenticated
  using (public.is_admin());

create policy "answers_admin_delete"
  on public.stuck_answers for delete to authenticated
  using (public.is_admin());

create policy "requests_admin_delete"
  on public.session_requests for delete to authenticated
  using (public.is_admin());

create policy "slots_admin_delete"
  on public.availability_slots for delete to authenticated
  using (public.is_admin());

create policy "bookings_admin_delete"
  on public.bookings for delete to authenticated
  using (public.is_admin());

-- Bulk cleanup helpers (admin only)
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
  where created_at < now() - make_interval(days => p_days)
    and status in ('open', 'cancelled', 'booked', 'claimed');

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

create or replace function public.admin_set_role(
  p_user_id uuid,
  p_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  -- Prevent locking yourself out of the admin console.
  if p_user_id = auth.uid() and p_role is distinct from 'admin'::public.user_role then
    raise exception 'Cannot remove your own admin role';
  end if;

  perform set_config('app.allow_tutor_apply', 'on', true);

  update public.profiles
  set role = p_role
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;

-- Atomic book slot
create or replace function public.book_slot(p_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.availability_slots
  set status = 'booked'
  where id = p_slot_id and status = 'open';

  if not found then
    raise exception 'Slot unavailable';
  end if;

  insert into public.bookings (slot_id, student_id)
  values (p_slot_id, auth.uid())
  returning id into booking_id;

  return booking_id;
end;
$$;

grant execute on function public.book_slot(uuid) to authenticated;

-- Claim a session request (tutor proposes time)
create or replace function public.claim_request(
  p_request_id uuid,
  p_proposed_date date,
  p_proposed_time_note text,
  p_meeting_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_approved_tutor() then
    raise exception 'Only approved tutors can claim requests';
  end if;

  update public.session_requests
  set
    status = 'claimed',
    claimed_by = auth.uid(),
    proposed_date = p_proposed_date,
    proposed_time_note = coalesce(p_proposed_time_note, ''),
    meeting_url = coalesce(p_meeting_url, '')
  where id = p_request_id and status = 'open';

  if not found then
    raise exception 'Request unavailable';
  end if;
end;
$$;

grant execute on function public.claim_request(uuid, date, text, text) to authenticated;

-- Student accepts a claimed request
create or replace function public.accept_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.session_requests
  set status = 'booked'
  where id = p_request_id
    and student_id = auth.uid()
    and status = 'claimed';

  if not found then
    raise exception 'Unable to accept request';
  end if;
end;
$$;

grant execute on function public.accept_request(uuid) to authenticated;

-- Volunteer application (cannot self-approve)
create or replace function public.apply_as_tutor()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  perform set_config('app.allow_tutor_apply', 'on', true);

  update public.profiles
  set
    video_watched = true,
    expectations_accepted = true,
    tutor_status = 'pending',
    role = case when role = 'admin' then 'admin'::public.user_role else 'tutor'::public.user_role end
  where id = auth.uid()
    and tutor_status in ('none', 'rejected');

  if not found then
    raise exception 'Already applied or already approved';
  end if;
end;
$$;

grant execute on function public.apply_as_tutor() to authenticated;

-- Seed curated topics
insert into public.topics (name, slug, sort_order, youtube_url) values
  ('Functions', 'functions', 10, null),
  ('Trigonometry', 'trigonometry', 20, null),
  ('Polynomials', 'polynomials', 30, null),
  ('Exponents & logs', 'exponents-logs', 40, null),
  ('Sequences & series', 'sequences-series', 50, null),
  ('Conic sections', 'conic-sections', 60, null),
  ('Limits & intro calculus', 'limits-intro-calculus', 70, null);

-- After first signup, promote yourself to admin (replace YOUR_USER_ID).
-- Mentoring stays optional; enable from Admin → Tutor apps when desired.
-- update public.profiles set role = 'admin' where id = 'YOUR_USER_ID';

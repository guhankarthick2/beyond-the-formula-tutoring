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

-- Tutor open / past sessions. Topics live in slot_topics (empty = "Any topic").
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  session_date date not null,
  time_note text not null default '' check (char_length(time_note) <= 120),
  meeting_url text not null default '' check (char_length(meeting_url) <= 500),
  status public.slot_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.slot_topics (
  slot_id uuid not null references public.availability_slots (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  primary key (slot_id, topic_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (slot_id, student_id)
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
  topic_id uuid references public.topics (id) on delete restrict,
  subject_slug text not null default 'precal'
    check (subject_slug in ('precal', 'sat', 'algebra', 'calculus')),
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

create table public.question_alert_dismissals (
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.stuck_questions (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (tutor_id, question_id)
);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.stuck_questions (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (question_id, reporter_id)
);

create index availability_slots_open_date_idx on public.availability_slots (session_date)
  where status = 'open';
create index session_requests_open_idx on public.session_requests (preferred_date)
  where status = 'open';
create index slot_topics_topic_idx on public.slot_topics (topic_id);

create unique index availability_slots_meeting_url_unique
  on public.availability_slots (meeting_url)
  where meeting_url <> '';
create index stuck_questions_topic_idx on public.stuck_questions (topic_id, created_at desc);
create index stuck_questions_subject_idx on public.stuck_questions (subject_slug, created_at desc);
create index question_alert_dismissals_question_idx
  on public.question_alert_dismissals (question_id);
create index question_reports_open_idx
  on public.question_reports (created_at desc)
  where resolved_at is null;
create index question_reports_question_idx on public.question_reports (question_id);

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
alter table public.slot_topics enable row level security;
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
-- Public: upcoming open schedule + past booked sessions (metadata; enroll to unlock artifacts)
create policy "slots_select_public_open"
  on public.availability_slots for select
  using (
    (status = 'open' and session_date >= current_date)
    or (status = 'booked' and session_date < current_date)
  );

create policy "slots_select_authenticated"
  on public.availability_slots for select to authenticated
  using (
    status = 'open'
    or tutor_id = auth.uid()
    or public.is_admin()
    or public.user_booked_slot(id)
    or (status = 'booked' and session_date < current_date)
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

-- Slot topics (many-to-many tags; empty = Any topic)
create policy "slot_topics_select"
  on public.slot_topics for select
  using (true);

create policy "slot_topics_insert"
  on public.slot_topics for insert to authenticated
  with check (
    public.is_admin()
    or public.user_owns_slot(slot_id)
  );

create policy "slot_topics_delete"
  on public.slot_topics for delete to authenticated
  using (
    public.is_admin()
    or public.user_owns_slot(slot_id)
  );

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

alter table public.question_alert_dismissals enable row level security;
alter table public.question_reports enable row level security;

create policy "question_alert_dismissals_select_own"
  on public.question_alert_dismissals for select to authenticated
  using (tutor_id = auth.uid() or public.is_admin());

create policy "question_alert_dismissals_insert_own"
  on public.question_alert_dismissals for insert to authenticated
  with check (tutor_id = auth.uid() and public.is_approved_tutor());

create policy "question_alert_dismissals_delete_own"
  on public.question_alert_dismissals for delete to authenticated
  using (tutor_id = auth.uid() or public.is_admin());

create policy "question_reports_insert_own"
  on public.question_reports for insert to authenticated
  with check (reporter_id = auth.uid());

create policy "question_reports_select_admin_or_own"
  on public.question_reports for select to authenticated
  using (public.is_admin() or reporter_id = auth.uid());

create policy "question_reports_update_admin"
  on public.question_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "question_reports_delete_admin"
  on public.question_reports for delete to authenticated
  using (public.is_admin());

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

-- Atomic book slot: exclusive for open upcoming; multi-enroll for past/booked sessions
create or replace function public.book_slot(p_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_id uuid;
  slot_status public.slot_status;
  slot_date date;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select status, session_date
  into slot_status, slot_date
  from public.availability_slots
  where id = p_slot_id
  for update;

  if slot_status is null then
    raise exception 'Session not found';
  end if;

  if exists (
    select 1 from public.bookings
    where slot_id = p_slot_id and student_id = auth.uid()
  ) then
    raise exception 'Already enrolled in this session';
  end if;

  if slot_status = 'open' and slot_date >= current_date then
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
  end if;

  if slot_status = 'booked' or slot_date < current_date then
    if slot_status = 'open' then
      update public.availability_slots
      set status = 'booked'
      where id = p_slot_id;
    end if;

    insert into public.bookings (slot_id, student_id)
    values (p_slot_id, auth.uid())
    returning id into booking_id;

    return booking_id;
  end if;

  raise exception 'Session unavailable';
end;
$$;

grant execute on function public.book_slot(uuid) to authenticated;

-- Cancel enrollment in an upcoming session; reopen slot if no students remain
create or replace function public.cancel_enrollment(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_date date;
  slot_status public.slot_status;
  remaining int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select session_date, status
  into slot_date, slot_status
  from public.availability_slots
  where id = p_slot_id
  for update;

  if slot_date is null then
    raise exception 'Session not found';
  end if;

  if slot_date < current_date then
    raise exception 'Past sessions cannot be cancelled';
  end if;

  if slot_status = 'cancelled' then
    raise exception 'Session already cancelled';
  end if;

  delete from public.bookings
  where slot_id = p_slot_id
    and student_id = auth.uid();

  if not found then
    raise exception 'You are not enrolled in this session';
  end if;

  select count(*)::int into remaining
  from public.bookings
  where slot_id = p_slot_id;

  if remaining = 0 and slot_status = 'booked' then
    update public.availability_slots
    set status = 'open'
    where id = p_slot_id;
  end if;
end;
$$;

grant execute on function public.cancel_enrollment(uuid) to authenticated;

-- Mentor cancels an upcoming session and messages all enrolled students
create or replace function public.cancel_session(p_slot_id uuid, p_note text default '')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_row public.availability_slots%rowtype;
  note_clean text;
  label text;
  body text;
  notified int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into slot_row
  from public.availability_slots
  where id = p_slot_id
  for update;

  if slot_row.id is null then
    raise exception 'Session not found';
  end if;

  if slot_row.tutor_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the session mentor (or an admin) can cancel it';
  end if;

  if slot_row.session_date < current_date then
    raise exception 'Past sessions cannot be cancelled';
  end if;

  if slot_row.status = 'cancelled' then
    raise exception 'Session already cancelled';
  end if;

  note_clean := trim(coalesce(p_note, ''));
  if char_length(note_clean) > 500 then
    raise exception 'Note too long';
  end if;

  label := nullif(trim(slot_row.time_note), '');
  if label is null then
    select string_agg(t.name, ', ' order by t.sort_order, t.name)
    into label
    from public.slot_topics st
    join public.topics t on t.id = st.topic_id
    where st.slot_id = p_slot_id;
  end if;
  if label is null then
    label := 'Session';
  end if;

  body :=
    'Your upcoming session on '
    || to_char(slot_row.session_date, 'Dy, Mon DD, YYYY')
    || ' (' || label || ') has been cancelled by your mentor. You are no longer expected to attend.';

  if note_clean <> '' then
    body := body || E'\n\nMentor note: ' || note_clean;
  end if;

  insert into public.mentor_messages (tutor_id, student_id, body)
  select slot_row.tutor_id, b.student_id, body
  from public.bookings b
  where b.slot_id = p_slot_id;

  get diagnostics notified = row_count;

  update public.availability_slots
  set status = 'cancelled'
  where id = p_slot_id;

  return notified;
end;
$$;

grant execute on function public.cancel_session(uuid, text) to authenticated;

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

create or replace function public.youtube_video_id(p_url text)
returns text
language plpgsql
immutable
as $$
declare
  u text := trim(coalesce(p_url, ''));
  id text;
begin
  if u = '' then
    return null;
  end if;

  id := substring(u from 'youtu\.be/([A-Za-z0-9_-]{11})');
  if id is not null then
    return id;
  end if;

  id := substring(u from '[?&]v=([A-Za-z0-9_-]{11})');
  if id is not null then
    return id;
  end if;

  id := substring(u from 'youtube\.com/(?:embed|shorts|live)/([A-Za-z0-9_-]{11})');
  if id is not null then
    return id;
  end if;

  return null;
end;
$$;

create or replace function public.enforce_unique_meeting_recording()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_yt text;
  conflict_id uuid;
begin
  if new.meeting_url is null or btrim(new.meeting_url) = '' then
    return new;
  end if;

  new_yt := public.youtube_video_id(new.meeting_url);

  if new_yt is not null then
    select s.id into conflict_id
    from public.availability_slots s
    where s.id is distinct from new.id
      and s.meeting_url <> ''
      and public.youtube_video_id(s.meeting_url) = new_yt
    limit 1;
  else
    select s.id into conflict_id
    from public.availability_slots s
    where s.id is distinct from new.id
      and lower(btrim(s.meeting_url)) = lower(btrim(new.meeting_url))
    limit 1;
  end if;

  if conflict_id is not null then
    raise exception 'This recording or meeting link is already attributed to another session'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists availability_slots_unique_recording on public.availability_slots;
create trigger availability_slots_unique_recording
  before insert or update of meeting_url on public.availability_slots
  for each row execute function public.enforce_unique_meeting_recording();

create or replace function public.list_taken_meeting_urls()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select meeting_url
  from public.availability_slots
  where meeting_url <> '';
$$;

grant execute on function public.list_taken_meeting_urls() to authenticated;

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

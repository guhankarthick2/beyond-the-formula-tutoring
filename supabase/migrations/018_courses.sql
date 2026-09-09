-- Courses / bootcamps: parent umbrella for availability_slots, whole-course enroll, flyer storage.

create type public.course_status as enum ('draft', 'published');

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  subject_slug text not null default 'precal'
    check (subject_slug in ('precal', 'sat', 'algebra', 'calculus')),
  summary text not null default '' check (char_length(summary) <= 500),
  body text not null default '' check (char_length(body) <= 20000),
  flyer_path text check (flyer_path is null or char_length(flyer_path) <= 500),
  status public.course_status not null default 'draft',
  location_note text not null default '' check (char_length(location_note) <= 240),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (slug)
);

create index if not exists courses_subject_status_idx
  on public.courses (subject_slug, status, starts_on desc nulls last);

create table if not exists public.course_enrollments (
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, student_id)
);

create index if not exists course_enrollments_student_idx
  on public.course_enrollments (student_id);

alter table public.availability_slots
  add column if not exists course_id uuid references public.courses (id) on delete set null;

create index if not exists availability_slots_course_idx
  on public.availability_slots (course_id)
  where course_id is not null;

-- Helpers
create or replace function public.user_enrolled_in_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_enrollments
    where course_id = p_course_id
      and student_id = auth.uid()
  );
$$;

grant execute on function public.user_enrolled_in_course(uuid) to authenticated;

create or replace function public.user_can_access_slot(p_slot_id uuid)
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
      and (
        public.user_booked_slot(s.id)
        or (
          s.course_id is not null
          and public.user_enrolled_in_course(s.course_id)
        )
      )
  );
$$;

grant execute on function public.user_can_access_slot(uuid) to authenticated;

-- Multi-enroll when slot is linked to a course (bootcamp-style)
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
  slot_course uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select status, session_date, course_id
  into slot_status, slot_date, slot_course
  from public.availability_slots
  where id = p_slot_id
  for update;

  if slot_status is null then
    raise exception 'Session not found';
  end if;

  if slot_status = 'cancelled' then
    raise exception 'Session unavailable';
  end if;

  if exists (
    select 1 from public.bookings
    where slot_id = p_slot_id and student_id = auth.uid()
  ) then
    raise exception 'Already enrolled in this session';
  end if;

  -- Course-linked slots: multi-student enroll without exclusive claim
  if slot_course is not null and slot_status in ('open', 'booked') then
    insert into public.bookings (slot_id, student_id)
    values (p_slot_id, auth.uid())
    returning id into booking_id;
    return booking_id;
  end if;

  -- Live exclusive enrollment (one student claims an open upcoming slot)
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

  -- Past / completed session: many students can enroll to access artifacts
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

create or replace function public.enroll_in_course(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c_status public.course_status;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select status into c_status
  from public.courses
  where id = p_course_id;

  if c_status is null then
    raise exception 'Course not found';
  end if;
  if c_status <> 'published' then
    raise exception 'Course is not open for enrollment';
  end if;

  insert into public.course_enrollments (course_id, student_id)
  values (p_course_id, auth.uid())
  on conflict (course_id, student_id) do nothing;

  -- Mirror bookings for every non-cancelled slot under the course
  insert into public.bookings (slot_id, student_id)
  select s.id, auth.uid()
  from public.availability_slots s
  where s.course_id = p_course_id
    and s.status <> 'cancelled'
  on conflict (slot_id, student_id) do nothing;
end;
$$;

grant execute on function public.enroll_in_course(uuid) to authenticated;

-- RLS
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;

drop policy if exists "courses_select_published_or_admin" on public.courses;
create policy "courses_select_published_or_admin"
  on public.courses for select
  using (status = 'published' or public.is_admin());

drop policy if exists "courses_admin_insert" on public.courses;
create policy "courses_admin_insert"
  on public.courses for insert to authenticated
  with check (public.is_admin());

drop policy if exists "courses_admin_update" on public.courses;
create policy "courses_admin_update"
  on public.courses for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "courses_admin_delete" on public.courses;
create policy "courses_admin_delete"
  on public.courses for delete to authenticated
  using (public.is_admin());

drop policy if exists "course_enrollments_select_own_or_admin" on public.course_enrollments;
create policy "course_enrollments_select_own_or_admin"
  on public.course_enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_admin());

drop policy if exists "course_enrollments_insert_own" on public.course_enrollments;
create policy "course_enrollments_insert_own"
  on public.course_enrollments for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists "course_enrollments_admin_delete" on public.course_enrollments;
create policy "course_enrollments_admin_delete"
  on public.course_enrollments for delete to authenticated
  using (public.is_admin() or student_id = auth.uid());

-- Allow authenticated to see open course-linked upcoming slots (multi-enroll bootcamps)
drop policy if exists "slots_select_public_open" on public.availability_slots;
create policy "slots_select_public_open"
  on public.availability_slots for select
  using (
    (status = 'open' and session_date >= current_date)
    or (status = 'booked' and session_date < current_date)
    or (course_id is not null and status in ('open', 'booked'))
  );

drop policy if exists "slots_select_authenticated" on public.availability_slots;
create policy "slots_select_authenticated"
  on public.availability_slots for select to authenticated
  using (
    status = 'open'
    or tutor_id = auth.uid()
    or public.is_admin()
    or public.user_booked_slot(id)
    or (status = 'booked' and session_date < current_date)
    or (course_id is not null and status in ('open', 'booked'))
  );

-- Storage bucket for course flyers (public read, admin write)
insert into storage.buckets (id, name, public)
values ('course-flyers', 'course-flyers', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "course_flyers_public_read" on storage.objects;
create policy "course_flyers_public_read"
  on storage.objects for select
  using (bucket_id = 'course-flyers');

drop policy if exists "course_flyers_admin_insert" on storage.objects;
create policy "course_flyers_admin_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'course-flyers' and public.is_admin());

drop policy if exists "course_flyers_admin_update" on storage.objects;
create policy "course_flyers_admin_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'course-flyers' and public.is_admin())
  with check (bucket_id = 'course-flyers' and public.is_admin());

drop policy if exists "course_flyers_admin_delete" on storage.objects;
create policy "course_flyers_admin_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'course-flyers' and public.is_admin());

-- Seed Pre-AP Precalculus Bootcamp (flyer via static public path until admin re-uploads)
insert into public.courses (
  title,
  slug,
  subject_slug,
  summary,
  body,
  flyer_path,
  status,
  location_note,
  starts_on,
  ends_on
)
values (
  'Pre-AP Precalculus Bootcamp',
  'pre-ap-precalculus-bootcamp',
  'precal',
  'Why feel lost when school starts? A free summer foundation for incoming AP Precalculus students — algebra, functions, trigonometry, and AP-style problem solving.',
  $body$Free summer program for incoming AP Precalculus students. AP Precalculus moves quickly and assumes fluency with algebra, functions, trigonometry, and problem-solving. Build confidence before the school year.

Highlights
• Strengthen algebra & function skills
• Learn AP-style problem solving techniques
• Build confidence with graphs & trigonometry
• Prepare for faster pace & challenging assessments
• Practice real AP Precalculus question types

Class details
• Total 16 weekend classes (June & July; no July 4 weekend)
• 1 hour per session · 2 classes every weekend
• Plano Davis Library / Zoom hybrid

Tentative curriculum
1. Algebra Review & Factoring
2. Linear Functions & Modeling
3. Polynomial Functions
4. Rational Functions
5. Exponential & Logarithmic Functions
6. Trigonometric Functions
7. Unit Circle & Identities
8. Transformations & Graphing
9. Function Composition & Inverses
10. Sequences & Series Basics
11. Rates of Change
12. Data Modeling
13. AP-style Problem Solving
14. Calculator Strategies
15. Practice Assessment
16. Final Review & Confidence Boost

Limited seats. Enroll on this page to unlock all sessions and recordings under the bootcamp.$body$,
  '/course-flyers/pre-ap-precalculus-bootcamp.jpg',
  'published',
  'Plano Davis Library / Zoom Hybrid',
  '2026-06-01',
  '2026-07-31'
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  flyer_path = coalesce(public.courses.flyer_path, excluded.flyer_path),
  status = excluded.status,
  location_note = excluded.location_note,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on;

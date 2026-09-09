-- Public mentor profiles (words-first) + course co-mentors.

alter table public.profiles
  add column if not exists mentor_slug text,
  add column if not exists mentor_bio text not null default '',
  add column if not exists mentor_focus text not null default '',
  add column if not exists mentor_public boolean not null default false;

alter table public.profiles drop constraint if exists profiles_mentor_slug_format;
alter table public.profiles
  add constraint profiles_mentor_slug_format
  check (
    mentor_slug is null
    or (mentor_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(mentor_slug) between 2 and 60)
  );

alter table public.profiles drop constraint if exists profiles_mentor_bio_len;
alter table public.profiles
  add constraint profiles_mentor_bio_len
  check (char_length(mentor_bio) <= 1200);

alter table public.profiles drop constraint if exists profiles_mentor_focus_len;
alter table public.profiles
  add constraint profiles_mentor_focus_len
  check (char_length(mentor_focus) <= 160);

create unique index if not exists profiles_mentor_slug_unique
  on public.profiles (mentor_slug)
  where mentor_slug is not null;

create table if not exists public.course_mentors (
  course_id uuid not null references public.courses (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  sort_order int not null default 0,
  primary key (course_id, mentor_id)
);

create index if not exists course_mentors_mentor_idx on public.course_mentors (mentor_id);

alter table public.course_mentors enable row level security;

drop policy if exists "course_mentors_select_published_or_admin" on public.course_mentors;
create policy "course_mentors_select_published_or_admin"
  on public.course_mentors for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = course_id and c.status = 'published'
    )
  );

drop policy if exists "course_mentors_admin_write" on public.course_mentors;
create policy "course_mentors_admin_write"
  on public.course_mentors for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Narrow public directory (bypasses profiles RLS; limited columns only)
drop view if exists public.public_mentor_profiles;
create view public.public_mentor_profiles
with (security_invoker = false)
as
select
  p.id,
  p.display_name,
  p.mentor_slug,
  p.mentor_bio,
  p.mentor_focus,
  (
    select count(*)::int
    from public.availability_slots s
    where s.tutor_id = p.id
      and s.status <> 'cancelled'
  ) as session_count
from public.profiles p
where p.mentor_public = true
  and p.tutor_status = 'approved'
  and p.mentor_slug is not null;

grant select on public.public_mentor_profiles to anon, authenticated;

-- Course page mentor chips (names always; profile link only when public)
drop view if exists public.course_mentor_directory;
create view public.course_mentor_directory
with (security_invoker = false)
as
select
  cm.course_id,
  cm.mentor_id,
  cm.sort_order,
  p.display_name,
  case
    when p.mentor_public and p.tutor_status = 'approved' and p.mentor_slug is not null
    then p.mentor_slug
    else null
  end as mentor_slug,
  case
    when p.mentor_public and p.tutor_status = 'approved'
    then p.mentor_focus
    else null
  end as mentor_focus,
  (
    p.mentor_public
    and p.tutor_status = 'approved'
    and p.mentor_slug is not null
  ) as is_public
from public.course_mentors cm
join public.profiles p on p.id = cm.mentor_id
join public.courses c on c.id = cm.course_id
where c.status = 'published';

grant select on public.course_mentor_directory to anon, authenticated;

-- Mentors may edit own public profile fields (not role/tutor_status)
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
  -- Non-admins who are not approved tutors cannot toggle public mentor fields
  if (
    new.mentor_slug is distinct from old.mentor_slug
    or new.mentor_bio is distinct from old.mentor_bio
    or new.mentor_focus is distinct from old.mentor_focus
    or new.mentor_public is distinct from old.mentor_public
  ) and not public.is_approved_tutor() then
    raise exception 'Only approved mentors can edit public mentor profile fields';
  end if;
  -- Publishing requires a slug
  if new.mentor_public = true and (new.mentor_slug is null or length(trim(new.mentor_slug)) < 2) then
    raise exception 'Set a mentor slug before publishing your profile';
  end if;
  return new;
end;
$$;

-- Admin RPC to set another mentor's public profile
create or replace function public.admin_set_mentor_profile(
  p_user_id uuid,
  p_mentor_slug text,
  p_mentor_bio text,
  p_mentor_focus text,
  p_mentor_public boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  slug text;
begin
  if not public.is_admin() then
    raise exception 'Admin only';
  end if;

  slug := nullif(trim(lower(p_mentor_slug)), '');
  if p_mentor_public and slug is null then
    raise exception 'Slug required to publish mentor profile';
  end if;

  update public.profiles
  set
    mentor_slug = slug,
    mentor_bio = left(coalesce(p_mentor_bio, ''), 1200),
    mentor_focus = left(coalesce(p_mentor_focus, ''), 160),
    mentor_public = coalesce(p_mentor_public, false)
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_mentor_profile(uuid, text, text, text, boolean) to authenticated;

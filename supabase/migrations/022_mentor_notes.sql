-- Optional short post-it highlights on public mentor profiles (one note per line).

alter table public.profiles
  add column if not exists mentor_notes text not null default '';

alter table public.profiles drop constraint if exists profiles_mentor_notes_len;
alter table public.profiles
  add constraint profiles_mentor_notes_len
  check (char_length(mentor_notes) <= 600);

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
  p.mentor_notes,
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
  if (
    new.mentor_slug is distinct from old.mentor_slug
    or new.mentor_bio is distinct from old.mentor_bio
    or new.mentor_focus is distinct from old.mentor_focus
    or new.mentor_notes is distinct from old.mentor_notes
    or new.mentor_public is distinct from old.mentor_public
  ) and not public.is_approved_tutor() then
    raise exception 'Only approved mentors can edit public mentor profile fields';
  end if;
  if new.mentor_public = true and (new.mentor_slug is null or length(trim(new.mentor_slug)) < 2) then
    raise exception 'Set a mentor slug before publishing your profile';
  end if;
  return new;
end;
$$;

drop function if exists public.admin_set_mentor_profile(uuid, text, text, text, boolean);

create or replace function public.admin_set_mentor_profile(
  p_user_id uuid,
  p_mentor_slug text,
  p_mentor_bio text,
  p_mentor_focus text,
  p_mentor_public boolean,
  p_mentor_notes text default ''
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
    mentor_notes = left(coalesce(p_mentor_notes, ''), 600),
    mentor_public = coalesce(p_mentor_public, false)
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_mentor_profile(uuid, text, text, text, boolean, text) to authenticated;

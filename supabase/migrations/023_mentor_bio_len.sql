-- Allow longer mentor About bios (philosophy + hobbies).

alter table public.profiles drop constraint if exists profiles_mentor_bio_len;
alter table public.profiles
  add constraint profiles_mentor_bio_len
  check (char_length(mentor_bio) <= 2500);

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
    mentor_bio = left(coalesce(p_mentor_bio, ''), 2500),
    mentor_focus = left(coalesce(p_mentor_focus, ''), 160),
    mentor_notes = left(coalesce(p_mentor_notes, ''), 600),
    mentor_public = coalesce(p_mentor_public, false)
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_mentor_profile(uuid, text, text, text, boolean, text) to authenticated;

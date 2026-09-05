-- Allow privileged SQL Editor / service-role updates (no JWT) to bootstrap admins.
-- Client requests still cannot escalate roles: anon/authenticated hit RLS, and
-- authenticated non-admins are blocked from changing role/tutor_status below.
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
  return new;
end;
$$;

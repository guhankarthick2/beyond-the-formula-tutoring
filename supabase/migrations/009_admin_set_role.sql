-- Allow existing admins to promote (or demote others) via the app — no SQL Editor needed.
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

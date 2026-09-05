-- Prefer Google / OAuth metadata when display_name is not set at signup.
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

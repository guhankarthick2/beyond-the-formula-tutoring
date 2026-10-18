-- Post-signup site tour. NULL = not seen yet, so only accounts created after this
-- migration get the tour; existing members are marked as done.

alter table public.profiles
  add column if not exists tutorial_completed_at timestamptz;

update public.profiles
set tutorial_completed_at = now()
where tutorial_completed_at is null;

-- Scope standalone sessions to a subject (courses already have subject_slug).

alter table public.availability_slots
  add column if not exists subject_slug text;

update public.availability_slots
set subject_slug = 'precal'
where subject_slug is null;

alter table public.availability_slots
  alter column subject_slug set default 'precal';

alter table public.availability_slots
  alter column subject_slug set not null;

alter table public.availability_slots
  drop constraint if exists availability_slots_subject_slug_check;

alter table public.availability_slots
  add constraint availability_slots_subject_slug_check
  check (subject_slug in ('precal', 'sat', 'algebra', 'calculus'));

create index if not exists availability_slots_subject_date_idx
  on public.availability_slots (subject_slug, session_date desc);

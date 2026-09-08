-- Subject-scoped open questions (free-form). topic_id optional.

alter table public.stuck_questions
  add column if not exists subject_slug text;

update public.stuck_questions
set subject_slug = 'precal'
where subject_slug is null;

alter table public.stuck_questions
  alter column subject_slug set default 'precal';

alter table public.stuck_questions
  alter column subject_slug set not null;

alter table public.stuck_questions
  drop constraint if exists stuck_questions_subject_slug_check;

alter table public.stuck_questions
  add constraint stuck_questions_subject_slug_check
  check (subject_slug in ('precal', 'sat', 'algebra', 'calculus'));

-- Allow free-form posts without a curated topic
alter table public.stuck_questions
  alter column topic_id drop not null;

create index if not exists stuck_questions_subject_idx
  on public.stuck_questions (subject_slug, created_at desc);

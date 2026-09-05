-- Summer program baseline for the landing "Our impact" counters.
-- UI mapping:
--   Sessions completed  → sessions_completed  (target: 18)
--   Students benefited  → students_benefited  (target: 11 enrolled kids)
--   Active mentors      → mentors_active      (live approved tutors; unchanged)
-- "5 kids joined all sessions" has no separate counter today; kept as documentation only.

create or replace function public.public_impact_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    -- Floor at summer program totals; live booked past sessions can raise the number later
    'sessions_completed', (
      select greatest(
        18,
        (
          select count(*)::int from public.availability_slots
          where status = 'booked' and session_date < current_date
        )
      )
    ),
    'students_enrolled', (
      select greatest(
        11,
        (select count(distinct student_id)::int from public.bookings)
      )
    ),
    -- Landing page "Students benefited" uses this key — align with enrolled kids
    'students_benefited', (
      select greatest(
        11,
        (select count(distinct student_id)::int from public.bookings)
      )
    ),
    'mentors_active', (
      select count(*)::int from public.profiles
      where tutor_status = 'approved' and role in ('tutor', 'admin')
    ),
    'page_visits', (select count(*)::int from public.page_views),
    'open_sessions', (
      select count(*)::int from public.availability_slots
      where status = 'open' and session_date >= current_date
    )
  );
$$;

grant execute on function public.public_impact_stats() to anon, authenticated;

comment on function public.public_impact_stats() is
  'Public impact counters. Summer 2026 baseline: 18 sessions (Jun 1–Jul 30), 11 enrolled; 5 attended all (not shown as its own metric).';

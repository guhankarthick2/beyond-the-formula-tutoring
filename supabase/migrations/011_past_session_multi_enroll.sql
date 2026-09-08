-- Past sessions: many students can enroll in the same booked/past slot.
-- Live upcoming open slots stay one-student (exclusive) via book_slot().

alter table public.bookings drop constraint if exists bookings_slot_id_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_slot_student_unique'
  ) then
    alter table public.bookings
      add constraint bookings_slot_student_unique unique (slot_id, student_id);
  end if;
end $$;

create index if not exists bookings_student_idx on public.bookings (student_id);

-- Public + authenticated can browse past booked session metadata (titles, tutors).
drop policy if exists "slots_select_public_open" on public.availability_slots;
create policy "slots_select_public_open"
  on public.availability_slots for select
  using (
    (status = 'open' and session_date >= current_date)
    or (status = 'booked' and session_date < current_date)
  );

drop policy if exists "slots_select_authenticated" on public.availability_slots;
create policy "slots_select_authenticated"
  on public.availability_slots for select to authenticated
  using (
    status = 'open'
    or tutor_id = auth.uid()
    or public.is_admin()
    or public.user_booked_slot(id)
    or (status = 'booked' and session_date < current_date)
  );

create or replace function public.book_slot(p_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_id uuid;
  slot_status public.slot_status;
  slot_date date;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select status, session_date
  into slot_status, slot_date
  from public.availability_slots
  where id = p_slot_id
  for update;

  if slot_status is null then
    raise exception 'Session not found';
  end if;

  if exists (
    select 1 from public.bookings
    where slot_id = p_slot_id and student_id = auth.uid()
  ) then
    raise exception 'Already enrolled in this session';
  end if;

  -- Live exclusive enrollment (one student claims an open upcoming slot)
  if slot_status = 'open' and slot_date >= current_date then
    update public.availability_slots
    set status = 'booked'
    where id = p_slot_id and status = 'open';

    if not found then
      raise exception 'Slot unavailable';
    end if;

    insert into public.bookings (slot_id, student_id)
    values (p_slot_id, auth.uid())
    returning id into booking_id;

    return booking_id;
  end if;

  -- Past / completed session: many students can enroll to access artifacts
  if slot_status = 'booked' or slot_date < current_date then
    if slot_status = 'open' then
      update public.availability_slots
      set status = 'booked'
      where id = p_slot_id;
    end if;

    insert into public.bookings (slot_id, student_id)
    values (p_slot_id, auth.uid())
    returning id into booking_id;

    return booking_id;
  end if;

  raise exception 'Session unavailable';
end;
$$;

grant execute on function public.book_slot(uuid) to authenticated;

-- Students can cancel their enrollment in upcoming sessions.
-- Mentors can cancel an upcoming session and message all enrolled students.

create or replace function public.cancel_enrollment(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_date date;
  slot_status public.slot_status;
  remaining int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select session_date, status
  into slot_date, slot_status
  from public.availability_slots
  where id = p_slot_id
  for update;

  if slot_date is null then
    raise exception 'Session not found';
  end if;

  if slot_date < current_date then
    raise exception 'Past sessions cannot be cancelled';
  end if;

  if slot_status = 'cancelled' then
    raise exception 'Session already cancelled';
  end if;

  delete from public.bookings
  where slot_id = p_slot_id
    and student_id = auth.uid();

  if not found then
    raise exception 'You are not enrolled in this session';
  end if;

  select count(*)::int into remaining
  from public.bookings
  where slot_id = p_slot_id;

  if remaining = 0 and slot_status = 'booked' then
    update public.availability_slots
    set status = 'open'
    where id = p_slot_id;
  end if;
end;
$$;

grant execute on function public.cancel_enrollment(uuid) to authenticated;

create or replace function public.cancel_session(p_slot_id uuid, p_note text default '')
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_row public.availability_slots%rowtype;
  note_clean text;
  label text;
  body text;
  notified int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into slot_row
  from public.availability_slots
  where id = p_slot_id
  for update;

  if slot_row.id is null then
    raise exception 'Session not found';
  end if;

  if slot_row.tutor_id <> auth.uid() and not public.is_admin() then
    raise exception 'Only the session mentor (or an admin) can cancel it';
  end if;

  if slot_row.session_date < current_date then
    raise exception 'Past sessions cannot be cancelled';
  end if;

  if slot_row.status = 'cancelled' then
    raise exception 'Session already cancelled';
  end if;

  note_clean := trim(coalesce(p_note, ''));
  if char_length(note_clean) > 500 then
    raise exception 'Note too long';
  end if;

  label := nullif(trim(slot_row.time_note), '');
  if label is null then
    select string_agg(t.name, ', ' order by t.sort_order, t.name)
    into label
    from public.slot_topics st
    join public.topics t on t.id = st.topic_id
    where st.slot_id = p_slot_id;
  end if;
  if label is null then
    label := 'Session';
  end if;

  body :=
    'Your upcoming session on '
    || to_char(slot_row.session_date, 'Dy, Mon DD, YYYY')
    || ' (' || label || ') has been cancelled by your mentor. You are no longer expected to attend.';

  if note_clean <> '' then
    body := body || E'\n\nMentor note: ' || note_clean;
  end if;

  insert into public.mentor_messages (tutor_id, student_id, body)
  select slot_row.tutor_id, b.student_id, body
  from public.bookings b
  where b.slot_id = p_slot_id;

  get diagnostics notified = row_count;

  update public.availability_slots
  set status = 'cancelled'
  where id = p_slot_id;

  return notified;
end;
$$;

grant execute on function public.cancel_session(uuid, text) to authenticated;

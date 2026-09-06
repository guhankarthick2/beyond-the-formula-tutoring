-- Allow admins to create availability slots for any mentor (attribution / backfill).
drop policy if exists "slots_insert_admin" on public.availability_slots;
create policy "slots_insert_admin"
  on public.availability_slots for insert to authenticated
  with check (public.is_admin());

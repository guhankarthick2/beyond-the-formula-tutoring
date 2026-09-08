-- Sessions can tag multiple curated topics (empty set = "Any topic").

create table if not exists public.slot_topics (
  slot_id uuid not null references public.availability_slots (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete restrict,
  primary key (slot_id, topic_id)
);

create index if not exists slot_topics_topic_idx on public.slot_topics (topic_id);

-- Backfill from legacy single topic_id
insert into public.slot_topics (slot_id, topic_id)
select id, topic_id
from public.availability_slots
where topic_id is not null
on conflict do nothing;

alter table public.availability_slots drop column if exists topic_id;

alter table public.slot_topics enable row level security;

drop policy if exists "slot_topics_select" on public.slot_topics;
create policy "slot_topics_select"
  on public.slot_topics for select
  using (true);

drop policy if exists "slot_topics_insert" on public.slot_topics;
create policy "slot_topics_insert"
  on public.slot_topics for insert to authenticated
  with check (
    public.is_admin()
    or public.user_owns_slot(slot_id)
  );

drop policy if exists "slot_topics_delete" on public.slot_topics;
create policy "slot_topics_delete"
  on public.slot_topics for delete to authenticated
  using (
    public.is_admin()
    or public.user_owns_slot(slot_id)
  );

-- Separate live join (meeting_url) from post-session recording (recording_url).

alter table public.availability_slots
  add column if not exists recording_url text not null default ''
    check (char_length(recording_url) <= 500);

-- Move YouTube URLs that were stored as "meeting" into recording_url.
update public.availability_slots
set
  recording_url = meeting_url,
  meeting_url = ''
where meeting_url <> ''
  and public.youtube_video_id(meeting_url) is not null
  and (recording_url is null or btrim(recording_url) = '');

drop index if exists availability_slots_meeting_url_unique;

create unique index if not exists availability_slots_recording_url_unique
  on public.availability_slots (recording_url)
  where recording_url <> '';

create or replace function public.enforce_unique_meeting_recording()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_yt text;
  conflict_id uuid;
begin
  if new.recording_url is null or btrim(new.recording_url) = '' then
    return new;
  end if;

  new_yt := public.youtube_video_id(new.recording_url);

  if new_yt is not null then
    select s.id into conflict_id
    from public.availability_slots s
    where s.id is distinct from new.id
      and s.recording_url <> ''
      and public.youtube_video_id(s.recording_url) = new_yt
    limit 1;
  else
    select s.id into conflict_id
    from public.availability_slots s
    where s.id is distinct from new.id
      and lower(btrim(s.recording_url)) = lower(btrim(new.recording_url))
    limit 1;
  end if;

  if conflict_id is not null then
    raise exception 'This recording link is already attributed to another session'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists availability_slots_unique_recording on public.availability_slots;
create trigger availability_slots_unique_recording
  before insert or update of recording_url on public.availability_slots
  for each row execute function public.enforce_unique_meeting_recording();

create or replace function public.list_taken_recording_urls()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select recording_url
  from public.availability_slots
  where recording_url <> '';
$$;

grant execute on function public.list_taken_recording_urls() to authenticated;

-- Keep old RPC name as an alias so older clients do not break mid-deploy.
create or replace function public.list_taken_meeting_urls()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select recording_url
  from public.availability_slots
  where recording_url <> '';
$$;

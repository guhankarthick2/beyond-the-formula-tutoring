-- Prevent the same recording/meeting URL from being attached to multiple slots.
-- Exact URL uniqueness (empty URLs allowed on many live slots):
create unique index if not exists availability_slots_meeting_url_unique
  on public.availability_slots (meeting_url)
  where meeting_url <> '';

-- Same YouTube video under watch / embed / youtu.be / query variants:
create or replace function public.youtube_video_id(p_url text)
returns text
language plpgsql
immutable
as $$
declare
  u text := trim(coalesce(p_url, ''));
  id text;
begin
  if u = '' then
    return null;
  end if;

  id := substring(u from 'youtu\.be/([A-Za-z0-9_-]{11})');
  if id is not null then
    return id;
  end if;

  id := substring(u from '[?&]v=([A-Za-z0-9_-]{11})');
  if id is not null then
    return id;
  end if;

  id := substring(u from 'youtube\.com/(?:embed|shorts|live)/([A-Za-z0-9_-]{11})');
  if id is not null then
    return id;
  end if;

  return null;
end;
$$;

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
  if new.meeting_url is null or btrim(new.meeting_url) = '' then
    return new;
  end if;

  new_yt := public.youtube_video_id(new.meeting_url);

  if new_yt is not null then
    select s.id into conflict_id
    from public.availability_slots s
    where s.id is distinct from new.id
      and s.meeting_url <> ''
      and public.youtube_video_id(s.meeting_url) = new_yt
    limit 1;
  else
    select s.id into conflict_id
    from public.availability_slots s
    where s.id is distinct from new.id
      and lower(btrim(s.meeting_url)) = lower(btrim(new.meeting_url))
    limit 1;
  end if;

  if conflict_id is not null then
    raise exception 'This recording or meeting link is already attributed to another session'
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists availability_slots_unique_recording on public.availability_slots;
create trigger availability_slots_unique_recording
  before insert or update of meeting_url on public.availability_slots
  for each row execute function public.enforce_unique_meeting_recording();

-- So the attribution UI can hide already-used catalog recordings (including for mentors).
create or replace function public.list_taken_meeting_urls()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select meeting_url
  from public.availability_slots
  where meeting_url <> '';
$$;

grant execute on function public.list_taken_meeting_urls() to authenticated;

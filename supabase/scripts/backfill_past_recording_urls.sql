-- One-time backfill: past sessions that still store the recording in meeting_url.
-- Run in Supabase SQL Editor after 021_slot_recording_url.sql.
-- Safe to re-run: only touches rows with a non-empty meeting_url and empty recording_url.

-- 1) Preview what will move
select
  id,
  session_date,
  left(meeting_url, 80) as meeting_url,
  left(recording_url, 80) as recording_url,
  status
from public.availability_slots
where btrim(coalesce(meeting_url, '')) <> ''
  and btrim(coalesce(recording_url, '')) = ''
  and session_date < current_date
order by session_date desc;

-- 2) Spot duplicate recording URLs that would collide (fix these first if any)
select
  lower(btrim(meeting_url)) as url_key,
  public.youtube_video_id(meeting_url) as yt_id,
  count(*) as slots,
  array_agg(id) as slot_ids
from public.availability_slots
where btrim(coalesce(meeting_url, '')) <> ''
  and btrim(coalesce(recording_url, '')) = ''
  and session_date < current_date
group by 1, 2
having count(*) > 1;

-- 3) Move meeting_url → recording_url and clear join link on those past rows
update public.availability_slots
set
  recording_url = btrim(meeting_url),
  meeting_url = ''
where btrim(coalesce(meeting_url, '')) <> ''
  and btrim(coalesce(recording_url, '')) = ''
  and session_date < current_date;

-- 4) Confirm
select
  count(*) filter (where btrim(coalesce(recording_url, '')) <> '' and session_date < current_date) as past_with_recording,
  count(*) filter (where btrim(coalesce(meeting_url, '')) <> '' and session_date < current_date) as past_still_with_meeting
from public.availability_slots;

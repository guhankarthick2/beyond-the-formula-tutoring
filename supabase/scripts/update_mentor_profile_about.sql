-- Update mentor About + highlight stickers.
-- Run in Supabase SQL Editor AFTER 023_mentor_bio_len.sql.
-- Preview first, then run the update.

-- 1) Preview matching profiles
select
  id,
  display_name,
  mentor_slug,
  mentor_notes,
  left(mentor_bio, 120) as bio_preview
from public.profiles
where mentor_notes ilike '%ECRL%'
   or mentor_notes ilike '%board games with siblings%';

-- 2) Apply About + sticker edits
update public.profiles
set
  mentor_bio = $bio$I'm a junior at Plano West Senior High School in Plano, Texas. I enjoy solving difficult math problems across a wide range of topics, and I mentor in the hopes of inspiring other students to feel that same spark.

Here's a brief look at my philosophy on math. Excelling comes from understanding core concepts rather than memorizing formulas — and most importantly, from consistent practice. When students memorize a formula, direct problems feel easy. But when a question asks them to combine and apply multiple concepts, knowing a formula alone is not enough.

Practice is the single biggest factor in a student's success. By working a problem type from many angles, students are forced to grasp the underlying ideas and learn from their errors. Often, students who understand a concept but don't practice enough make computational slips or small oversights on test day and dismiss them as "silly mistakes." There is no such thing as a silly mistake. Labeling an error that way removes accountability and doesn't stop it from happening again. When students own their mistakes in practice, they remember them — and they don't repeat them on the test.

Another factor that often goes unnoticed is mindset: a student has to believe they can succeed in order to do so. It sounds cliché, but it makes an immense difference. When students say or think, even jokingly, "I'm not smart enough for this," they put a ceiling on what they can achieve — and taking that ceiling down is hard. Approach every problem with full effort, full presence, and the belief that you will solve it. Move on to a solution only after you truly feel you've given your best, then focus on learning from it. That doesn't mean you'll solve every problem you attempt — but you have to believe that you can.

Outside of math, I enjoy soccer, movies, and hanging out with friends.

I would be elated if this site helped even one person move closer to a goal they're chasing. I hope others join in and help build a truly supportive community.$bio$,
  mentor_notes = regexp_replace(
    regexp_replace(
      mentor_notes,
      '2025-2026 ECRL participant',
      'Dallas Cup Participant',
      'gi'
    ),
    'board games with siblings',
    '800 Math on SAT',
    'gi'
  )
where mentor_notes ilike '%ECRL%'
   or mentor_notes ilike '%board games with siblings%';

-- 3) Confirm
select
  id,
  display_name,
  mentor_slug,
  mentor_notes,
  char_length(mentor_bio) as bio_len
from public.profiles
where mentor_notes ilike '%Dallas Cup%'
   or mentor_notes ilike '%800 Math on SAT%';

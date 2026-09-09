import { SUBJECTS, subjectMaterialCount, subjectTestCount, type Subject } from '@/lib/subjects'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type SubjectLiveStats = {
  /** Inclusive of course-linked slots (non-cancelled). */
  upcoming: number
  /** Inclusive of course-linked slots (non-cancelled). */
  past: number
  courses: number
  openQuestions: number
}

export type SubjectHubStats = SubjectLiveStats & {
  materials: number
  tests: number
  recordings: number
}

const emptyLive = (): SubjectLiveStats => ({
  upcoming: 0,
  past: 0,
  courses: 0,
  openQuestions: 0,
})

export function staticSubjectStats(subject: Subject): Pick<
  SubjectHubStats,
  'materials' | 'tests' | 'recordings'
> {
  return {
    materials: subjectMaterialCount(subject),
    tests: subjectTestCount(subject),
    recordings: subject.recordings.filter((r) => Boolean(r.href)).length,
  }
}

export function hubStatsFor(subject: Subject, live: SubjectLiveStats): SubjectHubStats {
  return { ...live, ...staticSubjectStats(subject) }
}

export function totalSessions(stats: Pick<SubjectLiveStats, 'upcoming' | 'past'>) {
  return stats.upcoming + stats.past
}

/** Soft Coming soon when there is no session/course/catalog content yet. */
export function subjectLooksEmpty(
  stats: Pick<SubjectHubStats, 'upcoming' | 'past' | 'materials' | 'recordings' | 'courses'>,
) {
  return (
    stats.upcoming + stats.past + stats.materials + stats.recordings + stats.courses === 0
  )
}

export async function fetchAllSubjectLiveStats(): Promise<Record<string, SubjectLiveStats>> {
  const map: Record<string, SubjectLiveStats> = Object.fromEntries(
    SUBJECTS.map((s) => [s.slug, emptyLive()]),
  )

  if (!isSupabaseConfigured) return map

  const today = new Date().toISOString().slice(0, 10)

  const [slotsRes, coursesRes, questionsRes] = await Promise.all([
    supabase
      .from('availability_slots')
      .select('subject_slug, status, session_date, course_id')
      .neq('status', 'cancelled'),
    supabase.from('courses').select('subject_slug').eq('status', 'published'),
    supabase.from('stuck_questions').select('subject_slug').eq('status', 'open'),
  ])

  for (const row of (slotsRes.data as {
    subject_slug?: string
    status: string
    session_date: string
  }[]) ?? []) {
    const slug = row.subject_slug || 'precal'
    if (!map[slug]) continue
    if (row.session_date >= today) map[slug].upcoming += 1
    else map[slug].past += 1
  }

  for (const row of (coursesRes.data as { subject_slug: string }[]) ?? []) {
    if (map[row.subject_slug]) map[row.subject_slug].courses += 1
  }

  for (const row of (questionsRes.data as { subject_slug: string }[]) ?? []) {
    if (map[row.subject_slug]) map[row.subject_slug].openQuestions += 1
  }

  return map
}

export function countLabel(n: number, singular: string, plural = `${singular}s`) {
  if (n === 0) return `0 ${plural}`
  if (n === 1) return `1 ${singular}`
  return `${n} ${plural}`
}

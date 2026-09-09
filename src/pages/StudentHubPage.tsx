import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { SubjectMenu } from '@/components/SubjectMenu'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/hooks'
import { formatSlotTopics, SLOT_TOPICS_EMBED } from '@/lib/sessionTopics'
import { usePageView } from '@/lib/stats'
import { useSubject } from '@/lib/subject'
import {
  fetchAllSubjectLiveStats,
  hubStatsFor,
  subjectLooksEmpty,
  type SubjectLiveStats,
} from '@/lib/subjectStats'
import { getSubject } from '@/lib/subjects'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/types'

export function StudentHubPage() {
  usePageView('/students')

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student">
        <div className="badge-row">
          <span className="badge badge-green">Open to everyone</span>
        </div>
        <h1 className="page-title">Student hub</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Choose a subject to browse free resources and enroll in live sessions with a mentor. Every
          subject has the same tools — counts below show what is ready today.
        </p>
      </div>

      <div className="card-grid-spacer">
        <SubjectMenu getHref={(slug) => `/students/${slug}`} />
      </div>
    </section>
  )
}

function FeatureMeta({
  count,
  emptyHint,
  readyHint,
}: {
  count: number
  emptyHint: string
  readyHint: string
}) {
  return (
    <span className="hub-card-meta">
      {count === 0 ? (
        <>0 — {emptyHint}</>
      ) : (
        <>
          {count} {readyHint}
        </>
      )}
    </span>
  )
}

export function StudentSubjectPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)
  const { setSubjectSlug } = useSubject()
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingEnroll, setLoadingEnroll] = useState(Boolean(user && isSupabaseConfigured))
  const [live, setLive] = useState<SubjectLiveStats | null>(null)

  useEffect(() => {
    if (subjectSlug && getSubject(subjectSlug)) {
      setSubjectSlug(subjectSlug)
    }
  }, [subjectSlug, setSubjectSlug])

  useEffect(() => {
    if (!subject) return
    let mounted = true
    void fetchAllSubjectLiveStats().then((all) => {
      if (mounted) setLive(all[subject.slug] ?? null)
    })
    return () => {
      mounted = false
    }
  }, [subject])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setBookings([])
      setLoadingEnroll(false)
      return
    }

    let mounted = true
    ;(async () => {
      const { data } = await supabase
        .from('bookings')
        .select(
          `*, availability_slots(*, ${SLOT_TOPICS_EMBED}, profiles!availability_slots_tutor_id_fkey(display_name))`,
        )
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
      if (!mounted) return
      setBookings((data as Booking[]) ?? [])
      setLoadingEnroll(false)
    })()

    return () => {
      mounted = false
    }
  }, [user])

  usePageView(subject ? `/students/${subject.slug}` : '/students')

  if (!subject) {
    return <Navigate to="/students" replace />
  }

  const stats = hubStatsFor(
    subject,
    live ?? { upcoming: 0, past: 0, courses: 0, openQuestions: 0 },
  )
  const comingSoon = subjectLooksEmpty(stats)

  const today = new Date().toISOString().slice(0, 10)
  const activeBookings = bookings.filter((b) => b.availability_slots?.status !== 'cancelled')
  const upcoming = activeBookings
    .filter((b) => {
      const d = b.availability_slots?.session_date
      return d && d >= today
    })
    .sort((a, b) =>
      (a.availability_slots?.session_date ?? '').localeCompare(
        b.availability_slots?.session_date ?? '',
      ),
    )
  const attended = activeBookings.filter((b) => {
    const d = b.availability_slots?.session_date
    return d && d < today
  })
  const enrolled = activeBookings.length > 0
  const nextSession = upcoming[0]?.availability_slots
  const schedulePath = `/students/${subject.slug}/schedule`
  const resourcesPath = `/students/resources/${subject.slug}`
  const pastPath = `/students/${subject.slug}/past`
  const questionsPath = `/students/${subject.slug}/questions`
  const coursesPath = `/students/${subject.slug}/courses`
  const testPath = `/students/${subject.slug}/tests/unit-1`
  const hasTests = stats.tests > 0

  return (
    <section className="section">
      <PageBack to="/students" label="Back to student hub" />

      <div className="subject-hub-head">
        <div className="subject-hub-head-top">
          <div className="badge-row">
            <span className="badge badge-blue">{subject.name}</span>
            {enrolled && <span className="badge badge-green">Enrolled</span>}
            {comingSoon && <span className="badge">Coming soon</span>}
          </div>
          <h1>{subject.shortName}</h1>
        </div>
        <p className="subject-hub-desc">
          {subject.description}
          {comingSoon
            ? ' Content is still growing — counts below show what is ready now.'
            : null}
        </p>
      </div>

      <div className="card-grid cols-2 subject-hub-grid">
        <article className="card card-accent card-student stack">
          <div className="hub-card-head">
            <h3>Sessions &amp; courses</h3>
            <span className="hub-card-meta">
              {stats.courses + stats.upcoming + stats.past === 0 ? (
                <>0 sessions yet</>
              ) : (
                <>
                  {stats.courses > 0 && (
                    <>
                      {stats.courses} {stats.courses === 1 ? 'course' : 'courses'} ·{' '}
                    </>
                  )}
                  {stats.upcoming + stats.past}{' '}
                  {stats.upcoming + stats.past === 1 ? 'session' : 'sessions'}
                  {' · '}
                  {stats.upcoming} up · {stats.past} past
                </>
              )}
            </span>
          </div>
          <p className="hub-card-blurb">
            Bootcamps unlock every linked session; standalone live and past stay on the public lists.
          </p>
          <div className="btn-group">
            <Link className="btn btn-primary" to={coursesPath}>
              Browse courses
            </Link>
            <Link className="btn btn-secondary" to={schedulePath}>
              Live schedule
            </Link>
            <Link className="btn btn-secondary" to={pastPath}>
              Past sessions
            </Link>
          </div>
        </article>
        <article className="card card-accent card-student stack">
          <div className="hub-card-head">
            <h3>Open questions</h3>
            <FeatureMeta
              count={stats.openQuestions}
              emptyHint="be the first to ask"
              readyHint="open"
            />
          </div>
          <p className="hub-card-blurb">Ask anything in {subject.shortName}; mentors answer when they can.</p>
          <div className="btn-group">
            <Link className="btn btn-primary" to={questionsPath}>
              Ask or browse
            </Link>
          </div>
        </article>
        <article className="card stack">
          <div className="hub-card-head">
            <h3>Other materials</h3>
            <FeatureMeta
              count={stats.materials}
              emptyHint="none yet"
              readyHint={stats.materials === 1 ? 'material' : 'materials'}
            />
          </div>
          <p className="hub-card-blurb">Worksheets, notes, and extra practice.</p>
          <div className="btn-group">
            <Link className="btn btn-secondary" to={resourcesPath}>
              Browse materials
            </Link>
          </div>
        </article>
        <article className="card card-accent card-student stack">
          <div className="hub-card-head">
            <h3>Practice tests</h3>
            <FeatureMeta
              count={stats.tests}
              emptyHint="none yet"
              readyHint={stats.tests === 1 ? 'test' : 'tests'}
            />
          </div>
          <p className="hub-card-blurb">
            {hasTests ? 'Open assessments — no enrollment required.' : 'Tests will appear here when ready.'}
          </p>
          <div className="btn-group">
            {hasTests ? (
              <Link className="btn btn-primary" to={testPath}>
                Take a test
              </Link>
            ) : (
              <Link className="btn btn-secondary" to={resourcesPath}>
                Materials &amp; tests
              </Link>
            )}
          </div>
        </article>
      </div>

      {loadingEnroll && user ? (
        <p className="muted subject-hub-enroll">Loading your enrollment…</p>
      ) : enrolled ? (
        <div className="stack subject-hub-enroll">
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Current session schedule</h2>
            {upcoming.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No upcoming classes on your schedule.{' '}
                <Link to={schedulePath}>View schedule</Link> to enroll in another session.
              </p>
            ) : (
              <ul className="schedule-list">
                {upcoming.map((b) => {
                  const slot = b.availability_slots
                  return (
                    <li key={b.id}>
                      <strong>{slot ? formatDate(slot.session_date) : '—'}</strong>
                      {slot?.time_note ? ` · ${slot.time_note}` : ''}
                      {' — '}
                      {formatSlotTopics(slot, 'Session')}
                      {' · '}
                      {slot?.profiles?.display_name ?? 'Mentor'}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="stat-grid">
            <article className="stat-card stat-green">
              <p className="stat-value">{attended.length}</p>
              <p className="stat-label">Classes attended</p>
            </article>
            <article className="stat-card stat-amber">
              <p className="stat-value">{upcoming.length}</p>
              <p className="stat-label">Remaining</p>
            </article>
            <article className="stat-card stat-blue">
              <p className="stat-value">
                {nextSession
                  ? new Date(`${nextSession.session_date}T12:00:00`).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
              <p className="stat-label">Next class</p>
            </article>
          </div>

          {attended.length > 0 && (
            <div className="card stack">
              <h3>Classes attended</h3>
              <ul className="schedule-list">
                {attended.map((b) => {
                  const slot = b.availability_slots
                  return (
                    <li key={b.id}>
                      {slot ? formatDate(slot.session_date) : '—'}
                      {' — '}
                      {formatSlotTopics(slot, 'Session')}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="callout callout-info subject-hub-enroll">
          <strong>Not enrolled yet?</strong> Enroll from the schedule to see your current session,
          classes attended, and what is remaining.
          {!user && (
            <>
              {' '}
              <Link to="/auth">Sign in</Link> first to enroll.
            </>
          )}
        </div>
      )}
    </section>
  )
}

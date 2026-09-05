import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { SubjectMenu } from '@/components/SubjectMenu'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/hooks'
import { usePageView } from '@/lib/stats'
import { useSubject } from '@/lib/subject'
import { getSubject } from '@/lib/subjects'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/types'

export function StudentHubPage() {
  usePageView('/students')

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-green">Open to everyone</span>
        </div>
        <h1 className="page-title">Student hub</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Choose a subject to browse free resources and enroll in live sessions with a mentor.
        </p>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <SubjectMenu getHref={(slug) => `/students/${slug}`} />
      </div>
    </section>
  )
}

export function StudentSubjectPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)
  const { setSubjectSlug } = useSubject()
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingEnroll, setLoadingEnroll] = useState(Boolean(user && isSupabaseConfigured))

  useEffect(() => {
    if (subjectSlug && getSubject(subjectSlug)) {
      setSubjectSlug(subjectSlug)
    }
  }, [subjectSlug, setSubjectSlug])

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
          '*, availability_slots(*, topics(id, name), profiles!availability_slots_tutor_id_fkey(display_name))',
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

  const today = new Date().toISOString().slice(0, 10)
  const activeBookings = bookings.filter((b) => b.availability_slots?.status !== 'cancelled')
  const upcoming = activeBookings
    .filter((b) => {
      const d = b.availability_slots?.session_date
      return d && d >= today
    })
    .sort((a, b) =>
      (a.availability_slots?.session_date ?? '').localeCompare(b.availability_slots?.session_date ?? ''),
    )
  const attended = activeBookings.filter((b) => {
    const d = b.availability_slots?.session_date
    return d && d < today
  })
  const enrolled = activeBookings.length > 0
  const nextSession = upcoming[0]?.availability_slots
  const schedulePath = `/students/${subject.slug}/schedule`
  const resourcesPath = `/students/resources/${subject.slug}`
  const recordingsPath = `/students/${subject.slug}/recordings`
  const testPath = `/students/${subject.slug}/tests/unit-1`

  return (
    <section className="section">
      <PageBack to="/students" label="Back to student hub" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-blue">{subject.name}</span>
          {enrolled && <span className="badge badge-green">Enrolled</span>}
        </div>
        <h1 className="page-title">{subject.shortName}</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          {subject.description}
        </p>
      </div>

      <div className="card-grid cols-2" style={{ marginTop: '1.25rem' }}>
        <article className="card card-accent card-student stack">
          <h3>Enroll in a session</h3>
          <p>See upcoming {subject.shortName} sessions with mentors and enroll when you are ready.</p>
          <Link className="btn btn-primary" to={schedulePath}>
            View schedule
          </Link>
        </article>
        <article className="card stack">
          <h3>Session Recordings</h3>
          <p>Watch recorded {subject.shortName} lessons by topic — open the video for that topic.</p>
          <Link className="btn btn-secondary" to={recordingsPath}>
            Watch recordings
          </Link>
        </article>
        <article className="card stack">
          <h3>Other materials</h3>
          <p>Worksheets, notes, topic lists, and extra practice for {subject.shortName}.</p>
          <Link className="btn btn-secondary" to={resourcesPath}>
            Browse materials
          </Link>
        </article>
        <article className="card card-accent card-student stack">
          <h3>Want to take a test in {subject.shortName}?</h3>
          <p>Start the Unit 1 practice assessment — open to everyone, no enrollment required.</p>
          <Link className="btn btn-primary" to={testPath}>
            Take the PreCal test
          </Link>
        </article>
      </div>

      {loadingEnroll && user ? (
        <p className="muted" style={{ marginTop: '1.5rem' }}>
          Loading your enrollment…
        </p>
      ) : enrolled ? (
        <div className="stack" style={{ marginTop: '1.5rem' }}>
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
                      {slot?.topics?.name ?? 'Session'}
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
                      {slot?.topics?.name ?? 'Session'}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="callout callout-info" style={{ marginTop: '1.5rem' }}>
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

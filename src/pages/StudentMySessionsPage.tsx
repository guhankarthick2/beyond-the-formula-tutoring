import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { StatusPill } from '@/components/StatusPill'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/hooks'
import { usePageView } from '@/lib/stats'
import { supabase } from '@/lib/supabase'
import type {
  AvailabilitySlot,
  Booking,
  HomeworkCompletion,
  MentorMessage,
  SessionHomework,
} from '@/lib/types'

type HomeworkRow = SessionHomework & { completed?: boolean }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function slotLine(slot: AvailabilitySlot | null | undefined, mentorLabel?: string) {
  if (!slot) return null
  return (
    <>
      <strong>{formatDate(slot.session_date)}</strong>
      {slot.time_note ? ` · ${slot.time_note}` : ''}
      {' — '}
      {slot.topics?.name ?? 'Session'}
      {mentorLabel ? ` · ${mentorLabel}` : ''}
      {slot.meeting_url && (
        <>
          {' · '}
          <a href={slot.meeting_url} rel="noopener noreferrer">
            Join link
          </a>
        </>
      )}
    </>
  )
}

export function StudentMySessionsPage() {
  usePageView('/students/my-sessions')
  const { user, profile, isApprovedTutor } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tutoredSlots, setTutoredSlots] = useState<AvailabilitySlot[]>([])
  const [homework, setHomework] = useState<HomeworkRow[]>([])
  const [messages, setMessages] = useState<MentorMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const bookingsQ = supabase
      .from('bookings')
      .select(
        '*, availability_slots(*, topics(id, name), profiles!availability_slots_tutor_id_fkey(display_name))',
      )
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    const tutoredQ = supabase
      .from('availability_slots')
      .select('*, topics(id, name)')
      .eq('tutor_id', user.id)
      .neq('status', 'cancelled')
      .order('session_date', { ascending: false })

    const hwQ = supabase
      .from('session_homework')
      .select('*, availability_slots(session_date, topics(name))')
      .order('created_at', { ascending: false })

    const msgQ = supabase
      .from('mentor_messages')
      .select('*, tutor:profiles!mentor_messages_tutor_id_fkey(display_name)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const compQ = supabase.from('homework_completions').select('*').eq('student_id', user.id)

    const [bookRes, tutoredRes, hwRes, msgRes, compRes] = await Promise.all([
      bookingsQ,
      tutoredQ,
      hwQ,
      msgQ,
      compQ,
    ])

    const err =
      bookRes.error?.message ||
      tutoredRes.error?.message ||
      hwRes.error?.message ||
      msgRes.error?.message ||
      compRes.error?.message
    if (err) setError(err)

    const bookingRows = (bookRes.data as Booking[]) ?? []
    setBookings(bookingRows)
    setTutoredSlots((tutoredRes.data as AvailabilitySlot[]) ?? [])

    const slotIds = new Set(bookingRows.map((b) => b.slot_id))
    const completions = new Set(
      ((compRes.data as HomeworkCompletion[]) ?? []).map((c) => c.homework_id),
    )
    const hwRows = ((hwRes.data as SessionHomework[]) ?? [])
      .filter((h) => slotIds.has(h.slot_id))
      .map((h) => ({ ...h, completed: completions.has(h.id) }))
    setHomework(hwRows)
    setMessages((msgRes.data as MentorMessage[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleComplete(hw: HomeworkRow) {
    if (!user) return
    if (hw.completed) {
      await supabase
        .from('homework_completions')
        .delete()
        .eq('homework_id', hw.id)
        .eq('student_id', user.id)
    } else {
      await supabase.from('homework_completions').insert({ homework_id: hw.id, student_id: user.id })
    }
    await load()
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const today = todayIso()
  const upcomingAttending = bookings.filter((b) => {
    const d = b.availability_slots?.session_date
    return d && d >= today && b.availability_slots?.status !== 'cancelled'
  })
  const pastAttending = bookings.filter((b) => {
    const d = b.availability_slots?.session_date
    return d && d < today
  })

  const upcomingTutoring = tutoredSlots.filter((s) => s.session_date >= today)
  const pastTutoring = tutoredSlots.filter((s) => s.session_date < today)

  const attending = bookings.length > 0
  const tutoring = tutoredSlots.length > 0
  const hasAny = attending || tutoring

  const mentorName =
    upcomingAttending[0]?.availability_slots?.profiles?.display_name ??
    bookings[0]?.availability_slots?.profiles?.display_name

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          {attending && <span className="badge badge-green">Attending as student</span>}
          {tutoring && <span className="badge badge-violet">Tutoring as mentor</span>}
          {!hasAny && <span className="badge badge-amber">No sessions yet</span>}
          {mentorName && attending && (
            <span className="badge badge-blue">Your mentor: {mentorName}</span>
          )}
        </div>
        <h1 className="page-title">My sessions</h1>
        <p className="lead" style={{ margin: 0 }}>
          Hello, {profile?.display_name}. One account can both enroll in sessions and tutor others —
          this page lists both.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!hasAny && !loading && (
        <div className="callout callout-warn" style={{ marginTop: '1rem' }}>
          No sessions yet.{' '}
          <Link to="/students/schedule">Browse the schedule</Link> to enroll
          {isApprovedTutor ? (
            <>
              , or open the <Link to="/mentors/dashboard">mentor dashboard</Link> to publish sessions
              you will teach
            </>
          ) : null}
          .
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="card stack" style={{ marginTop: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>Sessions I&apos;m attending</h2>
            <p className="muted" style={{ margin: 0 }}>
              Sessions you enrolled in as a student.
            </p>
            {upcomingAttending.length === 0 && pastAttending.length === 0 ? (
              <div className="empty">
                None yet. <Link to="/students/schedule">Browse the schedule</Link> to enroll.
              </div>
            ) : (
              <>
                {upcomingAttending.length > 0 && (
                  <>
                    <h3 style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>Upcoming</h3>
                    <ul className="schedule-list">
                      {upcomingAttending.map((b) => (
                        <li key={b.id}>
                          {slotLine(
                            b.availability_slots,
                            b.availability_slots?.profiles?.display_name ?? 'Mentor',
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {pastAttending.length > 0 && (
                  <>
                    <h3 style={{ margin: '0.75rem 0 0', fontSize: '1rem' }}>Past</h3>
                    <ul className="schedule-list">
                      {pastAttending.map((b) => (
                        <li key={b.id}>
                          {slotLine(
                            b.availability_slots,
                            b.availability_slots?.profiles?.display_name ?? 'Mentor',
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>

          <div className="card stack" style={{ marginTop: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ margin: 0 }}>Sessions I&apos;m tutoring</h2>
              {isApprovedTutor && (
                <Link className="btn btn-secondary" to="/mentors/dashboard">
                  Mentor dashboard
                </Link>
              )}
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Sessions you published as a mentor (open or booked).
            </p>
            {upcomingTutoring.length === 0 && pastTutoring.length === 0 ? (
              <div className="empty">
                {isApprovedTutor ? (
                  <>
                    None yet. Publish a session from the{' '}
                    <Link to="/mentors/dashboard">mentor dashboard</Link>.
                  </>
                ) : (
                  <>
                    Become a mentor via the <Link to="/mentors">mentor portal</Link> to teach
                    sessions. You can still enroll as a student anytime.
                  </>
                )}
              </div>
            ) : (
              <>
                {upcomingTutoring.length > 0 && (
                  <>
                    <h3 style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>Upcoming</h3>
                    <ul className="schedule-list">
                      {upcomingTutoring.map((s) => (
                        <li key={s.id}>
                          {slotLine(s)}
                          {' · '}
                          <StatusPill status={s.status} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {pastTutoring.length > 0 && (
                  <>
                    <h3 style={{ margin: '0.75rem 0 0', fontSize: '1rem' }}>Past</h3>
                    <ul className="schedule-list">
                      {pastTutoring.map((s) => (
                        <li key={s.id}>
                          {slotLine(s)}
                          {' · '}
                          <StatusPill status={s.status} />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>

          <div className="section" style={{ marginBottom: 0 }}>
            <h2>Session homework</h2>
            <p className="muted">Homework for sessions you attend as a student.</p>
            {homework.length === 0 ? (
              <div className="empty">
                {attending
                  ? 'No homework posted yet — check back after your next session.'
                  : 'Homework appears here once you enroll in a session as a student.'}
              </div>
            ) : (
              <div className="card-grid cols-2">
                {homework.map((hw) => (
                  <article key={hw.id} className="card">
                    <h3 style={{ margin: '0 0 0.35rem' }}>{hw.title}</h3>
                    <p className="muted" style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                      {hw.availability_slots?.session_date
                        ? formatDate(hw.availability_slots.session_date)
                        : 'Session'}
                      {hw.due_date ? ` · Due ${formatDate(hw.due_date)}` : ''}
                    </p>
                    <p style={{ margin: '0 0 0.75rem', whiteSpace: 'pre-wrap' }}>{hw.body}</p>
                    <button
                      type="button"
                      className={`btn ${hw.completed ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => void toggleComplete(hw)}
                    >
                      {hw.completed ? 'Completed ✓' : 'Mark as complete'}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="section">
              <h2>Messages from your mentor</h2>
              <div className="stack">
                {messages.map((m) => (
                  <div key={m.id} className="callout callout-success">
                    <strong>{m.tutor?.display_name ?? 'Mentor'}:</strong> {m.body}
                    <span
                      className="muted"
                      style={{ display: 'block', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      {formatDate(m.created_at.slice(0, 10))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="section">
            <h3>Still available to you</h3>
            <div className="badge-row">
              <Link className="badge badge-green" to="/students/precal">
                Precal hub
              </Link>
              <Link className="badge badge-blue" to="/students/resources/precal">
                Free Resources
              </Link>
              {isApprovedTutor && (
                <Link className="badge badge-violet" to="/mentors/dashboard">
                  Mentor dashboard
                </Link>
              )}
              <a
                className="badge badge-amber"
                href="https://www.youtube.com/@beyondtheformulatutoring"
                rel="noopener noreferrer"
              >
                YouTube
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/hooks'
import { usePageView } from '@/lib/stats'
import { supabase } from '@/lib/supabase'
import type { Booking, HomeworkCompletion, MentorMessage, SessionHomework } from '@/lib/types'

type HomeworkRow = SessionHomework & { completed?: boolean }

export function StudentMySessionsPage() {
  usePageView('/students/my-sessions')
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
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

    const [bookRes, hwRes, msgRes, compRes] = await Promise.all([bookingsQ, hwQ, msgQ, compQ])

    const err =
      bookRes.error?.message || hwRes.error?.message || msgRes.error?.message || compRes.error?.message
    if (err) setError(err)

    const bookingRows = (bookRes.data as Booking[]) ?? []
    setBookings(bookingRows)

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
    return (
      <section className="section">
        <PageBack to="/" label="Back to home" />
        <h1 className="page-title">My sessions</h1>
        <p className="lead">
          <Link to="/auth">Sign in</Link> to see your schedule and homework after you enroll in a session.
        </p>
        <Link className="btn btn-secondary" to="/students/schedule">
          Browse sessions
        </Link>
      </section>
    )
  }

  const upcoming = bookings.filter((b) => {
    const d = b.availability_slots?.session_date
    return d && d >= new Date().toISOString().slice(0, 10)
  })

  const enrolled = bookings.length > 0
  const mentorName =
    upcoming[0]?.availability_slots?.profiles?.display_name ??
    bookings[0]?.availability_slots?.profiles?.display_name

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          {enrolled ? (
            <>
              <span className="badge badge-green">Enrolled</span>
              {mentorName && <span className="badge badge-blue">Mentor: {mentorName}</span>}
            </>
          ) : (
            <span className="badge badge-amber">Not enrolled yet</span>
          )}
        </div>
        <h1 className="page-title">My sessions</h1>
        <p className="lead" style={{ margin: 0 }}>
          Hello, {profile?.display_name}. You see everything in the public hub, plus session-specific
          content from your mentor.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!enrolled && !loading && (
        <div className="callout callout-warn" style={{ marginTop: '1rem' }}>
          You&apos;re not enrolled in a session yet.{' '}
          <Link to="/students/schedule">Browse the schedule</Link> to enroll — then your homework and
          mentor messages will appear here.
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="card stack" style={{ marginTop: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>Your upcoming schedule</h2>
            {upcoming.length === 0 ? (
              <div className="empty">No upcoming sessions. Browse the schedule to enroll.</div>
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
                      {slot?.meeting_url && (
                        <>
                          {' · '}
                          <a href={slot.meeting_url} rel="noopener noreferrer">
                            Join link
                          </a>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="section" style={{ marginBottom: 0 }}>
            <h2>Session homework</h2>
            {homework.length === 0 ? (
              <div className="empty">
                {enrolled
                  ? 'No homework posted yet — check back after your next session.'
                  : 'Homework appears here once you enroll in a session.'}
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
                    <span className="muted" style={{ display: 'block', fontSize: '0.85rem', marginTop: '0.25rem' }}>
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
              <a className="badge badge-amber" href="https://www.youtube.com/@beyondtheformulatutoring" rel="noopener noreferrer">
                YouTube
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

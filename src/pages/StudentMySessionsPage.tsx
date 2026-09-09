import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EphemeralChat } from '@/components/EphemeralChat'
import { PageBack } from '@/components/PageBack'
import { StatusPill } from '@/components/StatusPill'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/hooks'
import { useMessageInbox } from '@/lib/messageInbox'
import { formatSlotTopics, SLOT_TOPICS_EMBED } from '@/lib/sessionTopics'
import { usePageView } from '@/lib/stats'
import { supabase } from '@/lib/supabase'
import type {
  AvailabilitySlot,
  Booking,
  Course,
  CourseEnrollment,
  HomeworkCompletion,
  MentorMessage,
  SessionHomework,
  SessionRequest,
} from '@/lib/types'
import { coursePath } from '@/lib/courses'

type HomeworkRow = SessionHomework & { completed?: boolean }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function isRecordingUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')
  } catch {
    return /youtu\.be|youtube\.com/i.test(url)
  }
}

function slotLinkLabel(url: string, past: boolean) {
  if (isRecordingUrl(url)) return 'Watch Recording'
  if (past) return 'Session link'
  return 'Join link'
}

function slotLine(
  slot: AvailabilitySlot | null | undefined,
  opts?: { mentorLabel?: string; past?: boolean },
) {
  if (!slot) return null
  const past = opts?.past ?? slot.session_date < todayIso()
  return (
    <>
      <strong>{formatDate(slot.session_date)}</strong>
      {slot.time_note ? ` · ${slot.time_note}` : ''}
      {' — '}
      {formatSlotTopics(slot, 'Session')}
      {opts?.mentorLabel ? ` · ${opts.mentorLabel}` : ''}
      {slot.meeting_url && (
        <>
          {' · '}
          <a href={slot.meeting_url} rel="noopener noreferrer">
            {slotLinkLabel(slot.meeting_url, past)}
          </a>
        </>
      )}
    </>
  )
}

function pastSessionStatus(status: string) {
  if (status === 'cancelled') return 'cancelled'
  return 'completed'
}

export function StudentMySessionsPage() {
  usePageView('/students/my-sessions')
  const { user, profile, isApprovedTutor } = useAuth()
  const { refresh: refreshInbox } = useMessageInbox()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [courseEnrollments, setCourseEnrollments] = useState<
    (CourseEnrollment & { courses?: Course | null })[]
  >([])
  const [tutoredSlots, setTutoredSlots] = useState<AvailabilitySlot[]>([])
  const [homework, setHomework] = useState<HomeworkRow[]>([])
  const [messages, setMessages] = useState<MentorMessage[]>([])
  const [myRequests, setMyRequests] = useState<SessionRequest[]>([])
  const [chatKey, setChatKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const bookingsQ = supabase
      .from('bookings')
      .select(
        `*, availability_slots(*, ${SLOT_TOPICS_EMBED}, profiles!availability_slots_tutor_id_fkey(display_name), courses(id, title, slug, subject_slug))`,
      )
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    const coursesQ = supabase
      .from('course_enrollments')
      .select('*, courses(*)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    const tutoredQ = supabase
      .from('availability_slots')
      .select(`*, ${SLOT_TOPICS_EMBED}, courses(id, title, slug, subject_slug)`)
      .eq('tutor_id', user.id)
      .neq('status', 'cancelled')
      .order('session_date', { ascending: false })

    const hwQ = supabase
      .from('session_homework')
      .select(`*, availability_slots(session_date, ${SLOT_TOPICS_EMBED})`)
      .order('created_at', { ascending: false })

    const msgQ = supabase
      .from('mentor_messages')
      .select('*, tutor:profiles!mentor_messages_tutor_id_fkey(display_name)')
      .eq('student_id', user.id)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    const compQ = supabase.from('homework_completions').select('*').eq('student_id', user.id)

    const myReqQ = supabase
      .from('session_requests')
      .select(
        '*, topics(id, name), tutor:profiles!session_requests_claimed_by_fkey(display_name)',
      )
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    const [bookRes, courseRes, tutoredRes, hwRes, msgRes, compRes, myReqRes] = await Promise.all([
      bookingsQ,
      coursesQ,
      tutoredQ,
      hwQ,
      msgQ,
      compQ,
      myReqQ,
    ])

    const err =
      bookRes.error?.message ||
      courseRes.error?.message ||
      tutoredRes.error?.message ||
      hwRes.error?.message ||
      msgRes.error?.message ||
      compRes.error?.message ||
      myReqRes.error?.message
    if (err) setError(err)

    const bookingRows = (bookRes.data as Booking[]) ?? []
    setBookings(bookingRows)
    setCourseEnrollments(
      (courseRes.data as (CourseEnrollment & { courses?: Course | null })[]) ?? [],
    )
    setTutoredSlots((tutoredRes.data as AvailabilitySlot[]) ?? [])
    setMyRequests((myReqRes.data as SessionRequest[]) ?? [])

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

  async function dismissMessage(id: string) {
    setError(null)
    const { error: err } = await supabase.rpc('dismiss_mentor_message', { p_message_id: id })
    if (err) {
      setError(err.message)
      return
    }
    setMessages((prev) => prev.filter((m) => m.id !== id))
    await refreshInbox()
  }

  async function cancelEnrollment(slotId: string) {
    if (
      !confirm(
        'Cancel your enrollment in this upcoming session? The seat will open for another student if no one else is enrolled.',
      )
    ) {
      return
    }
    setCancelBusyId(slotId)
    setError(null)
    const { error: err } = await supabase.rpc('cancel_enrollment', { p_slot_id: slotId })
    setCancelBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    await load()
  }

  async function acceptRequest(id: string) {
    setError(null)
    const { error: err } = await supabase.rpc('accept_request', { p_request_id: id })
    if (err) {
      setError(err.message)
      return
    }
    setChatKey(`request:${id}`)
    await load()
  }

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
  const standaloneBookings = bookings.filter((b) => !b.availability_slots?.course_id)
  const upcomingAttending = standaloneBookings.filter((b) => {
    const d = b.availability_slots?.session_date
    return d && d >= today && b.availability_slots?.status !== 'cancelled'
  })
  const pastAttending = standaloneBookings.filter((b) => {
    const d = b.availability_slots?.session_date
    return d && d < today
  })

  const courseGroups = courseEnrollments
    .map((en) => {
      const course = en.courses
      if (!course) return null
      const sessions = bookings
        .filter((b) => b.availability_slots?.course_id === course.id)
        .map((b) => b.availability_slots)
        .filter(Boolean) as AvailabilitySlot[]
      sessions.sort((a, b) => a.session_date.localeCompare(b.session_date))
      return { enrollment: en, course, sessions }
    })
    .filter(Boolean) as {
    enrollment: CourseEnrollment & { courses?: Course | null }
    course: Course
    sessions: AvailabilitySlot[]
  }[]

  const standaloneTutoring = tutoredSlots.filter((s) => !s.course_id)
  const tutoringByCourse = new Map<string, { course: NonNullable<AvailabilitySlot['courses']>; sessions: AvailabilitySlot[] }>()
  for (const s of tutoredSlots) {
    if (!s.course_id || !s.courses) continue
    const existing = tutoringByCourse.get(s.course_id)
    if (existing) existing.sessions.push(s)
    else tutoringByCourse.set(s.course_id, { course: s.courses, sessions: [s] })
  }

  const upcomingTutoring = standaloneTutoring.filter((s) => s.session_date >= today)
  const pastTutoring = standaloneTutoring.filter((s) => s.session_date < today)

  const attending = bookings.length > 0 || courseEnrollments.length > 0
  const tutoring = tutoredSlots.length > 0
  const hasAny = attending || tutoring

  const mentorName =
    upcomingAttending[0]?.availability_slots?.profiles?.display_name ??
    bookings[0]?.availability_slots?.profiles?.display_name

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student">
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
          <Link to="/students">Browse the schedule</Link> to enroll, or{' '}
          <Link to="/request">request a session</Link> for a topic and date you need
          {isApprovedTutor ? (
            <>
              , or open <Link to="/mentors/dashboard">Workspace</Link> to publish sessions you will
              teach
            </>
          ) : null}
          .
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          {courseGroups.length > 0 && (
            <div className="card stack">
              <h2 style={{ margin: 0 }}>Courses I&apos;m enrolled in</h2>
              <p className="muted" style={{ margin: 0 }}>
                Mid-course enroll is fine — past recordings unlock with the rest of the program.
              </p>
              {courseGroups.map(({ course, sessions }) => (
                <article key={course.id} className="card" style={{ boxShadow: 'none' }}>
                  <h3 style={{ margin: '0 0 0.35rem' }}>
                    <Link to={coursePath(course.subject_slug, course.slug)}>{course.title}</Link>
                  </h3>
                  {sessions.length === 0 ? (
                    <p className="muted" style={{ margin: 0 }}>
                      No sessions linked yet.
                    </p>
                  ) : (
                    <ul className="schedule-list">
                      {sessions.map((slot) => (
                        <li key={slot.id}>
                          {slotLine(slot, {
                            mentorLabel: slot.profiles?.display_name ?? 'Mentor',
                            past: slot.session_date < today,
                          })}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}

          <div className="card stack">
            <h2 style={{ margin: 0 }}>Sessions I&apos;m attending</h2>
            <p className="muted" style={{ margin: 0 }}>
              Standalone sessions (not part of a course). You can cancel upcoming enrollments anytime.
            </p>
            {upcomingAttending.length === 0 && pastAttending.length === 0 ? (
              <div className="empty">
                None yet. <Link to="/students">Browse the schedule</Link> or{' '}
                <Link to="/students/precal/courses">courses</Link>.
              </div>
            ) : (
              <>
                {upcomingAttending.length > 0 && (
                  <>
                    <h3 style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>Upcoming</h3>
                    <ul className="schedule-list">
                      {upcomingAttending.map((b) => (
                        <li key={b.id}>
                          {slotLine(b.availability_slots, {
                            mentorLabel: b.availability_slots?.profiles?.display_name ?? 'Mentor',
                            past: false,
                          })}
                          {' · '}
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={cancelBusyId === b.slot_id}
                            onClick={() => void cancelEnrollment(b.slot_id)}
                          >
                            {cancelBusyId === b.slot_id ? 'Cancelling…' : 'Cancel enrollment'}
                          </button>
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
                          {slotLine(b.availability_slots, {
                            mentorLabel: b.availability_slots?.profiles?.display_name ?? 'Mentor',
                            past: true,
                          })}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>

          <div className="card stack">
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
                  Workspace
                </Link>
              )}
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Sessions you published as a mentor. Course-linked sessions are grouped under their
              bootcamp.
            </p>
            {tutoringByCourse.size > 0 && (
              <div className="stack">
                {[...tutoringByCourse.values()].map(({ course, sessions }) => (
                  <article key={course.id} className="card" style={{ boxShadow: 'none' }}>
                    <h3 style={{ margin: '0 0 0.35rem' }}>
                      <Link to={coursePath(course.subject_slug, course.slug)}>{course.title}</Link>
                    </h3>
                    <ul className="schedule-list">
                      {sessions
                        .slice()
                        .sort((a, b) => a.session_date.localeCompare(b.session_date))
                        .map((s) => (
                          <li key={s.id}>
                            {slotLine(s, { past: s.session_date < today })}
                            {' · '}
                            <StatusPill status={pastSessionStatus(s.status)} />
                          </li>
                        ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
            {upcomingTutoring.length === 0 && pastTutoring.length === 0 && tutoringByCourse.size === 0 ? (
              <div className="empty">
                {isApprovedTutor ? (
                  <>
                    None yet. Publish a session from <Link to="/mentors/dashboard">Workspace</Link>.
                  </>
                ) : (
                  <>
                    <Link to="/mentors/join">Apply to become a mentor</Link> to teach sessions. You
                    can still enroll as a student anytime.
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
                          {slotLine(s, { past: false })}
                          {' · '}
                          <StatusPill status={s.status} />
                          {s.status !== 'cancelled' && (
                            <>
                              {' · '}
                              <Link to="/mentors/dashboard">Manage / cancel</Link>
                            </>
                          )}
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
                          {slotLine(s, { past: true })}
                          {' · '}
                          <StatusPill status={pastSessionStatus(s.status)} />
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
              <p className="muted" style={{ margin: '0 0 0.75rem' }}>
                New notes stay here until you dismiss them.
              </p>
              <div className="stack">
                {messages.map((m) => (
                  <div key={m.id} className="callout callout-success">
                    <strong>{m.tutor?.display_name ?? 'Mentor'}:</strong> {m.body}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.5rem',
                      }}
                    >
                      <span className="muted" style={{ fontSize: '0.85rem' }}>
                        {formatDate(m.created_at.slice(0, 10))}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void dismissMessage(m.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card stack">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2 style={{ margin: 0 }}>Your session requests</h2>
              <Link className="btn btn-secondary" to="/request">
                Request a session
              </Link>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              Ask for a curated topic and preferred date when the public schedule does not fit.
              Mentors can claim and propose a time.
            </p>
            {myRequests.length === 0 ? (
              <div className="empty">
                None yet. <Link to="/request">Request a session</Link>.
              </div>
            ) : (
              <div className="stack">
                {myRequests.map((r) => (
                  <div key={r.id} className="card" style={{ boxShadow: 'none' }}>
                    <p style={{ margin: 0 }}>
                      <strong>
                        {formatDate(r.preferred_date)} — {r.topics?.name}
                      </strong>{' '}
                      <StatusPill status={r.status} />
                    </p>
                    {r.status === 'claimed' && (
                      <>
                        <p className="muted">
                          Tutor {r.tutor?.display_name} proposed{' '}
                          {r.proposed_date ? formatDate(r.proposed_date) : 'a time'}
                          {r.proposed_time_note ? ` (${r.proposed_time_note})` : ''}.
                        </p>
                        <div className="split-actions">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => void acceptRequest(r.id)}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setChatKey(`request:${r.id}`)}
                          >
                            Chat
                          </button>
                        </div>
                      </>
                    )}
                    {r.status === 'booked' && (
                      <div className="split-actions">
                        {r.meeting_url && (
                          <a
                            className="btn btn-primary"
                            href={r.meeting_url}
                            rel="noopener noreferrer"
                          >
                            Join link
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setChatKey(`request:${r.id}`)}
                        >
                          Chat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {chatKey && (
            <div className="card">
              <EphemeralChat channelName={chatKey} />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginTop: '0.75rem' }}
                onClick={() => setChatKey(null)}
              >
                Close chat
              </button>
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
              <Link className="badge badge-blue" to="/request">
                Request a session
              </Link>
              {isApprovedTutor && (
                <Link className="badge badge-violet" to="/mentors/dashboard">
                  Workspace
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

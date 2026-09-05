import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { SubjectSelect } from '@/components/SubjectSelect'
import { useAuth } from '@/lib/auth'
import { StatusPill } from '@/components/StatusPill'
import { formatDate, useTopics } from '@/lib/hooks'
import { usePageView } from '@/lib/stats'
import { useSubject } from '@/lib/subject'
import { getSubject } from '@/lib/subjects'
import { supabase } from '@/lib/supabase'
import type { AvailabilitySlot } from '@/lib/types'
import { EphemeralChat } from '@/components/EphemeralChat'

export function SessionsPage() {
  const { subjectSlug } = useParams<{ subjectSlug?: string }>()
  const subject = subjectSlug ? getSubject(subjectSlug) : null
  const { setSubjectSlug } = useSubject()

  useEffect(() => {
    if (subjectSlug && getSubject(subjectSlug)) {
      setSubjectSlug(subjectSlug)
    }
  }, [subjectSlug, setSubjectSlug])

  usePageView(subject ? `/students/${subject.slug}/schedule` : '/students/schedule')

  if (subjectSlug && !subject) {
    return <Navigate to="/students" replace />
  }

  return <SessionsContent subject={subject ?? undefined} />
}

function SessionsContent({ subject }: { subject?: ReturnType<typeof getSubject> }) {
  const { user } = useAuth()
  const { topics } = useTopics()
  const [topicFilter, setTopicFilter] = useState('')
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [chatSlotId, setChatSlotId] = useState<string | null>(null)

  const hubPath = subject ? `/students/${subject.slug}` : '/students'
  const resourcesPath = subject ? `/students/resources/${subject.slug}` : '/students/resources'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('availability_slots')
      .select('*, topics(id, name, slug), profiles!availability_slots_tutor_id_fkey(display_name)')
      .eq('status', 'open')
      .gte('session_date', new Date().toISOString().slice(0, 10))
      .order('session_date')

    if (topicFilter) {
      query = query.or(`topic_id.eq.${topicFilter},topic_id.is.null`)
    }

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setSlots((data as AvailabilitySlot[]) ?? [])
    setLoading(false)
  }, [topicFilter])

  useEffect(() => {
    void load()
  }, [load])

  async function enroll(slotId: string) {
    if (!user) return
    setError(null)
    const { data, error: err } = await supabase.rpc('book_slot', { p_slot_id: slotId })
    if (err) {
      setError(err.message)
      return
    }
    setBookingId(data as string)
    setChatSlotId(slotId)
    await load()
  }

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-green">Public schedule</span>
          {subject && <span className="badge badge-blue">{subject.name}</span>}
        </div>
        <h1 className="page-title">
          {subject ? `${subject.shortName} sessions` : 'Upcoming sessions'}
        </h1>
        <p className="lead" style={{ margin: 0 }}>
          Browse mentor sessions — no account needed to view.{' '}
          <Link to={hubPath}>Back to {subject?.shortName ?? 'student'} hub</Link>
          {' · '}
          <Link to={resourcesPath}>Free Resources</Link>
        </p>
        {subject && (
          <div className="subject-toolbar">
            <SubjectSelect id="subject-select-schedule" mode="schedule" />
          </div>
        )}
      </div>

      {!user && (
        <div className="callout callout-info" style={{ marginTop: '1rem' }}>
          <Link to="/auth">Sign in</Link> to enroll and unlock My Sessions + homework.
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <label>
          Filter by topic
          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
            <option value="">All topics (includes “Any topic” slots)</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {bookingId && (
        <div className="alert alert-ok" style={{ marginBottom: '1rem' }}>
          Enrolled! View your schedule in{' '}
          <Link to="/students/my-sessions">My Sessions</Link>. Use chat below to coordinate.
        </div>
      )}

      {loading ? (
        <p className="muted">Loading sessions…</p>
      ) : slots.length === 0 ? (
        <div className="empty">
          No open sessions right now.{' '}
          <Link to={resourcesPath}>Browse free resources</Link> while you wait.
        </div>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Topic</th>
                <th>Mentor</th>
                <th>Time note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const topicLabel = slot.topics?.name ?? 'Any topic'
                return (
                  <tr key={slot.id}>
                    <td>
                      {formatDate(slot.session_date)}
                      <div>
                        <StatusPill status={slot.status} />
                      </div>
                    </td>
                    <td>{topicLabel}</td>
                    <td>{slot.profiles?.display_name ?? 'Mentor'}</td>
                    <td>{slot.time_note || '—'}</td>
                    <td>
                      {user ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void enroll(slot.id)}
                        >
                          Enroll
                        </button>
                      ) : (
                        <Link className="btn btn-secondary" to="/auth">
                          Sign in to enroll
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {chatSlotId && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <EphemeralChat channelName={`slot:${chatSlotId}`} title="Session chat" />
        </div>
      )}
    </section>
  )
}

/** Legacy /students/schedule → subject schedule or picker */
export function ScheduleRedirect() {
  const { subject } = useSubject()
  if (subject) {
    return <Navigate to={`/students/${subject.slug}/schedule`} replace />
  }
  return <Navigate to="/students" replace />
}

import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { useAuth } from '@/lib/auth'
import { formatDate } from '@/lib/hooks'
import { formatSlotTopics, SLOT_TOPICS_EMBED, slotTopicNames } from '@/lib/sessionTopics'
import { usePageView } from '@/lib/stats'
import { getSubject } from '@/lib/subjects'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { AvailabilitySlot } from '@/lib/types'

type PastSlot = AvailabilitySlot & {
  enrolled?: boolean
}

export function PastSessionsPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)
  const { user } = useAuth()
  const [slots, setSlots] = useState<PastSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  usePageView(subject ? `/students/${subject.slug}/past` : '/students')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSlots([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const today = new Date().toISOString().slice(0, 10)

    const { data, error: err } = await supabase
      .from('availability_slots')
      .select(
        `*, ${SLOT_TOPICS_EMBED}, profiles!availability_slots_tutor_id_fkey(display_name)`,
      )
      .eq('status', 'booked')
      .lt('session_date', today)
      .order('session_date', { ascending: false })

    if (err) {
      setError(err.message)
      setSlots([])
      setLoading(false)
      return
    }

    let rows = (data as PastSlot[]) ?? []

    if (user) {
      const ids = rows.map((s) => s.id)
      if (ids.length > 0) {
        const { data: mine } = await supabase
          .from('bookings')
          .select('slot_id')
          .eq('student_id', user.id)
          .in('slot_id', ids)
        const enrolled = new Set((mine ?? []).map((b) => b.slot_id as string))
        rows = rows.map((s) => ({ ...s, enrolled: enrolled.has(s.id) }))
      }
    }

    setSlots(rows)
    setLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  async function enroll(slotId: string) {
    if (!user) return
    setBusyId(slotId)
    setError(null)
    const { error: err } = await supabase.rpc('book_slot', { p_slot_id: slotId })
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    await load()
  }

  if (!subject) {
    return <Navigate to="/students" replace />
  }

  const schedulePath = `/students/${subject.slug}/schedule`
  const authNext = `/auth?next=${encodeURIComponent(`/students/${subject.slug}/past`)}`

  return (
    <section className="section">
      <PageBack to={`/students/${subject.slug}`} label={`Back to ${subject.shortName}`} />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-blue">{subject.name}</span>
        </div>
        <h1 className="page-title">Past sessions</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Browse completed {subject.shortName} sessions and who taught them. Sign in and enroll to
          unlock the recording and other session artifacts.
        </p>
      </div>

      <div className="callout callout-warn" style={{ marginTop: '1.25rem' }}>
        <strong>Sign up to watch.</strong> Titles and mentors are public. Enroll in a past session
        (free) to open its recording and any homework or materials attached to that session.
        {!user && (
          <>
            {' '}
            <Link to={authNext}>Sign in or create an account</Link> to get started.
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginTop: '1.25rem' }}>
        {loading ? (
          <p className="muted" style={{ margin: 0 }}>
            Loading past sessions…
          </p>
        ) : slots.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No past sessions published yet. When mentors add completed sessions, they will appear
            here.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Session</th>
                  <th>Mentor</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => {
                  const topicNames = slotTopicNames(s)
                  const label = s.time_note || formatSlotTopics(s, 'Session')
                  const mentor = s.profiles?.display_name ?? 'Mentor'
                  const hasRecording = Boolean(s.meeting_url?.trim())
                  return (
                    <tr key={s.id}>
                      <td>{formatDate(s.session_date)}</td>
                      <td>
                        <strong>{label}</strong>
                        {topicNames.length > 0 && s.time_note ? (
                          <span className="muted" style={{ display: 'block', fontSize: '0.85rem' }}>
                            {topicNames.join(', ')}
                          </span>
                        ) : null}
                      </td>
                      <td>{mentor}</td>
                      <td>
                        {s.enrolled ? (
                          hasRecording ? (
                            <a
                              className="btn btn-secondary"
                              href={s.meeting_url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              Watch recording
                            </a>
                          ) : (
                            <span className="muted">Enrolled · artifacts coming soon</span>
                          )
                        ) : user ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={busyId === s.id}
                            onClick={() => void enroll(s.id)}
                          >
                            {busyId === s.id ? 'Enrolling…' : 'Enroll to unlock'}
                          </button>
                        ) : (
                          <Link className="btn btn-primary" to={authNext}>
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
      </div>

      <p className="muted" style={{ marginTop: '1rem' }}>
        Looking for a live class?{' '}
        <Link to={schedulePath}>View the {subject.shortName} schedule</Link>
        {user ? (
          <>
            {' · '}
            <Link to="/students/my-sessions">My sessions</Link>
          </>
        ) : null}
        .
      </p>
    </section>
  )
}

/** Old recordings URL → past sessions */
export function RecordingsRedirect() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  if (!subjectSlug) return <Navigate to="/students" replace />
  return <Navigate to={`/students/${subjectSlug}/past`} replace />
}

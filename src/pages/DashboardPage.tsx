import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EphemeralChat } from '@/components/EphemeralChat'
import { useAuth } from '@/lib/auth'
import { StatusPill } from '@/components/StatusPill'
import { formatDate, useTopics } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { AvailabilitySlot, Booking, SessionRequest } from '@/lib/types'

export function DashboardPage() {
  const { user, profile, isApprovedTutor } = useAuth()
  const { topics } = useTopics()
  const [mySlots, setMySlots] = useState<AvailabilitySlot[]>([])
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [openRequests, setOpenRequests] = useState<SessionRequest[]>([])
  const [myRequests, setMyRequests] = useState<SessionRequest[]>([])
  const [claimedByMe, setClaimedByMe] = useState<SessionRequest[]>([])
  const [error, setError] = useState<string | null>(null)
  const [chatKey, setChatKey] = useState<string | null>(null)

  // New availability form
  const [sessionDate, setSessionDate] = useState('')
  const [topicId, setTopicId] = useState('')
  const [anyTopic, setAnyTopic] = useState(false)
  const [timeNote, setTimeNote] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')

  // Claim form
  const [claimId, setClaimId] = useState<string | null>(null)
  const [proposedDate, setProposedDate] = useState('')
  const [proposedNote, setProposedNote] = useState('')
  const [claimMeeting, setClaimMeeting] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setError(null)

    const slotsQ = supabase
      .from('availability_slots')
      .select('*, topics(id, name)')
      .eq('tutor_id', user.id)
      .order('session_date', { ascending: false })

    const bookingsQ = supabase
      .from('bookings')
      .select(
        '*, availability_slots(*, topics(id, name), profiles!availability_slots_tutor_id_fkey(display_name))',
      )
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    const myReqQ = supabase
      .from('session_requests')
      .select(
        '*, topics(id, name), tutor:profiles!session_requests_claimed_by_fkey(display_name)',
      )
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    const openReqQ = supabase
      .from('session_requests')
      .select(
        '*, topics(id, name), student:profiles!session_requests_student_id_fkey(display_name)',
      )
      .eq('status', 'open')
      .order('preferred_date')

    const claimedQ = supabase
      .from('session_requests')
      .select(
        '*, topics(id, name), student:profiles!session_requests_student_id_fkey(display_name)',
      )
      .eq('claimed_by', user.id)
      .order('updated_at', { ascending: false })

    const [slots, bookings, myReq, openReq, claimed] = await Promise.all([
      slotsQ,
      bookingsQ,
      myReqQ,
      openReqQ,
      claimedQ,
    ])

    const firstErr =
      slots.error?.message ||
      bookings.error?.message ||
      myReq.error?.message ||
      openReq.error?.message ||
      claimed.error?.message
    if (firstErr) setError(firstErr)

    setMySlots((slots.data as AvailabilitySlot[]) ?? [])
    setMyBookings((bookings.data as Booking[]) ?? [])
    setMyRequests((myReq.data as SessionRequest[]) ?? [])
    setOpenRequests((openReq.data as SessionRequest[]) ?? [])
    setClaimedByMe((claimed.data as SessionRequest[]) ?? [])
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  async function addAvailability(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const { error: err } = await supabase.from('availability_slots').insert({
      tutor_id: user.id,
      topic_id: anyTopic ? null : topicId,
      session_date: sessionDate,
      time_note: timeNote.trim(),
      meeting_url: meetingUrl.trim(),
      status: 'open',
    })
    if (err) {
      setError(err.message)
      return
    }
    setTimeNote('')
    setMeetingUrl('')
    await load()
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault()
    if (!claimId) return
    const { error: err } = await supabase.rpc('claim_request', {
      p_request_id: claimId,
      p_proposed_date: proposedDate,
      p_proposed_time_note: proposedNote,
      p_meeting_url: claimMeeting,
    })
    if (err) {
      setError(err.message)
      return
    }
    setClaimId(null)
    await load()
  }

  async function acceptRequest(id: string) {
    const { error: err } = await supabase.rpc('accept_request', { p_request_id: id })
    if (err) {
      setError(err.message)
      return
    }
    setChatKey(`request:${id}`)
    await load()
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <section className="section">
      <h1 className="page-title">Dashboard</h1>
      <p className="lead">
        Hello, {profile?.display_name}. Email stays private. Use display names only in chat.
      </p>
      {error && <div className="alert alert-error">{error}</div>}

      {isApprovedTutor && (
        <div className="card stack" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Post availability</h2>
          <p className="muted" style={{ margin: 0 }}>
            Example: Aug 25, 2026 — Polynomials, or Aug 25, 2026 — Any topic.
          </p>
          <form className="form" onSubmit={(e) => void addAvailability(e)}>
            <label>
              Date
              <input
                required
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={anyTopic} onChange={(e) => setAnyTopic(e.target.checked)} />
              <span>Open to any curated topic</span>
            </label>
            {!anyTopic && (
              <label>
                Topic
                <select required value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                  <option value="">Select</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Time note
              <input
                value={timeNote}
                onChange={(e) => setTimeNote(e.target.value)}
                maxLength={120}
                placeholder="e.g. 4–5pm ET or flexible"
              />
            </label>
            <label>
              Meeting link (shown after booking)
              <input
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                maxLength={500}
                placeholder="https://…"
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Publish slot
            </button>
          </form>

          <h3>Your slots</h3>
          {mySlots.length === 0 ? (
            <div className="empty">No slots yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Chat</th>
                  </tr>
                </thead>
                <tbody>
                  {mySlots.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDate(s.session_date)}</td>
                      <td>{s.topics?.name ?? 'Any topic'}</td>
                      <td>
                        <StatusPill status={s.status} />
                      </td>
                      <td>
                        {s.status === 'booked' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setChatKey(`slot:${s.id}`)}
                          >
                            Open chat
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card stack" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Your bookings</h2>
        {myBookings.length === 0 ? (
          <div className="empty">
            No bookings yet. <Link to="/sessions">Browse sessions</Link>.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Topic</th>
                  <th>Tutor</th>
                  <th>Meeting</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => {
                  const slot = b.availability_slots
                  return (
                    <tr key={b.id}>
                      <td>{slot ? formatDate(slot.session_date) : '—'}</td>
                      <td>{slot?.topics?.name ?? 'Any topic'}</td>
                      <td>{slot?.profiles?.display_name ?? 'Tutor'}</td>
                      <td>
                        {slot?.meeting_url ? (
                          <a href={slot.meeting_url} rel="noopener noreferrer">
                            Join link
                          </a>
                        ) : (
                          'Ask in chat'
                        )}
                      </td>
                      <td>
                        {slot && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setChatKey(`slot:${slot.id}`)}
                          >
                            Chat
                          </button>
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

      <div className="card stack" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Your session requests</h2>
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
                      <button type="button" className="btn btn-primary" onClick={() => void acceptRequest(r.id)}>
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
                      <a className="btn btn-primary" href={r.meeting_url} rel="noopener noreferrer">
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

      {isApprovedTutor && (
        <div className="card stack" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Open student requests</h2>
          {openRequests.length === 0 ? (
            <div className="empty">No open requests.</div>
          ) : (
            <div className="stack">
              {openRequests.map((r) => (
                <div key={r.id} className="card" style={{ boxShadow: 'none' }}>
                  <p style={{ margin: 0 }}>
                    <strong>
                      {formatDate(r.preferred_date)} — {r.topics?.name}
                    </strong>
                  </p>
                  <p className="muted" style={{ margin: '0.35rem 0' }}>
                    Student: {r.student?.display_name}
                    {r.watched_recording ? ' · watched recording' : ''}
                  </p>
                  {r.note && <p style={{ margin: '0 0 0.5rem' }}>{r.note}</p>}
                  <button type="button" className="btn btn-primary" onClick={() => setClaimId(r.id)}>
                    Claim & propose time
                  </button>
                </div>
              ))}
            </div>
          )}

          {claimId && (
            <form className="form" onSubmit={(e) => void claim(e)}>
              <h3>Propose time</h3>
              <label>
                Date
                <input
                  required
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                />
              </label>
              <label>
                Time note
                <input value={proposedNote} onChange={(e) => setProposedNote(e.target.value)} maxLength={120} />
              </label>
              <label>
                Meeting link
                <input value={claimMeeting} onChange={(e) => setClaimMeeting(e.target.value)} maxLength={500} />
              </label>
              <div className="split-actions">
                <button className="btn btn-primary" type="submit">
                  Send proposal
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setClaimId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {claimedByMe.length > 0 && (
            <>
              <h3>Your claimed / booked requests</h3>
              <div className="stack">
                {claimedByMe.map((r) => (
                  <div key={r.id} className="card" style={{ boxShadow: 'none' }}>
                    <p style={{ margin: 0 }}>
                      {r.topics?.name} · <StatusPill status={r.status} /> · {r.student?.display_name}
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setChatKey(`request:${r.id}`)}
                    >
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {chatKey && (
        <div className="card">
          <EphemeralChat channelName={chatKey} />
          <button type="button" className="btn btn-ghost" style={{ marginTop: '0.75rem' }} onClick={() => setChatKey(null)}>
            Close chat
          </button>
        </div>
      )}
    </section>
  )
}

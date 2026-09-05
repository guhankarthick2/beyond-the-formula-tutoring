import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { formatDate, useTopics } from '@/lib/hooks'
import { usePageView } from '@/lib/stats'
import { supabase } from '@/lib/supabase'
import type { AvailabilitySlot, RosterStudent } from '@/lib/types'
import { StatusPill } from '@/components/StatusPill'

export function MentorDashboardPage() {
  usePageView('/mentors/dashboard')
  const { user, profile, isApprovedTutor } = useAuth()
  const { topics } = useTopics()
  const [mySlots, setMySlots] = useState<AvailabilitySlot[]>([])
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [sessionDate, setSessionDate] = useState('')
  const [topicId, setTopicId] = useState('')
  const [anyTopic, setAnyTopic] = useState(false)
  const [timeNote, setTimeNote] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')

  const [msgStudentId, setMsgStudentId] = useState('')
  const [msgBody, setMsgBody] = useState('')

  const [hwSlotId, setHwSlotId] = useState('')
  const [hwTitle, setHwTitle] = useState('')
  const [hwBody, setHwBody] = useState('')
  const [hwDue, setHwDue] = useState('')

  const load = useCallback(async () => {
    if (!user || !isApprovedTutor) return
    setError(null)

    const slotsRes = await supabase
      .from('availability_slots')
      .select('*, topics(id, name)')
      .eq('tutor_id', user.id)
      .order('session_date', { ascending: false })

    if (slotsRes.error) {
      setError(slotsRes.error.message)
      return
    }

    const slots = (slotsRes.data as AvailabilitySlot[]) ?? []
    setMySlots(slots)

    const slotIds = slots.map((s) => s.id)
    if (slotIds.length === 0) {
      setRoster([])
      return
    }

    const rosterRes = await supabase
      .from('bookings')
      .select(
        'student_id, slot_id, profiles!bookings_student_id_fkey(id, display_name), availability_slots(session_date, topics(name))',
      )
      .in('slot_id', slotIds)

    if (rosterRes.error) setError(rosterRes.error.message)
    else if (rosterRes.data) {
      const rows: RosterStudent[] = []
      for (const row of rosterRes.data) {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        const slot = Array.isArray(row.availability_slots)
          ? row.availability_slots[0]
          : row.availability_slots
        if (!profile) continue
        const topicRaw = slot?.topics as { name?: string } | { name?: string }[] | null | undefined
        const topicName = Array.isArray(topicRaw) ? topicRaw[0]?.name : topicRaw?.name
        rows.push({
          id: profile.id,
          display_name: profile.display_name,
          slot_id: row.slot_id,
          session_date: slot?.session_date ?? '',
          topic_name: topicName ?? 'Session',
        })
      }
      setRoster(rows)
    }
  }, [user, isApprovedTutor])

  useEffect(() => {
    void load()
  }, [load])

  async function addSession(e: React.FormEvent) {
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
    if (err) setError(err.message)
    else {
      setOk('Session published to the public schedule.')
      setTimeNote('')
      setMeetingUrl('')
      await load()
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !msgStudentId || !msgBody.trim()) return
    const { error: err } = await supabase.from('mentor_messages').insert({
      tutor_id: user.id,
      student_id: msgStudentId,
      body: msgBody.trim(),
    })
    if (err) setError(err.message)
    else {
      setOk('Message sent.')
      setMsgBody('')
      setMsgStudentId('')
    }
  }

  async function postHomework(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !hwSlotId) return
    const { error: err } = await supabase.from('session_homework').insert({
      slot_id: hwSlotId,
      tutor_id: user.id,
      title: hwTitle.trim(),
      body: hwBody.trim(),
      due_date: hwDue || null,
    })
    if (err) setError(err.message)
    else {
      setOk('Homework posted for enrolled students.')
      setHwTitle('')
      setHwBody('')
      setHwDue('')
      setHwSlotId('')
    }
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (!isApprovedTutor) {
    return (
      <section className="section">
        <h1 className="page-title">Mentor dashboard</h1>
        <div className="callout callout-warn">
          {profile?.tutor_status === 'pending' ? (
            <>Your interest form is pending review. Guhan will approve you soon.</>
          ) : (
            <>
              Submit the <Link to="/mentors">mentor interest form</Link> first.
            </>
          )}
        </div>
      </section>
    )
  }

  const uniqueStudents = Array.from(
    new Map(roster.map((r) => [r.id, r])).values(),
  )

  const bookedSlots = mySlots.filter((s) => s.status === 'booked' || s.status === 'open')

  return (
    <section className="section">
      <div className="page-banner page-banner-mentor">
        <div className="badge-row">
          <span className="badge badge-violet">Approved mentor</span>
        </div>
        <h1 className="page-title">Mentor dashboard</h1>
        <p className="lead" style={{ margin: 0 }}>
          Hello, {profile?.display_name}. Manage sessions, your student roster, homework, and outreach.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}

      <div className="card-grid cols-2" style={{ marginTop: '1.25rem' }}>
        <article className="card stack">
          <h2 style={{ margin: 0 }}>My students</h2>
          <p className="muted" style={{ margin: 0 }}>
            Students appear here when they enroll in your sessions.
          </p>
          {uniqueStudents.length === 0 ? (
            <div className="empty">No students yet — publish a session on the schedule.</div>
          ) : (
            <ul className="schedule-list">
              {uniqueStudents.map((s) => (
                <li key={s.id}>
                  <strong>{s.display_name}</strong>
                  {s.session_date ? ` · ${formatDate(s.session_date)} — ${s.topic_name}` : ''}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card stack">
          <h2 style={{ margin: 0 }}>Reach out</h2>
          <p className="muted" style={{ margin: 0 }}>
            Send a message to a student on your roster — reminders, feedback, or session links.
          </p>
          <form className="form" onSubmit={(e) => void sendMessage(e)}>
            <label>
              Student
              <select
                required
                value={msgStudentId}
                onChange={(e) => setMsgStudentId(e.target.value)}
              >
                <option value="">Select student</option>
                {uniqueStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Message
              <textarea
                required
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                maxLength={2000}
                placeholder="Great work today — review the notes before Friday."
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={uniqueStudents.length === 0}>
              Send message
            </button>
          </form>
        </article>
      </div>

      <div className="card stack" style={{ marginTop: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Create session</h2>
        <p className="muted" style={{ margin: 0 }}>
          Adds a new session to the public schedule for students to browse and enroll.
        </p>
        <form className="form" onSubmit={(e) => void addSession(e)}>
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
              placeholder="e.g. 4–5pm ET"
            />
          </label>
          <label>
            Meeting link (shown after enrollment)
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              maxLength={500}
              placeholder="https://…"
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Publish session
          </button>
        </form>
      </div>

      <div className="card stack" style={{ marginTop: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Post homework</h2>
        <p className="muted" style={{ margin: 0 }}>
          Visible only to students enrolled in the selected session.
        </p>
        <form className="form" onSubmit={(e) => void postHomework(e)}>
          <label>
            Session
            <select required value={hwSlotId} onChange={(e) => setHwSlotId(e.target.value)}>
              <option value="">Select session</option>
              {bookedSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.session_date)} — {s.topics?.name ?? 'Any topic'} ({s.status})
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input required value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} maxLength={120} />
          </label>
          <label>
            Instructions
            <textarea required value={hwBody} onChange={(e) => setHwBody(e.target.value)} maxLength={4000} />
          </label>
          <label>
            Due date (optional)
            <input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={bookedSlots.length === 0}>
            Post homework
          </button>
        </form>
      </div>

      <div className="card stack" style={{ marginTop: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Your sessions</h2>
        {mySlots.length === 0 ? (
          <div className="empty">No sessions yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Topic</th>
                  <th>Status</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

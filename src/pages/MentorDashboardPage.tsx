import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EphemeralChat } from '@/components/EphemeralChat'
import { RecordingsCarousel, recordingItemsFromSlots } from '@/components/RecordingsCarousel'
import { useAuth } from '@/lib/auth'
import { formatDate, useTopics } from '@/lib/hooks'
import { questionPath, useOpenQuestionsInbox } from '@/lib/openQuestionsInbox'
import { coursePath } from '@/lib/courses'
import { usePageView } from '@/lib/stats'
import { SUBJECTS, catalogRecordings } from '@/lib/subjects'
import { recordingUrlsConflict } from '@/lib/sessionLinks'
import { slotDisplayStatus } from '@/lib/slotStatus'
import { formatSlotTopics, replaceSlotTopics, SLOT_TOPICS_EMBED } from '@/lib/sessionTopics'
import { supabase } from '@/lib/supabase'
import type { AvailabilitySlot, RosterStudent, SessionRequest } from '@/lib/types'
import { StatusPill } from '@/components/StatusPill'
import {
  MENTOR_NOTES_FIELD_MAX,
  mentorProfilePath,
  serializeMentorNotes,
  slugifyMentorName,
} from '@/lib/mentors'

type SessionMode = 'upcoming' | 'past'

export function MentorDashboardPage() {
  usePageView('/mentors/dashboard')
  const { user, profile, isApprovedTutor, refreshProfile } = useAuth()
  const { openQuestions, openCount, dismiss } = useOpenQuestionsInbox()
  const { topics } = useTopics()
  const recordings = useMemo(() => catalogRecordings(), [])
  const [mySlots, setMySlots] = useState<AvailabilitySlot[]>([])
  const [takenRecordingUrls, setTakenRecordingUrls] = useState<string[]>([])
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [sessionMode, setSessionMode] = useState<SessionMode>('upcoming')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionSubject, setSessionSubject] = useState('precal')
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [timeNote, setTimeNote] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [recordingKey, setRecordingKey] = useState('')

  const [pubSlug, setPubSlug] = useState('')
  const [pubBio, setPubBio] = useState('')
  const [pubFocus, setPubFocus] = useState('')
  const [pubNotes, setPubNotes] = useState('')
  const [pubPublic, setPubPublic] = useState(false)
  const [pubBusy, setPubBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    setPubSlug(profile.mentor_slug ?? slugifyMentorName(profile.display_name))
    setPubBio(profile.mentor_bio ?? '')
    setPubFocus(profile.mentor_focus ?? '')
    setPubNotes(profile.mentor_notes ?? '')
    setPubPublic(Boolean(profile.mentor_public))
  }, [profile])

  async function savePublicProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setPubBusy(true)
    setError(null)
    setOk(null)
    const slug = pubSlug.trim().toLowerCase() || null
    const { error: err } = await supabase
      .from('profiles')
      .update({
        mentor_slug: slug,
        mentor_bio: pubBio.trim(),
        mentor_focus: pubFocus.trim(),
        mentor_notes: serializeMentorNotes(pubNotes),
        mentor_public: pubPublic,
      })
      .eq('id', user.id)
    setPubBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setOk(
      pubPublic
        ? 'Public profile published on Mentors.'
        : 'Public profile saved (hidden until you publish).',
    )
    await refreshProfile()
  }

  const availableRecordings = useMemo(
    () =>
      recordings.filter(
        (r) => !r.href || !takenRecordingUrls.some((u) => recordingUrlsConflict(r.href!, u)),
      ),
    [recordings, takenRecordingUrls],
  )
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({})

  const [msgStudentId, setMsgStudentId] = useState('')
  const [msgBody, setMsgBody] = useState('')

  const [hwSlotId, setHwSlotId] = useState('')
  const [hwTitle, setHwTitle] = useState('')
  const [hwBody, setHwBody] = useState('')
  const [hwDue, setHwDue] = useState('')

  const [openRequests, setOpenRequests] = useState<SessionRequest[]>([])
  const [claimedByMe, setClaimedByMe] = useState<SessionRequest[]>([])
  const [claimId, setClaimId] = useState<string | null>(null)
  const [proposedDate, setProposedDate] = useState('')
  const [proposedNote, setProposedNote] = useState('')
  const [claimMeeting, setClaimMeeting] = useState('')
  const [chatKey, setChatKey] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const load = useCallback(async () => {
    if (!user || !isApprovedTutor) return
    setError(null)

    const slotsRes = await supabase
      .from('availability_slots')
      .select(`*, ${SLOT_TOPICS_EMBED}, courses(id, title, slug, subject_slug)`)
      .eq('tutor_id', user.id)
      .order('session_date', { ascending: false })

    if (slotsRes.error) {
      setError(slotsRes.error.message)
      return
    }

    const slots = (slotsRes.data as AvailabilitySlot[]) ?? []
    setMySlots(slots)
    setLinkDrafts(
      Object.fromEntries(
        slots.map((s) => [
          s.id,
          s.session_date <= today ? (s.recording_url ?? '') : (s.meeting_url ?? ''),
        ]),
      ),
    )

    const takenRes = await supabase.rpc('list_taken_recording_urls')
    if (!takenRes.error && takenRes.data) {
      setTakenRecordingUrls(takenRes.data as string[])
    } else {
      const legacy = await supabase.rpc('list_taken_meeting_urls')
      if (!legacy.error && legacy.data) {
        setTakenRecordingUrls(legacy.data as string[])
      } else {
        setTakenRecordingUrls(slots.map((s) => s.recording_url).filter(Boolean))
      }
    }

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

    const [openReq, claimed] = await Promise.all([openReqQ, claimedQ])
    if (openReq.error) setError(openReq.error.message)
    else setOpenRequests((openReq.data as SessionRequest[]) ?? [])
    if (claimed.error) setError(claimed.error.message)
    else setClaimedByMe((claimed.data as SessionRequest[]) ?? [])

    const slotIds = slots.map((s) => s.id)
    if (slotIds.length === 0) {
      setRoster([])
      return
    }

    const rosterRes = await supabase
      .from('bookings')
      .select(
        `student_id, slot_id, profiles!bookings_student_id_fkey(id, display_name), availability_slots(session_date, ${SLOT_TOPICS_EMBED})`,
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
        rows.push({
          id: profile.id,
          display_name: profile.display_name,
          slot_id: row.slot_id,
          session_date: slot?.session_date ?? '',
          topic_name: formatSlotTopics(slot as unknown as Pick<AvailabilitySlot, 'slot_topics'>, 'Session'),
        })
      }
      setRoster(rows)
    }
  }, [user, isApprovedTutor, today])

  useEffect(() => {
    void load()
  }, [load])

  function pickRecording(key: string) {
    setRecordingKey(key)
    if (!key) return
    const rec = availableRecordings.find((r) => `${r.subjectSlug}:${r.slug}` === key)
    if (!rec) return
    setMeetingUrl(rec.href ?? '')
    setTimeNote(rec.name)
  }

  async function assertRecordingUrlAvailable(url: string, excludeSlotId?: string) {
    if (!url.trim()) return null
    const hit = mySlots.find(
      (s) => s.id !== excludeSlotId && recordingUrlsConflict(url, s.recording_url ?? ''),
    )
    if (hit) {
      return 'That recording is already linked to one of your sessions.'
    }
    const taken = takenRecordingUrls.find((u) => recordingUrlsConflict(url, u))
    if (taken) {
      const stillMine = mySlots.some(
        (s) => s.id === excludeSlotId && recordingUrlsConflict(url, s.recording_url ?? ''),
      )
      if (!stillMine) {
        return 'That recording is already linked to another session. Ask an admin to remove the existing past session if it should be reassigned.'
      }
    }
    return null
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault()
    if (!claimId) return
    setError(null)
    setOk(null)
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
    setProposedDate('')
    setProposedNote('')
    setClaimMeeting('')
    setOk('Proposal sent — waiting for the student to accept.')
    await load()
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const isPast = sessionMode === 'past'
    const url = meetingUrl.trim()
    if (isPast && url) {
      const conflict = await assertRecordingUrlAvailable(url)
      if (conflict) {
        setError(conflict)
        return
      }
    }
    const { data, error: err } = await supabase
      .from('availability_slots')
      .insert({
        tutor_id: user.id,
        session_date: sessionDate,
        subject_slug: sessionSubject,
        time_note: timeNote.trim(),
        meeting_url: isPast ? '' : url,
        recording_url: isPast ? url : '',
        status: isPast ? 'booked' : 'open',
      })
      .select('id')
      .single()
    if (err) {
      setError(
        err.message.includes('already attributed')
          ? 'That recording link is already used on another past session.'
          : err.message,
      )
    } else {
      const { error: topicErr } = await replaceSlotTopics((data as { id: string }).id, topicIds)
      if (topicErr) {
        setError(topicErr)
        return
      }
      setOk(
        isPast
          ? 'Past session saved — students can enroll to unlock the recording.'
          : 'Session published to the public schedule.',
      )
      setTimeNote('')
      setMeetingUrl('')
      setRecordingKey('')
      setSessionDate('')
      setTopicIds([])
      await load()
    }
  }

  async function saveSessionLink(slotId: string, mode: 'upcoming' | 'past' | 'cancelled') {
    const url = (linkDrafts[slotId] ?? '').trim()
    if (mode === 'past' && url) {
      const conflict = await assertRecordingUrlAvailable(url, slotId)
      if (conflict) {
        setError(conflict)
        return
      }
    }
    const patch =
      mode === 'past' ? { recording_url: url } : { meeting_url: url }
    const { error: err } = await supabase
      .from('availability_slots')
      .update(patch)
      .eq('id', slotId)
      .eq('tutor_id', user!.id)
    if (err) {
      setError(
        err.message.includes('already attributed')
          ? 'That recording link is already used on another past session.'
          : err.message,
      )
    } else {
      setOk(mode === 'past' ? 'Recording link updated.' : 'Join link updated.')
      await load()
    }
  }

  async function markBooked(slotId: string) {
    const { error: err } = await supabase
      .from('availability_slots')
      .update({ status: 'booked' })
      .eq('id', slotId)
      .eq('tutor_id', user!.id)
    if (err) setError(err.message)
    else {
      setOk('Session marked as completed.')
      await load()
    }
  }

  async function cancelSession(slot: AvailabilitySlot) {
    const label = slot.time_note || formatSlotTopics(slot)
    const note = window.prompt(
      `Cancel your upcoming session on ${formatDate(slot.session_date)} (${label})?\n\nOptional note for enrolled students (or leave blank):`,
      '',
    )
    if (note === null) return

    setError(null)
    const { data, error: err } = await supabase.rpc('cancel_session', {
      p_slot_id: slot.id,
      p_note: note.trim(),
    })
    if (err) {
      setError(err.message)
      return
    }
    const notified = typeof data === 'number' ? data : 0
    setOk(
      notified === 0
        ? 'Session cancelled. No students were enrolled yet.'
        : `Session cancelled. Notified ${notified} enrolled student${notified === 1 ? '' : 's'}.`,
    )
    await load()
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
        <h1 className="page-title">Workspace</h1>
        <div className="callout callout-warn">
          {profile?.tutor_status === 'pending' ? (
            <>Your interest form is pending review. An admin will approve you soon.</>
          ) : (
            <>
              Submit the <Link to="/mentors/join">mentor interest form</Link> first.
            </>
          )}
        </div>
      </section>
    )
  }

  const uniqueStudents = Array.from(new Map(roster.map((r) => [r.id, r])).values())

  const bookedSlots = mySlots.filter((s) => s.status === 'booked' || s.status === 'open')
  const upcomingSlots = mySlots.filter(
    (s) => s.status !== 'cancelled' && s.session_date >= today,
  )
  const pastSlots = mySlots.filter(
    (s) => s.status !== 'cancelled' && s.session_date < today,
  )
  const cancelledSlots = mySlots.filter((s) => s.status === 'cancelled')

  const courseRecordingGroups = useMemo(() => {
    const map = new Map<
      string,
      { course: NonNullable<AvailabilitySlot['courses']>; sessions: AvailabilitySlot[] }
    >()
    for (const s of mySlots) {
      if (!s.course_id || !s.courses || !s.recording_url?.trim()) continue
      const existing = map.get(s.course_id)
      if (existing) existing.sessions.push(s)
      else map.set(s.course_id, { course: s.courses, sessions: [s] })
    }
    return [...map.values()].map(({ course, sessions }) => ({
      course,
      items: recordingItemsFromSlots(sessions),
    }))
  }, [mySlots])

  return (
    <section className="section">
      <div className="page-banner page-banner-mentor">
        <div className="badge-row">
          <span className="badge badge-violet">Approved mentor</span>
        </div>
        <h1 className="page-title">Workspace</h1>
        <p className="lead" style={{ margin: 0 }}>
          Hello, {profile?.display_name}. Manage live and past sessions, recordings for enrolled
          students, homework, and outreach.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}

      <form
        className="card form stack"
        onSubmit={(e) => void savePublicProfile(e)}
      >
        <h2 style={{ margin: 0 }}>Public profile (Mentors)</h2>
        <p className="muted" style={{ margin: 0 }}>
          Words-first — no photo. Students see this on{' '}
          <Link to="/mentors">Mentors</Link>
          {profile?.mentor_public && profile.mentor_slug ? (
            <>
              {' '}
              · <Link to={mentorProfilePath(profile.mentor_slug)}>Your page</Link>
            </>
          ) : null}
          .
        </p>
        <label>
          Slug
          <input
            required={pubPublic}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            maxLength={60}
            value={pubSlug}
            onChange={(e) => setPubSlug(e.target.value)}
          />
        </label>
        <label>
          Focus
          <input
            maxLength={160}
            value={pubFocus}
            onChange={(e) => setPubFocus(e.target.value)}
            placeholder="Precalculus · AP-style problem solving"
          />
        </label>
        <label>
          About you
          <textarea
            maxLength={1200}
            rows={5}
            value={pubBio}
            onChange={(e) => setPubBio(e.target.value)}
            placeholder="In your own words — why you mentor, what you enjoy teaching…"
          />
        </label>
        <label>
          Highlights (one per line)
          <textarea
            maxLength={MENTOR_NOTES_FIELD_MAX}
            rows={5}
            value={pubNotes}
            onChange={(e) => setPubNotes(e.target.value)}
            placeholder={'Founder — Beyond The Formula\nJunior — Plano West Senior High\nVarsity Soccer'}
          />
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Short personal notes beside your bio (up to 8 lines, ~72 characters each).
          </span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={pubPublic}
            onChange={(e) => setPubPublic(e.target.checked)}
          />
          <span>Publish on Mentors</span>
        </label>
        <button className="btn btn-primary" type="submit" disabled={pubBusy}>
          {pubBusy ? 'Saving…' : 'Save public profile'}
        </button>
      </form>

      <div id="open-questions" className="card stack">
        <h2 style={{ margin: 0 }}>
          Open questions{openCount > 0 ? ` (${openCount})` : ''}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Students waiting for help. Open a thread to join the conversation; dismiss if you will not
          take it (other mentors still see it).
        </p>
        {openQuestions.length === 0 ? (
          <div className="empty">No open questions right now.</div>
        ) : (
          <div className="stack">
            {openQuestions.map((q) => (
              <article key={q.id} className="card" style={{ boxShadow: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      <Link to={questionPath(q)}>{q.title}</Link>
                    </h3>
                    <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
                      {q.subject_slug || 'precal'}
                      {q.profiles?.display_name ? ` · ${q.profiles.display_name}` : ''} ·{' '}
                      {formatDate(q.created_at.slice(0, 10))}
                    </p>
                  </div>
                  <div className="split-actions">
                    <Link className="btn btn-primary" to={questionPath(q)}>
                      Open
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void dismiss(q.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div id="open-requests" className="card stack">
        <h2 style={{ margin: 0 }}>
          Open student requests{openRequests.length > 0 ? ` (${openRequests.length})` : ''}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Students asking for a topic and date when the public schedule does not fit. Claim to
          propose a time.
        </p>
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
                  Claim &amp; propose time
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
              <input
                value={proposedNote}
                onChange={(e) => setProposedNote(e.target.value)}
                maxLength={120}
              />
            </label>
            <label>
              Meeting link
              <input
                value={claimMeeting}
                onChange={(e) => setClaimMeeting(e.target.value)}
                maxLength={500}
              />
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
            <h3 style={{ margin: '0.5rem 0 0' }}>Your claimed / booked requests</h3>
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

      <div className="card-grid cols-2">
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

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Create session</h2>
        <p className="muted" style={{ margin: 0 }}>
          Publish an upcoming live session, or add a past session so students can browse it and enroll
          to unlock the recording and other artifacts.
        </p>
        <div className="split-actions" role="group" aria-label="Session type">
          <button
            type="button"
            className={`btn ${sessionMode === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSessionMode('upcoming')}
          >
            Upcoming live
          </button>
          <button
            type="button"
            className={`btn ${sessionMode === 'past' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSessionMode('past')}
          >
            Past session
          </button>
        </div>
        <form className="form" onSubmit={(e) => void addSession(e)}>
          <label>
            Subject
            <select
              required
              value={sessionSubject}
              onChange={(e) => setSessionSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              required
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              min={sessionMode === 'upcoming' ? today : undefined}
              max={sessionMode === 'past' ? today : undefined}
            />
          </label>
          <fieldset className="topic-checklist">
            <legend>Topics (optional — leave empty for any topic)</legend>
            <div className="topic-checklist-grid">
              {topics.map((t) => (
                <label key={t.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={topicIds.includes(t.id)}
                    onChange={() =>
                      setTopicIds((prev) =>
                        prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                      )
                    }
                  />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {sessionMode === 'past' && (
            <label>
              Catalog recording (optional)
              <select value={recordingKey} onChange={(e) => pickRecording(e.target.value)}>
                <option value="">
                  {availableRecordings.length === 0
                    ? 'All catalog recordings are already on a past session'
                      : 'Paste a URL below, or pick one…'}
                </option>
                {availableRecordings.map((r) => (
                  <option key={`${r.subjectSlug}:${r.slug}`} value={`${r.subjectSlug}:${r.slug}`}>
                    {r.subjectName}: {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {sessionMode === 'past' ? 'Label / time note' : 'Time note'}
            <input
              value={timeNote}
              onChange={(e) => setTimeNote(e.target.value)}
              maxLength={120}
              placeholder={sessionMode === 'past' ? 'e.g. Topics 1.1–1.3' : 'e.g. 4–5pm ET'}
            />
          </label>
          <label>
            {sessionMode === 'past' ? 'Recording URL' : 'Join link (shown after enrollment)'}
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              maxLength={500}
              placeholder={
                sessionMode === 'past' ? 'https://youtube.com/… or other recording link' : 'https://zoom.us/…'
              }
              required={sessionMode === 'past'}
            />
          </label>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            {sessionMode === 'past'
              ? 'YouTube links embed on My sessions; other URLs open externally. Join links are not shown on past sessions.'
              : 'Use Zoom/Meet here. Add the recording later from Past sessions.'}
          </p>
          <button className="btn btn-primary" type="submit">
            {sessionMode === 'past' ? 'Save as my past session' : 'Publish session'}
          </button>
        </form>
      </div>

      <div className="card stack">
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
                  {formatDate(s.session_date)} — {formatSlotTopics(s)} (
                  {slotDisplayStatus(s.status, s.session_date, today)})
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

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Your sessions</h2>
        <p className="muted" style={{ margin: 0 }}>
          Upcoming sessions are active. Past sessions stay here so you can attach recordings and
          manage links — they show as completed, not as open seats.
        </p>
        {courseRecordingGroups.length > 0 && (
          <div className="stack">
            {courseRecordingGroups.map(({ course, items }) => (
              <RecordingsCarousel
                key={course.id}
                items={items}
                heading={`${course.title} recordings`}
                framed={false}
              />
            ))}
          </div>
        )}
        {mySlots.length === 0 ? (
          <div className="empty">No sessions yet.</div>
        ) : (
          <div className="stack">
            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1rem' }}>
              Upcoming{upcomingSlots.length ? ` (${upcomingSlots.length})` : ''}
            </h3>
            {upcomingSlots.length === 0 ? (
              <div className="empty">No upcoming sessions.</div>
            ) : (
              <MentorSlotsTable
                slots={upcomingSlots}
                linkDrafts={linkDrafts}
                setLinkDrafts={setLinkDrafts}
                onSaveLink={(id) => void saveSessionLink(id, 'upcoming')}
                onMarkBooked={(id) => void markBooked(id)}
                onCancel={(s) => void cancelSession(s)}
                mode="upcoming"
              />
            )}

            <h3 style={{ margin: '0.75rem 0 0', fontSize: '1rem' }}>
              Past / completed{pastSlots.length ? ` (${pastSlots.length})` : ''}
            </h3>
            {pastSlots.length === 0 ? (
              <div className="empty">No past sessions yet.</div>
            ) : (
              <MentorSlotsTable
                slots={pastSlots}
                linkDrafts={linkDrafts}
                setLinkDrafts={setLinkDrafts}
                onSaveLink={(id) => void saveSessionLink(id, 'past')}
                onMarkBooked={(id) => void markBooked(id)}
                onCancel={(s) => void cancelSession(s)}
                mode="past"
              />
            )}

            {cancelledSlots.length > 0 && (
              <>
                <h3 style={{ margin: '0.75rem 0 0', fontSize: '1rem' }}>
                  Cancelled ({cancelledSlots.length})
                </h3>
                <MentorSlotsTable
                  slots={cancelledSlots}
                  linkDrafts={linkDrafts}
                  setLinkDrafts={setLinkDrafts}
                  onSaveLink={(id) => void saveSessionLink(id, 'cancelled')}
                  onMarkBooked={(id) => void markBooked(id)}
                  onCancel={(s) => void cancelSession(s)}
                  mode="cancelled"
                />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function MentorSlotsTable({
  slots,
  linkDrafts,
  setLinkDrafts,
  onSaveLink,
  onMarkBooked,
  onCancel,
  mode,
}: {
  slots: AvailabilitySlot[]
  linkDrafts: Record<string, string>
  setLinkDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onSaveLink: (id: string) => void
  onMarkBooked: (id: string) => void
  onCancel: (s: AvailabilitySlot) => void
  mode: 'upcoming' | 'past' | 'cancelled'
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Topic</th>
            <th>Course</th>
            <th>Status</th>
            <th>{mode === 'past' ? 'Recording' : 'Join link'}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id}>
              <td>{formatDate(s.session_date)}</td>
              <td>{formatSlotTopics(s)}</td>
              <td>
                {s.courses ? (
                  <Link to={coursePath(s.courses.subject_slug, s.courses.slug)}>
                    {s.courses.title}
                  </Link>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>
                <StatusPill status={s.status} sessionDate={s.session_date} />
              </td>
              <td>
                <input
                  value={linkDrafts[s.id] ?? ''}
                  onChange={(e) =>
                    setLinkDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                  }
                  maxLength={500}
                  placeholder={mode === 'past' ? 'Recording URL' : 'Zoom / Meet URL'}
                  style={{ minWidth: '12rem' }}
                  disabled={mode === 'cancelled'}
                />
              </td>
              <td>
                <div className="split-actions">
                  {mode !== 'cancelled' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onSaveLink(s.id)}
                    >
                      {mode === 'past' ? 'Save recording' : 'Save join link'}
                    </button>
                  )}
                  {mode === 'past' && s.status === 'open' && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => onMarkBooked(s.id)}
                    >
                      Mark completed
                    </button>
                  )}
                  {mode === 'upcoming' && s.status !== 'cancelled' && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => onCancel(s)}
                    >
                      Cancel session
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

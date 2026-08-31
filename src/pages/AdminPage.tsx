import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '@/components/StatusPill'
import { useAuth } from '@/lib/auth'
import { formatDate, useTopics } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { Profile, SessionRequest, StuckQuestion, Topic, TutorStatus } from '@/lib/types'

type Tab = 'tutors' | 'signups' | 'requests' | 'stuck' | 'cleanup' | 'topics'

export function AdminPage() {
  const { isAdmin, user } = useAuth()
  const { topics, loading: topicsLoading } = useTopics()
  const [tab, setTab] = useState<Tab>('tutors')
  const [pending, setPending] = useState<Profile[]>([])
  const [tutors, setTutors] = useState<Profile[]>([])
  const [signups, setSignups] = useState<Profile[]>([])
  const [requests, setRequests] = useState<SessionRequest[]>([])
  const [stuck, setStuck] = useState<StuckQuestion[]>([])
  const [allTopics, setAllTopics] = useState<Topic[]>([])
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [stuckDays, setStuckDays] = useState(90)
  const [requestDays, setRequestDays] = useState(90)
  const [slotDays, setSlotDays] = useState(0)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const load = useCallback(async () => {
    if (!isAdmin) return
    setError(null)

    const [
      { data: pendingRows, error: pErr },
      { data: tutorRows, error: tuErr },
      { data: signupRows, error: sErr },
      { data: reqRows, error: rErr },
      { data: stuckRows, error: stErr },
      { data: topicRows, error: topErr },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('tutor_status', 'pending').order('created_at'),
      supabase
        .from('profiles')
        .select('*')
        .eq('tutor_status', 'approved')
        .order('display_name'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(75),
      supabase
        .from('session_requests')
        .select(
          '*, topics(id, name), student:profiles!session_requests_student_id_fkey(display_name), tutor:profiles!session_requests_claimed_by_fkey(display_name)',
        )
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('stuck_questions')
        .select('*, topics(id, name), profiles!stuck_questions_author_id_fkey(display_name)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('topics').select('*').order('sort_order'),
    ])

    const firstErr =
      pErr?.message || tuErr?.message || sErr?.message || rErr?.message || stErr?.message || topErr?.message
    if (firstErr) setError(firstErr)

    setPending((pendingRows as Profile[]) ?? [])
    setTutors((tutorRows as Profile[]) ?? [])
    setSignups((signupRows as Profile[]) ?? [])
    setRequests((reqRows as SessionRequest[]) ?? [])
    setStuck((stuckRows as StuckQuestion[]) ?? [])
    setAllTopics((topicRows as Topic[]) ?? [])
  }, [isAdmin])

  useEffect(() => {
    void load()
  }, [load, topicsLoading])

  function flash(message: string) {
    setOk(message)
    setError(null)
  }

  async function setTutorStatus(id: string, tutor_status: TutorStatus) {
    const { error: err } = await supabase.rpc('admin_set_tutor_status', {
      p_user_id: id,
      p_tutor_status: tutor_status,
    })
    if (err) setError(err.message)
    else {
      flash(`Tutor status set to ${tutor_status}.`)
      await load()
    }
  }

  async function renameUser(e: React.FormEvent) {
    e.preventDefault()
    if (!renameId) return
    const { error: err } = await supabase.rpc('admin_moderate_display_name', {
      p_user_id: renameId,
      p_display_name: renameValue,
    })
    if (err) setError(err.message)
    else {
      setRenameId(null)
      setRenameValue('')
      flash('Display name updated.')
      await load()
    }
  }

  async function cancelRequest(id: string) {
    const { error: err } = await supabase
      .from('session_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (err) setError(err.message)
    else {
      flash('Request cancelled.')
      await load()
    }
  }

  async function deleteRequest(id: string) {
    if (!confirm('Delete this session request permanently?')) return
    const { error: err } = await supabase.from('session_requests').delete().eq('id', id)
    if (err) setError(err.message)
    else {
      flash('Request deleted.')
      await load()
    }
  }

  async function closeStuck(id: string) {
    const { error: err } = await supabase
      .from('stuck_questions')
      .update({ status: 'closed' })
      .eq('id', id)
    if (err) setError(err.message)
    else {
      flash('Question closed.')
      await load()
    }
  }

  async function deleteStuck(id: string) {
    if (!confirm('Delete this stuck-point thread and its answers?')) return
    const { error: err } = await supabase.from('stuck_questions').delete().eq('id', id)
    if (err) setError(err.message)
    else {
      flash('Stuck-point thread deleted.')
      await load()
    }
  }

  async function purgeStuck() {
    if (!confirm(`Delete all stuck-point threads older than ${stuckDays} days?`)) return
    const { data, error: err } = await supabase.rpc('admin_purge_stuck_older_than', {
      p_days: stuckDays,
    })
    if (err) setError(err.message)
    else {
      flash(`Purged ${data as number} stuck-point thread(s).`)
      await load()
    }
  }

  async function purgeRequests() {
    if (!confirm(`Delete all session requests older than ${requestDays} days?`)) return
    const { data, error: err } = await supabase.rpc('admin_purge_requests_older_than', {
      p_days: requestDays,
    })
    if (err) setError(err.message)
    else {
      flash(`Purged ${data as number} session request(s).`)
      await load()
    }
  }

  async function purgeSlots() {
    if (!confirm(`Delete availability slots with session date before today minus ${slotDays} days?`)) return
    const { data, error: err } = await supabase.rpc('admin_purge_past_slots', {
      p_days: slotDays,
    })
    if (err) setError(err.message)
    else {
      flash(`Purged ${data as number} availability slot(s).`)
      await load()
    }
  }

  async function addTopic(e: React.FormEvent) {
    e.preventDefault()
    const slug =
      newSlug.trim() ||
      newName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    const { error: err } = await supabase.from('topics').insert({
      name: newName.trim(),
      slug,
      youtube_url: newUrl.trim() || null,
      sort_order: (allTopics.at(-1)?.sort_order ?? 0) + 10,
      active: true,
    })
    if (err) {
      setError(err.message)
      return
    }
    setNewName('')
    setNewSlug('')
    setNewUrl('')
    flash('Topic added.')
    await load()
  }

  async function toggleTopic(topic: Topic) {
    const { error: err } = await supabase
      .from('topics')
      .update({ active: !topic.active })
      .eq('id', topic.id)
    if (err) setError(err.message)
    else {
      flash(topic.active ? 'Topic deactivated.' : 'Topic activated.')
      await load()
    }
  }

  if (!user) {
    return (
      <section className="section">
        <p>
          <Link to="/auth">Sign in</Link> required.
        </p>
      </section>
    )
  }

  if (!isAdmin) {
    return (
      <section className="section">
        <h1 className="page-title">Admin</h1>
        <div className="alert alert-warn">
          Your account is not an admin. After your first sign-in, run this in the Supabase SQL editor
          (replace the id):
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.75rem' }}>
            {`update public.profiles\nset role = 'admin', tutor_status = 'approved'\nwhere id = '${user.id}';`}
          </pre>
        </div>
      </section>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'tutors', label: 'Tutor apps' },
    { id: 'signups', label: 'Sign-ups' },
    { id: 'requests', label: 'Requests' },
    { id: 'stuck', label: 'Stuck points' },
    { id: 'cleanup', label: 'Cleanup' },
    { id: 'topics', label: 'Topics' },
  ]

  return (
    <section className="section">
      <h1 className="page-title">Admin</h1>
      <p className="lead">
        Approve volunteers, moderate sign-ups and requests, and clear old stuck points or session
        data. In-app chat is never stored.
      </p>

      <div className="nav" style={{ marginBottom: '1rem' }} role="tablist" aria-label="Admin sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {ok && <div className="alert alert-ok">{ok}</div>}

      {tab === 'tutors' && (
        <div className="stack">
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Pending tutor applications</h2>
            {pending.length === 0 ? (
              <div className="empty">No pending applications.</div>
            ) : (
              <div className="stack">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}
                  >
                    <strong>{p.display_name}</strong>
                    <span className="muted">
                      video {p.video_watched ? '✓' : '✗'} · expectations{' '}
                      {p.expectations_accepted ? '✓' : '✗'} · joined {formatDate(p.created_at.slice(0, 10))}
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void setTutorStatus(p.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void setTutorStatus(p.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card stack">
            <h2 style={{ margin: 0 }}>Approved tutors</h2>
            {tutors.length === 0 ? (
              <div className="empty">No approved tutors yet.</div>
            ) : (
              <div className="stack">
                {tutors.map((p) => (
                  <div
                    key={p.id}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}
                  >
                    <strong>{p.display_name}</strong>
                    <span className="pill">{p.role}</span>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void setTutorStatus(p.id, 'rejected')}
                    >
                      Revoke tutoring
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'signups' && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Recent sign-ups</h2>
          <p className="muted" style={{ margin: 0 }}>
            Moderate display names or revoke tutoring access. Emails are never shown here.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Display name</th>
                  <th>Role</th>
                  <th>Tutor status</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {signups.map((p) => (
                  <tr key={p.id}>
                    <td>{p.display_name}</td>
                    <td>{p.role}</td>
                    <td>
                      <StatusPill status={p.tutor_status} />
                    </td>
                    <td>{formatDate(p.created_at.slice(0, 10))}</td>
                    <td>
                      <div className="split-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setRenameId(p.id)
                            setRenameValue(p.display_name)
                          }}
                        >
                          Rename
                        </button>
                        {p.tutor_status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => void setTutorStatus(p.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger"
                              onClick={() => void setTutorStatus(p.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {p.tutor_status === 'approved' && p.role !== 'admin' && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => void setTutorStatus(p.id, 'rejected')}
                          >
                            Revoke
                          </button>
                        )}
                        {p.tutor_status === 'rejected' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => void setTutorStatus(p.id, 'approved')}
                          >
                            Re-approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {renameId && (
            <form className="form" onSubmit={(e) => void renameUser(e)}>
              <h3>Set display name</h3>
              <label>
                New display name
                <input
                  required
                  minLength={2}
                  maxLength={40}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                />
              </label>
              <div className="split-actions">
                <button className="btn btn-primary" type="submit">
                  Save name
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setRenameId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Session requests</h2>
          <p className="muted" style={{ margin: 0 }}>
            Cancel inappropriate requests or delete them permanently.
          </p>
          {requests.length === 0 ? (
            <div className="empty">No requests.</div>
          ) : (
            <div className="stack">
              {requests.map((r) => (
                <article key={r.id} className="card" style={{ boxShadow: 'none' }}>
                  <p style={{ margin: 0 }}>
                    <strong>
                      {formatDate(r.preferred_date)} — {r.topics?.name}
                    </strong>{' '}
                    <StatusPill status={r.status} />
                  </p>
                  <p className="muted" style={{ margin: '0.35rem 0' }}>
                    Student: {r.student?.display_name}
                    {r.tutor?.display_name ? ` · Tutor: ${r.tutor.display_name}` : ''}
                    {r.watched_recording ? ' · watched recording' : ''}
                  </p>
                  {r.note && <p style={{ margin: '0 0 0.5rem', whiteSpace: 'pre-wrap' }}>{r.note}</p>}
                  <div className="split-actions">
                    {r.status !== 'cancelled' && (
                      <button type="button" className="btn btn-secondary" onClick={() => void cancelRequest(r.id)}>
                        Cancel
                      </button>
                    )}
                    <button type="button" className="btn btn-danger" onClick={() => void deleteRequest(r.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'stuck' && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Stuck-point threads</h2>
          <p className="muted" style={{ margin: 0 }}>
            Close threads or delete them (answers are removed with the question). Chat is ephemeral and
            does not need cleanup.
          </p>
          {stuck.length === 0 ? (
            <div className="empty">No stuck-point threads.</div>
          ) : (
            <div className="stack">
              {stuck.map((q) => (
                <article key={q.id} className="card" style={{ boxShadow: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>
                      <Link to={`/stuck/${q.id}`}>{q.title}</Link>
                    </h3>
                    <StatusPill status={q.status} />
                  </div>
                  <p className="muted" style={{ margin: '0.35rem 0', fontSize: '0.9rem' }}>
                    {q.topics?.name} · {q.profiles?.display_name} · {formatDate(q.created_at.slice(0, 10))}
                  </p>
                  <p style={{ margin: '0 0 0.75rem' }}>
                    {q.body.slice(0, 180)}
                    {q.body.length > 180 ? '…' : ''}
                  </p>
                  <div className="split-actions">
                    {q.status !== 'closed' && (
                      <button type="button" className="btn btn-secondary" onClick={() => void closeStuck(q.id)}>
                        Close
                      </button>
                    )}
                    <button type="button" className="btn btn-danger" onClick={() => void deleteStuck(q.id)}>
                      Delete thread
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'cleanup' && (
        <div className="stack">
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Purge old stuck points</h2>
            <p className="muted" style={{ margin: 0 }}>
              Permanently deletes question threads (and answers) older than the chosen age.
            </p>
            <label>
              Older than (days)
              <input
                type="number"
                min={1}
                value={stuckDays}
                onChange={(e) => setStuckDays(Number(e.target.value) || 1)}
              />
            </label>
            <button type="button" className="btn btn-danger" onClick={() => void purgeStuck()}>
              Purge old stuck points
            </button>
          </div>

          <div className="card stack">
            <h2 style={{ margin: 0 }}>Purge old session requests</h2>
            <label>
              Older than (days)
              <input
                type="number"
                min={1}
                value={requestDays}
                onChange={(e) => setRequestDays(Number(e.target.value) || 1)}
              />
            </label>
            <button type="button" className="btn btn-danger" onClick={() => void purgeRequests()}>
              Purge old requests
            </button>
          </div>

          <div className="card stack">
            <h2 style={{ margin: 0 }}>Purge past availability slots</h2>
            <p className="muted" style={{ margin: 0 }}>
              Deletes slots with a session date before today minus N days (0 = anything before today).
              Related bookings are removed by cascade.
            </p>
            <label>
              Days past (0 = before today)
              <input
                type="number"
                min={0}
                value={slotDays}
                onChange={(e) => setSlotDays(Number(e.target.value) || 0)}
              />
            </label>
            <button type="button" className="btn btn-danger" onClick={() => void purgeSlots()}>
              Purge past slots
            </button>
          </div>
        </div>
      )}

      {tab === 'topics' && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>Topics</h2>
          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(allTopics.length ? allTopics : topics).map((t) => (
              <li key={t.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <span>
                  {t.name} <span className="muted">({t.slug})</span>
                </span>
                <span className="pill">{t.active ? 'active' : 'inactive'}</span>
                <button type="button" className="btn btn-ghost" onClick={() => void toggleTopic(t)}>
                  {t.active ? 'Deactivate' : 'Activate'}
                </button>
              </li>
            ))}
          </ul>

          <form className="form" onSubmit={(e) => void addTopic(e)}>
            <h3>Add topic</h3>
            <label>
              Name
              <input required value={newName} onChange={(e) => setNewName(e.target.value)} />
            </label>
            <label>
              Slug (optional)
              <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="auto from name" />
            </label>
            <label>
              Related YouTube URL (optional)
              <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">
              Add topic
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

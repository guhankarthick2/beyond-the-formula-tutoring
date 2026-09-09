import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { useAuth } from '@/lib/auth'
import { useTopics } from '@/lib/hooks'
import { supabase, youtubeChannelUrl } from '@/lib/supabase'

export function RequestPage() {
  const { user } = useAuth()
  const { topics } = useTopics()
  const [topicId, setTopicId] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [note, setNote] = useState('')
  const [watchedRecording, setWatchedRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const selected = topics.find((t) => t.id === topicId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError(null)
    setOk(false)

    const { error: err } = await supabase.from('session_requests').insert({
      student_id: user.id,
      topic_id: topicId,
      preferred_date: preferredDate,
      note: note.trim(),
      watched_recording: watchedRecording,
      status: 'open',
    })

    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setOk(true)
    setNote('')
  }

  return (
    <section className="section" style={{ maxWidth: '36rem' }}>
      <PageBack to="/students/my-sessions" label="Back to My sessions" />

      <h1 className="page-title">Request a session</h1>
      <p className="lead">
        No open slot for the date you need? Request a curated topic. Multiple students can request
        the same topic on different dates. Even if a past session recording exists, your one-on-one
        request will still be listed for tutors.
      </p>

      {!user && (
        <div className="alert alert-warn">
          <Link to="/auth">Sign in</Link> to submit a request.
        </div>
      )}

      <form className="form card" onSubmit={(e) => void submit(e)}>
        <label>
          Topic
          <select required value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">Select a topic</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        {selected && (
          <div className="alert">
            Related past sessions:{' '}
            {selected.youtube_url ? (
              <a href={selected.youtube_url} rel="noopener noreferrer">
                Topic video
              </a>
            ) : (
              <a href={youtubeChannelUrl} rel="noopener noreferrer">
                Channel playlist
              </a>
            )}
            . Prefer browsing on the site? Open{' '}
            <Link to="/students/precal/past">past sessions</Link> — sign in to enroll and unlock
            recordings. You can still request live help.
          </div>
        )}

        <label>
          Preferred date
          <input
            required
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </label>

        <label>
          Where are you stuck? (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            placeholder="Brief note — no personal info"
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={watchedRecording}
            onChange={(e) => setWatchedRecording(e.target.checked)}
          />
          <span>I watched related recordings (or none were available) and still want a live session.</span>
        </label>

        {error && <div className="alert alert-error">{error}</div>}
        {ok && (
          <div className="alert alert-ok">
            Request listed. Tutors can claim it and propose a time. Track it on{' '}
            <Link to="/students/my-sessions">My sessions</Link>.
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={!user || busy}>
          {busy ? 'Submitting…' : 'List my request'}
        </button>
      </form>
    </section>
  )
}

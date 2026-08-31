import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase, volunteerIntroVideoUrl } from '@/lib/supabase'

export function VolunteerPage() {
  const { user, profile, refreshProfile, isApprovedTutor } = useAuth()
  const [watched, setWatched] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function apply() {
    if (!user) return
    setBusy(true)
    setError(null)
    setMessage(null)

    const { error: err } = await supabase.rpc('apply_as_tutor')

    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    await refreshProfile()
    setMessage('Application submitted. An organizer will approve you before you can post availability.')
  }

  return (
    <section className="section">
      <h1 className="page-title">Volunteer as a tutor</h1>
      <p className="lead">
        Watch the introduction covering how we tutor and what we expect. Then apply with your display
        name account — no personal contact info is published.
      </p>

      <div className="stack">
        <div className="card stack">
          <h2 style={{ margin: 0 }}>1. Watch the introduction</h2>
          <div className="video-frame">
            <iframe
              src={volunteerIntroVideoUrl}
              title="Volunteer introduction video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={watched} onChange={(e) => setWatched(e.target.checked)} />
            <span>I watched the introduction video.</span>
          </label>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0 }}>2. Expectations</h2>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>Be patient, respectful, and confidence-first with every student.</li>
            <li>Offer availability only for curated topics you can teach well.</li>
            <li>Use display names only — do not share personal emails or phone numbers in chat.</li>
            <li>Show up on time or cancel early so another tutor can help.</li>
            <li>This is unpaid nonprofit volunteering.</li>
          </ul>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>I agree to these expectations.</span>
          </label>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0 }}>3. Apply</h2>
          {!user && (
            <p className="muted">
              <Link to="/auth">Sign in</Link> with a display name first, then return here to apply.
            </p>
          )}
          {user && isApprovedTutor && (
            <div className="alert alert-ok">You are an approved tutor. Add availability from your dashboard.</div>
          )}
          {user && profile?.tutor_status === 'pending' && (
            <div className="alert alert-warn">Your application is pending approval.</div>
          )}
          {user && profile?.tutor_status === 'rejected' && (
            <div className="alert alert-error">Your application was not approved. Contact organizers in-app if needed.</div>
          )}
          {user && !isApprovedTutor && profile?.tutor_status !== 'pending' && (
            <>
              <p className="muted" style={{ margin: 0 }}>
                Signed in as <strong>{profile?.display_name}</strong>. Email stays private.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!watched || !accepted || busy}
                onClick={() => void apply()}
              >
                {busy ? 'Submitting…' : 'Submit volunteer application'}
              </button>
            </>
          )}
          {message && <div className="alert alert-ok">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </div>
    </section>
  )
}

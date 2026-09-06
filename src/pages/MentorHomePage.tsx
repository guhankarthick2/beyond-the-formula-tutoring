import { Link } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { useAuth } from '@/lib/auth'
import { usePageView } from '@/lib/stats'
import { supabase, volunteerIntroVideoUrl } from '@/lib/supabase'
import { useState } from 'react'

export function MentorHomePage() {
  usePageView('/mentors')
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
    setMessage('Interest form submitted! An admin will review your application before you can access the mentor dashboard.')
  }

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-mentor" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-violet">Volunteer mentors</span>
        </div>
        <h1 className="page-title">Mentor portal</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Share your love of math and STEM. Submit an interest form — once approved, you can create
          sessions, add students, assign homework, and reach out directly.
        </p>
      </div>

      {isApprovedTutor && (
        <div className="callout callout-success" style={{ marginTop: '1rem' }}>
          You&apos;re an approved mentor.{' '}
          <Link to="/mentors/dashboard"><strong>Open your dashboard →</strong></Link>
        </div>
      )}

      <div className="card-grid cols-2" style={{ marginTop: '1.25rem' }}>
        <article className="card">
          <h3>How onboarding works</h3>
          <ol className="step-list">
            <li>Watch the introduction video</li>
            <li>Accept mentor expectations</li>
            <li>Submit the interest form</li>
            <li>Admin reviews and approves</li>
            <li>Access the mentor dashboard</li>
          </ol>
        </article>
        <article className="card card-accent card-mentor">
          <h3>As a mentor you can</h3>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>Create sessions on the public schedule</li>
            <li>Add students to your roster</li>
            <li>Assign session-specific homework</li>
            <li>Reach out with messages and reminders</li>
          </ul>
          <Link className="btn btn-secondary" to="/students/precal/schedule" style={{ marginTop: '0.75rem' }}>
            View public schedule
          </Link>
        </article>
      </div>

      {!isApprovedTutor && (
        <div className="stack" style={{ marginTop: '1.5rem' }}>
          <div className="card stack">
            <h2 style={{ margin: 0 }}>1. Watch the introduction</h2>
            <div className="video-frame">
              <iframe
                src={volunteerIntroVideoUrl}
                title="Mentor introduction video"
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
              <li>Offer sessions only for topics you can teach well.</li>
              <li>Use display names only — no personal contact info in messages.</li>
              <li>Show up on time or cancel early so another mentor can help.</li>
              <li>This is unpaid nonprofit volunteering.</li>
            </ul>
            <label className="checkbox-row">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>I agree to these expectations.</span>
            </label>
          </div>

          <div className="card stack">
            <h2 style={{ margin: 0 }}>3. Interest form</h2>
            {!user && (
              <p className="muted">
                <Link to="/auth">Sign in</Link> with a display name first, then return here to apply.
              </p>
            )}
            {user && profile?.tutor_status === 'pending' && (
              <div className="alert alert-warn">
                Your application is pending review. An admin will approve you soon.
              </div>
            )}
            {user && profile?.tutor_status === 'rejected' && (
              <div className="alert alert-error">
                Your application was not approved. Contact organizers if you have questions.
              </div>
            )}
            {user && profile?.tutor_status !== 'pending' && profile?.tutor_status !== 'approved' && (
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
                  {busy ? 'Submitting…' : 'Submit mentor interest form'}
                </button>
              </>
            )}
            {message && <div className="alert alert-ok">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        </div>
      )}
    </section>
  )
}

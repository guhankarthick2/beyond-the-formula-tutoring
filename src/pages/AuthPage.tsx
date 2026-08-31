import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function AuthPage() {
  const { user, signInWithMagicLink, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const { error: err } = await signInWithMagicLink(email, displayName)
    setBusy(false)
    if (err) setError(err)
    else setSent(true)
  }

  if (user) {
    return (
      <section className="section">
        <h1 className="page-title">You are signed in</h1>
        <p className="lead">Head to your dashboard or browse open sessions.</p>
        <div className="btn-group">
          <Link className="btn btn-primary" to="/dashboard">
            Dashboard
          </Link>
          <Link className="btn btn-secondary" to="/sessions">
            Sessions
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="section" style={{ maxWidth: '28rem' }}>
      <h1 className="page-title">Sign in</h1>
      <p className="lead">
        Magic-link login. We only use your email to send the link — it is never shown on the site.
        Pick a display name students and tutors will see.
      </p>

      {!configured && (
        <div className="alert alert-warn" style={{ marginBottom: '1rem' }}>
          Add Supabase keys to <code>.env</code> before signing in.
        </div>
      )}

      {sent ? (
        <div className="alert alert-ok">
          Check your email for the sign-in link. You can close this tab after clicking it.
        </div>
      ) : (
        <form className="form card" onSubmit={(e) => void onSubmit(e)}>
          <label>
            Display name
            <input
              required
              minLength={2}
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex P"
              autoComplete="nickname"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Email me a magic link'}
          </button>
        </form>
      )}
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitHubMark, GoogleMark } from '@/components/AuthProviderMarks'
import { useAuth } from '@/lib/auth'

type AuthMode = 'signin' | 'register' | 'forgot' | 'recovery'

export function AuthPage() {
  const {
    user,
    profile,
    configured,
    loading,
    passwordRecovery,
    signInWithGoogle,
    signInWithGitHub,
    signUpWithPassword,
    signInWithPassword,
    resetPasswordForEmail,
    updatePassword,
    updateDisplayName,
  } = useAuth()

  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [oauthBusy, setOauthBusy] = useState<'google' | 'github' | null>(null)
  const [nameBusy, setNameBusy] = useState(false)

  useEffect(() => {
    if (passwordRecovery) {
      setMode('recovery')
      setError(null)
      setInfo('Choose a new password for your account.')
      setPassword('')
      setConfirmPassword('')
    }
  }, [passwordRecovery])

  function switchMode(next: AuthMode) {
    setMode(next)
    setError(null)
    setInfo(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function onGoogle() {
    setError(null)
    setOauthBusy('google')
    const { error: err } = await signInWithGoogle()
    setOauthBusy(null)
    if (err) setError(err)
  }

  async function onGitHub() {
    setError(null)
    setOauthBusy('github')
    const { error: err } = await signInWithGitHub()
    setOauthBusy(null)
    if (err) setError(err)
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    const { error: err } = await signInWithPassword(email, password)
    setBusy(false)
    if (err) setError(err)
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    const { error: err, needsEmailConfirmation } = await signUpWithPassword(
      email,
      password,
      displayName,
    )
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    if (needsEmailConfirmation) {
      setInfo('Check your email to confirm your account, then sign in.')
      setMode('signin')
      setPassword('')
      setConfirmPassword('')
    }
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    const { error: err } = await resetPasswordForEmail(email)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    setInfo('If that email is registered, you will receive a password reset link shortly.')
  }

  async function onRecovery(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    const { error: err } = await updatePassword(password)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    setInfo('Password updated. You are signed in.')
    setMode('signin')
    setPassword('')
    setConfirmPassword('')
  }

  async function onDisplayName(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNameBusy(true)
    const { error: err } = await updateDisplayName(displayName)
    setNameBusy(false)
    if (err) setError(err)
  }

  if (loading) {
    return (
      <section className="section" style={{ maxWidth: '28rem' }}>
        <h1 className="page-title">Sign in</h1>
        <p className="lead">Checking your session…</p>
      </section>
    )
  }

  if (user && mode !== 'recovery') {
    const needsName = !profile?.display_name || profile.display_name === 'Learner'

    return (
      <section className="section" style={{ maxWidth: '28rem' }}>
        <h1 className="page-title">You are signed in</h1>
        <p className="lead">
          {profile?.display_name
            ? `Signed in as ${profile.display_name}.`
            : 'Your session is active.'}{' '}
          Head to your dashboard or browse open sessions.
        </p>

        {needsName && (
          <form className="form card" onSubmit={(e) => void onDisplayName(e)} style={{ marginBottom: '1rem' }}>
            <p className="muted" style={{ margin: 0 }}>
              Pick a public display name (email stays private).
            </p>
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
            {error && <div className="alert alert-error">{error}</div>}
            <button className="btn btn-secondary" type="submit" disabled={nameBusy}>
              {nameBusy ? 'Saving…' : 'Save display name'}
            </button>
          </form>
        )}

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
      <h1 className="page-title">
        {mode === 'register'
          ? 'Create account'
          : mode === 'forgot'
            ? 'Reset password'
            : mode === 'recovery'
              ? 'Set new password'
              : 'Sign in'}
      </h1>
      <p className="lead">
        {mode === 'register'
          ? 'Register with email, or continue with Google or GitHub. We never show your email on the site.'
          : mode === 'forgot'
            ? 'We will email you a secure link to choose a new password.'
            : mode === 'recovery'
              ? 'Enter a new password for your account.'
              : 'Sign in with Google, GitHub, or email. Sessions refresh quietly for about a week.'}
      </p>

      {!configured && (
        <div className="alert alert-warn" style={{ marginBottom: '1rem' }}>
          Add Supabase keys to <code>.env</code> before signing in.
        </div>
      )}

      {mode !== 'recovery' && mode !== 'forgot' && (
        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            role="tab"
            className={mode === 'signin' ? 'auth-tab active' : 'auth-tab'}
            aria-selected={mode === 'signin'}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
            aria-selected={mode === 'register'}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>
      )}

      {mode !== 'recovery' && mode !== 'forgot' && (
        <>
          <div className="auth-oauth">
            <button
              className="btn auth-oauth-btn auth-oauth-google"
              type="button"
              disabled={busy || oauthBusy !== null || !configured}
              onClick={() => void onGoogle()}
            >
              <GoogleMark className="auth-oauth-mark" />
              <span>{oauthBusy === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
            </button>
            <button
              className="btn auth-oauth-btn auth-oauth-github"
              type="button"
              disabled={busy || oauthBusy !== null || !configured}
              onClick={() => void onGitHub()}
            >
              <GitHubMark className="auth-oauth-mark" />
              <span>{oauthBusy === 'github' ? 'Connecting…' : 'Continue with GitHub'}</span>
            </button>
          </div>
          <p className="muted auth-oauth-hint">
            Wrong GitHub account?{' '}
            <a href="https://github.com/logout" target="_blank" rel="noopener noreferrer">
              Sign out of GitHub
            </a>
            , then return here — or{' '}
            <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer">
              revoke this app
            </a>{' '}
            under GitHub → Settings → Applications.
          </p>
          <div className="auth-divider" aria-hidden="true">
            <span>or use email</span>
          </div>
        </>
      )}

      {mode === 'signin' && (
        <form className="form card" onSubmit={(e) => void onSignIn(e)}>
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
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={8}
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          {info && <div className="alert alert-ok">{info}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => switchMode('forgot')}>
            Forgot password?
          </button>
        </form>
      )}

      {mode === 'register' && (
        <form className="form card" onSubmit={(e) => void onRegister(e)}>
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
          <label>
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          <label>
            Confirm password
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          {info && <div className="alert alert-ok">{info}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}

      {mode === 'forgot' && (
        <form className="form card" onSubmit={(e) => void onForgot(e)}>
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
          {info && <div className="alert alert-ok">{info}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => switchMode('signin')}>
            Back to sign in
          </button>
        </form>
      )}

      {mode === 'recovery' && (
        <form className="form card" onSubmit={(e) => void onRecovery(e)}>
          <label>
            New password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          <label>
            Confirm new password
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          {info && <div className="alert alert-ok">{info}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
    </section>
  )
}

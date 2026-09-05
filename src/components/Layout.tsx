import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, isApprovedTutor, isAdmin } = useAuth()

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <p className="brand-name">Beyond The Formula</p>
            <p className="brand-tag">Math is beyond the formula · free nonprofit tutoring</p>
          </Link>
          <nav className="nav" aria-label="Primary">
            <NavLink className="btn btn-ghost" to="/" end>
              Home
            </NavLink>
            <NavLink className="btn btn-ghost" to="/students">
              Student hub
            </NavLink>
            <NavLink className="btn btn-ghost" to="/students/resources">
              Free Resources
            </NavLink>
            <NavLink className="btn btn-ghost" to="/mentors">
              Mentors
            </NavLink>
            {user && (
              <NavLink className="btn btn-ghost" to="/students/my-sessions">
                My sessions
              </NavLink>
            )}
            {isApprovedTutor && (
              <NavLink className="btn btn-ghost" to="/mentors/dashboard">
                Mentor dashboard
              </NavLink>
            )}
            {isAdmin && (
              <NavLink className="btn btn-ghost" to="/admin">
                Admin
              </NavLink>
            )}
            {user ? (
              <>
                <span className="muted nav-user">
                  {profile?.display_name ?? 'Signed in'}
                  {isApprovedTutor ? ' · mentor' : ''}
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
                  Sign out
                </button>
              </>
            ) : (
              <NavLink className="btn btn-primary" to="/auth">
                Sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content" className="main">
        {children}
      </main>
      <footer className="site-footer">
        <p>Beyond The Formula — free nonprofit math & STEM tutoring</p>
        <p className="muted footer-note">
          Display names only. No personal contact details on public pages.
        </p>
      </footer>
    </>
  )
}

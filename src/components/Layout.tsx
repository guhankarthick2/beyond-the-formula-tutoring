import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useAdminReportsInbox } from '@/lib/adminReportsInbox'
import { useMessageInbox } from '@/lib/messageInbox'
import { questionPath, useOpenQuestionsInbox } from '@/lib/openQuestionsInbox'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, isApprovedTutor, isAdmin } = useAuth()
  const { unreadCount } = useMessageInbox()
  const { openCount, openQuestions } = useOpenQuestionsInbox()
  const { reportCount } = useAdminReportsInbox()
  const navigate = useNavigate()
  const location = useLocation()
  const onMySessions = location.pathname.includes('/students/my-sessions')
  const onMentorDashboard = location.pathname.includes('/mentors/dashboard')
  const onAdmin = location.pathname.includes('/admin')
  const firstOpen = openQuestions[0]

  async function onSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <img
              className="brand-mark"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              width={44}
              height={44}
            />
            <span className="brand-text">
              <p className="brand-name">Beyond The Formula</p>
              <p className="brand-tag">Math is beyond the formula · free nonprofit tutoring</p>
            </span>
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
              <NavLink className="btn btn-ghost nav-with-badge" to="/students/my-sessions">
                My sessions
                {unreadCount > 0 && (
                  <span
                    className="nav-alert"
                    aria-label={`${unreadCount} new mentor message${unreadCount === 1 ? '' : 's'}`}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )}
            {isApprovedTutor && (
              <NavLink className="btn btn-ghost nav-with-badge" to="/mentors/dashboard">
                Mentor dashboard
                {openCount > 0 && (
                  <span
                    className="nav-alert"
                    aria-label={`${openCount} open question${openCount === 1 ? '' : 's'}`}
                  >
                    {openCount > 9 ? '9+' : openCount}
                  </span>
                )}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink className="btn btn-ghost nav-with-badge" to="/admin?tab=questions">
                Admin
                {reportCount > 0 && (
                  <span
                    className="nav-alert"
                    aria-label={`${reportCount} open question report${reportCount === 1 ? '' : 's'}`}
                  >
                    {reportCount > 9 ? '9+' : reportCount}
                  </span>
                )}
              </NavLink>
            )}
            {user ? (
              <>
                <span className="muted nav-user">
                  {profile?.display_name ?? 'Signed in'}
                  {isApprovedTutor ? ' · mentor' : ''}
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => void onSignOut()}>
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
      {user && unreadCount > 0 && !onMySessions && (
        <div className="message-banner" role="status">
          <p>
            You have {unreadCount === 1 ? 'a new mentor message' : `${unreadCount} new mentor messages`}.{' '}
            <Link to="/students/my-sessions">Open My sessions</Link> to read
            {unreadCount === 1 ? ' it' : ' them'}.
          </p>
        </div>
      )}
      {isApprovedTutor && openCount > 0 && !onMentorDashboard && firstOpen && (
        <div className="message-banner message-banner-mentor" role="status">
          <p>
            {openCount === 1
              ? 'A student has an open question waiting for help.'
              : `${openCount} open questions need mentor help.`}{' '}
            <Link to={questionPath(firstOpen)}>
              {openCount === 1 ? 'Open the question' : 'Open the newest'}
            </Link>
            {openCount > 1 && (
              <>
                {' '}
                or <Link to="/mentors/dashboard#open-questions">see all</Link>
              </>
            )}
            .
          </p>
        </div>
      )}
      {isAdmin && reportCount > 0 && !onAdmin && (
        <div className="message-banner message-banner-admin" role="status">
          <p>
            {reportCount === 1
              ? 'A question was reported for review.'
              : `${reportCount} questions were reported for review.`}{' '}
            <Link to="/admin?tab=questions">Open Admin → Questions</Link> to delete or resolve.
          </p>
        </div>
      )}
      <main id="main-content" className="main">
        {children}
      </main>
      <footer className="site-footer">
        <p>Beyond The Formula — free nonprofit math & STEM tutoring</p>
        <p className="footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/terms">Terms of Service</Link>
        </p>
        <p className="muted footer-note">
          Display names only. No personal contact details on public pages.
        </p>
      </footer>
    </>
  )
}

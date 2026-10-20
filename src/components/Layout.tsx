import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useAdminReportsInbox } from '@/lib/adminReportsInbox'
import { useMessageInbox } from '@/lib/messageInbox'
import { questionPath, useOpenQuestionsInbox } from '@/lib/openQuestionsInbox'
import { setScrollLocked, useSmoothScroll } from '@/lib/smoothScroll'
import { youtubeChannelUrl } from '@/lib/supabase'
import { OnboardingTour } from '@/components/OnboardingTour'

function navClass(base: string, isActive: boolean) {
  return isActive ? `${base} active` : base
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut, isApprovedTutor, isAdmin } = useAuth()
  const { unreadCount } = useMessageInbox()
  const { openCount, openQuestions } = useOpenQuestionsInbox()
  const { reportCount } = useAdminReportsInbox()
  const navigate = useNavigate()
  const location = useLocation()
  useSmoothScroll()
  const path = location.pathname
  const onMySessions = path.includes('/students/my-sessions')
  const onMentorDashboard = path.includes('/mentors/dashboard')
  const onAdmin = path.includes('/admin')
  const firstOpen = openQuestions[0]
  const studentsNavActive =
    path === '/students' || (path.startsWith('/students/') && !path.startsWith('/students/my-sessions'))
  const mentorsNavActive =
    path === '/mentors' || path.startsWith('/mentors/join') || path.startsWith('/mentors/p/')
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const wordmarkRef = useRef<HTMLSpanElement>(null)

  // Phone menu closes on navigation, on Escape, and when the window grows past the phone layout.
  useEffect(() => setMenuOpen(false), [path])
  useEffect(() => {
    setScrollLocked(menuOpen)
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const wide = window.matchMedia('(min-width: 961px)')
    const onWide = () => {
      if (wide.matches) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    wide.addEventListener('change', onWide)
    return () => {
      setScrollLocked(false)
      window.removeEventListener('keydown', onKey)
      wide.removeEventListener('change', onWide)
    }
  }, [menuOpen])

  // Slide the lime pill under the active nav link; re-measure on resize and once web fonts land.
  useLayoutEffect(() => {
    const nav = navRef.current
    const pill = pillRef.current
    if (!nav || !pill) return
    const place = () => {
      const active = nav.querySelector<HTMLElement>('.btn-ghost.active, .btn-ghost[aria-current="page"]')
      if (!active) {
        pill.style.clipPath = 'inset(50% 50% 50% 50% round 12px)'
        return
      }
      const n = nav.getBoundingClientRect()
      const a = active.getBoundingClientRect()
      pill.style.clipPath = `inset(${a.top - n.top}px ${n.right - a.right}px ${n.bottom - a.bottom}px ${a.left - n.left}px round 12px)`
      // Enable the slide only after the first placement, so the pill never flies in from nowhere.
      requestAnimationFrame(() => pill.setAttribute('data-ready', ''))
    }
    place()
    void document.fonts?.ready.then(place)
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [path, user, profile?.display_name, isApprovedTutor, isAdmin, unreadCount, openCount, reportCount])

  // Scroll-linked details: the progress line in the header and the footer wordmark filling with lime.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const fill = wordmarkRef.current
      if (fill) {
        const r = fill.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / r.height))
        fill.style.clipPath = `inset(0 ${(100 - p * 100).toFixed(2)}% 0 0)`
      }
      const max = document.documentElement.scrollHeight - window.innerHeight
      progressRef.current?.style.setProperty(
        'transform',
        `scaleX(${max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0})`,
      )
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [path])

  async function onSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className={menuOpen ? 'site-header menu-open' : 'site-header'}>
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
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            data-tour="student-hub"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-toggle-bars" aria-hidden="true" />
            <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          </button>
          <nav id="primary-nav" className="nav" aria-label="Primary" ref={navRef}>
            <span className="nav-indicator" ref={pillRef} aria-hidden="true" />
            <NavLink className={({ isActive }) => navClass('btn btn-ghost', isActive)} to="/" end>
              Home
            </NavLink>
            <Link
              to="/students"
              data-tour="student-hub"
              className={navClass('btn btn-ghost', studentsNavActive)}
              aria-current={studentsNavActive ? 'page' : undefined}
            >
              Students
            </Link>
            <Link
              to="/mentors"
              className={navClass('btn btn-ghost', mentorsNavActive)}
              aria-current={mentorsNavActive ? 'page' : undefined}
            >
              Mentors
            </Link>
            {user && (
              <NavLink
                className={({ isActive }) => navClass('btn btn-ghost nav-with-badge', isActive)}
                to="/students/my-sessions"
              >
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
              <NavLink
                className={({ isActive }) => navClass('btn btn-ghost nav-with-badge', isActive)}
                to="/mentors/dashboard"
              >
                Workspace
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
              <NavLink
                className={({ isActive }) => navClass('btn btn-ghost nav-with-badge', isActive)}
                to="/admin?tab=questions"
              >
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
          <span className="scroll-progress" ref={progressRef} aria-hidden="true" />
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
      <main id="main-content" className={path === '/' ? 'main main-full' : 'main'}>
        {children}
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={40} height={40} />
              <span>Beyond The Formula</span>
            </Link>
            <p className="footer-tagline">Math is beyond the formula.</p>
            <p className="footer-mission">
              Free nonprofit math &amp; STEM tutoring that teaches concepts, not memorization.
            </p>
          </div>
          <nav className="footer-col" aria-label="Learn">
            <h2>Learn</h2>
            <Link to="/students">Student hub</Link>
            <Link to="/mentors">Meet mentors</Link>
            <a href={youtubeChannelUrl} rel="noopener noreferrer">
              Watch lessons
            </a>
          </nav>
          <nav className="footer-col" aria-label="Get involved">
            <h2>Get involved</h2>
            {isApprovedTutor ? (
              <Link to="/mentors/dashboard">Workspace</Link>
            ) : (
              <Link to="/mentors/join">Become a mentor</Link>
            )}
            <Link to="/?tour=1">Take the site tour</Link>
          </nav>
          <nav className="footer-col" aria-label="Legal">
            <h2>Legal</h2>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Beyond The Formula — free nonprofit math &amp; STEM tutoring</p>
          <p>Display names only. No personal contact details on public pages.</p>
        </div>
        <p className="footer-wordmark" aria-hidden="true">
          <span>beyond the formula</span>
          <span ref={wordmarkRef}>beyond the formula</span>
        </p>
      </footer>
      <OnboardingTour />
    </>
  )
}

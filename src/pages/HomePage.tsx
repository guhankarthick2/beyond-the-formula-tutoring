import { Link } from 'react-router-dom'
import { useImpactStats, usePageView } from '@/lib/stats'
import { youtubeChannelUrl } from '@/lib/supabase'

const TESTIMONIALS = [
  {
    quote:
      'The classes were consistent throughout summer. I really liked the effort and dedication put into teaching with clear explanations. My daughter truly enjoyed the classes and feels more confident in math because of that guidance—difficult concepts explained in simple, clear ways.',
    attribution: 'Parent',
    detail: 'Precalculus summer program · Anonymous',
  },
  {
    quote:
      'All of the recorded videos were very helpful, and the live sessions were thought-provoking. Great overall course and helpful instructor—definitely increased overall confidence in math.',
    attribution: 'Parent',
    detail: 'Precalculus summer program',
  },
  {
    quote:
      'Sincerity, discipline, and planning were very impressive. My kid enjoyed attending the classes. Time well spent, with excellent effort orchestrating the sessions—I would positively recommend this program.',
    attribution: 'Parent',
    detail: 'Precalculus summer program',
  },
] as const

const THANK_YOU_NOTE = {
  quote:
    'Thank you so much for teaching me Pre-Calculus throughout the summer. I really appreciate the time and effort put into helping me. Your explanations made every topic easy to understand. Thank you for giving up part of your summer to help me succeed.',
  attribution: 'Dhanya D.',
  detail: 'Precalculus summer student',
} as const

function StatCard({
  value,
  label,
  accent,
}: {
  value: number | string
  label: string
  accent: 'green' | 'blue' | 'amber' | 'violet'
}) {
  return (
    <article className={`stat-card stat-${accent}`}>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </article>
  )
}

export function HomePage() {
  usePageView('/')
  const { stats, demo } = useImpactStats()

  return (
    <>
      <section className="hero hero-landing" aria-labelledby="hero-heading">
        <div className="badge-row">
          <span className="badge badge-green">100% free</span>
          <span className="badge badge-blue">Nonprofit</span>
          <span className="badge badge-amber">Math & STEM</span>
        </div>
        <h1 id="hero-heading">Beyond The Formula</h1>
        <p className="hero-tagline">Math is beyond the formula.</p>
        <p>
          <strong>Beyond The Formula</strong> is a free nonprofit tutoring app for math and STEM.
          Our purpose is to help students build real understanding through live sessions with
          volunteer mentors, open resources, practice tests, recordings, and a supportive community —
          not just memorizing formulas. Anyone can browse the student hub and free resources without
          signing in. Sign-in is optional and only needed to enroll in sessions or mentor.
        </p>
        <div className="btn-group">
          <Link className="btn btn-primary" to="/students">
            Enter student hub
          </Link>
          <Link className="btn btn-secondary" to="/mentors">
            Become a mentor
          </Link>
          <a className="btn btn-ghost" href={youtubeChannelUrl} rel="noopener noreferrer">
            Watch lessons
          </a>
        </div>
      </section>

      <section className="section" aria-labelledby="impact-heading">
        <div className="section-head">
          <h2 id="impact-heading">Our impact</h2>
          {demo && <span className="pill pill-demo">Preview numbers</span>}
        </div>
        <p className="lead">
          Real sessions, real students — numbers you can point to on college apps and in your community.
        </p>
        <div className="stat-grid">
          <StatCard value={stats.sessions_completed} label="Sessions completed" accent="green" />
          <StatCard value={stats.students_benefited} label="Students benefited" accent="violet" />
          <StatCard value={stats.mentors_active} label="Active mentors" accent="amber" />
        </div>
      </section>

      <section className="section" aria-labelledby="testimonials-heading">
        <h2 id="testimonials-heading">What families say</h2>
        <p className="lead">
          Feedback from parents after the Precalculus summer program — shared with permission.
        </p>
        <div className="testimonial-list">
          {TESTIMONIALS.map((item) => (
            <blockquote key={item.quote.slice(0, 48)} className="testimonial">
              <p className="testimonial-quote">{item.quote}</p>
              <footer className="testimonial-meta">
                <cite className="testimonial-name">{item.attribution}</cite>
                <span className="testimonial-detail">{item.detail}</span>
              </footer>
            </blockquote>
          ))}
        </div>

        <blockquote className="testimonial thank-you-note">
          <p className="testimonial-quote">{THANK_YOU_NOTE.quote}</p>
          <footer className="testimonial-meta">
            <cite className="testimonial-name">{THANK_YOU_NOTE.attribution}</cite>
            <span className="testimonial-detail">{THANK_YOU_NOTE.detail}</span>
          </footer>
        </blockquote>
      </section>

      <section className="section" aria-labelledby="paths-heading">
        <h2 id="paths-heading">Two paths, one mission</h2>
        <div className="card-grid cols-2">
          <article className="card card-accent card-student">
            <span className="card-icon" aria-hidden>
              📚
            </span>
            <h3>I am a student</h3>
            <p>
              Browse resources, unit tests, and upcoming sessions — no login required. Enroll in a
              session to unlock your personal schedule and homework.
            </p>
            <Link className="btn btn-primary" to="/students">
              Open student hub
            </Link>
          </article>
          <article className="card card-accent card-mentor">
            <span className="card-icon" aria-hidden>
              🌱
            </span>
            <h3>I am a mentor</h3>
            <p>
              Submit an interest form for review. Once onboarded, create sessions, add students,
              assign homework, and reach out directly.
            </p>
            <Link className="btn btn-secondary" to="/mentors">
              Mentor portal
            </Link>
          </article>
        </div>
      </section>

      <section className="section" aria-labelledby="offer-heading">
        <h2 id="offer-heading">What we offer</h2>
        <div className="card-grid cols-3">
          <article className="card">
            <h3>Live sessions</h3>
            <p>
              One-on-one help with volunteer mentors — homework, test prep, or concepts that feel
              stuck.
            </p>
          </article>
          <article className="card">
            <h3>Open resources</h3>
            <p>
              Recordings, YouTube lessons, and practice tests — free for everyone, enrolled or not.
            </p>
          </article>
          <article className="card">
            <h3>Session homework</h3>
            <p>
              Enrolled students get assignments tied to their mentor&apos;s sessions — with feedback
              and reminders.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="callout callout-brand">
          <h2 style={{ margin: '0 0 0.5rem' }}>Ready to learn beyond the formula?</h2>
          <p className="muted" style={{ margin: 0 }}>
            The student hub is open to all. Sign in only when you want to enroll or track your
            sessions.
          </p>
          <div className="btn-group">
            <Link className="btn btn-primary" to="/students/precal/schedule">
              Browse sessions
            </Link>
            <Link className="btn btn-secondary" to="/students/resources">
              Free Resources
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

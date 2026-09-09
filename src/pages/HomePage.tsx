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
          Our purpose is to help students build real understanding through courses and bootcamps,
          live help with volunteer mentors, past-session recordings, open questions, and free
          practice resources — not just memorizing formulas. Anyone can browse the student hub
          without signing in. Sign in to enroll and unlock recordings.
        </p>
        <div className="btn-group">
          <Link className="btn btn-primary" to="/students">
            Enter Students
          </Link>
          <Link className="btn btn-secondary" to="/mentors/join">
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
            <h3>I am a student</h3>
            <p>
              Choose a subject for courses and bootcamps, live or past sessions, open questions, and
              free practice resources. Sign in when you are ready to enroll and unlock recordings.
            </p>
            <Link className="btn btn-primary" to="/students">
              Open Students
            </Link>
          </article>
          <article className="card card-accent card-mentor">
            <h3>I am a mentor</h3>
            <p>
              Apply to volunteer. Once approved, publish sessions, join courses, answer open
              questions, and support students from Workspace.
            </p>
            <Link className="btn btn-secondary" to="/mentors/join">
              Become a mentor
            </Link>
          </article>
        </div>
      </section>

      <section className="section" aria-labelledby="offer-heading">
        <div className="section-head">
          <h2 id="offer-heading">What you can do</h2>
        </div>
        <p className="lead">
          Everything starts in the student hub. Pick a subject, then open courses, the schedule, past
          sessions, questions, or resources from there.
        </p>
        <div className="card-grid cols-2">
          <Link className="card home-offer-card" to="/students">
            <h3>Courses &amp; bootcamps</h3>
            <p>
              Multi-session programs with enroll-once access to linked sessions and recordings when
              mentors publish them.
            </p>
            <span className="home-offer-cta">Browse subjects →</span>
          </Link>
          <Link className="card home-offer-card" to="/students">
            <h3>Live &amp; past sessions</h3>
            <p>
              Upcoming one-on-one or group help, plus completed sessions you can enroll in to unlock
              recordings and homework.
            </p>
            <span className="home-offer-cta">Choose a subject →</span>
          </Link>
          <Link className="card home-offer-card" to="/students">
            <h3>Open questions</h3>
            <p>
              Ask by subject when you are stuck. Mentors reply in the thread — text only, no photo
              uploads.
            </p>
            <span className="home-offer-cta">Go to Students →</span>
          </Link>
          <Link className="card home-offer-card" to="/mentors">
            <h3>Mentors</h3>
            <p>
              Meet volunteer mentors, read their bios, and see who is teaching. Apply if you want to
              help.
            </p>
            <span className="home-offer-cta">Meet mentors →</span>
          </Link>
        </div>

        <div className="callout callout-brand" style={{ marginTop: '1.25rem' }}>
          <h2 style={{ margin: '0 0 0.5rem' }}>Ready to learn beyond the formula?</h2>
          <p className="muted" style={{ margin: 0 }}>
            Start at the student hub to pick a subject — you will see courses, schedules, and past
            sessions that actually have content. Sign in when you want to enroll.
          </p>
          <div className="btn-group">
            <Link className="btn btn-primary" to="/students">
              Explore student hub
            </Link>
            <Link className="btn btn-secondary" to="/mentors">
              Meet mentors
            </Link>
            <Link className="btn btn-ghost" to="/mentors/join">
              Become a mentor
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

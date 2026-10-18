import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AnimatedContent from '@/components/bits/AnimatedContent'
import DotGrid from '@/components/bits/DotGrid'
import ScrollReveal from '@/components/bits/ScrollReveal'
import SplitText from '@/components/bits/SplitText'
import SpotlightCard from '@/components/bits/SpotlightCard'
import { useAuth } from '@/lib/auth'
import { prefersReducedMotion } from '@/lib/smoothScroll'
import { useImpactStats, usePageView } from '@/lib/stats'
import { youtubeChannelUrl } from '@/lib/supabase'
import './HomePage.css'

gsap.registerPlugin(ScrollTrigger)

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
  attribution: 'Anonymous',
  detail: 'Precalculus summer student',
} as const

const VALUES = [
  {
    symbol: 'Σ',
    title: 'Practice',
    body: 'Understanding grows through repetition. Students work through plenty of problems with worked explanations and feedback until each idea sticks.',
    accent: 'green',
  },
  {
    symbol: '∞',
    title: 'Self-confidence',
    body: 'Every student is capable of excelling in math. No question is too hard: we attempt every one with full belief that we will solve it.',
    accent: 'blue',
  },
  {
    symbol: '√',
    title: 'Concepts over memorization',
    body: 'We dig into why a formula works until the idea is understood from every angle, not just remembered. That is where our name comes from.',
    accent: 'violet',
  },
] as const

const OFFERS = [
  {
    tour: 'offer-courses',
    to: '/students',
    title: 'Courses & bootcamps',
    body: 'Multi-session programs with enroll-once access to linked sessions and recordings when mentors publish them.',
    cta: 'Browse subjects',
    glyph: '∫',
  },
  {
    tour: 'offer-sessions',
    to: '/students',
    title: 'Live & past sessions',
    body: 'Upcoming one-on-one or group help, plus completed sessions you can enroll in to unlock recordings and homework.',
    cta: 'Choose a subject',
    glyph: 'Δ',
  },
  {
    tour: 'offer-questions',
    to: '/students',
    title: 'Open questions',
    body: 'Ask by subject when you are stuck. Mentors reply in the thread — text only, no photo uploads.',
    cta: 'Go to Students',
    glyph: '?',
  },
  {
    tour: 'offer-mentors',
    to: '/mentors',
    title: 'Mentors',
    body: 'Meet volunteer mentors, read their bios, and see who is teaching. Apply if you want to help.',
    cta: 'Meet mentors',
    glyph: 'π',
  },
] as const

/** Counts up from 0 the first time the number scrolls into view. */
function CountUp({ value }: { value: number | string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const text = typeof value === 'number' ? value.toLocaleString() : value
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof value !== 'number' || prefersReducedMotion()) return
    const state = { n: 0 }
    el.textContent = '0'
    const tween = gsap.to(state, {
      n: value,
      duration: 1.6,
      ease: 'power2.out',
      paused: true,
      onUpdate: () => {
        el.textContent = Math.round(state.n).toLocaleString()
      },
    })
    const st = ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => tween.play() })
    return () => {
      st.kill()
      tween.kill()
      el.textContent = value.toLocaleString()
    }
  }, [value])
  return <span ref={ref}>{text}</span>
}

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
      <p className="stat-value">
        <CountUp value={value} />
      </p>
      <p className="stat-label">{label}</p>
    </article>
  )
}

/** The memorized formula fades back while the reasoning behind it writes itself in. */
function FormulaCard() {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.5, defaults: { ease: 'power3.out' } })
      tl.from(el, { y: 24, autoAlpha: 0, rotate: 1.5, duration: 0.9 })
        .from('.formula-memorized', { autoAlpha: 0, y: 8, duration: 0.5 }, '-=0.4')
        .fromTo('.formula-strike', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }, '+=0.5')
        .to('.formula-memorized', { opacity: 0.45, duration: 0.4 }, '<0.3')
        .from('.formula-label-beyond', { autoAlpha: 0, duration: 0.4 }, '-=0.1')
        .from('.formula-step', { autoAlpha: 0, x: -14, stagger: 0.32, duration: 0.55 }, '-=0.1')
        .from('.formula-conclusion', { autoAlpha: 0, y: 10, duration: 0.6 }, '+=0.15')
        // Gentle float once it has settled.
        .to(el, { y: -6, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div className="formula-card" ref={ref} aria-hidden="true">
      <p className="formula-label">The formula</p>
      <p className="formula-memorized">
        <span>x =</span>
        <span className="frac">
          <span>−b ± √(b² − 4ac)</span>
          <span>2a</span>
        </span>
        <span className="formula-strike" />
      </p>
      <p className="formula-label formula-label-beyond">Beyond it</p>
      <ol className="formula-steps">
        <li className="formula-step">ax² + bx + c = 0</li>
        <li className="formula-step">
          x² + <i>(b/a)</i>x = −<i>c/a</i>
        </li>
        <li className="formula-step">
          (x + <i>b/2a</i>)² = <i>(b² − 4ac)/4a²</i>
        </li>
      </ol>
      <p className="formula-conclusion">
        ∴ now you know <em>why</em> it works.
      </p>
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

export function HomePage() {
  usePageView('/')
  const { stats, demo } = useImpactStats()
  const { isApprovedTutor } = useAuth()

  return (
    <div className="home">
      <section className="hero hero-landing" aria-labelledby="hero-heading">
        <DotGrid
          className="hero-dots"
          dotSize={4}
          gap={22}
          baseColor="#a6c8b7"
          activeColor="#0f6b4c"
          proximity={130}
          shockRadius={260}
          shockStrength={4}
          glow={0.3}
          fade={0.55}
        />
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="badge-row">
              <span className="badge badge-green">100% free</span>
              <span className="badge badge-blue">Nonprofit</span>
              <span className="badge badge-amber">Math & STEM</span>
            </div>
            <h1 id="hero-heading" className="hero-title">
              <SplitText
                tag="span"
                text="Beyond The Formula"
                splitType="chars"
                delay={35}
                duration={1}
                effect="rise"
                mask
                trigger="load"
                textAlign="left"
              />
            </h1>
            <p className="hero-tagline">Math is beyond the formula.</p>
            <p>
              <strong>Beyond The Formula</strong> is a free nonprofit tutoring app for math and STEM.
              Our purpose is to help students build real understanding through courses and bootcamps,
              live help with volunteer mentors, past-session recordings, open questions, and free
              practice resources — not just memorizing formulas. Anyone can browse the student hub
              without signing in. Sign in to enroll and unlock recordings.
            </p>
            <div className="btn-group">
              <Link className="btn btn-primary btn-lg" to="/students">
                Enter Students <span aria-hidden="true">→</span>
              </Link>
              {isApprovedTutor ? (
                <Link className="btn btn-secondary btn-lg" to="/mentors/dashboard">
                  Open Workspace
                </Link>
              ) : (
                <Link className="btn btn-secondary btn-lg" to="/mentors/join">
                  Become a mentor
                </Link>
              )}
              <a className="btn btn-ghost btn-lg" href={youtubeChannelUrl} rel="noopener noreferrer">
                Watch lessons
              </a>
            </div>
          </div>
          <FormulaCard />
        </div>
        <a className="hero-scroll-cue" href="#about">
          <span>Our story</span>
          <span className="hero-scroll-line" aria-hidden="true" />
        </a>
      </section>

      <section id="about" className="section about" aria-labelledby="about-heading" data-tour="about">
        <h2 id="about-heading" className="eyebrow">
          About Beyond The Formula
        </h2>
        <ScrollReveal
          containerClassName="about-statement"
          baseOpacity={0.12}
          baseRotation={0}
          blurStrength={6}
          wordAnimationEnd="center center"
        >
          Formulas are where math ends, not where it begins. We teach the reasoning underneath so every
          student believes they can solve whatever is in front of them.
        </ScrollReveal>

        <AnimatedContent className="values-grid" stagger={0.12} distance={40} duration={0.9}>
          {VALUES.map((v, i) => (
            <SpotlightCard
              key={v.title}
              theme="light"
              className={`value-card value-${v.accent}`}
              spotlightColor="#0f6b4c"
              intensity={0.5}
              spotlightSize={280}
            >
              <span className="value-symbol" aria-hidden="true">
                {v.symbol}
              </span>
              <span className="value-index" aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </SpotlightCard>
          ))}
        </AnimatedContent>

        <AnimatedContent distance={50} duration={1}>
          <figure className="founder">
            <img
              className="founder-mark"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              width={64}
              height={64}
            />
            <blockquote className="founder-quote">
              <p>
                I founded Beyond the Formula so that students around the world could gain help in math,
                teaching students concepts rather than memorization. All the tutors at Beyond the
                Formula hope to enforce its values, and seek to help more students believe they are
                capable of excelling in math.
              </p>
            </blockquote>
            <figcaption className="founder-caption">
              <span className="founder-name">Guhan Karthick</span>
              <span className="founder-role">Founder, Beyond The Formula</span>
            </figcaption>
          </figure>
        </AnimatedContent>
      </section>

      <section className="section" aria-labelledby="impact-heading">
        <Eyebrow>Our impact</Eyebrow>
        <div className="section-head">
          <h2 id="impact-heading">Real sessions, real students</h2>
          {demo && <span className="pill pill-demo">Preview numbers</span>}
        </div>
        <p className="lead">Numbers you can point to on college apps and in your community.</p>
        <AnimatedContent className="stat-grid" stagger={0.1} distance={30}>
          <StatCard value={stats.sessions_completed} label="Sessions completed" accent="green" />
          <StatCard value={stats.students_benefited} label="Students benefited" accent="violet" />
          <StatCard value={stats.mentors_active} label="Active mentors" accent="amber" />
        </AnimatedContent>
      </section>

      <section className="section" aria-labelledby="testimonials-heading">
        <Eyebrow>Testimonials</Eyebrow>
        <h2 id="testimonials-heading">What families say</h2>
        <p className="lead">
          Feedback from parents after the Precalculus summer program — shared with permission.
        </p>
        <AnimatedContent className="testimonial-list" stagger={0.12} distance={36}>
          {TESTIMONIALS.map((item) => (
            <blockquote key={item.quote.slice(0, 48)} className="testimonial">
              <p className="testimonial-quote">{item.quote}</p>
              <footer className="testimonial-meta">
                <cite className="testimonial-name">{item.attribution}</cite>
                <span className="testimonial-detail">{item.detail}</span>
              </footer>
            </blockquote>
          ))}
        </AnimatedContent>

        <AnimatedContent distance={36}>
          <blockquote className="testimonial thank-you-note">
            <p className="testimonial-quote">{THANK_YOU_NOTE.quote}</p>
            <footer className="testimonial-meta">
              <cite className="testimonial-name">{THANK_YOU_NOTE.attribution}</cite>
              <span className="testimonial-detail">{THANK_YOU_NOTE.detail}</span>
            </footer>
          </blockquote>
        </AnimatedContent>
      </section>

      <section className="section" aria-labelledby="paths-heading">
        <Eyebrow>Get involved</Eyebrow>
        <h2 id="paths-heading">Two paths, one mission</h2>
        <AnimatedContent className="card-grid cols-2" stagger={0.12} distance={36}>
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
          <article className="card card-accent card-mentor" data-tour="become-mentor">
            <h3>I am a mentor</h3>
            {isApprovedTutor ? (
              <>
                <p>
                  Publish sessions, join courses, answer open questions, and support students from
                  Workspace.
                </p>
                <Link className="btn btn-secondary" to="/mentors/dashboard">
                  Open Workspace
                </Link>
              </>
            ) : (
              <>
                <p>
                  Apply to volunteer. Once approved, publish sessions, join courses, answer open
                  questions, and support students from Workspace.
                </p>
                <Link className="btn btn-secondary" to="/mentors/join">
                  Become a mentor
                </Link>
              </>
            )}
          </article>
        </AnimatedContent>
      </section>

      <section className="section" aria-labelledby="offer-heading">
        <Eyebrow>Explore</Eyebrow>
        <div className="section-head">
          <h2 id="offer-heading">What you can do</h2>
        </div>
        <p className="lead">
          Everything starts in the student hub. Pick a subject, then open courses, the schedule, past
          sessions, questions, or resources from there.
        </p>
        <AnimatedContent className="card-grid cols-2 offer-grid" stagger={0.1} distance={36}>
          {OFFERS.map((o) => (
            <SpotlightCard
              key={o.tour}
              theme="light"
              className="home-offer-card"
              spotlightColor="#2563eb"
              intensity={0.45}
              data-tour={o.tour}
            >
              <span className="offer-glyph" aria-hidden="true">
                {o.glyph}
              </span>
              <h3>
                <Link className="stretched-link" to={o.to}>
                  {o.title}
                </Link>
              </h3>
              <p>{o.body}</p>
              <span className="home-offer-cta" aria-hidden="true">
                {o.cta} →
              </span>
            </SpotlightCard>
          ))}
        </AnimatedContent>

        <AnimatedContent distance={40}>
          <div className="callout callout-brand cta-band">
            <h2>Ready to learn beyond the formula?</h2>
            <p className="muted">
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
              {isApprovedTutor ? (
                <Link className="btn btn-ghost" to="/mentors/dashboard">
                  Open Workspace
                </Link>
              ) : (
                <Link className="btn btn-ghost" to="/mentors/join">
                  Become a mentor
                </Link>
              )}
            </div>
          </div>
        </AnimatedContent>
      </section>
    </div>
  )
}

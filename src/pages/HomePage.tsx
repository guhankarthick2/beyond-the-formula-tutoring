import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AnimatedContent from '@/components/bits/AnimatedContent'
import ScrollReveal from '@/components/bits/ScrollReveal'
import SplitText from '@/components/bits/SplitText'
import SpotlightCard from '@/components/bits/SpotlightCard'
import { GraphField } from '@/components/GraphField'
import { useAuth } from '@/lib/auth'
import { prefersReducedMotion } from '@/lib/smoothScroll'
import { useImpactStats, usePageView } from '@/lib/stats'
import { youtubeChannelUrl } from '@/lib/supabase'
import './HomePage.css'

gsap.registerPlugin(ScrollTrigger)

const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

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
    tone: 'lime',
    note: 'rep after rep',
  },
  {
    symbol: '∞',
    title: 'Self-confidence',
    body: 'Every student is capable of excelling in math. No question is too hard: we attempt every one with full belief that we will solve it.',
    tone: 'sky',
    note: 'you’ve got this',
  },
  {
    symbol: '√',
    title: 'Concepts over memorization',
    body: 'We dig into why a formula works until the idea is understood from every angle, not just remembered. That is where our name comes from.',
    tone: 'violet',
    note: 'always ask why',
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
    art: 'stack',
  },
  {
    tour: 'offer-sessions',
    to: '/students',
    title: 'Live & past sessions',
    body: 'Upcoming one-on-one or group help, plus completed sessions you can enroll in to unlock recordings and homework.',
    cta: 'Choose a subject',
    glyph: 'Δ',
    art: 'live',
  },
  {
    tour: 'offer-questions',
    to: '/students',
    title: 'Open questions',
    body: 'Ask by subject when you are stuck. Mentors reply in the thread — text only, no photo uploads.',
    cta: 'Go to Students',
    glyph: '?',
    art: 'chat',
  },
  {
    tour: 'offer-mentors',
    to: '/mentors',
    title: 'Mentors',
    body: 'Meet volunteer mentors, read their bios, and see who is teaching. Apply if you want to help.',
    cta: 'Meet mentors',
    glyph: 'π',
    art: 'orbit',
  },
] as const

const WORDS = [
  '100% free',
  'Practice',
  'Self-confidence',
  'Concepts over memorization',
  'Live mentors',
  'Open questions',
  'Past-session recordings',
]

const FORMULAS = [
  'a² + b² = c²',
  '∫ eˣ dx = eˣ + C',
  'e^(iπ) + 1 = 0',
  'lim sin x ⁄ x = 1',
  'Σ 1⁄2ⁿ = 1',
  'd⁄dx xⁿ = n·xⁿ⁻¹',
  'x = (−b ± √Δ) ⁄ 2a',
]

const GLYPHS = [
  { t: '∫', left: '90%', top: '9%', size: '7.5rem', depth: 1 },
  { t: 'π', left: '56%', top: '6%', size: '3.25rem', depth: 0.45 },
  { t: 'Σ', left: '94%', top: '66%', size: '5rem', depth: 0.8 },
  { t: '√', left: '74%', top: '84%', size: '4rem', depth: 0.6 },
  { t: 'Δ', left: '3%', top: '90%', size: '2.75rem', depth: 0.35 },
] as const

/** Spotlight cards default to a neutral black; ours sit on the site's ink. */
const INK_CARD = {
  '--spotlight-card-surface': '#131927',
  '--spotlight-card-border': 'rgba(244, 241, 232, 0.1)',
  '--spotlight-card-shadow': '0 30px 60px -34px rgba(11, 14, 23, 0.85)',
} as CSSProperties

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
      duration: 1.8,
      ease: 'power3.out',
      paused: true,
      onUpdate: () => {
        el.textContent = Math.round(state.n).toLocaleString()
      },
    })
    const st = ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => tween.play() })
    return () => {
      st.kill()
      tween.kill()
      el.textContent = value.toLocaleString()
    }
  }, [value])
  return <span ref={ref}>{text}</span>
}

/** Leans its child a few pixels toward the cursor and settles back on leave (mouse only). */
function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || !finePointer()) return
    const toX = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const toY = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      toX((e.clientX - r.left - r.width / 2) * 0.28)
      toY((e.clientY - r.top - r.height / 2) * 0.38)
    }
    const leave = () => {
      toX(0)
      toY(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      gsap.set(el, { clearProps: 'transform' })
    }
  }, [])
  return (
    <span className="magnet" ref={ref}>
      {children}
    </span>
  )
}

function Hero({ isApprovedTutor }: { isApprovedTutor: boolean }) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const hero = ref.current
    if (!hero || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      // Scrolling away: the copy drifts up and dims while the graph sinks back.
      gsap
        .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to('.hx-copy', { yPercent: -14, opacity: 0.2, ease: 'none' }, 0)
        .to('.hx-graph', { scale: 1.08, opacity: 0.45, ease: 'none' }, 0)
    }, hero)

    if (!finePointer()) return () => ctx.revert()
    // Glyphs drift away from the cursor; deeper ones travel further.
    const movers = gsap.utils.toArray<HTMLElement>('.hx-glyph', hero).map((g) => ({
      depth: Number(g.dataset.depth),
      x: gsap.quickTo(g, 'x', { duration: 1.1, ease: 'power3.out' }),
      y: gsap.quickTo(g, 'y', { duration: 1.1, ease: 'power3.out' }),
    }))
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      for (const m of movers) {
        m.x(-nx * 70 * m.depth)
        m.y(-ny * 46 * m.depth)
      }
    }
    hero.addEventListener('pointermove', onMove)
    return () => {
      hero.removeEventListener('pointermove', onMove)
      ctx.revert()
    }
  }, [])

  return (
    <section className="hx on-ink" ref={ref} aria-labelledby="hero-heading">
      <GraphField className="hx-graph" />
      <div className="hx-scrim" aria-hidden="true" />
      <div className="hx-glyphs" aria-hidden="true">
        {GLYPHS.map((g) => (
          <span
            key={g.t}
            className="hx-glyph"
            data-depth={g.depth}
            style={{ left: g.left, top: g.top, fontSize: g.size }}
          >
            <span>{g.t}</span>
          </span>
        ))}
      </div>

      <div className="hx-copy">
        <ul className="hx-badges" aria-label="At a glance">
          <li>100% free</li>
          <li>Nonprofit</li>
          <li>Math &amp; STEM</li>
        </ul>
        <h1 id="hero-heading" className="hx-title" aria-label="Beyond The Formula">
          <span className="hx-line hx-line-serif" aria-hidden="true">
            <SplitText
              tag="span"
              text="Beyond"
              splitType="chars"
              delay={45}
              duration={1.1}
              effect="rise"
              mask
              trigger="load"
              textAlign="left"
            />
          </span>
          <span className="hx-line" aria-hidden="true">
            <SplitText
              tag="span"
              text="The Formula"
              splitType="chars"
              delay={38}
              duration={1}
              effect="rise"
              mask
              trigger="load"
              textAlign="left"
              hoverEffect="lift"
            />
            <svg className="hx-underline" viewBox="0 0 600 40" preserveAspectRatio="none">
              <path d="M6 30 C 130 10, 270 6, 390 18 S 560 34, 594 12" pathLength="1" />
            </svg>
          </span>
        </h1>
        <p className="hx-tagline">
          <span>Math is beyond the formula.</span>
        </p>
        <p className="hx-lede">
          <strong>Beyond The Formula</strong> is a free nonprofit tutoring app for math and STEM. Our
          purpose is to help students build real understanding through courses and bootcamps, live help
          with volunteer mentors, past-session recordings, open questions, and free practice resources —
          not just memorizing formulas. Anyone can browse the student hub without signing in. Sign in to
          enroll and unlock recordings.
        </p>
        <div className="hx-actions">
          <Magnetic>
            <Link className="btn btn-primary btn-lg" to="/students">
              Enter Students <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
          <Magnetic>
            {isApprovedTutor ? (
              <Link className="btn btn-secondary btn-lg" to="/mentors/dashboard">
                Open Workspace
              </Link>
            ) : (
              <Link className="btn btn-secondary btn-lg" to="/mentors/join">
                Become a mentor
              </Link>
            )}
          </Magnetic>
          <a className="btn btn-ghost btn-lg" href={youtubeChannelUrl} rel="noopener noreferrer">
            <span className="hx-play" aria-hidden="true">
              ▶
            </span>
            Watch lessons
          </a>
        </div>
      </div>

      <p className="hx-hint" aria-hidden="true">
        move your cursor — the slope follows
        <svg viewBox="0 0 60 40">
          <path d="M4 34 C 18 30, 34 22, 50 8 M 38 9 L 51 7 L 49 20" />
        </svg>
      </p>
      <a className="hx-cue" href="#about">
        <span>Our story</span>
        <span className="hx-cue-line" aria-hidden="true" />
      </a>
    </section>
  )
}

function Ticker({ items, tone }: { items: readonly string[]; tone: 'lime' | 'ink' }) {
  return (
    <div className={`ticker ticker-${tone}`}>
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <span className="ticker-row" key={copy}>
            {items.map((item) => (
              <span className="ticker-item" key={item}>
                {item}
                <i>✦</i>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The memorized formula gets crossed out while the reasoning behind it writes itself in. */
function FormulaCard() {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: 'top 78%', once: true },
          defaults: { ease: 'power3.out' },
        })
        .from(el, { y: 36, autoAlpha: 0, rotate: -2.5, duration: 0.9 })
        .from('.formula-memorized', { autoAlpha: 0, y: 8, duration: 0.5 }, '-=0.4')
        .fromTo('.formula-strike', { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power2.inOut' }, '+=0.35')
        .to('.formula-memorized', { opacity: 0.4, duration: 0.4 }, '<0.3')
        .from('.formula-label-beyond', { autoAlpha: 0, duration: 0.4 }, '-=0.1')
        .from('.formula-step', { autoAlpha: 0, x: -14, stagger: 0.3, duration: 0.55 }, '-=0.1')
        .from('.formula-conclusion', { autoAlpha: 0, y: 10, duration: 0.6 }, '+=0.1')
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

/** Value cards stick and stack; each one eases back as the next slides over it. */
function ValueStack() {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.vcard', root)
      cards.slice(0, -1).forEach((card, i) => {
        const scrollTrigger = { trigger: cards[i + 1], start: 'top bottom', end: 'top 35%', scrub: true }
        gsap.to(card, { scale: 0.93, ease: 'none', scrollTrigger })
        gsap.to(card.querySelector('.vcard-shade'), { opacity: 0.4, ease: 'none', scrollTrigger })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div className="vstack" ref={ref}>
      {VALUES.map((v, i) => (
        <article key={v.title} className={`vcard vcard-${v.tone}`} style={{ '--i': i } as CSSProperties}>
          <span className="vcard-shade" aria-hidden="true" />
          <span className="vcard-index" aria-hidden="true">
            0{i + 1} / 0{VALUES.length}
          </span>
          <span className="vcard-symbol" aria-hidden="true">
            {v.symbol}
          </span>
          <div className="vcard-copy">
            <h3>{v.title}</h3>
            <p>{v.body}</p>
          </div>
          <span className="vcard-note" aria-hidden="true">
            {v.note}
          </span>
        </article>
      ))}
    </div>
  )
}

function Stat({ value, label, tone }: { value: number | string; label: string; tone: 'lime' | 'sky' | 'coral' }) {
  return (
    <article className={`num num-${tone}`}>
      <p className="num-value">
        <CountUp value={value} />
      </p>
      <span className="num-bar" aria-hidden="true" />
      <p className="num-label">{label}</p>
    </article>
  )
}

function OfferArt({ kind }: { kind: (typeof OFFERS)[number]['art'] }) {
  if (kind === 'stack')
    return (
      <div className="art art-stack" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    )
  if (kind === 'live')
    return (
      <div className="art art-live" aria-hidden="true">
        <span className="art-live-pill">
          <b />
          Live
        </span>
        <span className="art-live-bar">
          <i />
        </span>
      </div>
    )
  if (kind === 'chat')
    return (
      <div className="art art-chat" aria-hidden="true">
        <span>where do I even start?</span>
        <span>
          <i />
          <i />
          <i />
        </span>
      </div>
    )
  return (
    <div className="art art-orbit" aria-hidden="true">
      <span className="art-orbit-ring">
        <b>A</b>
        <b>K</b>
        <b>M</b>
      </span>
      <i />
    </div>
  )
}

function Finale({ isApprovedTutor }: { isApprovedTutor: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const card = ref.current
    if (!card || prefersReducedMotion()) return
    const tween = gsap.fromTo(
      card.querySelector('.finale-wave path'),
      { strokeDashoffset: 1 },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 90%', end: 'bottom 70%', scrub: true },
      },
    )
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <section className="finale" aria-labelledby="cta-heading">
      <div className="finale-card" ref={ref}>
        <svg className="finale-wave" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-10 150 C 140 30, 300 30, 450 140 S 760 250, 910 130 S 1140 20, 1210 80" pathLength="1" />
        </svg>
        <p className="kicker">Start now</p>
        <h2 id="cta-heading">
          Ready to learn <em>beyond</em> the formula?
        </h2>
        <p className="finale-lede">
          Start at the student hub to pick a subject — you will see courses, schedules, and past sessions
          that actually have content. Sign in when you want to enroll.
        </p>
        <div className="finale-actions">
          <Magnetic>
            <Link className="btn btn-ink btn-lg" to="/students">
              Explore student hub <span aria-hidden="true">→</span>
            </Link>
          </Magnetic>
          <Link className="btn btn-secondary btn-lg" to="/mentors">
            Meet mentors
          </Link>
          {isApprovedTutor ? (
            <Link className="btn btn-ghost btn-lg" to="/mentors/dashboard">
              Open Workspace
            </Link>
          ) : (
            <Link className="btn btn-ghost btn-lg" to="/mentors/join">
              Become a mentor
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>
}

export function HomePage() {
  usePageView('/')
  const { stats, demo } = useImpactStats()
  const { isApprovedTutor } = useAuth()
  const numsRef = useRef<HTMLElement>(null)

  // Stat bars grow once the band scrolls into view.
  useLayoutEffect(() => {
    const el = numsRef.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 75%',
      once: true,
      onEnter: () => el.classList.add('is-in'),
    })
    return () => st.kill()
  }, [])

  return (
    <div className="home">
      <Hero isApprovedTutor={isApprovedTutor} />

      <div className="tickers" aria-hidden="true">
        <Ticker items={WORDS} tone="lime" />
        <Ticker items={FORMULAS} tone="ink" />
      </div>

      <section id="about" className="about" aria-labelledby="about-heading" data-tour="about">
        <div className="wrap">
          <h2 id="about-heading" className="kicker">
            About Beyond The Formula
          </h2>
          <ScrollReveal
            containerClassName="about-statement"
            baseOpacity={0.1}
            baseRotation={0}
            blurStrength={6}
            wordAnimationEnd="center center"
          >
            Formulas are where math ends, not where it begins. We teach the reasoning underneath so every
            student believes they can solve whatever is in front of them.
          </ScrollReveal>
        </div>

        <div className="wrap">
          <ValueStack />
        </div>

        <div className="wrap about-pair">
          <div className="about-demo">
            <p className="hand-note" aria-hidden="true">
              here’s what we mean ↓
            </p>
            <FormulaCard />
          </div>
          <AnimatedContent distance={50} blur={10} duration={1}>
            <figure className="founder">
              <span className="founder-mark-quote" aria-hidden="true">
                “
              </span>
              <blockquote className="founder-quote">
                <p>
                  I founded Beyond the Formula so that students around the world could gain help in math,
                  teaching students concepts rather than memorization. All the tutors at Beyond the
                  Formula hope to enforce its values, and seek to help more students believe they are
                  capable of excelling in math.
                </p>
              </blockquote>
              <figcaption className="founder-caption">
                <img
                  className="founder-mark"
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt=""
                  width={52}
                  height={52}
                />
                <span>
                  <span className="founder-name">Guhan Karthick</span>
                  <span className="founder-role">Founder, Beyond The Formula</span>
                </span>
                <span className="founder-sign" aria-hidden="true">
                  Guhan K.
                </span>
              </figcaption>
            </figure>
          </AnimatedContent>
        </div>
      </section>

      <section className="nums on-ink" ref={numsRef} aria-labelledby="impact-heading">
        <div className="wrap">
          <div className="nums-top">
            <div>
              <Kicker>Our impact</Kicker>
              <h2 id="impact-heading" className="display-2">
                Real sessions, <em>real</em> students
              </h2>
            </div>
            <p className="lead">
              Numbers you can point to on college apps and in your community.
              {demo && <span className="pill pill-demo">Preview numbers</span>}
            </p>
          </div>
          <AnimatedContent className="nums-grid" stagger={0.12} distance={40}>
            <Stat value={stats.sessions_completed} label="Sessions completed" tone="lime" />
            <Stat value={stats.students_benefited} label="Students benefited" tone="sky" />
            <Stat value={stats.mentors_active} label="Active mentors" tone="coral" />
          </AnimatedContent>
        </div>
      </section>

      <section className="voices" aria-labelledby="testimonials-heading">
        <div className="wrap">
          <Kicker>Testimonials</Kicker>
          <h2 id="testimonials-heading" className="display-2">
            What families <em>say</em>
          </h2>
          <p className="lead">
            Feedback from parents after the Precalculus summer program — shared with permission.
          </p>
          <AnimatedContent className="notes" stagger={0.14} distance={60} rotate={5}>
            {TESTIMONIALS.map((item) => (
              <blockquote key={item.quote.slice(0, 48)} className="note">
                <p className="note-quote">{item.quote}</p>
                <footer className="note-meta">
                  <cite>{item.attribution}</cite>
                  <span>{item.detail}</span>
                </footer>
              </blockquote>
            ))}
          </AnimatedContent>
          <AnimatedContent distance={50} blur={8}>
            <blockquote className="letter">
              <p className="letter-quote">{THANK_YOU_NOTE.quote}</p>
              <footer className="letter-meta">
                <cite>{THANK_YOU_NOTE.attribution}</cite>
                <span>{THANK_YOU_NOTE.detail}</span>
              </footer>
            </blockquote>
          </AnimatedContent>
        </div>
      </section>

      <section className="paths" aria-labelledby="paths-heading">
        <div className="wrap">
          <Kicker>Get involved</Kicker>
          <h2 id="paths-heading" className="display-2">
            Two paths, <em>one</em> mission
          </h2>
          <AnimatedContent className="paths-grid" stagger={0.12} distance={50}>
            <article className="path path-student">
              <span className="path-glyph" aria-hidden="true">
                x²
              </span>
              <p className="path-tag">For learners</p>
              <h3>I am a student</h3>
              <p>
                Choose a subject for courses and bootcamps, live or past sessions, open questions, and free
                practice resources. Sign in when you are ready to enroll and unlock recordings.
              </p>
              <Link className="btn btn-ink" to="/students">
                Open Students <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="path path-mentor on-ink" data-tour="become-mentor">
              <span className="path-glyph" aria-hidden="true">
                ∞
              </span>
              <p className="path-tag">For volunteers</p>
              <h3>I am a mentor</h3>
              {isApprovedTutor ? (
                <>
                  <p>
                    Publish sessions, join courses, answer open questions, and support students from
                    Workspace.
                  </p>
                  <Link className="btn btn-primary" to="/mentors/dashboard">
                    Open Workspace <span aria-hidden="true">→</span>
                  </Link>
                </>
              ) : (
                <>
                  <p>
                    Apply to volunteer. Once approved, publish sessions, join courses, answer open
                    questions, and support students from Workspace.
                  </p>
                  <Link className="btn btn-primary" to="/mentors/join">
                    Become a mentor <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </article>
          </AnimatedContent>
        </div>
      </section>

      <section className="offers" aria-labelledby="offer-heading">
        <div className="wrap">
          <Kicker>Explore</Kicker>
          <div className="offers-head">
            <h2 id="offer-heading" className="display-2">
              What you <em>can</em> do
            </h2>
            <p className="lead">
              Everything starts in the student hub. Pick a subject, then open courses, the schedule, past
              sessions, questions, or resources from there.
            </p>
          </div>
          <AnimatedContent className="bento" stagger={0.1} distance={40}>
            {OFFERS.map((o) => (
              <SpotlightCard
                key={o.tour}
                theme="dark"
                className={`offer offer-${o.art}`}
                spotlightColor="#c5f04a"
                intensity={0.32}
                spotlightSize={320}
                data-tour={o.tour}
                style={INK_CARD}
              >
                <OfferArt kind={o.art} />
                <span className="offer-glyph" aria-hidden="true">
                  {o.glyph}
                </span>
                <h3>
                  <Link className="stretched-link" to={o.to}>
                    {o.title}
                  </Link>
                </h3>
                <p>{o.body}</p>
                <span className="offer-cta" aria-hidden="true">
                  {o.cta} <span>→</span>
                </span>
              </SpotlightCard>
            ))}
          </AnimatedContent>
        </div>
      </section>

      <Finale isApprovedTutor={isApprovedTutor} />
    </div>
  )
}

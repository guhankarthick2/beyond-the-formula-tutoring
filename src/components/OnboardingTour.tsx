import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { useAuth } from '@/lib/auth'
import { prefersReducedMotion, scrollToElement } from '@/lib/smoothScroll'
import { supabase } from '@/lib/supabase'
import './OnboardingTour.css'

interface TourStep {
  /** `data-tour` value of the element to highlight on the home page; omit for a centered card. */
  target?: string
  /** Header items are sticky, so there is nothing to scroll to. */
  scroll?: boolean
  eyebrow: string
  title: string
  body: ReactNode
}

const STEPS: TourStep[] = [
  {
    eyebrow: 'Welcome',
    title: 'Welcome to Beyond The Formula',
    body: (
      <p>
        Here is a quick, one-minute tour of where everything lives so you can get help fast. You can
        skip it at any time.
      </p>
    ),
  },
  {
    target: 'about',
    eyebrow: 'About us',
    title: 'What we believe',
    body: (
      <p>
        Start here to learn what Beyond The Formula stands for: steady practice, believing you can
        solve every problem, and understanding concepts instead of memorizing formulas. You will also
        find a note from our founder.
      </p>
    ),
  },
  {
    target: 'student-hub',
    scroll: false,
    eyebrow: 'Materials',
    title: 'The student hub',
    body: (
      <p>
        All learning materials live under <strong>Students</strong> (inside the menu on phones). Open
        it, pick a subject (like
        Precalculus or SAT), and you will see that subject&rsquo;s courses, schedule, past sessions,
        questions, and free resources.
      </p>
    ),
  },
  {
    target: 'offer-courses',
    eyebrow: 'What you can do · 1 of 4',
    title: 'Courses & bootcamps',
    body: (
      <p>
        Multi-session programs on one topic. Enroll once and every linked session unlocks, along with
        recordings when mentors publish them.
      </p>
    ),
  },
  {
    target: 'offer-sessions',
    eyebrow: 'What you can do · 2 of 4',
    title: 'Live & past sessions',
    body: (
      <p>
        Book an upcoming one-on-one or group session with a mentor, or enroll in a completed session
        to watch its recording and get the homework.
      </p>
    ),
  },
  {
    target: 'offer-questions',
    eyebrow: 'What you can do · 3 of 4',
    title: 'Open questions',
    body: (
      <p>
        Stuck on a problem? Post it under your subject and a mentor answers right in the thread.
      </p>
    ),
  },
  {
    target: 'offer-mentors',
    eyebrow: 'What you can do · 4 of 4',
    title: 'Meet the mentors',
    body: <p>Read mentor bios and see who teaches what before you book a session.</p>,
  },
  {
    target: 'become-mentor',
    eyebrow: 'Give back',
    title: 'Become a mentor',
    body: (
      <ol className="tour-steps">
        <li>
          Click <strong>Become a mentor</strong> and watch the short intro video.
        </li>
        <li>Read and accept the mentor expectations.</li>
        <li>Fill out the interest form. Once an admin approves it, you can host sessions.</li>
      </ol>
    ),
  },
  {
    eyebrow: 'All set',
    title: 'You are ready to go!',
    body: (
      <p>
        That is everything. You can replay this tour any time from <strong>Take the site tour</strong>{' '}
        at the bottom of every page.
      </p>
    ),
  },
]

const PAD = 10
const GAP = 16
const MARGIN = 16

type Box = { x: number; y: number; w: number; h: number }

/** First visible match, e.g. the phone menu button when the desktop nav link is hidden. */
function findTarget(step: TourStep): HTMLElement | null {
  if (!step.target) return null
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`)
  return Array.from(all).find((el) => el.getClientRects().length > 0) ?? null
}

/** Shows once after sign-up (profile.tutorial_completed_at is null) and on `?tour=1`. */
export function OnboardingTour() {
  const { user, profile, refreshProfile } = useAuth()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const replay = params.get('tour') === '1'
  const needsTour = Boolean(user && profile && profile.tutorial_completed_at === null)
  const [dismissed, setDismissed] = useState(false)
  const open = replay || (needsTour && !dismissed)

  const [index, setIndex] = useState(0)
  const step = STEPS[index]
  const last = index === STEPS.length - 1
  const rootRef = useRef<HTMLDivElement>(null)
  const holeRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  const close = useCallback(
    (then?: string) => {
      if (replay) {
        const next = new URLSearchParams(params)
        next.delete('tour')
        setParams(next, { replace: true })
      }
      if (needsTour) {
        setDismissed(true)
        if (user) {
          void supabase
            .from('profiles')
            .update({ tutorial_completed_at: new Date().toISOString() })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) console.error(error)
              else void refreshProfile()
            })
        }
      }
      if (then) navigate(then)
    },
    [replay, params, setParams, needsTour, user, refreshProfile, navigate],
  )

  const go = useCallback((delta: number) => {
    setIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)))
  }, [])

  // Highlighted steps live on the home page.
  useEffect(() => {
    if (open && step.target && pathname !== '/') navigate(`/${replay ? '?tour=1' : ''}`)
  }, [open, step, pathname, navigate, replay])

  // Find the target (it may still be rendering after navigation), bring it into view, animate the card in.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    let tries = 0
    targetRef.current = null
    const card = cardRef.current
    if (card && !prefersReducedMotion()) {
      gsap.fromTo(card, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', delay: 0.1 })
    }
    card?.focus({ preventScroll: true })
    const seek = () => {
      if (cancelled) return
      const el = findTarget(step)
      if (!el && step.target && tries++ < 90) {
        requestAnimationFrame(seek)
        return
      }
      targetRef.current = el
      if (el && step.scroll !== false) {
        // Clear the sticky header (tall on phones) plus some breathing room.
        const header = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0
        void scrollToElement(el, -(header + Math.round(window.innerHeight * 0.08)))
      }
    }
    seek()
    return () => {
      cancelled = true
    }
  }, [open, step])

  // Follow the target every frame so the spotlight tracks smooth scrolling and resizes.
  useLayoutEffect(() => {
    if (!open) return
    const hole = holeRef.current
    const card = cardRef.current
    if (!hole || !card) return
    const ease = prefersReducedMotion() ? 1 : 0.22
    let box: Box | null = null
    let raf = 0

    const frame = () => {
      raf = requestAnimationFrame(frame)
      const vw = window.innerWidth
      const vh = window.innerHeight
      const el = targetRef.current
      const r = el?.getBoundingClientRect()
      const goal: Box = r
        ? { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 }
        : { x: vw / 2, y: vh / 2, w: 0, h: 0 }
      box = box
        ? {
            x: box.x + (goal.x - box.x) * ease,
            y: box.y + (goal.y - box.y) * ease,
            w: box.w + (goal.w - box.w) * ease,
            h: box.h + (goal.h - box.h) * ease,
          }
        : goal
      hole.style.transform = `translate(${box.x}px, ${box.y}px)`
      hole.style.width = `${box.w}px`
      hole.style.height = `${box.h}px`
      hole.style.opacity = r ? '1' : '0'

      const cw = card.offsetWidth
      const ch = card.offsetHeight
      let left: number
      let top: number
      if (!r) {
        left = (vw - cw) / 2
        top = (vh - ch) / 2
      } else if (vw < 640) {
        left = MARGIN
        top = goal.y + goal.h + GAP + ch < vh - MARGIN ? goal.y + goal.h + GAP : vh - ch - MARGIN
        if (top < goal.y + goal.h && goal.y - GAP - ch > MARGIN) top = goal.y - GAP - ch
      } else {
        left = Math.min(Math.max(goal.x + goal.w / 2 - cw / 2, MARGIN), vw - cw - MARGIN)
        if (goal.y + goal.h + GAP + ch < vh - MARGIN) top = goal.y + goal.h + GAP
        else if (goal.y - GAP - ch > MARGIN) top = goal.y - GAP - ch
        else {
          // Target is taller than the screen: tuck the card into the corner.
          left = vw - cw - MARGIN * 2
          top = vh - ch - MARGIN * 2
        }
      }
      card.style.left = `${Math.round(left)}px`
      card.style.top = `${Math.round(Math.max(MARGIN, top))}px`
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Tab' && cardRef.current) {
        // Keep keyboard focus inside the dialog.
        const buttons = Array.from(cardRef.current.querySelectorAll<HTMLElement>('button'))
        const first = buttons[0]
        const lastBtn = buttons[buttons.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || active === cardRef.current)) {
          e.preventDefault()
          lastBtn?.focus()
        } else if (!e.shiftKey && (active === lastBtn || !cardRef.current.contains(active))) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, go])

  useLayoutEffect(() => {
    if (!open || !rootRef.current || prefersReducedMotion()) return
    gsap.fromTo(rootRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' })
  }, [open])

  if (!open) return null

  const firstName = profile?.display_name?.split(' ')[0]

  return createPortal(
    <div className="tour" ref={rootRef}>
      <div className={step.target ? 'tour-scrim' : 'tour-scrim tour-scrim-solid'} aria-hidden="true" />
      <div className="tour-hole" ref={holeRef} aria-hidden="true" />
      <div
        className="tour-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
      >
        <div className="tour-card-top">
          <span className="tour-eyebrow">{step.eyebrow}</span>
          <button type="button" className="tour-skip" onClick={() => close()}>
            Skip tour
          </button>
        </div>
        <h2 id="tour-title" className="tour-title">
          {index === 0 && firstName ? `Welcome, ${firstName}!` : step.title}
        </h2>
        <div id="tour-body" className="tour-body">
          {step.body}
        </div>
        <div className="tour-footer">
          <div className="tour-dots" aria-label={`Step ${index + 1} of ${STEPS.length}`} role="img">
            {STEPS.map((s, i) => (
              <span key={s.title} className={i === index ? 'tour-dot active' : i < index ? 'tour-dot done' : 'tour-dot'} />
            ))}
          </div>
          <div className="tour-actions">
            {index > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => go(-1)}>
                Back
              </button>
            )}
            {last ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => close()}>
                  Finish
                </button>
                <button type="button" className="btn btn-primary" onClick={() => close('/students')}>
                  Open student hub
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-primary" onClick={() => go(1)}>
                {index === 0 ? 'Start tour' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

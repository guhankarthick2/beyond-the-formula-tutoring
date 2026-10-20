import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger stays in sync. Mount once. */
export function useSmoothScroll() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (prefersReducedMotion()) return
    const instance = new Lenis({ anchors: true, allowNestedScroll: true, lerp: 0.11 })
    lenis = instance
    instance.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      lenis = null
    }
  }, [])

  // New page starts at the top; ScrollTriggers re-measure after the route renders.
  useEffect(() => {
    if (window.location.hash) return
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname])
}

/** Freezes page scrolling, e.g. while the phone menu covers the screen. */
export function setScrollLocked(locked: boolean) {
  document.documentElement.classList.toggle('scroll-locked', locked)
  if (locked) lenis?.stop()
  else lenis?.start()
}

/** Scroll so `el` sits comfortably in view. Resolves when the scroll settles. */
export function scrollToElement(el: Element, offset = -120): Promise<void> {
  return new Promise((resolve) => {
    if (lenis) {
      lenis.scrollTo(el as HTMLElement, { offset, duration: 0.9, force: true, onComplete: () => resolve() })
      return
    }
    const top = el.getBoundingClientRect().top + window.scrollY + offset
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    window.setTimeout(resolve, prefersReducedMotion() ? 0 : 600)
  })
}

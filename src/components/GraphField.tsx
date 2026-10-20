import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/smoothScroll'

const LIME = '197, 240, 74'
const SKY = '143, 208, 255'
const CORAL = '255, 122, 89'
const CHALK = '244, 241, 232'
const MONO = '500 11px "Geist Mono", ui-monospace, monospace'

// Two sines drifting against each other, and their derivative.
const f = (x: number, p: number) => 1.25 * Math.sin(0.85 * x + p) + 0.35 * Math.sin(2.05 * x - 0.6 * p)
const df = (x: number, p: number) => 1.0625 * Math.cos(0.85 * x + p) + 0.7175 * Math.cos(2.05 * x - 0.6 * p)

/**
 * A live graph: a drifting curve, its derivative, and a probe whose tangent line and
 * area-so-far follow the cursor across the parent element (or wander on their own).
 * Purely decorative, so it is hidden from assistive tech and pauses when off screen.
 */
export function GraphField({
  className,
  originX = 0.62,
  originY = 0.55,
}: {
  className?: string
  originX?: number
  originY?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = ref.current
    const host = canvasEl?.parentElement
    const context = canvasEl?.getContext('2d')
    if (!canvasEl || !host || !context) return
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = context

    const still = prefersReducedMotion()
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let w = 0
    let h = 0
    let unit = 48
    let ox = 0
    let oy = 0
    let probe = 1.1
    let target: number | null = null
    let raf = 0
    let last = 0
    let running = false
    let inView = false

    const sx = (x: number) => ox + x * unit
    const sy = (y: number) => oy - y * unit

    const label = (text: string, x: number, y: number, rgb: string) => {
      ctx.font = MONO
      const tw = ctx.measureText(text).width
      const bx = Math.min(Math.max(x, 10), w - tw - 16)
      const by = Math.min(Math.max(y, 22), h - 12)
      ctx.fillStyle = 'rgba(11, 14, 23, 0.85)'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(bx - 7, by - 14, tw + 14, 21, 7)
      else ctx.rect(bx - 7, by - 14, tw + 14, 21)
      ctx.fill()
      ctx.fillStyle = `rgb(${rgb})`
      ctx.fillText(text, bx, by)
    }

    const plot = (fn: (x: number) => number) => {
      ctx.beginPath()
      for (let px = 0; px <= w + 3; px += 3) {
        const y = sy(fn((px - ox) / unit))
        if (px === 0) ctx.moveTo(px, y)
        else ctx.lineTo(px, y)
      }
    }

    const draw = (now: number) => {
      const p = still ? 0.6 : now * 0.00022
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1

      // Graph paper: half units faint, whole units a touch brighter.
      for (const [every, alpha] of [
        [unit / 2, 0.035],
        [unit, 0.06],
      ]) {
        ctx.beginPath()
        for (let x = ox % every; x < w; x += every) {
          ctx.moveTo(Math.round(x) + 0.5, 0)
          ctx.lineTo(Math.round(x) + 0.5, h)
        }
        for (let y = oy % every; y < h; y += every) {
          ctx.moveTo(0, Math.round(y) + 0.5)
          ctx.lineTo(w, Math.round(y) + 0.5)
        }
        ctx.strokeStyle = `rgba(${CHALK}, ${alpha})`
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.moveTo(0, Math.round(oy) + 0.5)
      ctx.lineTo(w, Math.round(oy) + 0.5)
      ctx.moveTo(Math.round(ox) + 0.5, 0)
      ctx.lineTo(Math.round(ox) + 0.5, h)
      ctx.strokeStyle = `rgba(${CHALK}, 0.22)`
      ctx.stroke()
      ctx.font = MONO
      ctx.fillStyle = `rgba(${CHALK}, 0.3)`
      for (let n = Math.ceil(-ox / unit); sx(n) < w; n++) {
        if (n !== 0 && n % 2 === 0) ctx.fillText(String(n), sx(n) + 4, oy + 15)
      }

      // Signed area under the curve from 0 to the probe (trapezoid rule).
      const steps = 48
      const dx = probe / steps
      let prev = f(0, p)
      let area = 0
      ctx.beginPath()
      ctx.moveTo(sx(0), oy)
      ctx.lineTo(sx(0), sy(prev))
      for (let i = 1; i <= steps; i++) {
        const x = i * dx
        const y = f(x, p)
        area += ((prev + y) / 2) * dx
        prev = y
        ctx.lineTo(sx(x), sy(y))
      }
      ctx.lineTo(sx(probe), oy)
      ctx.closePath()
      ctx.fillStyle = `rgba(${LIME}, 0.12)`
      ctx.fill()

      plot((x) => df(x, p))
      ctx.setLineDash([4, 7])
      ctx.strokeStyle = `rgba(${SKY}, 0.5)`
      ctx.lineWidth = 1.25
      ctx.stroke()
      ctx.setLineDash([])

      plot((x) => f(x, p))
      ctx.strokeStyle = `rgba(${LIME}, 0.14)`
      ctx.lineWidth = 10
      ctx.stroke()
      ctx.strokeStyle = `rgb(${LIME})`
      ctx.lineWidth = 2.25
      ctx.stroke()

      const py = f(probe, p)
      const slope = df(probe, p)
      const reach = 1.7 / Math.hypot(1, slope)
      ctx.beginPath()
      ctx.moveTo(sx(probe - reach), sy(py - slope * reach))
      ctx.lineTo(sx(probe + reach), sy(py + slope * reach))
      ctx.strokeStyle = `rgb(${CORAL})`
      ctx.lineWidth = 1.75
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(sx(probe), sy(py))
      ctx.lineTo(sx(probe), oy)
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = `rgba(${CHALK}, 0.35)`
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])

      const pulse = still ? 0 : (Math.sin(now * 0.004) + 1) / 2
      ctx.beginPath()
      ctx.arc(sx(probe), sy(py), 9 + pulse * 6, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${LIME}, ${0.2 - pulse * 0.12})`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(sx(probe), sy(py), 5, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${LIME})`
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#0b0e17'
      ctx.stroke()

      // Narrow screens put the graph behind body text, so the readouts stay off there.
      if (w >= 560) {
        label(`slope f′(${probe.toFixed(2)}) = ${slope.toFixed(2)}`, sx(probe) + 16, sy(py) - 18, CORAL)
        label(`area ∫ f dx = ${area.toFixed(2)}`, sx(probe / 2) - 70, oy + (py > 0 ? 34 : -22), LIME)
      }
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(64, now - last)
      last = now
      const goal = target ?? 2.4 * Math.sin(now * 0.00032)
      probe += (goal - probe) * (1 - Math.exp(-dt / 160))
      draw(now)
    }

    const start = () => {
      if (running || still || !inView || document.hidden) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const resize = () => {
      const box = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = box.width
      h = box.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      unit = Math.min(84, Math.max(36, w / 16))
      ox = w * originX
      oy = h * originY
      draw(performance.now())
    }

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect()
      const x = (e.clientX - box.left - ox) / unit
      target = Math.min((w - ox) / unit - 0.5, Math.max(-ox / unit + 0.5, x))
    }
    const onLeave = () => {
      target = null
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    const sizer = new ResizeObserver(resize)
    sizer.observe(canvas)
    const watcher = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
      else stop()
    })
    watcher.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)
    if (finePointer && !still) {
      host.addEventListener('pointermove', onMove)
      host.addEventListener('pointerleave', onLeave)
    }
    // Labels use a web font; redraw once it arrives so a still frame is not left in the fallback.
    void document.fonts?.ready.then(() => draw(performance.now()))

    return () => {
      stop()
      sizer.disconnect()
      watcher.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [originX, originY])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}

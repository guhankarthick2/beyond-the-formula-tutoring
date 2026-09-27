import { useEffect, useRef } from 'react'
import { PageBack } from '@/components/PageBack'
import { usePageView } from '@/lib/stats'
import { UNIT1_TOPICS_11_12 } from '@/unit1/unit1-11-12-data.js'
import { initUnit1Quiz } from '@/unit1/unit1-quiz.js'

export function Unit1Topics1112TestPage() {
  usePageView('/students/precal/tests/unit-1-11-12')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const cleanup = initUnit1Quiz(el, UNIT1_TOPICS_11_12)
    return cleanup
  }, [])

  return (
    <section className="section">
      <PageBack to="/students/resources/precal" label="Back to Precal resources" />
      <div ref={rootRef} style={{ marginTop: '1rem' }} aria-live="polite" />
    </section>
  )
}

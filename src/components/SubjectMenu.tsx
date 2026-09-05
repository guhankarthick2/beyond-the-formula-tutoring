import { useLocation, useNavigate } from 'react-router-dom'
import { useSubject } from '@/lib/subject'
import { COMING_SOON_SUBJECTS } from '@/lib/subjects'

export function SubjectMenu({
  getHref,
  activeSlug,
  optionsId = 'subject-options',
}: {
  getHref: (slug: string) => string
  activeSlug?: string
  optionsId?: string
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { subjects } = useSubject()

  function pick(slug: string) {
    const href = getHref(slug)
    if (location.pathname === href) {
      document.getElementById(optionsId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate(href)
  }

  return (
    <div className="card-grid cols-2">
      {subjects.map((s) => {
        const selected = activeSlug === s.slug
        return (
          <button
            key={s.slug}
            type="button"
            className={`card card-accent card-student subject-card-btn${
              selected ? ' subject-card-active' : ''
            }`}
            onClick={() => pick(s.slug)}
          >
            <span className="card-icon" aria-hidden>
              📐
            </span>
            <h3>{s.shortName}</h3>
            <p>{s.description}</p>
            <span className="btn btn-primary">{selected ? 'Selected' : `Select ${s.shortName}`}</span>
          </button>
        )
      })}
      {COMING_SOON_SUBJECTS.map((s) => (
        <article key={s.slug} className="card card-locked subject-card-disabled">
          <h3>{s.name}</h3>
          <p>Coming soon.</p>
          <span className="badge">Coming soon</span>
        </article>
      ))}
    </div>
  )
}

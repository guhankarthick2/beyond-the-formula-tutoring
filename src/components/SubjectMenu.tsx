import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSubject } from '@/lib/subject'
import {
  countLabel,
  fetchAllSubjectLiveStats,
  hubStatsFor,
  subjectLooksEmpty,
  totalSessions,
  type SubjectLiveStats,
} from '@/lib/subjectStats'

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
  const [live, setLive] = useState<Record<string, SubjectLiveStats> | null>(null)

  useEffect(() => {
    let mounted = true
    void fetchAllSubjectLiveStats().then((stats) => {
      if (mounted) setLive(stats)
    })
    return () => {
      mounted = false
    }
  }, [])

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
        const stats = hubStatsFor(
          s,
          live?.[s.slug] ?? { upcoming: 0, past: 0, courses: 0, openQuestions: 0 },
        )
        const comingSoon = subjectLooksEmpty(stats)
        const sessions = totalSessions(stats)
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
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              {comingSoon ? (
                <>Coming soon — explore anyway</>
              ) : (
                <>
                  {stats.courses > 0
                    ? `${countLabel(stats.courses, 'course')} · ${countLabel(sessions, 'session')}`
                    : countLabel(sessions, 'session')}
                  {stats.materials > 0 ? ` · ${countLabel(stats.materials, 'material')}` : ''}
                </>
              )}
            </p>
            {comingSoon && <span className="badge">Coming soon</span>}
            <span className="btn btn-primary">{selected ? 'Selected' : `Open ${s.shortName}`}</span>
          </button>
        )
      })}
    </div>
  )
}

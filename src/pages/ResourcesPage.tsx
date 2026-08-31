import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { SubjectSelect } from '@/components/SubjectSelect'
import {
  getSubject,
  RESOURCE_KIND_LABELS,
  resourcesByKind,
  SUBJECTS,
  type ResourceKind,
  type Subject,
} from '@/lib/subjects'
import { usePageView } from '@/lib/stats'
import { useSubject } from '@/lib/subject'

function ResourceItem({ resource }: { resource: Subject['resources'][number] }) {
  const inner = (
    <>
      <h4 style={{ margin: '0 0 0.35rem' }}>{resource.title}</h4>
      <p className="muted" style={{ margin: 0, fontSize: '0.92rem' }}>
        {resource.description}
      </p>
      {resource.comingSoon && (
        <span className="badge badge-amber" style={{ marginTop: '0.5rem' }}>
          Coming soon
        </span>
      )}
    </>
  )

  if (resource.comingSoon) {
    return <article className="card resource-card resource-card-soon">{inner}</article>
  }

  if (resource.external) {
    return (
      <a
        className="card resource-card"
        href={resource.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {inner}
      </a>
    )
  }

  return (
    <Link className="card resource-card" to={resource.href}>
      {inner}
    </Link>
  )
}

function SubjectResources({ subject }: { subject: Subject }) {
  const grouped = resourcesByKind(subject)
  const kinds = (Object.keys(grouped) as ResourceKind[]).filter((k) => grouped[k].length > 0)

  return (
    <div className="stack">
      {kinds.map((kind) => (
        <section key={kind} className="resource-category">
          <h2 className="resource-category-title">{RESOURCE_KIND_LABELS[kind]}</h2>
          <div className="card-grid cols-2">
            {grouped[kind].map((r) => (
              <ResourceItem key={r.id} resource={r} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function ResourcesPage() {
  usePageView('/students/resources')
  const { setSubjectSlug } = useSubject()
  const { subjectSlug } = useParams<{ subjectSlug?: string }>()
  const activeSubject = subjectSlug ? getSubject(subjectSlug) : null

  useEffect(() => {
    if (subjectSlug && getSubject(subjectSlug)) {
      setSubjectSlug(subjectSlug)
    }
  }, [subjectSlug, setSubjectSlug])

  if (subjectSlug && !activeSubject) {
    return <Navigate to="/students/resources" replace />
  }

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-blue">Free · Public</span>
        </div>
        <h1 className="page-title">Free resources</h1>
        <p className="lead" style={{ margin: 0 }}>
          Practice tests, videos, and worksheets — organized by subject. No login required.
        </p>
      </div>

      <div className="subject-tabs" role="tablist" aria-label="Subjects">
        <Link
          className={`subject-tab ${!activeSubject ? 'subject-tab-active' : ''}`}
          to="/students/resources"
          role="tab"
          aria-selected={!activeSubject}
        >
          All subjects
        </Link>
        {SUBJECTS.map((s) => (
          <Link
            key={s.slug}
            className={`subject-tab ${activeSubject?.slug === s.slug ? 'subject-tab-active' : ''}`}
            to={`/students/resources/${s.slug}`}
            role="tab"
            aria-selected={activeSubject?.slug === s.slug}
            onClick={() => setSubjectSlug(s.slug)}
          >
            {s.shortName}
          </Link>
        ))}
      </div>

      {!activeSubject ? (
        <div className="stack" style={{ marginTop: '1.25rem' }}>
          {SUBJECTS.map((subject) => (
            <div key={subject.slug} className="card stack">
              <div className="resource-subject-head">
                <h2 style={{ margin: 0 }}>{subject.name}</h2>
                <Link className="btn btn-secondary" to={`/students/resources/${subject.slug}`}>
                  View all
                </Link>
              </div>
              <SubjectResources subject={subject} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: '1.25rem' }}>
          <div className="subject-toolbar" style={{ marginBottom: '1rem' }}>
            <SubjectSelect id="subject-select-resources" mode="resources" />
            <Link className="btn btn-ghost" to={`/students/${activeSubject.slug}`}>
              ← {activeSubject.shortName} hub
            </Link>
            <Link className="btn btn-primary" to={`/students/${activeSubject.slug}/schedule`}>
              Enroll in a session
            </Link>
          </div>
          <SubjectResources subject={activeSubject} />
        </div>
      )}
    </section>
  )
}

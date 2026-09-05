import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { SubjectMenu } from '@/components/SubjectMenu'
import { getSubject } from '@/lib/subjects'
import { usePageView } from '@/lib/stats'
import { useSubject } from '@/lib/subject'

export function ResourcesPage() {
  usePageView('/students/resources')
  const { setSubjectSlug } = useSubject()
  const { subjectSlug } = useParams<{ subjectSlug?: string }>()
  const subject = subjectSlug ? getSubject(subjectSlug) : null

  useEffect(() => {
    if (subjectSlug && getSubject(subjectSlug)) {
      setSubjectSlug(subjectSlug)
    }
  }, [subjectSlug, setSubjectSlug])

  if (subjectSlug && !subject) {
    return <Navigate to="/students/resources" replace />
  }

  const recordingsPath = subject ? `/students/${subject.slug}/recordings` : ''
  const testPath = subject ? `/students/${subject.slug}/tests/unit-1` : ''
  const materials = subject?.resources.filter((r) => r.kind === 'notes' || r.kind === 'link') ?? []

  return (
    <section className="section">
      <PageBack
        to={subject ? '/students/resources' : '/'}
        label={subject ? 'Back to Free Resources' : 'Back to home'}
      />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-blue">Free · Public</span>
          {subject && <span className="badge badge-green">{subject.shortName}</span>}
        </div>
        <h1 className="page-title">Free Resources</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          {subject
            ? `Open the same ${subject.shortName} recordings, materials, and tests from the student hub.`
            : 'Choose a subject. Recordings, materials, and tests are the same pages as the student hub — no extra copies.'}
        </p>
      </div>

      {subject && (
        <div id="subject-options" className="stack" style={{ marginTop: '1.25rem' }}>
          <div className="card-grid cols-2">
            <article className="card stack">
              <h3>Session Recordings</h3>
              <p>Topic-by-topic session recordings — the same list as the {subject.shortName} hub.</p>
              <Link className="btn btn-secondary" to={recordingsPath}>
                Open recordings
              </Link>
            </article>
            <article className="card stack">
              <h3>Materials</h3>
              <p>Worksheets, notes, and extra practice for {subject.shortName}.</p>
              <a className="btn btn-secondary" href="#materials">
                View materials
              </a>
            </article>
            <article className="card card-accent card-student stack">
              <h3>Tests</h3>
              <p>The same Unit 1 practice assessment from the {subject.shortName} hub.</p>
              <Link className="btn btn-primary" to={testPath}>
                Take the {subject.shortName} test
              </Link>
            </article>
          </div>

          <div id="materials" className="card stack">
            <h2 style={{ margin: 0 }}>Materials</h2>
            {materials.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Materials for this subject will appear here.
              </p>
            ) : (
              <ul className="schedule-list">
                {materials.map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    {' — '}
                    {item.description}{' '}
                    {item.external ? (
                      <a href={item.href} rel="noopener noreferrer" target="_blank">
                        Open
                      </a>
                    ) : (
                      <Link to={item.href}>Open</Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <h2 className="subject-picker-title">
          {subject ? 'Change subject' : 'Select your subject'}
        </h2>
        <SubjectMenu
          getHref={(slug) => `/students/resources/${slug}`}
          activeSlug={subject?.slug}
        />
      </div>
    </section>
  )
}

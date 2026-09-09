import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { SubjectMenu } from '@/components/SubjectMenu'
import { getSubject } from '@/lib/subjects'
import { usePageView } from '@/lib/stats'
import { useSubject } from '@/lib/subject'
import {
  countLabel,
  fetchAllSubjectLiveStats,
  hubStatsFor,
  type SubjectLiveStats,
} from '@/lib/subjectStats'

export function ResourcesPage() {
  usePageView('/students/resources')
  const { setSubjectSlug } = useSubject()
  const { subjectSlug } = useParams<{ subjectSlug?: string }>()
  const subject = subjectSlug ? getSubject(subjectSlug) : null
  const [live, setLive] = useState<SubjectLiveStats | null>(null)

  useEffect(() => {
    if (subjectSlug && getSubject(subjectSlug)) {
      setSubjectSlug(subjectSlug)
    }
  }, [subjectSlug, setSubjectSlug])

  useEffect(() => {
    if (!subject) {
      setLive(null)
      return
    }
    let mounted = true
    void fetchAllSubjectLiveStats().then((all) => {
      if (mounted) setLive(all[subject.slug] ?? null)
    })
    return () => {
      mounted = false
    }
  }, [subject])

  if (subjectSlug && !subject) {
    return <Navigate to="/students/resources" replace />
  }

  const pastPath = subject ? `/students/${subject.slug}/past` : ''
  const testHref =
    subject?.resources.find((r) => r.kind === 'test' && !r.comingSoon)?.href ?? ''
  const materials =
    subject?.resources.filter(
      (r) => r.kind === 'notes' || r.kind === 'link' || r.kind === 'video',
    ) ?? []
  const stats = subject
    ? hubStatsFor(subject, live ?? { upcoming: 0, past: 0, courses: 0, openQuestions: 0 })
    : null

  return (
    <section className="section">
      <PageBack
        to={subject ? `/students/${subject.slug}` : '/students'}
        label={subject ? `Back to ${subject.shortName}` : 'Back to Students'}
      />

      <div className="page-banner page-banner-student">
        <div className="badge-row">
          <span className="badge badge-blue">Free · Public</span>
          {subject && <span className="badge badge-green">{subject.shortName}</span>}
        </div>
        <h1 className="page-title">Free Resources</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          {subject
            ? `Past sessions, materials, and tests for ${subject.shortName} — same tools as the subject hub.`
            : 'Choose a subject. Past sessions, materials, and tests match the student hub.'}
        </p>
      </div>

      {subject && stats && (
        <div id="subject-options" className="stack">
          <div className="card-grid cols-2">
            <article className="card stack">
              <h3>Past sessions</h3>
              <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>{stats.past}</strong> —{' '}
                {stats.past === 0
                  ? 'none listed yet'
                  : `${countLabel(stats.past, 'past session')} (incl. bootcamps)`}
              </p>
              <p>
                Standalone past sessions are listed here; bootcamp sessions unlock under{' '}
                <Link to={`/students/${subject.slug}/courses`}>Courses</Link>. Sign in and enroll to
                unlock recordings.
              </p>
              <Link className="btn btn-secondary" to={pastPath}>
                Browse past sessions
              </Link>
            </article>
            <article className="card stack">
              <h3>Materials</h3>
              <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>{stats.materials}</strong> —{' '}
                {stats.materials === 0
                  ? 'none published yet'
                  : countLabel(stats.materials, 'material')}
              </p>
              <p>Worksheets, notes, and extra practice for {subject.shortName}.</p>
              <a className="btn btn-secondary" href="#materials">
                View materials
              </a>
            </article>
            <article className="card card-accent card-student stack">
              <h3>Tests</h3>
              <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                <strong>{stats.tests}</strong> —{' '}
                {stats.tests === 0
                  ? 'no interactive tests yet'
                  : countLabel(stats.tests, 'practice test')}
              </p>
              <p>
                {stats.tests > 0
                  ? `Practice assessments for ${subject.shortName}.`
                  : `Tests for ${subject.shortName} will appear here when ready.`}
              </p>
              {testHref ? (
                <Link className="btn btn-primary" to={testHref}>
                  Take a test
                </Link>
              ) : (
                <span className="btn btn-secondary" aria-disabled="true">
                  Coming soon
                </span>
              )}
            </article>
          </div>

          <div id="materials" className="card stack">
            <h2 style={{ margin: 0 }}>Materials ({stats.materials})</h2>
            {materials.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                0 materials for {subject.shortName} yet — worksheets and notes will show up here.
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

      <div className="card-grid-spacer">
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

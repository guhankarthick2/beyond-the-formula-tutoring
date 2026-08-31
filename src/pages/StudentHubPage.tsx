import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { SubjectSelect } from '@/components/SubjectSelect'
import { useAuth } from '@/lib/auth'
import { usePageView } from '@/lib/stats'
import { useSubject, useSubjectPicker } from '@/lib/subject'
import { COMING_SOON_SUBJECTS, getSubject } from '@/lib/subjects'

export function StudentHubPage() {
  usePageView('/students')
  const { subject, subjects } = useSubject()
  const pickSubject = useSubjectPicker()

  if (subject) {
    return <Navigate to={`/students/${subject.slug}`} replace />
  }

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-green">Open to everyone</span>
        </div>
        <h1 className="page-title">Student hub</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Choose a subject to browse free resources and enroll in live sessions with a mentor.
        </p>
      </div>

      <div className="subject-picker-panel" style={{ marginTop: '1.25rem' }}>
        <h2 className="subject-picker-title">Select your subject</h2>
        <SubjectSelect id="subject-select-hub" />
        <div className="card-grid cols-2" style={{ marginTop: '1rem' }}>
          {subjects.map((s) => (
            <button
              key={s.slug}
              type="button"
              className="card card-accent card-student subject-card-btn"
              onClick={() => pickSubject(s.slug)}
            >
              <span className="card-icon" aria-hidden>📐</span>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              <span className="btn btn-primary">Select {s.shortName}</span>
            </button>
          ))}
          {COMING_SOON_SUBJECTS.map((s) => (
            <article key={s.slug} className="card card-locked subject-card-disabled">
              <h3>{s.name}</h3>
              <p className="muted">Coming soon — more STEM subjects on the way.</p>
              <span className="badge badge-amber">Coming soon</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function StudentSubjectPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)
  const { setSubjectSlug, clearSubject } = useSubject()
  const { user } = useAuth()

  useEffect(() => {
    if (subjectSlug && getSubject(subjectSlug)) {
      setSubjectSlug(subjectSlug)
    }
  }, [subjectSlug, setSubjectSlug])

  usePageView(subject ? `/students/${subject.slug}` : '/students')

  if (!subject) {
    return <Navigate to="/students" replace />
  }

  const schedulePath = `/students/${subject.slug}/schedule`
  const resourcesPath = `/students/resources/${subject.slug}`

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-green">Open to everyone</span>
          <span className="badge badge-blue">{subject.name}</span>
        </div>
        <h1 className="page-title">{subject.name}</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          {subject.description}
        </p>
        <div className="subject-toolbar">
          <SubjectSelect id="subject-select-active" />
          <Link className="btn btn-ghost" to="/students" onClick={() => clearSubject()}>
            Change subject
          </Link>
        </div>
      </div>

      <div className="card-grid cols-2" style={{ marginTop: '1.25rem' }}>
        <article className="card card-accent card-student">
          <h3>Free resources</h3>
          <p>
            Practice tests, video lessons, and worksheets — organized by subject. No enrollment
            required.
          </p>
          <Link className="btn btn-secondary" to={resourcesPath}>
            Browse {subject.shortName} resources
          </Link>
        </article>
        <article className="card card-accent card-student">
          <h3>Enroll in a session</h3>
          <p>
            See upcoming {subject.shortName} sessions with mentors. Sign in to enroll and unlock
            homework.
          </p>
          <Link className="btn btn-primary" to={schedulePath}>
            View {subject.shortName} schedule
          </Link>
        </article>
        <article className="card card-locked">
          <h3>My sessions</h3>
          <p>
            {user
              ? 'Your schedule, homework, and mentor messages for enrolled sessions.'
              : 'Sign in and enroll to unlock your personal schedule and homework.'}
          </p>
          {user ? (
            <Link className="btn btn-primary" to="/students/my-sessions">
              Open my sessions
            </Link>
          ) : (
            <Link className="btn btn-secondary" to="/auth">
              Sign in to enroll
            </Link>
          )}
        </article>
        <article className="card">
          <h3>All free resources</h3>
          <p>Browse every subject&apos;s public library in one place.</p>
          <Link className="btn btn-ghost" to="/students/resources">
            All subjects →
          </Link>
        </article>
      </div>

      <div className="callout callout-info" style={{ marginTop: '1.5rem' }}>
        <strong>Not enrolled yet?</strong> Free resources stay open to everyone. Enrolling adds your
        session schedule and mentor-assigned homework.
      </div>
    </section>
  )
}

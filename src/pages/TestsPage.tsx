import { Link } from 'react-router-dom'
import { usePageView } from '@/lib/stats'

export function TestsPage() {
  usePageView('/students/tests')

  return (
    <section className="section">
      <div className="page-banner page-banner-student">
        <div className="badge-row">
          <span className="badge badge-blue">Public</span>
        </div>
        <h1 className="page-title">Practice tests</h1>
        <p className="lead" style={{ margin: 0 }}>
          Interactive assessments open to everyone — no enrollment required.
        </p>
      </div>

      <div className="card-grid cols-2" style={{ marginTop: '1.25rem' }}>
        <article className="card card-accent card-student">
          <h3>AP Precalculus — Unit 1</h3>
          <p>
            40-question assessment with per-question feedback, a question navigator, and partial
            credit on multi-part items.
          </p>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Difficulty increases through the test. Extension questions are not expected for AP Precal only.
          </p>
          <span className="btn btn-primary" style={{ opacity: 0.7, cursor: 'default' }}>
            Coming soon in this portal
          </span>
        </article>
        <article className="card">
          <h3>More subjects coming</h3>
          <p>
            Beyond The Formula is expanding beyond one course. New practice tests will appear here as
            mentors add subjects.
          </p>
          <Link className="btn btn-secondary" to="/students">
            Back to student hub
          </Link>
        </article>
      </div>
    </section>
  )
}

import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { usePageView } from '@/lib/stats'
import { getSubject } from '@/lib/subjects'

export function RecordingsPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)

  usePageView(subject ? `/students/${subject.slug}/recordings` : '/students')

  if (!subject) {
    return <Navigate to="/students" replace />
  }

  const rows = subject.recordings.filter((item) => item.href)

  return (
    <section className="section">
      <PageBack to={`/students/${subject.slug}`} label={`Back to ${subject.shortName}`} />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-blue">{subject.name}</span>
        </div>
        <h1 className="page-title">Session Recordings</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          AP Precalculus lessons by topic number. Each Open link goes to the matching video on the
          Beyond The Formula Tutoring YouTube channel.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        {rows.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Recordings for this subject will appear here.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Details</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>{row.details}</td>
                    <td>
                      <a
                        className="btn btn-secondary"
                        href={row.href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="muted" style={{ marginTop: '1rem' }}>
        Looking for live help instead?{' '}
        <Link to={`/students/${subject.slug}/schedule`}>View the {subject.shortName} schedule</Link>.
      </p>
    </section>
  )
}

import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { useTopics } from '@/lib/hooks'
import { usePageView } from '@/lib/stats'
import { getSubject, topicRecordingUrl } from '@/lib/subjects'

export function RecordingsPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)
  const { topics } = useTopics()

  usePageView(subject ? `/students/${subject.slug}/recordings` : '/students')

  if (!subject) {
    return <Navigate to="/students" replace />
  }

  const dbBySlug = new Map(topics.map((t) => [t.slug, t]))
  const dbByName = new Map(topics.map((t) => [t.name.toLowerCase(), t]))
  const catalogSlugs = new Set(subject.recordings.map((r) => r.slug))

  const rows = [
    ...subject.recordings.map((item) => {
      const db = dbBySlug.get(item.slug) ?? dbByName.get(item.name.toLowerCase())
      return {
        key: item.slug,
        name: item.name,
        details: item.details,
        href: topicRecordingUrl(item.name, db?.youtube_url ?? item.href),
      }
    }),
    ...topics
      .filter((t) => !catalogSlugs.has(t.slug))
      .map((t) => ({
        key: t.id,
        name: t.name,
        details: 'Session recording for this topic.',
        href: topicRecordingUrl(t.name, t.youtube_url),
      })),
  ]

  return (
    <section className="section">
      <PageBack to={`/students/${subject.slug}`} label={`Back to ${subject.shortName}`} />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-blue">{subject.name}</span>
        </div>
        <h1 className="page-title">Session Recordings</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Open a topic recording. Each link goes to that topic&apos;s video, or searches the channel
          if a specific video has not been assigned yet.
        </p>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
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
                <tr key={row.key}>
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
      </div>
      <p className="muted" style={{ marginTop: '1rem' }}>
        Looking for live help instead?{' '}
        <Link to={`/students/${subject.slug}/schedule`}>View the {subject.shortName} schedule</Link>.
      </p>
    </section>
  )
}

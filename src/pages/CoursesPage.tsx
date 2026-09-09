import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { StatusPill } from '@/components/StatusPill'
import { useAuth } from '@/lib/auth'
import { courseFlyerUrl, coursePath } from '@/lib/courses'
import { mentorProfilePath } from '@/lib/mentors'
import { formatDate } from '@/lib/hooks'
import { formatSlotTopics, SLOT_TOPICS_EMBED } from '@/lib/sessionTopics'
import { usePageView } from '@/lib/stats'
import { getSubject } from '@/lib/subjects'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { AvailabilitySlot, Course, CourseMentorDir } from '@/lib/types'

export function CoursesListPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageView(subject ? `/students/${subject.slug}/courses` : '/students')

  useEffect(() => {
    if (!subject || !isSupabaseConfigured) {
      setCourses([])
      setLoading(false)
      return
    }
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('courses')
        .select('*')
        .eq('subject_slug', subject.slug)
        .eq('status', 'published')
        .order('starts_on', { ascending: false, nullsFirst: false })
      if (!mounted) return
      if (err) setError(err.message)
      else setCourses((data as Course[]) ?? [])
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [subject])

  if (!subject) return <Navigate to="/students" replace />

  return (
    <section className="section">
      <PageBack to={`/students/${subject.slug}`} label={`Back to ${subject.shortName}`} />

      <div className="page-banner page-banner-student">
        <div className="badge-row">
          <span className="badge badge-blue">{subject.name}</span>
        </div>
        <h1 className="page-title">Courses &amp; bootcamps</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Multi-session programs for {subject.shortName}. Enroll once to unlock every session under
          the course.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted">
          Loading…
        </p>
      ) : courses.length === 0 ? (
        <div className="empty">
          0 published courses for {subject.shortName} yet. Mentors and admins can add bootcamps
          anytime — this page is ready when they do.
        </div>
      ) : (
        <div className="stack">
          {courses.map((c) => {
            const flyer = courseFlyerUrl(c.flyer_path)
            return (
              <article key={c.id} className="card" style={{ overflow: 'hidden', padding: 0 }}>
                {flyer && (
                  <Link to={coursePath(subject.slug, c.slug)} className="course-flyer-link">
                    <img className="course-flyer-thumb" src={flyer} alt="" />
                  </Link>
                )}
                <div className="stack" style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
                  <h2 style={{ margin: 0 }}>
                    <Link to={coursePath(subject.slug, c.slug)}>{c.title}</Link>
                  </h2>
                  {c.summary && <p style={{ margin: 0 }}>{c.summary}</p>}
                  <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                    {c.location_note ? `${c.location_note} · ` : ''}
                    {c.starts_on && c.ends_on
                      ? `${formatDate(c.starts_on)} – ${formatDate(c.ends_on)}`
                      : c.starts_on
                        ? `From ${formatDate(c.starts_on)}`
                        : 'Schedule TBA'}
                  </p>
                  <div>
                    <Link className="btn btn-primary" to={coursePath(subject.slug, c.slug)}>
                      View course
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function CourseDetailPage() {
  const { subjectSlug, courseSlug } = useParams<{ subjectSlug: string; courseSlug: string }>()
  const subject = getSubject(subjectSlug)
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [mentors, setMentors] = useState<CourseMentorDir[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  usePageView(
    subject && courseSlug
      ? `/students/${subject.slug}/courses/${courseSlug}`
      : '/students',
  )

  const load = useCallback(async () => {
    if (!subject || !courseSlug || !isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data: c, error: cErr } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', courseSlug)
      .eq('subject_slug', subject.slug)
      .maybeSingle()

    if (cErr || !c) {
      setError(cErr?.message ?? 'Course not found')
      setCourse(null)
      setSlots([])
      setLoading(false)
      return
    }

    const courseRow = c as Course
    setCourse(courseRow)

    const [{ data: slotRows, error: sErr }, { data: mentorRows }] = await Promise.all([
      supabase
        .from('availability_slots')
        .select(
          `*, ${SLOT_TOPICS_EMBED}, profiles!availability_slots_tutor_id_fkey(display_name)`,
        )
        .eq('course_id', courseRow.id)
        .neq('status', 'cancelled')
        .order('session_date', { ascending: true }),
      supabase
        .from('course_mentor_directory')
        .select('*')
        .eq('course_id', courseRow.id)
        .order('sort_order'),
    ])

    if (sErr) setError(sErr.message)
    setSlots((slotRows as AvailabilitySlot[]) ?? [])
    setMentors((mentorRows as CourseMentorDir[]) ?? [])

    if (user) {
      const { data: en } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('course_id', courseRow.id)
        .eq('student_id', user.id)
        .maybeSingle()
      setEnrolled(Boolean(en))
    } else {
      setEnrolled(false)
    }

    setLoading(false)
  }, [subject, courseSlug, user])

  useEffect(() => {
    void load()
  }, [load])

  if (!subject) return <Navigate to="/students" replace />

  async function enroll() {
    if (!user || !course) return
    setBusy(true)
    setError(null)
    setInfo(null)
    const { error: err } = await supabase.rpc('enroll_in_course', { p_course_id: course.id })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setInfo('Enrolled — all sessions under this course are unlocked in My sessions.')
    await load()
  }

  if (loading) {
    return (
      <section className="section">
        <p className="muted">Loading…</p>
      </section>
    )
  }

  if (!course) {
    return (
      <section className="section">
        <PageBack to={`/students/${subject.slug}/courses`} label="Back to courses" />
        <div className="alert alert-error">{error ?? 'Course not found'}</div>
      </section>
    )
  }

  if (course.status !== 'published') {
    return <Navigate to={`/students/${subject.slug}/courses`} replace />
  }

  const flyer = courseFlyerUrl(course.flyer_path)
  const listPath = `/students/${subject.slug}/courses`
  const authNext = `/auth?next=${encodeURIComponent(coursePath(subject.slug, course.slug))}`

  return (
    <section className="section">
      <PageBack to={listPath} label={`Back to ${subject.shortName} courses`} />

      {flyer && (
        <div className="course-flyer-hero">
          <img src={flyer} alt={`${course.title} flyer`} />
        </div>
      )}

      <div className="page-banner page-banner-student" style={{ marginTop: flyer ? '0.65rem' : undefined }}>
        <div className="badge-row">
          <span className="badge badge-blue">{subject.name}</span>
          {enrolled && <span className="badge badge-green">Enrolled</span>}
        </div>
        <h1 className="page-title">{course.title}</h1>
        {course.summary && (
          <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
            {course.summary}
          </p>
        )}
      </div>

      <p className="muted" style={{ marginTop: '0.75rem' }}>
        {course.location_note ? `${course.location_note} · ` : ''}
        {course.starts_on && course.ends_on
          ? `${formatDate(course.starts_on)} – ${formatDate(course.ends_on)}`
          : null}
      </p>

      {mentors.length > 0 && (
        <p style={{ marginTop: '0.75rem' }}>
          <strong>Led by</strong>{' '}
          {mentors.map((m, i) => (
            <span key={m.mentor_id}>
              {i > 0 ? ', ' : ''}
              {m.is_public && m.mentor_slug ? (
                <Link to={mentorProfilePath(m.mentor_slug)}>{m.display_name}</Link>
              ) : (
                m.display_name
              )}
            </span>
          ))}
          {' · '}
          <Link to="/mentors">Mentors</Link>
        </p>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-ok">{info}</div>}

      <div className="card stack" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Enroll</h2>
        <p className="muted" style={{ margin: 0 }}>
          One enrollment unlocks every session in this course (recordings and artifacts), including
          past sessions if you join mid-program. They also appear under My sessions.
        </p>
        {enrolled ? (
          <p style={{ margin: 0 }}>
            You are enrolled.{' '}
            <Link to="/students/my-sessions">Open My sessions</Link>
          </p>
        ) : user ? (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void enroll()}>
            {busy ? 'Enrolling…' : 'Enroll in course'}
          </button>
        ) : (
          <Link className="btn btn-primary" to={authNext}>
            Sign in to enroll
          </Link>
        )}
      </div>

      {course.body && (
        <div className="card" style={{ marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
          {course.body}
        </div>
      )}

      <h2>Sessions</h2>
      {slots.length === 0 ? (
        <div className="empty">Sessions will appear here as they are scheduled.</div>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th>Mentor</th>
                <th>Status</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => {
                const hasRecording = Boolean(s.meeting_url?.trim())
                const lead = mentors.find((m) => m.mentor_id === s.tutor_id)
                const mentorLabel = s.profiles?.display_name ?? lead?.display_name ?? 'Mentor'
                const mentorSlug = lead?.is_public ? lead.mentor_slug : null
                return (
                  <tr key={s.id}>
                    <td>{formatDate(s.session_date)}</td>
                    <td>
                      <strong>{s.time_note || formatSlotTopics(s, 'Session')}</strong>
                    </td>
                    <td>
                      {mentorSlug ? (
                        <Link to={mentorProfilePath(mentorSlug)}>{mentorLabel}</Link>
                      ) : (
                        mentorLabel
                      )}
                    </td>
                    <td>
                      <StatusPill status={s.status} />
                    </td>
                    <td>
                      {enrolled && hasRecording ? (
                        <a
                          className="btn btn-secondary"
                          href={s.meeting_url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Open link
                        </a>
                      ) : enrolled ? (
                        <span className="muted">Enrolled</span>
                      ) : (
                        <span className="muted">Enroll to unlock</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

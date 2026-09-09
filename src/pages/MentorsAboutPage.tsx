import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { MentorMonogram } from '@/components/MentorMonogram'
import { PageBack } from '@/components/PageBack'
import { StatusPill } from '@/components/StatusPill'
import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/lib/contact'
import { coursePath } from '@/lib/courses'
import { formatDate } from '@/lib/hooks'
import { mentorBioExcerpt, mentorProfilePath } from '@/lib/mentors'
import { formatSlotTopics, SLOT_TOPICS_EMBED } from '@/lib/sessionTopics'
import { usePageView } from '@/lib/stats'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { AvailabilitySlot, Course, PublicMentorProfile } from '@/lib/types'

export function MentorsAboutPage() {
  usePageView('/mentors')
  const [mentors, setMentors] = useState<PublicMentorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let mounted = true
    ;(async () => {
      const { data, error: err } = await supabase
        .from('public_mentor_profiles')
        .select('*')
        .order('session_count', { ascending: false })
        .order('display_name', { ascending: true })
      if (!mounted) return
      if (err) setError(err.message)
      else setMentors((data as PublicMentorProfile[]) ?? [])
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="section">
      <PageBack to="/" label="Back to home" />

      <div className="page-banner page-banner-mentor">
        <div className="badge-row">
          <span className="badge badge-violet">Our mentors</span>
        </div>
        <h1 className="page-title">Mentors</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Volunteer mentors in their own words — no photos, just people who love teaching math and
          STEM. Listed by how many sessions they have led. Browse a profile to see courses and
          sessions.
        </p>
        <div className="btn-group">
          <Link className="btn btn-secondary" to="/mentors/join">
            Become a mentor
          </Link>
        </div>
      </div>

      <p className="muted" style={{ marginTop: '1rem' }}>
        Bios are written by mentors. For program questions, email{' '}
        <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a> — personal emails stay private.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : mentors.length === 0 ? (
        <div className="empty">
          Mentor profiles will appear here as mentors publish them. Mentors: open Workspace to add a
          bio; admins can also publish profiles under Tutor apps.
        </div>
      ) : (
        <div className="mentor-directory">
          {mentors.map((m, index) => (
            <article key={m.id} className="mentor-card">
              <div className="mentor-card-rank" aria-label={`Rank ${index + 1}`}>
                #{index + 1}
              </div>
              <MentorMonogram name={m.display_name} size="lg" />
              <div className="stack" style={{ gap: '0.35rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
                  <Link to={mentorProfilePath(m.mentor_slug)}>{m.display_name}</Link>
                </h2>
                {m.mentor_focus && (
                  <p className="muted" style={{ margin: 0, fontSize: '0.95rem' }}>
                    {m.mentor_focus}
                  </p>
                )}
                <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                  {m.session_count ?? 0} session{(m.session_count ?? 0) === 1 ? '' : 's'} led
                </p>
                {m.mentor_bio && (
                  <p style={{ margin: 0 }}>{mentorBioExcerpt(m.mentor_bio, 200)}</p>
                )}
                <div>
                  <Link className="btn btn-secondary" to={mentorProfilePath(m.mentor_slug)}>
                    View profile
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function MentorProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const [mentor, setMentor] = useState<PublicMentorProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  usePageView(slug ? `/mentors/p/${slug}` : '/mentors')

  const load = useCallback(async () => {
    if (!slug || !isSupabaseConfigured) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data: m, error: mErr } = await supabase
      .from('public_mentor_profiles')
      .select('*')
      .eq('mentor_slug', slug)
      .maybeSingle()

    if (mErr || !m) {
      setError(mErr?.message ?? 'Mentor not found')
      setMentor(null)
      setLoading(false)
      return
    }

    const mentorRow = m as PublicMentorProfile
    setMentor(mentorRow)

    const [{ data: cmRows }, { data: slotRows }] = await Promise.all([
      supabase.from('course_mentors').select('course_id, courses(*)').eq('mentor_id', mentorRow.id),
      supabase
        .from('availability_slots')
        .select(
          `*, ${SLOT_TOPICS_EMBED}, courses(id, title, slug, subject_slug)`,
        )
        .eq('tutor_id', mentorRow.id)
        .neq('status', 'cancelled')
        .order('session_date', { ascending: false })
        .limit(40),
    ])

    const courseList = ((cmRows as { courses: Course | Course[] | null }[]) ?? [])
      .map((row) => (Array.isArray(row.courses) ? row.courses[0] : row.courses))
      .filter((c): c is Course => Boolean(c && c.status === 'published'))

    setCourses(courseList)
    setSlots((slotRows as AvailabilitySlot[]) ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  if (!slug) return <Navigate to="/mentors" replace />

  if (loading) {
    return (
      <section className="section">
        <p className="muted">Loading…</p>
      </section>
    )
  }

  if (!mentor) {
    return (
      <section className="section">
        <PageBack to="/mentors" label="Back to Mentors" />
        <div className="alert alert-error">{error ?? 'Mentor not found'}</div>
      </section>
    )
  }

  const standalone = slots.filter((s) => !s.course_id)
  const underCourse = slots.filter((s) => s.course_id)

  return (
    <section className="section">
      <PageBack to="/mentors" label="Back to Mentors" />

      <div className="mentor-profile-hero">
        <MentorMonogram name={mentor.display_name} size="lg" />
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>
            {mentor.display_name}
          </h1>
          {mentor.mentor_focus && <p className="lead" style={{ margin: 0 }}>{mentor.mentor_focus}</p>}
        </div>
      </div>

      {mentor.mentor_bio ? (
        <div className="card" style={{ whiteSpace: 'pre-wrap' }}>
          {mentor.mentor_bio}
        </div>
      ) : (
        <p className="muted">
          This mentor has not added a longer bio yet.
        </p>
      )}

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Courses</h2>
        {courses.length === 0 ? (
          <div className="empty">No published courses listed yet.</div>
        ) : (
          <ul className="schedule-list">
            {courses.map((c) => (
              <li key={c.id}>
                <Link to={coursePath(c.subject_slug, c.slug)}>{c.title}</Link>
                {c.summary ? ` — ${mentorBioExcerpt(c.summary, 100)}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Sessions they lead</h2>
        <p className="muted" style={{ margin: 0 }}>
          Course-linked sessions appear under the course; standalone sessions are listed separately.
        </p>
        {underCourse.length > 0 && (
          <>
            <h3 style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>Under courses</h3>
            <ul className="schedule-list">
              {underCourse.map((s) => (
                <li key={s.id}>
                  {formatDate(s.session_date)}
                  {s.time_note ? ` · ${s.time_note}` : ''} — {formatSlotTopics(s, 'Session')}
                  {s.courses ? (
                    <>
                      {' · '}
                      <Link to={coursePath(s.courses.subject_slug, s.courses.slug)}>
                        {s.courses.title}
                      </Link>
                    </>
                  ) : null}{' '}
                  <StatusPill status={s.status} />
                </li>
              ))}
            </ul>
          </>
        )}
        {standalone.length > 0 && (
          <>
            <h3 style={{ margin: '0.75rem 0 0', fontSize: '1rem' }}>Standalone</h3>
            <ul className="schedule-list">
              {standalone.map((s) => (
                <li key={s.id}>
                  {formatDate(s.session_date)}
                  {s.time_note ? ` · ${s.time_note}` : ''} — {formatSlotTopics(s, 'Session')}{' '}
                  <StatusPill status={s.status} />
                </li>
              ))}
            </ul>
          </>
        )}
        {slots.length === 0 && <div className="empty">No sessions yet.</div>}
      </div>
    </section>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusPill } from '@/components/StatusPill'
import { RecordingsCarousel, recordingItemsFromSlots } from '@/components/RecordingsCarousel'
import { courseFlyerUrl, coursePath, slugifyCourseTitle } from '@/lib/courses'
import { formatDate, useTopics } from '@/lib/hooks'
import { formatSlotTopics, replaceSlotTopics, SLOT_TOPICS_EMBED } from '@/lib/sessionTopics'
import { SUBJECTS } from '@/lib/subjects'
import { supabase } from '@/lib/supabase'
import type { AvailabilitySlot, Course, CourseStatus, Profile } from '@/lib/types'

type Props = {
  tutors: Profile[]
  flash: (message: string) => void
  setError: (message: string | null) => void
}

const emptyForm = {
  title: '',
  slug: '',
  subject_slug: 'precal',
  summary: '',
  body: '',
  location_note: '',
  starts_on: '',
  ends_on: '',
  status: 'draft' as CourseStatus,
}

export function AdminCoursesPanel({ tutors, flash, setError }: Props) {
  const { topics } = useTopics()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [courseSlots, setCourseSlots] = useState<AvailabilitySlot[]>([])
  const [unattached, setUnattached] = useState<AvailabilitySlot[]>([])
  const [attachIds, setAttachIds] = useState<string[]>([])
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [slotDate, setSlotDate] = useState('')
  const [slotTime, setSlotTime] = useState('')
  const [slotUrl, setSlotUrl] = useState('')
  const [slotRecordingUrl, setSlotRecordingUrl] = useState('')
  const [slotTutorId, setSlotTutorId] = useState('')
  const [slotTopicIds, setSlotTopicIds] = useState<string[]>([])
  const [slotStatus, setSlotStatus] = useState<'open' | 'booked'>('booked')
  const [uploading, setUploading] = useState(false)
  const [courseMentorIds, setCourseMentorIds] = useState<string[]>([])

  const selected = useMemo(
    () => courses.find((c) => c.id === selectedId) ?? null,
    [courses, selectedId],
  )

  const sessionTutorOptions = useMemo(() => {
    if (courseMentorIds.length === 0) return tutors
    const set = new Set(courseMentorIds)
    const filtered = tutors.filter((t) => set.has(t.id))
    return filtered.length > 0 ? filtered : tutors
  }, [tutors, courseMentorIds])

  const loadCourses = useCallback(async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
      return
    }
    setCourses((data as Course[]) ?? [])
  }, [setError])

  const loadCourseSessions = useCallback(
    async (courseId: string) => {
      const [
        { data: linked, error: lErr },
        { data: free, error: fErr },
        { data: mentors, error: mErr },
      ] = await Promise.all([
        supabase
          .from('availability_slots')
          .select(
            `*, ${SLOT_TOPICS_EMBED}, profiles!availability_slots_tutor_id_fkey(display_name)`,
          )
          .eq('course_id', courseId)
          .order('session_date', { ascending: true }),
        supabase
          .from('availability_slots')
          .select(
            `*, ${SLOT_TOPICS_EMBED}, profiles!availability_slots_tutor_id_fkey(display_name)`,
          )
          .is('course_id', null)
          .neq('status', 'cancelled')
          .order('session_date', { ascending: false })
          .limit(80),
        supabase
          .from('course_mentors')
          .select('mentor_id, sort_order')
          .eq('course_id', courseId)
          .order('sort_order'),
      ])
      if (lErr || fErr || mErr) {
        setError(lErr?.message ?? fErr?.message ?? mErr?.message ?? 'Error')
        return
      }
      setCourseSlots((linked as AvailabilitySlot[]) ?? [])
      setUnattached((free as AvailabilitySlot[]) ?? [])
      const ids = ((mentors as { mentor_id: string }[]) ?? []).map((m) => m.mentor_id)
      setCourseMentorIds(ids)
      if (ids.length > 0) {
        setSlotTutorId((prev) => (prev && ids.includes(prev) ? prev : ids[0]))
      }
    },
    [setError],
  )

  useEffect(() => {
    void loadCourses()
  }, [loadCourses])

  useEffect(() => {
    if (selectedId) void loadCourseSessions(selectedId)
    else {
      setCourseSlots([])
      setUnattached([])
    }
  }, [selectedId, loadCourseSessions])

  function startCreate() {
    setSelectedId(null)
    setForm(emptyForm)
    setEditingSlotId(null)
    setCourseMentorIds([])
  }

  function startEdit(c: Course) {
    setSelectedId(c.id)
    setForm({
      title: c.title,
      slug: c.slug,
      subject_slug: c.subject_slug,
      summary: c.summary,
      body: c.body,
      location_note: c.location_note,
      starts_on: c.starts_on ?? '',
      ends_on: c.ends_on ?? '',
      status: c.status,
    })
    setEditingSlotId(null)
  }

  async function saveCourse(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      title: form.title.trim(),
      slug: (form.slug.trim() || slugifyCourseTitle(form.title)).slice(0, 80),
      subject_slug: form.subject_slug,
      summary: form.summary.trim(),
      body: form.body.trim(),
      location_note: form.location_note.trim(),
      starts_on: form.starts_on || null,
      ends_on: form.ends_on || null,
      status: form.status,
    }

    if (selectedId) {
      const { error } = await supabase.from('courses').update(payload).eq('id', selectedId)
      if (error) {
        setError(error.message)
        return
      }
      const syncErr = await replaceCourseMentors(selectedId, courseMentorIds)
      if (syncErr) {
        setError(syncErr)
        return
      }
      flash('Course saved.')
    } else {
      const { data, error } = await supabase.from('courses').insert(payload).select('*').single()
      if (error) {
        setError(error.message)
        return
      }
      const newId = (data as Course).id
      const syncErr = await replaceCourseMentors(newId, courseMentorIds)
      if (syncErr) {
        setError(syncErr)
        return
      }
      flash('Course created.')
      setSelectedId(newId)
      setForm((f) => ({ ...f, slug: (data as Course).slug }))
    }
    await loadCourses()
  }

  async function replaceCourseMentors(courseId: string, mentorIds: string[]) {
    const { error: delErr } = await supabase.from('course_mentors').delete().eq('course_id', courseId)
    if (delErr) return delErr.message
    const unique = Array.from(new Set(mentorIds.filter(Boolean)))
    if (unique.length === 0) return null
    const { error: insErr } = await supabase.from('course_mentors').insert(
      unique.map((mentor_id, i) => ({ course_id: courseId, mentor_id, sort_order: i })),
    )
    return insErr?.message ?? null
  }

  async function deleteCourse() {
    if (!selectedId || !confirm('Delete this course? Sessions stay but are unlinked.')) return
    const { error } = await supabase.from('courses').delete().eq('id', selectedId)
    if (error) {
      setError(error.message)
      return
    }
    flash('Course deleted.')
    startCreate()
    await loadCourses()
  }

  async function uploadFlyer(file: File) {
    if (!selectedId) {
      setError('Save the course first, then upload a flyer.')
      return
    }
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${selectedId}/flyer.${ext === 'jpeg' ? 'jpg' : ext}`
    const { error: upErr } = await supabase.storage.from('course-flyers').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    })
    if (upErr) {
      setUploading(false)
      setError(upErr.message)
      return
    }
    const { error } = await supabase
      .from('courses')
      .update({ flyer_path: path })
      .eq('id', selectedId)
    setUploading(false)
    if (error) {
      setError(error.message)
      return
    }
    flash('Flyer uploaded.')
    await loadCourses()
  }

  async function clearFlyer() {
    if (!selectedId || !selected?.flyer_path) return
    if (selected.flyer_path.startsWith('/')) {
      const { error } = await supabase.from('courses').update({ flyer_path: null }).eq('id', selectedId)
      if (error) setError(error.message)
      else {
        flash('Flyer cleared.')
        await loadCourses()
      }
      return
    }
    await supabase.storage.from('course-flyers').remove([selected.flyer_path])
    const { error } = await supabase.from('courses').update({ flyer_path: null }).eq('id', selectedId)
    if (error) setError(error.message)
    else {
      flash('Flyer removed.')
      await loadCourses()
    }
  }

  async function attachSelected() {
    if (!selectedId || attachIds.length === 0) return
    const { error } = await supabase
      .from('availability_slots')
      .update({ course_id: selectedId })
      .in('id', attachIds)
    if (error) {
      setError(error.message)
      return
    }
    flash(`Attached ${attachIds.length} session(s).`)
    setAttachIds([])
    await loadCourseSessions(selectedId)
  }

  async function removeFromCourse(slotId: string) {
    if (!selectedId) return
    const { error } = await supabase
      .from('availability_slots')
      .update({ course_id: null })
      .eq('id', slotId)
    if (error) {
      setError(error.message)
      return
    }
    flash('Session removed from course.')
    await loadCourseSessions(selectedId)
  }

  async function deleteSlot(slotId: string) {
    if (!selectedId || !confirm('Permanently delete this session and its enrollments?')) return
    const { error } = await supabase.from('availability_slots').delete().eq('id', slotId)
    if (error) {
      setError(error.message)
      return
    }
    flash('Session deleted.')
    if (editingSlotId === slotId) resetSlotForm()
    await loadCourseSessions(selectedId)
  }

  function resetSlotForm() {
    setEditingSlotId(null)
    setSlotDate('')
    setSlotTime('')
    setSlotUrl('')
    setSlotRecordingUrl('')
    setSlotTutorId(tutors[0]?.id ?? '')
    setSlotTopicIds([])
    setSlotStatus('booked')
  }

  function editSlot(s: AvailabilitySlot) {
    setEditingSlotId(s.id)
    setSlotDate(s.session_date)
    setSlotTime(s.time_note)
    setSlotUrl(s.meeting_url ?? '')
    setSlotRecordingUrl(s.recording_url ?? '')
    setSlotTutorId(s.tutor_id)
    setSlotTopicIds((s.slot_topics ?? []).map((t) => t.topic_id))
    setSlotStatus(s.status === 'open' ? 'open' : 'booked')
  }

  async function saveSlot(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !slotTutorId || !slotDate) return
    setError(null)
    const payload = {
      tutor_id: slotTutorId,
      session_date: slotDate,
      time_note: slotTime.trim(),
      meeting_url: slotUrl.trim(),
      recording_url: slotRecordingUrl.trim(),
      status: slotStatus,
      course_id: selectedId,
      subject_slug: form.subject_slug || 'precal',
    }

    let slotId = editingSlotId
    if (editingSlotId) {
      const { error } = await supabase.from('availability_slots').update(payload).eq('id', editingSlotId)
      if (error) {
        setError(error.message)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('availability_slots')
        .insert(payload)
        .select('id')
        .single()
      if (error) {
        setError(error.message)
        return
      }
      slotId = (data as { id: string }).id
    }

    if (slotId) {
      const { error: topicErr } = await replaceSlotTopics(slotId, slotTopicIds)
      if (topicErr) {
        setError(topicErr)
        return
      }
    }

    flash(editingSlotId ? 'Session updated (rescheduled if date/time changed).' : 'Session added to course.')
    resetSlotForm()
    await loadCourseSessions(selectedId)
  }

  const flyer = courseFlyerUrl(selected?.flyer_path)

  return (
    <div className="stack">
      <div className="card stack">
        <h2 style={{ margin: 0 }}>Courses &amp; bootcamps</h2>
        <p className="muted" style={{ margin: 0 }}>
          Create a parent course, upload a flyer, and add / attach / reschedule / remove sessions
          under it. Students enroll once to unlock all linked sessions.
        </p>
        <div className="split-actions">
          <button type="button" className="btn btn-secondary" onClick={startCreate}>
            New course
          </button>
        </div>
        {courses.length === 0 ? (
          <div className="empty">No courses yet.</div>
        ) : (
          <ul className="schedule-list">
            {courses.map((c) => (
              <li key={c.id}>
                <button type="button" className="btn btn-ghost" onClick={() => startEdit(c)}>
                  {c.title}
                </button>
                {' · '}
                <StatusPill status={c.status} />
                {' · '}
                {c.subject_slug}
                {c.status === 'published' && (
                  <>
                    {' · '}
                    <Link to={coursePath(c.subject_slug, c.slug)}>Public page</Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form className="card form stack" onSubmit={(e) => void saveCourse(e)}>
        <h2 style={{ margin: 0 }}>{selectedId ? 'Edit course' : 'Create course'}</h2>
        <label>
          Title
          <input
            required
            minLength={3}
            maxLength={160}
            value={form.title}
            onChange={(e) => {
              const title = e.target.value
              setForm((f) => ({
                ...f,
                title,
                slug: selectedId ? f.slug : slugifyCourseTitle(title),
              }))
            }}
          />
        </label>
        <label>
          Slug
          <input
            required
            minLength={3}
            maxLength={80}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
        </label>
        <label>
          Subject
          <select
            value={form.subject_slug}
            onChange={(e) => setForm((f) => ({ ...f, subject_slug: e.target.value }))}
          >
            {SUBJECTS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CourseStatus }))}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <fieldset>
          <legend>Course mentors (one or more)</legend>
          <p className="muted" style={{ margin: '0 0 0.5rem' }}>
            Co-mentors for this bootcamp. Each session still has one lead mentor when you add it.
          </p>
          {tutors.length === 0 ? (
            <p className="muted">No approved mentors yet.</p>
          ) : (
            <div className="stack">
              {tutors.map((t) => (
                <label key={t.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={courseMentorIds.includes(t.id)}
                    onChange={(e) => {
                      setCourseMentorIds((ids) =>
                        e.target.checked ? [...ids, t.id] : ids.filter((id) => id !== t.id),
                      )
                    }}
                  />
                  <span>{t.display_name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <label>
          Summary
          <textarea
            maxLength={500}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            rows={3}
          />
        </label>
        <label>
          Body (curriculum / details)
          <textarea
            maxLength={20000}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={10}
          />
        </label>
        <label>
          Location note
          <input
            maxLength={240}
            value={form.location_note}
            onChange={(e) => setForm((f) => ({ ...f, location_note: e.target.value }))}
            placeholder="Plano Davis Library / Zoom Hybrid"
          />
        </label>
        <div className="card-grid cols-2">
          <label>
            Starts on
            <input
              type="date"
              value={form.starts_on}
              onChange={(e) => setForm((f) => ({ ...f, starts_on: e.target.value }))}
            />
          </label>
          <label>
            Ends on
            <input
              type="date"
              value={form.ends_on}
              onChange={(e) => setForm((f) => ({ ...f, ends_on: e.target.value }))}
            />
          </label>
        </div>
        <div className="split-actions">
          <button className="btn btn-primary" type="submit">
            {selectedId ? 'Save course' : 'Create course'}
          </button>
          {selectedId && (
            <button type="button" className="btn btn-danger" onClick={() => void deleteCourse()}>
              Delete course
            </button>
          )}
        </div>
      </form>

      {selectedId && selected && (
        <>
          <div className="card stack">
            <h2 style={{ margin: 0 }}>Flyer</h2>
            {flyer ? (
              <img
                src={flyer}
                alt=""
                style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8 }}
              />
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No flyer yet. Upload an image (JPG/PNG/WebP).
              </p>
            )}
            <label>
              Upload flyer
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadFlyer(file)
                  e.target.value = ''
                }}
              />
            </label>
            {selected.flyer_path && (
              <button type="button" className="btn btn-ghost" onClick={() => void clearFlyer()}>
                Remove flyer
              </button>
            )}
          </div>

          <div className="card stack">
            <h2 style={{ margin: 0 }}>Sessions in this course</h2>
            {courseSlots.length === 0 ? (
              <div className="empty">No sessions linked yet.</div>
            ) : (
              <div className="stack">
                <RecordingsCarousel
                  items={recordingItemsFromSlots(courseSlots)}
                  heading="Course recordings preview"
                  framed={false}
                  emptyLabel="No recording URLs on sessions yet."
                />
                {courseSlots.map((s) => (
                  <article key={s.id} className="card" style={{ boxShadow: 'none' }}>
                    <p style={{ margin: '0 0 0.35rem' }}>
                      <strong>{formatDate(s.session_date)}</strong>
                      {s.time_note ? ` · ${s.time_note}` : ''} — {formatSlotTopics(s, 'Session')} ·{' '}
                      {s.profiles?.display_name ?? 'Mentor'} ·{' '}
                      <StatusPill status={s.status} sessionDate={s.session_date} />
                    </p>
                    <div className="split-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => editSlot(s)}>
                        Reschedule / edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void removeFromCourse(s.id)}
                      >
                        Remove from course
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => void deleteSlot(s.id)}
                      >
                        Delete session
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form className="card form stack" onSubmit={(e) => void saveSlot(e)}>
            <h2 style={{ margin: 0 }}>
              {editingSlotId ? 'Reschedule / edit session' : 'Add session to course'}
            </h2>
            <label>
              Mentor (session lead)
              <select required value={slotTutorId} onChange={(e) => setSlotTutorId(e.target.value)}>
                <option value="">Select mentor</option>
                {sessionTutorOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                required
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
              />
            </label>
            <label>
              Time / label note
              <input
                maxLength={120}
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                placeholder="e.g. Algebra Review & Factoring · Sat 10am"
              />
            </label>
            <label>
              Join link (upcoming only)
              <input
                maxLength={500}
                value={slotUrl}
                onChange={(e) => setSlotUrl(e.target.value)}
                placeholder="https://zoom.us/…"
              />
            </label>
            <label>
              Recording URL
              <input
                maxLength={500}
                value={slotRecordingUrl}
                onChange={(e) => setSlotRecordingUrl(e.target.value)}
                placeholder="https://youtube.com/… or other recording link"
              />
            </label>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              Past/course unlock UIs show recording only. YouTube embeds; other URLs open externally.
            </p>
            <label>
              Status
              <select
                value={slotStatus}
                onChange={(e) => setSlotStatus(e.target.value as 'open' | 'booked')}
              >
                <option value="booked">Past / completed (multi-enroll)</option>
                <option value="open">Upcoming open (multi-enroll under course)</option>
              </select>
            </label>
            <fieldset>
              <legend>Topics (optional)</legend>
              {topics.map((t) => (
                <label key={t.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={slotTopicIds.includes(t.id)}
                    onChange={(e) => {
                      setSlotTopicIds((ids) =>
                        e.target.checked ? [...ids, t.id] : ids.filter((id) => id !== t.id),
                      )
                    }}
                  />
                  <span>{t.name}</span>
                </label>
              ))}
            </fieldset>
            <div className="split-actions">
              <button className="btn btn-primary" type="submit">
                {editingSlotId ? 'Save session' : 'Add session'}
              </button>
              {editingSlotId && (
                <button type="button" className="btn btn-ghost" onClick={resetSlotForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="card stack">
            <h2 style={{ margin: 0 }}>Attach existing sessions</h2>
            <p className="muted" style={{ margin: 0 }}>
              Unattached sessions (not in any course). Select and attach to this bootcamp.
            </p>
            {unattached.length === 0 ? (
              <div className="empty">No unattached sessions.</div>
            ) : (
              <>
                <div className="stack">
                  {unattached.map((s) => (
                    <label key={s.id} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={attachIds.includes(s.id)}
                        onChange={(e) => {
                          setAttachIds((ids) =>
                            e.target.checked ? [...ids, s.id] : ids.filter((id) => id !== s.id),
                          )
                        }}
                      />
                      <span>
                        {formatDate(s.session_date)}
                        {s.time_note ? ` · ${s.time_note}` : ''} — {formatSlotTopics(s, 'Session')} ·{' '}
                        {s.profiles?.display_name ?? 'Mentor'}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={attachIds.length === 0}
                  onClick={() => void attachSelected()}
                >
                  Attach selected ({attachIds.length})
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

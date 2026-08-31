import { useNavigate } from 'react-router-dom'
import { COMING_SOON_SUBJECTS } from '@/lib/subjects'
import { useSubject } from '@/lib/subject'

export function SubjectSelect({
  id = 'subject-select',
  mode = 'hub',
}: {
  id?: string
  mode?: 'hub' | 'resources' | 'schedule'
}) {
  const navigate = useNavigate()
  const { subjectSlug, subjects, setSubjectSlug } = useSubject()

  function onChange(slug: string) {
    if (!slug) return
    setSubjectSlug(slug)
    if (mode === 'resources') navigate(`/students/resources/${slug}`)
    else if (mode === 'schedule') navigate(`/students/${slug}/schedule`)
    else navigate(`/students/${slug}`)
  }

  return (
    <label className="subject-select-wrap">
      <span className="subject-select-label">Subject</span>
      <select
        id={id}
        className="subject-select"
        value={subjectSlug}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          Choose a subject…
        </option>
        {subjects.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
        <optgroup label="Coming soon">
          {COMING_SOON_SUBJECTS.map((s) => (
            <option key={s.slug} value={s.slug} disabled>
              {s.name}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  )
}

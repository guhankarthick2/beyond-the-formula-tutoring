import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubject, SUBJECTS, type Subject } from '@/lib/subjects'

const STORAGE_KEY = 'btf-selected-subject'

interface SubjectContextValue {
  subject: Subject | null
  subjectSlug: string
  setSubjectSlug: (slug: string) => void
  clearSubject: () => void
  subjects: Subject[]
}

const SubjectContext = createContext<SubjectContextValue | null>(null)

function readStoredSubject(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function SubjectProvider({ children }: { children: ReactNode }) {
  const [subjectSlug, setSubjectSlugState] = useState(readStoredSubject)

  const setSubjectSlug = useCallback((slug: string) => {
    const valid = getSubject(slug)
    if (!valid) return
    setSubjectSlugState(slug)
    try {
      localStorage.setItem(STORAGE_KEY, slug)
    } catch {
      /* ignore */
    }
  }, [])

  const clearSubject = useCallback(() => {
    setSubjectSlugState('')
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<SubjectContextValue>(
    () => ({
      subject: getSubject(subjectSlug) ?? null,
      subjectSlug,
      setSubjectSlug,
      clearSubject,
      subjects: SUBJECTS,
    }),
    [subjectSlug, setSubjectSlug, clearSubject],
  )

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>
}

export function useSubject() {
  const ctx = useContext(SubjectContext)
  if (!ctx) throw new Error('useSubject must be used within SubjectProvider')
  return ctx
}

/** Navigate when user picks a subject from the dropdown */
export function useSubjectPicker() {
  const { setSubjectSlug } = useSubject()
  const navigate = useNavigate()

  return useCallback(
    (slug: string) => {
      setSubjectSlug(slug)
      navigate(`/students/${slug}`)
    },
    [navigate, setSubjectSlug],
  )
}

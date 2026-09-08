import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { StuckQuestion } from '@/lib/types'

export type OpenQuestionAlert = Pick<
  StuckQuestion,
  'id' | 'title' | 'subject_slug' | 'created_at' | 'status'
> & {
  profiles?: { display_name: string } | null
}

type OpenQuestionsInboxValue = {
  openCount: number
  openQuestions: OpenQuestionAlert[]
  refresh: () => Promise<void>
  dismiss: (questionId: string) => Promise<void>
}

const OpenQuestionsInboxContext = createContext<OpenQuestionsInboxValue>({
  openCount: 0,
  openQuestions: [],
  refresh: async () => {},
  dismiss: async () => {},
})

export function OpenQuestionsInboxProvider({ children }: { children: React.ReactNode }) {
  const { user, isApprovedTutor } = useAuth()
  const [openQuestions, setOpenQuestions] = useState<OpenQuestionAlert[]>([])

  const refresh = useCallback(async () => {
    if (!user || !isApprovedTutor || !isSupabaseConfigured) {
      setOpenQuestions([])
      return
    }

    const [{ data: questions, error: qErr }, { data: dismissals, error: dErr }] = await Promise.all([
      supabase
        .from('stuck_questions')
        .select('id, title, subject_slug, created_at, status, profiles!stuck_questions_author_id_fkey(display_name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('question_alert_dismissals')
        .select('question_id')
        .eq('tutor_id', user.id),
    ])

    if (qErr || dErr) {
      setOpenQuestions([])
      return
    }

    const dismissed = new Set((dismissals ?? []).map((d) => d.question_id as string))
    setOpenQuestions(
      ((questions as unknown as OpenQuestionAlert[]) ?? []).filter((q) => !dismissed.has(q.id)),
    )
  }, [user, isApprovedTutor])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user || !isApprovedTutor || !isSupabaseConfigured) return

    const channel = supabase
      .channel(`open-questions:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stuck_questions' },
        () => {
          void refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, isApprovedTutor, refresh])

  const dismiss = useCallback(
    async (questionId: string) => {
      if (!user || !isApprovedTutor || !isSupabaseConfigured) return
      await supabase.rpc('dismiss_question_alert', { p_question_id: questionId })
      setOpenQuestions((prev) => prev.filter((q) => q.id !== questionId))
    },
    [user, isApprovedTutor],
  )

  const value = useMemo(
    () => ({
      openCount: openQuestions.length,
      openQuestions,
      refresh,
      dismiss,
    }),
    [openQuestions, refresh, dismiss],
  )

  return (
    <OpenQuestionsInboxContext.Provider value={value}>{children}</OpenQuestionsInboxContext.Provider>
  )
}

export function useOpenQuestionsInbox() {
  return useContext(OpenQuestionsInboxContext)
}

export function questionPath(q: Pick<StuckQuestion, 'id' | 'subject_slug'>) {
  return `/students/${q.subject_slug || 'precal'}/questions/${q.id}`
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type AdminReportsInboxValue = {
  reportCount: number
  refresh: () => Promise<void>
}

const AdminReportsInboxContext = createContext<AdminReportsInboxValue>({
  reportCount: 0,
  refresh: async () => {},
})

export function AdminReportsInboxProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth()
  const [reportCount, setReportCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user || !isAdmin || !isSupabaseConfigured) {
      setReportCount(0)
      return
    }
    const { count, error } = await supabase
      .from('question_reports')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null)
    if (error) {
      setReportCount(0)
      return
    }
    setReportCount(count ?? 0)
  }, [user, isAdmin])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user || !isAdmin || !isSupabaseConfigured) return

    const channel = supabase
      .channel(`question-reports:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'question_reports' },
        () => {
          void refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, isAdmin, refresh])

  const value = useMemo(() => ({ reportCount, refresh }), [reportCount, refresh])

  return (
    <AdminReportsInboxContext.Provider value={value}>{children}</AdminReportsInboxContext.Provider>
  )
}

export function useAdminReportsInbox() {
  return useContext(AdminReportsInboxContext)
}

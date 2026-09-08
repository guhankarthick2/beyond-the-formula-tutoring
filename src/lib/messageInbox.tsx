import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type MessageInboxValue = {
  unreadCount: number
  refresh: () => Promise<void>
}

const MessageInboxContext = createContext<MessageInboxValue>({
  unreadCount: 0,
  refresh: async () => {},
})

export function MessageInboxProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setUnreadCount(0)
      return
    }
    const { count, error } = await supabase
      .from('mentor_messages')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .is('dismissed_at', null)
    if (error) {
      setUnreadCount(0)
      return
    }
    setUnreadCount(count ?? 0)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return

    const channel = supabase
      .channel(`mentor-messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentor_messages',
          filter: `student_id=eq.${user.id}`,
        },
        () => {
          void refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, refresh])

  const value = useMemo(() => ({ unreadCount, refresh }), [unreadCount, refresh])

  return <MessageInboxContext.Provider value={value}>{children}</MessageInboxContext.Provider>
}

export function useMessageInbox() {
  return useContext(MessageInboxContext)
}

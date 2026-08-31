import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export interface ImpactStats {
  sessions_completed: number
  students_enrolled: number
  students_benefited: number
  mentors_active: number
  page_visits: number
  open_sessions: number
}

const DEMO_STATS: ImpactStats = {
  sessions_completed: 12,
  students_enrolled: 8,
  students_benefited: 24,
  mentors_active: 3,
  page_visits: 340,
  open_sessions: 4,
}

export function useImpactStats() {
  const [stats, setStats] = useState<ImpactStats>(DEMO_STATS)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let mounted = true
    ;(async () => {
      const { data, error } = await supabase.rpc('public_impact_stats')
      if (!mounted || error || !data) return
      setStats(data as ImpactStats)
      setLive(true)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return { stats, live, demo: !live }
}

export function usePageView(path: string) {
  useEffect(() => {
    if (!path || !isSupabaseConfigured) return
    void supabase.from('page_views').insert({ path })
  }, [path])
}

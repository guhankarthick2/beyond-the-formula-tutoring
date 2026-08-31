import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Topic } from '@/lib/types'

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data, error: err } = await supabase
        .from('topics')
        .select('*')
        .eq('active', true)
        .order('sort_order')
      if (!mounted) return
      if (err) setError(err.message)
      else setTopics((data as Topic[]) ?? [])
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return { topics, loading, error }
}

export function formatDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

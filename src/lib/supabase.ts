import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  Boolean(url && anonKey && !url.includes('YOUR_PROJECT') && anonKey !== 'YOUR_ANON_KEY')

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
)

/** Absolute URL for OAuth / email confirm / password-recovery redirects (respects GitHub Pages base). */
export function authRedirectTo(path = 'auth'): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  const cleanPath = path.replace(/^\//, '')
  return `${window.location.origin}${normalized}${cleanPath}`
}

export const youtubeChannelUrl =
  import.meta.env.VITE_YOUTUBE_CHANNEL_URL ||
  'https://www.youtube.com/@beyondtheformulatutoring'

export const volunteerIntroVideoUrl =
  import.meta.env.VITE_VOLUNTEER_INTRO_VIDEO_URL ||
  'https://www.youtube.com/embed/dQw4w9WgXcQ'

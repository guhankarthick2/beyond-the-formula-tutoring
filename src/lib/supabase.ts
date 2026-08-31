import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured =
  Boolean(url && anonKey && !url.includes('YOUR_PROJECT') && anonKey !== 'YOUR_ANON_KEY')

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
)

export const youtubeChannelUrl =
  import.meta.env.VITE_YOUTUBE_CHANNEL_URL ||
  'https://www.youtube.com/@beyondtheformulatutoring'

export const volunteerIntroVideoUrl =
  import.meta.env.VITE_VOLUNTEER_INTRO_VIDEO_URL ||
  'https://www.youtube.com/embed/dQw4w9WgXcQ'

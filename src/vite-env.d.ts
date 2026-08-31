/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_VOLUNTEER_INTRO_VIDEO_URL: string
  readonly VITE_YOUTUBE_CHANNEL_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

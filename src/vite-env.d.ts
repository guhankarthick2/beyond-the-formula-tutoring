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

declare module '@/unit1/unit1-quiz.js' {
  export function initUnit1Quiz(container: HTMLElement, assessment?: object): () => void
}

declare module '@/unit1/unit1-13-data.js' {
  export const UNIT1_TOPICS_13: object
}

declare module '@/unit1/unit1-13-14-data.js' {
  export const UNIT1_TOPICS_13_14: object
}

declare module '@/unit1/unit1-11-12-data.js' {
  export const UNIT1_TOPICS_11_12: object
}

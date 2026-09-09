import { isSupabaseConfigured } from '@/lib/supabase'

/** Public URL for a course flyer (site path `/…` or Storage object key). */
export function courseFlyerUrl(flyerPath: string | null | undefined): string | null {
  if (!flyerPath) return null
  if (flyerPath.startsWith('http://') || flyerPath.startsWith('https://')) return flyerPath
  if (flyerPath.startsWith('/')) {
    const base = import.meta.env.BASE_URL || '/'
    const normalized = base.endsWith('/') ? base.slice(0, -1) : base
    return `${normalized}${flyerPath}`
  }
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!isSupabaseConfigured || !supabaseUrl) return null
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/course-flyers/${flyerPath}`
}

export function coursePath(subjectSlug: string, courseSlug: string) {
  return `/students/${subjectSlug}/courses/${courseSlug}`
}

export function slugifyCourseTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

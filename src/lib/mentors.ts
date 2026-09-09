import type { PublicMentorProfile } from '@/lib/types'

export function mentorProfilePath(slug: string) {
  return `/mentors/p/${slug}`
}

export function slugifyMentorName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Initials for monogram tiles (no photos). */
export function mentorInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

export function mentorBioExcerpt(bio: string, max = 160) {
  const t = bio.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trimEnd()}…`
}

export type MentorCardModel = Pick<
  PublicMentorProfile,
  'display_name' | 'mentor_slug' | 'mentor_bio' | 'mentor_focus'
>

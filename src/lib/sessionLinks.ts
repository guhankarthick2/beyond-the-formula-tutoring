/** Normalize session link identity so the same YouTube video can't be attributed twice
 *  under watch / embed / youtu.be / query-param variants. */

export function youtubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) return v
      const parts = u.pathname.split('/').filter(Boolean)
      if ((parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') && parts[1]) {
        return /^[\w-]{11}$/.test(parts[1]) ? parts[1] : null
      }
    }
  } catch {
    /* fall through */
  }
  const m = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i,
  )
  return m?.[1] ?? null
}

/** Stable key for duplicate checks: yt:<id> or the trimmed URL. Empty → null. */
export function meetingUrlIdentity(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const yt = youtubeVideoId(trimmed)
  if (yt) return `yt:${yt}`
  return trimmed.toLowerCase()
}

export function meetingUrlsConflict(a: string, b: string): boolean {
  const ka = meetingUrlIdentity(a)
  const kb = meetingUrlIdentity(b)
  return Boolean(ka && kb && ka === kb)
}

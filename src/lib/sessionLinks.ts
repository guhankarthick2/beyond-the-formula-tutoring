/** Normalize session link identity so the same YouTube video can't be attributed twice
 *  under watch / embed / youtu.be / query-param variants. */

export function youtubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  // Allow pasting a bare iframe snippet: … src="https://www.youtube.com/embed/ID" …
  const iframeSrc = trimmed.match(/\bsrc=["']([^"']+)["']/i)?.[1]
  const candidate = iframeSrc ?? trimmed

  try {
    const u = new URL(candidate)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]?.split('?')[0]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }
    if (
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com')
    ) {
      const v = u.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) return v
      const parts = u.pathname.split('/').filter(Boolean)
      if (
        (parts[0] === 'embed' ||
          parts[0] === 'shorts' ||
          parts[0] === 'live' ||
          parts[0] === 'v') &&
        parts[1]
      ) {
        const id = parts[1].split('?')[0]
        return id && /^[\w-]{11}$/.test(id) ? id : null
      }
    }
  } catch {
    /* fall through */
  }
  const m = candidate.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i,
  )
  return m?.[1] ?? null
}

/** Watch / share URL suitable for opening in a new tab (never use /embed/ as a page link). */
export function youtubeWatchUrl(url: string): string | null {
  const id = youtubeVideoId(url)
  return id ? `https://www.youtube.com/watch?v=${id}` : null
}

/** Embed iframe src, or null if not a YouTube URL. */
export function youtubeEmbedSrc(url: string): string | null {
  const id = youtubeVideoId(url)
  return id ? `https://www.youtube.com/embed/${id}?rel=0` : null
}

/** YouTube thumbnail image URL (hq), or null if not YouTube. */
export function youtubeThumbnailUrl(url: string): string | null {
  const id = youtubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

/** Best href for “open recording”: YouTube watch URL, else the original link. */
export function recordingOpenHref(url: string): string {
  const trimmed = url.trim()
  return youtubeWatchUrl(trimmed) ?? trimmed
}

/** Stable key for duplicate checks: yt:<id> or the trimmed URL. Empty → null. */
export function recordingUrlIdentity(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const yt = youtubeVideoId(trimmed)
  if (yt) return `yt:${yt}`
  return trimmed.toLowerCase()
}

export function recordingUrlsConflict(a: string, b: string): boolean {
  const ka = recordingUrlIdentity(a)
  const kb = recordingUrlIdentity(b)
  return Boolean(ka && kb && ka === kb)
}

/** @deprecated use recordingUrlIdentity */
export const meetingUrlIdentity = recordingUrlIdentity
/** @deprecated use recordingUrlsConflict */
export const meetingUrlsConflict = recordingUrlsConflict

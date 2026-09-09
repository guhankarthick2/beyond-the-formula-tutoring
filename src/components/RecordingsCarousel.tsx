import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SessionVideoPlayer } from '@/components/SessionVideoPlayer'
import { formatDate } from '@/lib/hooks'
import {
  recordingOpenHref,
  youtubeEmbedSrc,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from '@/lib/sessionLinks'
import { formatSlotTopics } from '@/lib/sessionTopics'
import type { AvailabilitySlot } from '@/lib/types'

export type RecordingCarouselItem = {
  id: string
  url: string
  title: string
  date?: string
}

export function recordingItemsFromSlots(
  slots: AvailabilitySlot[],
  opts?: { sort?: 'asc' | 'desc' },
): RecordingCarouselItem[] {
  const items: RecordingCarouselItem[] = []
  for (const slot of slots) {
    const url = slot.recording_url?.trim()
    if (!url) continue
    const mentor = slot.profiles?.display_name
    items.push({
      id: slot.id,
      url,
      date: slot.session_date,
      title: [formatDate(slot.session_date), slot.time_note || formatSlotTopics(slot, 'Session'), mentor]
        .filter(Boolean)
        .join(' · '),
    })
  }
  const dir = opts?.sort ?? 'asc'
  items.sort((a, b) => {
    const cmp = (a.date ?? '').localeCompare(b.date ?? '')
    return dir === 'asc' ? cmp : -cmp
  })
  return items
}

type Props = {
  items: RecordingCarouselItem[]
  heading?: string
  /** Compact card chrome (default true). Set false when already inside a card. */
  framed?: boolean
  emptyLabel?: string
  /**
   * When true, thumbnails stay visible but Play sends people to unlockHref
   * (e.g. sign in) instead of expanding the player.
   */
  lockPlayback?: boolean
  /** Where locked Play / thumbnail clicks go (default /auth). */
  unlockHref?: string
  unlockLabel?: string
  /**
   * `banner` = one CTA in the header (cleaner on profiles).
   * `thumbs` = label on every thumbnail (default).
   */
  lockStyle?: 'thumbs' | 'banner'
}

/** Horizontally scrollable recording thumbnails; Play expands a centered player below. */
export function RecordingsCarousel({
  items,
  heading = 'Recordings',
  framed = true,
  emptyLabel,
  lockPlayback = false,
  unlockHref = '/auth',
  unlockLabel = 'Sign in to play',
  lockStyle = 'thumbs',
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const expandRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [items.length])

  useEffect(() => {
    if (!expandedId || lockPlayback) return
    expandRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [expandedId, lockPlayback])

  useEffect(() => {
    if (lockPlayback) setExpandedId(null)
  }, [lockPlayback])

  if (items.length === 0) {
    return emptyLabel ? <p className="muted">{emptyLabel}</p> : null
  }

  const expanded = !lockPlayback ? (items.find((i) => i.id === expandedId) ?? null) : null

  const body = (
    <div className="recordings-carousel stack">
      <div className="recordings-carousel-nav">
        <h3 className="recordings-carousel-heading">{heading}</h3>
        <p className="recordings-carousel-meta">
          {items.length > 1 ? `${items.length} recordings · scroll sideways` : null}
          {lockPlayback && lockStyle === 'banner' ? (
            <>
              {items.length > 1 ? ' · ' : null}
              <Link to={unlockHref}>{unlockLabel}</Link> to watch
            </>
          ) : null}
          {lockPlayback && lockStyle === 'thumbs' ? (
            <>
              {items.length > 1 ? ' · ' : null}
              <Link to={unlockHref}>{unlockLabel}</Link>
            </>
          ) : null}
        </p>
      </div>

      <div
        ref={trackRef}
        className="recordings-track"
        tabIndex={0}
        aria-label={`${heading} — scroll horizontally`}
      >
        {items.map((item) => {
          const embeddable = Boolean(youtubeEmbedSrc(item.url))
          const thumb = youtubeThumbnailUrl(item.url)
          const openHref = youtubeWatchUrl(item.url) ?? recordingOpenHref(item.url)
          const isActive = expandedId === item.id

          return (
            <article
              key={item.id}
              className={`recordings-card${isActive ? ' recordings-card-active' : ''}${
                lockPlayback ? ' recordings-card-locked' : ''
              }`}
            >
              {embeddable && thumb ? (
                lockPlayback ? (
                  <Link
                    className="recordings-thumb"
                    to={unlockHref}
                    aria-label={`${unlockLabel}: ${item.title}`}
                  >
                    <img src={thumb} alt="" loading="lazy" decoding="async" />
                    <span className="recordings-thumb-play" aria-hidden>
                      ▶
                    </span>
                    {lockStyle === 'thumbs' ? (
                      <span className="recordings-thumb-lock">{unlockLabel}</span>
                    ) : null}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="recordings-thumb"
                    aria-label={isActive ? `Minimize ${item.title}` : `Play ${item.title}`}
                    aria-expanded={isActive}
                    onClick={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                  >
                    <img src={thumb} alt="" loading="lazy" decoding="async" />
                    <span className="recordings-thumb-play" aria-hidden>
                      {isActive ? '■' : '▶'}
                    </span>
                  </button>
                )
              ) : lockPlayback ? (
                <Link
                  className="recordings-thumb recordings-thumb-external"
                  to={unlockHref}
                  aria-label={`${unlockLabel}: ${item.title}`}
                >
                  <span className="recordings-thumb-fallback">{unlockLabel}</span>
                </Link>
              ) : (
                <a
                  className="recordings-thumb recordings-thumb-external"
                  href={openHref}
                  rel="noopener noreferrer"
                  target="_blank"
                  aria-label={`Open ${item.title}`}
                >
                  <span className="recordings-thumb-fallback">Open recording</span>
                </a>
              )}
              <p className="recordings-card-title">{item.title}</p>
              <div className="recordings-card-actions">
                {lockPlayback ? (
                  lockStyle === 'banner' ? (
                    <Link className="btn btn-secondary" to={unlockHref}>
                      {unlockLabel}
                    </Link>
                  ) : (
                    <Link className="btn btn-primary" to={unlockHref}>
                      {unlockLabel}
                    </Link>
                  )
                ) : embeddable ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    aria-expanded={isActive}
                    onClick={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                  >
                    {isActive ? 'Minimize' : 'Play'}
                  </button>
                ) : (
                  <a
                    className="btn btn-primary"
                    href={openHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {expanded && (
        <div ref={expandRef} className="recordings-expand">
          <SessionVideoPlayer
            key={expanded.id}
            url={expanded.url}
            title={expanded.title}
            defaultExpanded
            onMinimize={() => setExpandedId(null)}
          />
        </div>
      )}
    </div>
  )

  if (!framed) return body
  return <div className="card stack">{body}</div>
}

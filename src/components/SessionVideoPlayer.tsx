import { useState } from 'react'
import { recordingOpenHref, youtubeEmbedSrc, youtubeWatchUrl } from '@/lib/sessionLinks'

type Props = {
  url: string
  title: string
  /** Start expanded (default false). */
  defaultExpanded?: boolean
  /** Called when Minimize is pressed (optional parent control). */
  onMinimize?: () => void
}

/** YouTube → expandable embed + Open on YouTube; other URLs → external Watch link. */
export function SessionVideoPlayer({
  url,
  title,
  defaultExpanded = false,
  onMinimize,
}: Props) {
  const trimmed = url.trim()
  const embed = youtubeEmbedSrc(trimmed)
  const watch = youtubeWatchUrl(trimmed) ?? recordingOpenHref(trimmed)
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (!trimmed) return null

  if (!embed) {
    return (
      <div className="session-video session-video-external">
        <p className="session-video-title">{title}</p>
        <a className="btn btn-secondary" href={watch} rel="noopener noreferrer" target="_blank">
          Watch recording
        </a>
      </div>
    )
  }

  function minimize() {
    setExpanded(false)
    onMinimize?.()
  }

  return (
    <div className={`session-video${expanded ? ' session-video-expanded' : ''}`}>
      <div className="session-video-bar">
        <p className="session-video-title">{title}</p>
        <div className="split-actions">
          {expanded ? (
            <button type="button" className="btn btn-primary" onClick={minimize} aria-expanded>
              Minimize
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setExpanded(true)}
              aria-expanded={false}
            >
              Play
            </button>
          )}
          <a className="btn btn-secondary" href={watch} rel="noopener noreferrer" target="_blank">
            Open on YouTube
          </a>
        </div>
      </div>
      {expanded && (
        <div className="video-frame">
          <iframe
            src={`${embed}${embed.includes('?') ? '&' : '?'}autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
    </div>
  )
}

import { useEffect, useId, useRef } from 'react'
import { youtubeVideoId } from '@/lib/sessionLinks'

type YtPlayer = {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
}

type YtPlayerEvent = { data: number; target: YtPlayer }

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        opts: {
          videoId: string
          width?: string | number
          height?: string | number
          playerVars?: Record<string, string | number>
          events?: {
            onReady?: (e: { target: YtPlayer }) => void
            onStateChange?: (e: YtPlayerEvent) => void
          }
        },
      ) => YtPlayer
      PlayerState: { ENDED: number; PLAYING: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

const YT_API_SRC = 'https://www.youtube.com/iframe_api'
const COMPLETE_AT = 0.97
const SEEK_SLACK_SEC = 2.5

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    const prior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prior?.()
      done()
    }
    if (!document.querySelector(`script[src="${YT_API_SRC}"]`)) {
      const script = document.createElement('script')
      script.src = YT_API_SRC
      script.async = true
      document.head.appendChild(script)
    }
    const poll = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(poll)
        done()
      }
    }, 50)
  })
}

function embedVideoId(url: string): string | null {
  return youtubeVideoId(url)
}

type Props = {
  videoUrl: string
  completed: boolean
  onCompleted: () => void
}

/** YouTube embed that unlocks only after nearly the full video is watched (blocks large seeks). */
export function MentorIntroPlayer({ videoUrl, completed, onCompleted }: Props) {
  const reactId = useId().replace(/:/g, '')
  const elementId = `mentor-intro-${reactId}`
  const playerRef = useRef<YtPlayer | null>(null)
  const maxWatchedRef = useRef(0)
  const completedRef = useRef(completed)
  const pollRef = useRef<number | null>(null)

  completedRef.current = completed

  useEffect(() => {
    const videoId = embedVideoId(videoUrl)
    if (!videoId) return

    let cancelled = false

    void loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return

      const markComplete = () => {
        if (completedRef.current) return
        completedRef.current = true
        onCompleted()
      }

      const stopPoll = () => {
        if (pollRef.current != null) {
          window.clearInterval(pollRef.current)
          pollRef.current = null
        }
      }

      const tickProgress = (player: YtPlayer) => {
        if (completedRef.current) return
        const duration = player.getDuration()
        if (!duration || !Number.isFinite(duration) || duration <= 0) return

        let current = player.getCurrentTime()
        if (!Number.isFinite(current)) return

        if (current > maxWatchedRef.current + SEEK_SLACK_SEC) {
          player.seekTo(maxWatchedRef.current, true)
          current = maxWatchedRef.current
        } else {
          maxWatchedRef.current = Math.max(maxWatchedRef.current, current)
        }

        if (maxWatchedRef.current / duration >= COMPLETE_AT) {
          stopPoll()
          markComplete()
        }
      }

      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            stopPoll()
            pollRef.current = window.setInterval(() => tickProgress(e.target), 400)
          },
          onStateChange: (e) => {
            tickProgress(e.target)
            if (e.data === window.YT?.PlayerState.ENDED) {
              const duration = e.target.getDuration()
              if (duration > 0 && maxWatchedRef.current / duration >= COMPLETE_AT) {
                stopPoll()
                markComplete()
              } else if (duration > 0) {
                // Ended via scrub — send them back to unwatched portion
                e.target.seekTo(maxWatchedRef.current, true)
              }
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (pollRef.current != null) {
        window.clearInterval(pollRef.current)
        pollRef.current = null
      }
      try {
        playerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      playerRef.current = null
    }
  }, [elementId, onCompleted, videoUrl])

  const videoId = embedVideoId(videoUrl)
  if (!videoId) {
    return (
      <p className="alert alert-error" style={{ margin: 0 }}>
        Mentor intro video is not configured correctly.
      </p>
    )
  }

  return (
    <div className="stack" style={{ gap: '0.65rem' }}>
      <div className="video-frame">
        <div id={elementId} />
      </div>
      {completed ? (
        <p className="alert alert-ok" style={{ margin: 0 }}>
          Intro complete — you can continue to the next steps.
        </p>
      ) : (
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          Watch the full video to unlock the next steps. Skipping ahead is disabled.
        </p>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { ChatMessage } from '@/lib/types'
import { useAuth } from '@/lib/auth'

interface Props {
  channelName: string
  title?: string
}

export function EphemeralChat({ channelName, title = 'Session chat' }: Props) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('Connecting…')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!user) return

    setMessages([])
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: true } },
    })
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        const msg = payload as ChatMessage
        if (!msg?.id || !msg.body) return
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      })
      .subscribe((s) => {
        setStatus(s === 'SUBSCRIBED' ? 'Live · not saved' : `Status: ${s}`)
      })

    return () => {
      channelRef.current = null
      void supabase.removeChannel(channel)
      setMessages([])
    }
  }, [channelName, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !draft.trim() || !channelRef.current) return

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: user.id,
      senderName: profile?.display_name ?? 'Someone',
      body: draft.trim().slice(0, 500),
      at: Date.now(),
    }

    await channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg })
    setDraft('')
  }

  if (!user) {
    return <p className="muted">Sign in to use chat.</p>
  }

  return (
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span className="pill">{status}</span>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
        Messages are not stored. Refreshing or leaving clears the conversation.
      </p>
      <div className="chat">
        <div className="chat-log" aria-live="polite">
          {messages.length === 0 && <p className="empty">No messages yet. Say hello.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.senderId === user.id ? 'mine' : ''}`}>
              <span className="chat-meta">
                {m.senderName} · {new Date(m.at).toLocaleTimeString()}
              </span>
              {m.body}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form className="chat-compose" onSubmit={(e) => void send(e)}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message (no personal info)"
            maxLength={500}
            aria-label="Chat message"
          />
          <button className="btn btn-primary" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

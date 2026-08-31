import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { StatusPill } from '@/components/StatusPill'
import { formatDate, useTopics } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import type { StuckAnswer, StuckQuestion } from '@/lib/types'

export function StuckListPage() {
  const { user } = useAuth()
  const { topics } = useTopics()
  const [topicId, setTopicId] = useState('')
  const [questions, setQuestions] = useState<StuckQuestion[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [askTopicId, setAskTopicId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('stuck_questions')
      .select('*, topics(id, name), profiles!stuck_questions_author_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (topicId) query = query.eq('topic_id', topicId)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setQuestions((data as StuckQuestion[]) ?? [])
    setLoading(false)
  }, [topicId])

  useEffect(() => {
    void load()
  }, [load])

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    const { error: err } = await supabase.from('stuck_questions').insert({
      author_id: user.id,
      topic_id: askTopicId,
      title: title.trim(),
      body: body.trim(),
    })
    if (err) {
      setError(err.message)
      return
    }
    setTitle('')
    setBody('')
    await load()
  }

  return (
    <section className="section">
      <h1 className="page-title">Stuck points</h1>
      <p className="lead">
        Text-only Q&amp;A on curated topics — like a focused Stack Overflow for precalculus. Describe
        the step where you got stuck. No photo uploads (keeps the site free and private).
      </p>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <label>
          Filter
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card stack" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Ask a question</h2>
        {!user ? (
          <p className="muted">
            <Link to="/auth">Sign in</Link> to ask.
          </p>
        ) : (
          <form className="form" onSubmit={(e) => void ask(e)}>
            <label>
              Topic
              <select required value={askTopicId} onChange={(e) => setAskTopicId(e.target.value)}>
                <option value="">Select</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input
                required
                minLength={5}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Factoring when leading coefficient isn't 1"
              />
            </label>
            <label>
              Where are you stuck?
              <textarea
                required
                minLength={20}
                maxLength={4000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the problem setup and the exact step that blocks you. Use plain text or simple math notation."
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Post question
            </button>
          </form>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : questions.length === 0 ? (
        <div className="empty">No questions yet. Be the first to ask.</div>
      ) : (
        <div className="stack">
          {questions.map((q) => (
            <article key={q.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0 }}>
                  <Link to={`/stuck/${q.id}`}>{q.title}</Link>
                </h3>
                <StatusPill status={q.status} />
              </div>
              <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                {q.topics?.name} · {q.profiles?.display_name} · {formatDate(q.created_at.slice(0, 10))}
              </p>
              <p style={{ margin: '0.75rem 0 0' }}>{q.body.slice(0, 220)}{q.body.length > 220 ? '…' : ''}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function StuckDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [question, setQuestion] = useState<StuckQuestion | null>(null)
  const [answers, setAnswers] = useState<StuckAnswer[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    const [{ data: q, error: qErr }, { data: a, error: aErr }] = await Promise.all([
      supabase
        .from('stuck_questions')
        .select('*, topics(id, name), profiles!stuck_questions_author_id_fkey(display_name)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('stuck_answers')
        .select('*, profiles!stuck_answers_author_id_fkey(display_name)')
        .eq('question_id', id)
        .order('created_at'),
    ])
    if (qErr || aErr) setError(qErr?.message ?? aErr?.message ?? 'Error')
    setQuestion((q as StuckQuestion) ?? null)
    setAnswers((a as StuckAnswer[]) ?? [])
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function answer(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id) return
    const { error: err } = await supabase.from('stuck_answers').insert({
      question_id: id,
      author_id: user.id,
      body: body.trim(),
    })
    if (err) {
      setError(err.message)
      return
    }
    await supabase.from('stuck_questions').update({ status: 'answered' }).eq('id', id)
    setBody('')
    await load()
  }

  async function accept(answerId: string) {
    if (!question || !user || question.author_id !== user.id) return
    await supabase.from('stuck_answers').update({ is_accepted: false }).eq('question_id', question.id)
    await supabase.from('stuck_answers').update({ is_accepted: true }).eq('id', answerId)
    await supabase.from('stuck_questions').update({ status: 'answered' }).eq('id', question.id)
    await load()
  }

  if (!question) {
    return (
      <section className="section">
        <p className="muted">{error ?? 'Loading…'}</p>
        <Link to="/stuck">Back</Link>
      </section>
    )
  }

  return (
    <section className="section">
      <p>
        <Link to="/stuck">← Stuck points</Link>
      </p>
      <h1 className="page-title">{question.title}</h1>
      <p className="muted">
        {question.topics?.name} · {question.profiles?.display_name} · <StatusPill status={question.status} />
      </p>
      <div className="card" style={{ whiteSpace: 'pre-wrap', marginBottom: '1.25rem' }}>
        {question.body}
      </div>

      <h2>Answers</h2>
      <div className="stack" style={{ marginBottom: '1.25rem' }}>
        {answers.length === 0 && <div className="empty">No answers yet.</div>}
        {answers.map((a) => (
          <article key={a.id} className="card">
            <p className="muted" style={{ marginTop: 0, fontSize: '0.9rem' }}>
              {a.profiles?.display_name}
              {a.is_accepted ? ' · accepted' : ''}
            </p>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{a.body}</p>
            {user?.id === question.author_id && !a.is_accepted && (
              <div className="split-actions">
                <button type="button" className="btn btn-secondary" onClick={() => void accept(a.id)}>
                  Accept answer
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {user ? (
        <form className="form card" onSubmit={(e) => void answer(e)}>
          <label>
            Your answer
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Explain the next step clearly. No personal info."
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Post answer
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to="/auth">Sign in</Link> to answer.
        </p>
      )}
    </section>
  )
}

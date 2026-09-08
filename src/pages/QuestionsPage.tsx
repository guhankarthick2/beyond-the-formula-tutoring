import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PageBack } from '@/components/PageBack'
import { StatusPill } from '@/components/StatusPill'
import { useAuth } from '@/lib/auth'
import { formatDate, useTopics } from '@/lib/hooks'
import { questionPath, useOpenQuestionsInbox } from '@/lib/openQuestionsInbox'
import { getSubject } from '@/lib/subjects'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { usePageView } from '@/lib/stats'
import type { StuckAnswer, StuckQuestion } from '@/lib/types'

async function notifyQaReply(payload: {
  questionId: string
  answerId: string
  recipientUserId: string
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Email notify unavailable.' }
  const { data, error } = await supabase.functions.invoke('notify-qa-reply', {
    body: {
      question_id: payload.questionId,
      answer_id: payload.answerId,
      recipient_user_id: payload.recipientUserId,
    },
  })

  const bodyError =
    data && typeof data === 'object' && 'error' in data
      ? String((data as { error: string }).error)
      : null

  if (error) {
    if (bodyError) return { error: bodyError }
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = (await ctx.json()) as { error?: string }
        if (parsed?.error) return { error: parsed.error }
      } catch {
        /* ignore */
      }
    }
    return {
      error:
        'Email notify failed. Check Edge Function logs (and RESEND_API_KEY / FROM address). Your reply was still posted.',
    }
  }

  if (bodyError) return { error: bodyError }
  return { error: null }
}

async function notifyQuestionReport(payload: {
  reportId: string
  questionId: string
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) return { error: 'Report email unavailable.' }
  const { data, error } = await supabase.functions.invoke('notify-question-report', {
    body: {
      report_id: payload.reportId,
      question_id: payload.questionId,
    },
  })

  const bodyError =
    data && typeof data === 'object' && 'error' in data
      ? String((data as { error: string }).error)
      : null

  if (error) {
    if (bodyError) return { error: bodyError }
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      try {
        const parsed = (await ctx.json()) as { error?: string }
        if (parsed?.error) return { error: parsed.error }
      } catch {
        /* ignore */
      }
    }
    return {
      error:
        'Report was saved, but emailing admins failed. Admins can still see it under Admin → Questions.',
    }
  }

  if (bodyError) return { error: bodyError }
  return { error: null }
}

export function QuestionsListPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>()
  const subject = getSubject(subjectSlug)
  const { user, isApprovedTutor } = useAuth()
  const { topics } = useTopics()
  const showTopics = subject?.slug === 'precal'
  const [topicFilter, setTopicFilter] = useState('')
  const [questions, setQuestions] = useState<StuckQuestion[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [askTopicId, setAskTopicId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  usePageView(subject ? `/students/${subject.slug}/questions` : '/students')

  const load = useCallback(async () => {
    if (!subject) return
    setLoading(true)
    setError(null)
    let query = supabase
      .from('stuck_questions')
      .select('*, topics(id, name), profiles!stuck_questions_author_id_fkey(display_name)')
      .eq('subject_slug', subject.slug)
      .order('created_at', { ascending: false })
      .limit(50)

    if (topicFilter) query = query.eq('topic_id', topicFilter)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setQuestions((data as StuckQuestion[]) ?? [])
    setLoading(false)
  }, [subject, topicFilter])

  useEffect(() => {
    void load()
  }, [load])

  if (!subject) {
    return <Navigate to="/students" replace />
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !subject) return
    setError(null)
    const { error: err } = await supabase.from('stuck_questions').insert({
      author_id: user.id,
      subject_slug: subject.slug,
      topic_id: showTopics && askTopicId ? askTopicId : null,
      title: title.trim(),
      body: body.trim(),
    })
    if (err) {
      setError(err.message)
      return
    }
    setTitle('')
    setBody('')
    setAskTopicId('')
    await load()
  }

  const listPath = `/students/${subject.slug}/questions`

  return (
    <section className="section">
      <PageBack to={`/students/${subject.slug}`} label={`Back to ${subject.shortName}`} />

      <div className="page-banner page-banner-student" style={{ marginTop: '0.85rem' }}>
        <div className="badge-row">
          <span className="badge badge-blue">{subject.name}</span>
          {isApprovedTutor && <span className="badge badge-violet">Mentors can answer</span>}
        </div>
        <h1 className="page-title">Open questions</h1>
        <p className="lead" style={{ margin: 0, maxWidth: '42rem' }}>
          Free-form help for {subject.shortName}. Post a question; any approved mentor (or peer) can
          answer when they can. Close the thread when you have a satisfying answer. Text only — no
          photo uploads.
        </p>
      </div>

      {showTopics && (
        <div className="card" style={{ marginTop: '1.25rem', marginBottom: '1rem' }}>
          <label>
            Filter by topic (optional)
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
              <option value="">All questions</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="card stack" style={{ marginTop: showTopics ? 0 : '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Ask a question</h2>
        {!user ? (
          <p className="muted" style={{ margin: 0 }}>
            <Link to={`/auth?next=${encodeURIComponent(listPath)}`}>Sign in</Link> to ask.
          </p>
        ) : (
          <form className="form" onSubmit={(e) => void ask(e)}>
            {showTopics && (
              <label>
                Topic (optional)
                <select value={askTopicId} onChange={(e) => setAskTopicId(e.target.value)}>
                  <option value="">No specific topic</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Title
              <input
                required
                minLength={5}
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. How do I approach this rate problem?"
              />
            </label>
            <label>
              Your question
              <textarea
                required
                minLength={20}
                maxLength={4000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe the problem and where you are stuck. Use plain text or simple math notation."
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
                  <Link to={`${listPath}/${q.id}`}>{q.title}</Link>
                </h3>
                <StatusPill status={q.status} />
              </div>
              <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                {q.topics?.name ? `${q.topics.name} · ` : ''}
                {q.profiles?.display_name} · {formatDate(q.created_at.slice(0, 10))}
              </p>
              <p style={{ margin: '0.75rem 0 0' }}>
                {q.body.slice(0, 220)}
                {q.body.length > 220 ? '…' : ''}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function QuestionsDetailPage() {
  const { subjectSlug, id } = useParams<{ subjectSlug: string; id: string }>()
  const subject = getSubject(subjectSlug)
  const { user, isApprovedTutor, isAdmin } = useAuth()
  const { dismiss, refresh: refreshOpenAlerts } = useOpenQuestionsInbox()
  const [question, setQuestion] = useState<StuckQuestion | null>(null)
  const [answers, setAnswers] = useState<StuckAnswer[]>([])
  const [body, setBody] = useState('')
  const [emailNotify, setEmailNotify] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  usePageView(
    subject && id ? `/students/${subject.slug}/questions/${id}` : '/students',
  )

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

  useEffect(() => {
    if (!id || !isApprovedTutor || !question || question.status !== 'open') return
    void dismiss(id)
  }, [id, isApprovedTutor, question?.id, question?.status, dismiss])

  if (!subject) {
    return <Navigate to="/students" replace />
  }

  const listPath = `/students/${subject.slug}/questions`

  async function answer(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id || !question || question.status === 'closed') return
    setError(null)
    setInfo(null)

    const { data, error: err } = await supabase
      .from('stuck_answers')
      .insert({
        question_id: id,
        author_id: user.id,
        body: body.trim(),
      })
      .select('id')
      .single()

    if (err) {
      setError(err.message)
      return
    }

    await supabase.rpc('mark_stuck_answered', { p_question_id: id })
    await refreshOpenAlerts()

    const answerId = (data as { id: string }).id
    const recipientId =
      user.id === question.author_id
        ? answers.find((a) => a.author_id !== user.id)?.author_id ?? null
        : question.author_id

    if (emailNotify && recipientId) {
      const { error: mailErr } = await notifyQaReply({
        questionId: id,
        answerId,
        recipientUserId: recipientId,
      })
      if (mailErr) setInfo(mailErr)
      else setInfo('Reply posted and email notification sent.')
    }

    setBody('')
    setEmailNotify(false)
    await load()
  }

  async function accept(answerId: string) {
    if (!question || !user || question.author_id !== user.id) return
    await supabase.from('stuck_answers').update({ is_accepted: false }).eq('question_id', question.id)
    await supabase.from('stuck_answers').update({ is_accepted: true }).eq('id', answerId)
    await supabase.rpc('mark_stuck_answered', { p_question_id: question.id })
    await load()
  }

  async function closeQuestion() {
    if (!question || !user) return
    setError(null)
    const { error: err } = await supabase.rpc('close_stuck_question', {
      p_question_id: question.id,
    })
    if (err) {
      setError(err.message)
      return
    }
    setInfo('Question closed.')
    await refreshOpenAlerts()
    await load()
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !question) return
    setError(null)
    setInfo(null)

    const { data, error: err } = await supabase
      .from('question_reports')
      .insert({
        question_id: question.id,
        reporter_id: user.id,
        reason: reportReason.trim(),
      })
      .select('id')
      .single()

    if (err) {
      if (err.code === '23505') {
        setInfo('You already reported this question. Admins have been notified.')
        setShowReport(false)
        return
      }
      setError(err.message)
      return
    }

    const reportId = (data as { id: string }).id
    const { error: mailErr } = await notifyQuestionReport({
      reportId,
      questionId: question.id,
    })
    if (mailErr) setInfo(mailErr)
    else setInfo('Thanks — admins were emailed and can delete this thread if needed.')
    setReportReason('')
    setShowReport(false)
  }

  if (!question) {
    return (
      <section className="section">
        <p className="muted">{error ?? 'Loading…'}</p>
        <Link to={listPath}>Back</Link>
      </section>
    )
  }

  if (question.subject_slug && question.subject_slug !== subject.slug) {
    return <Navigate to={questionPath(question)} replace />
  }

  const isAuthor = user?.id === question.author_id
  const canClose =
    !!user && question.status !== 'closed' && (isAuthor || isApprovedTutor || isAdmin)
  const isClosed = question.status === 'closed'
  const recipientLabel = isAuthor
    ? 'the mentor who answered (latest other reply)'
    : 'the student who asked'

  return (
    <section className="section">
      <PageBack to={listPath} label={`Back to ${subject.shortName} questions`} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          {question.title}
        </h1>
        <StatusPill status={question.status} />
      </div>
      <p className="muted">
        {question.topics?.name ? `${question.topics.name} · ` : ''}
        {question.profiles?.display_name}
      </p>
      <div className="card" style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
        {question.body}
      </div>

      <div className="split-actions" style={{ marginBottom: '1.25rem' }}>
        {canClose && (
          <button type="button" className="btn btn-secondary" onClick={() => void closeQuestion()}>
            Close question
          </button>
        )}
        {user && !isClosed && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setShowReport((v) => !v)
              setError(null)
            }}
          >
            Report to admin
          </button>
        )}
      </div>

      {showReport && user && (
        <form className="form card" style={{ marginBottom: '1.25rem' }} onSubmit={(e) => void submitReport(e)}>
          <h3 style={{ margin: 0 }}>Report inappropriate question</h3>
          <p className="muted" style={{ margin: 0 }}>
            Admins get an email with a link to review and delete. Your report stays private.
          </p>
          <label>
            Why are you reporting this? (optional)
            <textarea
              maxLength={1000}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Briefly describe the issue"
            />
          </label>
          <div className="split-actions">
            <button className="btn btn-primary" type="submit">
              Submit report
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowReport(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

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
            {isAuthor && !a.is_accepted && !isClosed && (
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
      {info && <div className="alert alert-ok">{info}</div>}

      {isClosed ? (
        <div className="empty">This question is closed. No new replies.</div>
      ) : user ? (
        <form className="form card" onSubmit={(e) => void answer(e)}>
          <h3 style={{ margin: 0 }}>
            {isApprovedTutor ? 'Answer as mentor' : 'Your reply'}
          </h3>
          <label>
            {isApprovedTutor ? 'Mentor answer' : 'Reply'}
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Explain the next step clearly. No personal contact info."
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={emailNotify}
              onChange={(e) => setEmailNotify(e.target.checked)}
            />
            <span>
              Also email {recipientLabel} (addresses stay private; they get a link to this thread)
            </span>
          </label>
          <button className="btn btn-primary" type="submit">
            Post {isApprovedTutor ? 'answer' : 'reply'}
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to={`/auth?next=${encodeURIComponent(`${listPath}/${id}`)}`}>Sign in</Link> to
          answer.
        </p>
      )}
    </section>
  )
}

/** Legacy /stuck → PreCal questions */
export function StuckListRedirect() {
  return <Navigate to="/students/precal/questions" replace />
}

export function StuckDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  if (!id) return <Navigate to="/students/precal/questions" replace />
  return <Navigate to={`/students/precal/questions/${id}`} replace />
}

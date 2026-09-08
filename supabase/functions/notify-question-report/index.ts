// Supabase Edge Function: notify-question-report
// Emails all admins when a question is reported. Never returns emails to the client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('NOTIFY_FROM_EMAIL') || 'Beyond The Formula <onboarding@resend.dev>'
    const siteUrl = (Deno.env.get('SITE_URL') || 'https://beyondtheformula.org').replace(/\/$/, '')

    if (!resendKey) {
      return json({ error: 'Email notify is not configured (missing RESEND_API_KEY).' }, 503)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ error: 'Server misconfigured.' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json()
    const reportId = String(body.report_id || '')
    const questionId = String(body.question_id || '')
    if (!reportId || !questionId) {
      return json({ error: 'Missing report_id or question_id.' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: report, error: rErr } = await admin
      .from('question_reports')
      .select('id, question_id, reporter_id, reason, created_at')
      .eq('id', reportId)
      .eq('question_id', questionId)
      .maybeSingle()
    if (rErr || !report) return json({ error: 'Report not found.' }, 404)
    if (report.reporter_id !== user.id) {
      return json({ error: 'Only the reporter can trigger notify.' }, 403)
    }

    const { data: question, error: qErr } = await admin
      .from('stuck_questions')
      .select('id, title, subject_slug, body')
      .eq('id', questionId)
      .maybeSingle()
    if (qErr || !question) return json({ error: 'Question not found.' }, 404)

    const { data: reporterProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    const { data: admins, error: aErr } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
    if (aErr) return json({ error: 'Could not load admins.' }, 500)
    if (!admins?.length) return json({ error: 'No admins to notify.' }, 404)

    const emails: string[] = []
    for (const row of admins) {
      const { data: adminUser } = await admin.auth.admin.getUserById(row.id)
      const email = adminUser.user?.email
      if (email) emails.push(email)
    }
    if (!emails.length) return json({ error: 'No admin emails available.' }, 404)

    const slug = question.subject_slug || 'precal'
    const threadUrl = `${siteUrl}/students/${slug}/questions/${question.id}`
    const adminUrl = `${siteUrl}/admin`
    const reporterName = reporterProfile?.display_name || 'A user'
    const reason = (report.reason || '').trim() || '(no reason given)'
    const preview = question.body.slice(0, 280) + (question.body.length > 280 ? '…' : '')

    const subject = `[Report] Open question: ${question.title}`
    const text = [
      `${reporterName} reported an open question on Beyond The Formula.`,
      '',
      `Title: ${question.title}`,
      `Reason: ${reason}`,
      '',
      `Preview:`,
      preview,
      '',
      `View thread: ${threadUrl}`,
      `Admin → Questions (in-app badge + reported section): ${adminUrl}?tab=questions`,
      '',
      'Delete the thread from Admin if it violates guidelines. Email addresses are never shown on the site.',
    ].join('\n')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: emails,
        subject,
        text,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Resend error', detail)
      return json({ error: 'Failed to send report email.' }, 502)
    }

    return json({ ok: true, emailed: emails.length })
  } catch (e) {
    console.error(e)
    return json({ error: 'Unexpected error.' }, 500)
  }
})

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

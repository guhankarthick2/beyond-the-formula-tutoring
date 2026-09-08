// Supabase Edge Function: notify-qa-reply
// Sends a private email to the recipient when someone opts in on a Q&A reply.
// Never returns email addresses to the client.

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
    const questionId = String(body.question_id || '')
    const answerId = String(body.answer_id || '')
    const recipientUserId = String(body.recipient_user_id || '')
    if (!questionId || !answerId || !recipientUserId) {
      return json({ error: 'Missing question_id, answer_id, or recipient_user_id.' }, 400)
    }
    if (recipientUserId === user.id) {
      return json({ error: 'Cannot email yourself.' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: question, error: qErr } = await admin
      .from('stuck_questions')
      .select('id, title, subject_slug, author_id')
      .eq('id', questionId)
      .maybeSingle()
    if (qErr || !question) return json({ error: 'Question not found.' }, 404)

    const { data: answer, error: aErr } = await admin
      .from('stuck_answers')
      .select('id, author_id, question_id')
      .eq('id', answerId)
      .eq('question_id', questionId)
      .maybeSingle()
    if (aErr || !answer) return json({ error: 'Answer not found.' }, 404)
    if (answer.author_id !== user.id) {
      return json({ error: 'Only the reply author can request email notify.' }, 403)
    }

    const { data: senderProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    const { data: recipientUser, error: recipErr } = await admin.auth.admin.getUserById(recipientUserId)
    if (recipErr || !recipientUser.user?.email) {
      return json({ error: 'Recipient email unavailable.' }, 404)
    }

    const slug = question.subject_slug || 'precal'
    const threadUrl = `${siteUrl}/students/${slug}/questions/${question.id}`
    const senderName = senderProfile?.display_name || 'A mentor'
    const subject = `New reply on: ${question.title}`
    const text = [
      `${senderName} replied to an open question on Beyond The Formula.`,
      '',
      `Question: ${question.title}`,
      '',
      `Open the thread (sign in if needed):`,
      threadUrl,
      '',
      'Email addresses are never shared on the site. You received this because someone opted to notify you by email.',
    ].join('\n')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientUser.user.email],
        subject,
        text,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Resend error', detail)
      return json({ error: 'Failed to send email notification.' }, 502)
    }

    return json({ ok: true })
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

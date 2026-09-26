/**
 * AP Precalculus Unit 1 — grading utilities.
 * Multipart items award full points at 100% parts correct, half points at 50%+.
 */
;(function (global) {
  function parseNumber(value) {
    if (value === null || value === undefined || value === '') return NaN
    const cleaned = String(value)
      .trim()
      .replace(/,/g, '')
      .replace(/[−–—]/g, '-')
      .replace(/\s+/g, '')
    const frac = cleaned.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/)
    if (frac) {
      const den = Number(frac[2])
      if (den === 0) return NaN
      return Number(frac[1]) / den
    }
    return Number(cleaned)
  }

  function normalizeAnswerText(value) {
    let s = String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[−–—]/g, '-')
    s = s.replace(/∞/g, 'infinity')
    s = s.replace(/positive\s*infinity/g, '+infinity')
    s = s.replace(/negative\s*infinity/g, '-infinity')
    s = s.replace(/\+\s*infinity/g, '+infinity')
    s = s.replace(/-\s*infinity/g, '-infinity')
    s = s.replace(/infinity/g, 'inf')
    s = s.replace(/\binfty\b/g, 'inf')
    s = s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6')
    s = s.replace(/√/g, 'sqrt')
    s = s.replace(/∪/g, 'u')
    s = s.replace(/\\cup/g, 'u')
    s = s.replace(/\s+/g, '')
    s = s.replace(/[·*]/g, '')
    s = s.replace(/^(?:f|g|h|p|q|r|s|c|v)\(x\)=/, '')
    s = s.replace(/^c\(t\)=/, '')
    s = s.replace(/^y=/, '')
    if (s === 'inf') s = '+inf'
    return s
  }

  function productKey(raw) {
    const s = normalizeAnswerText(raw)
    if (!s || s.includes(',') || s.includes('u') || s.includes('/') || s.includes('=')) return null
    const factors = []
    let i = 0
    let depth = 0
    let buf = ''
    const flush = () => {
      if (!buf) return
      factors.push(buf)
      buf = ''
    }
    while (i < s.length) {
      const ch = s[i]
      if (ch === '(') {
        if (depth === 0 && buf && buf !== '+' && buf !== '-') flush()
        depth += 1
        buf += ch
      } else if (ch === ')') {
        if (depth === 0) return null
        depth -= 1
        buf += ch
        if (depth === 0 && s[i + 1] === '^') {
          buf += '^'
          i += 2
          let digits = ''
          while (i < s.length && /[0-9]/.test(s[i])) {
            digits += s[i]
            i += 1
          }
          if (!digits) return null
          buf += digits
          i -= 1
        }
        if (depth === 0) flush()
      } else if (
        depth === 0 &&
        (ch === '+' || ch === '-') &&
        buf &&
        /[0-9x)]/.test(buf[buf.length - 1])
      ) {
        return null
      } else {
        buf += ch
      }
      i += 1
    }
    if (depth !== 0) return null
    flush()
    if (!factors.some((f) => f.includes('x') || f.includes('sqrt'))) return null

    let sign = 1
    const pieces = []
    for (const factor of factors) {
      let term = factor
      if (term.startsWith('+')) term = term.slice(1)
      if (term.startsWith('-')) {
        sign *= -1
        term = term.slice(1)
      }
      const coeff = term.match(/^(\d+)(?=x|\(|$)/)
      if (coeff) {
        const n = Number(coeff[1])
        if (n !== 1) pieces.push(String(n))
        term = term.slice(coeff[1].length)
      }
      if (term === '(x)') term = 'x'
      term = term.replace(/\^1$/, '')
      if (term === 'x^1') term = 'x'
      if (term) pieces.push(term)
    }
    pieces.sort()
    return `${sign}|${pieces.join('*')}`
  }

  function textsMatch(givenRaw, targetRaw) {
    const given = normalizeAnswerText(givenRaw)
    const target = normalizeAnswerText(targetRaw)
    if (!target) return false
    if (given === target) return true
    const givenKey = productKey(givenRaw)
    const targetKey = productKey(targetRaw)
    return Boolean(givenKey && targetKey && givenKey === targetKey)
  }

  function setKey(value) {
    return normalizeAnswerText(value)
      .split(/[,;]+/)
      .filter(Boolean)
      .sort()
      .join('|')
  }

  function numbersClose(a, b, tolerance) {
    if (Number.isNaN(a) || Number.isNaN(b)) return false
    const tol = tolerance ?? 0.001
    return Math.abs(a - b) <= tol
  }

  function gradePart(part, response) {
    const possible = 1
    if (part.type === 'mc') {
      const expected = String(part.answer).trim().toUpperCase()
      const given = String(response ?? '')
        .trim()
        .toUpperCase()
      const correct = given === expected
      return {
        correct,
        earned: correct ? 1 : 0,
        possible,
        feedback: correct ? part.feedbackCorrect || 'Correct.' : part.feedbackWrong || 'Not quite.',
        expected: expected,
      }
    }

    if (part.type === 'numeric') {
      const expected = parseNumber(part.answer)
      const given = parseNumber(response)
      const correct = numbersClose(given, expected, part.tolerance)
      return {
        correct,
        earned: correct ? 1 : 0,
        possible,
        feedback: correct
          ? part.feedbackCorrect || 'Correct.'
          : part.feedbackWrong || `Expected ${part.answerDisplay ?? part.answer}.`,
        expected: part.answerDisplay ?? String(part.answer),
      }
    }

    if (part.type === 'text') {
      const targets = [part.answer, ...(part.accept || [])]
      const setMode = part.match === 'set'
      const listMatch = setMode
        ? targets.some((t) => setKey(response) === setKey(t))
        : targets.some((t) => textsMatch(response, t))
      const custom = typeof part.check === 'function' && part.check(response)
      const correct = listMatch || custom
      return {
        correct,
        earned: correct ? 1 : 0,
        possible,
        feedback: correct ? part.feedbackCorrect || 'Correct.' : part.feedbackWrong || 'Check your wording.',
        expected: part.answer,
      }
    }

    return { correct: false, earned: 0, possible, feedback: 'Unknown part type.' }
  }

  function multipartEarned(partResults, totalPoints) {
    const correctCount = partResults.filter((r) => r.correct).length
    const ratio = partResults.length ? correctCount / partResults.length : 0
    if (ratio === 1) return totalPoints
    if (ratio >= 0.5) return totalPoints / 2
    return 0
  }

  function gradeQuestion(question, response) {
    const possible = question.points ?? 1

    if (question.type === 'multipart') {
      const responses = Array.isArray(response) ? response : []
      const partResults = question.parts.map((part, index) => gradePart(part, responses[index]))
      const earned = multipartEarned(partResults, possible)
      const allCorrect = partResults.every((r) => r.correct)
      return {
        id: question.id,
        correct: allCorrect,
        earned,
        possible,
        partResults,
        feedback: allCorrect
          ? question.feedbackCorrect || 'All parts correct.'
          : earned > 0
            ? question.feedbackPartial || 'Partial credit — review the missed part(s).'
            : question.feedbackWrong || 'Review this multi-part item.',
      }
    }

    const single = gradePart(question, response)
    const earned = single.correct ? possible : 0
    return {
      id: question.id,
      correct: single.correct,
      earned,
      possible,
      feedback: single.feedback,
      expected: single.expected,
    }
  }

  function scoreAll(questions, responsesById) {
    const byQuestion = questions.map((q) =>
      gradeQuestion(q, responsesById[q.id] ?? responsesById[String(q.id)]),
    )
    const earned = byQuestion.reduce((sum, r) => sum + r.earned, 0)
    const possible = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)
    return { earned, possible, byQuestion }
  }

  const Unit1Grader = { gradeQuestion, scoreAll, gradePart, multipartEarned }
  global.Unit1Grader = Unit1Grader
  if (typeof module !== 'undefined') module.exports = Unit1Grader
})(typeof window !== 'undefined' ? window : globalThis)

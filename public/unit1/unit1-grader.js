/**
 * AP Precalculus Unit 1 — grading utilities.
 * Multipart items award full points at 100% parts correct, half points at 50%+.
 */
;(function (global) {
  function normalizeText(value) {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/−/g, '-')
  }

  function parseNumber(value) {
    if (value === null || value === undefined || value === '') return NaN
    const cleaned = String(value)
      .trim()
      .replace(/,/g, '')
      .replace(/−/g, '-')
    return Number(cleaned)
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
      const norm = (v) =>
        normalizeText(v)
          .replace(/\*/g, '')
          .replace(/\s/g, '')
          .replace(/\^/g, '^')
      const given = norm(response)
      const targets = [part.answer, ...(part.accept || [])].map(norm)
      const correct = targets.some((t) => t === given || (t.length > 3 && given.includes(t)))
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

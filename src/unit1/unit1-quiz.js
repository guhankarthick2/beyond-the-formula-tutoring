/**
 * AP Precalculus Unit 1 — one-question-at-a-time quiz UI.
 * Requires window.UNIT1 and window.Unit1Grader (load unit1-data.js + unit1-grader.js first).
 */
import './unit1-quiz.css'
import './unit1-data.js'
import './unit1-grader.js'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getUnit1() {
  if (typeof window !== 'undefined' && window.UNIT1) return window.UNIT1
  throw new Error('UNIT1 data not loaded')
}

function getGrader() {
  if (typeof window !== 'undefined' && window.Unit1Grader) return window.Unit1Grader
  throw new Error('Unit1Grader not loaded')
}

function emptyResponse(question) {
  if (question.type === 'multipart') {
    return question.parts.map(() => '')
  }
  return ''
}

function describeAnswer(item, raw, expectedDisplay) {
  const blank = raw === undefined || raw === null || String(raw).trim() === ''
  if (item.type === 'mc') {
    const letter = blank ? '' : String(raw).trim().toUpperCase()
    const index = LETTERS.indexOf(letter)
    const choice = index >= 0 ? item.choices?.[index] : ''
    const yours = blank ? 'No answer' : choice ? `${letter}. ${choice}` : letter
    const expectedLetter = String(item.answer ?? '').trim().toUpperCase()
    const expectedIndex = LETTERS.indexOf(expectedLetter)
    const expectedChoice = expectedIndex >= 0 ? item.choices?.[expectedIndex] : ''
    const correct = expectedChoice ? `${expectedLetter}. ${expectedChoice}` : expectedLetter
    return { yours, correct }
  }
  return {
    yours: blank ? 'No answer' : String(raw),
    correct: String(item.answerDisplay ?? expectedDisplay ?? item.answer ?? ''),
  }
}

function renderAnswerCompare(item, raw, expectedDisplay, correct) {
  const described = describeAnswer(item, raw, expectedDisplay)
  return `
    <div class="unit1-review-grid">
      <div class="unit1-review-box ${correct ? 'ok' : 'no'}">
        <span class="unit1-review-label">Your answer</span>
        <p>${escapeHtml(described.yours)}</p>
      </div>
      <div class="unit1-review-box key">
        <span class="unit1-review-label">Correct answer</span>
        <p>${escapeHtml(described.correct)}</p>
      </div>
    </div>
  `
}

export function initUnit1Quiz(container, assessment) {
  const UNIT1 = assessment ?? getUnit1()
  const grader = getGrader()
  const state = {
    phase: 'intro',
    index: 0,
    responses: Object.fromEntries(UNIT1.questions.map((q) => [q.id, emptyResponse(q)])),
    checked: {},
    results: null,
    reviewId: null,
  }

  function currentQuestion() {
    return UNIT1.questions[state.index]
  }

  function setResponse(question, value, partIndex) {
    if (question.type === 'multipart') {
      const arr = [...(state.responses[question.id] || emptyResponse(question))]
      arr[partIndex] = value
      state.responses[question.id] = arr
    } else {
      state.responses[question.id] = value
    }
  }

  function renderIntro() {
    container.innerHTML = `
      <div class="unit1-quiz">
        <header class="unit1-header">
          <h2>${escapeHtml(UNIT1.title)}</h2>
          <p class="unit1-sub">${escapeHtml(UNIT1.subtitle)}</p>
        </header>
        ${UNIT1.note ? `<p class="unit1-note">${escapeHtml(UNIT1.note)}</p>` : ''}
        <ul class="unit1-instructions">
          ${UNIT1.instructions.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
        </ul>
        <p class="unit1-meta">${UNIT1.questionCount} questions · ${UNIT1.totalPoints} points</p>
        <button type="button" class="btn btn-primary unit1-start">Begin assessment</button>
      </div>
    `
    container.querySelector('.unit1-start')?.addEventListener('click', () => {
      state.phase = 'quiz'
      render()
    })
  }

  function renderNavigator() {
    return `
      <div class="unit1-nav" aria-label="Question navigator">
        ${UNIT1.questions
          .map((q, i) => {
            const checked = state.checked[q.id]
            const active = i === state.index ? ' unit1-nav-active' : ''
            const done = checked ? ' unit1-nav-done' : ''
            const ext = q.extension ? ' unit1-nav-ext' : ''
            return `<button type="button" class="unit1-nav-btn${active}${done}${ext}" data-index="${i}" title="Question ${q.id}">${q.id}</button>`
          })
          .join('')}
      </div>
    `
  }

  function renderPartInput(part, question, partIndex) {
    const responses = state.responses[question.id]
    const value = Array.isArray(responses) ? responses[partIndex] : ''
    const name = `q${question.id}-${part.label}`

    if (part.type === 'mc') {
      return `
        <fieldset class="unit1-mc">
          <legend>${escapeHtml(part.label)}. ${escapeHtml(part.prompt)}</legend>
          ${part.choices
            .map((choice, ci) => {
              const letter = LETTERS[ci]
              const checked = value === letter ? ' checked' : ''
              return `
                <label class="unit1-choice">
                  <input type="radio" name="${name}" value="${letter}"${checked} data-part="${partIndex}" />
                  <span><strong>${letter}.</strong> ${escapeHtml(choice)}</span>
                </label>
              `
            })
            .join('')}
        </fieldset>
      `
    }

    if (part.type === 'numeric') {
      return `
        <label class="unit1-field">
          <span>${escapeHtml(part.label)}. ${escapeHtml(part.prompt)}</span>
          <input type="text" inputmode="decimal" class="unit1-input" data-part="${partIndex}" value="${escapeHtml(value)}" />
        </label>
      `
    }

    return `
      <label class="unit1-field">
        <span>${escapeHtml(part.label)}. ${escapeHtml(part.prompt)}</span>
        <input type="text" class="unit1-input" data-part="${partIndex}" value="${escapeHtml(value)}" />
      </label>
    `
  }

  function renderQuestionInput(question) {
    const response = state.responses[question.id]

    if (question.type === 'multipart') {
      return question.parts.map((part, i) => renderPartInput(part, question, i)).join('')
    }

    if (question.type === 'mc') {
      return `
        <fieldset class="unit1-mc">
          ${question.choices
            .map((choice, ci) => {
              const letter = LETTERS[ci]
              const checked = response === letter ? ' checked' : ''
              return `
                <label class="unit1-choice">
                  <input type="radio" name="q${question.id}" value="${letter}"${checked} />
                  <span><strong>${letter}.</strong> ${escapeHtml(choice)}</span>
                </label>
              `
            })
            .join('')}
        </fieldset>
      `
    }

    if (question.type === 'numeric') {
      return `<input type="text" inputmode="decimal" class="unit1-input unit1-input-main" value="${escapeHtml(response)}" />`
    }

    return `<input type="text" class="unit1-input unit1-input-main" value="${escapeHtml(response)}" />`
  }

  function renderFeedback(question) {
    const result = state.checked[question.id]
    if (!result) return ''
    const cls = result.correct ? 'unit1-feedback-ok' : result.earned > 0 ? 'unit1-feedback-partial' : 'unit1-feedback-no'
    let partsHtml = ''
    if (result.partResults) {
      partsHtml = `<ul class="unit1-part-feedback">${result.partResults
        .map(
          (pr, i) =>
            `<li class="${pr.correct ? 'ok' : 'no'}"><strong>${question.parts[i].label}.</strong> ${escapeHtml(pr.feedback)}</li>`,
        )
        .join('')}</ul>`
    }
    return `
      <div class="unit1-feedback ${cls}" role="status">
        <strong>${result.earned} / ${result.possible} pt</strong> — ${escapeHtml(result.feedback)}
        ${partsHtml}
      </div>
    `
  }

  function renderQuiz() {
    const q = currentQuestion()
    const isLast = state.index === UNIT1.questions.length - 1
    const checkLabel = state.checked[q.id] ? 'Re-check answer' : 'Check answer'

    container.innerHTML = `
      <div class="unit1-quiz">
        <div class="unit1-top">
          <div>
            <p class="unit1-progress">Question ${q.id} of ${UNIT1.questionCount}</p>
            <h2 class="unit1-q-title">${escapeHtml(q.topic)}${q.extension ? ' <span class="unit1-ext">Extension</span>' : ''}</h2>
          </div>
          <p class="unit1-pts">${q.points} pt${q.points === 1 ? '' : 's'}</p>
        </div>
        ${renderNavigator()}
        <div class="unit1-card">
          ${q.prompt ? `<p class="unit1-prompt">${escapeHtml(q.prompt)}</p>` : ''}
          <div class="unit1-inputs" data-qid="${q.id}">${renderQuestionInput(q)}</div>
          ${renderFeedback(q)}
        </div>
        <div class="unit1-actions">
          <button type="button" class="btn btn-ghost unit1-prev" ${state.index === 0 ? 'disabled' : ''}>Previous</button>
          <button type="button" class="btn btn-secondary unit1-check">${checkLabel}</button>
          ${
            isLast
              ? '<button type="button" class="btn btn-primary unit1-submit">Submit assessment</button>'
              : '<button type="button" class="btn btn-primary unit1-next">Next</button>'
          }
        </div>
      </div>
    `

    bindQuizEvents(q, isLast)
  }

  function bindQuizEvents(question, isLast) {
    const inputsRoot = container.querySelector('.unit1-inputs')

    inputsRoot?.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.target
        const partIndex = target.dataset.part
        if (partIndex !== undefined) {
          setResponse(question, target.value, Number(partIndex))
        } else {
          setResponse(question, target.value)
        }
      })
    })

    inputsRoot?.querySelectorAll('.unit1-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const target = e.target
        const partIndex = target.dataset.part
        if (partIndex !== undefined) {
          setResponse(question, target.value, Number(partIndex))
        } else {
          setResponse(question, target.value)
        }
      })
    })

    container.querySelectorAll('.unit1-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.index = Number(btn.dataset.index)
        render()
      })
    })

    container.querySelector('.unit1-prev')?.addEventListener('click', () => {
      if (state.index > 0) {
        state.index -= 1
        render()
      }
    })

    container.querySelector('.unit1-next')?.addEventListener('click', () => {
      if (state.index < UNIT1.questions.length - 1) {
        state.index += 1
        render()
      }
    })

    container.querySelector('.unit1-check')?.addEventListener('click', () => {
      const result = grader.gradeQuestion(question, state.responses[question.id])
      state.checked[question.id] = result
      render()
    })

    container.querySelector('.unit1-submit')?.addEventListener('click', () => {
      if (!state.checked[question.id]) {
        state.checked[question.id] = grader.gradeQuestion(question, state.responses[question.id])
      }
      state.results = grader.scoreAll(UNIT1.questions, state.responses)
      state.phase = 'results'
      render()
    })
  }

  function renderReview(question, result) {
    const response = state.responses[question.id]
    let body = ''
    if (question.type === 'multipart') {
      const responses = Array.isArray(response) ? response : []
      body = question.parts
        .map((part, index) => {
          const partResult = result.partResults?.[index]
          return `
            <div class="unit1-review-part">
              <p class="unit1-review-part-prompt"><strong>${escapeHtml(part.label)}.</strong> ${escapeHtml(part.prompt)}</p>
              ${renderAnswerCompare(part, responses[index], partResult?.expected, Boolean(partResult?.correct))}
            </div>
          `
        })
        .join('')
    } else {
      body = renderAnswerCompare(question, response, result.expected, result.correct)
    }

    return `
      <article class="unit1-review" id="unit1-review">
        <p class="unit1-progress">Question ${question.id} review</p>
        <h3 class="unit1-q-title">${escapeHtml(question.topic)}</h3>
        ${question.prompt ? `<p class="unit1-prompt">${escapeHtml(question.prompt)}</p>` : ''}
        ${body}
        <p class="unit1-review-score">${result.earned} / ${result.possible} pt</p>
      </article>
    `
  }

  function renderResults() {
    const { earned, possible, byQuestion } = state.results
    const pct = possible ? Math.round((earned / possible) * 100) : 0
    const reviewQuestion = UNIT1.questions.find((item) => item.id === state.reviewId)
    const reviewResult = byQuestion.find((item) => item.id === state.reviewId)

    container.innerHTML = `
      <div class="unit1-quiz">
        <header class="unit1-header">
          <h2>Assessment complete</h2>
          <p class="unit1-score">${earned} / ${possible} points (${pct}%)</p>
        </header>
        <p class="unit1-meta">Select a question to see what you entered and the correct answer. Multipart items: half credit at 50%+ parts correct.</p>
        ${reviewQuestion && reviewResult ? renderReview(reviewQuestion, reviewResult) : ''}
        <div class="unit1-results-list">
          ${byQuestion
            .map((r) => {
              const q = UNIT1.questions.find((item) => item.id === r.id)
              const cls = r.correct ? 'ok' : r.earned > 0 ? 'partial' : 'no'
              const active = r.id === state.reviewId ? ' active' : ''
              return `
                <button type="button" class="unit1-result-row ${cls}${active}" data-review="${r.id}" aria-expanded="${r.id === state.reviewId}">
                  <span>Q${r.id}</span>
                  <span>${r.earned}/${r.possible}</span>
                  <span class="unit1-result-topic">${escapeHtml(q?.topic ?? '')}</span>
                </button>
              `
            })
            .join('')}
        </div>
        <div class="unit1-actions">
          <button type="button" class="btn btn-primary unit1-restart">Retake</button>
        </div>
      </div>
    `

    container.querySelectorAll('.unit1-result-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.review)
        state.reviewId = state.reviewId === id ? null : id
        render()
        if (state.reviewId) {
          container.querySelector('#unit1-review')?.scrollIntoView({ block: 'nearest' })
        }
      })
    })

    container.querySelector('.unit1-restart')?.addEventListener('click', () => {
      state.phase = 'intro'
      state.index = 0
      state.responses = Object.fromEntries(UNIT1.questions.map((q) => [q.id, emptyResponse(q)]))
      state.checked = {}
      state.results = null
      state.reviewId = null
      render()
    })
  }

  function render() {
    if (state.phase === 'intro') renderIntro()
    else if (state.phase === 'quiz') renderQuiz()
    else renderResults()
  }

  render()

  return () => {
    container.innerHTML = ''
  }
}

if (typeof window !== 'undefined') {
  window.initUnit1Quiz = initUnit1Quiz
}

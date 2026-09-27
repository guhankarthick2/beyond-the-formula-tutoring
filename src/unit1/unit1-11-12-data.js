/**
 * AP Precalculus Unit 1, topics 1.11–1.12.
 * 40 questions, 45 points. Division workspaces from the printed test are not collected.
 */

function parseNum(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, '')
  if (!s) return NaN
  const frac = s.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

function close(a, b, tol = 0.02) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol
}

function numsInOrder(response, expected, tol = 0.02) {
  const parts = String(response ?? '')
    .replace(/[−–—]/g, '-')
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length !== expected.length) return false
  return parts.every((part, index) => close(parseNum(part), expected[index], tol))
}

function sameNumberSet(response, expected, tol = 0.001) {
  const parts = String(response ?? '')
    .replace(/[−–—]/g, '-')
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length !== expected.length) return false
  const left = [...expected]
  for (const part of parts) {
    const value = parseNum(part)
    const index = left.findIndex((item) => close(item, value, tol))
    if (index < 0) return false
    left.splice(index, 1)
  }
  return true
}

function sameText(response, expected) {
  const norm = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/∞/g, 'inf')
      .replace(/infinity/g, 'inf')
      .replace(/∪/g, 'u')
      .replace(/\s+/g, '')
  return norm(response) === norm(expected)
}

function cleanExpr(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/\s+/g, '')
    .replace(/[·*]/g, '')
    .replace(/^[a-z]\([a-z]\)=/, '')
}

function parseQuadratic(raw) {
  let s = cleanExpr(raw)
  s = s.replace(/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/g, (_, num, den) => String(Number(num) / Number(den)))
  if (!s || /[^0-9x+^.+-]/.test(s)) return null
  const terms = s.replace(/-/g, '+-').split('+').filter(Boolean)
  let a = 0
  let b = 0
  let c = 0
  for (const term of terms) {
    if (term.includes('x^2')) {
      const coef = term.replace('x^2', '')
      const value = coef === '' || coef === '+' ? 1 : coef === '-' ? -1 : Number(coef)
      if (!Number.isFinite(value)) return null
      a += value
    } else if (term.includes('x')) {
      const coef = term.replace('x', '')
      const value = coef === '' || coef === '+' ? 1 : coef === '-' ? -1 : Number(coef)
      if (!Number.isFinite(value)) return null
      b += value
    } else {
      const value = Number(term)
      if (!Number.isFinite(value)) return null
      c += value
    }
  }
  return { a, b, c }
}

function matchesPoly(response, a, b, c, tol = 0.05) {
  const parsed = parseQuadratic(response)
  return Boolean(parsed && close(parsed.a, a, tol) && close(parsed.b, b, tol) && close(parsed.c, c, tol))
}

const NOTE =
  'This test scales in difficulty as the questions progress. At the beginning, the questions will test foundational concepts. Near the end, there will be difficult extension questions that test deep understanding and your ability to connect multiple concepts together. These final questions may extend past the difficulty required for the AP exam; therefore, do not be discouraged if you are unable to solve them.'

export const UNIT1_TOPICS_11_12 = {
  id: 'ap-precal-unit-1-11-12',
  title: 'AP Precalculus — Topics 1.11–1.12',
  subtitle: 'Equivalent representations and transformations',
  totalPoints: 45,
  questionCount: 40,
  note: NOTE,
  instructions: [
    '40 questions · 45 points total · one question at a time.',
    'No calculator on questions 1–16. A graphing calculator is allowed on questions 17–40.',
    'Use Check answer for feedback on the current item.',
    'Submit on question 40 when you are ready to score the full assessment.',
    'Multipart items earn half credit when at least half of the parts are correct. Questions 36–40 are worth 2 points.',
  ],
  questions: [
    {
      id: 1,
      points: 1,
      topic: 'Equivalent forms',
      type: 'text',
      prompt: 'Rewrite f(x) = (2x − 1)(x + 4) in standard form.',
      answer: '2x^2+7x-4',
      check: (response) => matchesPoly(response, 2, 7, -4, 0),
      feedbackWrong: 'f(x) = 2x² + 7x − 4.',
    },
    {
      id: 2,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'Factor p(x) = x³ − 9x completely.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Factored form',
          answer: 'x(x-3)(x+3)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === 'x(x-3)(x+3)' || s === 'x(x+3)(x-3)'
          },
          feedbackWrong: 'p(x) = x(x − 3)(x + 3).',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Zeros',
          answer: '0, 3, -3',
          check: (response) => sameNumberSet(response, [0, 3, -3], 0),
        },
      ],
    },
    {
      id: 3,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'Expand (x + 1)⁴ using Pascal’s Triangle.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Row 4 of Pascal’s Triangle',
          answer: '1, 4, 6, 4, 1',
          check: (response) => numsInOrder(response, [1, 4, 6, 4, 1], 0) || sameText(response, '14641'),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Expanded form',
          answer: 'x^4+4x^3+6x^2+4x+1',
          check: (response) => sameText(cleanExpr(response), 'x^4+4x^3+6x^2+4x+1'),
          feedbackWrong: 'x⁴ + 4x³ + 6x² + 4x + 1.',
        },
      ],
    },
    {
      id: 4,
      points: 1,
      topic: 'Equivalent forms',
      type: 'mc',
      prompt: 'For x ≠ 2, which expression is equivalent to (x² − 4)/(x − 2)?',
      choices: ['x − 2', 'x + 2', 'x² − 2', 'x + 4'],
      answer: 'B',
    },
    {
      id: 5,
      points: 1,
      topic: 'Transformations',
      type: 'mc',
      prompt: 'How is the graph of g(x) = f(x − 3) + 2 obtained from the graph of f?',
      choices: [
        'Shift right 3 units and up 2 units',
        'Shift left 3 units and up 2 units',
        'Shift right 3 units and down 2 units',
        'Shift left 3 units and down 2 units',
      ],
      answer: 'A',
    },
    {
      id: 6,
      points: 1,
      topic: 'Transformations',
      type: 'mc',
      prompt: 'The graph of g(x) = −f(x) is obtained from the graph of f by',
      choices: ['a reflection over the x-axis', 'a reflection over the y-axis', 'a shift down 1 unit', 'a horizontal compression'],
      answer: 'A',
    },
    {
      id: 7,
      points: 1,
      topic: 'Transformations',
      type: 'text',
      prompt: 'Let f(x) = x². Write g(x) if the graph of f is stretched vertically by 3 and then shifted 1 unit left.',
      answer: '3(x+1)^2',
      check: (response) => sameText(cleanExpr(response), '3(x+1)^2') || matchesPoly(response, 3, 6, 3, 0),
      feedbackWrong: 'g(x) = 3(x + 1)².',
    },
    {
      id: 8,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'The point (4, −2) is on the graph of f. Give the corresponding point on each graph.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'g(x) = f(x) + 5',
          answer: '(4, 3)',
          check: (response) => sameText(response, '(4, 3)'),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'h(x) = f(x + 1)',
          answer: '(3, -2)',
          check: (response) => sameText(response, '(3, -2)'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'k(x) = 2f(x)',
          answer: '(4, -4)',
          check: (response) => sameText(response, '(4, -4)'),
        },
      ],
    },
    {
      id: 9,
      points: 1,
      topic: 'Equivalent forms',
      type: 'text',
      prompt: 'Rewrite (x² + 5x + 7)/(x + 2) in the form q(x) + r/(x + 2).',
      answer: 'x+3+1/(x+2)',
      check: (response) => sameText(cleanExpr(response), 'x+3+1/(x+2)'),
      feedbackWrong: 'x + 3 + 1/(x + 2).',
    },
    {
      id: 10,
      points: 1,
      topic: 'Equivalent forms',
      type: 'numeric',
      prompt: 'Find the coefficient of x² in the expansion of (x + 2)⁵.',
      answer: 80,
      tolerance: 0,
    },
    {
      id: 11,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'f(x) = x² − 6x + 5.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Factored form',
          answer: '(x-1)(x-5)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '(x-1)(x-5)' || s === '(x-5)(x-1)'
          },
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Vertex form',
          answer: '(x-3)^2-4',
          check: (response) => sameText(cleanExpr(response), '(x-3)^2-4'),
          feedbackWrong: '(x − 3)² − 4.',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Which feature does each form show most directly?',
          choices: [
            'Standard form shows the y-intercept; factored form shows the zeros; vertex form shows the vertex',
            'Standard form shows the zeros; factored form shows the vertex; vertex form shows the y-intercept',
            'All three forms show only the y-intercept',
            'Vertex form shows the zeros, and factored form shows the vertex',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 12,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'Rewrite (3x + 5)/(x + 1) in the form a + b/(x + 1).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Rewritten form',
          answer: '3+2/(x+1)',
          check: (response) => sameText(cleanExpr(response), '3+2/(x+1)'),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Horizontal asymptote',
          answer: 'y=3',
          accept: ['3'],
          check: (response) => sameText(response, 'y=3') || sameText(response, '3'),
        },
      ],
    },
    {
      id: 13,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'The point (6, 4) is on the graph of f.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Corresponding point on g(x) = f(2x)',
          answer: '(3, 4)',
          check: (response) => sameText(response, '(3, 4)'),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'The change from f to g(x) = f(2x) is a',
          choices: [
            'horizontal compression by a factor of 1/2',
            'horizontal stretch by a factor of 2',
            'vertical stretch by a factor of 2',
            'shift left 2 units',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Corresponding point on h(x) = f(x/3)',
          answer: '(18, 4)',
          check: (response) => sameText(response, '(18, 4)'),
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'The change from f to h(x) = f(x/3) is a',
          choices: [
            'horizontal stretch by a factor of 3',
            'horizontal compression by a factor of 1/3',
            'vertical stretch by a factor of 3',
            'shift right 3 units',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 14,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'f has domain [−2, 4] and range [0, 6].',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Domain of g(x) = f(x − 1) + 3',
          answer: '[-1, 5]',
          check: (response) => sameText(response, '[-1, 5]'),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Range of g',
          answer: '[3, 9]',
          check: (response) => sameText(response, '[3, 9]'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Domain of h(x) = −2f(x)',
          answer: '[-2, 4]',
          check: (response) => sameText(response, '[-2, 4]'),
        },
        {
          label: 'd',
          type: 'text',
          prompt: 'Range of h',
          answer: '[-12, 0]',
          check: (response) => sameText(response, '[-12, 0]'),
        },
      ],
    },
    {
      id: 15,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'f has values 5, 2, 1, 2, 5 at x = −2, −1, 0, 1, 2. Let g(x) = f(x) − 3 and h(x) = f(−x).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Values of g, in order',
          answer: '2, -1, -2, -1, 2',
          check: (response) => numsInOrder(response, [2, -1, -2, -1, 2], 0),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Values of h, in order',
          answer: '5, 2, 1, 2, 5',
          check: (response) => numsInOrder(response, [5, 2, 1, 2, 5], 0),
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Why does h have the same values as f?',
          choices: [
            'f is even, so f(−x) = f(x)',
            'f is odd, so f(−x) = −f(x)',
            'Subtracting 3 does not change the outputs',
            'h shifts every input by 1',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 16,
      points: 1,
      topic: 'Transformations',
      type: 'mc',
      prompt: 'Which order maps the graph of f onto g(x) = −2f(x + 4) − 1?',
      choices: [
        'Shift left 4, stretch vertically by 2, reflect over the x-axis, then shift down 1',
        'Shift right 4, stretch vertically by 2, reflect over the y-axis, then shift up 1',
        'Shift down 1 first, then reflect, then shift left 4',
        'Shift left 4, then shift down 1, with no reflection',
      ],
      answer: 'A',
    },
    {
      id: 17,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'Divide (2x³ − 3x² + 4x − 5) by (x − 2). A graphing calculator is allowed from this question on.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Quotient',
          answer: '2x^2+x+6',
          check: (response) => matchesPoly(response, 2, 1, 6, 0),
          feedbackWrong: 'The quotient is 2x² + x + 6.',
        },
        { label: 'b', type: 'numeric', prompt: 'Remainder', answer: 7, tolerance: 0 },
        { label: 'c', type: 'numeric', prompt: 'Check: f(2)', answer: 7, tolerance: 0 },
      ],
    },
    {
      id: 18,
      points: 1,
      topic: 'Equivalent forms',
      type: 'text',
      prompt: 'Expand (2x − 1)⁴ completely.',
      answer: '16x^4-32x^3+24x^2-8x+1',
      check: (response) => sameText(cleanExpr(response), '16x^4-32x^3+24x^2-8x+1'),
      feedbackWrong: '16x⁴ − 32x³ + 24x² − 8x + 1.',
    },
    {
      id: 19,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'Rewrite r(x) = (x² + x − 6)/(x − 1).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'r(x) as a polynomial plus a proper fraction',
          answer: 'x+2-4/(x-1)',
          check: (response) => sameText(cleanExpr(response), 'x+2-4/(x-1)'),
          feedbackWrong: 'r(x) = x + 2 − 4/(x − 1).',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Slant asymptote',
          answer: 'y=x+2',
          check: (response) => sameText(response, 'y=x+2') || sameText(response, 'x+2'),
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'How does the rewritten form show the end behavior?',
          choices: [
            '−4/(x − 1) approaches 0 as |x| grows, so r behaves like x + 2',
            'The remainder forces a horizontal asymptote y = −4',
            'The graph approaches y = 0',
            'The quotient is constant, so the ends are horizontal',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 20,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'f(x) = 2x³ − 2x² − 12x.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Factored form',
          answer: '2x(x-3)(x+2)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '2x(x-3)(x+2)' || s === '2x(x+2)(x-3)'
          },
          feedbackWrong: '2x(x − 3)(x + 2).',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Zeros',
          answer: '0, 3, -2',
          check: (response) => sameNumberSet(response, [0, 3, -2], 0),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Intervals where f(x) > 0',
          answer: '(-2, 0) U (3, inf)',
          check: (response) => sameText(response, '(-2, 0) U (3, inf)'),
          feedbackWrong: '(−2, 0) ∪ (3, ∞).',
        },
      ],
    },
    {
      id: 21,
      points: 1,
      topic: 'Transformations',
      type: 'text',
      prompt: 'g is a transformation of f(x) = x³. Its inflection point is (2, −1) and it passes through (3, 1). Write g in the form a(x − h)³ + k.',
      answer: '2(x-2)^3-1',
      check: (response) => sameText(cleanExpr(response), '2(x-2)^3-1'),
      feedbackWrong: 'g(x) = 2(x − 2)³ − 1.',
    },
    {
      id: 22,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'Let g(x) = f(3x − 6).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Rewrite g in the form f(b(x − h))',
          answer: 'f(3(x-2))',
          check: (response) => sameText(cleanExpr(response), 'f(3(x-2))'),
          feedbackWrong: 'f(3(x − 2)).',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'The transformations, in order, are',
          choices: [
            'a horizontal compression by 1/3, then a shift right 2',
            'a horizontal stretch by 3, then a shift left 6',
            'a shift left 6, then a vertical stretch by 3',
            'a shift right 6, then a compression by 3',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'If (6, 5) is on f, the corresponding point on g is',
          answer: '(4, 5)',
          check: (response) => sameText(response, '(4, 5)'),
        },
      ],
    },
    {
      id: 23,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'T(t) is the temperature in City A, in °F, t hours after midnight. City B is always 5°F warmer than City A was 2 hours earlier.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'B(t) in terms of T',
          answer: 'T(t-2)+5',
          check: (response) => sameText(cleanExpr(response), 't(t-2)+5'),
          feedbackWrong: 'B(t) = T(t − 2) + 5.',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Compared with the graph of T, the graph of B is',
          choices: [
            'shifted right 2 units and up 5 units',
            'shifted left 2 units and up 5 units',
            'shifted right 5 units and up 2 units',
            'reflected over the t-axis',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 24,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'A polynomial f has zeros at x = −3, 1, and 4.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Zeros of g(x) = f(x + 2)',
          answer: '-5, -1, 2',
          check: (response) => sameNumberSet(response, [-5, -1, 2], 0),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Zeros of h(x) = f(2x)',
          answer: '-1.5, 0.5, 2',
          check: (response) => sameNumberSet(response, [-1.5, 0.5, 2], 0.001),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Zeros of k(x) = 3f(x)',
          answer: '-3, 1, 4',
          check: (response) => sameNumberSet(response, [-3, 1, 4], 0),
        },
      ],
    },
    {
      id: 25,
      points: 1,
      topic: 'Equivalent forms',
      type: 'text',
      prompt: 'Find the term containing x⁴ in the expansion of (x² − 3)⁵.',
      answer: '-270x^4',
      check: (response) => sameText(cleanExpr(response), '-270x^4'),
      feedbackWrong: '−270x⁴.',
    },
    {
      id: 26,
      points: 1,
      topic: 'Equivalent forms',
      type: 'mc',
      prompt: '(x³ − 1)/(x − 1) equals x² + x + 1 for x ≠ 1. How do the graphs differ?',
      choices: [
        'They match except for a hole at (1, 3) on the rational graph',
        'They differ by a vertical asymptote at x = 1',
        'They are the same at every point, including x = 1',
        'The rational graph is shifted up 3 units',
      ],
      answer: 'A',
    },
    {
      id: 27,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'Rewrite r(x) = (2x² + 3x − 1)/(x² + 1) in the form a + (bx + c)/(x² + 1).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Rewritten form',
          answer: '2+(3x-3)/(x^2+1)',
          check: (response) => sameText(cleanExpr(response), '2+(3x-3)/(x^2+1)'),
          feedbackWrong: '2 + (3x − 3)/(x² + 1).',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Horizontal asymptote',
          answer: 'y=2',
          check: (response) => sameText(response, 'y=2') || sameText(response, '2'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Where the graph crosses that asymptote, as an ordered pair',
          answer: '(1, 2)',
          check: (response) => sameText(response, '(1, 2)'),
          feedbackWrong: 'It crosses at (1, 2).',
        },
      ],
    },
    {
      id: 28,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'f(x) = −(x + 1)(x − 3) has a maximum at (1, 4). Let g(x) = −f(x − 2) + 1.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Vertex of g',
          answer: '(3, -3)',
          check: (response) => sameText(response, '(3, -3)'),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'That vertex is a',
          choices: ['minimum', 'maximum'],
          answer: 'A',
        },
        { label: 'c', type: 'numeric', prompt: 'y-intercept of g', answer: 6, tolerance: 0 },
        {
          label: 'd',
          type: 'mc',
          prompt: 'End behavior of g',
          choices: [
            'g goes to ∞ as x goes to either infinity',
            'g goes to −∞ as x goes to either infinity',
            'The left end goes up and the right end goes down',
            'The left end goes down and the right end goes up',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 29,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'Let f(x) = 1/x and g(x) = 3/(x − 2) + 1.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'The transformations from f to g are',
          choices: [
            'a vertical stretch by 3, a shift right 2, and a shift up 1',
            'a shift left 2, a stretch by 3, and a shift down 1',
            'a horizontal stretch by 3 and a shift up 2',
            'a reflection and a shift right 1',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Vertical asymptote',
          answer: 'x=2',
          check: (response) => sameText(response, 'x=2') || sameText(response, '2'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Horizontal asymptote',
          answer: 'y=1',
          check: (response) => sameText(response, 'y=1') || sameText(response, '1'),
        },
        {
          label: 'd',
          type: 'text',
          prompt: 'g as a single rational expression',
          answer: '(x+1)/(x-2)',
          check: (response) => sameText(cleanExpr(response), '(x+1)/(x-2)'),
          feedbackWrong: 'g(x) = (x + 1)/(x − 2).',
        },
      ],
    },
    {
      id: 30,
      points: 1,
      topic: 'Transformations',
      type: 'multipart',
      prompt: 'The function f is even.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Is g(x) = f(x) + 3 even?',
          choices: [
            'Yes. g(−x) = f(−x) + 3 = f(x) + 3 = g(x).',
            'No. Adding 3 destroys the symmetry.',
            'Yes, but only if f(0) = 0.',
            'No. g is odd.',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'The graph of h(x) = f(x − 3) is symmetric about',
          choices: ['the line x = 3', 'the y-axis', 'the line y = 3', 'the origin'],
          answer: 'A',
        },
      ],
    },
    {
      id: 31,
      points: 1,
      topic: 'Equivalent forms',
      type: 'multipart',
      prompt: 'Divide x⁴ − 1 by x² + 1, then factor x⁴ − 1 completely over the real numbers.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Quotient',
          answer: 'x^2-1',
          check: (response) => matchesPoly(response, 1, 0, -1, 0),
          feedbackWrong: 'The quotient is x² − 1.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Complete factorization',
          answer: '(x-1)(x+1)(x^2+1)',
          check: (response) => {
            const s = cleanExpr(response)
            return (
              s === '(x-1)(x+1)(x^2+1)' ||
              s === '(x+1)(x-1)(x^2+1)' ||
              s === '(x^2-1)(x^2+1)'
            )
          },
          feedbackWrong: '(x − 1)(x + 1)(x² + 1).',
        },
      ],
    },
    {
      id: 32,
      points: 1,
      topic: 'Vertex form',
      extension: true,
      type: 'multipart',
      prompt: 'Let f(x) = x² − 4x + 7.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Vertex form',
          answer: '(x-2)^2+3',
          check: (response) => sameText(cleanExpr(response), '(x-2)^2+3'),
          feedbackWrong: '(x − 2)² + 3.',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'As a transformation of y = x², f is',
          choices: [
            'shifted right 2 and up 3',
            'shifted left 2 and up 7',
            'shifted right 4 and up 7',
            'reflected and shifted up 3',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Range of f',
          answer: '[3, inf)',
          check: (response) => sameText(response, '[3, inf)'),
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'Why does f have no real zeros?',
          choices: [
            'Its minimum value is 3, which is above the x-axis',
            'Its vertex is on the x-axis',
            'The leading coefficient is negative',
            'It is an odd function',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 33,
      points: 1,
      topic: 'Rational form',
      extension: true,
      type: 'multipart',
      prompt: 'Let g(x) = (2x + 1)/(x − 3).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Rewrite g as a + b/(x − h)',
          answer: '2+7/(x-3)',
          check: (response) => sameText(cleanExpr(response), '2+7/(x-3)'),
          feedbackWrong: '2 + 7/(x − 3).',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'As a transformation of y = 1/x, g is',
          choices: [
            'stretched vertically by 7, shifted right 3, and shifted up 2',
            'shifted left 3 and up 7',
            'stretched by 2 and shifted down 3',
            'reflected over the y-axis',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Vertical asymptote',
          answer: 'x=3',
          check: (response) => sameText(response, 'x=3') || sameText(response, '3'),
        },
        {
          label: 'd',
          type: 'text',
          prompt: 'Horizontal asymptote',
          answer: 'y=2',
          check: (response) => sameText(response, 'y=2') || sameText(response, '2'),
        },
      ],
    },
    {
      id: 34,
      points: 1,
      topic: 'Binomial expansion',
      extension: true,
      type: 'multipart',
      prompt: 'Let g(x) = (x − 1)³ + 2.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Standard form',
          answer: 'x^3-3x^2+3x+1',
          check: (response) => sameText(cleanExpr(response), 'x^3-3x^2+3x+1'),
          feedbackWrong: 'x³ − 3x² + 3x + 1.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Point of inflection',
          answer: '(1, 2)',
          check: (response) => sameText(response, '(1, 2)'),
        },
      ],
    },
    {
      id: 35,
      points: 1,
      topic: 'Shifted extrema',
      extension: true,
      type: 'multipart',
      prompt: 'f(x) = x³ − 3x has a local maximum at (−1, 2) and a local minimum at (1, −2). Let g(x) = f(x − 1).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'g in standard form',
          answer: 'x^3-3x^2+2',
          check: (response) => sameText(cleanExpr(response), 'x^3-3x^2+2'),
          feedbackWrong: 'g(x) = x³ − 3x² + 2.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Local maximum of g',
          answer: '(0, 2)',
          check: (response) => sameText(response, '(0, 2)'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Local minimum of g',
          answer: '(2, -2)',
          check: (response) => sameText(response, '(2, -2)'),
        },
      ],
    },
    {
      id: 36,
      points: 2,
      topic: 'Identify a transformation',
      extension: true,
      type: 'multipart',
      prompt:
        'f(x) = 1, 3, 7, 13, 21 at x = 0, 1, 2, 3, 4. g(x) = 5, 9, 17, 29, 45 at x = 1, 2, 3, 4, 5. Also, f(x) = x² + x + 1, and g(x) = a·f(x − h) + k.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'a', answer: 2, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'h', answer: 1, tolerance: 0 },
        { label: 'c', type: 'numeric', prompt: 'k', answer: 3, tolerance: 0 },
        {
          label: 'd',
          type: 'text',
          prompt: 'g in standard form',
          answer: '2x^2-2x+5',
          check: (response) => matchesPoly(response, 2, -2, 5, 0),
          feedbackWrong: 'g(x) = 2x² − 2x + 5.',
        },
      ],
    },
    {
      id: 37,
      points: 2,
      topic: 'Rational rewriting',
      extension: true,
      type: 'multipart',
      prompt: 'Let r(x) = (x² + 2x + 3)/(x + 1).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'r(x) as a polynomial plus a proper rational expression',
          answer: 'x+1+2/(x+1)',
          check: (response) => sameText(cleanExpr(response), 'x+1+2/(x+1)'),
          feedbackWrong: 'x + 1 + 2/(x + 1).',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Vertical asymptote',
          answer: 'x=-1',
          check: (response) => sameText(response, 'x=-1') || sameText(response, '-1'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Slant asymptote',
          answer: 'y=x+1',
          check: (response) => sameText(response, 'y=x+1') || sameText(response, 'x+1'),
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'For x > −1, the graph of r is',
          choices: [
            'above the slant asymptote, because 2/(x + 1) is positive',
            'below the slant asymptote, because the remainder is negative',
            'on the slant asymptote',
            'below it, because the denominator is negative',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 38,
      points: 2,
      topic: 'Transformation statements',
      extension: true,
      type: 'multipart',
      prompt: 'Decide whether each statement is true or false.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'For any f, shifting horizontally by h and then adding k gives the same graph as adding k first and then replacing x with x − h.',
          choices: ['True', 'False'],
          answer: 'A',
          feedbackCorrect: 'Both result in f(x − h) + k. Horizontal and vertical shifts act on different variables.',
          feedbackWrong: 'True. Both produce f(x − h) + k.',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: '2f(x) + 3 and 2(f(x) + 3) are always the same function.',
          choices: ['True', 'False'],
          answer: 'B',
          feedbackCorrect: 'False. For f(x) = x, 2x + 3 is not 2x + 6.',
          feedbackWrong: 'False. For f(x) = x, 2x + 3 is not 2x + 6.',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'If f is a polynomial of degree n and b ≠ 0, then f(bx) is also a polynomial of degree n.',
          choices: ['True', 'False'],
          answer: 'A',
          feedbackCorrect: 'The leading term a(bx)ⁿ = abⁿxⁿ still has degree n.',
          feedbackWrong: 'True. The leading term abⁿxⁿ still has degree n.',
        },
      ],
    },
    {
      id: 39,
      points: 2,
      topic: 'Build a transformation',
      extension: true,
      type: 'multipart',
      prompt: 'Build a transformation of f(x) = x³ with its inflection point at (−1, 4) that passes through (0, 2).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'g(x) in the form a(x − h)³ + k',
          answer: '-2(x+1)^3+4',
          check: (response) => sameText(cleanExpr(response), '-2(x+1)^3+4') || sameText(cleanExpr(response), '-2(x-(-1))^3+4'),
          feedbackWrong: 'g(x) = −2(x + 1)³ + 4.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Standard form',
          answer: '-2x^3-6x^2-6x+2',
          check: (response) => sameText(cleanExpr(response), '-2x^3-6x^2-6x+2'),
          feedbackWrong: '−2x³ − 6x² − 6x + 2.',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'The transformations from f to g are',
          choices: [
            'shift left 1, stretch vertically by 2, reflect over the x-axis, and shift up 4',
            'shift right 1, stretch by 2, and shift up 4',
            'shift left 4, reflect over the y-axis, and stretch by 2',
            'shift up 4 only',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 40,
      points: 2,
      topic: 'Binomial rate of change',
      extension: true,
      type: 'multipart',
      prompt: 'Let f(x) = x⁴.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Expansion of (x + h)⁴',
          answer: 'x^4+4x^3h+6x^2h^2+4xh^3+h^4',
          check: (response) => sameText(cleanExpr(response), 'x^4+4x^3h+6x^2h^2+4xh^3+h^4'),
          feedbackWrong: 'x⁴ + 4x³h + 6x²h² + 4xh³ + h⁴.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Simplified average rate of change of f on [x, x + h]',
          answer: '4x^3+6x^2h+4xh^2+h^3',
          check: (response) => sameText(cleanExpr(response), '4x^3+6x^2h+4xh^2+h^3'),
          feedbackWrong: '4x³ + 6x²h + 4xh² + h³.',
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'That expression at x = 1 and h = 0.01',
          answer: 4.060401,
          tolerance: 0.00001,
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Estimate of the rate of change of f at x = 1',
          answer: 4,
          tolerance: 0.05,
        },
      ],
    },
  ],
}

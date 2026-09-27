/**
 * AP Precalculus Unit 1, topics 1.1–1.3.
 * 40 questions, 45 points. Sketch prompts from the printed test are omitted.
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

function sameText(response, expected) {
  const norm = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/∞/g, 'inf')
      .replace(/infinity/g, 'inf')
      .replace(/\s+/g, '')
  return norm(response) === norm(expected)
}

function parseQuadratic(raw) {
  let s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/²/g, '^2')
    .replace(/\s+/g, '')
    .replace(/[·*]/g, '')
  s = s.replace(/^[a-z]\([a-z]\)=/, '')
  s = s.replace(/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/g, (_, num, den) => String(Number(num) / Number(den)))
  s = s.replace(/[tw]/g, 'x')
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

export const UNIT1_TOPICS_13 = {
  id: 'ap-precal-unit-1-1-3',
  title: 'AP Precalculus — Topics 1.1–1.3',
  subtitle: 'Change in tandem and rates of change',
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
      topic: 'Change in tandem',
      type: 'multipart',
      prompt:
        'A table gives x = −2, −1, 0, 1, 2, 3 and f(x) = 7, 2, −1, −2, −1, 2. Describe how the outputs change as the inputs increase.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Interval where f appears decreasing',
          answer: '[-2, 1]',
          check: (response) => sameText(response, '[-2, 1]'),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Interval where f appears increasing',
          answer: '[1, 3]',
          check: (response) => sameText(response, '[1, 3]'),
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Least output value in the table',
          answer: -2,
          tolerance: 0,
          answerDisplay: '−2',
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'x-value of that least output',
          answer: 1,
          tolerance: 0,
        },
      ],
    },
    {
      id: 2,
      points: 1,
      topic: 'Change in tandem',
      type: 'mc',
      prompt: 'As input values increase, output values decrease. Which term BEST describes the function?',
      choices: ['Increasing', 'Decreasing', 'Concave up', 'Concave down'],
      answer: 'B',
    },
    {
      id: 3,
      points: 1,
      topic: 'Change in tandem',
      type: 'multipart',
      prompt:
        'The graph of f passes through (−2, 5), (0, 1), (3, 1), and (5, 6). f is decreasing on [−2, 1] and increasing on [1, 5].',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'x-value where the least value of f on [−2, 5] occurs',
          answer: 1,
          tolerance: 0,
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'How does f(4) compare with f(3)?',
          choices: [
            'Greater, because f is increasing on [1, 5]',
            'Less, because f is decreasing on [1, 5]',
            'Equal, because both points are above the x-axis',
            'Greater, because f is concave up',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 4,
      points: 1,
      topic: 'Rates of change',
      type: 'numeric',
      prompt: 'Find the average rate of change of f(x) = x² + 3 on [1, 4].',
      answer: 5,
      tolerance: 0,
    },
    {
      id: 5,
      points: 1,
      topic: 'Rates of change',
      type: 'multipart',
      prompt: 'V(t) is gallons of water in a tank t minutes after a valve opens. V(2) = 40 and V(10) = 8.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Average rate of change of V on [2, 10], in gallons per minute',
          answer: -4,
          tolerance: 0,
          answerDisplay: '−4 gal/min',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'What does that rate mean?',
          choices: [
            'From minute 2 to minute 10, the water decreased by an average of 4 gallons per minute.',
            'The tank gained 4 gallons every minute.',
            'The tank contained 4 gallons at minute 10.',
            'The water level did not change.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 6,
      points: 1,
      topic: 'Rates of change',
      type: 'mc',
      prompt: 'The average rate of change of f on [a, b] equals the slope of',
      choices: [
        'the tangent line at x = a',
        'the secant line through (a, f(a)) and (b, f(b))',
        'a horizontal line',
        'the line through the origin and (b, f(b))',
      ],
      answer: 'B',
    },
    {
      id: 7,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'A table gives x = 0, 2, 4, 6 and g(x) = 5, 11, 17, 23.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Is the rate of change of g constant?',
          choices: [
            'Yes. The outputs rise by 6 every 2 units, so the rate is 3.',
            'No. The outputs increase, so the rate is not constant.',
            'Yes. The rate is 6 on every interval.',
            'No. The rate changes by 2 each time.',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Equation for g, in the form ax + b',
          answer: '3x+5',
          check: (response) => matchesPoly(response, 0, 3, 5, 0),
          feedbackWrong: 'g(x) = 3x + 5.',
        },
      ],
    },
    {
      id: 8,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'mc',
      prompt: 'For a linear function, the average rate of change over any interval is',
      choices: ['always zero', 'constant', 'increasing', 'sometimes positive and sometimes negative on every linear function'],
      answer: 'B',
    },
    {
      id: 9,
      points: 1,
      topic: 'Change in tandem',
      type: 'multipart',
      prompt: 'A table gives x = 0, 1, 2, 3, 4, 5 and g(x) = 1, 4, 6, 7, 7.5, 7.7.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Average rates of change over each interval of length 1, in order',
          answer: '3, 2, 1, 0.5, 0.2',
          check: (response) => numsInOrder(response, [3, 2, 1, 0.5, 0.2]),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'On [0, 5], g is',
          choices: ['increasing', 'decreasing'],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'The graph of g is',
          choices: [
            'concave down, because the rates are positive but decreasing',
            'concave up, because the outputs are increasing',
            'linear, because every rate is positive',
            'concave up, because the rates are decreasing',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 10,
      points: 1,
      topic: 'Change in tandem',
      type: 'multipart',
      prompt:
        'A cone-shaped cup, point down, is filled with water at a constant rate. Let h be the height of the water as a function of time.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'h is',
          choices: ['increasing', 'decreasing'],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'The rate at which h changes is',
          choices: [
            'decreasing, because the cup widens and each unit of water raises the level less',
            'increasing, because water is added at a constant rate',
            'constant, because the fill rate is constant',
            'decreasing, because the cup is getting narrower',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'The graph of h is',
          choices: ['concave down', 'concave up'],
          answer: 'A',
        },
      ],
    },
    {
      id: 11,
      points: 1,
      topic: 'Rates of change',
      type: 'multipart',
      prompt: 'Estimate the rate of change of f(x) = x² at x = 3.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Average rate of change on [2.9, 3]',
          answer: 5.9,
          tolerance: 0.02,
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Average rate of change on [3, 3.1]',
          answer: 6.1,
          tolerance: 0.02,
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Estimate of the rate of change at x = 3',
          answer: 6,
          tolerance: 0.15,
        },
      ],
    },
    {
      id: 12,
      points: 1,
      topic: 'Rates of change',
      type: 'numeric',
      prompt: 'The average rate of change of f on [2, 6] is −3, and f(2) = 10. Find f(6).',
      answer: -2,
      tolerance: 0,
      answerDisplay: '−2',
    },
    {
      id: 13,
      points: 1,
      topic: 'Rates of change',
      type: 'multipart',
      prompt:
        'Temperature T(h) in °F, h hours after midnight: h = 6, 9, 12, 15, 18 and T = 52, 61, 70, 68, 58.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Average rate of change of T on [6, 12], in °F per hour',
          answer: 3,
          tolerance: 0,
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Average rate of change of T on [12, 18], in °F per hour',
          answer: -2,
          tolerance: 0,
          answerDisplay: '−2',
        },
        {
          label: 'c',
          type: 'text',
          prompt: '3-hour interval with the fastest drop in temperature',
          answer: '[15, 18]',
          check: (response) => sameText(response, '[15, 18]'),
          feedbackWrong: '[15, 18], about −3.33 °F per hour.',
        },
      ],
    },
    {
      id: 14,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'A table gives x = 0, 1, 2, 3, 4 and f(x) = 3, 6, 11, 18, 27.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Average rates of change over consecutive intervals of length 1',
          answer: '3, 5, 7, 9',
          check: (response) => numsInOrder(response, [3, 5, 7, 9], 0),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'What do those rates suggest?',
          choices: [
            'They increase by a constant 2, so f is quadratic.',
            'They are constant, so f is linear.',
            'They double, so f is exponential.',
            'They change irregularly, so f is neither linear nor quadratic.',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Equation for f',
          answer: 'x^2+2x+3',
          check: (response) => matchesPoly(response, 1, 2, 3, 0),
          feedbackWrong: 'f(x) = x² + 2x + 3.',
        },
      ],
    },
    {
      id: 15,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt:
        'Classify each table. (a) x = 1, 2, 3, 4 and y = 4, 1, −2, −5. (b) x = 0, 1, 2, 3 and y = 2, 3, 6, 11. (c) x = 0, 1, 2, 3 and y = 1, 2, 4, 8.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Table (a)',
          choices: ['Linear, constant rate −3', 'Quadratic', 'Neither'],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Table (b)',
          choices: [
            'Quadratic; the rates 1, 3, 5 change by a constant 2',
            'Linear, constant rate 1',
            'Neither',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Table (c)',
          choices: [
            'Neither; the rates 1, 2, 4 do not change by a constant amount',
            'Linear',
            'Quadratic',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 16,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'A linear function f has f(2) = 7 and f(6) = 19.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'Rate of change of f', answer: 3, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'f(10)', answer: 31, tolerance: 0 },
        {
          label: 'c',
          type: 'text',
          prompt: 'Equation of f',
          answer: '3x+1',
          check: (response) => matchesPoly(response, 0, 3, 1, 0),
          feedbackWrong: 'f(x) = 3x + 1.',
        },
      ],
    },
    {
      id: 17,
      points: 1,
      topic: 'Change in tandem',
      type: 'multipart',
      prompt: 'An increasing function has x = 0 through 6 and p(x) = 2, 3, 6, 11, 14, 15, 16. A graphing calculator is allowed from this question on.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Interval of length 1 with the greatest average rate of change',
          answer: '[2, 3]',
          check: (response) => sameText(response, '[2, 3]'),
          feedbackWrong: '[2, 3], where the rate is 5.',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Where does p appear concave up and concave down?',
          choices: [
            'Concave up on about [0, 2.5], then concave down on about [2.5, 5]',
            'Concave down on [0, 6]',
            'Concave up on all of [0, 6]',
            'Concave down first, then concave up after x = 2.5',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Estimate the input where the concavity changes',
          answer: 2.5,
          tolerance: 0.25,
        },
      ],
    },
    {
      id: 18,
      points: 1,
      topic: 'Change in tandem',
      type: 'multipart',
      prompt:
        'A function f has f(0) = 2. It increases on (−∞, 1), decreases on (1, 4), and increases on (4, ∞). It is concave down on (−∞, 2.5) and concave up on (2.5, ∞).',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'x-value of the relative maximum', answer: 1, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'x-value of the relative minimum', answer: 4, tolerance: 0 },
        { label: 'c', type: 'numeric', prompt: 'x-value of the point of inflection', answer: 2.5, tolerance: 0 },
      ],
    },
    {
      id: 19,
      points: 1,
      topic: 'Change in tandem',
      type: 'multipart',
      prompt: 'State whether f is increasing or decreasing, and whether its graph is concave up or concave down.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'The rate of change is positive and increasing',
          choices: ['Increasing and concave up', 'Increasing and concave down', 'Decreasing and concave up', 'Decreasing and concave down'],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'The rate of change is negative and increasing',
          choices: ['Decreasing and concave up', 'Increasing and concave up', 'Decreasing and concave down', 'Increasing and concave down'],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'The rate of change is negative and decreasing',
          choices: ['Decreasing and concave down', 'Decreasing and concave up', 'Increasing and concave down', 'Increasing and concave up'],
          answer: 'A',
        },
      ],
    },
    {
      id: 20,
      points: 1,
      topic: 'Rates of change',
      type: 'multipart',
      prompt: 'A cyclist’s distance in meters is d(t) for t = 0, 10, 20, 30, 40: d = 0, 80, 200, 360, 480.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Average rate of change of d on [0, 40], in m/s',
          answer: 12,
          tolerance: 0,
        },
        {
          label: 'b',
          type: 'text',
          prompt: '10-second interval with the greatest average rate of change',
          answer: '[20, 30]',
          check: (response) => sameText(response, '[20, 30]'),
          feedbackWrong: '[20, 30], at 16 m/s.',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Is the cyclist’s speed increasing over all 40 seconds?',
          choices: [
            'No. The rates are 8, 12, 16, then 12 m/s, so the cyclist slows on [30, 40].',
            'Yes. The distance keeps increasing.',
            'Yes. Every 10-second rate is larger than the one before it.',
            'No. The distance returns to 0.',
          ],
          answer: 'A',
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Estimate of the rate of change of d at t = 25, in m/s',
          answer: 16,
          tolerance: 1,
        },
      ],
    },
    {
      id: 21,
      points: 1,
      topic: 'Rates of change',
      type: 'multipart',
      prompt: 'Use average rates of change to describe f(x) = 1/x for x > 0.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Average rate of change on [1, 3]',
          answer: -1 / 3,
          tolerance: 0.02,
          answerDisplay: '−1/3',
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Average rate of change on [3, 5]',
          answer: -1 / 15,
          tolerance: 0.01,
          answerDisplay: '−1/15',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'On these intervals, f is',
          choices: [
            'decreasing and concave up, because the rates are negative but increasing toward 0',
            'decreasing and concave down',
            'increasing and concave up',
            'increasing and concave down',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 22,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'Analyze f(x) = 2x² − 4x + 1.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Average rates of change on [0, 1], [1, 2], [2, 3], and [3, 4]',
          answer: '-2, 2, 6, 10',
          check: (response) => numsInOrder(response, [-2, 2, 6, 10], 0),
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'How much consecutive rates differ by',
          answer: 4,
          tolerance: 0,
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'How does that difference relate to the leading coefficient?',
          choices: [
            'On intervals of length 1, consecutive rates differ by 2a = 4.',
            'The difference equals the constant term.',
            'The difference equals a, so a = 4.',
            'There is no relation to the leading coefficient.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 23,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'Analyze g(x) = −x² + 6x.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Average rates of change on [0, 2], [2, 4], and [4, 6]',
          answer: '4, 0, -4',
          check: (response) => numsInOrder(response, [4, 0, -4], 0),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Concavity',
          choices: [
            'Concave down, because the rates decrease by a constant 4',
            'Concave up, because the rates decrease',
            'Neither, because one rate is 0',
            'Concave up, because a = −1',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Where does g change from increasing to decreasing?',
          choices: [
            'At the vertex x = 3, where the rates change from positive to negative',
            'At x = 0, the first rate',
            'At x = 6, the last point',
            'It never changes from increasing to decreasing',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 24,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'A table gives x = 0, 2, 4, 6, 8 and f(x) = 1, 5, 17, 37, 65.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Average rates of change over consecutive intervals of length 2',
          answer: '2, 6, 10, 14',
          check: (response) => numsInOrder(response, [2, 6, 10, 14], 0),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'What kind of function is f?',
          choices: [
            'Quadratic, because the rates change by a constant',
            'Linear, because the inputs are evenly spaced',
            'Neither',
            'Exponential, because the outputs grow',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Equation for f',
          answer: 'x^2+1',
          check: (response) => matchesPoly(response, 1, 0, 1, 0),
          feedbackWrong: 'f(x) = x² + 1.',
        },
      ],
    },
    {
      id: 25,
      points: 1,
      topic: 'Change in tandem',
      type: 'multipart',
      prompt:
        'Water is poured at a constant rate into a vase that is narrow at the bottom, widest in the middle, and narrow at the top. H(V) is the height as a function of the volume poured in.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'How does the rate at which the height increases change as the vase fills?',
          choices: [
            'It rises quickly at the narrow bottom, slowly at the wide middle, then quickly again at the narrow top.',
            'It rises at a constant rate.',
            'It rises slowly at first and then faster the whole way.',
            'It decreases for the entire fill.',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Concavity of H',
          choices: [
            'Concave down on the lower half and concave up on the upper half',
            'Concave up the whole time',
            'Concave down the whole time',
            'Linear, with no concavity',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Where is the point of inflection?',
          choices: [
            'At the widest part, where the height rises most slowly',
            'At the bottom of the vase',
            'When the vase is completely full',
            'There is no point of inflection',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 26,
      points: 1,
      topic: 'Rates of change',
      type: 'multipart',
      prompt: 'Let f(x) = x² − 5x.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Simplified average rate of change on [a, a + h], h ≠ 0',
          answer: '2a+h-5',
          accept: ['2a + h - 5', 'h+2a-5'],
          check: (response) => {
            const s = String(response).toLowerCase().replace(/\s+/g, '')
            return s === '2a+h-5' || s === 'h+2a-5' || s === '2a-5+h'
          },
          feedbackWrong: 'The simplified rate is 2a + h − 5.',
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Value of a for which the average rate of change on [a, a + 2] is 0',
          answer: 1.5,
          tolerance: 0.01,
        },
      ],
    },
    {
      id: 27,
      points: 1,
      topic: 'Rates of change',
      type: 'mc',
      prompt:
        'f is increasing and concave up for all x. f(2) = 5 and f(4) = 9. Which value could be f(6)? The rate on [2, 4] is 2, so the rate on [4, 6] must be greater than 2.',
      choices: ['11', '12', '13', '15'],
      answer: 'D',
      feedbackCorrect: 'f(6) must be greater than 9 + 2(2) = 13. Only 15 qualifies.',
      feedbackWrong: 'f(6) must be greater than 13. Only 15 qualifies.',
    },
    {
      id: 28,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'A quadratic q has q(0) = −2. Its average rate of change is 3 on [0, 1] and 7 on [1, 2].',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'q(1)', answer: 1, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'q(2)', answer: 8, tolerance: 0 },
        {
          label: 'c',
          type: 'text',
          prompt: 'q(x) in standard form',
          answer: '2x^2+x-2',
          check: (response) => matchesPoly(response, 2, 1, -2, 0),
          feedbackWrong: 'q(x) = 2x² + x − 2.',
        },
      ],
    },
    {
      id: 29,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'Let f(x) = ax² + bx + c with a ≠ 0.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'The average rate of change of f on [p, q] equals',
          choices: ['a(p + q) + b', 'a(q − p) + b', '2ax + b', 'c'],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Average rate of change of f(x) = 3x² − 2x + 7 on [1, 5]',
          answer: 16,
          tolerance: 0,
        },
      ],
    },
    {
      id: 30,
      points: 1,
      topic: 'Linear and quadratic rates',
      type: 'multipart',
      prompt: 'Museum visitors, in hundreds, during week t = 0, 1, 2, 3, 4 are N = 50, 58, 62, 62, 58.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Which model fits?',
          choices: [
            'Quadratic. The rates 8, 4, 0, −4 change by a constant −4.',
            'Linear, because the inputs are weeks.',
            'Neither, because the last value decreases.',
            'Exponential, because the values stay near 50.',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Equation for N(t)',
          answer: '-2t^2+10t+50',
          check: (response) => matchesPoly(response, -2, 10, 50, 0),
          feedbackWrong: 'N(t) = −2t² + 10t + 50.',
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Predicted N(5), in hundreds',
          answer: 50,
          tolerance: 0,
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Week t when the number of visitors is greatest',
          answer: 2.5,
          tolerance: 0.05,
        },
      ],
    },
    {
      id: 31,
      points: 1,
      topic: 'Rates of change',
      type: 'multipart',
      prompt: 'A function f is increasing and concave down on [0, 4].',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Which average rate of change is greater?',
          choices: [
            'The rate on [0, 2], because a concave-down function’s rate is decreasing',
            'The rate on [2, 4]',
            'They are equal',
            'Neither interval has a rate of change',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'For f(x) = √x, the average rate of change on [0, 2], rounded to 3 decimals',
          answer: 0.707,
          tolerance: 0.01,
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'For f(x) = √x, the average rate of change on [2, 4], rounded to 3 decimals',
          answer: 0.293,
          tolerance: 0.01,
        },
      ],
    },
    {
      id: 32,
      points: 1,
      topic: 'Medication concentration',
      extension: true,
      type: 'multipart',
      prompt:
        'Concentration C(t) in mg/L at hours t = 0, 1, 2, 3, 4, 5, 6 is C = 0, 4.0, 6.4, 7.2, 6.9, 6.1, 5.4.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Interval where C increases',
          answer: '[0, 3]',
          check: (response) => sameText(response, '[0, 3]'),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Interval where C decreases',
          answer: '[3, 6]',
          check: (response) => sameText(response, '[3, 6]'),
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Average rate of change on [3, 6], in mg/L per hour',
          answer: -0.6,
          tolerance: 0.02,
          answerDisplay: '−0.6 mg/L per hour',
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Approximate time when the concavity changes from down to up',
          answer: 5,
          tolerance: 0.5,
        },
      ],
    },
    {
      id: 33,
      points: 1,
      topic: 'Rates that build a quadratic',
      extension: true,
      type: 'multipart',
      prompt: 'f(0) = 0. The average rates of change on [0, 1], [1, 2], [2, 3], and [3, 4] are 5, 2, −1, and −4.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'f(1)', answer: 5, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'f(2)', answer: 7, tolerance: 0 },
        { label: 'c', type: 'numeric', prompt: 'f(3)', answer: 6, tolerance: 0 },
        { label: 'd', type: 'numeric', prompt: 'f(4)', answer: 2, tolerance: 0 },
        {
          label: 'e',
          type: 'mc',
          prompt: 'Increase, decrease, and concavity',
          choices: [
            'Increases on about [0, 2], then decreases; concave down because the rates decrease',
            'Decreases on [0, 4] and is concave up',
            'Increases on all of [0, 4] and is concave up',
            'Increases on [0, 2] and is concave up',
          ],
          answer: 'A',
        },
        {
          label: 'f',
          type: 'text',
          prompt: 'Quadratic equation for f',
          answer: '-1.5x^2+6.5x',
          accept: ['-3/2 x^2 + 13/2 x'],
          check: (response) => matchesPoly(response, -1.5, 6.5, 0, 0.02),
          feedbackWrong: 'f(x) = −1.5x² + 6.5x.',
        },
      ],
    },
    {
      id: 34,
      points: 1,
      topic: 'Rates of a cubic',
      extension: true,
      type: 'multipart',
      prompt: 'Let f(x) = x³.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Simplified average rate of change on [1, 1 + h]',
          answer: '3+3h+h^2',
          check: (response) => {
            const s = String(response).toLowerCase().replace(/\s+/g, '').replace(/²/g, '^2')
            return s === '3+3h+h^2' || s === 'h^2+3h+3' || s === '3h+h^2+3'
          },
          feedbackWrong: 'The simplified rate is 3 + 3h + h².',
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Value at h = 0.1',
          answer: 3.31,
          tolerance: 0.01,
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Value at h = 0.01',
          answer: 3.0301,
          tolerance: 0.001,
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Estimate of the rate of change of f at x = 1',
          answer: 3,
          tolerance: 0.05,
        },
      ],
    },
    {
      id: 35,
      points: 1,
      topic: 'Quadratic revenue',
      extension: true,
      type: 'multipart',
      prompt: 'A theater’s revenue when tickets cost p dollars is R(p) = p(100 − 2p).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Average rates of change of R on [10, 20], [20, 30], and [30, 40], in dollars per dollar of price',
          answer: '40, 0, -40',
          check: (response) => numsInOrder(response, [40, 0, -40], 0),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'What do the rates show?',
          choices: [
            'Rates change by a constant, so R is quadratic, and decreasing rates mean concave down.',
            'A zero rate means R is linear.',
            'Increasing revenue means concave up.',
            'The rates show R is exponential.',
          ],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Ticket price that maximizes revenue, in dollars',
          answer: 25,
          tolerance: 0,
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Maximum revenue, in dollars',
          answer: 1250,
          tolerance: 0,
        },
      ],
    },
    {
      id: 36,
      points: 2,
      topic: 'Quadratic motion',
      extension: true,
      type: 'multipart',
      prompt: 'A ball’s height in feet is h(t) = −16t² + 64t + 5.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Average rate of change on [0, 1], in ft/s',
          answer: 48,
          tolerance: 0,
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Average rate of change on [1, 3], in ft/s',
          answer: 0,
          tolerance: 0,
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'What does the rate on [1, 3] mean?',
          choices: [
            'The ball is at the same height at t = 1 and t = 3.',
            'The ball does not move between t = 1 and t = 3.',
            'The ball hits the ground at t = 3.',
            'The ball is at its maximum for the whole interval.',
          ],
          answer: 'A',
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'The rates on [0, 1], [1, 2], [2, 3], and [3, 4] are 48, 16, −16, and −48. Why do they change by the same amount?',
          choices: [
            'They drop by 32 each time, which is 2a for a = −16 on intervals of length 1.',
            'They drop because the constant term is 5.',
            'Equal changes mean the motion is linear.',
            'The rates are random.',
          ],
          answer: 'A',
        },
        {
          label: 'e',
          type: 'mc',
          prompt: 'The average rate on [1.9, 2.1] is about 0. What does that say?',
          choices: [
            'The ball is near its maximum height of 69 ft.',
            'The ball is on the ground.',
            'The ball is still speeding up.',
            'The height is 0 ft.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 37,
      points: 2,
      topic: 'Rectangle area',
      extension: true,
      type: 'multipart',
      prompt: 'A rectangle has a perimeter of 40 cm. Let w be its width in centimeters.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Area A(w)',
          answer: 'w(20-w)',
          accept: ['20w-w^2', '20w-w²'],
          check: (response) => matchesPoly(response, -1, 20, 0, 0) || sameText(response, 'w(20-w)'),
          feedbackWrong: 'A(w) = w(20 − w).',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Domain of w',
          answer: '0<w<20',
          accept: ['(0, 20)'],
          check: (response) => sameText(response, '(0, 20)') || sameText(response, '0<w<20'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Areas at w = 2, 4, 6, 8, 10, 12',
          answer: '36, 64, 84, 96, 100, 96',
          check: (response) => numsInOrder(response, [36, 64, 84, 96, 100, 96], 0),
        },
        {
          label: 'd',
          type: 'text',
          prompt: 'Average rates of change over each interval of length 2',
          answer: '14, 10, 6, 2, -2',
          check: (response) => numsInOrder(response, [14, 10, 6, 2, -2], 0),
        },
        {
          label: 'e',
          type: 'mc',
          prompt: 'How does A change as w increases?',
          choices: [
            'A increases on (0, 10), decreases on (10, 20), has a maximum of 100 cm² at w = 10, and is concave down.',
            'A increases on the whole domain.',
            'A is greatest at w = 2.',
            'A is concave up.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 38,
      points: 2,
      topic: 'Rate statements',
      extension: true,
      type: 'multipart',
      prompt: 'Decide whether each statement is true or false.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'If f is increasing on an interval, then its average rate of change on every subinterval is positive.',
          choices: ['True', 'False'],
          answer: 'A',
          feedbackCorrect: 'If a < b, then f(b) > f(a), so the rate is positive.',
          feedbackWrong: 'True. Increasing means f(b) > f(a) whenever a < b.',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'If the average rate of change of f on [a, b] is 0, then f is constant on [a, b].',
          choices: ['True', 'False'],
          answer: 'B',
          feedbackCorrect: 'False. f(x) = x² on [−1, 1] has rate 0 but is not constant.',
          feedbackWrong: 'False. f(x) = x² on [−1, 1] has rate 0 but is not constant.',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'If the graph of f is concave up on an interval, then f is increasing there.',
          choices: ['True', 'False'],
          answer: 'B',
          feedbackCorrect: 'False. f(x) = x² is concave up but decreasing on (−∞, 0).',
          feedbackWrong: 'False. f(x) = x² is concave up but decreasing on (−∞, 0).',
        },
      ],
    },
    {
      id: 39,
      points: 2,
      topic: 'Build a quadratic',
      extension: true,
      type: 'multipart',
      prompt: 'f(0) = 1. The average rate of change is 6 on [0, 2] and −2 on [2, 4].',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'f(x)',
          answer: '-2x^2+10x+1',
          check: (response) => matchesPoly(response, -2, 10, 1, 0),
          feedbackWrong: 'f(x) = −2x² + 10x + 1.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Interval where f is increasing',
          answer: '(-inf, 2.5)',
          accept: ['(-infinity, 2.5)', '(-∞, 2.5)'],
          check: (response) => sameText(response, '(-inf, 2.5)'),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Interval where f is decreasing',
          answer: '(2.5, inf)',
          accept: ['(2.5, infinity)', '(2.5, ∞)'],
          check: (response) => sameText(response, '(2.5, inf)'),
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Maximum value of f',
          answer: 13.5,
          tolerance: 0.05,
        },
      ],
    },
    {
      id: 40,
      points: 2,
      topic: 'Linear versus quadratic motion',
      extension: true,
      type: 'multipart',
      prompt: 'Two cars start at the same point when t = 0. A(t) = 30t and B(t) = 2t², with position in meters and t in seconds.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Average rate of change of A on [0, 10], in m/s',
          answer: 30,
          tolerance: 0,
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Average rate of change of B on [0, 10], in m/s',
          answer: 20,
          tolerance: 0,
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 't > 0 where the average rates of A and B on [0, t] are equal',
          answer: 15,
          tolerance: 0,
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'What is true at that time?',
          choices: [
            'The cars are at the same position.',
            'Car B stops.',
            'Car A turns around.',
            'Their speeds have been equal for the whole trip.',
          ],
          answer: 'A',
        },
        {
          label: 'e',
          type: 'numeric',
          prompt: 'Time, in seconds, when Car B’s speed equals Car A’s speed',
          answer: 7.5,
          tolerance: 0.1,
        },
        {
          label: 'f',
          type: 'mc',
          prompt: 'How does that time relate to the interval in part (c)?',
          choices: [
            '7.5 is the midpoint of [0, 15]. A quadratic’s rate at the midpoint equals its average rate on that interval.',
            '7.5 is twice 15.',
            'There is no relation.',
            '7.5 is the endpoint of the interval.',
          ],
          answer: 'A',
        },
      ],
    },
  ],
}

/**
 * AP Precalculus Unit 1, topics 1.13–1.14.
 * 40 questions, 45 points. The phone-plan sketch is not collected.
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

function cleanExpr(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/²/g, '^2')
    .replace(/\s+/g, '')
    .replace(/[·*]/g, '')
    .replace(/^[a-z]\([a-z]\)=/, '')
}

function parseQuadratic(raw) {
  let s = cleanExpr(raw)
  s = s.replace(/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/g, (_, num, den) => String(Number(num) / Number(den)))
  s = s.replace(/[twvnpgm]/g, 'x')
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

export const UNIT1_TOPICS_13_14 = {
  id: 'ap-precal-unit-1-13-14',
  title: 'AP Precalculus — Topics 1.13–1.14',
  subtitle: 'Function model selection and construction',
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
      topic: 'Model selection',
      type: 'mc',
      prompt: 'Data: x = 0, 1, 2, 3, 4 and y = 3, 7, 11, 15, 19. Which model fits, based on the differences?',
      choices: [
        'Linear, because the first differences are the constant 4',
        'Quadratic, because the second differences are constant',
        'Cubic, because there are three columns of differences',
        'Neither linear nor quadratic',
      ],
      answer: 'A',
    },
    {
      id: 2,
      points: 1,
      topic: 'Model selection',
      type: 'mc',
      prompt: 'A ball is thrown upward and falls back to the ground. Which function BEST models its height over time?',
      choices: ['Linear', 'Quadratic', 'Rational', 'Constant'],
      answer: 'B',
    },
    {
      id: 3,
      points: 1,
      topic: 'Model selection',
      type: 'mc',
      prompt: 'The time needed to drive a fixed distance depends on the average speed. Which function BEST models time as a function of speed?',
      choices: ['Linear', 'Quadratic', 'Cubic', 'Rational'],
      answer: 'D',
      feedbackCorrect: 'Time equals distance divided by speed.',
    },
    {
      id: 4,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'Match each situation with the most appropriate model type.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Taxi cost: a fixed fee plus a charge per mile',
          choices: ['Linear', 'Quadratic', 'Cubic', 'Rational'],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Area of a square as a function of its side length',
          choices: ['Linear', 'Quadratic', 'Cubic', 'Rational'],
          answer: 'B',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Volume of a cube as a function of its edge length',
          choices: ['Linear', 'Quadratic', 'Cubic', 'Rational'],
          answer: 'C',
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'Slices per person when one pizza is shared by n people',
          choices: ['Linear', 'Quadratic', 'Cubic', 'Rational'],
          answer: 'D',
        },
      ],
    },
    {
      id: 5,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A gym charges a $30 sign-up fee plus $15 per month.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Total cost C after m months',
          answer: '30+15m',
          check: (response) => matchesPoly(response, 0, 15, 30, 0),
          feedbackWrong: 'C(m) = 30 + 15m.',
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Total cost after 12 months, in dollars',
          answer: 210,
          tolerance: 0,
        },
      ],
    },
    {
      id: 6,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A ball’s height in feet is h(t) = −16t² + 48t + 4, t seconds after it is thrown.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'h(2), in feet', answer: 36, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'Initial height, in feet', answer: 4, tolerance: 0 },
      ],
    },
    {
      id: 7,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A family drives 240 miles at a constant average speed of r miles per hour.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Travel time T(r), in hours',
          answer: '240/r',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '240/r' || s === '240/x'
          },
          feedbackWrong: 'T(r) = 240/r.',
        },
        { label: 'b', type: 'numeric', prompt: 'T(60), in hours', answer: 4, tolerance: 0 },
      ],
    },
    {
      id: 8,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A town’s population is P(t) = 500 + 25t, where t is years after 2020.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'What does 500 mean?',
          choices: [
            '500 people lived in the town in 2020.',
            'The town gains 500 people every year.',
            'The population will be 500 in 25 years.',
            'The town loses 500 people per year.',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'What does 25 mean?',
          choices: [
            'The population grows by 25 people per year.',
            '25 people lived there in 2020.',
            'The population doubles every 25 years.',
            'The population is 25 times the year.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 9,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'Data: x = 0, 1, 2, 3, 4 and y = 2, 5, 10, 17, 26.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'First differences',
          answer: '3, 5, 7, 9',
          check: (response) => numsInOrder(response, [3, 5, 7, 9], 0),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Second differences',
          answer: '2, 2, 2',
          check: (response) => numsInOrder(response, [2, 2, 2], 0),
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Model type',
          choices: ['Quadratic', 'Linear', 'Cubic', 'Neither'],
          answer: 'A',
        },
      ],
    },
    {
      id: 10,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'A rectangle has perimeter 20 cm. Its area is A(w) = w(10 − w).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Domain in context',
          answer: '0<w<10',
          accept: ['(0, 10)'],
          check: (response) => sameText(response, '0<w<10') || sameText(response, '(0, 10)'),
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Why must the domain be restricted?',
          choices: [
            'The width and the length 10 − w must both be positive.',
            'The perimeter cannot be 20.',
            'Area is never positive.',
            'A quadratic has no domain restriction.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 11,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'A store models monthly sales by S(t) = 1200 + 80t.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'What assumption does a linear model make?',
          choices: [
            'Sales change by the same amount, 80, each month.',
            'Sales level off over time.',
            'Sales double every month.',
            'Sales are always 1200.',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Why might that assumption fail over many years?',
          choices: [
            'Demand may level off as the market becomes saturated.',
            'A linear formula cannot be evaluated for large t.',
            '80 is not a constant.',
            'The starting sales are too small.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 12,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'A garage charges $5 for the first hour and $3 for each additional hour, up to a daily maximum of $20.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'What type of function best models the cost?',
          choices: ['Piecewise', 'Linear', 'Quadratic', 'Rational'],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Why is a single polynomial a poor model?',
          choices: [
            'The cost jumps by the hour and then stays capped at $20, which one polynomial cannot do.',
            'Polynomials cannot have a constant term.',
            'The first hour costs more than the later hours, so the model must be quadratic.',
            'A polynomial would have a vertical asymptote at $20.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 13,
      points: 1,
      topic: 'Model construction',
      type: 'text',
      prompt:
        'A hill’s cross-section is quadratic, with its highest point at (2, 10), and it passes through (0, 2). Enter the model in vertex form or standard form.',
      answer: '-2(x-2)^2+10',
      accept: ['-2x^2+8x+2'],
      check: (response) => {
        const s = cleanExpr(response)
        return s === '-2(x-2)^2+10' || matchesPoly(response, -2, 8, 2, 0)
      },
      feedbackWrong: 'f(x) = −2(x − 2)² + 10.',
    },
    {
      id: 14,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A club had 120 members in 2015 and 150 members in 2020. Assume linear growth, and let t be years after 2015.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Membership model M(t)',
          answer: '120+6t',
          check: (response) => matchesPoly(response, 0, 6, 120, 0),
          feedbackWrong: 'M(t) = 120 + 6t.',
        },
        { label: 'b', type: 'numeric', prompt: 'Predicted membership in 2030', answer: 210, tolerance: 0 },
      ],
    },
    {
      id: 15,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A beaker holds 10 L of water mixed with 2 L of acid. Pure acid is added, x liters at a time.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Acid concentration C(x)',
          answer: '(2+x)/(12+x)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '(2+x)/(12+x)' || s === '(x+2)/(x+12)'
          },
          feedbackWrong: 'C(x) = (2 + x)/(12 + x).',
        },
        { label: 'b', type: 'numeric', prompt: 'C(4)', answer: 0.375, tolerance: 0.001, answerDisplay: '0.375' },
        {
          label: 'c',
          type: 'mc',
          prompt: 'What happens to C(x) as x → ∞?',
          choices: [
            'C(x) approaches 1, so the mixture approaches pure acid.',
            'C(x) approaches 0, so the acid disappears.',
            'C(x) approaches 2, the original amount of acid.',
            'C(x) grows without bound.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 16,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'Fixed costs are $500 and each item costs $4. Average cost is A(n) = (500 + 4n)/n.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'A(100), in dollars per item', answer: 9, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'Limit of A(n) as n → ∞, in dollars per item', answer: 4, tolerance: 0 },
        {
          label: 'c',
          type: 'mc',
          prompt: 'What does that limit mean?',
          choices: [
            'As production grows, average cost approaches the $4 per-item cost, because the fixed cost is spread over more items.',
            'The company eventually pays $500 per item.',
            'The fixed cost disappears after 4 items.',
            'Average cost grows without bound.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 17,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'Data: x = 0, 1, 2, 3, 4, 5 and y = 2, 2, 8, 26, 62, 122. A graphing calculator is allowed from this question on.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'First differences',
          answer: '0, 6, 18, 36, 60',
          check: (response) => numsInOrder(response, [0, 6, 18, 36, 60], 0),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Second differences',
          answer: '6, 12, 18, 24',
          check: (response) => numsInOrder(response, [6, 12, 18, 24], 0),
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Third differences',
          answer: '6, 6, 6',
          check: (response) => numsInOrder(response, [6, 6, 6], 0),
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'Model type',
          choices: ['Cubic', 'Quadratic', 'Linear', 'Neither'],
          answer: 'A',
        },
      ],
    },
    {
      id: 18,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'Drug concentration might be modeled by C₁(t) = −t² + 6t or C₂(t) = 5t/(t² + 4).',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'What does each model predict as t → ∞?',
          choices: [
            'C₁ goes to −∞, and C₂ goes to 0.',
            'Both go to 0.',
            'C₁ goes to 6, and C₂ goes to 5.',
            'Both go to ∞.',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Which model is more appropriate?',
          choices: [
            'C₂, because concentration cannot be negative and it approaches 0 as the drug clears.',
            'C₁, because a quadratic has a maximum.',
            'Either model, because both rise at first.',
            'Neither, because both have vertical asymptotes.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 19,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'An open box is made by cutting squares of side x from a 20 in by 30 in sheet. V(x) = x(20 − 2x)(30 − 2x).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Domain in context, in inches',
          answer: '0<x<10',
          accept: ['(0, 10)'],
          check: (response) => sameText(response, '0<x<10') || sameText(response, '(0, 10)'),
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Maximum volume, in cubic inches',
          answer: 1056.3,
          tolerance: 2,
          answerDisplay: 'about 1056.3',
        },
      ],
    },
    {
      id: 20,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'Stopping distance d in feet at speed v = 20, 30, 40, 50, 60 mph is d = 40, 75, 120, 175, 240.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Which model type fits?',
          choices: [
            'Quadratic, because the second differences are constant',
            'Linear, because speed and distance both increase',
            'Cubic, because there are five data points',
            'Rational, because distance is related to speed',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Why is it reasonable to assume d(0) = 0?',
          choices: [
            'A car moving at 0 mph needs no distance to stop.',
            'Every quadratic has a zero at the origin.',
            'The first data point is (20, 40), so the graph starts at 0.',
            'Stopping distance is always zero.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 21,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'Using the stopping-distance data from the previous question and d(0) = 0, construct d(v) = av² + bv.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Model d(v)',
          answer: '0.05v^2+v',
          check: (response) => matchesPoly(response, 0.05, 1, 0, 0.001),
          feedbackWrong: 'd(v) = 0.05v² + v.',
        },
        { label: 'b', type: 'numeric', prompt: 'Predicted stopping distance at 70 mph, in feet', answer: 315, tolerance: 0 },
      ],
    },
    {
      id: 22,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'Linear data: x = 1, 2, 3, 4, 5 and y = 3.1, 4.9, 7.2, 8.8, 11.0.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Slope of the linear regression equation, rounded to the hundredths',
          answer: 1.97,
          tolerance: 0.02,
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'y-intercept of the regression equation, rounded to the hundredths',
          answer: 1.09,
          tolerance: 0.02,
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Predicted y at x = 8',
          answer: 16.85,
          tolerance: 0.05,
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Residual at x = 3',
          answer: 0.2,
          tolerance: 0.05,
        },
      ],
    },
    {
      id: 23,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'Shipping is $6 for packages up to 2 lb and $1.50 for each additional pound.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'Cost, in dollars, for a package of at most 2 lb', answer: 6, tolerance: 0 },
        {
          label: 'b',
          type: 'text',
          prompt: 'Cost for w > 2, such as 6 + 1.5(w − 2)',
          answer: '6+1.5(w-2)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '6+1.5(w-2)' || s === '6+1.5(x-2)' || matchesPoly(response, 0, 1.5, 3, 0.001)
          },
          feedbackWrong: 'C(w) = 6 + 1.5(w − 2) for w > 2.',
        },
        { label: 'c', type: 'numeric', prompt: 'C(5), in dollars', answer: 10.5, tolerance: 0.01, answerDisplay: '10.50' },
      ],
    },
    {
      id: 24,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'The time to finish a job is inversely proportional to the number of workers. Six workers take 10 hours.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Model t(n)',
          answer: '60/n',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '60/n' || s === '60/x'
          },
          feedbackWrong: 't(n) = 60/n.',
        },
        { label: 'b', type: 'numeric', prompt: 'Time for 8 workers, in hours', answer: 7.5, tolerance: 0.01 },
        {
          label: 'c',
          type: 'mc',
          prompt: 'One assumption behind the model is that',
          choices: [
            'every worker works at the same rate, and adding workers does not slow anyone down',
            'the job takes longer when more people help',
            'six is the maximum number of workers',
            'the time is proportional to the number of workers',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 25,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'A fish population is P(t) = −2t² + 40t + 100, where t is years after stocking.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'Maximum population', answer: 300, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'Year t when the maximum occurs', answer: 10, tolerance: 0 },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Year when the model predicts the population reaches 0',
          answer: 22.25,
          tolerance: 0.1,
          answerDisplay: 'about 22.25',
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'A limitation of the model is that',
          choices: [
            'after about 22.25 years it predicts a negative population, which is impossible',
            'the population cannot have a maximum',
            't = 0 is not in the domain',
            'a quadratic cannot model a population',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 26,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'For x = 0, 1, 2, 3 the values are y = 1, 2, 5, 10. Model A is y = 3x. Model B is y = x² + 1.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Residuals for Model A',
          answer: '1, -1, -1, 1',
          check: (response) => numsInOrder(response, [1, -1, -1, 1], 0),
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Residuals for Model B',
          answer: '0, 0, 0, 0',
          check: (response) => numsInOrder(response, [0, 0, 0, 0], 0),
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Which model fits better?',
          choices: ['Model B', 'Model A', 'They fit equally well', 'Neither fits any point'],
          answer: 'A',
        },
        { label: 'd', type: 'numeric', prompt: 'Model A prediction at x = 10', answer: 30, tolerance: 0 },
        { label: 'e', type: 'numeric', prompt: 'Model B prediction at x = 10', answer: 101, tolerance: 0 },
        {
          label: 'f',
          type: 'mc',
          prompt: 'Why be cautious about either prediction at x = 10?',
          choices: [
            'x = 10 is far outside the data, so the trend may not continue.',
            'Both models are linear, so they cannot be evaluated at 10.',
            'Residuals are always zero outside the data.',
            'x = 10 is between the given inputs.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 27,
      points: 1,
      topic: 'Model selection',
      type: 'multipart',
      prompt: 'Name the function type that best fits each description.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Zero at t = 0 and t = 10, symmetric, with a maximum at t = 5',
          choices: ['Quadratic', 'Cubic', 'Linear', 'Rational'],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'Three real zeros and two changes in direction',
          choices: ['Cubic', 'Quadratic', 'Linear', 'Rational'],
          answer: 'A',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Approaches a constant as the input grows and has a vertical asymptote',
          choices: ['Rational', 'Quadratic', 'Cubic', 'Linear'],
          answer: 'A',
        },
      ],
    },
    {
      id: 28,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A roller-coaster track meets the ground at x = 0, 5, and 12 meters. A cubic model has h(2) = 120.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Height model h(x)',
          answer: '2x(x-5)(x-12)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '2x(x-5)(x-12)' || s === '2x(x-12)(x-5)'
          },
          feedbackWrong: 'h(x) = 2x(x − 5)(x − 12).',
        },
        { label: 'b', type: 'numeric', prompt: 'h(8)', answer: -192, tolerance: 0, answerDisplay: '−192' },
        {
          label: 'c',
          type: 'mc',
          prompt: 'What does h(8) mean?',
          choices: [
            'The track is 192 m below ground at x = 8, a dip or tunnel.',
            'The track is 192 m above ground at x = 8.',
            'The track returns to the ground at x = 8.',
            'The cubic is not defined at x = 8.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 29,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A parabolic arch is 12 m wide at the ground and 18 m tall at its center. Place the center of the base at the origin.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Model h(x)',
          answer: '-0.5x^2+18',
          check: (response) => matchesPoly(response, -0.5, 0, 18, 0.001),
          feedbackWrong: 'h(x) = −0.5x² + 18.',
        },
        { label: 'b', type: 'numeric', prompt: 'Height 4 m from the center, in meters', answer: 10, tolerance: 0 },
      ],
    },
    {
      id: 30,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'A ball’s height in meters at t = 0, 1, 2, 3, 4 seconds is 5.0, 20.1, 25.0, 19.9, 5.1. Round the quadratic model to whole-number coefficients.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Quadratic model',
          answer: '-5t^2+20t+5',
          check: (response) => matchesPoly(response, -5, 20, 5, 0),
          feedbackWrong: 'h(t) = −5t² + 20t + 5.',
        },
        {
          label: 'b',
          type: 'numeric',
          prompt: 'Time when the ball hits the ground, in seconds',
          answer: 4.24,
          tolerance: 0.05,
          answerDisplay: 'about 4.24',
        },
      ],
    },
    {
      id: 31,
      points: 1,
      topic: 'Model construction',
      type: 'multipart',
      prompt: 'Pipe A fills a tank in 6 hours. Pipe B alone fills it in x hours. Their rates add when they work together.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Time to fill the tank together, T(x)',
          answer: '6x/(x+6)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '6x/(x+6)' || s === '6x/(6+x)' || s === '1/(1/6+1/x)' || s === '1/(1/x+1/6)'
          },
          feedbackWrong: 'T(x) = 6x/(x + 6).',
        },
        { label: 'b', type: 'numeric', prompt: 'T(3), in hours', answer: 2, tolerance: 0 },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Limit of T(x) as x → ∞',
          answer: 6,
          tolerance: 0,
        },
        {
          label: 'd',
          type: 'mc',
          prompt: 'What does that limit mean?',
          choices: [
            'If pipe B is very slow, the tank fills in about the 6 hours pipe A needs alone.',
            'The two pipes eventually take no time at all.',
            'Pipe A shuts off after 6 hours.',
            'The tank never fills.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 32,
      points: 1,
      topic: 'Cost and revenue',
      extension: true,
      type: 'multipart',
      prompt: 'Costs are C(x) = 1000 + 15x and revenue is R(x) = x(75 − 0.5x).',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Profit P(x)',
          answer: '-0.5x^2+60x-1000',
          check: (response) => matchesPoly(response, -0.5, 60, -1000, 0.01),
          feedbackWrong: 'P(x) = −0.5x² + 60x − 1000.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Break-even quantities',
          answer: '20, 100',
          check: (response) => numsInOrder(response, [20, 100], 0) || numsInOrder(response, [100, 20], 0),
        },
        { label: 'c', type: 'numeric', prompt: 'Quantity that maximizes profit', answer: 60, tolerance: 0 },
        { label: 'd', type: 'numeric', prompt: 'Maximum profit, in dollars', answer: 800, tolerance: 0 },
      ],
    },
    {
      id: 33,
      points: 1,
      topic: 'Leveling-off growth',
      extension: true,
      type: 'multipart',
      prompt: 'App users, in thousands, are P(t) = (800t + 200)/(t + 2), with t in months.',
      parts: [
        { label: 'a', type: 'numeric', prompt: 'P(0), in thousands', answer: 100, tolerance: 0 },
        { label: 'b', type: 'numeric', prompt: 'P(8), in thousands', answer: 660, tolerance: 0 },
        { label: 'c', type: 'numeric', prompt: 'Limit of P(t) as t → ∞, in thousands', answer: 800, tolerance: 0 },
        {
          label: 'd',
          type: 'mc',
          prompt: 'Why is this rational model better than a quadratic here?',
          choices: [
            'A quadratic would eventually decrease or grow without bound, but user growth levels off.',
            'A quadratic cannot pass through P(0) = 100.',
            'A rational function is always linear.',
            'The quadratic would have a horizontal asymptote at 800.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 34,
      points: 1,
      topic: 'Piecewise tax',
      extension: true,
      type: 'multipart',
      prompt: 'A tax is 10% on the first $10,000 of income and 20% on income above $10,000.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Tax on income x with 0 ≤ x ≤ 10,000',
          answer: '0.1x',
          check: (response) => matchesPoly(response, 0, 0.1, 0, 0.001),
          feedbackWrong: 'T(x) = 0.1x on that piece.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Tax for x > 10,000',
          answer: '1000+0.2(x-10000)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '1000+0.2(x-10000)' || matchesPoly(response, 0, 0.2, -1000, 0.01)
          },
          feedbackWrong: 'T(x) = 1000 + 0.2(x − 10000).',
        },
        { label: 'c', type: 'numeric', prompt: 'T(25000), in dollars', answer: 4000, tolerance: 0 },
        {
          label: 'd',
          type: 'mc',
          prompt: 'Why is the model continuous at x = 10,000?',
          choices: [
            'Both pieces equal $1,000 there.',
            'The tax rate changes, so the graph jumps.',
            'A piecewise function is never continuous.',
            'The second piece is undefined at 10,000.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 35,
      points: 1,
      topic: 'Build a height model',
      extension: true,
      type: 'multipart',
      prompt: 'A quadratic height h satisfies h(0) = 3. The average rate of change is 8 ft/s on [0, 2] and 0 ft/s on [2, 4].',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'h(t)',
          answer: '-2t^2+12t+3',
          check: (response) => matchesPoly(response, -2, 12, 3, 0),
          feedbackWrong: 'h(t) = −2t² + 12t + 3.',
        },
        { label: 'b', type: 'numeric', prompt: 'Time of the maximum height, in seconds', answer: 3, tolerance: 0 },
        { label: 'c', type: 'numeric', prompt: 'Maximum height, in feet', answer: 21, tolerance: 0 },
      ],
    },
    {
      id: 36,
      points: 2,
      topic: 'Shirt demand',
      extension: true,
      type: 'multipart',
      prompt: 'Weekly demand q at price p = 10, 12, 14, 16, 18 dollars is q = 500, 440, 380, 320, 260 shirts.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Demand model q(p)',
          answer: '800-30p',
          check: (response) => matchesPoly(response, 0, -30, 800, 0),
          feedbackWrong: 'q(p) = 800 − 30p.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Revenue R(p)',
          answer: 'p(800-30p)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === 'p(800-30p)' || s === 'x(800-30x)' || matchesPoly(response, -30, 800, 0, 0)
          },
          feedbackWrong: 'R(p) = p(800 − 30p).',
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Price that maximizes revenue, in dollars',
          answer: 40 / 3,
          tolerance: 0.05,
          answerDisplay: '13.33',
        },
        {
          label: 'd',
          type: 'numeric',
          prompt: 'Maximum revenue, in dollars',
          answer: 16000 / 3,
          tolerance: 1,
          answerDisplay: 'about 5333.33',
        },
        {
          label: 'e',
          type: 'mc',
          prompt: 'One assumption of this model is that',
          choices: [
            'demand stays linear across the prices being considered',
            'revenue is the same at every price',
            'the store never sells more than 260 shirts',
            'price and demand are unrelated',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 37,
      points: 2,
      topic: 'Choose and build a model',
      extension: true,
      type: 'multipart',
      prompt: 'Over t = 0, 1, 2, 3, 4 years, a quantity is y = 10, 14, 20, 28, 38.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'Which model fits?',
          choices: [
            'Quadratic, because the second differences are the constant 2',
            'Linear, because the inputs are equally spaced',
            'Cubic, because there are four differences',
            'Neither',
          ],
          answer: 'A',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Model y(t)',
          answer: 't^2+3t+10',
          check: (response) => matchesPoly(response, 1, 3, 10, 0),
          feedbackWrong: 'y(t) = t² + 3t + 10.',
        },
        { label: 'c', type: 'numeric', prompt: 'Predicted y at t = 10', answer: 140, tolerance: 0 },
        {
          label: 'd',
          type: 'mc',
          prompt: 'Why might the model fail long term?',
          choices: [
            'It assumes the same growth continues, but real growth may slow or level off.',
            'A quadratic cannot be evaluated at t = 10.',
            'The second differences are not constant.',
            'The prediction at t = 10 is inside the data.',
          ],
          answer: 'A',
        },
      ],
    },
    {
      id: 38,
      points: 2,
      topic: 'Salt concentration',
      extension: true,
      type: 'multipart',
      prompt:
        'A tank holds 100 L of water with 10 kg of salt. Brine with 0.5 kg of salt per liter flows in at 5 L/min. Nothing flows out.',
      parts: [
        {
          label: 'a',
          type: 'text',
          prompt: 'Salt S(t), in kg',
          answer: '10+2.5t',
          check: (response) => matchesPoly(response, 0, 2.5, 10, 0.01),
          feedbackWrong: 'S(t) = 10 + 2.5t.',
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Volume V(t), in liters',
          answer: '100+5t',
          check: (response) => matchesPoly(response, 0, 5, 100, 0),
          feedbackWrong: 'V(t) = 100 + 5t.',
        },
        {
          label: 'c',
          type: 'text',
          prompt: 'Concentration C(t)',
          answer: '(10+2.5t)/(100+5t)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '(10+2.5t)/(100+5t)' || s === '(2.5t+10)/(5t+100)' || s === '(t+4)/(2t+40)'
          },
          feedbackWrong: 'C(t) = (10 + 2.5t)/(100 + 5t).',
        },
        { label: 'd', type: 'numeric', prompt: 'C(0), in kg/L', answer: 0.1, tolerance: 0.001 },
        { label: 'e', type: 'numeric', prompt: 'C(20), in kg/L', answer: 0.3, tolerance: 0.001 },
        {
          label: 'f',
          type: 'mc',
          prompt: 'The horizontal asymptote of C means',
          choices: [
            'the concentration approaches 0.5 kg/L, the concentration of the incoming brine',
            'the tank eventually holds no salt',
            'the volume approaches 0.5 L',
            'the concentration grows without bound',
          ],
          answer: 'A',
        },
        { label: 'g', type: 'numeric', prompt: 'Minutes until the concentration is 0.4 kg/L', answer: 60, tolerance: 0 },
      ],
    },
    {
      id: 39,
      points: 2,
      topic: 'Model statements',
      extension: true,
      type: 'multipart',
      prompt: 'Decide whether each statement is true or false.',
      parts: [
        {
          label: 'a',
          type: 'mc',
          prompt: 'If equally spaced inputs have constant nonzero second differences, a quadratic fits the data exactly.',
          choices: ['True', 'False'],
          answer: 'A',
          feedbackCorrect: 'Constant second differences over equal steps characterize quadratics.',
          feedbackWrong: 'True. Constant second differences over equal steps characterize quadratics.',
        },
        {
          label: 'b',
          type: 'mc',
          prompt: 'A model that fits the given data exactly will give accurate predictions outside the data range.',
          choices: ['True', 'False'],
          answer: 'B',
          feedbackCorrect: 'False. A line can fit two points exactly and still fail for later data.',
          feedbackWrong: 'False. Fitting the given points does not guarantee the trend continues.',
        },
        {
          label: 'c',
          type: 'mc',
          prompt: 'Through any n + 1 points with distinct x-values, there is a polynomial of degree at most n that passes through them exactly.',
          choices: ['True', 'False'],
          answer: 'A',
          feedbackCorrect: 'Two points determine a line, three a quadratic, and so on.',
          feedbackWrong: 'True. Two points determine a line, three a quadratic, and so on.',
        },
      ],
    },
    {
      id: 40,
      points: 2,
      topic: 'Phone plan',
      extension: true,
      type: 'multipart',
      prompt:
        'A phone plan costs $40 per month and includes 5 GB. Each extra GB costs $10, prorated, but the bill never exceeds $90.',
      parts: [
        {
          label: 'a',
          type: 'numeric',
          prompt: 'Bill, in dollars, for 0 ≤ g ≤ 5',
          answer: 40,
          tolerance: 0,
        },
        {
          label: 'b',
          type: 'text',
          prompt: 'Bill for 5 < g ≤ 10, such as 40 + 10(g − 5)',
          answer: '40+10(g-5)',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '40+10(g-5)' || s === '40+10(x-5)' || matchesPoly(response, 0, 10, -10, 0)
          },
          feedbackWrong: 'C(g) = 40 + 10(g − 5) on that piece.',
        },
        {
          label: 'c',
          type: 'numeric',
          prompt: 'Bill, in dollars, once g is past the cap',
          answer: 90,
          tolerance: 0,
        },
        { label: 'd', type: 'numeric', prompt: 'Data usage, in GB, that gives a $65 bill', answer: 7.5, tolerance: 0.01 },
        {
          label: 'e',
          type: 'text',
          prompt: 'Average cost per GB for g > 10',
          answer: '90/g',
          check: (response) => {
            const s = cleanExpr(response)
            return s === '90/g' || s === '90/x'
          },
          feedbackWrong: 'The average cost is 90/g.',
        },
        {
          label: 'f',
          type: 'numeric',
          prompt: 'Limit of that average cost as g → ∞',
          answer: 0,
          tolerance: 0,
        },
      ],
    },
  ],
}

/**
 * AP Precalculus Unit 1 — Polynomial and Rational Functions.
 * 40 questions, 45 points. Q1–Q35 are 1 point; Q36–Q40 are 2 points.
 * Exposed as window.UNIT1 for the existing quiz.
 *
 * Q11 uses 3x³ − 4x² − 5x + 2. The printed item says −7x, which has no
 * rational zeros; the published key's zeros and synthetic division match −5x.
 */
;(function (global) {
  function cleanExpr(value) {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/∞/g, 'inf')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/⁵/g, '^5')
      .replace(/√/g, 'sqrt')
      .replace(/∪/g, 'u')
      .replace(/\s+/g, '')
      .replace(/[·*]/g, '')
      .replace(/^(?:f|g|h|p|q|r|s|v)\(x\)=/, '')
      .replace(/^p\(t\)=/, '')
      .replace(/^c\(t\)=/, '')
      .replace(/^v\(x\)=/, '')
      .replace(/^y=/, '')
  }

  function close(a, b, tol = 0.03) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol
  }

  function rootKey(value) {
    return Math.round(value * 1e6) / 1e6
  }

  function parseValue(raw) {
    let s = String(raw ?? '')
      .trim()
      .toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/√/g, 'sqrt')
      .replace(/\s+/g, '')
    if (!s) return NaN
    let sign = 1
    if (s[0] === '+') s = s.slice(1)
    else if (s[0] === '-') {
      sign = -1
      s = s.slice(1)
    }
    if (s.startsWith('sqrt')) {
      const inner = s.replace(/^sqrt\(?/, '').replace(/\)$/, '')
      const n = Number(inner)
      return Number.isFinite(n) ? sign * Math.sqrt(n) : NaN
    }
    const frac = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
    if (frac) return (sign * Number(frac[1])) / Number(frac[2])
    const n = Number(s)
    return Number.isFinite(n) ? sign * n : NaN
  }

  function parseLooseNumbers(response) {
    const chunks = String(response ?? '')
      .split(/,|;|\band\b/i)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
    if (!chunks.length) return null
    const nums = []
    for (const chunk of chunks) {
      const body = chunk.replace(/^x\s*=\s*/i, '').replace(/[()[\]]/g, '')
      if (/^[±]/.test(body)) {
        const v = parseValue(body.slice(1))
        if (!Number.isFinite(v)) return null
        nums.push(v, -v)
      } else {
        const v = parseValue(body)
        if (!Number.isFinite(v)) return null
        nums.push(v)
      }
    }
    return nums
  }

  function sameSet(response, expected, tol = 0.03) {
    const got = parseLooseNumbers(response)
    if (!got || got.length !== expected.length) return false
    const left = [...expected]
    for (const value of got) {
      const index = left.findIndex((item) => close(item, value, tol))
      if (index < 0) return false
      left.splice(index, 1)
    }
    return true
  }

  function infSign(response) {
    const s = String(response ?? '')
      .trim()
      .toLowerCase()
      .replace(/[−–—]/g, '-')
      .replace(/∞/g, 'infinity')
      .replace(/\s+/g, '')
    if (
      s === '-infinity' ||
      s === '-inf' ||
      s === '-infty' ||
      s === 'negativeinfinity' ||
      s === 'down' ||
      s === 'falls' ||
      s === '-∞'
    ) {
      return -1
    }
    if (
      s === '+infinity' ||
      s === 'infinity' ||
      s === '+inf' ||
      s === 'inf' ||
      s === 'infty' ||
      s === '+infty' ||
      s === 'positiveinfinity' ||
      s === 'up' ||
      s === 'rises'
    ) {
      return 1
    }
    return 0
  }

  function isNegInf(response) {
    return infSign(response) === -1
  }

  function isPosInf(response) {
    return infSign(response) === 1
  }

  function leftRight(response, left, right) {
    const parts = String(response ?? '')
      .toLowerCase()
      .split(/,|;|\/|\bthen\b|\band\b/)
      .map((part) => part.trim())
      .filter(Boolean)
    return parts.length >= 2 && infSign(parts[0]) === left && infSign(parts[1]) === right
  }

  function lettersAre(response, expected) {
    const found = [...new Set(String(response ?? '').toUpperCase().match(/[A-E]/g) || [])].sort()
    return found.join('') === expected
  }

  function isNone(response) {
    const s = String(response ?? '')
      .trim()
      .toLowerCase()
      .replace(/[.]/g, '')
    return /^(none|no|no hole|no holes|no va|no vas|no vertical asymptote|no vertical asymptotes|n\/a|dne|does not exist)$/.test(
      s,
    )
  }

  function samePair(response, x, y, tol = 0.02) {
    const match = String(response ?? '')
      .replace(/[−–—]/g, '-')
      .match(/\(?\s*([^,()]+)\s*,\s*([^)]+)\s*\)?/)
    if (!match) return false
    return close(parseValue(match[1]), x, tol) && close(parseValue(match[2]), y, tol)
  }

  function sameIntervalUnion(response, parts) {
    const normalize = (value) =>
      String(value)
        .toLowerCase()
        .replace(/[−–—]/g, '-')
        .replace(/∞/g, 'inf')
        .replace(/infinity/g, 'inf')
        .replace(/infty/g, 'inf')
        .replace(/∪/g, 'u')
        .replace(/\s+/g, '')
    const got = normalize(response).split('u').filter(Boolean).sort()
    const expected = parts.map((part) => normalize(part)).sort()
    return got.join('|') === expected.join('|')
  }

  function openBounds(response, a, b) {
    const s = cleanExpr(response)
    return s === `(${a},${b})` || s === `${a}<x<${b}` || s === `x>${a}andx<${b}` || s === `x>${a},x<${b}`
  }

  function evenNegativePair(response) {
    const raw = String(response ?? '')
    const aMatch = raw.match(/a\s*=\s*(-?\d+(?:\.\d+)?(?:\/\d+)?)/i)
    const nMatch = raw.match(/n\s*=\s*(-?\d+)/i)
    let a
    let n
    if (aMatch && nMatch) {
      a = parseValue(aMatch[1])
      n = Number(nMatch[1])
    } else {
      const bits = raw.split(/[,;]/).map((bit) => bit.trim()).filter(Boolean)
      if (bits.length !== 2) return false
      a = parseValue(bits[0])
      n = Number(bits[1])
    }
    return a < 0 && Number.isInteger(n) && n >= 2 && n % 2 === 0
  }

  function readPositiveInt(s, i) {
    const match = s.slice(i).match(/^(\d+)/)
    if (!match) return null
    return { value: Number(match[1]), end: i + match[1].length }
  }

  function matchingParen(s, openIndex) {
    let depth = 0
    for (let i = openIndex; i < s.length; i += 1) {
      if (s[i] === '(') depth += 1
      else if (s[i] === ')') {
        depth -= 1
        if (depth === 0) return i
      }
    }
    return -1
  }

  function isSimpleAtom(inner) {
    return !inner.includes('(')
  }

  function parseSimple(inner) {
    let s = inner
    s = s.replace(/sqrt\((\d+(?:\.\d+)?)\)/g, (_, n) => String(Math.sqrt(Number(n))))
    s = s.replace(/sqrt(\d+(?:\.\d+)?)/g, (_, n) => String(Math.sqrt(Number(n))))
    s = s.replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, (_, a, b) => String(Number(a) / Number(b)))
    const quad = s.match(/^x\^2([+-]\d+(?:\.\d+)?)$/)
    if (quad) return { kind: 'quad', c: Number(quad[1]) }
    const lin = s.match(/^x([+-]\d+(?:\.\d+)?)$/)
    if (lin) return { kind: 'lin', root: -Number(lin[1]) }
    if (s === 'x') return { kind: 'lin', root: 0 }
    return null
  }

  function parseFactored(raw) {
    let s = cleanExpr(raw)
    if (!s) return null
    if (s.startsWith('(')) {
      const close = matchingParen(s, 0)
      if (close === s.length - 1 && !isSimpleAtom(s.slice(1, -1))) s = s.slice(1, -1)
    }

    let i = 0
    let leading = 1
    if (s[i] === '+') i += 1
    else if (s[i] === '-') {
      leading = -1
      i += 1
    }
    const coeff = s.slice(i).match(/^(\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?/)
    if (coeff && (i + coeff[0].length >= s.length || /[x(]/.test(s[i + coeff[0].length]))) {
      const value = coeff[2] ? Number(coeff[1]) / Number(coeff[2]) : Number(coeff[1])
      leading *= value
      i += coeff[0].length
    }

    const linears = new Map()
    const quads = []
    const addLinear = (root, mult) => {
      const key = rootKey(root)
      linears.set(key, (linears.get(key) || 0) + mult)
    }

    while (i < s.length) {
      if (s[i] === 'x') {
        i += 1
        let mult = 1
        if (s[i] === '^') {
          const power = readPositiveInt(s, i + 1)
          if (!power) return null
          mult = power.value
          i = power.end
        }
        addLinear(0, mult)
        continue
      }
      if (s[i] !== '(') return null
      const close = matchingParen(s, i)
      if (close < 0) return null
      const inner = s.slice(i + 1, close)
      i = close + 1
      let mult = 1
      if (s[i] === '^') {
        const power = readPositiveInt(s, i + 1)
        if (!power) return null
        mult = power.value
        i = power.end
      }
      if (!isSimpleAtom(inner)) {
        const nested = parseFactored(inner)
        if (!nested) return null
        leading *= nested.leading ** mult
        for (const [root, count] of nested.linears) addLinear(root, count * mult)
        for (const quad of nested.quads) quads.push({ c: quad.c, mult: quad.mult * mult })
        continue
      }
      const atom = parseSimple(inner)
      if (!atom) return null
      if (atom.kind === 'lin') addLinear(atom.root, mult)
      else quads.push({ c: atom.c, mult })
    }

    if (![...linears.values()].length && !quads.length) return null
    return { leading, linears, quads }
  }

  function degreeOf(parsed) {
    let degree = 0
    for (const mult of parsed.linears.values()) degree += mult
    for (const quad of parsed.quads) degree += 2 * quad.mult
    return degree
  }

  function realRoots(parsed) {
    const roots = new Map(parsed.linears)
    for (const quad of parsed.quads) {
      if (quad.c < -1e-9) {
        const root = rootKey(Math.sqrt(-quad.c))
        roots.set(root, (roots.get(root) || 0) + quad.mult)
        roots.set(-root, (roots.get(-root) || 0) + quad.mult)
      } else if (Math.abs(quad.c) <= 1e-9) {
        roots.set(0, (roots.get(0) || 0) + 2 * quad.mult)
      }
    }
    return roots
  }

  function hasNonrealQuad(parsed) {
    return parsed.quads.some((quad) => quad.c > 1e-9)
  }

  function exactZeros(raw, spec, leadingMode) {
    const parsed = parseFactored(raw)
    if (!parsed || hasNonrealQuad(parsed)) return false
    if (leadingMode === 'one' && !close(parsed.leading, 1, 1e-9)) return false
    if (leadingMode === 'pos' && !(parsed.leading > 0)) return false
    if (leadingMode === 'neg' && !(parsed.leading < 0)) return false
    if (leadingMode === 'any' && parsed.leading === 0) return false
    const roots = realRoots(parsed)
    if (roots.size !== spec.length) return false
    return spec.every((item) => roots.get(rootKey(item.root)) === item.mult)
  }

  function graphFeatures(raw) {
    const parsed = parseFactored(raw)
    if (!parsed || hasNonrealQuad(parsed) || !(parsed.leading < 0) || degreeOf(parsed) % 2 !== 0) return false
    const roots = realRoots(parsed)
    const at = (root) => roots.get(rootKey(root)) || 0
    if (roots.size !== 3) return false
    return at(-3) % 2 === 1 && at(4) % 2 === 1 && at(1) >= 2 && at(1) % 2 === 0
  }

  function evenDegreeFour(raw) {
    const parsed = parseFactored(raw)
    if (!parsed || !(parsed.leading < 0) || degreeOf(parsed) !== 4) return false
    const roots = realRoots(parsed)
    if (roots.size !== 2) return false
    for (const [root, mult] of roots) {
      if ((roots.get(rootKey(-root)) || 0) !== mult) return false
    }
    return true
  }

  function topLevelSlash(s) {
    let depth = 0
    for (let i = 0; i < s.length; i += 1) {
      if (s[i] === '(') depth += 1
      else if (s[i] === ')') depth -= 1
      else if (s[i] === '/' && depth === 0) return i
    }
    return -1
  }

  function rationalFeatures(raw) {
    const s = cleanExpr(raw)
    const slash = topLevelSlash(s)
    if (slash < 0) return null
    const num = parseFactored(s.slice(0, slash))
    const den = parseFactored(s.slice(slash + 1))
    if (!num || !den || hasNonrealQuad(num) || hasNonrealQuad(den)) return null
    const nRoots = realRoots(num)
    const dRoots = realRoots(den)
    const keys = new Set([...nRoots.keys(), ...dRoots.keys()])
    const holes = []
    const vas = []
    const zeros = []
    for (const root of keys) {
      const nMult = nRoots.get(root) || 0
      const dMult = dRoots.get(root) || 0
      const cancel = Math.min(nMult, dMult)
      if (cancel > 0 && dMult - cancel === 0) holes.push(root)
      if (dMult - cancel > 0) vas.push(root)
      if (nMult - cancel > 0) zeros.push(root)
    }
    return {
      holes,
      vas,
      zeros,
      degN: degreeOf(num),
      degD: degreeOf(den),
      ratio: num.leading / den.leading,
    }
  }

  function sameRoots(list, expected, tol = 0.02) {
    if (list.length !== expected.length) return false
    const left = [...expected]
    for (const value of list) {
      const index = left.findIndex((item) => close(item, value, tol))
      if (index < 0) return false
      left.splice(index, 1)
    }
    return true
  }

  function matchesRational(raw, expected) {
    const features = rationalFeatures(raw)
    if (!features) return false
    if (expected.degN != null && features.degN !== expected.degN) return false
    if (expected.degD != null && features.degD !== expected.degD) return false
    if (expected.ratio != null && !close(features.ratio, expected.ratio, 0.02)) return false
    if (expected.holes && !sameRoots(features.holes, expected.holes)) return false
    if (expected.vas && !sameRoots(features.vas, expected.vas)) return false
    if (expected.zeros && !sameRoots(features.zeros, expected.zeros)) return false
    if (expected.minNegativeZero && !features.zeros.some((zero) => zero < -1e-6)) return false
    return true
  }

  function matchLine(response, slope, intercept) {
    let s = cleanExpr(response)
    s = s.replace(/(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, (_, a, b) => String(Number(a) / Number(b)))
    let match = s.match(/^\(?([+-]?\d+(?:\.\d+)?)\)?\(x([+-]\d+(?:\.\d+)?)\)$/)
    if (match) {
      const a = Number(match[1])
      return close(a, slope, 0.02) && close(a * Number(match[2]), intercept, 0.02)
    }
    match = s.match(/^([+-]?\d+(?:\.\d+)?)x([+-]\d+(?:\.\d+)?)$/)
    if (match) return close(Number(match[1]), slope, 0.02) && close(Number(match[2]), intercept, 0.02)
    match = s.match(/^x([+-]\d+(?:\.\d+)?)$/)
    if (match) return close(slope, 1, 0.02) && close(Number(match[1]), intercept, 0.02)
    return false
  }

  function populationFactor(response) {
    const s = cleanExpr(response).replace(/t/g, 'x')
    const match = s.match(/^(-?\d+(?:\.\d+)?|-?\d+\/\d+)\((.+)\)$/)
    if (!match) return false
    const lead = parseValue(match[1])
    if (close(lead, -0.2, 0.001) && match[2] === 'x^4-16x^3+72x^2-80x-400') return true
    if (close(lead, 0.2, 0.001) && match[2] === '-x^4+16x^3-72x^2+80x+400') return true
    return false
  }

  const negInf = {
    answer: '-inf',
    accept: ['-infinity', '-∞', 'negative infinity', 'down'],
    check: isNegInf,
  }
  const posInf = {
    answer: '+inf',
    accept: ['infinity', '+∞', 'positive infinity', 'up'],
    check: isPosInf,
  }

  const UNIT1 = {
    id: 'ap-precal-unit-1',
    title: 'AP Precalculus — Unit 1 Assessment',
    subtitle: 'Polynomial and rational functions',
    totalPoints: 45,
    questionCount: 40,
    instructions: [
      '40 questions · 45 points total · one question at a time.',
      'No calculator on questions 1–24. A graphing calculator is allowed on questions 25–40.',
      'Use Check answer for feedback on the current item.',
      'Submit on question 40 when you are ready to score the full assessment.',
      'Multipart items earn half credit when at least half of the parts are correct. Questions 36–40 are worth 2 points.',
    ],
    questions: [
      {
        id: 1,
        points: 1,
        topic: 'Polynomial end behavior',
        type: 'multipart',
        prompt: 'Identify the degree, leading coefficient, and end behavior of f(x) = −3x⁴ + 7x² − 2x + 5.',
        parts: [
          { label: 'a', type: 'numeric', prompt: 'Degree', answer: 4, tolerance: 0 },
          { label: 'b', type: 'numeric', prompt: 'Leading coefficient', answer: -3, tolerance: 0, answerDisplay: '−3' },
          { label: 'c', type: 'text', prompt: 'As x → +∞, f(x) → (type -inf or +inf)', ...negInf },
          { label: 'd', type: 'text', prompt: 'As x → −∞, f(x) → (type -inf or +inf)', ...negInf },
        ],
        feedbackCorrect: 'Even degree and a negative leading coefficient send both ends to −∞.',
      },
      {
        id: 2,
        points: 1,
        topic: 'Polynomial end behavior',
        type: 'mc',
        prompt: 'Which BEST describes the end behavior of g(x) = 5x³ − 2x + 1?',
        choices: [
          'Up on both ends',
          'Down on both ends',
          'Down on the left, up on the right',
          'Up on the left, down on the right',
        ],
        answer: 'C',
        feedbackCorrect: 'Odd degree and a positive leading coefficient: left end down, right end up.',
        feedbackWrong: 'Odd degree and a positive leading coefficient: left end down, right end up.',
      },
      {
        id: 3,
        points: 1,
        topic: 'Zeros and multiplicity',
        type: 'multipart',
        prompt: 'Find all zeros of p(x) = (x − 3)²(x + 1)(x − 5) and state each multiplicity. Enter zeros from least to greatest.',
        parts: [
          { label: 'a', type: 'numeric', prompt: 'Least zero', answer: -1, tolerance: 0, answerDisplay: '−1' },
          { label: 'b', type: 'numeric', prompt: 'Multiplicity of that zero', answer: 1, tolerance: 0 },
          { label: 'c', type: 'numeric', prompt: 'Middle zero', answer: 3, tolerance: 0 },
          { label: 'd', type: 'numeric', prompt: 'Multiplicity of that zero', answer: 2, tolerance: 0 },
          { label: 'e', type: 'numeric', prompt: 'Greatest zero', answer: 5, tolerance: 0 },
          { label: 'f', type: 'numeric', prompt: 'Multiplicity of that zero', answer: 1, tolerance: 0 },
        ],
        feedbackCorrect: 'The factors give x = −1 (mult. 1), x = 3 (mult. 2), and x = 5 (mult. 1).',
      },
      {
        id: 4,
        points: 1,
        topic: 'Zeros and multiplicity',
        type: 'text',
        prompt:
          'A polynomial has zeros x = −2 (multiplicity 1), x = 0 (multiplicity 2), and x = 4 (multiplicity 1). Enter one factored form. A leading coefficient of 1 is fine.',
        answer: 'x^2(x+2)(x-4)',
        check: (response) =>
          exactZeros(
            response,
            [
              { root: -2, mult: 1 },
              { root: 0, mult: 2 },
              { root: 4, mult: 1 },
            ],
            'any',
          ),
        feedbackCorrect: 'Multiplicity 2 at 0 means a factor of x². One form is x²(x + 2)(x − 4).',
        feedbackWrong: 'Use x² for the zero at 0. One form is x²(x + 2)(x − 4). Any nonzero leading coefficient is fine.',
      },
      {
        id: 5,
        points: 1,
        topic: 'Graphing polynomials',
        type: 'mc',
        prompt:
          'At a zero of even multiplicity, the graph ________. At a zero of odd multiplicity greater than 1, the graph ________.',
        choices: [
          'crosses / bounces',
          'bounces / flattens and crosses',
          'has a hole / crosses',
          'crosses / bounces',
        ],
        answer: 'B',
        feedbackCorrect: 'Even multiplicity: the graph bounces. Odd multiplicity greater than 1: it flattens and crosses.',
      },
      {
        id: 6,
        points: 1,
        topic: 'Graphing polynomials',
        type: 'multipart',
        prompt: 'For f(x) = x(x − 2)²(x + 3):',
        parts: [
          { label: 'a', type: 'numeric', prompt: 'y-intercept (the y-value)', answer: 0, tolerance: 0 },
          {
            label: 'b',
            type: 'numeric',
            prompt: 'Maximum possible number of turning points',
            answer: 3,
            tolerance: 0,
            feedbackCorrect: 'Degree 4, so at most 3 turning points.',
          },
          {
            label: 'c',
            type: 'mc',
            prompt: 'At x = 2, the graph',
            choices: ['crosses', 'bounces', 'has a hole', 'has a vertical asymptote'],
            answer: 'B',
          },
        ],
      },
      {
        id: 7,
        points: 1,
        topic: 'Rational asymptotes',
        type: 'multipart',
        prompt: 'For r(x) = (2x + 6) / (x − 3), enter each asymptote as an equation such as x = 3 or y = 2.',
        parts: [
          { label: 'a', type: 'text', prompt: 'Vertical asymptote', answer: 'x=3', accept: ['x = 3'] },
          { label: 'b', type: 'text', prompt: 'Horizontal asymptote', answer: 'y=2', accept: ['y = 2'] },
        ],
        feedbackCorrect: 'The denominator is zero at x = 3, and the leading-coefficient ratio is 2/1.',
      },
      {
        id: 8,
        points: 1,
        topic: 'Rational asymptotes',
        type: 'multipart',
        prompt: 'For h(x) = N(x)/D(x), which rule gives the horizontal asymptote in each case?',
        parts: [
          {
            label: 'a',
            type: 'mc',
            prompt: 'Degree of N is less than degree of D',
            choices: ['y = 0', 'y = 1', 'no horizontal asymptote', 'y = x'],
            answer: 'A',
          },
          {
            label: 'b',
            type: 'mc',
            prompt: 'Degree of N equals degree of D',
            choices: [
              'y = (leading coefficient of N) / (leading coefficient of D)',
              'y = 0',
              'no horizontal asymptote',
              'y = 1 for every such function',
            ],
            answer: 'A',
          },
          {
            label: 'c',
            type: 'mc',
            prompt: 'Degree of N is greater than degree of D',
            choices: ['no horizontal asymptote', 'y = 0', 'y = 1', 'a vertical asymptote y = x'],
            answer: 'A',
          },
        ],
      },
      {
        id: 9,
        points: 1,
        topic: 'Polynomial end behavior',
        type: 'multipart',
        prompt: 'For f(x) = 2x⁵ − 10x³, factor completely and describe the ends. For the candidate x-values, the key lists the zeros.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Factored form',
            answer: '2x^3(x^2-5)',
            accept: ['2x^3(x-sqrt(5))(x+sqrt(5))', '2x^3(x+sqrt(5))(x-sqrt(5))'],
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 0, mult: 3 },
                  { root: Math.sqrt(5), mult: 1 },
                  { root: -Math.sqrt(5), mult: 1 },
                ],
                'pos',
              ) && close(parseFactored(response)?.leading ?? NaN, 2, 1e-6),
            feedbackWrong: 'One form is 2x³(x² − 5), or 2x³(x − √5)(x + √5).',
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Zeros (the key’s candidate x-values), in any order',
            answer: '-sqrt(5), 0, sqrt(5)',
            check: (response) => sameSet(response, [-Math.sqrt(5), 0, Math.sqrt(5)], 0.05),
          },
          { label: 'c', type: 'text', prompt: 'As x → −∞, f(x) →', ...negInf },
          { label: 'd', type: 'text', prompt: 'As x → +∞, f(x) →', ...posInf },
        ],
        feedbackCorrect: 'Degree 5 and leading coefficient 2: left end −∞, right end +∞. Zeros are −√5, 0, and √5.',
      },
      {
        id: 10,
        points: 1,
        topic: 'Polynomial end behavior',
        type: 'text',
        prompt:
          'The end behavior is: as x → +∞, f(x) → −∞, and as x → −∞, f(x) → +∞. Enter every true letter, separated by commas. (A) The degree is odd. (B) The degree is even. (C) The leading coefficient is negative. (D) The leading coefficient is positive. (E) The polynomial has at least one real zero.',
        answer: 'A, C, E',
        check: (response) => lettersAre(response, 'ACE'),
        feedbackCorrect: 'Opposite ends mean odd degree. The right end falls, so the leading coefficient is negative. An odd-degree polynomial has at least one real zero.',
        feedbackWrong: 'Select A, C, and E.',
      },
      {
        id: 11,
        points: 1,
        topic: 'Zeros and the Rational Root Theorem',
        type: 'multipart',
        prompt:
          'For q(x) = 3x³ − 4x² − 5x + 2, list every possible rational zero, then find the actual zeros. (Use the coefficient −5 so the rational zeros match the answer key’s synthetic division.)',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Possible rational zeros',
            answer: '±1, ±2, ±1/3, ±2/3',
            check: (response) => sameSet(response, [1, -1, 2, -2, 1 / 3, -1 / 3, 2 / 3, -2 / 3], 0.001),
            feedbackWrong: 'Possible rational zeros: ±1, ±2, ±1/3, ±2/3.',
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Actual zeros, in any order',
            answer: '2, -1, 1/3',
            check: (response) => sameSet(response, [2, -1, 1 / 3], 0.001),
            feedbackWrong: 'The zeros are x = 2, x = −1, and x = 1/3.',
          },
        ],
      },
      {
        id: 12,
        points: 1,
        topic: 'Zeros and multiplicity',
        type: 'multipart',
        prompt:
          'A degree-6 polynomial has zeros x = 2 (multiplicity 3), x = −1 (multiplicity 2), and x = 5 (multiplicity 1). Use leading coefficient 1.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Factored form',
            answer: '(x-2)^3(x+1)^2(x-5)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 2, mult: 3 },
                  { root: -1, mult: 2 },
                  { root: 5, mult: 1 },
                ],
                'one',
              ),
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Zero where the graph bounces',
            answer: 'x=-1',
            accept: ['-1', 'x = -1'],
            check: (response) => sameSet(response, [-1], 0),
          },
          {
            label: 'c',
            type: 'text',
            prompt: 'Zero where the graph flattens and crosses',
            answer: 'x=2',
            accept: ['2', 'x = 2'],
            check: (response) => sameSet(response, [2], 0),
          },
        ],
      },
      {
        id: 13,
        points: 1,
        topic: 'Graphing polynomials',
        type: 'multipart',
        prompt:
          'Record the key features of f(x) = −(x + 2)(x − 1)²(x − 4). A sketch is not collected here; these features are what the sketch must show.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'x-intercepts',
            answer: '-2, 1, 4',
            check: (response) => sameSet(response, [-2, 1, 4], 0),
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'y-intercept as a point or y-value',
            answer: '(0, 8)',
            accept: ['8', '0, 8'],
            check: (response) => samePair(response, 0, 8, 0) || sameSet(response, [8], 0),
          },
          {
            label: 'c',
            type: 'mc',
            prompt: 'At x = 1 the graph',
            choices: ['bounces', 'crosses', 'has a hole', 'has a vertical asymptote'],
            answer: 'A',
          },
          {
            label: 'd',
            type: 'mc',
            prompt: 'Both ends go',
            choices: ['down', 'up', 'left down and right up', 'left up and right down'],
            answer: 'A',
          },
        ],
        feedbackCorrect: 'Degree 4 with a negative leading coefficient. Bounce at x = 1, and y-intercept (0, 8).',
      },
      {
        id: 14,
        points: 1,
        topic: 'Graphing polynomials',
        type: 'multipart',
        prompt:
          'A graph crosses the x-axis at x = −3, bounces at x = 1, crosses at x = 4, and both ends go to −∞.',
        parts: [
          { label: 'a', type: 'numeric', prompt: 'Minimum possible degree', answer: 4, tolerance: 0 },
          {
            label: 'b',
            type: 'text',
            prompt: 'One possible equation',
            answer: '-(x+3)(x-1)^2(x-4)',
            check: graphFeatures,
            feedbackWrong: 'One equation is f(x) = −(x + 3)(x − 1)²(x − 4).',
          },
        ],
      },
      {
        id: 15,
        points: 1,
        topic: 'Rational asymptotes',
        type: 'multipart',
        prompt: 'For r(x) = (x² − 4) / (x² − x − 6):',
        parts: [
          { label: 'a', type: 'text', prompt: 'Vertical asymptote', answer: 'x=3', accept: ['x = 3'] },
          { label: 'b', type: 'text', prompt: 'Horizontal asymptote', answer: 'y=1', accept: ['y = 1'] },
          {
            label: 'c',
            type: 'text',
            prompt: 'Hole, as an ordered pair',
            answer: '(-2, 4/5)',
            accept: ['(-2, 0.8)'],
            check: (response) => samePair(response, -2, 0.8, 0.02),
          },
          {
            label: 'd',
            type: 'text',
            prompt: 'x-intercept',
            answer: 'x=2',
            accept: ['2', 'x = 2'],
            check: (response) => sameSet(response, [2], 0),
          },
        ],
        feedbackCorrect: 'Cancel (x + 2) to get a hole at (−2, 4/5). The simplified function is (x − 2)/(x − 3).',
      },
      {
        id: 16,
        points: 1,
        topic: 'Rational asymptotes',
        type: 'text',
        prompt: 'Enter the oblique asymptote of s(x) = (2x² + 3x − 5) / (x + 1) as y = mx + b.',
        answer: 'y=2x+1',
        accept: ['2x+1', 'y = 2x + 1'],
        check: (response) => matchLine(response, 2, 1),
        feedbackCorrect: 'Polynomial division gives quotient 2x + 1 and remainder −6.',
        feedbackWrong: 'The oblique asymptote is y = 2x + 1.',
      },
      {
        id: 17,
        points: 1,
        topic: 'Polynomial end behavior',
        type: 'multipart',
        prompt:
          'Give two different pairs (a, n) so that f(x) = axⁿ + … has both ends going to −∞. Enter each pair as a, n. Use a negative a and a positive even n.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Example 1',
            answer: '-1, 2',
            check: evenNegativePair,
            feedbackWrong: 'Any negative a and positive even n works, such as a = −1, n = 2.',
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Example 2',
            answer: '-3, 4',
            check: evenNegativePair,
            feedbackWrong: 'Any negative a and positive even n works, such as a = −3, n = 4.',
          },
        ],
      },
      {
        id: 18,
        points: 1,
        topic: 'Zeros and multiplicity',
        type: 'multipart',
        prompt:
          'A degree-5 polynomial with positive leading coefficient touches the x-axis at x = −2 and x = 1 (it does not cross there) and crosses at x = 3. It has no other real zeros.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Multiplicities of −2, 1, and 3, in that order',
            answer: '2, 2, 1',
            accept: ['2,2,1'],
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Factored form with positive leading coefficient',
            answer: '(x+2)^2(x-1)^2(x-3)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: -2, mult: 2 },
                  { root: 1, mult: 2 },
                  { root: 3, mult: 1 },
                ],
                'pos',
              ),
          },
          { label: 'c', type: 'text', prompt: 'As x → +∞, f(x) →', ...posInf },
          { label: 'd', type: 'text', prompt: 'As x → −∞, f(x) →', ...negInf },
        ],
      },
      {
        id: 19,
        points: 1,
        topic: 'Graphing polynomials',
        type: 'multipart',
        prompt: 'Monthly profit, in thousands, is P(x) = −x³ + 6x² − 9x, where x = 0 is January.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Factor completely',
            answer: '-x(x-3)^2',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 0, mult: 1 },
                  { root: 3, mult: 2 },
                ],
                'neg',
              ),
            feedbackWrong: 'P(x) = −x(x − 3)².',
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'x-values where profit is zero',
            answer: '0, 3',
            check: (response) => sameSet(response, [0, 3], 0),
          },
          {
            label: 'c',
            type: 'text',
            prompt: 'For x > 0, the interval where profit is positive (type none if it never is)',
            answer: 'none',
            check: (response) => isNone(response) || /^never|nowhere|no interval|not positive|no positive/.test(String(response).toLowerCase()),
            feedbackWrong: 'For x > 0, −x is negative and (x − 3)² is nonnegative, so profit is never positive.',
          },
          {
            label: 'd',
            type: 'numeric',
            prompt: 'x-value of the local maximum',
            answer: 1,
            tolerance: 0,
          },
          {
            label: 'e',
            type: 'numeric',
            prompt: 'Profit at that local maximum, in thousands',
            answer: -4,
            tolerance: 0,
            answerDisplay: '−4',
          },
        ],
      },
      {
        id: 20,
        points: 1,
        topic: 'Graphing polynomials',
        type: 'multipart',
        prompt: 'Local maximum compared with absolute maximum.',
        parts: [
          {
            label: 'a',
            type: 'mc',
            prompt: 'Which statement is true?',
            choices: [
              'A local maximum is only larger than nearby values. An absolute maximum is the greatest value on the whole domain.',
              'A local maximum and an absolute maximum are the same idea.',
              'An absolute maximum only has to beat nearby values.',
              'A polynomial always has an absolute maximum.',
            ],
            answer: 'A',
          },
          {
            label: 'b',
            type: 'mc',
            prompt: 'Which polynomial has a local maximum but no absolute maximum?',
            choices: ['f(x) = −x³ + 3x', 'f(x) = −x²', 'f(x) = −x⁴ + x²', 'f(x) = x² − 1'],
            answer: 'A',
            feedbackCorrect: 'Odd degree sends one end to +∞, so there is no absolute maximum. f(1) = 2 is a local maximum.',
          },
        ],
      },
      {
        id: 21,
        points: 1,
        topic: 'Rational asymptotes',
        type: 'multipart',
        prompt: 'Analyze f(x) = (3x² − 12) / (x² − 5x + 6).',
        parts: [
          { label: 'a', type: 'text', prompt: 'Vertical asymptote', answer: 'x=3', accept: ['x = 3'] },
          { label: 'b', type: 'text', prompt: 'Horizontal asymptote', answer: 'y=3', accept: ['y = 3'] },
          {
            label: 'c',
            type: 'text',
            prompt: 'Hole, as an ordered pair',
            answer: '(2, -12)',
            check: (response) => samePair(response, 2, -12, 0),
          },
          {
            label: 'd',
            type: 'text',
            prompt: 'x-intercept',
            answer: 'x=-2',
            accept: ['-2', 'x = -2'],
            check: (response) => sameSet(response, [-2], 0),
          },
          {
            label: 'e',
            type: 'numeric',
            prompt: 'y-intercept (the y-value)',
            answer: -2,
            tolerance: 0,
            answerDisplay: '−2',
          },
          {
            label: 'f',
            type: 'text',
            prompt: 'Domain',
            answer: 'all real x except 2 and 3',
            accept: ['x≠2 and x≠3', '(-inf,2)U(2,3)U(3,inf)', '(-infinity,2) U (2,3) U (3,infinity)'],
            check: (response) => {
              const features = String(response).toLowerCase()
              const mentions = features.includes('2') && features.includes('3')
              const excludes = /except|≠|!=|not|undefined|exclude/.test(features) || features.includes('inf')
              return mentions && excludes
            },
          },
        ],
        feedbackCorrect: 'Cancel (x − 2) to get a hole at (2, −12). Then f(x) = 3(x + 2)/(x − 3).',
      },
      {
        id: 22,
        points: 1,
        topic: 'Holes',
        type: 'multipart',
        prompt: 'At the given x-value, is the discontinuity a hole or a vertical asymptote?',
        parts: [
          {
            label: 'a',
            type: 'mc',
            prompt: 'f(x) = (x² − 9)/(x − 3) at x = 3',
            choices: ['hole', 'vertical asymptote'],
            answer: 'A',
            feedbackCorrect: '(x − 3) cancels, leaving x + 3.',
          },
          {
            label: 'b',
            type: 'mc',
            prompt: 'g(x) = (x + 2)/(x² − 4) at x = 2',
            choices: ['hole', 'vertical asymptote'],
            answer: 'B',
            feedbackCorrect: '(x + 2) cancels, but (x − 2) stays in the denominator.',
          },
          {
            label: 'c',
            type: 'mc',
            prompt: 'h(x) = (x² − x − 6)/(x² − 9) at x = 3',
            choices: ['hole', 'vertical asymptote'],
            answer: 'A',
            feedbackCorrect: '(x − 3) cancels.',
          },
        ],
      },
      {
        id: 23,
        points: 1,
        topic: 'Holes',
        type: 'multipart',
        prompt: 'Find the hole and the remaining vertical asymptote of r(x) = (2x² − 8x) / (x² − 5x + 4).',
        parts: [
          { label: 'a', type: 'numeric', prompt: 'x-coordinate of the hole', answer: 4, tolerance: 0 },
          {
            label: 'b',
            type: 'numeric',
            prompt: 'y-coordinate of the hole',
            answer: 8 / 3,
            tolerance: 0.02,
            answerDisplay: '8/3',
          },
          { label: 'c', type: 'text', prompt: 'Remaining vertical asymptote', answer: 'x=1', accept: ['x = 1', '1'] },
        ],
        feedbackCorrect: 'Cancel (x − 4). The simplified function is 2x/(x − 1), so the hole is (4, 8/3).',
      },
      {
        id: 24,
        points: 1,
        topic: 'Holes',
        type: 'multipart',
        prompt:
          'A student says: “If I cancel a common factor, the simplified function is identical to the original.”',
        parts: [
          {
            label: 'a',
            type: 'mc',
            prompt: 'The student is',
            choices: ['incorrect', 'correct'],
            answer: 'A',
          },
          {
            label: 'b',
            type: 'mc',
            prompt: 'Why?',
            choices: [
              'The original function is still undefined at the canceled x-value, so the graphs differ by a hole.',
              'Canceling a factor changes the horizontal asymptote.',
              'The simplified function always has a vertical asymptote at that x-value.',
              'The two functions match at every x-value, including the canceled one.',
            ],
            answer: 'A',
            feedbackCorrect: 'For example, (x² − 4)/(x − 2) simplifies to x + 2 but is undefined at x = 2. The hole is (2, 4).',
          },
        ],
      },
      {
        id: 25,
        points: 1,
        topic: 'Polynomial end behavior',
        type: 'text',
        prompt:
          'Graphing calculator allowed from here on. Enter one factored polynomial that is even, has degree 4, has a negative leading coefficient, and has exactly two distinct real zeros. Example shape: −(x − 2)²(x + 2)².',
        answer: '-(x-2)^2(x+2)^2',
        accept: ['-(x^2-4)^2', '-(x^2-4)(x^2+1)'],
        check: evenDegreeFour,
        feedbackCorrect: 'Even functions are symmetric about the y-axis, so the real zeros come in ± pairs. Both ends go down.',
        feedbackWrong: 'One valid equation is f(x) = −(x − 2)²(x + 2)². Another is −(x² − 4)².',
      },
      {
        id: 26,
        points: 1,
        topic: 'Zeros and the Factor Theorem',
        type: 'multipart',
        prompt: 'p(x) = x⁴ + 2x³ − 7x² − 8x + 12. x = −3 is a zero.',
        parts: [
          {
            label: 'a',
            type: 'numeric',
            prompt: 'Remainder when p(x) is divided by (x + 3)',
            answer: 0,
            tolerance: 0,
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Completely factored form, leading coefficient 1',
            answer: '(x+3)(x-1)(x-2)(x+2)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: -3, mult: 1 },
                  { root: 1, mult: 1 },
                  { root: 2, mult: 1 },
                  { root: -2, mult: 1 },
                ],
                'one',
              ),
          },
          {
            label: 'c',
            type: 'text',
            prompt: 'All zeros',
            answer: '-3, -2, 1, 2',
            check: (response) => sameSet(response, [-3, -2, 1, 2], 0),
          },
        ],
      },
      {
        id: 27,
        points: 1,
        topic: 'Polynomial inequality',
        type: 'multipart',
        prompt: 'Solve x³ − x² − 4x + 4 ≤ 0.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Critical values',
            answer: '-2, 1, 2',
            check: (response) => sameSet(response, [-2, 1, 2], 0),
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Solution in interval notation',
            answer: '(-inf, -2] U [1, 2]',
            check: (response) => sameIntervalUnion(response, ['(-inf,-2]', '[1,2]']),
            feedbackWrong: 'Include the zeros. The solution is (−∞, −2] ∪ [1, 2].',
          },
        ],
        feedbackCorrect: 'Factored form: (x − 2)(x + 2)(x − 1).',
      },
      {
        id: 28,
        points: 1,
        topic: 'Rational asymptotes',
        type: 'multipart',
        prompt:
          'Analyze f(x) = (x² + 2x − 8) / (x² − 9). For one-sided behavior, list the left side and then the right side, using -inf or +inf.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Vertical asymptotes',
            answer: 'x=-3, x=3',
            check: (response) => sameSet(response, [-3, 3], 0),
          },
          { label: 'b', type: 'text', prompt: 'Horizontal asymptote', answer: 'y=1', accept: ['y = 1', '1'] },
          {
            label: 'c',
            type: 'text',
            prompt: 'Holes',
            answer: 'none',
            check: isNone,
          },
          {
            label: 'd',
            type: 'text',
            prompt: 'x-intercepts',
            answer: '-4, 2',
            check: (response) => sameSet(response, [-4, 2], 0),
          },
          {
            label: 'e',
            type: 'numeric',
            prompt: 'y-intercept (the y-value)',
            answer: 8 / 9,
            tolerance: 0.02,
            answerDisplay: '8/9',
          },
          {
            label: 'f',
            type: 'text',
            prompt: 'Near x = 3: left, right',
            answer: '-inf, +inf',
            check: (response) => leftRight(response, -1, 1),
          },
          {
            label: 'g',
            type: 'text',
            prompt: 'Near x = −3: left, right',
            answer: '-inf, +inf',
            check: (response) => leftRight(response, -1, 1),
          },
        ],
        feedbackCorrect: 'No common factors. On both vertical asymptotes the function goes to −∞ from the left and +∞ from the right.',
      },
      {
        id: 29,
        points: 1,
        topic: 'Holes',
        type: 'text',
        prompt:
          'Enter a factored rational function with a vertical asymptote at x = 5, a hole at x = −2, horizontal asymptote y = 3, and x-intercept x = 1. Use a form like 3(x−1)(x+2)/((x−5)(x+2)).',
        answer: '3(x-1)(x+2)/((x-5)(x+2))',
        check: (response) =>
          matchesRational(response, { degN: 2, degD: 2, ratio: 3, holes: [-2], vas: [5], zeros: [1] }) ||
          matchesRational(response, { ratio: 3, holes: [-2], vas: [5], zeros: [1] }),
        feedbackCorrect: 'Equal degrees with leading ratio 3, a shared factor (x + 2), (x − 5) only in the denominator, and (x − 1) only in the numerator.',
        feedbackWrong:
          'One answer is 3(x − 1)(x + 2) / ((x − 5)(x + 2)). Equal degrees, leading ratio 3, hole at x = −2, VA at x = 5, zero at x = 1.',
      },
      {
        id: 30,
        points: 1,
        topic: 'Rational inequality',
        type: 'multipart',
        prompt: 'Solve (x + 3)/(x − 1) ≥ 2.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Critical values (zero and undefined value)',
            answer: '1, 5',
            check: (response) => sameSet(response, [1, 5], 0),
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Solution in interval notation',
            answer: '(1, 5]',
            check: (response) => sameIntervalUnion(response, ['(1,5]']),
            feedbackWrong: 'x = 1 is undefined, so it is excluded. x = 5 is included. Solution: (1, 5].',
          },
        ],
      },
      {
        id: 31,
        points: 1,
        topic: 'Surface area model',
        extension: true,
        type: 'multipart',
        prompt:
          'A storage box has a square base. The height is 3 cm less than the side of the base, and the total surface area, including the bottom and not including a top, is 294 cm². Let x be the side length in centimeters.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Surface-area equation',
            answer: '5x^2-12x=294',
            accept: ['x^2+4x(x-3)=294', '5x^2 - 12x = 294'],
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Standard form, equal to 0',
            answer: '5x^2-12x-294=0',
            accept: ['5x^2 - 12x - 294 = 0'],
          },
          {
            label: 'c',
            type: 'numeric',
            prompt: 'Side length x, in cm (nearest hundredth is fine)',
            answer: (12 + Math.sqrt(6024)) / 10,
            tolerance: 0.05,
            answerDisplay: '8.96 cm',
          },
          {
            label: 'd',
            type: 'numeric',
            prompt: 'Height, in cm',
            answer: (12 + Math.sqrt(6024)) / 10 - 3,
            tolerance: 0.05,
            answerDisplay: '5.96 cm',
          },
        ],
        feedbackCorrect: 'SA = x² + 4x(x − 3) = 5x² − 12x = 294. The positive root is about 8.96 cm.',
      },
      {
        id: 32,
        points: 1,
        topic: 'Drug concentration',
        extension: true,
        type: 'multipart',
        prompt: 'C(t) = 5t / (t² + 4) for t ≥ 0, with concentration in mg/L.',
        parts: [
          { label: 'a', type: 'text', prompt: 'Horizontal asymptote', answer: 'y=0', accept: ['y = 0', '0'] },
          {
            label: 'b',
            type: 'mc',
            prompt: 'What does the horizontal asymptote mean?',
            choices: [
              'As time goes on, the concentration approaches 0.',
              'The concentration approaches 5 mg/L.',
              'The drug concentration becomes undefined for large t.',
              'The maximum concentration is 0.',
            ],
            answer: 'A',
          },
          {
            label: 'c',
            type: 'text',
            prompt: 'Vertical asymptotes for t ≥ 0',
            answer: 'none',
            check: isNone,
          },
          { label: 'd', type: 'numeric', prompt: 't that maximizes C(t)', answer: 2, tolerance: 0.05 },
          {
            label: 'e',
            type: 'numeric',
            prompt: 'Maximum concentration',
            answer: 1.25,
            tolerance: 0.02,
            answerDisplay: '1.25 mg/L',
          },
          {
            label: 'f',
            type: 'text',
            prompt: 'Values of t with C(t) ≥ 1',
            answer: '[1, 4]',
            check: (response) => sameIntervalUnion(response, ['[1,4]']),
            feedbackWrong: 'Solving 5t/(t² + 4) ≥ 1 gives [1, 4].',
          },
        ],
      },
      {
        id: 33,
        points: 1,
        topic: 'Polynomial and rational combined',
        extension: true,
        type: 'multipart',
        prompt: 'Let f(x) = (x³ − x² − 4x + 4) / (x² − 5x + 6).',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Numerator, fully factored',
            answer: '(x-1)(x-2)(x+2)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 1, mult: 1 },
                  { root: 2, mult: 1 },
                  { root: -2, mult: 1 },
                ],
                'one',
              ),
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Denominator, factored',
            answer: '(x-2)(x-3)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 2, mult: 1 },
                  { root: 3, mult: 1 },
                ],
                'one',
              ),
          },
          {
            label: 'c',
            type: 'text',
            prompt: 'Hole, as an ordered pair',
            answer: '(2, -4)',
            check: (response) => samePair(response, 2, -4, 0),
          },
          { label: 'd', type: 'text', prompt: 'Vertical asymptote', answer: 'x=3', accept: ['x = 3'] },
          {
            label: 'e',
            type: 'text',
            prompt: 'Oblique asymptote',
            answer: 'y=x+4',
            check: (response) => matchLine(response, 1, 4),
            feedbackWrong: 'After canceling (x − 2), the quotient of (x² + x − 2) ÷ (x − 3) is y = x + 4.',
          },
        ],
      },
      {
        id: 34,
        points: 1,
        topic: 'Rational inequality',
        extension: true,
        type: 'multipart',
        prompt: 'Solve (x² − 4) / (x² − x − 6) < 0. Account for the hole.',
        parts: [
          {
            label: 'a',
            type: 'numeric',
            prompt: 'x-value of the hole',
            answer: -2,
            tolerance: 0,
            answerDisplay: '−2',
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Solution set',
            answer: '(2, 3)',
            check: (response) => sameIntervalUnion(response, ['(2,3)']),
            feedbackWrong: 'After canceling (x + 2), solve (x − 2)/(x − 3) < 0. Both 2 and 3 are excluded. Solution: (2, 3). The hole x = −2 is also excluded.',
          },
        ],
      },
      {
        id: 35,
        points: 1,
        topic: 'Building a rational function',
        extension: true,
        type: 'multipart',
        prompt:
          'R(x) = P(x)/Q(x) has degree 3 over degree 2, exactly one vertical asymptote at x = 4, a hole at x = −1 with y-coordinate 2, and zeros at x = 0 and x = 3.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'A possible Q(x)',
            answer: '(x-4)(x+1)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 4, mult: 1 },
                  { root: -1, mult: 1 },
                ],
                'any',
              ),
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'A possible P(x) with the leading coefficient the key uses when Q is monic',
            answer: '(-5/2)x(x-3)(x+1)',
            check: (response) => {
              const parsed = parseFactored(response)
              if (!parsed) return false
              return (
                exactZeros(
                  response,
                  [
                    { root: 0, mult: 1 },
                    { root: 3, mult: 1 },
                    { root: -1, mult: 1 },
                  ],
                  'neg',
                ) && close(parsed.leading, -2.5, 0.02)
              )
            },
          },
          {
            label: 'c',
            type: 'text',
            prompt: 'R(x) in factored form',
            answer: '(-5/2)x(x-3)(x+1)/((x-4)(x+1))',
            check: (response) =>
              matchesRational(response, {
                degN: 3,
                degD: 2,
                ratio: -2.5,
                holes: [-1],
                vas: [4],
                zeros: [0, 3],
              }),
          },
          {
            label: 'd',
            type: 'text',
            prompt: 'Oblique asymptote',
            answer: 'y=(-5/2)x-5/2',
            accept: ['y=-2.5x-2.5', 'y=(-5/2)(x+1)'],
            check: (response) => matchLine(response, -2.5, -2.5),
            feedbackWrong: 'The oblique asymptote is y = −(5/2)x − 5/2.',
          },
        ],
      },
      {
        id: 36,
        points: 2,
        topic: 'Open-top box',
        extension: true,
        type: 'multipart',
        prompt:
          'Equal squares of side x are cut from a 12 in by 18 in sheet and the sides are folded up to make an open box.',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'Volume V(x)',
            answer: 'x(18-2x)(12-2x)',
            accept: ['4x(9-x)(6-x)', '4x^3-60x^2+216x', '4x^3 - 60x^2 + 216x'],
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Domain from the physical constraints',
            answer: '(0, 6)',
            accept: ['0<x<6'],
            check: (response) => openBounds(response, 0, 6),
          },
          {
            label: 'c',
            type: 'mc',
            prompt: 'Why is the volume 0 at the ends of the domain?',
            choices: [
              'x = 0 means no height, and x = 6 means the width is 0.',
              'Both ends are vertical asymptotes.',
              'The volume is 0 because the leading coefficient is negative.',
              'The sheet has no area at those values of x.',
            ],
            answer: 'A',
          },
          {
            label: 'd',
            type: 'numeric',
            prompt: 'x that maximizes the volume, in inches',
            answer: 5 - Math.sqrt(7),
            tolerance: 0.05,
            answerDisplay: 'about 2.35 in',
          },
          {
            label: 'e',
            type: 'numeric',
            prompt: 'Maximum volume, in cubic inches',
            answer: 228.16,
            tolerance: 3,
            answerDisplay: 'about 228',
          },
        ],
      },
      {
        id: 37,
        points: 2,
        topic: 'Polynomial compared with a quotient',
        extension: true,
        type: 'multipart',
        prompt: 'f(x) = x³ − 3x² − 10x + 24 and g(x) = f(x)/(x − 4).',
        parts: [
          {
            label: 'a',
            type: 'text',
            prompt: 'f(x), fully factored',
            answer: '(x-2)(x-4)(x+3)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 2, mult: 1 },
                  { root: 4, mult: 1 },
                  { root: -3, mult: 1 },
                ],
                'one',
              ),
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Simplified g(x), not including the excluded x-value',
            answer: '(x-2)(x+3)',
            check: (response) =>
              exactZeros(
                response,
                [
                  { root: 2, mult: 1 },
                  { root: -3, mult: 1 },
                ],
                'one',
              ),
          },
          {
            label: 'c',
            type: 'text',
            prompt: 'Domain of g',
            answer: 'all real x except 4',
            accept: ['x≠4', '(-inf,4)U(4,inf)'],
            check: (response) => {
              const s = String(response).toLowerCase()
              return s.includes('4') && (/except|≠|!=|not|undefined/.test(s) || s.includes('inf'))
            },
          },
          {
            label: 'd',
            type: 'mc',
            prompt: 'g is',
            choices: [
              'a rational function with a hole, even though it simplifies to a polynomial',
              'a polynomial, because the factor cancels',
              'a vertical asymptote at x = 4',
              'undefined for every x',
            ],
            answer: 'A',
          },
          {
            label: 'e',
            type: 'numeric',
            prompt: 'y-value of the hole',
            answer: 14,
            tolerance: 0,
          },
        ],
        feedbackCorrect: 'g(x) = (x − 2)(x + 3) for x ≠ 4, so the hole is (4, 14).',
      },
      {
        id: 38,
        points: 2,
        topic: 'Degree and behavior',
        extension: true,
        type: 'multipart',
        prompt: 'Decide whether each statement is true or false.',
        parts: [
          {
            label: 'a',
            type: 'mc',
            prompt: 'Every odd-degree polynomial with real coefficients has at least one real zero.',
            choices: ['True', 'False'],
            answer: 'A',
            feedbackCorrect: 'The ends go to opposite infinities, so the graph crosses the x-axis.',
            feedbackWrong: 'True. Opposite end behavior and continuity force an x-intercept.',
          },
          {
            label: 'b',
            type: 'mc',
            prompt: 'A polynomial of degree n has exactly n distinct real zeros.',
            choices: ['True', 'False'],
            answer: 'B',
            feedbackCorrect: 'False. x² + 1 has degree 2 and no real zeros. x² has one distinct real zero.',
            feedbackWrong: 'False. A counterexample is x² + 1, or x² (one distinct real zero).',
          },
          {
            label: 'c',
            type: 'mc',
            prompt: 'A rational function can have at most one horizontal asymptote.',
            choices: ['True', 'False'],
            answer: 'A',
            feedbackCorrect: 'The end behavior on both sides is set by the same ratio of leading terms.',
            feedbackWrong: 'True. Both ends follow the ratio of the leading terms.',
          },
        ],
      },
      {
        id: 39,
        points: 2,
        topic: 'Population model',
        extension: true,
        type: 'multipart',
        prompt: 'P(t) = −0.2t⁴ + 3.2t³ − 14.4t² + 16t + 80 for 0 ≤ t ≤ 12, in thousands of people.',
        parts: [
          {
            label: 'a',
            type: 'numeric',
            prompt: 'Population at t = 0, in thousands',
            answer: 80,
            tolerance: 0,
          },
          {
            label: 'b',
            type: 'text',
            prompt: 'Factor out −0.2 from the whole expression',
            answer: '-0.2(t^4-16t^3+72t^2-80t-400)',
            check: populationFactor,
            feedbackWrong: 'P(t) = −0.2(t⁴ − 16t³ + 72t² − 80t − 400).',
          },
          {
            label: 'c',
            type: 'mc',
            prompt: 'What does the end behavior say near t = 12?',
            choices: [
              'Both ends go to −∞, so by t = 12 the model is falling toward a negative population and is no longer realistic.',
              'Both ends go to +∞, so the town keeps growing.',
              'There is a horizontal asymptote y = 80.',
              'Degree 4 with a negative leading coefficient means the population stays above 80.',
            ],
            answer: 'A',
          },
          {
            label: 'd',
            type: 'mc',
            prompt: 'How can you estimate the time of the maximum population without relying on a calculator answer?',
            choices: [
              'Find where the rate of change switches from positive to negative, or compare values in a table.',
              'The maximum is always the constant term.',
              'The maximum is the leading coefficient.',
              'The maximum must be at t = 12.',
            ],
            answer: 'A',
          },
        ],
      },
      {
        id: 40,
        points: 2,
        topic: 'Design a rational function',
        extension: true,
        type: 'multipart',
        prompt:
          'Design a rational function with numerator degree 3, denominator degree 3, exactly two vertical asymptotes, exactly one hole, horizontal asymptote y = −2, and at least one negative x-intercept. Enter it in factored form, with an integer leading coefficient, such as −2(x−1)(x+1)(x−5)/((x−1)(x−2)(x−3)).',
        parts: [
          { label: 'a', type: 'numeric', prompt: 'Required ratio of the leading coefficients', answer: -2, tolerance: 0, answerDisplay: '−2' },
          {
            label: 'b',
            type: 'text',
            prompt: 'Your function R(x)',
            answer: '-2(x-1)(x+1)(x-5)/((x-1)(x-2)(x-3))',
            check: (response) =>
              matchesRational(response, {
                degN: 3,
                degD: 3,
                ratio: -2,
                minNegativeZero: true,
              }) &&
              rationalFeatures(response)?.holes.length === 1 &&
              rationalFeatures(response)?.vas.length === 2,
            feedbackCorrect: 'Equal degrees with ratio −2, one fully canceled factor, two factors left in the denominator, and a negative uncancelled zero.',
            feedbackWrong:
              'Use equal degree 3, leading ratio −2, one shared factor for the hole, two uncancelled denominator factors, and a negative x-intercept. One example is −2(x−1)(x+1)(x−5)/((x−1)(x−2)(x−3)).',
          },
        ],
      },
    ],
  }

  global.UNIT1 = UNIT1
  if (typeof module !== 'undefined') module.exports = UNIT1
})(typeof window !== 'undefined' ? window : globalThis)

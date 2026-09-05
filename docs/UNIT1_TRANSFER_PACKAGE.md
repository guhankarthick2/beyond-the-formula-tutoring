# AP Precalculus Unit 1 — Transfer Package

Canonical machine-readable bank: `src/unit1/unit1-data.js` (`window.UNIT1`).  
Grader: `src/unit1/unit1-grader.js` (`Unit1Grader.gradeQuestion`, `Unit1Grader.scoreAll`).  
UI: `src/unit1/unit1-quiz.js` (`initUnit1Quiz(container)`).

**Scoring:** 40 questions · **45 points** (Q1–Q35 = 1 pt each; Q36–Q40 = 2 pt multipart).  
**Multipart partial credit:** ≥50% of parts correct → half points; all parts correct → full points.

**Live route:** `/students/precal/tests/unit-1`

---

## Full answer key

| Q | Pts | Type | Answer |
|---|-----|------|--------|
| 1 | 1 | MC | **A** — (20−12)/4 = 2 |
| 2 | 1 | MC | **B** — −∞ |
| 3 | 1 | numeric | **−5** |
| 4 | 1 | MC | **B** — 2·3ˣ |
| 5 | 1 | numeric | **7** |
| 6 | 1 | numeric | **4** — (9−1)/2 |
| 7 | 1 | MC | **A** — odd multiplicity |
| 8 | 1 | numeric | **40** |
| 9 | 1 | MC | **A** — both ends up |
| 10 | 1 | text | **(x-3)(x+3)** |
| 11 | 1 | MC | **A** — ±1/2 |
| 12 | 1 | MC | **C** — 0.88 |
| 13 | 1 | numeric | **1** — Remainder Theorem |
| 14 | 1 | MC | **A** — 2−i |
| 15 | 1 | MC | **A** — 3 right |
| 16 | 1 | numeric | **1** — quotient x+3 |
| 17 | 1 | numeric | **4** |
| 18 | 1 | MC | **A** — both ends down |
| 19 | 1 | numeric | **32** ft/s |
| 20 | 1 | numeric | **4** |
| 21 | 1 | MC | **A** — 2ˣ |
| 22 | 1 | text | **(x+3)(x+4)** |
| 23 | 1 | MC | **A** — True |
| 24 | 1 | numeric | **11** |
| 25 | 1 | MC | **A** — x=4 |
| 26 | 1 | MC | **A** |
| 27 | 1 | numeric | **1200** |
| 28 | 1 | MC | **A** |
| 29 | 1 | numeric | **0** |
| 30 | 1 | MC | **B** — 3 |
| 31 | 1 | numeric | **5** |
| 32 | 1 | MC | **A** — (−2,2) |
| 33 | 1 | MC | **A** — Linear |
| 34 | 1 | numeric | **4** |
| 35 | 1 | MC | **A** — logistic/bounded |
| 36 | 2 | multipart | **a)** x(x−2)(x+2) · **b)** 3 |
| 37 | 2 | multipart | **a)** 2 · **b)** Yes |
| 38 | 2 | multipart | **a)** 3 hours · **b)** 2000 |
| 39 | 2 | multipart | **a)** −2i · **b)** 2 |
| 40 | 2 | multipart | **a)** touches axis · **b)** −1 |

---

## Question details (multipart)

### Q36 — p(x) = x³ − 4x
- **a)** Factor: `x(x-2)(x+2)` (also accept `x(x+2)(x-2)`)
- **b)** Distinct real zeros: **3** (−2, 0, 2)

### Q37 — f(x) = x² − 3x on [1, 4]
- **a)** Average rate: (4−0)/3 = **2**
- **b)** Increasing on [1,4]? **Yes** (vertex at 1.5)

### Q38 — doubles every 3 h, starts 500
- **a)** Hours to first double: **3**
- **b)** After 6 h: **2000**

### Q39 — zeros 1, −1, 2i (real coefficients)
- **a)** Fourth zero: **−2i**
- **b)** Non-real zeros (with multiplicity): **2**

### Q40 — g(x) = (x−1)²(x+3)
- **a)** At x=1: **touches** (even multiplicity)
- **b)** Sum of zeros with multiplicity: 1+1+(−3) = **−1**

---

## Grader notes

- **MC:** compare letter A–D (case-insensitive).
- **Numeric:** tolerance default 0.001 unless `tolerance: 0`.
- **Text:** trimmed, lowercased; spaces and `*` ignored; optional `accept[]` aliases.
- **Multipart:** each part graded 0/1 internally; earned points = `points` if 100% parts, `points/2` if ≥50%, else 0.

---

## Standalone script load (optional)

```html
<script src="/unit1/unit1-data.js"></script>
<script src="/unit1/unit1-grader.js"></script>
<!-- unit1-quiz.js is bundled via Vite in the React app -->
```

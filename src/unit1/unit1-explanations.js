/** Step-by-step notes for the main Unit 1 polynomial and rational functions assessment. */
export const UNIT1_EXPLANATIONS = {
  1: {
    steps:
      'The degree is the highest power of x, which is 4. The leading coefficient is the number on that term, −3. An even degree sends both ends the same way, and a negative leading coefficient sends them down. So as x approaches either infinity, f(x) approaches −∞.',
    mistakes:
      'Only the highest-degree term controls the ends. The x² and −2x terms do not. Even degree does not mean the ends go in opposite directions.',
  },
  2: {
    steps:
      'The degree is 3, which is odd, so the ends go in opposite directions. The leading coefficient 5 is positive, so the right end goes up. The left end must go down. That is the same pattern as y = x³.',
    mistakes:
      'A positive leading coefficient means “up on both ends” only for even degree. Odd degree with a positive leading coefficient is down on the left and up on the right.',
  },
  3: {
    steps:
      'Each factor (x − a) is a zero at x = a, and the exponent is the multiplicity. (x − 3)² gives x = 3 with multiplicity 2. (x + 1) gives x = −1 with multiplicity 1. (x − 5) gives x = 5 with multiplicity 1. The multiplicities add to 4, which is the degree.',
    mistakes:
      'The factor (x − 3) is a zero at 3, not −3. The factor (x + 1) is a zero at −1.',
  },
  4: {
    steps:
      'A zero at −2 with multiplicity 1 is the factor (x + 2). A zero at 0 with multiplicity 2 is x². A zero at 4 with multiplicity 1 is (x − 4). One polynomial is x²(x + 2)(x − 4). Any nonzero constant times that polynomial is also correct.',
    mistakes:
      'The multiplicity-2 zero at 0 needs x², not a single factor of x.',
  },
  5: {
    steps:
      'Even multiplicity means the graph touches the x-axis and turns back: it bounces. Odd multiplicity greater than 1 still crosses, but the graph flattens through the axis instead of cutting it steeply.',
    mistakes:
      'Odd multiplicity greater than 1 still crosses. It does not bounce.',
  },
  6: {
    steps:
      'f(0) = 0, so the y-intercept is 0. The exponents 1 + 2 + 1 add to degree 4, and a degree-n polynomial has at most n − 1 turning points, so at most 3. The factor (x − 2) has exponent 2, so the graph bounces at x = 2.',
    mistakes:
      'Add the exponents before using the turning-point rule. A higher even power does not make the graph cross.',
  },
  7: {
    steps:
      'The denominator is zero at x = 3, and 2x + 6 = 2(x + 3) shares no factor with x − 3, so x = 3 is a vertical asymptote, not a hole. The degrees are equal, so the horizontal asymptote is the ratio of the leading coefficients, 2/1 = 2.',
    mistakes:
      'Check for a common factor before calling a denominator zero a vertical asymptote. A shared factor would be a hole.',
  },
  8: {
    steps:
      'If the numerator has lower degree, the fraction shrinks toward 0, so y = 0. If the degrees are equal, the ends settle at the ratio of the leading coefficients. If the numerator has higher degree, there is no horizontal asymptote. A difference of exactly 1 can give a slant asymptote.',
    mistakes:
      'A rational function does not always have a horizontal or slant asymptote. A slant asymptote needs the numerator degree to be exactly one more than the denominator degree.',
  },
  9: {
    steps:
      'Factor 2x⁵ − 10x³ as 2x³(x² − 5) = 2x³(x − √5)(x + √5). The zeros −√5, 0, and √5 are the candidate x-values on the key. The degree is 5 and the leading coefficient is positive, so the left end goes to −∞ and the right end goes to +∞.',
    mistakes:
      'Factor out 2x³ first. Those zeros are candidates for turning points; they are not automatically turning points.',
  },
  10: {
    steps:
      'Opposite ends mean the degree is odd, so A is true and B is false. The right end falls, so the leading coefficient is negative: C is true and D is false. A continuous graph that goes from +∞ to −∞ must cross the x-axis, so E is true.',
    mistakes:
      'Opposite ends are the odd-degree pattern, not the even-degree pattern. The Intermediate Value Theorem is why there is at least one real zero.',
  },
  11: {
    steps:
      'Possible rational zeros are factors of 2 over factors of 3: ±1, ±2, ±1/3, and ±2/3. For q(x) = 3x³ − 4x² − 5x + 2, x = 2 gives 24 − 16 − 10 + 2 = 0. Synthetic division then leaves 3x² + 2x − 1 = (3x − 1)(x + 1), so the zeros are 2, −1, and 1/3.',
    mistakes:
      'Include the fractional candidates when the leading coefficient is not 1. The printed −7x version does not have these rational zeros; the −5x coefficient is the one that matches this division.',
  },
  12: {
    steps:
      'The factored form with leading coefficient 1 is (x − 2)³(x + 1)²(x − 5). The multiplicities 3 + 2 + 1 add to 6. Even multiplicity 2 at x = −1 means a bounce. Odd multiplicity 3 at x = 2 means the graph flattens and crosses. Multiplicity 1 at x = 5 is an ordinary cross.',
    mistakes:
      'A multiplicity of 1 crosses without flattening. Flattening is for odd multiplicity greater than 1.',
  },
  13: {
    steps:
      'The zeros are x = −2 (cross), x = 1 (bounce), and x = 4 (cross). Degree 4 and a negative sign send both ends to −∞. f(0) = −(2)(1)(−4) = 8, so the y-intercept is (0, 8).',
    mistakes:
      'The negative sign in front changes even-degree ends from up-up to down-down. Watch the sign when you evaluate f(0).',
  },
  14: {
    steps:
      'A cross can use multiplicity 1 and a bounce needs multiplicity 2, so the minimum degree is 1 + 2 + 1 = 4. Both ends go to −∞, so use an even degree and a negative leading coefficient: f(x) = −(x + 3)(x − 1)²(x − 4).',
    mistakes:
      'A crossing zero does not need multiplicity 3. Multiplicity 1 is enough for the minimum degree. Do not forget the negative sign.',
  },
  15: {
    steps:
      'Factor as (x − 2)(x + 2) over (x − 3)(x + 2). Cancel (x + 2) to get a hole at x = −2. The simplified function (x − 2)/(x − 3) gives y = 4/5 there, so the hole is (−2, 4/5). The remaining denominator factor gives the vertical asymptote x = 3. Equal degrees give the horizontal asymptote y = 1. The simplified numerator is zero at x = 2.',
    mistakes:
      'A canceled factor is a hole, not a vertical asymptote. Use the simplified function to find the hole’s height. x = −2 is not an x-intercept.',
  },
  16: {
    steps:
      'The numerator degree is exactly one more than the denominator degree, so there is a slant asymptote. Division gives 2x² + 3x − 5 = (x + 1)(2x + 1) − 6. The remainder term vanishes at infinity, so the asymptote is y = 2x + 1.',
    mistakes:
      'Do not include the remainder in the asymptote. Check that the degrees differ by exactly 1 before looking for a slant line.',
  },
  17: {
    steps:
      'Both ends go to −∞ only when the degree is even and the leading coefficient is negative. Any even n, such as 2 or 4, with any negative a works. Two different examples need two different pairs, such as a = −1, n = 2 and a = −3, n = 4.',
    mistakes:
      'An odd degree makes the ends go opposite ways. A positive leading coefficient sends even-degree ends up, not down.',
  },
  18: {
    steps:
      'Touching without crossing means even multiplicity, so use 2 at x = −2 and x = 1. Crossing with no other real zeros means multiplicity 1 at x = 3. Those multiplicities add to 5. The factored form is (x + 2)²(x − 1)²(x − 3). Degree 5 and a positive leading coefficient send the right end to +∞ and the left end to −∞.',
    mistakes:
      'Multiplicity 4 at one touch point would leave no room for the other zeros in a degree-5 polynomial.',
  },
  19: {
    steps:
      'P(x) = −x(x − 3)², so the profit is zero at x = 0 and x = 3. For every x > 0, −x is negative and (x − 3)² is not negative, so the profit is never positive. The derivative −3(x − 1)(x − 3) is zero at x = 1 and x = 3, and P(1) = −4 is a local maximum even though the value is negative.',
    mistakes:
      'A model called “profit” does not have to be positive. A local maximum can still be a negative number.',
  },
  20: {
    steps:
      'A local maximum is higher than nearby points only. An absolute maximum is the highest value on the whole domain. f(x) = −x³ + 3x has a local maximum near x = 1, but its degree is odd, so one end goes to +∞ and there is no absolute maximum.',
    mistakes:
      'Local and absolute maxima are not the same. An even-degree polynomial can have an absolute maximum, so it is a poor example for “no absolute maximum.”',
  },
  21: {
    steps:
      'The numerator is 3(x − 2)(x + 2) and the denominator is (x − 2)(x − 3). Cancel (x − 2) to get a hole at (2, −12). The vertical asymptote is x = 3, and equal degrees give the horizontal asymptote y = 3. The simplified numerator is zero at x = −2. f(0) = −2. The domain excludes both x = 2 and x = 3.',
    mistakes:
      'Exclude the hole from the domain even though it is not a vertical asymptote. Read intercepts from the simplified function.',
  },
  22: {
    steps:
      'A canceled factor is a hole. A factor that remains only in the denominator is a vertical asymptote. In (a), (x − 3) cancels, so x = 3 is a hole. In (b), (x + 2) cancels and creates a hole at x = −2, but (x − 2) stays, so x = 2 is a vertical asymptote. In (c), (x − 3) cancels, so x = 3 is a hole.',
    mistakes:
      'Factor completely first. In (b), the cancellation is at x = −2, not at the x-value the question asks about.',
  },
  23: {
    steps:
      'The numerator is 2x(x − 4) and the denominator is (x − 1)(x − 4). Cancel (x − 4). The simplified function 2x/(x − 1) gives y = 8/3 at x = 4, so the hole is (4, 8/3). The remaining vertical asymptote is x = 1.',
    mistakes:
      'The original expression at x = 4 is 0/0. Use the simplified function to get the hole’s height.',
  },
  24: {
    steps:
      'Canceling a factor does not make the original function defined at that x-value. For example, (x² − 4)/(x − 2) simplifies to x + 2, but the original function is undefined at x = 2. The graphs match everywhere except that one hole.',
    mistakes:
      'Simplifying does not fill in the hole. The simplified expression can have a value where the original function does not.',
  },
  25: {
    steps:
      'An even function is symmetric about the y-axis, so real zeros come in ± pairs. Exactly two distinct real zeros, degree 4, and a negative leading coefficient can be written as f(x) = −(x − 2)²(x + 2)², or more generally −(x² − a²)². Both ends go to −∞, and f(−x) = f(x).',
    mistakes:
      'Multiplicity 1 at ±a would still be even, but the usual “bounce at both zeros” form uses multiplicity 2. Check f(−x) = f(x).',
  },
  26: {
    steps:
      'Synthetic division by −3 leaves remainder 0, so x = −3 is a zero, and the quotient is x³ − x² − 4x + 4. Grouping gives (x² − 4)(x − 1) = (x − 2)(x + 2)(x − 1). Thus p(x) = (x + 3)(x − 1)(x − 2)(x + 2), and each zero has multiplicity 1.',
    mistakes:
      'Divide by the root −3, not +3. Finish factoring the cubic; the difference of squares still has to be split.',
  },
  27: {
    steps:
      'Grouping gives (x² − 4)(x − 1) = (x − 2)(x + 2)(x − 1). The critical values are −2, 1, and 2. The expression is negative on (−∞, −2) and on (1, 2), and it is zero at the roots. Because the inequality is ≤, include the roots: (−∞, −2] ∪ [1, 2].',
    mistakes:
      'Use closed brackets because the inequality includes equality. A sign error in one interval flips the whole solution.',
  },
  28: {
    steps:
      'The numerator is (x + 4)(x − 2) and the denominator is (x − 3)(x + 3). Nothing cancels, so there is no hole and the vertical asymptotes are x = 3 and x = −3. Equal degrees give y = 1. The x-intercepts are −4 and 2, and f(0) = 8/9. On both vertical asymptotes the left side goes to −∞ and the right side goes to +∞.',
    mistakes:
      'Confirm the direction by testing a number on each side. Do not assume a hole when the numerator and denominator have no common factor.',
  },
  29: {
    steps:
      'A hole at x = −2 needs (x + 2) in both the numerator and the denominator. A vertical asymptote at x = 5 needs (x − 5) only in the denominator. An x-intercept at x = 1 needs (x − 1) in the numerator. Equal degrees and a horizontal asymptote y = 3 need leading-coefficient ratio 3. One example is 3(x − 1)(x + 2)/((x − 5)(x + 2)).',
    mistakes:
      'The hole factor has to be in both the numerator and the denominator. Without the 3, the horizontal asymptote would be y = 1.',
  },
  30: {
    steps:
      'Move 2 to the left: (x + 3)/(x − 1) − 2 = (5 − x)/(x − 1). The critical values are x = 5 and x = 1. The expression is positive on (1, 5), zero at x = 5, and undefined at x = 1. The solution is (1, 5].',
    mistakes:
      'Do not cross-multiply by x − 1, because its sign changes. Do not include x = 1, where the original expression is undefined.',
  },
  31: {
    steps:
      'The base has area x² and the four sides have area 4x(x − 3), so x² + 4x(x − 3) = 294. That is 5x² − 12x − 294 = 0. The quadratic formula gives a positive side of about 8.96 cm. The height is that side minus 3, about 5.96 cm. Reject the negative root.',
    mistakes:
      'Count the bottom and all four sides. A negative length is not a solution of the box problem.',
  },
  32: {
    steps:
      'The numerator has lower degree, so the horizontal asymptote is y = 0: the drug concentration approaches 0. t² + 4 is never zero, so there is no vertical asymptote. C′(t) = 0 when t = 2, and C(2) = 1.25. Solving C(t) ≥ 1 gives 1 ≤ t ≤ 4.',
    mistakes:
      't² + 4 is always positive, so multiplying through by it does not flip the inequality. There is no vertical asymptote just because the function is rational.',
  },
  33: {
    steps:
      'x = 1 is a numerator root, and the numerator factors as (x − 1)(x − 2)(x + 2). The denominator is (x − 2)(x − 3). Cancel (x − 2) to get a hole at (2, −4) and a vertical asymptote at x = 3. Dividing the simplified numerator x² + x − 2 by x − 3 gives the oblique asymptote y = x + 4.',
    mistakes:
      'Cancel the shared factor before the division. Dividing by the original denominator gives the wrong quotient.',
  },
  34: {
    steps:
      'Factor as (x − 2)(x + 2) over (x − 3)(x + 2). Cancel (x + 2), which is a hole at x = −2, not a sign-change point. The simplified inequality is (x − 2)/(x − 3) < 0, which is negative only on (2, 3). Both endpoints are excluded.',
    mistakes:
      'A hole does not change the sign. It is simply not in the domain. x = 2 makes the expression 0, so it is not part of a strict inequality.',
  },
  35: {
    steps:
      'Q(x) needs factors for the vertical asymptote and the hole, so Q(x) = (x − 4)(x + 1). P(x) needs zeros at 0 and 3 and the same (x + 1), so P(x) = a x(x − 3)(x + 1). The simplified value at x = −1 equals 2 when a = −5/2. Dividing the simplified function by x − 4 gives the oblique asymptote y = −(5/2)x − 5/2.',
    mistakes:
      'Put (x + 1) in both P and Q or there is no hole. Use the simplified function, not the original, when you set the hole height equal to 2.',
  },
  36: {
    steps:
      'The box has dimensions x, 18 − 2x, and 12 − 2x, so V(x) = x(18 − 2x)(12 − 2x) = 4x³ − 60x² + 216x. The side lengths stay positive only for 0 < x < 6. Volume is 0 at both ends because the height or the width collapses. The critical point inside the domain is about x = 2.35 in, with volume about 228 cubic inches.',
    mistakes:
      'x must be less than 6, not only greater than 0. The other critical point, about 7.65, is outside the domain.',
  },
  37: {
    steps:
      'x = 2 is a zero of f, and division gives f(x) = (x − 2)(x − 4)(x + 3). Canceling x − 4 leaves g(x) = (x − 2)(x + 3), but g is still undefined at x = 4, so it remains rational. The graph is that parabola with a hole. The hole height is (4 − 2)(4 + 3) = 14.',
    mistakes:
      'Canceling a factor does not turn g into a polynomial. State that x = 4 is still excluded.',
  },
  38: {
    steps:
      '(a) is true: odd-degree ends go to opposite infinities, so the Intermediate Value Theorem forces a real zero. (b) is false: x² has degree 2 but only one distinct real zero, and x² + 1 has none. (c) is true: the two ends of a rational function follow the same leading-term ratio, so there is at most one horizontal asymptote.',
    mistakes:
      'A function can have several vertical asymptotes. That does not allow several horizontal asymptotes.',
  },
  39: {
    steps:
      'P(0) is the constant term, 80 thousand people. Factoring out −0.2 gives P(t) = −0.2(t⁴ − 16t³ + 72t² − 80t − 400). Degree 4 and a negative leading coefficient send both ends to −∞, so near t = 12 the model falls toward an impossible negative population. Without calculus, compare values in a table and look for where the population stops rising.',
    mistakes:
      'The constant 80 does not share a factor of t with the other terms. Do not extend an even-degree model with a negative leading coefficient past the domain where population stays realistic.',
  },
  40: {
    steps:
      'Equal degree 3 over degree 3 with horizontal asymptote y = −2 means the leading-coefficient ratio is −2. A hole needs the same factor in the numerator and denominator. Exactly two vertical asymptotes need two denominator factors that do not cancel. A negative x-intercept needs a factor such as (x + 1) left in the numerator. One example is −2(x − 1)(x + 1)(x − 5)/((x − 1)(x − 2)(x − 3)), with a hole at (1, 8).',
    mistakes:
      'The hole factor belongs in both the numerator and the denominator. After canceling, the remaining leading-coefficient ratio still has to be −2, and two uncancelled denominator factors must remain.',
  },
}

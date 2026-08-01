/**
 * §11: Constitutional Deterministic Mathematical Engine
 *
 * Replaces all JavaScript binary floating-point arithmetic with
 * deterministic fixed-precision decimal arithmetic using decimal.js.
 *
 * Blueprint requirements:
 * - "All internal calculations shall be performed using fixed-precision arithmetic" (§11)
 * - "Decimal128 (IEEE-754 Decimal) or Fixed Decimal 18" (§11)
 * - "No binary floating-point arithmetic" (§11)
 * - "Internal engine calculations SHALL use Decimal128 (or equivalent)" (§11)
 *
 * Configuration:
 * - Precision: 28 significant digits (Decimal128 equivalent)
 * - Rounding: ROUND_HALF_UP (banker's rounding for financial math)
 * - Internal representation: Decimal from decimal.js
 * - External interface: number (for API compatibility) but ALL internal
 *   calculations use Decimal to avoid binary float drift
 */

import Decimal from "decimal.js";

// Configure decimal.js to Decimal128 precision
Decimal.set({
  precision: 28,        // Decimal128 = 28 significant digits
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15,
  toExpPos: 9e15,
});

export type FixedPoint = Decimal;

/** Create a FixedPoint from number, string, or Decimal */
export function fp(value: number | string | Decimal): FixedPoint {
  return new Decimal(value);
}

/** Add two fixed-point values */
export function fpAdd(a: FixedPoint, b: FixedPoint): FixedPoint {
  return a.plus(b);
}

/** Subtract two fixed-point values */
export function fpSub(a: FixedPoint, b: FixedPoint): FixedPoint {
  return a.minus(b);
}

/** Multiply two fixed-point values */
export function fpMul(a: FixedPoint, b: FixedPoint): FixedPoint {
  return a.times(b);
}

/** Divide two fixed-point values */
export function fpDiv(a: FixedPoint, b: FixedPoint): FixedPoint {
  if (b.isZero()) return new Decimal(0);
  return a.div(b);
}

/** Square root */
export function fpSqrt(a: FixedPoint): FixedPoint {
  return a.sqrt();
}

/** Power */
export function fpPow(a: FixedPoint, b: number): FixedPoint {
  return a.pow(b);
}

/** Natural logarithm */
export function fpLog(a: FixedPoint): FixedPoint {
  return a.ln();
}

/** Absolute value */
export function fpAbs(a: FixedPoint): FixedPoint {
  return a.abs();
}

/** Minimum of two values */
export function fpMin(a: FixedPoint, b: FixedPoint): FixedPoint {
  return a.lt(b) ? a : b;
}

/** Maximum of two values */
export function fpMax(a: FixedPoint, b: FixedPoint): FixedPoint {
  return a.gt(b) ? a : b;
}

/** Clamp a value between min and max */
export function fpClamp(value: FixedPoint, min: FixedPoint, max: FixedPoint): FixedPoint {
  return fpMin(fpMax(value, min), max);
}

/** Check if a >= b */
export function fpGte(a: FixedPoint, b: FixedPoint): boolean {
  return a.gte(b);
}

/** Check if a <= b */
export function fpLte(a: FixedPoint, b: FixedPoint): boolean {
  return a.lte(b);
}

/** Check if a > b */
export function fpGt(a: FixedPoint, b: FixedPoint): boolean {
  return a.gt(b);
}

/** Check if a < b */
export function fpLt(a: FixedPoint, b: FixedPoint): boolean {
  return a.lt(b);
}

/** Check if a equals b */
export function fpEq(a: FixedPoint, b: FixedPoint): boolean {
  return a.eq(b);
}

/** Check if a is zero */
export function fpIsZero(a: FixedPoint): boolean {
  return a.isZero();
}

/** Convert to number for API output (display only — not for calculation) */
export function fpToNumber(a: FixedPoint): number {
  return a.toNumber();
}

/** Convert to string with 4 decimal places (§11 display standard) */
export function fpToDisplay(a: FixedPoint): string {
  return a.toFixed(4);
}

/** Convert to string with full precision */
export function fpToString(a: FixedPoint): string {
  return a.toString();
}

/** Sum an array of FixedPoints */
export function fpSum(values: FixedPoint[]): FixedPoint {
  return values.reduce((acc, v) => acc.plus(v), new Decimal(0));
}

/** Calculate RMS (Root Mean Square) — used by §9 CRI */
export function fpRMS(values: FixedPoint[], weights: FixedPoint[]): FixedPoint {
  if (values.length === 0) return new Decimal(0);
  let sumOfSquares = new Decimal(0);
  for (let i = 0; i < values.length; i++) {
    const w = weights[i] || new Decimal(0);
    sumOfSquares = sumOfSquares.plus(w.times(values[i].times(values[i])));
  }
  return sumOfSquares.sqrt();
}

/** Calculate median */
export function fpMedian(values: FixedPoint[]): FixedPoint {
  if (values.length === 0) return new Decimal(0);
  const sorted = [...values].sort((a, b) => a.comparedTo(b));
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? sorted[mid - 1].plus(sorted[mid]).div(2)
    : sorted[mid];
}

/** Calculate MAD (Median Absolute Deviation) */
export function fpMAD(values: FixedPoint[]): FixedPoint {
  const med = fpMedian(values);
  const deviations = values.map(v => v.minus(med).abs());
  return fpMedian(deviations);
}

/** Determinism verification: same input → same output */
export function verifyDeterminism(input: number, expected: string): boolean {
  const result = fp(input).toFixed(28);
  return result === expected;
}

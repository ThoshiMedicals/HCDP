/**
 * Explicit decimal helpers for Batch 6 export/reconciliation.
 * Avoid floating-point drift for hour/unit totals (2dp) and amounts (2dp).
 * All monetary / quantity multiplications use integer scale-100 arithmetic.
 */

const SCALE = 100;

export function toScaled(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * SCALE);
}

export function fromScaled(s: number): number {
  return s / SCALE;
}

export function roundUnits(n: number): number {
  return fromScaled(toScaled(n));
}

export function addUnits(a: number, b: number): number {
  return fromScaled(toScaled(a) + toScaled(b));
}

export function diffUnits(expected: number, actual: number): number {
  return fromScaled(toScaled(actual) - toScaled(expected));
}

export function unitsEqual(a: number, b: number): boolean {
  return toScaled(a) === toScaled(b);
}

/**
 * Multiply normalized 2dp operands (and optional 2dp multiplier) in scale-100 space.
 * Result is rounded half-away-from-zero at 2dp once after the integer product.
 * Formula: round(units_s * rate_s * mult_s / SCALE^2) / SCALE  when mult provided,
 * else round(units_s * rate_s / SCALE) / SCALE.
 */
export function multiplyUnitsRate(
  units: number,
  rate: number,
  multiplier: number = 1
): number {
  const u = toScaled(units);
  const r = toScaled(rate);
  const m = toScaled(multiplier);
  // u*r*m are scale-100; product has scale 100^3 → divide by 100^2 to get scale-100, then round
  const scaledProduct = Math.round((u * r * m) / (SCALE * SCALE));
  return fromScaled(scaledProduct);
}

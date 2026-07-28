/**
 * Explicit decimal helpers for Batch 6 export/reconciliation.
 * Avoid floating-point drift for hour/unit totals (2dp) and amounts (2dp).
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

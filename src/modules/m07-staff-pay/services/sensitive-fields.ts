/**
 * Reject prohibited banking / tax / super identifiers in M07 payloads.
 */

import {
  M07_PROHIBITED_FIELD_KEYS,
  type M07ProhibitedFieldKey,
} from "../types/domain";
import { M07ValidationError } from "../permissions";

const PROHIBITED_SET = new Set<string>(
  M07_PROHIBITED_FIELD_KEYS.map((k) => k.toLowerCase())
);

function walk(value: unknown, path: string, hits: string[]): void {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, hits));
    return;
  }
  if (typeof value !== "object") return;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    if (PROHIBITED_SET.has(lower)) {
      hits.push(path ? `${path}.${k}` : k);
    }
    walk(v, path ? `${path}.${k}` : k, hits);
  }
}

export function findProhibitedFields(payload: unknown): string[] {
  const hits: string[] = [];
  walk(payload, "", hits);
  return hits;
}

export function assertNoProhibitedFields(payload: unknown): void {
  const hits = findProhibitedFields(payload);
  if (hits.length) {
    throw new M07ValidationError(
      "prohibited-identifier",
      `M07 must not store prohibited identifiers: ${hits.join(", ")}`
    );
  }
}

export function isProhibitedFieldKey(key: string): key is M07ProhibitedFieldKey {
  return PROHIBITED_SET.has(key.toLowerCase());
}

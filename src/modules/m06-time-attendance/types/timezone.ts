/** M06 timezone / DST types — no silent UTC. */

import type { FoldFlag } from "./domain";
export type { FoldFlag };

export interface ResolvedInstant {
  clinicId: string;
  timeZoneId: string;
  localCivil: string;
  occurredAtUtc: string;
  offsetMinutes: number;
  fold: FoldFlag;
  deviceSkewMinutes?: number;
}

export type UnresolvedInstantReason =
  | "clinic-missing"
  | "clinic-timezone-unresolved"
  | "invalid-local-time"
  | "dst-gap"
  | "stale-timezone"
  | "device-skew"
  | "unknown";

export interface UnresolvedInstantResult {
  ok: false;
  reason: UnresolvedInstantReason;
  message: string;
  clinicId?: string;
  timeZoneId?: string;
  localCivil?: string;
}

export type InstantTimezoneResult = { ok: true; instant: ResolvedInstant } | UnresolvedInstantResult;

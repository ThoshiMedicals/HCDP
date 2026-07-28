/**
 * M07 → M01 executive summary publishing interface only (Batch 1).
 * Emits readiness counts without rates/sensitive pay fields.
 */

export type M01PayReadinessSummary = {
  sourceModule: "staff-pay";
  legalEntityId: string;
  openPeriods: number;
  profilesConfigured: number;
  blockingExceptions: number;
  exportReady: number;
  /** Rates intentionally omitted. */
  containsRates: false;
};

let lastSummary: M01PayReadinessSummary | null = null;

export function resetM01SummaryPublishForTests(): void {
  lastSummary = null;
}

export function publishM07ExecutiveSummary(
  input: Omit<M01PayReadinessSummary, "sourceModule" | "containsRates">
): M01PayReadinessSummary {
  lastSummary = {
    ...input,
    sourceModule: "staff-pay",
    containsRates: false,
  };
  return lastSummary;
}

export function getLastM07ExecutiveSummary(): M01PayReadinessSummary | null {
  return lastSummary;
}

export const M07_M01_SUMMARY_PUBLISH_MODE = "interface-only" as const;

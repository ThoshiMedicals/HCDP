/**
 * M05 executive summary counts — roster operations overview (§22).
 *
 * Aggregate counts ONLY. Never leaks person-level sensitive data, rate tables,
 * or full roster dumps.
 */

import * as store from "../repository/local-store";

export type RosterCounts = {
  totalPeriods: number;
  publishedPeriods: number;
  draftPeriods: number;
  openCoverageGaps: number;
  unackedPublications: number;
  pendingSwaps: number;
  openShiftEscalations: number;
  invalidatedPublishedAssignments: number;
  totalShiftsThisPeriod: number;
};

export function getRosterCounts(clinicId?: string): RosterCounts {
  const periods = store.listPeriods(clinicId);
  const publications = store.listPublications().filter((p) =>
    clinicId ? p.clinicId === clinicId : true
  );

  const openShifts = store.listOpenShifts().filter((o) =>
    clinicId ? o.clinicId === clinicId : true
  );
  const swaps = store.listSwaps().filter((s) =>
    clinicId ? s.clinicId === clinicId : true
  );
  const assignments = store.listAssignments().filter((a) =>
    clinicId ? a.clinicId === clinicId : true
  );

  const openCoverageGapCount = openShifts.filter((o) => o.status === "escalated").length;

  const activePublications = publications.filter((p) => !p.supersededById);
  const unackedPubCount = activePublications.filter(
    (p) => p.acknowledgementStatus !== "full"
  ).length;

  const pendingSwaps = swaps.filter((s) =>
    ["requested", "proposed", "recipient_accepted"].includes(s.status)
  ).length;

  const openShiftEscalations = openShifts.filter((o) => o.status === "escalated").length;

  const invalidatedPublishedAssignments = assignments.filter(
    (a) => a.state === "invalidated" && a.publicationId
  ).length;

  const currentPeriodShiftCount = periods.reduce((sum, p) => {
    if (p.lifecycleState !== "published") return sum;
    return sum + store.listShifts(p.id).length;
  }, 0);

  return {
    totalPeriods: periods.length,
    publishedPeriods: periods.filter((p) => p.lifecycleState === "published").length,
    draftPeriods: periods.filter((p) =>
      ["draft", "under_review", "ready_to_publish"].includes(p.lifecycleState)
    ).length,
    openCoverageGaps: openCoverageGapCount,
    unackedPublications: unackedPubCount,
    pendingSwaps,
    openShiftEscalations,
    invalidatedPublishedAssignments,
    totalShiftsThisPeriod: currentPeriodShiftCount,
  };
}

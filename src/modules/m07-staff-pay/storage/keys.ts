/** M07 storage keys — pulse.m07.staffpay.* (Batch 1 additive). */

export const M07_STORAGE_PREFIX = "pulse.m07.staffpay." as const;

export const M07_STORAGE_KEYS = {
  meta: `${M07_STORAGE_PREFIX}meta`,
  periods: `${M07_STORAGE_PREFIX}periods`,
  calculations: `${M07_STORAGE_PREFIX}calculations`,
  adjustments: `${M07_STORAGE_PREFIX}adjustments`,
  exports: `${M07_STORAGE_PREFIX}exports`,
  reconciliations: `${M07_STORAGE_PREFIX}reconciliations`,
  // Batch 1 additions (v2 migration)
  legalEntities: `${M07_STORAGE_PREFIX}legalEntities`,
  profiles: `${M07_STORAGE_PREFIX}profiles`,
  rules: `${M07_STORAGE_PREFIX}rules`,
  classificationMaps: `${M07_STORAGE_PREFIX}classificationMaps`,
  codes: `${M07_STORAGE_PREFIX}codes`,
  exportProfiles: `${M07_STORAGE_PREFIX}exportProfiles`,
  /** Legacy Batch 1 placeholder collection — non-authoritative; not used as snapshot store. */
  intake: `${M07_STORAGE_PREFIX}intake`,
  exceptions: `${M07_STORAGE_PREFIX}exceptions`,
  approvals: `${M07_STORAGE_PREFIX}approvals`,
  audit: `${M07_STORAGE_PREFIX}audit`,
  /** Checkpoint 2.4 — immutable published-timesheet source snapshots. */
  publishedTimesheetSnapshots: `${M07_STORAGE_PREFIX}publishedTimesheetSnapshots`,
  publishedTimesheetSnapshotIndex: `${M07_STORAGE_PREFIX}publishedTimesheetSnapshotIndex`,
  publishedTimesheetCurrentIntake: `${M07_STORAGE_PREFIX}publishedTimesheetCurrentIntake`,
  /** Checkpoint 2.5 — ordered replay cursors and event outcomes. */
  publishedTimesheetReplayCheckpoints: `${M07_STORAGE_PREFIX}publishedTimesheetReplayCheckpoints`,
  publishedTimesheetReplayOutcomes: `${M07_STORAGE_PREFIX}publishedTimesheetReplayOutcomes`,
  /** Checkpoint 2.6 — lifecycle projections, eligibility, decisions, exceptions. */
  publishedTimesheetLifecycleProjections: `${M07_STORAGE_PREFIX}publishedTimesheetLifecycleProjections`,
  publishedTimesheetSnapshotEligibility: `${M07_STORAGE_PREFIX}publishedTimesheetSnapshotEligibility`,
  publishedTimesheetLifecycleDecisions: `${M07_STORAGE_PREFIX}publishedTimesheetLifecycleDecisions`,
  publishedTimesheetLifecycleExceptions: `${M07_STORAGE_PREFIX}publishedTimesheetLifecycleExceptions`,
  publishedTimesheetLifecycleEventApplications: `${M07_STORAGE_PREFIX}publishedTimesheetLifecycleEventApplications`,
  /** Batch 3 — pay-prep exceptions, calculation batches, leave prep lines. */
  leavePrepLines: `${M07_STORAGE_PREFIX}leavePrepLines`,
  /** Batch 4 — manual deduction source inputs (distinct from calc outputs). */
  deductionPrepInputs: `${M07_STORAGE_PREFIX}deductionPrepInputs`,
} as const;

/** v1 migration flag version (frozen for workforce-migrations.test). */
export const M07_STORAGE_VERSION = 1 as const;
export const M07_MIGRATION_ID = "m07-staffpay-storage-v1" as const;

/** Additive Batch 1 schema. */
export const M07_MIGRATION_V2_ID = "m07-staffpay-storage-v2" as const;
/** Checkpoint 2.4 snapshot collections. */
export const M07_MIGRATION_V3_ID = "m07-staffpay-storage-v3" as const;
/** Checkpoint 2.5 replay cursor collections. */
export const M07_MIGRATION_V4_ID = "m07-staffpay-storage-v4" as const;
/** Checkpoint 2.6 lifecycle projection collections. */
export const M07_MIGRATION_V5_ID = "m07-staffpay-storage-v5" as const;
/** Batch 3 — leavePrepLines (+ ensure exceptions/calculations ready). */
export const M07_MIGRATION_V6_ID = "m07-staffpay-storage-v6" as const;
/** Batch 4 — deductionPrepInputs. */
export const M07_MIGRATION_V7_ID = "m07-staffpay-storage-v7" as const;
/** Batch 5 — typed approvals (existing key; additive ensure). */
export const M07_MIGRATION_V8_ID = "m07-staffpay-storage-v8" as const;
export const M07_SCHEMA_VERSION = 8 as const;

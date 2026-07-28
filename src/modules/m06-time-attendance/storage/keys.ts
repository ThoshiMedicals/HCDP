/** M06 storage keys — pulse.m06.attendance.* */

export const M06_STORAGE_PREFIX = "pulse.m06.attendance." as const;

export const M06_STORAGE_KEYS = {
  meta: `${M06_STORAGE_PREFIX}meta`,
  events: `${M06_STORAGE_PREFIX}events`,
  exceptions: `${M06_STORAGE_PREFIX}exceptions`,
  timesheets: `${M06_STORAGE_PREFIX}timesheets`,
  offlineQueue: `${M06_STORAGE_PREFIX}offlineQueue`,
  sessions: `${M06_STORAGE_PREFIX}sessions`,
  breaks: `${M06_STORAGE_PREFIX}breaks`,
  corrections: `${M06_STORAGE_PREFIX}corrections`,
  approvals: `${M06_STORAGE_PREFIX}approvals`,
  policies: `${M06_STORAGE_PREFIX}policies`,
  audit: `${M06_STORAGE_PREFIX}audit`,
  evidence: `${M06_STORAGE_PREFIX}evidence`,
  devices: `${M06_STORAGE_PREFIX}devices`,
  declarations: `${M06_STORAGE_PREFIX}declarations`,
} as const;

export const M06_STORAGE_VERSION = 1 as const;
export const M06_MIGRATION_ID = "m06-attendance-storage-v1" as const;
export const M06_MIGRATION_V2_ID = "m06-attendance-storage-v2" as const;
export const M06_SCHEMA_VERSION = 2 as const;
export const M06_SEED_BATCH_ID = "m06-portal-seed-v1" as const;
export const M06_POLICY_SEED_ID = "m06-policy-seed-v1" as const;

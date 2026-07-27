/** M06 storage keys — pulse.m06.attendance.* */

export const M06_STORAGE_PREFIX = "pulse.m06.attendance." as const;

export const M06_STORAGE_KEYS = {
  meta: `${M06_STORAGE_PREFIX}meta`,
  events: `${M06_STORAGE_PREFIX}events`,
  exceptions: `${M06_STORAGE_PREFIX}exceptions`,
  timesheets: `${M06_STORAGE_PREFIX}timesheets`,
  offlineQueue: `${M06_STORAGE_PREFIX}offlineQueue`,
} as const;

export const M06_STORAGE_VERSION = 1 as const;
export const M06_MIGRATION_ID = "m06-attendance-storage-v1" as const;

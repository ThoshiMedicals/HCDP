/** M05 storage keys — pulse.m05.roster.* */

export const M05_STORAGE_PREFIX = "pulse.m05.roster." as const;

export const M05_STORAGE_KEYS = {
  meta: `${M05_STORAGE_PREFIX}meta`,
  periods: `${M05_STORAGE_PREFIX}periods`,
  shifts: `${M05_STORAGE_PREFIX}shifts`,
  publications: `${M05_STORAGE_PREFIX}publications`,
  swaps: `${M05_STORAGE_PREFIX}swaps`,
  openShifts: `${M05_STORAGE_PREFIX}openShifts`,
} as const;

export const M05_STORAGE_VERSION = 1 as const;
export const M05_MIGRATION_ID = "m05-roster-storage-v1" as const;

/** M04 storage keys — pulse.m04.workforce.* */

export const M04_STORAGE_PREFIX = "pulse.m04.workforce." as const;

export const M04_STORAGE_KEYS = {
  meta: `${M04_STORAGE_PREFIX}meta`,
  people: `${M04_STORAGE_PREFIX}people`,
  engagements: `${M04_STORAGE_PREFIX}engagements`,
  credentials: `${M04_STORAGE_PREFIX}credentials`,
  leave: `${M04_STORAGE_PREFIX}leave`,
  availability: `${M04_STORAGE_PREFIX}availability`,
  restrictions: `${M04_STORAGE_PREFIX}restrictions`,
  onboarding: `${M04_STORAGE_PREFIX}onboarding`,
  offboarding: `${M04_STORAGE_PREFIX}offboarding`,
  readiness: `${M04_STORAGE_PREFIX}readiness`,
} as const;

export const M04_STORAGE_VERSION = 1 as const;
export const M04_MIGRATION_ID = "m04-workforce-storage-v1" as const;
export const M04_PORTAL_SEED_MIGRATION_ID = "m04-workforce-portal-seed-v1" as const;
export const M04_PORTAL_SEED_VERSION = 1 as const;

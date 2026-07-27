/** M22 storage keys — pulse.m22.recruitment.* */

export const M22_STORAGE_PREFIX = "pulse.m22.recruitment." as const;

export const M22_STORAGE_KEYS = {
  meta: `${M22_STORAGE_PREFIX}meta`,
  requisitions: `${M22_STORAGE_PREFIX}requisitions`,
  vacancies: `${M22_STORAGE_PREFIX}vacancies`,
  candidates: `${M22_STORAGE_PREFIX}candidates`,
  offers: `${M22_STORAGE_PREFIX}offers`,
  promotions: `${M22_STORAGE_PREFIX}promotions`,
} as const;

export const M22_STORAGE_VERSION = 1 as const;
export const M22_MIGRATION_ID = "m22-recruitment-storage-v1" as const;

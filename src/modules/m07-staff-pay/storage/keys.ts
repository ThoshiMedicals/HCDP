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
  intake: `${M07_STORAGE_PREFIX}intake`,
  exceptions: `${M07_STORAGE_PREFIX}exceptions`,
  approvals: `${M07_STORAGE_PREFIX}approvals`,
  audit: `${M07_STORAGE_PREFIX}audit`,
} as const;

/** v1 migration flag version (frozen for workforce-migrations.test). */
export const M07_STORAGE_VERSION = 1 as const;
export const M07_MIGRATION_ID = "m07-staffpay-storage-v1" as const;

/** Additive Batch 1 schema. */
export const M07_SCHEMA_VERSION = 2 as const;
export const M07_MIGRATION_V2_ID = "m07-staffpay-storage-v2" as const;

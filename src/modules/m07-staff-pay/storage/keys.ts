/** M07 storage keys — pulse.m07.staffpay.* */

export const M07_STORAGE_PREFIX = "pulse.m07.staffpay." as const;

export const M07_STORAGE_KEYS = {
  meta: `${M07_STORAGE_PREFIX}meta`,
  periods: `${M07_STORAGE_PREFIX}periods`,
  calculations: `${M07_STORAGE_PREFIX}calculations`,
  adjustments: `${M07_STORAGE_PREFIX}adjustments`,
  exports: `${M07_STORAGE_PREFIX}exports`,
  reconciliations: `${M07_STORAGE_PREFIX}reconciliations`,
} as const;

export const M07_STORAGE_VERSION = 1 as const;
export const M07_MIGRATION_ID = "m07-staffpay-storage-v1" as const;

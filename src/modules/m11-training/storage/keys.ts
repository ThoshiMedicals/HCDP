/** M11 storage keys — pulse.m11.training.* */

export const M11_STORAGE_PREFIX = "pulse.m11.training." as const;

export const M11_STORAGE_KEYS = {
  meta: `${M11_STORAGE_PREFIX}meta`,
  catalogue: `${M11_STORAGE_PREFIX}catalogue`,
  assignments: `${M11_STORAGE_PREFIX}assignments`,
  assessments: `${M11_STORAGE_PREFIX}assessments`,
  competencies: `${M11_STORAGE_PREFIX}competencies`,
  certificates: `${M11_STORAGE_PREFIX}certificates`,
  exemptions: `${M11_STORAGE_PREFIX}exemptions`,
  // Extended in Wave 3
  completions: `${M11_STORAGE_PREFIX}completions`,
  evidence: `${M11_STORAGE_PREFIX}evidence`,
  policies: `${M11_STORAGE_PREFIX}policies`,
  sessions: `${M11_STORAGE_PREFIX}sessions`,
  rules: `${M11_STORAGE_PREFIX}rules`,
  audit: `${M11_STORAGE_PREFIX}audit`,
  ui: `${M11_STORAGE_PREFIX}ui`,
} as const;

export const M11_STORAGE_VERSION = 1 as const;
export const M11_MIGRATION_ID = "m11-training-storage-v1" as const;
export const M11_SEED_MIGRATION_ID = "m11-training-portal-seed-v1" as const;
export const M11_POLICY_MIGRATION_ID = "m11-training-policy-v1" as const;

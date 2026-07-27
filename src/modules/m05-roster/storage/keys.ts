/** M05 storage keys — pulse.m05.roster.* */

export const M05_STORAGE_PREFIX = "pulse.m05.roster." as const;

export const M05_STORAGE_KEYS = {
  meta: `${M05_STORAGE_PREFIX}meta`,
  periods: `${M05_STORAGE_PREFIX}periods`,
  shifts: `${M05_STORAGE_PREFIX}shifts`,
  assignments: `${M05_STORAGE_PREFIX}assignments`,
  openShifts: `${M05_STORAGE_PREFIX}openShifts`,
  swaps: `${M05_STORAGE_PREFIX}swaps`,
  publications: `${M05_STORAGE_PREFIX}publications`,
  acknowledgements: `${M05_STORAGE_PREFIX}acknowledgements`,
  coverageRequirements: `${M05_STORAGE_PREFIX}coverageRequirements`,
  policies: `${M05_STORAGE_PREFIX}policies`,
  costForecasts: `${M05_STORAGE_PREFIX}costForecasts`,
  audit: `${M05_STORAGE_PREFIX}audit`,
  ui: `${M05_STORAGE_PREFIX}ui`,
  availabilityDeclarations: `${M05_STORAGE_PREFIX}availabilityDeclarations`,
  /**
   * M04-approved leave cache — populated ONLY via M04 contract stubs.
   * M05 must never own workforce leave SoT (§2 / §8 of the plan).
   */
  approvedLeaveCache: `${M05_STORAGE_PREFIX}approvedLeaveCache`,
} as const;

export const M05_STORAGE_VERSION = 1 as const;
export const M05_MIGRATION_ID = "m05-roster-storage-v1" as const;

export const M05_SCHEMA_V2_MIGRATION_ID = "m05-roster-schema-v2" as const;
export const M05_SEED_MIGRATION_ID = "m05-roster-portal-seed-v1" as const;
export const M05_POLICY_MIGRATION_ID = "m05-roster-policy-v1" as const;

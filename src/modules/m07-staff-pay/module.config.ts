import { getPlatformModule } from "@/platform/module-registry";

/** Module 7 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "staff-pay" as const;
export const MODULE_NUMBER = 7 as const;
export const MODULE_ROUTE = "/staffpay" as const;
export const STORAGE_PREFIX = "pulse.m07." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

import { getPlatformModule } from "@/platform/module-registry";

/** Module 6 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "time-attendance" as const;
export const MODULE_NUMBER = 6 as const;
export const MODULE_ROUTE = "/time-attendance" as const;
export const STORAGE_PREFIX = "pulse.m06." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

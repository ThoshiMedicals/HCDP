import { getPlatformModule } from "@/platform/module-registry";

/** Module 21 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "vendor-console" as const;
export const MODULE_NUMBER = 21 as const;
export const MODULE_ROUTE = "/vendor-console" as const;
export const STORAGE_PREFIX = "pulse.m21." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

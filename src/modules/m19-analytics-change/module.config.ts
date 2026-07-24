import { getPlatformModule } from "@/platform/module-registry";

/** Module 19 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "analytics" as const;
export const MODULE_NUMBER = 19 as const;
export const MODULE_ROUTE = "/analytics" as const;
export const STORAGE_PREFIX = "pulse.m19." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

import { getPlatformModule } from "@/platform/module-registry";

/** Module 3 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "organisation-access" as const;
export const MODULE_NUMBER = 3 as const;
export const MODULE_ROUTE = "/settings" as const;
export const STORAGE_PREFIX = "pulse.m03." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

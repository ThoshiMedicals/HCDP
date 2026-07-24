import { getPlatformModule } from "@/platform/module-registry";

/** Module 18 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "digital-ops" as const;
export const MODULE_NUMBER = 18 as const;
export const MODULE_ROUTE = "/digital-ops" as const;
export const STORAGE_PREFIX = "pulse.m18." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

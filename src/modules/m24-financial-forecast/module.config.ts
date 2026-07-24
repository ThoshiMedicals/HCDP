import { getPlatformModule } from "@/platform/module-registry";

/** Module 24 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "financial-forecast" as const;
export const MODULE_NUMBER = 24 as const;
export const MODULE_ROUTE = "/financial-forecast" as const;
export const STORAGE_PREFIX = "pulse.m24." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

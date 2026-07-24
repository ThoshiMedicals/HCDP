import { getPlatformModule } from "@/platform/module-registry";

/** Module 12 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "compliance-quality" as const;
export const MODULE_NUMBER = 12 as const;
export const MODULE_ROUTE = "/compliance-quality" as const;
export const STORAGE_PREFIX = "pulse.m12." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

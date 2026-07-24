import { getPlatformModule } from "@/platform/module-registry";

/** Module 16 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "incidents-risk" as const;
export const MODULE_NUMBER = 16 as const;
export const MODULE_ROUTE = "/incidents-risk" as const;
export const STORAGE_PREFIX = "pulse.m16." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

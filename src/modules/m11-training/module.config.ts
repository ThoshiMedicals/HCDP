import { getPlatformModule } from "@/platform/module-registry";

/** Module 11 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "training" as const;
export const MODULE_NUMBER = 11 as const;
export const MODULE_ROUTE = "/training" as const;
export const STORAGE_PREFIX = "pulse.m11." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

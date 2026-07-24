import { getPlatformModule } from "@/platform/module-registry";

/** Module 5 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "roster" as const;
export const MODULE_NUMBER = 5 as const;
export const MODULE_ROUTE = "/roster" as const;
export const STORAGE_PREFIX = "pulse.m05." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

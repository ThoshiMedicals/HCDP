import { getPlatformModule } from "@/platform/module-registry";

/** Module 23 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "website-studio" as const;
export const MODULE_NUMBER = 23 as const;
export const MODULE_ROUTE = "/website-studio" as const;
export const STORAGE_PREFIX = "pulse.m23." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

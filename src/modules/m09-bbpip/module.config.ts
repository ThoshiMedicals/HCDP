import { getPlatformModule } from "@/platform/module-registry";

/** Module 9 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "bbpip" as const;
export const MODULE_NUMBER = 9 as const;
export const MODULE_ROUTE = "/bbpip" as const;
export const STORAGE_PREFIX = "pulse.m09." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

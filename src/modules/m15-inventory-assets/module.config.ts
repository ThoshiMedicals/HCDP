import { getPlatformModule } from "@/platform/module-registry";

/** Module 15 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "inventory-assets" as const;
export const MODULE_NUMBER = 15 as const;
export const MODULE_ROUTE = "/inventory-assets" as const;
export const STORAGE_PREFIX = "pulse.m15." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

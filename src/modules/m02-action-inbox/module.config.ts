import { getPlatformModule } from "@/platform/module-registry";

/** Module 2 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "action-inbox" as const;
export const MODULE_NUMBER = 2 as const;
export const MODULE_ROUTE = "/action-inbox" as const;
export const STORAGE_PREFIX = "pulse.m02." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

import { getPlatformModule } from "@/platform/module-registry";

/** Module 14 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "ticketing" as const;
export const MODULE_NUMBER = 14 as const;
export const MODULE_ROUTE = "/ticket-desk" as const;
export const STORAGE_PREFIX = "pulse.m14." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

import { getPlatformModule } from "@/platform/module-registry";

/** Module 1 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "executive-command-centre" as const;
export const MODULE_NUMBER = 1 as const;
export const MODULE_ROUTE = "/dashboard" as const;
export const STORAGE_PREFIX = "pulse.m01." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

import { getPlatformModule } from "@/platform/module-registry";

/** Module 13 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "documents-policies" as const;
export const MODULE_NUMBER = 13 as const;
export const MODULE_ROUTE = "/documents-policies" as const;
export const STORAGE_PREFIX = "pulse.m13." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

import { getPlatformModule } from "@/platform/module-registry";

/** Module 22 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "recruitment" as const;
export const MODULE_NUMBER = 22 as const;
export const MODULE_ROUTE = "/recruitment" as const;
export const STORAGE_PREFIX = "pulse.m22." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

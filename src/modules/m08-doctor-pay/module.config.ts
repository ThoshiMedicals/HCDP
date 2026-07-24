import { getPlatformModule } from "@/platform/module-registry";

/** Module 8 configuration — sourced from the authoritative platform register. */
export const MODULE_ID = "doctor-pay" as const;
export const MODULE_NUMBER = 8 as const;
export const MODULE_ROUTE = "/doctorpay" as const;
export const STORAGE_PREFIX = "pulse.m08." as const;

export function getModuleDefinition() {
  const mod = getPlatformModule(MODULE_ID);
  if (!mod) throw new Error("Missing platform register entry for " + MODULE_ID);
  return mod;
}

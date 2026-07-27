/**
 * M05 platform adapter re-exports.
 * Do not import other modules' repositories.
 */

export type {
  WorkforceActionInboxAdapter,
  WorkforceNotificationAdapter,
  WorkforceAuditAdapter,
  WorkforceExecutiveSummaryAdapter,
  WorkforceModuleAdapters,
} from "@/platform/workforce/adapters";

export { resolveWorkforceLink } from "@/platform/workforce/services";
/**
 * Note: `publishWorkforceEvent` is re-exported from `services/events.ts`
 * (via `publishM05RosterEvent` wrapper's re-exports) — do not re-export it
 * here as well to avoid ambiguous barrel exports.
 */

export { runM05StorageMigrations } from "../storage";
export { runM05SchemaV2Migration } from "../storage";
export { ensureM05Bootstrapped, resetM05BootstrapCacheForTests } from "../storage";

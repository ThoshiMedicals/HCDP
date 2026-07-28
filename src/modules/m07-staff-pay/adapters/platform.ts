/**
 * M07 platform adapters — Batch 1 foundation.
 * Do not import other modules' repositories.
 */

export type {
  WorkforceActionInboxAdapter,
  WorkforceNotificationAdapter,
  WorkforceAuditAdapter,
  WorkforceExecutiveSummaryAdapter,
  WorkforceModuleAdapters,
} from "@/platform/workforce/adapters";

export {
  publishWorkforceEvent,
  resolveWorkforceLink,
} from "@/platform/workforce/services";

export { runM07StorageMigrations, runM07SchemaV2Migration, ensureM07Bootstrapped } from "../storage";

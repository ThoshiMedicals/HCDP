/**
 * M05 platform adapters — interface stubs for Wave 1.
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

export { runM05StorageMigrations } from "../storage";

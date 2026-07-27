/**
 * M04 platform adapters — interface stubs for Wave 1.
 * Do not import other modules' repositories. Implementations arrive in Wave 2+.
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
  projectReadiness,
} from "@/platform/workforce/services";

export { runM04StorageMigrations } from "../storage";

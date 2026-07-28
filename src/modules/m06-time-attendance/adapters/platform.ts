/**
 * M06 platform adapters — shared workforce helpers.
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

export { runM06StorageMigrations } from "../storage";
export { ensurePersonReadWarmed } from "./m04-person-read";
export { ensureShiftReadWarmed } from "./m05-shift-read";

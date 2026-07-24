/**
 * Module 2 adapters — expose inbox bridge entry points for other modules via platform services.
 * Other modules must call platform services, not this adapter's M2 repository.
 */

export {
  dispatchActionInboxEvent,
  findInboxActionForSource,
  getSourceLinkForInboxAction,
} from "@/platform/services/action-inbox-bridge";

export { publishPlatformNotification } from "@/platform/services/notification-publisher";

export { adaptM2Audit } from "@/platform/contracts/audit";

export { computeExecutiveInboxSummary } from "@/platform/services/executive-summary";

/**
 * Module 1 adapters — connect existing Command Centre to platform clinic + inbox projection contracts.
 * Do not import other modules' repositories from here.
 */

export {
  syncFromModule1SelectedClinics,
  hydrateClinicContext,
  portalActiveLocationId,
} from "@/platform/context/clinic-context";

export {
  computeExecutiveInboxSummary,
  isOperationalInboxProjection,
} from "@/platform/services/executive-summary";

export type { ExecutiveInboxSummary } from "@/platform/contracts/executive-summary";

export { adaptM1Audit } from "@/platform/contracts/audit";

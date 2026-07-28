/**
 * M07 repository interfaces — payroll preparation SoT (Batch 1).
 * Consumes TimesheetRef / WorkforcePersonRef; never edits M04/M06 repositories.
 */

import type { PayPeriodRef } from "@/platform/workforce/contracts/pay-period-ref";
import type { TimesheetRef } from "@/platform/workforce/contracts/timesheet-ref";
import type { WorkforcePersonRef } from "@/platform/workforce/contracts/workforce-person-ref";
import type {
  ClassificationRuleMapping,
  ExportProfile,
  GenericCode,
  LegalEntityPaySettings,
  M07AuditEvent,
  PayPeriodRecord,
  PayProfile,
  PreparationRule,
} from "../types/domain";

export interface M07StaffPayRepository {
  listPeriods(): PayPeriodRecord[];
  getPeriod(id: string): PayPeriodRecord | null;
  upsertPeriod(period: PayPeriodRecord): void;
  listProfiles(legalEntityId?: string): PayProfile[];
  getProfile(id: string): PayProfile | null;
  upsertProfile(profile: PayProfile): void;
  listRules(legalEntityId?: string): PreparationRule[];
  upsertRule(rule: PreparationRule): void;
  listCodes(legalEntityId?: string): GenericCode[];
  upsertCode(code: GenericCode): void;
  listExportProfiles(legalEntityId?: string): ExportProfile[];
  upsertExportProfile(profile: ExportProfile): void;
  listClassificationMaps(legalEntityId?: string): ClassificationRuleMapping[];
  upsertClassificationMap(map: ClassificationRuleMapping): void;
  getEntitySettings(legalEntityId: string): LegalEntityPaySettings | null;
  upsertEntitySettings(settings: LegalEntityPaySettings): void;
  appendAudit(event: M07AuditEvent): void;
  listAudit(legalEntityId?: string): M07AuditEvent[];
  /**
   * Batch 1: interface only — full intake is Batch 2+.
   * Must not be used to claim intake is implemented.
   */
  linkApprovedTimesheet?(periodId: string, timesheet: TimesheetRef): void;
  resolvePerson?(personId: string): WorkforcePersonRef | null;
  toPayPeriodRef?(period: PayPeriodRecord): PayPeriodRef;
}

export type M07Repositories = {
  staffPay: M07StaffPayRepository;
};

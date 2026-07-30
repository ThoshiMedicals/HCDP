/**
 * M07 local JSON store — Batch 1 foundation collections.
 * Additive persistence; no cross-module repository imports.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import type {
  ClassificationRuleMapping,
  DeductionPrepInput,
  ExportProfile,
  GenericCode,
  LeavePrepLine,
  LegalEntityPaySettings,
  M07AuditEvent,
  PackageReconciliation,
  PayCalculationBatch,
  PayPeriodApproval,
  PayPeriodRecord,
  PayPrepException,
  PayProfile,
  PayrollExportBatch,
  PeriodLockRecord,
  PeriodUnlockRequest,
  PreparationRule,
} from "../types/domain";
import { M07_STORAGE_KEYS } from "../storage/keys";
import { runM07SchemaV6Migration } from "../storage/migrate-v6";
import { runM07SchemaV7Migration } from "../storage/migrate-v7";
import { runM07SchemaV8Migration } from "../storage/migrate-v8";
import { runM07SchemaV9Migration } from "../storage/migrate-v9";
import { areM07TestHooksAllowed } from "../testing/m07-test-hooks-gate";

const listCache = new Map<string, unknown[]>();

/** Test-only: force the next N period upserts to fail (PPA-1 atomicity injection). */
let __periodWriteFailRemaining = 0;

/**
 * Test-only. No-ops unless `areM07TestHooksAllowed()` (fail-closed; never when process is undefined).
 * Causes the next `count` calls to `upsertPeriod` to throw before persistence.
 */
export function __setPeriodWriteFailForTests(count: number): void {
  if (!areM07TestHooksAllowed()) return;
  __periodWriteFailRemaining = Math.max(0, Math.floor(count));
}

export function clearM07LocalStoreCacheForTests(): void {
  listCache.clear();
  __periodWriteFailRemaining = 0;
}

export function invalidateM07LocalStoreCache(key?: string): void {
  if (key) listCache.delete(key);
  else listCache.clear();
}

function loadList<T>(key: string): T[] {
  const cached = listCache.get(key);
  if (cached) return cached as T[];
  const list = readJsonSafe<T[]>(key, []);
  listCache.set(key, list as unknown[]);
  return list;
}

function saveList<T>(key: string, items: T[]): void {
  listCache.set(key, items as unknown[]);
  writeJsonSafe(key, items);
}

export function upsertById<T extends { id: string }>(key: string, item: T): T {
  const list = loadList<T>(key);
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  saveList(key, list);
  return item;
}

export function newProfileId(): string { return uid("ppf"); }
export function newRuleId(): string { return uid("prule"); }
export function newCodeId(): string { return uid("pcode"); }
export function newExportProfileId(): string { return uid("expprof"); }
export function newPeriodId(): string { return uid("pperiod"); }
export function newMappingId(): string { return uid("pmap"); }
export function newAuditId(): string { return uid("paud"); }
export function newEntitySettingsId(): string { return uid("pes"); }

// Profiles
export function listProfiles(legalEntityId?: string): PayProfile[] {
  const all = loadList<PayProfile>(M07_STORAGE_KEYS.profiles).map(normalizePayProfile);
  return legalEntityId ? all.filter((p) => p.legalEntityId === legalEntityId) : all;
}
export function getProfile(id: string): PayProfile | null {
  return listProfiles().find((p) => p.id === id) ?? null;
}
export function upsertProfile(p: PayProfile): PayProfile {
  return upsertById(M07_STORAGE_KEYS.profiles, normalizePayProfile(p));
}

/** Additive read/write normalize: materialProfileRevision defaults to version for legacy rows. */
function normalizePayProfile(p: PayProfile): PayProfile {
  const version = typeof p.version === "number" && p.version > 0 ? p.version : 1;
  const material =
    typeof p.materialProfileRevision === "number" && p.materialProfileRevision > 0
      ? p.materialProfileRevision
      : version;
  return { ...p, version, materialProfileRevision: material };
}

// Rules
export function listRules(legalEntityId?: string): PreparationRule[] {
  const all = loadList<PreparationRule>(M07_STORAGE_KEYS.rules);
  return legalEntityId ? all.filter((r) => r.legalEntityId === legalEntityId) : all;
}
export function getRule(id: string): PreparationRule | null {
  return listRules().find((r) => r.id === id) ?? null;
}
export function upsertRule(r: PreparationRule): PreparationRule {
  return upsertById(M07_STORAGE_KEYS.rules, r);
}

// Classification maps
export function listClassificationMaps(legalEntityId?: string): ClassificationRuleMapping[] {
  const all = loadList<ClassificationRuleMapping>(M07_STORAGE_KEYS.classificationMaps);
  return legalEntityId ? all.filter((m) => m.legalEntityId === legalEntityId) : all;
}
export function getClassificationMap(id: string): ClassificationRuleMapping | null {
  return listClassificationMaps().find((m) => m.id === id) ?? null;
}
export function upsertClassificationMap(m: ClassificationRuleMapping): ClassificationRuleMapping {
  return upsertById(M07_STORAGE_KEYS.classificationMaps, m);
}

// Codes
export function listCodes(legalEntityId?: string): GenericCode[] {
  const all = loadList<GenericCode>(M07_STORAGE_KEYS.codes);
  return legalEntityId ? all.filter((c) => c.legalEntityId === legalEntityId) : all;
}
export function getCode(id: string): GenericCode | null {
  return listCodes().find((c) => c.id === id) ?? null;
}
export function upsertCode(c: GenericCode): GenericCode {
  return upsertById(M07_STORAGE_KEYS.codes, c);
}

// Export profiles
export function listExportProfiles(legalEntityId?: string): ExportProfile[] {
  const all = loadList<ExportProfile>(M07_STORAGE_KEYS.exportProfiles);
  if (!legalEntityId) return all;
  return all.filter((p) => p.legalEntityId === legalEntityId || p.legalEntityId === "*");
}
export function getExportProfile(id: string): ExportProfile | null {
  return listExportProfiles().find((p) => p.id === id) ?? null;
}
export function upsertExportProfile(p: ExportProfile): ExportProfile {
  return upsertById(M07_STORAGE_KEYS.exportProfiles, p);
}

// Periods
export function listPeriods(legalEntityId?: string): PayPeriodRecord[] {
  const all = loadList<PayPeriodRecord>(M07_STORAGE_KEYS.periods);
  return legalEntityId ? all.filter((p) => p.legalEntityId === legalEntityId) : all;
}
export function getPeriod(id: string): PayPeriodRecord | null {
  return listPeriods().find((p) => p.id === id) ?? null;
}
export function upsertPeriod(p: PayPeriodRecord): PayPeriodRecord {
  if (__periodWriteFailRemaining > 0 && areM07TestHooksAllowed()) {
    __periodWriteFailRemaining -= 1;
    throw new Error("m07-period-write-fail-for-tests");
  }
  return upsertById(M07_STORAGE_KEYS.periods, p);
}

// Entity settings
export function listEntitySettings(): LegalEntityPaySettings[] {
  return loadList<LegalEntityPaySettings>(M07_STORAGE_KEYS.legalEntities);
}
export function getEntitySettings(legalEntityId: string): LegalEntityPaySettings | null {
  return listEntitySettings().find((s) => s.legalEntityId === legalEntityId) ?? null;
}
export function upsertEntitySettings(s: LegalEntityPaySettings): LegalEntityPaySettings {
  return upsertById(M07_STORAGE_KEYS.legalEntities, s);
}

// Audit (append-only)
export function listAudit(legalEntityId?: string): M07AuditEvent[] {
  const all = loadList<M07AuditEvent>(M07_STORAGE_KEYS.audit);
  return legalEntityId ? all.filter((a) => a.legalEntityId === legalEntityId) : all;
}
export function appendAudit(event: M07AuditEvent): M07AuditEvent {
  const list = loadList<M07AuditEvent>(M07_STORAGE_KEYS.audit);
  if (list.some((e) => e.id === event.id)) {
    return list.find((e) => e.id === event.id)!;
  }
  list.push(event);
  saveList(M07_STORAGE_KEYS.audit, list);
  return event;
}

function ensureBatch3Collections() {
  runM07SchemaV6Migration();
}

function ensureBatch4Collections() {
  runM07SchemaV7Migration();
}

function ensureBatch5Collections() {
  runM07SchemaV8Migration();
}

export function newExceptionId(): string {
  return uid("pex");
}
export function newCalculationBatchId(): string {
  return uid("pcalc");
}
export function newLeavePrepLineId(): string {
  return uid("plv");
}
export function newPayPrepLineId(): string {
  return uid("pline");
}
export function newDeductionPrepInputId(): string {
  return uid("pdin");
}
export function newApprovalId(periodId: string, version: number): string {
  return `aprv_${periodId}_v${version}`;
}

// Exceptions (Batch 3)
export function listExceptions(legalEntityId?: string): PayPrepException[] {
  ensureBatch3Collections();
  const all = loadList<PayPrepException>(M07_STORAGE_KEYS.exceptions);
  return legalEntityId ? all.filter((e) => e.legalEntityId === legalEntityId) : all;
}
export function getException(id: string): PayPrepException | null {
  return listExceptions().find((e) => e.id === id) ?? null;
}
export function upsertException(e: PayPrepException): PayPrepException {
  ensureBatch3Collections();
  return upsertById(M07_STORAGE_KEYS.exceptions, e);
}

// Calculation batches (Batch 3) — stored under calculations key
export function listCalculationBatches(legalEntityId?: string): PayCalculationBatch[] {
  ensureBatch3Collections();
  const all = loadList<PayCalculationBatch>(M07_STORAGE_KEYS.calculations);
  return legalEntityId ? all.filter((c) => c.legalEntityId === legalEntityId) : all;
}
export function getCalculationBatch(id: string): PayCalculationBatch | null {
  return listCalculationBatches().find((c) => c.id === id) ?? null;
}
export function upsertCalculationBatch(b: PayCalculationBatch): PayCalculationBatch {
  ensureBatch3Collections();
  return upsertById(M07_STORAGE_KEYS.calculations, b);
}

// Leave prep lines (Batch 3)
export function listLeavePrepLines(legalEntityId?: string): LeavePrepLine[] {
  ensureBatch3Collections();
  const all = loadList<LeavePrepLine>(M07_STORAGE_KEYS.leavePrepLines);
  return legalEntityId ? all.filter((l) => l.legalEntityId === legalEntityId) : all;
}
export function getLeavePrepLine(id: string): LeavePrepLine | null {
  return listLeavePrepLines().find((l) => l.id === id) ?? null;
}
export function upsertLeavePrepLine(l: LeavePrepLine): LeavePrepLine {
  ensureBatch3Collections();
  return upsertById(M07_STORAGE_KEYS.leavePrepLines, l);
}

// Deduction prep inputs (Batch 4) — source inputs distinct from calc outputs
export function listDeductionPrepInputs(legalEntityId?: string): DeductionPrepInput[] {
  ensureBatch4Collections();
  const all = loadList<DeductionPrepInput>(M07_STORAGE_KEYS.deductionPrepInputs);
  return legalEntityId ? all.filter((d) => d.legalEntityId === legalEntityId) : all;
}
export function getDeductionPrepInput(id: string): DeductionPrepInput | null {
  return listDeductionPrepInputs().find((d) => d.id === id) ?? null;
}
export function upsertDeductionPrepInput(d: DeductionPrepInput): DeductionPrepInput {
  ensureBatch4Collections();
  return upsertById(M07_STORAGE_KEYS.deductionPrepInputs, d);
}

// Approvals (Batch 5) — historical versions retained; never delete
export function listApprovals(legalEntityId?: string): PayPeriodApproval[] {
  ensureBatch5Collections();
  const all = loadList<PayPeriodApproval>(M07_STORAGE_KEYS.approvals);
  // Skip malformed / partial records safely
  const valid = all.filter(
    (a) =>
      a &&
      typeof a === "object" &&
      typeof (a as PayPeriodApproval).id === "string" &&
      typeof (a as PayPeriodApproval).logicalKey === "string" &&
      typeof (a as PayPeriodApproval).periodId === "string"
  );
  return legalEntityId ? valid.filter((a) => a.legalEntityId === legalEntityId) : valid;
}

export function getApproval(id: string): PayPeriodApproval | null {
  return listApprovals().find((a) => a.id === id) ?? null;
}

export function listApprovalsForPeriod(periodId: string): PayPeriodApproval[] {
  return listApprovals()
    .filter((a) => a.periodId === periodId)
    .sort((a, b) => b.approvalVersion - a.approvalVersion);
}

export function getCurrentApprovalForPeriod(periodId: string): PayPeriodApproval | null {
  const rows = listApprovalsForPeriod(periodId).filter(
    (a) => !["superseded"].includes(a.status)
  );
  // Prefer active lifecycle states over historical terminal ones when multiple
  const active = rows.find((a) =>
    ["draft", "submitted", "approved"].includes(a.status)
  );
  if (active) return active;
  return rows[0] ?? null;
}

export function upsertApproval(a: PayPeriodApproval): PayPeriodApproval {
  ensureBatch5Collections();
  return upsertById(M07_STORAGE_KEYS.approvals, a);
}

export function approvalLogicalKey(legalEntityId: string, periodId: string): string {
  return `approval::${legalEntityId}::${periodId}`;
}

function ensureBatch6Collections() {
  runM07SchemaV9Migration();
}

export function newExportBatchId(periodId: string, revision: number): string {
  return `expb_${periodId}_r${revision}`;
}
export function newReconciliationId(): string {
  return uid("precon");
}
export function newPeriodLockId(): string {
  return uid("plock");
}
export function newUnlockRequestId(): string {
  return uid("punl");
}
export function newDownloadRecordId(): string {
  return uid("pdl");
}

function normalizeExportBatch(b: PayrollExportBatch): PayrollExportBatch {
  return {
    ...b,
    status: b.status ?? "draft",
    validationIssues: Array.isArray(b.validationIssues) ? b.validationIssues : [],
    downloadHistory: Array.isArray(b.downloadHistory) ? b.downloadHistory : [],
    totals: b.totals ?? {
      lineCount: 0,
      workerCount: 0,
      ordinaryHours: 0,
      overtimeHours: 0,
      leaveDays: 0,
      allowanceUnits: 0,
      deductionUnits: 0,
    },
    lineCount: typeof b.lineCount === "number" ? b.lineCount : 0,
    sourceVerificationOk: Boolean(b.sourceVerificationOk),
    certified: false,
    paymentReady: false,
  };
}

// Export batches (Batch 6) — historical finalized rows retained; never silent overwrite
export function listExportBatches(legalEntityId?: string): PayrollExportBatch[] {
  ensureBatch6Collections();
  const all = loadList<PayrollExportBatch>(M07_STORAGE_KEYS.exports)
    .filter((b) => b && typeof b === "object" && typeof (b as PayrollExportBatch).id === "string")
    .map(normalizeExportBatch);
  return legalEntityId ? all.filter((b) => b.legalEntityId === legalEntityId) : all;
}

export function getExportBatch(id: string): PayrollExportBatch | null {
  return listExportBatches().find((b) => b.id === id) ?? null;
}

export function listExportBatchesForPeriod(periodId: string): PayrollExportBatch[] {
  return listExportBatches()
    .filter((b) => b.periodId === periodId)
    .sort((a, b) => b.batchRevision - a.batchRevision);
}

export function getCurrentExportBatchForPeriod(periodId: string): PayrollExportBatch | null {
  const rows = listExportBatchesForPeriod(periodId).filter(
    (b) => !["superseded", "cancelled"].includes(b.status)
  );
  return rows[0] ?? null;
}

export function upsertExportBatch(b: PayrollExportBatch): PayrollExportBatch {
  ensureBatch6Collections();
  return upsertById(M07_STORAGE_KEYS.exports, normalizeExportBatch(b));
}

export function exportIdentityKey(input: {
  legalEntityId: string;
  periodId: string;
  approvalId: string;
  sourceManifestChecksum: string;
  formatVersion: string;
  batchRevision: number;
}): string {
  return [
    "export",
    input.legalEntityId,
    input.periodId,
    input.approvalId,
    input.sourceManifestChecksum,
    input.formatVersion,
    `r${input.batchRevision}`,
  ].join("::");
}

// Reconciliations (Batch 6)
export function listReconciliations(legalEntityId?: string): PackageReconciliation[] {
  ensureBatch6Collections();
  const all = loadList<PackageReconciliation>(M07_STORAGE_KEYS.reconciliations).filter(
    (r) => r && typeof r === "object" && typeof (r as PackageReconciliation).id === "string"
  );
  return legalEntityId ? all.filter((r) => r.legalEntityId === legalEntityId) : all;
}

export function getReconciliation(id: string): PackageReconciliation | null {
  return listReconciliations().find((r) => r.id === id) ?? null;
}

export function upsertReconciliation(r: PackageReconciliation): PackageReconciliation {
  ensureBatch6Collections();
  return upsertById(M07_STORAGE_KEYS.reconciliations, r);
}

// Period locks (Batch 6)
export function listPeriodLocks(legalEntityId?: string): PeriodLockRecord[] {
  ensureBatch6Collections();
  const all = loadList<PeriodLockRecord>(M07_STORAGE_KEYS.periodLocks).filter(
    (r) => r && typeof r === "object" && typeof (r as PeriodLockRecord).id === "string"
  );
  return legalEntityId ? all.filter((r) => r.legalEntityId === legalEntityId) : all;
}

export function getPeriodLock(id: string): PeriodLockRecord | null {
  return listPeriodLocks().find((r) => r.id === id) ?? null;
}

export function getActivePeriodLockForPeriod(periodId: string): PeriodLockRecord | null {
  return (
    listPeriodLocks().find((r) => r.periodId === periodId && r.status === "active") ?? null
  );
}

export function upsertPeriodLock(r: PeriodLockRecord): PeriodLockRecord {
  ensureBatch6Collections();
  return upsertById(M07_STORAGE_KEYS.periodLocks, r);
}

// Unlock requests (Batch 6)
export function listUnlockRequests(legalEntityId?: string): PeriodUnlockRequest[] {
  ensureBatch6Collections();
  const all = loadList<PeriodUnlockRequest>(M07_STORAGE_KEYS.unlockRequests).filter(
    (r) => r && typeof r === "object" && typeof (r as PeriodUnlockRequest).id === "string"
  );
  return legalEntityId ? all.filter((r) => r.legalEntityId === legalEntityId) : all;
}

export function getUnlockRequest(id: string): PeriodUnlockRequest | null {
  return listUnlockRequests().find((r) => r.id === id) ?? null;
}

export function getOpenUnlockRequestForPeriod(periodId: string): PeriodUnlockRequest | null {
  return (
    listUnlockRequests().find(
      (r) =>
        r.periodId === periodId &&
        (r.status === "requested" || r.status === "controls-incomplete")
    ) ?? null
  );
}

export function upsertUnlockRequest(r: PeriodUnlockRequest): PeriodUnlockRequest {
  ensureBatch6Collections();
  return upsertById(M07_STORAGE_KEYS.unlockRequests, r);
}

export function unlockRequestLogicalKey(periodId: string, lockId: string): string {
  return `unlock::${periodId}::${lockId}`;
}

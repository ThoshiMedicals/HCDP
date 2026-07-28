/**
 * M07 local JSON store — Batch 1 foundation collections.
 * Additive persistence; no cross-module repository imports.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
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
import { M07_STORAGE_KEYS } from "../storage/keys";

const listCache = new Map<string, unknown[]>();

export function clearM07LocalStoreCacheForTests(): void {
  listCache.clear();
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
  const all = loadList<PayProfile>(M07_STORAGE_KEYS.profiles);
  return legalEntityId ? all.filter((p) => p.legalEntityId === legalEntityId) : all;
}
export function getProfile(id: string): PayProfile | null {
  return listProfiles().find((p) => p.id === id) ?? null;
}
export function upsertProfile(p: PayProfile): PayProfile {
  return upsertById(M07_STORAGE_KEYS.profiles, p);
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

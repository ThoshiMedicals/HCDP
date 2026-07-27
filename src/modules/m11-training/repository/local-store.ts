/**
 * M11 local JSON store for all training domain records.
 * Soft history: never hard-delete immutable records (completions, assessments, competencies).
 * Corrections use supersedesId chains; supersededById set on prior record.
 */

import { readJsonSafe, uid, writeJsonSafe } from "@/platform/storage/storage";
import type {
  Assessment,
  Assignment,
  AuditEntry,
  CatalogueCourse,
  CompetencyRecord,
  CompletionRecord,
  EvidenceRecord,
  Exemption,
  PolicyVersion,
  AssignmentRule,
  Session,
  TrainingCertificate,
} from "../types/domain";
import { M11_STORAGE_KEYS } from "../storage/keys";

function loadList<T>(key: string): T[] {
  return readJsonSafe<T[]>(key, []);
}

function saveList<T>(key: string, items: T[]): void {
  writeJsonSafe(key, items);
}

function upsertById<T extends { id: string }>(key: string, item: T): T {
  const list = loadList<T>(key);
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  saveList(key, list);
  return item;
}

// ——— UID helpers ———

export function newCourseId(): string { return uid("crs"); }
export function newAssignmentId(): string { return uid("asgn"); }
export function newSessionId(): string { return uid("sess"); }
export function newAssessmentId(): string { return uid("asmt"); }
export function newCompetencyId(): string { return uid("cmp"); }
export function newCertificateId(): string { return uid("cert"); }
export function newExemptionId(): string { return uid("exmp"); }
export function newCompletionId(): string { return uid("comp"); }
export function newEvidenceId(): string { return uid("evid"); }
export function newPolicyId(): string { return uid("pol"); }
export function newRuleId(): string { return uid("polr"); }
export function newAuditId(): string { return uid("aud"); }

// ——— Catalogue ———

export function listCatalogue(organisationId?: string): CatalogueCourse[] {
  const all = loadList<CatalogueCourse>(M11_STORAGE_KEYS.catalogue);
  return organisationId ? all.filter((c) => c.organisationId === organisationId) : all;
}

export function getCourse(id: string): CatalogueCourse | null {
  return listCatalogue().find((c) => c.id === id) ?? null;
}

export function upsertCourse(course: CatalogueCourse): CatalogueCourse {
  return upsertById(M11_STORAGE_KEYS.catalogue, course);
}

// ——— Assignment rules ———

export function listRules(organisationId?: string): AssignmentRule[] {
  const all = loadList<AssignmentRule>(M11_STORAGE_KEYS.rules);
  return organisationId ? all.filter((r) => r.organisationId === organisationId) : all;
}

export function getRule(id: string): AssignmentRule | null {
  return listRules().find((r) => r.id === id) ?? null;
}

export function upsertRule(rule: AssignmentRule): AssignmentRule {
  return upsertById(M11_STORAGE_KEYS.rules, rule);
}

// ——— Assignments ———

export function listAssignments(personId?: string): Assignment[] {
  const all = loadList<Assignment>(M11_STORAGE_KEYS.assignments);
  return personId ? all.filter((a) => a.personId === personId) : all;
}

export function getAssignment(id: string): Assignment | null {
  return listAssignments().find((a) => a.id === id) ?? null;
}

export function upsertAssignment(assignment: Assignment): Assignment {
  return upsertById(M11_STORAGE_KEYS.assignments, assignment);
}

// ——— Sessions ———

export function listSessions(courseId?: string): Session[] {
  const all = loadList<Session>(M11_STORAGE_KEYS.sessions);
  return courseId ? all.filter((s) => s.courseId === courseId) : all;
}

export function getSession(id: string): Session | null {
  return listSessions().find((s) => s.id === id) ?? null;
}

export function upsertSession(session: Session): Session {
  return upsertById(M11_STORAGE_KEYS.sessions, session);
}

// ——— Completions (immutable — append only; corrections via supersedesId) ———

export function listCompletions(personId?: string): CompletionRecord[] {
  const all = loadList<CompletionRecord>(M11_STORAGE_KEYS.completions);
  return personId ? all.filter((c) => c.personId === personId) : all;
}

export function getCompletion(id: string): CompletionRecord | null {
  return listCompletions().find((c) => c.id === id) ?? null;
}

/** Append-only: throw if id already exists. */
export function appendCompletion(record: CompletionRecord): CompletionRecord {
  const list = loadList<CompletionRecord>(M11_STORAGE_KEYS.completions);
  if (list.some((c) => c.id === record.id)) {
    throw new Error(`Completion ${record.id} already exists — completions are immutable`);
  }
  list.push(record);
  saveList(M11_STORAGE_KEYS.completions, list);
  return record;
}

/** Mark a completion as superseded (soft — sets supersededById only). */
export function markCompletionSuperseded(id: string, byId: string): void {
  const list = loadList<CompletionRecord>(M11_STORAGE_KEYS.completions);
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) {
    (list[idx] as CompletionRecord & { supersededById?: string }).supersededById = byId;
    saveList(M11_STORAGE_KEYS.completions, list);
  }
}

// ——— Assessments (supersede prior via supersedesId) ———

export function listAssessments(personId?: string): Assessment[] {
  const all = loadList<Assessment>(M11_STORAGE_KEYS.assessments);
  return personId ? all.filter((a) => a.personId === personId) : all;
}

export function getAssessment(id: string): Assessment | null {
  return listAssessments().find((a) => a.id === id) ?? null;
}

export function upsertAssessment(assessment: Assessment): Assessment {
  return upsertById(M11_STORAGE_KEYS.assessments, assessment);
}

// ——— Competency records ———

export function listCompetencies(personId?: string): CompetencyRecord[] {
  const all = loadList<CompetencyRecord>(M11_STORAGE_KEYS.competencies);
  return personId ? all.filter((c) => c.personId === personId) : all;
}

export function getCompetency(id: string): CompetencyRecord | null {
  return listCompetencies().find((c) => c.id === id) ?? null;
}

export function upsertCompetency(record: CompetencyRecord): CompetencyRecord {
  return upsertById(M11_STORAGE_KEYS.competencies, record);
}

// ——— Certificates ———

export function listCertificates(personId?: string): TrainingCertificate[] {
  const all = loadList<TrainingCertificate>(M11_STORAGE_KEYS.certificates);
  return personId ? all.filter((c) => c.personId === personId) : all;
}

export function getCertificate(id: string): TrainingCertificate | null {
  return listCertificates().find((c) => c.id === id) ?? null;
}

export function upsertCertificate(cert: TrainingCertificate): TrainingCertificate {
  return upsertById(M11_STORAGE_KEYS.certificates, cert);
}

// ——— Exemptions ———

export function listExemptions(personId?: string): Exemption[] {
  const all = loadList<Exemption>(M11_STORAGE_KEYS.exemptions);
  return personId ? all.filter((e) => e.personId === personId) : all;
}

export function getExemption(id: string): Exemption | null {
  return listExemptions().find((e) => e.id === id) ?? null;
}

export function upsertExemption(exemption: Exemption): Exemption {
  return upsertById(M11_STORAGE_KEYS.exemptions, exemption);
}

// ——— Evidence ———

export function listEvidence(personId?: string): EvidenceRecord[] {
  const all = loadList<EvidenceRecord>(M11_STORAGE_KEYS.evidence);
  return personId ? all.filter((e) => e.personId === personId) : all;
}

export function getEvidence(id: string): EvidenceRecord | null {
  return listEvidence().find((e) => e.id === id) ?? null;
}

export function upsertEvidence(evidence: EvidenceRecord): EvidenceRecord {
  return upsertById(M11_STORAGE_KEYS.evidence, evidence);
}

// ——— Policies ———

export function listPolicies(organisationId?: string): PolicyVersion[] {
  const all = loadList<PolicyVersion>(M11_STORAGE_KEYS.policies);
  return organisationId ? all.filter((p) => p.organisationId === organisationId) : all;
}

export function getPolicy(id: string): PolicyVersion | null {
  return listPolicies().find((p) => p.id === id) ?? null;
}

export function upsertPolicy(policy: PolicyVersion): PolicyVersion {
  return upsertById(M11_STORAGE_KEYS.policies, policy);
}

export function getActivePolicy(organisationId: string): PolicyVersion | null {
  return (
    listPolicies(organisationId)
      .filter((p) => p.status === "published")
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0] ?? null
  );
}

// ——— Audit ———

export function listAudit(organisationId?: string): AuditEntry[] {
  const all = loadList<AuditEntry>(M11_STORAGE_KEYS.audit);
  return organisationId ? all.filter((a) => a.organisationId === organisationId) : all;
}

export function appendAuditEntry(entry: AuditEntry): AuditEntry {
  const list = loadList<AuditEntry>(M11_STORAGE_KEYS.audit);
  list.push(entry);
  saveList(M11_STORAGE_KEYS.audit, list);
  return entry;
}

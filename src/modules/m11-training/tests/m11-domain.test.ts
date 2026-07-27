/**
 * M11 domain + Wave 3 readiness bridge tests.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { clearMigrationFlag, writeJsonSafe } from "@/platform/storage/storage";
import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import { registerTrainingContributionProvider } from "@/platform/workforce/services/training-contribution-registry";
import {
  registerWorkforceReadinessLookup,
  registerWorkforceReadinessRecalculate,
  getAuthoritativeWorkforceEligibility,
} from "@/platform/workforce/services/workforce-eligibility";
import { getRosterEligibility } from "@/modules/m05-roster/adapters/eligibility-read";

import { runM11StorageMigrations } from "../storage/migrations";
import { resetM11BootstrapCacheForTests } from "../storage/bootstrap";
import {
  runM11CatalogueSeed,
  runM11PolicySeed,
  rollbackSeedOwnedM11,
} from "../storage/seed-safe";
import * as store from "../repository/local-store";
import { createCourse, listCourses, publishVersion } from "../services/catalogue-service";
import {
  assignManual,
  completeAssignment,
  listAssignments,
} from "../services/assignment-service";
import {
  createSession,
  enrolInSession,
  cancelSession,
  markAttendance,
  listSessions,
} from "../services/session-service";
import { recordAssessment } from "../services/assessment-service";
import { recordCompetency } from "../services/competency-service";
import { issueCertificate, verifyCertificate, revokeCertificate } from "../services/certificate-service";
import {
  requestExemption,
  approveExemption,
  rejectExemption,
  revokeExemption,
} from "../services/exemption-service";
import { addEvidence, verifyEvidence, rejectEvidence } from "../services/evidence-service";
import {
  createPolicyVersion,
  publishPolicyVersion,
  evaluatePersonRequirements,
  listPolicies,
} from "../services/policy-service";
import { previewBulkAssign, submitBulkAssign } from "../services/bulk-assignment-service";
import { buildContributions } from "../services/readiness-bridge";
import { syncOverdueAssignmentToInbox } from "../adapters/m11-inbox-sync";
import { mapDemoIdentityPermissions, assertM11Permission, M11PermissionError } from "../permissions";
import type { M11Actor } from "../permissions";

import { runM04StorageMigrations } from "@/modules/m04-staff-doctors/storage/migrations";
import { resetM04BootstrapCacheForTests } from "@/modules/m04-staff-doctors/storage/bootstrap";
import { createPerson } from "@/modules/m04-staff-doctors/services/person-service";
import {
  calculateReadiness,
  getEffectiveReadiness,
} from "@/modules/m04-staff-doctors/services/readiness-service";
import type { M04Actor } from "@/modules/m04-staff-doctors/permissions";
import { M2_STORAGE } from "@/lib/action-inbox/storage";
import { loadActions } from "@/lib/action-inbox/repository";

function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
  (globalThis as { window?: { localStorage: typeof localStorage } }).window = { localStorage };
  return map;
}

const admin: M11Actor = { userId: "usr_admin", permissions: ["*"] };
const m04Admin: M04Actor = { userId: "usr_admin", permissions: ["*"] };
const viewer: M11Actor = {
  userId: "usr_view",
  permissions: mapDemoIdentityPermissions({
    permissions: [],
    managerControls: false,
    sensitivityClearance: "restricted",
  }),
};

function dueIn(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("m11 domain", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM11BootstrapCacheForTests();
    resetM04BootstrapCacheForTests();
    registerTrainingContributionProvider(null);
    registerWorkforceReadinessLookup(null);
    registerWorkforceReadinessRecalculate(null);
    runM11StorageMigrations();
    runM04StorageMigrations();
    runM11CatalogueSeed();
    runM11PolicySeed();
  });

  it("seeds catalogue and policy idempotently", () => {
    const first = listCourses().length;
    runM11CatalogueSeed();
    runM11PolicySeed();
    assert.equal(listCourses().length, first);
    assert.ok(listPolicies().some((p) => p.status === "published"));
  });

  it("rolls back only seed-owned rows", () => {
    assert.ok(listCourses().length >= 3);
    createCourse(admin, {
      courseCode: "CUSTOM-99",
      title: "Custom Keep",
    });
    rollbackSeedOwnedM11(clearMigrationFlag);
    assert.ok(listCourses().some((c) => c.courseCode === "CUSTOM-99"));
    assert.ok(!listCourses().some((c) => c.courseCode === "CPR-BLS-01"));
  });

  it("catalogue publish leaves prior version immutable", () => {
    const course = createCourse(admin, {
      courseCode: "IMM-01",
      title: "Immutable Course",
    });
    const v1 = publishVersion(admin, course.id, {
      title: "Immutable Course",
      format: "online",
    });
    const priorId = v1.activeVersionId!;
    publishVersion(admin, course.id, {
      title: "Immutable Course v2",
      format: "blended",
    });
    const again = store.getCourse(course.id)!;
    const prior = again.versions.find((v) => v.versionId === priorId);
    assert.equal(prior?.status, "archived");
    assert.equal(prior?.title, "Immutable Course");
    assert.ok(again.versions.some((v) => v.status === "published" && v.title.includes("v2")));
  });

  it("assignment complete creates immutable completion; completion alone does not set competencyMet when policy forbids", () => {
    const bls = listCourses().find((c) => c.courseCode === "CPR-BLS-01")!;
    const a = assignManual(admin, {
      personId: "person_train_1",
      courseId: bls.id,
      dueDate: dueIn(7),
      clinicId: "clinic_a",
    });
    completeAssignment(admin, a.id);
    const completions = store.listCompletions("person_train_1");
    assert.equal(completions.length, 1);
    const evaled = evaluatePersonRequirements("person_train_1");
    const blsExp = evaled.explanations.find((e) => e.requirementId === "req-bls-annual");
    assert.ok(blsExp);
    assert.equal(blsExp!.competencyMet, false);
    assert.notEqual(blsExp!.status, "met");
  });

  it("sessions: schedule, enrol, capacity, attendance, cancel", () => {
    const course = listCourses()[0]!;
    const session = createSession(admin, {
      courseId: course.id,
      scheduledStart: "2026-08-01T09:00:00.000Z",
      scheduledEnd: "2026-08-01T11:00:00.000Z",
      capacityMax: 1,
      clinicId: "clinic_a",
    });
    enrolInSession(admin, session.id, "person_a");
    assert.throws(() => enrolInSession(admin, session.id, "person_b"));
    markAttendance(admin, session.id, ["person_a"]);
    let fresh = listSessions().find((x) => x.id === session.id)!;
    assert.deepEqual(fresh.attendedPersonIds, ["person_a"]);
    // recreate for cancel path
    const s2 = createSession(admin, {
      courseId: course.id,
      scheduledStart: "2026-08-02T09:00:00.000Z",
      scheduledEnd: "2026-08-02T11:00:00.000Z",
      capacityMax: 5,
    });
    cancelSession(admin, s2.id, "Weather");
    fresh = listSessions().find((x) => x.id === s2.id)!;
    assert.equal(fresh.status, "cancelled");
  });

  it("assessments and competencies support supersede chains", () => {
    const course = listCourses()[0]!;
    const a1 = recordAssessment(admin, {
      personId: "p1",
      courseId: course.id,
      outcome: "fail",
    });
    const a2 = recordAssessment(admin, {
      personId: "p1",
      courseId: course.id,
      outcome: "pass",
      supersedesId: a1.id,
    });
    assert.equal(store.getAssessment(a1.id)?.supersededById, a2.id);
    const c1 = recordCompetency(admin, {
      personId: "p1",
      requirementId: "req-bls-annual",
      courseId: course.id,
      competencyMet: true,
    });
    const c2 = recordCompetency(admin, {
      personId: "p1",
      requirementId: "req-bls-annual",
      courseId: course.id,
      competencyMet: true,
      supersedesId: c1.id,
    });
    assert.equal(store.getCompetency(c1.id)?.supersededById, c2.id);
  });

  it("certificates are M11 training outcomes with verify/revoke", () => {
    const course = listCourses()[0]!;
    const cert = issueCertificate(admin, {
      personId: "p1",
      courseId: course.id,
      expiresOn: "2027-07-01",
    });
    const verified = verifyCertificate(admin, cert.id);
    assert.ok(verified.verifiedAt);
    revokeCertificate(admin, cert.id, "Issued in error");
    assert.equal(store.getCertificate(cert.id)?.status, "revoked");
  });

  it("exemptions: no self-approve; approve/reject/revoke with history", () => {
    const course = listCourses()[0]!;
    const req = requestExemption(admin, {
      personId: "p1",
      courseId: course.id,
      reason: "Medical",
      expiresOn: "2026-12-31",
    });
    assert.throws(() => approveExemption(admin, req.id, "self"));
    const other: M11Actor = { userId: "usr_other", permissions: ["*"] };
    approveExemption(other, req.id, "OK");
    assert.equal(store.getExemption(req.id)?.status, "approved");
    const req2 = requestExemption(admin, {
      personId: "p2",
      courseId: course.id,
      reason: "Other",
    });
    rejectExemption(other, req2.id, "Insufficient");
    assert.equal(store.getExemption(req2.id)?.status, "rejected");
    revokeExemption(other, req.id, "Ended");
    assert.equal(store.getExemption(req.id)?.status, "revoked");
  });

  it("evidence verify/reject and sensitive masking permission", () => {
    const course = listCourses()[0]!;
    const ev = addEvidence(admin, {
      personId: "p1",
      courseId: course.id,
      source: "upload",
      label: "Scan",
      sensitive: true,
    });
    verifyEvidence(admin, ev.id);
    assert.equal(store.getEvidence(ev.id)?.status, "verified");
    const ev2 = addEvidence(admin, {
      personId: "p1",
      courseId: course.id,
      source: "external",
      label: "Letter",
      sensitive: false,
    });
    rejectEvidence(admin, ev2.id, "Illegible");
    assert.throws(() => assertM11Permission(viewer, "training.view_sensitive_evidence"));
    assert.throws(() => assertM11Permission(viewer, "training.export"), M11PermissionError);
  });

  it("settings: versioned policy publish archives prior immutable version", () => {
    const course = listCourses()[0]!;
    const draft = createPolicyVersion(admin, {
      label: "Policy v2 draft",
      rules: [
        {
          requirementId: "req-custom",
          courseId: course.id,
          requirementLabel: "Custom",
          requireCompletion: true,
          requireCompetency: false,
          allowCompletionAsCompetency: true,
          organisationId: "org_parent",
          clinicIds: [],
        },
      ],
    });
    assert.equal(draft.status, "draft");
    publishPolicyVersion(admin, draft.id);
    const published = listPolicies().filter((p) => p.status === "published");
    assert.equal(published.length, 1);
    assert.equal(published[0]!.id, draft.id);
    assert.ok(listPolicies().some((p) => p.status === "archived"));
  });

  it("bulk assign preview and partial success", () => {
    const course = listCourses()[0]!;
    const dueDate = dueIn(14);
    const preview = previewBulkAssign(admin, {
      courseId: course.id,
      personIds: ["a", "b", "a"],
      dueDate,
    });
    assert.ok(preview.willAssign.includes("a") || preview.alreadyAssigned.includes("a"));
    const result = submitBulkAssign(admin, {
      courseId: course.id,
      personIds: ["bulk_a", "bulk_b"],
      dueDate,
      clinicId: "clinic_a",
    });
    assert.equal(result.succeeded.length, 2);
    assert.ok(listAssignments().filter((x) => x.courseId === course.id).length >= 2);
  });

  it("M02 inbox overdue assignment dedupe update", () => {
    writeJsonSafe(M2_STORAGE.actions, []);
    const course = listCourses()[0]!;
    const a = assignManual(admin, {
      personId: "p_over",
      courseId: course.id,
      dueDate: dueIn(-5),
      clinicId: "clinic_a",
    });
    store.upsertAssignment({ ...a, status: "overdue", version: a.version + 1 });
    syncOverdueAssignmentToInbox(store.getAssignment(a.id)!);
    syncOverdueAssignmentToInbox(store.getAssignment(a.id)!);
    const actions = loadActions().filter((x) => x.title.includes("Overdue training"));
    assert.equal(actions.length, 1);
  });

  it("readiness contributions are deterministic for same inputs/asOf", () => {
    const asOf = "2026-07-27T00:00:00.000Z";
    const a = buildContributions("person_x", asOf);
    const b = buildContributions("person_x", asOf);
    assert.deepEqual(a.explanations, b.explanations);
    assert.deepEqual(
      a.training.map((t) => t.status),
      b.training.map((t) => t.status)
    );
  });

  it("M11→M04 via registry only; stale event does not overwrite newer", () => {
    registerTrainingContributionProvider((personId, asOf) => buildContributions(personId, asOf));
    const person = createPerson(m04Admin, {
      personKind: "staff",
      preferredName: "Ready Train",
      email: "ready.train@example.com",
    });
    const newer = calculateReadiness(person.id, { asOf: "2026-07-27T12:00:00.000Z" });
    const older = calculateReadiness(person.id, {
      asOf: "2026-07-27T10:00:00.000Z",
      sourceEventId: "evt_stale",
    });
    assert.equal(older.asOf, newer.asOf);
    assert.equal(getEffectiveReadiness(person.id).cache?.calculatedAt, newer.asOf);
  });

  it("M05 consumes authoritative M04/platform readiness — not M11 as SoT", () => {
    registerTrainingContributionProvider((personId, asOf) => buildContributions(personId, asOf));
    const person = createPerson(m04Admin, {
      personKind: "staff",
      preferredName: "Roster Person",
      email: "roster.p@example.com",
    });
    registerWorkforceReadinessLookup((personId) => {
      const eff = getEffectiveReadiness(personId);
      return {
        personId,
        readiness: eff.readiness,
        blockers: eff.blockers,
        asOf: eff.cache?.calculatedAt ?? "1970-01-01T00:00:00.000Z",
        stale: eff.stale,
        trainingDetailRefs: eff.trainingDetailRefs,
      };
    });
    registerWorkforceReadinessRecalculate((personId, options) =>
      calculateReadiness(personId, options)
    );
    calculateReadiness(person.id, { asOf: "2026-07-27T15:00:00.000Z" });
    const platform = getAuthoritativeWorkforceEligibility(person.id);
    const m05 = getRosterEligibility(person.id);
    assert.ok(platform);
    assert.ok(m05);
    assert.equal(m05!.authority, "m04-platform");
    assert.equal(m05!.readiness, platform!.readiness);
    assert.equal(m05!.stale, platform!.stale);
  });

  it("training blockers appear in M04 readiness when requirements unmet", () => {
    registerTrainingContributionProvider((personId, asOf) => buildContributions(personId, asOf));
    const person = createPerson(m04Admin, {
      personKind: "staff",
      preferredName: "Blocked Train",
      email: "blocked.train@example.com",
    });
    const ref = calculateReadiness(person.id, { asOf: "2026-07-27T16:00:00.000Z" });
    assert.ok(ref.blockers.some((b) => b.owningModuleId === "training"));
    assert.notEqual(ref.readiness, "ready");
  });
});

/**
 * Wave 3 closure gate — clinic TZ, M02 lifecycle, clinic-scope service enforcement.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { writeJsonSafe } from "@/platform/storage/storage";
import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import {
  clinicCalendarDate,
  compareCalendarDates,
  deriveAssignmentScheduleStatus,
  registerClinicTimezone,
  clearClinicTimezoneOverridesForTests,
  resolveClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";
import { PLATFORM_KEYS } from "@/platform/storage/storage";

import { runM11StorageMigrations } from "../storage/migrations";
import { resetM11BootstrapCacheForTests } from "../storage/bootstrap";
import { runM11CatalogueSeed, runM11PolicySeed } from "../storage/seed-safe";
import * as store from "../repository/local-store";
import { listCourses } from "../services/catalogue-service";
import {
  assignManual,
  completeAssignment,
  refreshAssignmentStatus,
} from "../services/assignment-service";
import { evaluatePersonRequirements } from "../services/policy-service";
import { issueCertificate, refreshCertificateExpiry } from "../services/certificate-service";
import { previewBulkAssign, submitBulkAssign } from "../services/bulk-assignment-service";
import { addEvidence, listEvidenceForActor } from "../services/evidence-service";
import { exportTrainingSummary } from "../services/reports-service";
import {
  syncOverdueAssignmentToInbox,
  reconcileOverdueAssignmentInbox,
  syncExpiredCertificateToInbox,
  reconcileExpiredCertificateInbox,
  closeCertificateInboxProjection,
  syncExemptionExpiringToInbox,
  reconcileExemptionExpiringInbox,
} from "../adapters/m11-inbox-sync";
import { M11ClinicScopeError, type M11Actor } from "../permissions";
import { M2_STORAGE } from "@/lib/action-inbox/storage";
import { loadActions } from "@/lib/action-inbox/repository";
import { requestExemption, revokeExemption, approveExemption } from "../services/exemption-service";

function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  (globalThis as { window?: { localStorage: Storage } }).window = {
    localStorage: {
      getItem: (k) => (map.has(k) ? map.get(k)! : null),
      setItem: (k, v) => {
        map.set(k, String(v));
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    } as Storage,
  };
}

const admin: M11Actor = { userId: "usr_admin", permissions: ["*"] };
const scopedA: M11Actor = {
  userId: "usr_a",
  permissions: [
    "training.view",
    "training.assign",
    "training.export",
    "training.complete",
    "training.exemption.request",
    "training.exemption.approve",
    "training.certificate.verify",
  ],
  clinicIds: ["clinic_a"],
};
const scopedB: M11Actor = {
  userId: "usr_b",
  permissions: scopedA.permissions,
  clinicIds: ["clinic_b"],
};
const maskedViewer: M11Actor = {
  userId: "usr_mask",
  permissions: ["training.view", "training.export"],
  clinicIds: ["clinic_a"],
};

describe("m11 closure gate", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM11BootstrapCacheForTests();
    clearClinicTimezoneOverridesForTests();
    writeJsonSafe(M2_STORAGE.actions, []);
    writeJsonSafe(PLATFORM_KEYS.sourceLinks, {});
    runM11StorageMigrations();
    runM11CatalogueSeed();
    runM11PolicySeed();
  });

  describe("clinic timezone", () => {
    it("date boundary where clinic date differs from UTC (Pacific/Auckland)", () => {
      // 2026-07-27T12:00:00Z is still 27 Jul in UTC, but 28 Jul in Auckland (UTC+12)
      const asOf = "2026-07-27T12:30:00.000Z";
      const utcDay = asOf.slice(0, 10);
      const akDay = clinicCalendarDate(asOf, "Pacific/Auckland");
      assert.equal(utcDay, "2026-07-27");
      assert.equal(akDay, "2026-07-28");
      assert.notEqual(utcDay, akDay);
    });

    it("due-to-overdue transition uses clinic calendar, not UTC", () => {
      const course = listCourses()[0]!;
      // Due 27 Jul clinic day; at UTC instant that is still 27 Jul UTC but 28 Jul in Auckland → overdue
      const a = assignManual(admin, {
        personId: "p_tz",
        courseId: course.id,
        dueDate: "2026-07-27",
        clinicId: "clinic_b",
      });
      const asOf = "2026-07-27T12:30:00.000Z"; // Auckland = 2026-07-28
      const result = refreshAssignmentStatus(a.id, asOf, 0);
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.schedule, "overdue");
        assert.equal(result.assignment.status, "overdue");
      }
    });

    it("grace-period ending before overdue", () => {
      const course = listCourses()[0]!;
      const a = assignManual(admin, {
        personId: "p_grace",
        courseId: course.id,
        dueDate: "2026-07-20",
        clinicId: "clinic_a",
      });
      // Brisbane = UTC+10; use noon UTC on 2026-07-22 → still 22 Jul Brisbane
      const inGrace = refreshAssignmentStatus(a.id, "2026-07-22T02:00:00.000Z", 3);
      assert.ok(inGrace.ok);
      if (inGrace.ok) assert.equal(inGrace.schedule, "grace");
      const overdue = refreshAssignmentStatus(a.id, "2026-07-24T02:00:00.000Z", 3);
      assert.ok(overdue.ok);
      if (overdue.ok) assert.equal(overdue.schedule, "overdue");
    });

    it("certificate / recurring-training expiry uses clinic day", () => {
      const course = listCourses()[0]!;
      const cert = issueCertificate(admin, {
        personId: "p_cert",
        courseId: course.id,
        clinicId: "clinic_b",
        expiresOn: "2026-07-27",
      });
      // Auckland 28 Jul while UTC still 27 Jul afternoon
      const expired = refreshCertificateExpiry(cert, "2026-07-27T12:30:00.000Z");
      assert.equal(expired.status, "expired");

      // Recurring completion expiry via policy evaluate
      store.appendCompletion({
        id: store.newCompletionId(),
        personId: "p_rec",
        courseId: course.id,
        assignmentId: null,
        sessionId: null,
        organisationId: "org_parent",
        clinicId: "clinic_b",
        completedOn: "2025-07-01",
        completedBy: "usr_admin",
        createdAt: "2025-07-01T00:00:00.000Z",
        version: 1,
      });
      // Force infection-control style: use BLS rule which has recurrenceMonths 12
      const evaled = evaluatePersonRequirements(
        "p_rec",
        "org_parent",
        "2026-07-27T12:30:00.000Z",
        "clinic_b"
      );
      assert.ok(!evaled.unresolvedTimezone);
      const bls = evaled.explanations.find((e) => e.requirementId === "req-bls-annual");
      assert.ok(bls);
      // Completion from 2025-07-01 + 12 months = 2026-07-01; asOf clinic 28 Jul 2026 → expired
      assert.notEqual(bls!.status, "met");
    });

    it("deterministic recalculation for same asOf", () => {
      const course = listCourses()[0]!;
      const a = assignManual(admin, {
        personId: "p_det",
        courseId: course.id,
        dueDate: "2026-07-01",
        clinicId: "clinic_a",
      });
      const asOf = "2026-07-15T04:00:00.000Z";
      const r1 = refreshAssignmentStatus(a.id, asOf, 0);
      const r2 = refreshAssignmentStatus(a.id, asOf, 0);
      assert.deepEqual(
        r1.ok && r1.schedule,
        r2.ok && r2.schedule
      );
      const e1 = evaluatePersonRequirements("p_det", "org_parent", asOf, "clinic_a");
      const e2 = evaluatePersonRequirements("p_det", "org_parent", asOf, "clinic_a");
      assert.deepEqual(e1.explanations, e2.explanations);
    });

    it("missing timezone fails explainably — does not assume UTC", () => {
      const course = listCourses()[0]!;
      const a = assignManual(admin, {
        personId: "p_notz",
        courseId: course.id,
        dueDate: "2026-07-01",
        clinicId: "clinic_unknown_tz",
      });
      const resolved = resolveClinicTimezone("clinic_unknown_tz");
      assert.equal(resolved.ok, false);
      const result = refreshAssignmentStatus(a.id, "2026-07-15T00:00:00.000Z");
      assert.equal(result.ok, false);
      if (!result.ok) assert.match(result.reason, /timezone|IANA|configured/i);

      const evaled = evaluatePersonRequirements(
        "p_notz",
        "org_parent",
        "2026-07-15T00:00:00.000Z",
        "clinic_unknown_tz"
      );
      assert.ok(evaled.unresolvedTimezone);
      assert.ok(evaled.explanations.some((e) => e.requirementId === "clinic.timezone.unresolved"));
      assert.ok(evaled.trainingRefs.length >= 1);
    });

    it("deriveAssignmentScheduleStatus pure transitions", () => {
      assert.equal(
        deriveAssignmentScheduleStatus({ dueDate: "2026-07-10", clinicToday: "2026-07-09", graceDays: 2 }),
        "assigned"
      );
      assert.equal(
        deriveAssignmentScheduleStatus({ dueDate: "2026-07-10", clinicToday: "2026-07-10", graceDays: 2 }),
        "due"
      );
      assert.equal(
        deriveAssignmentScheduleStatus({ dueDate: "2026-07-10", clinicToday: "2026-07-12", graceDays: 2 }),
        "grace"
      );
      assert.equal(
        deriveAssignmentScheduleStatus({ dueDate: "2026-07-10", clinicToday: "2026-07-13", graceDays: 2 }),
        "overdue"
      );
      assert.equal(compareCalendarDates("2026-07-10", "2026-07-11"), -1);
    });
  });

  describe("M02 lifecycle", () => {
    it("overdue: create → dedupe → update → close → stale replay blocked", () => {
      const course = listCourses()[0]!;
      let a = assignManual(admin, {
        personId: "p_m02",
        courseId: course.id,
        dueDate: "2026-01-01",
        clinicId: "clinic_a",
      });
      a = { ...a, status: "overdue", version: a.version + 1, notes: "late" };
      store.upsertAssignment(a);

      const created = syncOverdueAssignmentToInbox(a);
      assert.ok(created);
      assert.equal(created!.status, "Open");
      const afterCreate = loadActions().filter((x) => x.title.includes("Overdue training"));
      assert.equal(afterCreate.length, 1);

      const again = syncOverdueAssignmentToInbox(a);
      assert.ok(again);
      assert.equal(loadActions().filter((x) => x.title.includes("Overdue training")).length, 1);

      a = { ...a, notes: "escalated", version: a.version + 1 };
      store.upsertAssignment(a);
      const updated = syncOverdueAssignmentToInbox(a);
      assert.ok(updated);
      assert.match(updated!.explanation, /escalated|v\d+/);
      assert.equal(loadActions().filter((x) => x.title.includes("Overdue training")).length, 1);

      a = { ...a, status: "completed", version: a.version + 1 };
      store.upsertAssignment(a);
      const closed = reconcileOverdueAssignmentInbox(a, "usr_admin");
      assert.ok(closed);
      assert.equal(closed!.status, "Completed");

      // Stale replay of older overdue version must not reopen
      const stale = { ...a, status: "overdue" as const, version: a.version - 1 };
      const replay = syncOverdueAssignmentToInbox(stale);
      assert.ok(replay);
      assert.equal(replay!.status, "Completed");
    });

    it("certificate expiry: create → dedupe → close on revoke → stale blocked", () => {
      const course = listCourses()[0]!;
      let cert = issueCertificate(admin, {
        personId: "p_ce",
        courseId: course.id,
        clinicId: "clinic_a",
        expiresOn: "2026-01-01",
      });
      cert = refreshCertificateExpiry(cert, "2026-07-01T00:00:00.000Z");
      assert.equal(cert.status, "expired");

      syncExpiredCertificateToInbox(cert);
      syncExpiredCertificateToInbox(cert);
      assert.equal(loadActions().filter((x) => x.title.includes("certificate expired")).length, 1);

      cert = { ...cert, status: "revoked", version: cert.version + 1 };
      store.upsertCertificate(cert);
      const closed = closeCertificateInboxProjection(cert, "usr_admin");
      assert.equal(closed!.status, "Completed");

      const stale = { ...cert, status: "expired" as const, version: cert.version - 1 };
      const replay = syncExpiredCertificateToInbox(stale);
      assert.equal(replay!.status, "Completed");
    });

    it("exemption expiring: create → update → close on revoke", () => {
      const course = listCourses()[0]!;
      const req = requestExemption(admin, {
        personId: "p_ex",
        courseId: course.id,
        reason: "temp",
        clinicId: "clinic_a",
        expiresOn: "2026-08-01",
      });
      const other: M11Actor = { userId: "usr_other", permissions: ["*"] };
      let ex = approveExemption(other, req.id, "ok");
      syncExemptionExpiringToInbox(ex, 60, "2026-07-20T00:00:00.000Z");
      ex = { ...ex, reviewNotes: "follow-up", version: ex.version + 1 };
      store.upsertExemption(ex);
      syncExemptionExpiringToInbox(ex, 60, "2026-07-20T00:00:00.000Z");
      assert.equal(loadActions().filter((x) => x.title.includes("exemption expiring")).length, 1);

      ex = revokeExemption(other, ex.id, "ended");
      const closed = reconcileExemptionExpiringInbox(ex, "usr_other");
      assert.ok(closed);
      assert.equal(closed!.status, "Completed");
    });
  });

  describe("clinic-scope service enforcement", () => {
    it("authorised actor within clinic scope succeeds", () => {
      const course = listCourses()[0]!;
      const a = assignManual(scopedA, {
        personId: "p_in",
        courseId: course.id,
        dueDate: "2026-08-01",
        clinicId: "clinic_a",
      });
      assert.equal(a.clinicId, "clinic_a");
    });

    it("actor outside clinic scope is denied", () => {
      const course = listCourses()[0]!;
      assert.throws(
        () =>
          assignManual(scopedA, {
            personId: "p_out",
            courseId: course.id,
            dueDate: "2026-08-01",
            clinicId: "clinic_b",
          }),
        M11ClinicScopeError
      );
    });

    it("multi-clinic bulk assignment reports out-of-scope safely", () => {
      const course = listCourses()[0]!;
      const preview = previewBulkAssign(scopedA, {
        courseId: course.id,
        dueDate: "2026-08-01",
        personIds: ["p1", "p2"],
        personClinicIds: { p1: "clinic_a", p2: "clinic_b" },
      });
      assert.deepEqual(preview.outOfScope, ["p2"]);
      assert.deepEqual(preview.willAssign, ["p1"]);
      const result = submitBulkAssign(scopedA, {
        courseId: course.id,
        dueDate: "2026-08-01",
        personIds: ["p1", "p2"],
        personClinicIds: { p1: "clinic_a", p2: "clinic_b" },
      });
      assert.equal(result.succeeded.length, 1);
      assert.equal(result.failed.some((f) => f.personId === "p2"), true);
    });

    it("sensitive evidence remains masked across clinic boundaries", () => {
      const course = listCourses()[0]!;
      addEvidence(admin, {
        personId: "p_ev",
        courseId: course.id,
        source: "upload",
        label: "Secret scan",
        sensitive: true,
        clinicId: "clinic_a",
      });
      addEvidence(admin, {
        personId: "p_ev",
        courseId: course.id,
        source: "upload",
        label: "Other clinic secret",
        sensitive: true,
        clinicId: "clinic_b",
      });
      const forA = listEvidenceForActor(maskedViewer);
      assert.equal(forA.length, 1);
      assert.equal(forA[0]!.masked, true);
      assert.equal(forA[0]!.label, "[masked sensitive evidence]");
      assert.equal(forA[0]!.url, null);
      const forB = listEvidenceForActor(scopedB);
      assert.equal(forB.every((e) => e.clinicId === "clinic_b"), true);
    });

    it("export cannot bypass clinic scope", () => {
      const course = listCourses()[0]!;
      assignManual(admin, {
        personId: "p_exp_a",
        courseId: course.id,
        dueDate: "2026-08-01",
        clinicId: "clinic_a",
      });
      assignManual(admin, {
        personId: "p_exp_b",
        courseId: course.id,
        dueDate: "2026-08-01",
        clinicId: "clinic_b",
      });
      const payload = exportTrainingSummary(scopedA);
      assert.deepEqual(payload.clinicScope, ["clinic_a"]);
      assert.equal(payload.assignments, 1);
      assert.throws(() => exportTrainingSummary({ ...scopedA, clinicIds: [] }));
    });
  });
});

// silence unused
void registerClinicTimezone;
void completeAssignment;
void reconcileExpiredCertificateInbox;

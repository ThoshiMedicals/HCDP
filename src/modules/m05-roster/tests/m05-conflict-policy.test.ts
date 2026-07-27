/**
 * M05 conflict / fatigue engine (§9 of the plan).
 *
 * Rules covered: overlap (block), min_break (warn), max_daily_hours (warn),
 * max_weekly_hours (warn), consecutive_days (warn), approved_leave_clash (block).
 * Each result exposes ruleId, ruleVersion, severity, description, remediation.
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { resetWorkforceEventBusForTests } from "@/platform/workforce/services/workforce-event-bus";
import {
  clearClinicTimezoneOverridesForTests,
  registerClinicTimezone,
} from "@/platform/workforce/services/clinic-timezone";
import { registerWorkforceReadinessLookup } from "@/platform/workforce/services/workforce-eligibility";

import { runM05StorageMigrations } from "../storage/migrations";
import { runM05SchemaV2Migration } from "../storage/migrate-v2";
import { resetM05BootstrapCacheForTests } from "../storage/bootstrap";
import { createPeriod } from "../services/period-service";
import { createShift } from "../services/shift-service";
import { assignPerson } from "../services/assignment-service";
import {
  createPolicyVersion,
  publishPolicy,
  getActivePolicyForOrg,
} from "../services/policy-service";
import { evaluateConflicts } from "../services/conflict-service";
import { setApprovedLeaveForTests } from "../services/availability-read-service";
import { DEFAULT_CONFLICT_POLICY_RULES } from "../types/policy";
import * as store from "../repository/local-store";
import type { M05Actor } from "../permissions";

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

const admin: M05Actor = { userId: "usr_admin", permissions: ["*"] };
const CLINIC = "clinic_a";

describe("m05 conflict policy", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    resetWorkforceEventBusForTests();
    resetM05BootstrapCacheForTests();
    clearClinicTimezoneOverridesForTests();
    registerWorkforceReadinessLookup((personId, asOf) => ({
      personId,
      readiness: "ready",
      blockers: [],
      asOf: asOf ?? new Date().toISOString(),
      stale: false,
      trainingDetailRefs: [],
    }));
    runM05StorageMigrations();
    runM05SchemaV2Migration();
    registerClinicTimezone(CLINIC, "Australia/Brisbane");

    // publish default conflict policy (idempotent — one active per org)
    const drafted = createPolicyVersion(admin, {
      label: "Default rules",
      rules: DEFAULT_CONFLICT_POLICY_RULES,
    });
    publishPolicy(admin, drafted.id);
  });

  it("policy publish archives prior published version — only one active per org", () => {
    const initial = getActivePolicyForOrg("org_parent");
    assert.ok(initial);
    const v2 = createPolicyVersion(admin, { label: "Stricter" });
    publishPolicy(admin, v2.id);
    const active = getActivePolicyForOrg("org_parent");
    assert.ok(active);
    assert.equal(active!.id, v2.id);
    assert.equal(active!.status, "published");
    // Prior should be archived
    const prior = store.getPolicy(initial!.id);
    assert.equal(prior?.status, "archived");
  });

  it("overlap is a BLOCK severity finding with explainable rule id + version", () => {
    const period = createPeriod(admin, {
      label: "P",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const s1 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    assignPerson(admin, {
      shiftId: s1.id,
      personId: "person_x",
      expectedShiftVersion: s1.version,
    });
    const s2 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "12:00",
      localEndYmd: "2026-08-03",
      localEndHm: "18:00",
    });
    const findings = evaluateConflicts({
      personId: "person_x",
      clinicId: CLINIC,
      candidateShift: s2,
    });
    const overlap = findings.find((f) => f.ruleId === "overlap");
    assert.ok(overlap, "overlap finding expected");
    assert.equal(overlap!.severity, "block");
    assert.equal(overlap!.ruleVersion, 1);
    assert.ok(overlap!.remediation && overlap!.remediation.length > 0);
    assert.ok(overlap!.offendingShiftIds.includes(s1.id));
  });

  it("min_break is a WARN finding when gap between shifts < 8h", () => {
    const period = createPeriod(admin, {
      label: "P",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const s1 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    assignPerson(admin, {
      shiftId: s1.id,
      personId: "person_x",
      expectedShiftVersion: s1.version,
    });
    // s2 starts 4h after s1 ends → below the 8h default min-break
    const s2 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "20:00",
      localEndYmd: "2026-08-04",
      localEndHm: "04:00",
    });
    const findings = evaluateConflicts({
      personId: "person_x",
      clinicId: CLINIC,
      candidateShift: s2,
    });
    const minBreak = findings.find((f) => f.ruleId === "min_break");
    assert.ok(minBreak);
    assert.equal(minBreak!.severity, "warn");
  });

  it("max_daily_hours warns above the daily cap (default 12h)", () => {
    const period = createPeriod(admin, {
      label: "P",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const s1 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "06:00",
      localEndYmd: "2026-08-03",
      localEndHm: "14:00", // 8h
    });
    assignPerson(admin, {
      shiftId: s1.id,
      personId: "person_x",
      expectedShiftVersion: s1.version,
    });
    // Candidate: another 6h on the same day → 14h total
    const s2 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "16:00",
      localEndYmd: "2026-08-03",
      localEndHm: "22:00",
    });
    const findings = evaluateConflicts({
      personId: "person_x",
      clinicId: CLINIC,
      candidateShift: s2,
    });
    const daily = findings.find((f) => f.ruleId === "max_daily_hours");
    assert.ok(daily, "expected max_daily_hours warn");
    assert.equal(daily!.severity, "warn");
    assert.match(daily!.description, /daily cap|exceed/i);
  });

  it("consecutive_days warns above the streak cap (default 6)", () => {
    const period = createPeriod(admin, {
      label: "P",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    // 6 prior days of assigned shifts
    for (let i = 0; i < 6; i++) {
      const day = new Date(Date.UTC(2026, 7, 3 + i)).toISOString().slice(0, 10);
      const s = createShift(admin, {
        rosterPeriodId: period.id,
        clinicId: CLINIC,
        localStartYmd: day,
        localStartHm: "08:00",
        localEndYmd: day,
        localEndHm: "12:00",
      });
      assignPerson(admin, {
        shiftId: s.id,
        personId: "person_x",
        expectedShiftVersion: s.version,
      });
    }
    // 7th consecutive day → over the 6-day cap
    const cand = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-09",
      localStartHm: "08:00",
      localEndYmd: "2026-08-09",
      localEndHm: "12:00",
    });
    const findings = evaluateConflicts({
      personId: "person_x",
      clinicId: CLINIC,
      candidateShift: cand,
    });
    const streak = findings.find((f) => f.ruleId === "consecutive_days");
    assert.ok(streak, "expected consecutive_days warn");
    assert.equal(streak!.severity, "warn");
  });

  it("approved_leave_clash is a BLOCK finding using the M04 leave cache setter", () => {
    setApprovedLeaveForTests([
      {
        id: "lv1",
        personId: "person_x",
        clinicId: CLINIC,
        organisationId: "org_parent",
        localFromDate: "2026-08-01",
        localToDate: "2026-08-10",
        source: "m04-contract",
        loadedAt: new Date().toISOString(),
      },
    ]);
    const period = createPeriod(admin, {
      label: "P",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "16:00",
    });
    const findings = evaluateConflicts({
      personId: "person_x",
      clinicId: CLINIC,
      candidateShift: shift,
    });
    const clash = findings.find((f) => f.ruleId === "approved_leave_clash");
    assert.ok(clash);
    assert.equal(clash!.severity, "block");
    assert.match(clash!.remediation ?? "", /cannot be silently overridden|leave/i);
  });

  it("no conflicts when candidate is well-separated + no leave clash", () => {
    const period = createPeriod(admin, {
      label: "P",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const s1 = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "12:00",
    });
    const findings = evaluateConflicts({
      personId: "person_new",
      clinicId: CLINIC,
      candidateShift: s1,
    });
    // person_new has no prior assignments; no leave; expect zero findings
    assert.equal(findings.length, 0);
  });

  it("evaluateConflicts returns [] when no active policy exists", () => {
    // Archive current policy so no active one exists
    const active = getActivePolicyForOrg("org_parent")!;
    store.upsertPolicy({ ...active, status: "archived", archivedAt: new Date().toISOString() });
    const period = createPeriod(admin, {
      label: "P",
      startsOn: "2026-08-03",
      endsOn: "2026-08-09",
      clinicId: CLINIC,
    });
    const shift = createShift(admin, {
      rosterPeriodId: period.id,
      clinicId: CLINIC,
      localStartYmd: "2026-08-03",
      localStartHm: "08:00",
      localEndYmd: "2026-08-03",
      localEndHm: "12:00",
    });
    const findings = evaluateConflicts({
      personId: "person_x",
      clinicId: CLINIC,
      candidateShift: shift,
    });
    assert.deepEqual(findings, []);
  });
});

/**
 * Contract and reference validation tests (Wave 1).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { WORKFORCE_CONTRACT_VERSION } from "../contracts/common";
import { createWorkforcePersonRef } from "../contracts/workforce-person-ref";
import { createEngagementRef } from "../contracts/engagement-ref";
import { createCandidateRef } from "../contracts/candidate-ref";
import { createShiftRef } from "../contracts/shift-ref";
import {
  validateWorkforcePersonRef,
  validateEngagementRef,
  validateCandidateRef,
  validateShiftRef,
  validateWorkforceRefBase,
} from "../validation/workforce-reference-validation";
import { WORKFORCE_DEMO_REFS } from "../demo/workforce-demo-refs";
import { resolveWorkforceLink } from "../services/workforce-link-resolver";
import { projectReadiness } from "../services/readiness-projection";

describe("workforce contracts", () => {
  it("uses contract version 1 on created refs", () => {
    const person = createWorkforcePersonRef({
      recordId: "p1",
      preferredName: "Test Person",
      personKind: "staff",
      status: "active",
    });
    assert.equal(person.contractVersion, WORKFORCE_CONTRACT_VERSION);
    assert.equal(person.owningModuleId, "staff-doctors");
    assert.equal(person.route, "/staff-doctors");
  });

  it("validates demo refs", () => {
    assert.equal(validateWorkforcePersonRef(WORKFORCE_DEMO_REFS.person).ok, true);
    assert.equal(validateEngagementRef(WORKFORCE_DEMO_REFS.engagement).ok, true);
    assert.equal(validateCandidateRef(WORKFORCE_DEMO_REFS.candidate).ok, true);
    assert.equal(validateShiftRef(WORKFORCE_DEMO_REFS.shift).ok, true);
  });

  it("rejects missing reference", () => {
    const result = validateWorkforceRefBase(null);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.issues.some((i) => i.field === "ref"));
    }
  });

  it("rejects invalid person ref", () => {
    const result = validateWorkforcePersonRef({
      contractVersion: WORKFORCE_CONTRACT_VERSION,
      owningModuleId: "staff-doctors",
      recordId: "",
      status: "active",
      route: "/staff-doctors",
      displayLabel: "x",
      preferredName: "",
      personKind: "staff",
    });
    assert.equal(result.ok, false);
  });

  it("rejects wrong owning module for shift", () => {
    const bad = {
      ...createShiftRef({
        recordId: "s1",
        rosterPeriodId: "p1",
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2026-01-01T08:00:00.000Z",
        published: false,
        status: "draft",
      }),
      owningModuleId: "staff-doctors" as const,
    };
    const result = validateShiftRef(bad as never);
    assert.equal(result.ok, false);
  });

  it("resolves workforce deep links", () => {
    const resolved = resolveWorkforceLink(WORKFORCE_DEMO_REFS.person, "person");
    assert.equal(resolved.ok, true);
    if (resolved.ok) {
      assert.match(resolved.href, /\/staff-doctors\?/);
      assert.match(resolved.href, /recordId=person_demo_001/);
    }
  });

  it("fails link resolve for missing ref", () => {
    const resolved = resolveWorkforceLink(null, "person");
    assert.equal(resolved.ok, false);
  });

  it("projects blocked readiness from expired credential", () => {
    assert.equal(WORKFORCE_DEMO_REFS.readiness.readiness, "blocked");
    assert.ok(WORKFORCE_DEMO_REFS.readiness.blockers.some((b) => b.code.includes("WWCC")));
  });

  it("projects ready when credentials and training clear", () => {
    const ready = projectReadiness({
      personId: "p-ready",
      credentials: [],
      training: [],
    });
    assert.equal(ready.readiness, "ready");
    assert.equal(ready.blockers.length, 0);
  });

  it("keeps engagement linked to person id", () => {
    const eng = createEngagementRef({
      recordId: "e1",
      personId: "person_x",
      roleLabel: "GP",
      effectiveFrom: "2026-01-01",
      status: "active",
    });
    assert.equal(eng.personId, "person_x");
    assert.equal(validateEngagementRef(eng).ok, true);
  });

  it("candidate remains recruitment-owned until promotion", () => {
    const cand = createCandidateRef({
      recordId: "c1",
      preferredName: "Alex",
      stage: "interview",
      status: "active",
      promotedPersonId: null,
    });
    assert.equal(cand.owningModuleId, "recruitment");
    assert.equal(cand.promotedPersonId, null);
  });
});

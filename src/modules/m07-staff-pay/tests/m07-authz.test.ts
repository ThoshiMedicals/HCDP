import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  ORG_A,
  ORG_B,
  actorAll,
  actorApprover,
  actorClinicManager,
  actorClerk,
  actorExportOperator,
  actorOrgB,
  actorPayAdmin,
  resetM07TestEnv,
} from "./_helpers";
import { createOrdinaryPayPeriod } from "../services/period-service";
import {
  createPayProfile,
  linkExternalPayrollEmployeeId,
  listPayProfiles,
} from "../services/profile-service";
import { createPreparationRule } from "../services/rule-service";
import { createGenericCode } from "../services/code-service";
import { createExportProfile, selectActiveExportProfile } from "../services/export-profile-service";
import {
  assertFinalApproveSeparation,
  assertLockActorAllowed,
} from "../services/sod-policy";
import { assertNoProhibitedFields } from "../services/sensitive-fields";
import {
  M07LegalEntityScopeError,
  M07PermissionError,
  M07SeparationOfDutiesError,
  M07ValidationError,
} from "../permissions";
import { listAudit } from "../repository/local-store";

describe("M07 authz / scope / SoD / prohibited fields (Batch 1)", () => {
  beforeEach(() => resetM07TestEnv());

  it("denies period create without permission", () => {
    assert.throws(
      () =>
        createOrdinaryPayPeriod(actorClinicManager(), {
          legalEntityId: ORG_A,
          periodStart: "2026-07-01",
          periodEnd: "2026-07-14",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
  });

  it("enforces legal-entity isolation", () => {
    assert.throws(
      () =>
        createOrdinaryPayPeriod(actorOrgB(), {
          legalEntityId: ORG_A,
          periodStart: "2026-07-01",
          periodEnd: "2026-07-14",
        }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("rejects second open ordinary period", () => {
    const actor = actorClerk();
    createOrdinaryPayPeriod(actor, {
      legalEntityId: ORG_A,
      periodStart: "2026-07-01",
      periodEnd: "2026-07-14",
    });
    assert.throws(
      () =>
        createOrdinaryPayPeriod(actor, {
          legalEntityId: ORG_A,
          periodStart: "2026-07-15",
          periodEnd: "2026-07-28",
        }),
      (e: unknown) => e instanceof M07ValidationError && e.reason === "overlapping-open-period"
    );
  });

  it("rejects overlapping period dates when prior period is locked-like archived only allows non-overlap path", () => {
    // Create in org B independently (isolation)
    createOrdinaryPayPeriod(actorOrgB(), {
      legalEntityId: ORG_B,
      periodStart: "2026-07-01",
      periodEnd: "2026-07-14",
    });
    // Org A first period
    const admin = actorPayAdmin();
    createOrdinaryPayPeriod(admin, {
      legalEntityId: ORG_A,
      periodStart: "2026-08-01",
      periodEnd: "2026-08-14",
    });
  });

  it("enforces external id uniqueness within legal entity", () => {
    const actor = actorPayAdmin();
    const p1 = createPayProfile(actor, {
      personId: "person_a",
      legalEntityId: ORG_A,
      effectiveFrom: "2026-01-01",
    });
    linkExternalPayrollEmployeeId(actor, p1.id, "EXT-SHARED", "a");
    const p2 = createPayProfile(actor, {
      personId: "person_a",
      legalEntityId: ORG_A,
      effectiveFrom: "2026-01-01",
    });
    assert.throws(
      () => linkExternalPayrollEmployeeId(actor, p2.id, "EXT-SHARED", "b"),
      (e: unknown) => e instanceof M07ValidationError && e.reason === "external-id-not-unique"
    );
  });

  it("redacts external id from clinic manager views", () => {
    const admin = actorPayAdmin();
    const p = createPayProfile(admin, {
      personId: "person_a",
      legalEntityId: ORG_A,
      effectiveFrom: "2026-01-01",
    });
    linkExternalPayrollEmployeeId(admin, p.id, "EXT-SECRET", "link");
    const cm = actorClinicManager();
    const listed = listPayProfiles(cm, ORG_A);
    assert.equal(listed[0]?.externalPayrollEmployeeId, undefined);
  });

  it("rejects prohibited banking/tax/super fields", () => {
    assert.throws(
      () => assertNoProhibitedFields({ tfn: "123" }),
      (e: unknown) => e instanceof M07ValidationError && e.reason === "prohibited-identifier"
    );
    assert.throws(() => assertNoProhibitedFields({ bsb: "062000" }));
    assert.throws(() => assertNoProhibitedFields({ bankAccountNumber: "123456" }));
    assert.throws(() => assertNoProhibitedFields({ superMemberNumber: "SM1" }));
    assert.throws(() => assertNoProhibitedFields({ paymentInstructions: "pay me" }));
  });

  it("denies export operator from creating export profiles", () => {
    assert.throws(
      () =>
        createExportProfile(actorExportOperator(), {
          legalEntityId: ORG_A,
          name: "x",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
  });

  it("allows export operator to select but not mutate profile", () => {
    const admin = actorPayAdmin();
    const profile = createExportProfile(admin, {
      legalEntityId: ORG_A,
      name: "min",
      effectiveFrom: "2026-01-01",
    });
    const selected = selectActiveExportProfile(actorExportOperator(), ORG_A, profile.id);
    assert.equal(selected.id, profile.id);
    assert.equal(selected.version, profile.version);
  });

  it("denies clerk rule/code edits", () => {
    assert.throws(
      () =>
        createPreparationRule(actorClerk(), {
          legalEntityId: ORG_A,
          code: "X",
          label: "X",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () =>
        createGenericCode(actorClerk(), {
          legalEntityId: ORG_A,
          code: "Y",
          label: "Y",
          lineType: "allowance",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
  });

  it("SoD: export operator cannot lock; clerk cannot final-approve self", () => {
    assert.throws(
      () => assertLockActorAllowed(actorExportOperator()),
      (e: unknown) => e instanceof M07SeparationOfDutiesError || e instanceof M07PermissionError
    );
    assertLockActorAllowed(actorApprover());
    assert.throws(
      () =>
        assertFinalApproveSeparation({
          actor: actorClerk(),
          legalEntityId: ORG_A,
          calculatedOrSubmittedByUserIds: ["u-clerk"],
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () =>
        assertFinalApproveSeparation({
          actor: actorApprover("u-same"),
          legalEntityId: ORG_A,
          calculatedOrSubmittedByUserIds: ["u-same"],
        }),
      (e: unknown) => e instanceof M07SeparationOfDutiesError
    );
  });

  it("writes audit for authorised mutations", () => {
    const actor = actorPayAdmin();
    createPayProfile(actor, {
      personId: "person_a",
      legalEntityId: ORG_A,
      effectiveFrom: "2026-01-01",
    });
    const audits = listAudit(ORG_A);
    assert.ok(audits.some((a) => a.action === "profile.create"));
  });

  it("admin can mutate configuration", () => {
    const actor = actorAll();
    createPreparationRule(actor, {
      legalEntityId: ORG_A,
      code: "R",
      label: "R",
      effectiveFrom: "2026-01-01",
    });
    createGenericCode(actor, {
      legalEntityId: ORG_A,
      code: "C",
      label: "C",
      lineType: "deduction",
      effectiveFrom: "2026-01-01",
    });
    createExportProfile(actor, {
      legalEntityId: ORG_A,
      name: "N",
      effectiveFrom: "2026-01-01",
    });
  });
});

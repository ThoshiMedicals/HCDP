import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  ORG_A,
  ORG_B,
  actorAll,
  actorClerk,
  actorClinicManager,
  actorExportOperator,
  actorOrgB,
  actorPayAdmin,
  resetM07TestEnv,
} from "./_helpers";
import {
  archivePayProfile,
  createPayProfile,
  linkExternalPayrollEmployeeId,
  relinkExternalPayrollEmployeeId,
  updatePayProfile,
} from "../services/profile-service";
import {
  activateExportProfile,
  createExportProfile,
  retireExportProfile,
  versionExportProfile,
} from "../services/export-profile-service";
import {
  createPreparationRule,
  retirePreparationRule,
  versionPreparationRule,
} from "../services/rule-service";
import {
  createGenericCode,
  retireGenericCode,
  versionGenericCode,
} from "../services/code-service";
import { createOrdinaryPayPeriod } from "../services/period-service";
import { upsertEntityPaySettings } from "../services/entity-settings-service";
import { listAudit } from "../repository/local-store";
import {
  M07LegalEntityScopeError,
  M07PermissionError,
} from "../permissions";

describe("M07 mutation authorization matrix (Batch 1 remediation)", () => {
  beforeEach(() => resetM07TestEnv());

  it("pay profile create/update/archive — permission + entity + audit", () => {
    const admin = actorPayAdmin();
    const profile = createPayProfile(admin, {
      personId: "person_a",
      legalEntityId: ORG_A,
      effectiveFrom: "2026-01-01",
    });
    assert.ok(listAudit(ORG_A).some((a) => a.action === "profile.create"));

    updatePayProfile(admin, profile.id, { leavePayMapping: "map-1" });
    assert.ok(listAudit(ORG_A).some((a) => a.action === "profile.update"));

    archivePayProfile(admin, profile.id, "no longer employed");
    assert.ok(listAudit(ORG_A).some((a) => a.action === "profile.archive"));

    assert.throws(
      () =>
        createPayProfile(actorClinicManager(), {
          personId: "person_a",
          legalEntityId: ORG_A,
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () =>
        createPayProfile(actorOrgB(), {
          personId: "person_b",
          legalEntityId: ORG_A,
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("external id link/relink — permission + uniqueness entity + audit", () => {
    const admin = actorPayAdmin();
    const profile = createPayProfile(admin, {
      personId: "person_a",
      legalEntityId: ORG_A,
      effectiveFrom: "2026-01-01",
    });
    linkExternalPayrollEmployeeId(admin, profile.id, "EXT-A", "initial");
    relinkExternalPayrollEmployeeId(admin, profile.id, "EXT-B", "rotate");
    assert.ok(
      listAudit(ORG_A).some(
        (a) =>
          a.action === "profile.externalId.link" ||
          a.action === "profile.externalId.relink"
      )
    );

    assert.throws(
      () => linkExternalPayrollEmployeeId(actorClerk(), profile.id, "EXT-C", "nope"),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () => linkExternalPayrollEmployeeId(actorOrgB(), profile.id, "EXT-D", "cross"),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("preparation rule create/version/retire — permission + entity + audit", () => {
    const admin = actorPayAdmin();
    const rule = createPreparationRule(admin, {
      legalEntityId: ORG_A,
      code: "R",
      label: "R",
      effectiveFrom: "2026-01-01",
    });
    versionPreparationRule(admin, rule.id, { label: "R2" });
    retirePreparationRule(admin, rule.id, "retired");
    assert.ok(listAudit(ORG_A).some((a) => a.action === "rule.create"));
    assert.ok(listAudit(ORG_A).some((a) => a.action === "rule.version"));

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
        createPreparationRule(actorOrgB(), {
          legalEntityId: ORG_A,
          code: "Y",
          label: "Y",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("generic code create/version/retire — permission + entity + audit", () => {
    const admin = actorPayAdmin();
    const code = createGenericCode(admin, {
      legalEntityId: ORG_A,
      code: "A1",
      label: "A1",
      lineType: "allowance",
      effectiveFrom: "2026-01-01",
    });
    versionGenericCode(admin, code.id, { label: "A1b" });
    retireGenericCode(admin, code.id, "done");
    assert.ok(listAudit(ORG_A).some((a) => a.action === "code.create"));
    assert.ok(listAudit(ORG_A).some((a) => a.action === "code.retire"));

    assert.throws(
      () =>
        createGenericCode(actorExportOperator(), {
          legalEntityId: ORG_A,
          code: "Z",
          label: "Z",
          lineType: "deduction",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () =>
        createGenericCode(actorOrgB(), {
          legalEntityId: ORG_A,
          code: "Z2",
          label: "Z2",
          lineType: "deduction",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("export profile create/version/activate/retire — admin only + entity + audit", () => {
    const admin = actorPayAdmin();
    const profile = createExportProfile(admin, {
      legalEntityId: ORG_A,
      name: "P",
      effectiveFrom: "2026-01-01",
    });
    versionExportProfile(admin, profile.id, { name: "P2" });
    activateExportProfile(admin, profile.id);
    retireExportProfile(admin, profile.id, "retire");
    assert.ok(listAudit(ORG_A).some((a) => a.action === "export-profile.create"));
    assert.ok(listAudit(ORG_A).some((a) => a.action === "export-profile.retire"));

    assert.throws(
      () =>
        createExportProfile(actorExportOperator(), {
          legalEntityId: ORG_A,
          name: "nope",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () =>
        createExportProfile(actorOrgB(), {
          legalEntityId: ORG_A,
          name: "cross",
          effectiveFrom: "2026-01-01",
        }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("ordinary pay period create — period.create + entity + audit", () => {
    const clerk = actorClerk();
    createOrdinaryPayPeriod(clerk, {
      legalEntityId: ORG_A,
      periodStart: "2026-11-01",
      periodEnd: "2026-11-14",
    });
    assert.ok(listAudit(ORG_A).some((a) => a.action === "period.create"));

    assert.throws(
      () =>
        createOrdinaryPayPeriod(actorClinicManager(), {
          legalEntityId: ORG_A,
          periodStart: "2026-12-01",
          periodEnd: "2026-12-14",
        }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () =>
        createOrdinaryPayPeriod(actorOrgB(), {
          legalEntityId: ORG_A,
          periodStart: "2026-12-01",
          periodEnd: "2026-12-14",
        }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("entity settings upsert — entity.settings + entity + audit", () => {
    const admin = actorPayAdmin();
    upsertEntityPaySettings(admin, ORG_A, { separationOfDuties: true });
    assert.ok(
      listAudit(ORG_A).some(
        (a) => a.action === "entity-settings.create" || a.action === "entity-settings.update"
      )
    );
    assert.throws(
      () => upsertEntityPaySettings(actorClerk(), ORG_A, { cadenceDefault: "weekly" }),
      (e: unknown) => e instanceof M07PermissionError
    );
    assert.throws(
      () => upsertEntityPaySettings(actorOrgB(), ORG_A, { cadenceDefault: "weekly" }),
      (e: unknown) => e instanceof M07LegalEntityScopeError
    );
  });

  it("wildcard admin can mutate across entities when unrestricted", () => {
    const admin = actorAll();
    createOrdinaryPayPeriod(admin, {
      legalEntityId: ORG_B,
      periodStart: "2026-01-01",
      periodEnd: "2026-01-14",
    });
    assert.ok(listAudit(ORG_B).some((a) => a.action === "period.create"));
  });
});

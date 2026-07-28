import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { ORG_A, actorAll, resetM07TestEnv } from "./_helpers";
import {
  createOrdinaryPayPeriod,
  listPayPeriods,
} from "../services/period-service";
import { createPayProfile, linkExternalPayrollEmployeeId } from "../services/profile-service";
import { createPreparationRule, resolveClassificationMapping, createClassificationMapping } from "../services/rule-service";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";
import { M07ValidationError } from "../permissions";

describe("M07 domain model (Batch 1)", () => {
  beforeEach(() => resetM07TestEnv());

  it("creates ordinary pay period with entity scope and SoD snapshot", () => {
    const actor = actorAll();
    const period = createOrdinaryPayPeriod(actor, {
      legalEntityId: ORG_A,
      periodStart: "2026-07-01",
      periodEnd: "2026-07-14",
    });
    assert.equal(period.legalEntityId, ORG_A);
    assert.equal(period.kind, "ordinary");
    assert.equal(period.state, "open");
    assert.equal(period.separationOfDutiesSnapshot, true);
    assert.equal(listPayPeriods(actor, ORG_A).length, 1);
  });

  it("stores external payroll employee id history on relink", () => {
    const actor = actorAll();
    const profile = createPayProfile(actor, {
      personId: "person_a",
      legalEntityId: ORG_A,
      effectiveFrom: "2026-01-01",
    });
    const linked = linkExternalPayrollEmployeeId(actor, profile.id, "EXT-1", "initial");
    assert.equal(linked.externalPayrollEmployeeId, "EXT-1");
    const relinked = linkExternalPayrollEmployeeId(actor, profile.id, "EXT-2", "relink");
    assert.equal(relinked.externalPayrollEmployeeId, "EXT-2");
    assert.equal(relinked.externalPayrollEmployeeIdHistory.length, 2);
    assert.equal(relinked.externalPayrollEmployeeIdHistory[1]?.previousId, "EXT-1");
    assert.equal(relinked.externalPayrollEmployeeIdHistory[1]?.reason, "relink");
  });

  it("labels preparation rules as non-certified", () => {
    const actor = actorAll();
    const rule = createPreparationRule(actor, {
      legalEntityId: ORG_A,
      code: "R1",
      label: "Prep",
      effectiveFrom: "2026-01-01",
    });
    assert.equal(rule.certified, false);
    assert.equal(rule.disclaimer, M07_NON_CERTIFIED_DISCLAIMER);
  });

  it("blocks missing classification mapping", () => {
    const actor = actorAll();
    assert.throws(
      () => resolveClassificationMapping(actor, ORG_A, "missing-class"),
      (e: unknown) => e instanceof M07ValidationError && e.reason === "classification-mapping-missing"
    );
  });

  it("creates classification mapping to active rule", () => {
    const actor = actorAll();
    const rule = createPreparationRule(actor, {
      legalEntityId: ORG_A,
      code: "R2",
      label: "Prep 2",
      effectiveFrom: "2026-01-01",
    });
    const map = createClassificationMapping(actor, {
      legalEntityId: ORG_A,
      m04ClassificationRef: "class_rn",
      preparationRuleId: rule.id,
      effectiveFrom: "2026-01-01",
    });
    assert.equal(map.preparationRuleVersion, rule.version);
    const resolved = resolveClassificationMapping(actor, ORG_A, "class_rn");
    assert.equal(resolved.id, map.id);
  });
});

/**
 * Shared test helpers for M07 Batch 1.
 */

import { clearM07LocalStoreCacheForTests } from "../repository/local-store";
import { resetM07BootstrapCacheForTests, ensureM07Bootstrapped } from "../storage";
import { resetM04PersonReadForTests, injectTestPersonIdentity } from "../adapters/m04-person-read";
import { resetM04LeaveReadForTests } from "../adapters/m04-leave-read";
import { resetM02InboxPublishForTests } from "../adapters/m02-inbox-publish";
import { resetM01SummaryPublishForTests } from "../adapters/m01-summary-publish";
import { setM07AuditFailForTests } from "../services/audit-service";
import type { M07Actor } from "../permissions";
import { M07_PERMISSION_CODES, M07_ROLE_PACKS } from "../permissions";

export const ORG_A = "org_demo_a";
export const ORG_B = "org_demo_b";
export const CLINIC_A = "loc_baldhills";
export const CLINIC_B = "loc_eightmile";

export function installMemoryLocalStorage() {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
  (globalThis as { localStorage?: Storage }).localStorage = storage;
  (globalThis as { window?: { localStorage: Storage } }).window = { localStorage: storage };
}

export function resetM07TestEnv() {
  installMemoryLocalStorage();
  clearM07LocalStoreCacheForTests();
  resetM07BootstrapCacheForTests();
  resetM04PersonReadForTests();
  resetM04LeaveReadForTests();
  resetM02InboxPublishForTests();
  resetM01SummaryPublishForTests();
  setM07AuditFailForTests(false);
  ensureM07Bootstrapped();
  injectTestPersonIdentity({
    personId: "person_a",
    displayLabel: "Staff A",
    personKind: "staff",
    organisationId: ORG_A,
    clinicId: CLINIC_A,
    classificationRef: "class_rn",
    employmentStatus: "active",
    employmentEffectiveFrom: "2020-01-01",
    employmentEffectiveTo: null,
    clinicAssignmentEffectiveFrom: "2020-01-01",
    clinicAssignmentEffectiveTo: null,
    readOnly: true,
    source: "m04-adapter",
  });
  injectTestPersonIdentity({
    personId: "person_b",
    displayLabel: "Staff B",
    personKind: "staff",
    organisationId: ORG_B,
    clinicId: CLINIC_B,
    classificationRef: "class_en",
    employmentStatus: "active",
    employmentEffectiveFrom: "2020-01-01",
    employmentEffectiveTo: null,
    clinicAssignmentEffectiveFrom: "2020-01-01",
    clinicAssignmentEffectiveTo: null,
    readOnly: true,
    source: "m04-adapter",
  });
  injectTestPersonIdentity({
    personId: "person_doc",
    displayLabel: "Doctor D",
    personKind: "doctor",
    organisationId: ORG_A,
    clinicId: CLINIC_A,
    classificationRef: "class_gp",
    employmentStatus: "active",
    employmentEffectiveFrom: "2020-01-01",
    employmentEffectiveTo: null,
    clinicAssignmentEffectiveFrom: "2020-01-01",
    clinicAssignmentEffectiveTo: null,
    readOnly: true,
    source: "m04-adapter",
  });
}

export function actorAll(userId = "u-admin"): M07Actor {
  return {
    userId,
    personId: userId,
    permissions: ["*", ...M07_PERMISSION_CODES],
    legalEntityIds: undefined,
    clinicIds: undefined,
  };
}

export function actorPayAdmin(userId = "u-pay-admin"): M07Actor {
  return {
    userId,
    permissions: [...M07_ROLE_PACKS.payAdmin],
    legalEntityIds: [ORG_A],
    clinicIds: undefined,
  };
}

export function actorClerk(userId = "u-clerk"): M07Actor {
  return {
    userId,
    permissions: [...M07_ROLE_PACKS.payClerk],
    legalEntityIds: [ORG_A],
  };
}

export function actorApprover(userId = "u-approver"): M07Actor {
  return {
    userId,
    permissions: [...M07_ROLE_PACKS.payApprover],
    legalEntityIds: [ORG_A],
  };
}

export function actorExportOperator(userId = "u-export"): M07Actor {
  return {
    userId,
    permissions: [...M07_ROLE_PACKS.exportOperator],
    legalEntityIds: [ORG_A],
  };
}

export function actorClinicManager(userId = "u-cm"): M07Actor {
  return {
    userId,
    permissions: [...M07_ROLE_PACKS.clinicManager],
    legalEntityIds: [ORG_A],
    clinicIds: [CLINIC_A],
  };
}

export function actorOrgB(userId = "u-org-b"): M07Actor {
  return {
    userId,
    permissions: [...M07_ROLE_PACKS.payAdmin],
    legalEntityIds: [ORG_B],
  };
}

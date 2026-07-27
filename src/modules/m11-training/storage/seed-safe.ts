/**
 * M11 safe seed — insert-if-absent demo catalogue and default policy rules.
 * Never overwrites existing records by id. Tags rows with seedBatchId.
 * rollbackSeedOwnedM11 removes only seed-tagged rows + seed flags.
 */

import { readJsonSafe, runMigrationOnce, uid, writeJsonSafe } from "@/platform/storage/storage";
import type { CatalogueCourse, PolicyVersion, PolicyRule } from "../types/domain";
import {
  M11_SEED_MIGRATION_ID,
  M11_POLICY_MIGRATION_ID,
  M11_STORAGE_KEYS,
} from "./keys";
import { ensureM11Bootstrapped, notifyM11BootstrapListeners } from "./bootstrap";

const SEED_BATCH_ID = "seed-demo-v1";
const DEFAULT_ORG = "org_parent";

// ——— Demo catalogue ———

function buildDemoCatalogue(): Omit<CatalogueCourse, "id">[] {
  const now = new Date().toISOString();
  return [
    {
      organisationId: DEFAULT_ORG,
      courseCode: "CPR-BLS-01",
      title: "Basic Life Support (BLS) & CPR",
      category: "Clinical Mandatory",
      activeVersionId: null,
      versions: [
        {
          versionId: uid("cv"),
          courseId: "",
          versionNumber: 1,
          title: "Basic Life Support (BLS) & CPR",
          description: "Annual BLS certification for all clinical staff.",
          durationMinutes: 120,
          format: "in-person",
          status: "published",
          publishedAt: now,
          archivedAt: null,
          createdAt: now,
          createdBy: "seed",
        },
      ],
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      organisationId: DEFAULT_ORG,
      courseCode: "INF-CTL-02",
      title: "Infection Control & Hand Hygiene",
      category: "Clinical Mandatory",
      activeVersionId: null,
      versions: [
        {
          versionId: uid("cv"),
          courseId: "",
          versionNumber: 1,
          title: "Infection Control & Hand Hygiene",
          description: "Standard infection control for clinical environments.",
          durationMinutes: 60,
          format: "online",
          status: "published",
          publishedAt: now,
          archivedAt: null,
          createdAt: now,
          createdBy: "seed",
        },
      ],
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    {
      organisationId: DEFAULT_ORG,
      courseCode: "FIRE-SAFE-03",
      title: "Fire Safety & Emergency Procedures",
      category: "Workplace Safety",
      activeVersionId: null,
      versions: [
        {
          versionId: uid("cv"),
          courseId: "",
          versionNumber: 1,
          title: "Fire Safety & Emergency Procedures",
          description: "Annual fire safety and emergency response.",
          durationMinutes: 45,
          format: "blended",
          status: "published",
          publishedAt: now,
          archivedAt: null,
          createdAt: now,
          createdBy: "seed",
        },
      ],
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  ];
}

// ——— Default policy rules ———

function buildDefaultPolicyVersion(courseIdMap: Record<string, string>): PolicyVersion {
  const now = new Date().toISOString();
  const blsId = courseIdMap["CPR-BLS-01"] ?? "";
  const infId = courseIdMap["INF-CTL-02"] ?? "";
  const fireId = courseIdMap["FIRE-SAFE-03"] ?? "";
  const policyVersionId = uid("polv");

  const rules: PolicyRule[] = [
    {
      id: uid("polr"),
      policyVersionId,
      requirementId: "req-bls-annual",
      courseId: blsId,
      requirementLabel: "BLS/CPR Annual Certification",
      requireCompletion: true,
      requireCompetency: true,
      allowCompletionAsCompetency: false,
      recurrenceMonths: 12,
      graceDays: 14,
      organisationId: DEFAULT_ORG,
      clinicIds: [],
      createdAt: now,
      version: 1,
    },
    {
      id: uid("polr"),
      policyVersionId,
      requirementId: "req-infctl-annual",
      courseId: infId,
      requirementLabel: "Infection Control Annual",
      requireCompletion: true,
      requireCompetency: false,
      allowCompletionAsCompetency: true,
      recurrenceMonths: 12,
      graceDays: 30,
      organisationId: DEFAULT_ORG,
      clinicIds: [],
      createdAt: now,
      version: 1,
    },
    {
      id: uid("polr"),
      policyVersionId,
      requirementId: "req-fire-annual",
      courseId: fireId,
      requirementLabel: "Fire Safety Annual",
      requireCompletion: true,
      requireCompetency: false,
      allowCompletionAsCompetency: true,
      recurrenceMonths: 12,
      graceDays: 30,
      organisationId: DEFAULT_ORG,
      clinicIds: [],
      createdAt: now,
      version: 1,
    },
  ];

  return {
    id: uid("pol"),
    policyVersionId,
    organisationId: DEFAULT_ORG,
    label: "Default Clinical Policy v1",
    status: "published",
    publishedAt: now,
    archivedAt: null,
    rules,
    createdAt: now,
    createdBy: "seed",
    version: 1,
  };
}

// ——— Seed catalogue ———

function seedCatalogue(): Record<string, string> {
  const list = readJsonSafe<(CatalogueCourse & { _seedBatchId?: string })[]>(
    M11_STORAGE_KEYS.catalogue,
    []
  );
  const existingCodes = new Set(list.map((c) => c.courseCode));
  const courseIdMap: Record<string, string> = {};

  // Build index of existing codes → ids
  for (const c of list) courseIdMap[c.courseCode] = c.id;

  const demos = buildDemoCatalogue();
  let changed = false;
  for (const demo of demos) {
    if (existingCodes.has(demo.courseCode)) {
      courseIdMap[demo.courseCode] = list.find((c) => c.courseCode === demo.courseCode)!.id;
      continue;
    }
    const id = uid("crs");
    const course: CatalogueCourse & { _seedBatchId: string } = {
      ...demo,
      id,
      activeVersionId: demo.versions[0]?.versionId ?? null,
      versions: demo.versions.map((v) => ({ ...v, courseId: id })),
      _seedBatchId: SEED_BATCH_ID,
    };
    list.push(course);
    courseIdMap[course.courseCode] = id;
    changed = true;
  }
  if (changed) writeJsonSafe(M11_STORAGE_KEYS.catalogue, list);
  return courseIdMap;
}

// ——— Seed policy ———

function seedPolicy(courseIdMap: Record<string, string>): void {
  const list = readJsonSafe<(PolicyVersion & { _seedBatchId?: string })[]>(
    M11_STORAGE_KEYS.policies,
    []
  );
  const alreadySeeded = list.some((p) => p._seedBatchId === SEED_BATCH_ID);
  if (alreadySeeded) return;

  const policy = buildDefaultPolicyVersion(courseIdMap);
  list.push({ ...policy, _seedBatchId: SEED_BATCH_ID });
  writeJsonSafe(M11_STORAGE_KEYS.policies, list);
}

// ——— Public API ———

export function runM11CatalogueSeed(): boolean {
  ensureM11Bootstrapped();
  return runMigrationOnce(M11_SEED_MIGRATION_ID, 1, () => {
    seedCatalogue();
    notifyM11BootstrapListeners();
  });
}

export function runM11PolicySeed(): boolean {
  ensureM11Bootstrapped();
  return runMigrationOnce(M11_POLICY_MIGRATION_ID, 1, () => {
    const catalogue = readJsonSafe<(CatalogueCourse & { courseCode: string })[]>(
      M11_STORAGE_KEYS.catalogue,
      []
    );
    const courseIdMap: Record<string, string> = {};
    for (const c of catalogue) courseIdMap[c.courseCode] = c.id;
    seedPolicy(courseIdMap);
    notifyM11BootstrapListeners();
  });
}

/**
 * Remove only seed-tagged rows and clear seed migration flags.
 * clearFlag must be the platform's clearMigrationFlag function injected by tests.
 */
export function rollbackSeedOwnedM11(clearFlag: (id: string) => void): void {
  // Remove seed-tagged catalogue entries
  const catalogue = readJsonSafe<(CatalogueCourse & { _seedBatchId?: string })[]>(
    M11_STORAGE_KEYS.catalogue,
    []
  );
  writeJsonSafe(
    M11_STORAGE_KEYS.catalogue,
    catalogue.filter((c) => c._seedBatchId !== SEED_BATCH_ID)
  );

  // Remove seed-tagged policy versions
  const policies = readJsonSafe<(PolicyVersion & { _seedBatchId?: string })[]>(
    M11_STORAGE_KEYS.policies,
    []
  );
  writeJsonSafe(
    M11_STORAGE_KEYS.policies,
    policies.filter((p) => p._seedBatchId !== SEED_BATCH_ID)
  );

  clearFlag(M11_SEED_MIGRATION_ID);
  clearFlag(M11_POLICY_MIGRATION_ID);
}

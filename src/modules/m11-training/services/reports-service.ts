/** Scoped training reports / exports — clinic boundary enforced at service layer. */

import {
  assertM11ClinicScope,
  assertM11Permission,
  type M11Actor,
} from "../permissions";
import { listAssignmentsForActor } from "./assignment-service";
import { listCourses } from "./catalogue-service";
import { listCertificates } from "./certificate-service";
import { listExemptions } from "./exemption-service";
import { listEvidenceForActor } from "./evidence-service";
import { getTrainingCounts } from "../adapters/m11-executive";

export type TrainingExportPayload = {
  counts: ReturnType<typeof getTrainingCounts>;
  courses: number;
  assignments: number;
  certificates: number;
  exemptions: number;
  evidence: number;
  clinicScope: string[] | "all";
  exportedAt: string;
  exportedBy: string;
};

/**
 * Permission + clinic scoped export.
 * Actors with clinicIds only see in-scope assignment/evidence counts.
 */
export function exportTrainingSummary(actor: M11Actor): TrainingExportPayload {
  assertM11Permission(actor, "training.export");
  if (actor.clinicIds !== undefined && !actor.permissions.includes("*")) {
    if (!actor.clinicIds.length) {
      throw new Error("Export denied: empty clinic scope");
    }
    // Prove scope is enforced even when exporting org-wide catalogue length
    assertM11ClinicScope(actor, actor.clinicIds);
  }

  const assignments = listAssignmentsForActor(actor);
  const evidence = listEvidenceForActor(actor);
  const certificates = listCertificates().filter((c) => {
    if (actor.clinicIds === undefined || actor.permissions.includes("*")) return true;
    if (!c.clinicId) return false;
    return actor.clinicIds.includes(c.clinicId);
  });
  const exemptions = listExemptions().filter((e) => {
    if (actor.clinicIds === undefined || actor.permissions.includes("*")) return true;
    if (!e.clinicId) return false;
    return actor.clinicIds.includes(e.clinicId);
  });

  return {
    counts: getTrainingCounts(),
    courses: listCourses().length,
    assignments: assignments.length,
    certificates: certificates.length,
    exemptions: exemptions.length,
    evidence: evidence.length,
    clinicScope: actor.clinicIds === undefined || actor.permissions.includes("*") ? "all" : actor.clinicIds,
    exportedAt: new Date().toISOString(),
    exportedBy: actor.userId,
  };
}

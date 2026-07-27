/** M11 executive summary counts — training compliance overview. */

import * as store from "../repository/local-store";
import { evaluatePersonRequirements } from "../services/policy-service";

export type TrainingCounts = {
  totalAssignments: number;
  overdueAssignments: number;
  completedThisMonth: number;
  expiredCertificates: number;
  pendingExemptions: number;
  nonCompliantPersons: number;
};

export function getTrainingCounts(organisationId?: string): TrainingCounts {
  const org = organisationId ?? "org_parent";
  const assignments = store.listAssignments().filter((a) =>
    organisationId ? a.organisationId === organisationId : true
  );
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const completions = store.listCompletions().filter((c) =>
    organisationId ? c.organisationId === organisationId : true
  );

  const certs = store.listCertificates().filter((c) =>
    organisationId ? c.organisationId === organisationId : true
  );

  const exemptions = store.listExemptions().filter((e) =>
    organisationId ? e.organisationId === organisationId : true
  );

  // Unique person IDs with active assignments
  const personIds = [
    ...new Set(
      assignments
        .filter((a) => !["revoked", "superseded"].includes(a.status))
        .map((a) => a.personId)
    ),
  ];

  let nonCompliant = 0;
  for (const pid of personIds) {
    const { explanations } = evaluatePersonRequirements(pid, org);
    if (explanations.some((e) => e.status === "not_met" || e.status === "overdue")) {
      nonCompliant++;
    }
  }

  return {
    totalAssignments: assignments.filter((a) => !["revoked", "superseded"].includes(a.status))
      .length,
    overdueAssignments: assignments.filter((a) => a.status === "overdue").length,
    completedThisMonth: completions.filter((c) => c.completedOn >= monthStart).length,
    expiredCertificates: certs.filter((c) => c.status === "expired").length,
    pendingExemptions: exemptions.filter((e) => e.status === "request").length,
    nonCompliantPersons: nonCompliant,
  };
}

/**
 * Readiness projection helper — combines credential and training blockers into a ReadinessRef.
 * Does not import module repositories; callers pass authoritative refs.
 */

import { createReadinessRef, type ReadinessBlocker, type ReadinessLevel, type ReadinessRef } from "../contracts/readiness-ref";
import type { CredentialRef } from "../contracts/credential-ref";
import type { TrainingStatusRef } from "../contracts/training-status-ref";

function credentialBlockers(credentials: CredentialRef[]): ReadinessBlocker[] {
  const out: ReadinessBlocker[] = [];
  for (const c of credentials) {
    if (c.status === "expired" || c.status === "invalid") {
      out.push({
        code: `credential.${c.credentialType}`,
        label: `${c.credentialType} is ${c.status}`,
        owningModuleId: "staff-doctors",
        sourceRecordId: c.recordId,
        severity: "blocking",
      });
    } else if (!c.verified) {
      out.push({
        code: `credential.unverified.${c.credentialType}`,
        label: `${c.credentialType} not verified`,
        owningModuleId: "staff-doctors",
        sourceRecordId: c.recordId,
        severity: "advisory",
      });
    }
  }
  return out;
}

function trainingBlockers(training: TrainingStatusRef[]): ReadinessBlocker[] {
  const out: ReadinessBlocker[] = [];
  for (const t of training) {
    if (t.status === "expired" || t.status === "failed" || !t.competencyMet) {
      out.push({
        code: `training.${t.requirementId}`,
        label: `${t.requirementLabel} is ${t.status}`,
        owningModuleId: "training",
        sourceRecordId: t.recordId,
        severity: t.status === "failed" || t.status === "expired" ? "blocking" : "advisory",
      });
    }
  }
  return out;
}

export function projectReadiness(input: {
  personId: string;
  clinicId?: string;
  organisationId?: string;
  credentials?: CredentialRef[];
  training?: TrainingStatusRef[];
  asOf?: string;
}): ReadinessRef {
  const blockers = [
    ...credentialBlockers(input.credentials ?? []),
    ...trainingBlockers(input.training ?? []),
  ];
  const hasBlocking = blockers.some((b) => b.severity === "blocking");
  const hasAdvisory = blockers.some((b) => b.severity === "advisory");
  let readiness: ReadinessLevel = "ready";
  if (hasBlocking) readiness = "blocked";
  else if (hasAdvisory) readiness = "advisory";

  return createReadinessRef({
    recordId: `ready_${input.personId}`,
    personId: input.personId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: readiness,
    readiness,
    blockers,
    asOf: input.asOf ?? new Date().toISOString(),
  });
}

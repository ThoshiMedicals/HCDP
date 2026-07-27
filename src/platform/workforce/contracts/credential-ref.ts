import {
  WORKFORCE_CONTRACT_VERSION,
  type WorkforceRefBase,
} from "./common";

/** Credential status projection — owned by M04. */
export interface CredentialRef extends WorkforceRefBase {
  owningModuleId: "staff-doctors";
  personId: string;
  credentialType: string;
  expiresOn?: string | null;
  verified: boolean;
}

export function createCredentialRef(
  input: Omit<CredentialRef, "contractVersion" | "owningModuleId" | "route" | "displayLabel"> & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): CredentialRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "staff-doctors",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/staff-doctors",
    section: input.section ?? "credentials",
    displayLabel: input.displayLabel ?? `${input.credentialType} — ${input.personId}`,
    personId: input.personId,
    credentialType: input.credentialType,
    expiresOn: input.expiresOn ?? null,
    verified: input.verified,
  };
}

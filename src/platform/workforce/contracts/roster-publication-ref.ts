/**
 * Roster publication reference — owned by M05.
 * Publication is immutable once created; acknowledgementStatus is DERIVED from ack rows
 * and reflects the roll-up on the publication (none | partial | full).
 * Publication ack status does NOT rewrite the immutable snapshot body.
 */

import { WORKFORCE_CONTRACT_VERSION, type WorkforceRefBase } from "./common";

export type RosterPublicationAcknowledgementStatus = "none" | "partial" | "full";

export interface RosterPublicationRef extends WorkforceRefBase {
  owningModuleId: "roster";
  rosterPeriodId: string;
  publicationId: string;
  publicationVersion: number;
  publishedAt: string;
  supersededById?: string | null;
  supersedesId?: string | null;
  acknowledgementStatus: RosterPublicationAcknowledgementStatus;
  timeZoneId?: string;
}

export function createRosterPublicationRef(
  input: Omit<
    RosterPublicationRef,
    "contractVersion" | "owningModuleId" | "route" | "displayLabel"
  > & {
    route?: string;
    displayLabel?: string;
    section?: string;
  }
): RosterPublicationRef {
  return {
    contractVersion: WORKFORCE_CONTRACT_VERSION,
    owningModuleId: "roster",
    recordId: input.recordId,
    clinicId: input.clinicId,
    organisationId: input.organisationId,
    status: input.status,
    route: input.route ?? "/roster",
    section: input.section ?? "published-history",
    displayLabel:
      input.displayLabel ??
      `Publication v${input.publicationVersion} for period ${input.rosterPeriodId}`,
    rosterPeriodId: input.rosterPeriodId,
    publicationId: input.publicationId,
    publicationVersion: input.publicationVersion,
    publishedAt: input.publishedAt,
    supersededById: input.supersededById ?? null,
    supersedesId: input.supersedesId ?? null,
    acknowledgementStatus: input.acknowledgementStatus,
    timeZoneId: input.timeZoneId,
  };
}

/**
 * Audited profile ↔ workforce person linkage.
 * Auth must not import M04 repositories — only stores the nullable id string.
 */

import type { ApplicationProfile } from "../contracts/identity-separation";
import {
  getAuthMemoryState,
  type AuthMemoryState,
} from "../repository/memory-store";
import { assertPermission, assertSameOrganisation } from "./authorization-service";
import { recordAccessChange } from "./access-audit-service";

export type RelinkWorkforcePersonInput = {
  actor: ApplicationProfile;
  profileId: string;
  /** null clears the link (account without workforce person). */
  workforcePersonId: string | null;
  reason: string;
};

/**
 * One auth profile → at most one M04 person.
 * One M04 person → at most one active auth profile (when linking non-null).
 */
export function relinkWorkforcePerson(
  input: RelinkWorkforcePersonInput,
  state: AuthMemoryState = getAuthMemoryState()
): ApplicationProfile {
  assertPermission(input.actor, "users.manage");
  const subject = state.profiles.find((p) => p.id === input.profileId);
  if (!subject) throw new Error("Profile not found");
  assertSameOrganisation(input.actor.organisationId, subject.organisationId);

  if (!input.reason.trim()) {
    throw new Error("Relink reason is required for audit");
  }

  const nextId = input.workforcePersonId?.trim() || null;
  if (nextId) {
    const conflict = state.profiles.find(
      (p) =>
        p.id !== subject.id &&
        p.organisationId === subject.organisationId &&
        p.workforcePersonId === nextId &&
        p.status !== "Archived" &&
        p.status !== "Offboarding"
    );
    if (conflict) {
      throw new Error(
        `Workforce person ${nextId} is already linked to active profile ${conflict.id}`
      );
    }
  }

  const before = subject.workforcePersonId;
  subject.workforcePersonId = nextId;
  subject.updatedAt = new Date().toISOString();

  recordAccessChange(
    {
      organisationId: subject.organisationId,
      actorProfileId: input.actor.id,
      subjectProfileId: subject.id,
      changeType: "profile.workforce_relink",
      entityType: "profile",
      entityId: subject.id,
      beforeState: { workforcePersonId: before },
      afterState: { workforcePersonId: nextId },
      reason: input.reason,
    },
    state
  );

  return subject;
}

/**
 * Separation-of-duties policy foundation (Batch 1).
 * Full approve/lock workflows come later; policy helpers are available now.
 */

import {
  assertM07Permission,
  hasM07Permission,
  M07SeparationOfDutiesError,
  type M07Actor,
} from "../permissions";
import { getEntitySettings } from "../repository/local-store";

export function isSeparationOfDutiesEnabled(legalEntityId: string): boolean {
  const settings = getEntitySettings(legalEntityId);
  // Q5 default on when unset
  return settings?.separationOfDuties ?? true;
}

/**
 * Final approve must not be performed solely by the same actor who calculated/submitted
 * when SoD is enabled.
 */
export function assertFinalApproveSeparation(input: {
  actor: M07Actor;
  legalEntityId: string;
  calculatedOrSubmittedByUserIds: string[];
}): void {
  assertM07Permission(input.actor, "payroll.approve");
  if (!isSeparationOfDutiesEnabled(input.legalEntityId)) return;
  if (input.calculatedOrSubmittedByUserIds.includes(input.actor.userId)) {
    throw new M07SeparationOfDutiesError(
      "Sole calculate/submit actor cannot be the sole final approver"
    );
  }
}

/** Export operator alone must not lock (Q20). */
export function assertLockActorAllowed(actor: M07Actor): void {
  const canLock = hasM07Permission(actor, "payroll.period.lock");
  if (!canLock) {
    throw new M07SeparationOfDutiesError("Lock requires Pay approver or Pay admin");
  }
  // Export operator pack has export.create but not period.lock — covered by permission.
  // Additional guard: cannot lock with only export.create.
  if (
    hasM07Permission(actor, "payroll.export.create") &&
    !hasM07Permission(actor, "payroll.period.lock") &&
    !hasM07Permission(actor, "payroll.approve")
  ) {
    throw new M07SeparationOfDutiesError("Export operator alone cannot lock");
  }
}

/** Export operator cannot self-approve. */
export function assertExportOperatorCannotApprove(actor: M07Actor): void {
  if (hasM07Permission(actor, "payroll.approve")) return;
  if (hasM07Permission(actor, "payroll.export.create")) {
    throw new M07SeparationOfDutiesError("Export operator cannot self-approve");
  }
}

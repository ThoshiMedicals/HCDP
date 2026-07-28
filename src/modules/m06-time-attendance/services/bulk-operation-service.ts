import { assertM06ClinicScope, assertM06Permission, type M06Actor } from "../permissions";
import { getApproval, listApprovals } from "../repository/local-store";
import { writeAudit } from "./audit-helpers";
import { approveQueueItem, rejectQueueItem } from "./approval-service";
import { ValidationError } from "./errors";

export type BulkItemResult = {
  approvalId: string;
  ok: boolean;
  error?: string;
};

const NOTIFY_CAP = 25;

export function previewBulkApprove(input: {
  actor: M06Actor;
  approvalIds: string[];
}): { eligible: string[]; ineligible: Array<{ id: string; reason: string }>; notifyCap: number } {
  assertM06Permission(input.actor, "attendance.bulk.approve");
  const eligible: string[] = [];
  const ineligible: Array<{ id: string; reason: string }> = [];
  for (const id of input.approvalIds) {
    const item = getApproval(id);
    if (!item) {
      ineligible.push({ id, reason: "not-found" });
      continue;
    }
    try {
      assertM06ClinicScope(input.actor, [item.clinicId]);
      if (item.state !== "pending") ineligible.push({ id, reason: `state:${item.state}` });
      else eligible.push(id);
    } catch (e) {
      ineligible.push({ id, reason: e instanceof Error ? e.message : "scope" });
    }
  }
  return { eligible, ineligible, notifyCap: NOTIFY_CAP };
}

export function submitBulkApprove(input: {
  actor: M06Actor;
  approvalIds: string[];
  rejectRest?: boolean;
}): { results: BulkItemResult[]; notified: number } {
  assertM06Permission(input.actor, "attendance.bulk.approve");
  if (!input.approvalIds.length) throw new ValidationError("No approval ids provided");
  const preview = previewBulkApprove(input);
  const results: BulkItemResult[] = [];
  let notified = 0;
  for (const id of preview.eligible) {
    const item = getApproval(id)!;
    try {
      approveQueueItem({ actor: input.actor, approvalId: id, expectedVersion: item.version });
      results.push({ approvalId: id, ok: true });
      writeAudit({
        actorId: input.actor.userId,
        action: "bulk.approve.item.ok",
        targetType: "approval",
        targetId: id,
        clinicId: item.clinicId,
        detail: "authorized pending item approved",
      });
      if (notified < NOTIFY_CAP) notified += 1;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      results.push({ approvalId: id, ok: false, error });
      writeAudit({
        actorId: input.actor.userId,
        action: "bulk.approve.item.fail",
        targetType: "approval",
        targetId: id,
        clinicId: item.clinicId,
        detail: error,
      });
    }
  }
  for (const bad of preview.ineligible) {
    results.push({ approvalId: bad.id, ok: false, error: bad.reason });
    writeAudit({
      actorId: input.actor.userId,
      action: "bulk.approve.item.skipped",
      targetType: "approval",
      targetId: bad.id,
      clinicId: getApproval(bad.id)?.clinicId,
      detail: bad.reason,
    });
    if (input.rejectRest) {
      const item = getApproval(bad.id);
      if (item?.state === "pending") {
        try {
          rejectQueueItem({ actor: input.actor, approvalId: bad.id, expectedVersion: item.version, reason: bad.reason });
        } catch {
          /* keep partial failure */
        }
      }
    }
  }
  void listApprovals;
  return { results, notified };
}

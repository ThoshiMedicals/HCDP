/**
 * Notification publisher — writes into Module 2 notification store only.
 * Email/SMS channels are recorded for demo; no real delivery.
 */

import { pushNotification } from "@/lib/action-inbox/repository";
import { nowIso } from "@/lib/action-inbox/utils";
import type { PlatformNotificationInput } from "@/platform/contracts/notification-events";
import { buildSourceHref } from "@/platform/contracts/source-record";

export type { PlatformNotificationInput } from "@/platform/contracts/notification-events";

export function publishPlatformNotification(input: PlatformNotificationInput) {
  if (typeof window === "undefined") return null;

  const channels = input.deliveryChannels ?? ["platform"];
  const href = buildSourceHref(input.sourceRecord);
  const reason = [
    input.message,
    `Recipient: ${input.recipient}`,
    channels.includes("email") || channels.includes("sms")
      ? `Channels (demo only): ${channels.join(", ")}`
      : null,
    input.expiryDate ? `Expires: ${input.expiryDate}` : null,
    `Source: ${href}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return pushNotification({
    title: input.title,
    reason,
    actionId: input.actionId ?? input.sourceRecord.sourceRecordId,
    actionNumber: input.actionNumber ?? input.sourceRecord.sourceRecordId,
    clinicName: input.sourceRecord.clinicId ?? "Organisation",
    at: input.createdAt ?? nowIso(),
    priority: input.priority,
    read: input.read ?? false,
    groupKey:
      input.groupingKey ??
      `src:${input.sourceRecord.sourceModuleId}:${input.sourceRecord.sourceRecordId}`,
    kind: input.mandatory
      ? "mandatory-approval"
      : input.priority === "Urgent"
        ? "urgent"
        : "routine",
  });
}

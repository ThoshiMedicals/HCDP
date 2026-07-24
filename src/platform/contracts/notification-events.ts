/** Shared notification publishing contract. Module 2 remains the notification centre. */

import type { SourceRecordRef } from "./source-record";
import type { PlatformPriority } from "@/platform/status";

export interface PlatformNotificationInput {
  sourceRecord: SourceRecordRef;
  recipient: string;
  title: string;
  message: string;
  priority: PlatformPriority;
  deliveryChannels?: Array<"platform" | "email" | "sms">;
  read?: boolean;
  mandatory?: boolean;
  createdAt?: string;
  expiryDate?: string;
  groupingKey?: string;
  actionId?: string;
  actionNumber?: string;
}

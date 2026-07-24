/**
 * Shared operational statuses, priorities and sensitivity levels.
 * Module-specific enums may extend these; do not redefine conflicting scales.
 */

export const PLATFORM_PRIORITIES = ["Urgent", "High", "Medium", "Low"] as const;
export type PlatformPriority = (typeof PLATFORM_PRIORITIES)[number];

export const PLATFORM_SENSITIVITY = [
  "Standard",
  "Restricted",
  "Confidential",
  "Highly Confidential",
] as const;
export type PlatformSensitivity = (typeof PLATFORM_SENSITIVITY)[number];

export const PLATFORM_INBOX_STATUSES = [
  "Open",
  "In Progress",
  "Awaiting Approval",
  "Awaiting Verification",
  "On Hold",
  "Returned for Correction",
  "Rejected",
  "Completed",
  "Withdrawn",
  "Archived",
] as const;
export type PlatformInboxStatus = (typeof PLATFORM_INBOX_STATUSES)[number];

export const PLATFORM_IMPLEMENTATION_STATES = [
  "complete-interactive-rebuild",
  "strong-existing",
  "partially-implemented",
  "placeholder",
  "legacy-html-fallback",
  "missing",
  "rebuild-pending",
] as const;
export type PlatformImplementationState = (typeof PLATFORM_IMPLEMENTATION_STATES)[number];

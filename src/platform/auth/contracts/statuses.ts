/** Canonical Wave 1A status vocabularies. */

export const USER_ACCOUNT_STATUSES = [
  "Draft",
  "Pending Approval",
  "Invited",
  "Active",
  "Suspended",
  "Locked",
  "Offboarding",
  "Archived",
] as const;

export type UserProvisioningStatus = (typeof USER_ACCOUNT_STATUSES)[number];

export const INVITATION_STATUSES = [
  "Draft",
  "Pending Approval",
  "Ready to Send",
  "Invited",
  "Delivered",
  "Accepted",
  "Expired",
  "Cancelled",
  "Failed",
] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const PLATFORM_PERMISSION_CODES = [
  "users.invite",
  "users.manage",
  "users.view",
  "roles.manage",
  "access.review",
  "org.admin",
] as const;

export type PlatformPermissionCode = (typeof PLATFORM_PERMISSION_CODES)[number];

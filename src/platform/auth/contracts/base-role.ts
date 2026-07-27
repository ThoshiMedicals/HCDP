/** Base account role — PostgreSQL enum user_role ('user','manager','admin'). */

export const BASE_ACCOUNT_ROLES = ["user", "manager", "admin"] as const;

export type BaseAccountRole = (typeof BASE_ACCOUNT_ROLES)[number];

export function isBaseAccountRole(value: unknown): value is BaseAccountRole {
  return typeof value === "string" && (BASE_ACCOUNT_ROLES as readonly string[]).includes(value);
}

/** Rejects any base role outside the enum (mirrors DB CHECK / ENUM integrity). */
export function assertBaseAccountRole(value: unknown): BaseAccountRole {
  if (!isBaseAccountRole(value)) {
    throw new Error(`Invalid base role: database rejects values outside user, manager, admin`);
  }
  return value;
}

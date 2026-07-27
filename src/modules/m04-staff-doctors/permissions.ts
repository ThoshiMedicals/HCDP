/** M04 permission codes and enforcement helpers. */

export const M04_PERMISSION_CODES = [
  "workforce.view",
  "workforce.create",
  "workforce.edit",
  "workforce.assign_clinic",
  "workforce.manage_engagement",
  "credential.verify",
  "leave.approve",
  "restriction.view_sensitive",
  "restriction.manage",
  "onboarding.manage",
  "offboarding.manage",
  "workforce.suspend",
  "workforce.reinstate",
  "workforce.export",
] as const;

export type M04PermissionCode = (typeof M04_PERMISSION_CODES)[number];

export type M04Actor = {
  userId: string;
  permissions: string[];
  /** When set, actor may only mutate/view people whose clinicIds intersect this set. */
  clinicIds?: string[];
};

export class M04ClinicScopeError extends Error {
  constructor(message = "Person is outside the actor clinic scope") {
    super(message);
    this.name = "M04ClinicScopeError";
  }
}

/** Enforce clinic boundary when actor.clinicIds is defined (empty array = no clinics → deny). */
export function assertM04ClinicScope(actor: M04Actor, personClinicIds: string[]): void {
  if (actor.clinicIds === undefined) return;
  if (actor.permissions.includes("*")) return;
  if (!actor.clinicIds.length) throw new M04ClinicScopeError();
  const allowed = personClinicIds.some((id) => actor.clinicIds!.includes(id));
  if (!allowed) throw new M04ClinicScopeError();
}

export class M04PermissionError extends Error {
  code: M04PermissionCode;
  constructor(code: M04PermissionCode) {
    super(`Missing M04 permission: ${code}`);
    this.name = "M04PermissionError";
    this.code = code;
  }
}

export function assertM04Permission(actor: M04Actor, code: M04PermissionCode): void {
  if (actor.permissions.includes("*")) return;
  if (actor.permissions.includes(code)) return;
  throw new M04PermissionError(code);
}

export function hasM04Permission(actor: M04Actor, code: M04PermissionCode): boolean {
  if (actor.permissions.includes("*")) return true;
  return actor.permissions.includes(code);
}

/**
 * Map demo identity flags to M04 permission codes.
 * - permissions includes "*" → grant all
 * - managerControls → most codes except restriction.view_sensitive unless sensitivityClearance is full
 */
export function mapDemoIdentityPermissions(identity: {
  permissions: string[];
  managerControls: boolean;
  sensitivityClearance: "full" | "restricted" | string;
}): string[] {
  if (identity.permissions.includes("*")) {
    return ["*", ...M04_PERMISSION_CODES];
  }

  if (!identity.managerControls) {
    return ["workforce.view"];
  }

  const codes: string[] = M04_PERMISSION_CODES.filter((c) => c !== "restriction.view_sensitive");
  if (identity.sensitivityClearance === "full") {
    codes.push("restriction.view_sensitive");
  }
  return codes;
}

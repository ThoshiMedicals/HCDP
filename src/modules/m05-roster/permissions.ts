/** M05 permission codes and enforcement helpers (mirrors M11 pattern). */

export const M05_PERMISSION_CODES = [
  "roster.view",
  "roster.period.create",
  "roster.shift.edit",
  "roster.assign",
  "roster.open_shift.manage",
  "roster.swap.request",
  "roster.swap.approve",
  "roster.review",
  "roster.publish",
  "roster.acknowledge",
  "roster.override",
  "roster.cost.view",
  "roster.report",
  "roster.export",
  "roster.policy.manage",
  "roster.audit.view",
  "roster.bulk",
] as const;

export type M05PermissionCode = (typeof M05_PERMISSION_CODES)[number];

export type M05Actor = {
  userId: string;
  permissions: string[];
  /** When set, actor may only operate on records whose clinicIds intersect this set. */
  clinicIds?: string[];
};

export class M05PermissionError extends Error {
  code: M05PermissionCode;
  constructor(code: M05PermissionCode) {
    super(`Missing M05 permission: ${code}`);
    this.name = "M05PermissionError";
    this.code = code;
  }
}

export class M05ClinicScopeError extends Error {
  constructor(message = "Record is outside the actor clinic scope") {
    super(message);
    this.name = "M05ClinicScopeError";
  }
}

export function assertM05Permission(actor: M05Actor, code: M05PermissionCode): void {
  if (actor.permissions.includes("*")) return;
  if (actor.permissions.includes(code)) return;
  throw new M05PermissionError(code);
}

export function hasM05Permission(actor: M05Actor, code: M05PermissionCode): boolean {
  if (actor.permissions.includes("*")) return true;
  return actor.permissions.includes(code);
}

/** Enforce clinic boundary when actor.clinicIds is defined (empty array = no clinics → deny). */
export function assertM05ClinicScope(actor: M05Actor, recordClinicIds: Array<string | undefined>): void {
  if (actor.clinicIds === undefined) return;
  if (actor.permissions.includes("*")) return;
  if (!actor.clinicIds.length) throw new M05ClinicScopeError();
  const known = recordClinicIds.filter((c): c is string => typeof c === "string" && c.length > 0);
  if (!known.length) throw new M05ClinicScopeError("Record has no clinicId — cannot enforce scope");
  const allowed = known.some((id) => actor.clinicIds!.includes(id));
  if (!allowed) throw new M05ClinicScopeError();
}

export function isInActorClinicScope(actor: M05Actor, clinicId: string | undefined | null): boolean {
  if (actor.permissions.includes("*")) return true;
  if (actor.clinicIds === undefined) return true;
  if (!clinicId) return false;
  return actor.clinicIds.includes(clinicId);
}

/**
 * Map demo identity flags to M05 permission codes.
 * - permissions includes "*" → grant all
 * - managerControls false → worker-scope only
 * - sensitivityClearance full → include roster.cost.view + roster.override
 */
export function mapDemoIdentityPermissions(identity: {
  permissions: string[];
  managerControls: boolean;
  sensitivityClearance: "full" | "restricted" | string;
}): string[] {
  if (identity.permissions.includes("*")) {
    return ["*", ...M05_PERMISSION_CODES];
  }

  if (!identity.managerControls) {
    return [
      "roster.view",
      "roster.acknowledge",
      "roster.swap.request",
    ];
  }

  const codes: string[] = M05_PERMISSION_CODES.filter(
    (c) => c !== "roster.override" && c !== "roster.cost.view"
  );
  if (identity.sensitivityClearance === "full") {
    codes.push("roster.override", "roster.cost.view");
  }
  return codes;
}

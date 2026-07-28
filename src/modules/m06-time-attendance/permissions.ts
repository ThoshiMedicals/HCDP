/** M06 canonical permission codes (§10.1) — no shorthand aliases. */

export const M06_PERMISSION_CODES = [
  "attendance.view.self",
  "attendance.view.team",
  "attendance.clock.self",
  "attendance.break.self",
  "attendance.declare",
  "attendance.correction.request",
  "attendance.correction.apply",
  "attendance.approve",
  "attendance.reopen",
  "attendance.override",
  "attendance.exception.view",
  "attendance.exception.raise",
  "attendance.exception.resolve",
  "attendance.evidence.view",
  "attendance.audit.view",
  "attendance.bulk.approve",
  "attendance.export",
  "attendance.report",
  "attendance.policy.manage",
  "attendance.timesheet.view",
  "attendance.timesheet.generate",
  "attendance.timesheet.submit",
  "attendance.manager.enter",
  "attendance.sync.resolve",
] as const;

export type M06PermissionCode = (typeof M06_PERMISSION_CODES)[number];

export type M06Actor = {
  userId: string;
  personId?: string;
  permissions: string[];
  clinicIds?: string[];
};

export class M06PermissionError extends Error {
  code: M06PermissionCode;
  constructor(code: M06PermissionCode) {
    super(`Missing M06 permission: ${code}`);
    this.name = "M06PermissionError";
    this.code = code;
  }
}

export class M06ClinicScopeError extends Error {
  constructor(message = "Record is outside the actor clinic scope") {
    super(message);
    this.name = "M06ClinicScopeError";
  }
}

export function assertM06Permission(actor: M06Actor, code: M06PermissionCode): void {
  if (actor.permissions.includes("*")) return;
  if (actor.permissions.includes(code)) return;
  throw new M06PermissionError(code);
}

export function hasM06Permission(actor: M06Actor, code: M06PermissionCode): boolean {
  if (actor.permissions.includes("*")) return true;
  return actor.permissions.includes(code);
}

export function assertM06ClinicScope(actor: M06Actor, recordClinicIds: Array<string | undefined>): void {
  if (actor.clinicIds === undefined) return;
  if (actor.permissions.includes("*")) return;
  if (!actor.clinicIds.length) throw new M06ClinicScopeError();
  const known = recordClinicIds.filter((c): c is string => typeof c === "string" && c.length > 0);
  if (!known.length) throw new M06ClinicScopeError("Record has no clinicId — cannot enforce scope");
  if (!known.some((id) => actor.clinicIds!.includes(id))) throw new M06ClinicScopeError();
}

export function isInActorClinicScope(actor: M06Actor, clinicId: string | undefined | null): boolean {
  if (actor.permissions.includes("*")) return true;
  if (actor.clinicIds === undefined) return true;
  if (!clinicId) return false;
  return actor.clinicIds.includes(clinicId);
}

export function mapDemoIdentityPermissions(identity: {
  permissions: string[];
  managerControls: boolean;
  sensitivityClearance: "full" | "restricted" | string;
}): string[] {
  if (identity.permissions.includes("*")) {
    return ["*", ...M06_PERMISSION_CODES];
  }

  const worker: M06PermissionCode[] = [
    "attendance.view.self",
    "attendance.clock.self",
    "attendance.break.self",
    "attendance.declare",
    "attendance.correction.request",
    "attendance.timesheet.view",
    "attendance.timesheet.generate",
    "attendance.timesheet.submit",
    "attendance.sync.resolve",
  ];

  if (!identity.managerControls) return worker;

  const senior: M06PermissionCode[] = [
    "attendance.override",
    "attendance.evidence.view",
    "attendance.audit.view",
    "attendance.policy.manage",
  ];

  const manager = M06_PERMISSION_CODES.filter((c) => !senior.includes(c));
  if (identity.sensitivityClearance === "full") {
    return [...manager, ...senior];
  }
  return manager;
}

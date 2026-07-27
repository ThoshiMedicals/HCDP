/** M11 permission codes and enforcement helpers. */

export const M11_PERMISSION_CODES = [
  "training.view",
  "training.manage_catalogue",
  "training.assign",
  "training.complete",
  "training.assess",
  "training.competency.record",
  "training.certificate.verify",
  "training.exemption.request",
  "training.exemption.approve",
  "training.evidence.verify",
  "training.export",
  "training.view_sensitive_evidence",
  "training.manage_policy",
  "training.manage_sessions",
] as const;

export type M11PermissionCode = (typeof M11_PERMISSION_CODES)[number];

export type M11Actor = {
  userId: string;
  permissions: string[];
  /** When set, actor may only operate on assignments/sessions whose clinicIds intersect this set. */
  clinicIds?: string[];
};

export class M11PermissionError extends Error {
  code: M11PermissionCode;
  constructor(code: M11PermissionCode) {
    super(`Missing M11 permission: ${code}`);
    this.name = "M11PermissionError";
    this.code = code;
  }
}

export class M11ClinicScopeError extends Error {
  constructor(message = "Record is outside the actor clinic scope") {
    super(message);
    this.name = "M11ClinicScopeError";
  }
}

export function assertM11Permission(actor: M11Actor, code: M11PermissionCode): void {
  if (actor.permissions.includes("*")) return;
  if (actor.permissions.includes(code)) return;
  throw new M11PermissionError(code);
}

export function hasM11Permission(actor: M11Actor, code: M11PermissionCode): boolean {
  if (actor.permissions.includes("*")) return true;
  return actor.permissions.includes(code);
}

/** Enforce clinic boundary when actor.clinicIds is defined (empty array = no clinics → deny). */
export function assertM11ClinicScope(actor: M11Actor, recordClinicIds: string[]): void {
  if (actor.clinicIds === undefined) return;
  if (actor.permissions.includes("*")) return;
  if (!actor.clinicIds.length) throw new M11ClinicScopeError();
  const allowed = recordClinicIds.some((id) => actor.clinicIds!.includes(id));
  if (!allowed) throw new M11ClinicScopeError();
}

/**
 * Map demo identity flags to M11 permission codes.
 * - permissions includes "*" → grant all
 * - managerControls → most codes except sensitive unless clearance is full
 */
export function mapDemoIdentityPermissions(identity: {
  permissions: string[];
  managerControls: boolean;
  sensitivityClearance: "full" | "restricted" | string;
}): string[] {
  if (identity.permissions.includes("*")) {
    return ["*", ...M11_PERMISSION_CODES];
  }

  if (!identity.managerControls) {
    return ["training.view", "training.exemption.request", "training.complete"];
  }

  const codes: string[] = M11_PERMISSION_CODES.filter(
    (c) => c !== "training.view_sensitive_evidence"
  );
  if (identity.sensitivityClearance === "full") {
    codes.push("training.view_sensitive_evidence");
  }
  return codes;
}

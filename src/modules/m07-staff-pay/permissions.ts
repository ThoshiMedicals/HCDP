/** M07 canonical permission codes — Wave 6 Batch 1. */

export const M07_PERMISSION_CODES = [
  "payroll.view",
  "payroll.rate.view",
  "payroll.period.create",
  "payroll.period.edit",
  "payroll.period.lock",
  "payroll.export.profile.edit",
  "payroll.entity.settings",
  "payroll.intake.run",
  "payroll.profile.edit",
  "payroll.rules.edit",
  "payroll.calculate",
  "payroll.exception.view",
  "payroll.exception.resolve",
  "payroll.exception.waive",
  "payroll.externalId.view",
  "payroll.externalId.edit",
  "payroll.codes.edit",
  "payroll.adjust",
  "payroll.review.submit",
  "payroll.approve",
  "payroll.export.create",
  "payroll.export.reconcile",
  "payroll.audit.view",
  "payroll.report.view",
  "payroll.settings.edit",
  "payroll.bulk",
  "payroll.override",
] as const;

export type M07PermissionCode = (typeof M07_PERMISSION_CODES)[number];

export type M07Actor = {
  userId: string;
  personId?: string;
  permissions: string[];
  /** Organisation ids the actor may access. undefined = unrestricted (demo admin). */
  legalEntityIds?: string[];
  clinicIds?: string[];
};

export class M07PermissionError extends Error {
  code: M07PermissionCode;
  constructor(code: M07PermissionCode) {
    super(`Missing M07 permission: ${code}`);
    this.name = "M07PermissionError";
    this.code = code;
  }
}

export class M07LegalEntityScopeError extends Error {
  constructor(message = "Record is outside the actor legal-entity scope") {
    super(message);
    this.name = "M07LegalEntityScopeError";
  }
}

export class M07ClinicScopeError extends Error {
  constructor(message = "Record is outside the actor clinic scope") {
    super(message);
    this.name = "M07ClinicScopeError";
  }
}

export class M07SeparationOfDutiesError extends Error {
  constructor(message = "Separation of duties violation") {
    super(message);
    this.name = "M07SeparationOfDutiesError";
  }
}

export class M07ValidationError extends Error {
  reason: string;
  constructor(reason: string, message?: string) {
    super(message ?? reason);
    this.name = "M07ValidationError";
    this.reason = reason;
  }
}

export function assertM07Permission(actor: M07Actor, code: M07PermissionCode): void {
  if (actor.permissions.includes("*")) return;
  if (actor.permissions.includes(code)) return;
  throw new M07PermissionError(code);
}

export function hasM07Permission(actor: M07Actor, code: M07PermissionCode): boolean {
  if (actor.permissions.includes("*")) return true;
  return actor.permissions.includes(code);
}

export function assertM07LegalEntityScope(actor: M07Actor, legalEntityId: string): void {
  if (!legalEntityId) throw new M07LegalEntityScopeError("legalEntityId is required");
  if (actor.permissions.includes("*")) return;
  if (actor.legalEntityIds === undefined) return;
  if (!actor.legalEntityIds.length) throw new M07LegalEntityScopeError();
  if (!actor.legalEntityIds.includes(legalEntityId)) throw new M07LegalEntityScopeError();
}

export function assertM07ClinicScope(
  actor: M07Actor,
  recordClinicIds: Array<string | undefined>
): void {
  if (actor.clinicIds === undefined) return;
  if (actor.permissions.includes("*")) return;
  if (!actor.clinicIds.length) throw new M07ClinicScopeError();
  const known = recordClinicIds.filter((c): c is string => typeof c === "string" && c.length > 0);
  if (!known.length) return; // entity-only records without clinic tags are allowed
  if (!known.some((id) => actor.clinicIds!.includes(id))) throw new M07ClinicScopeError();
}

export function isInActorClinicScope(actor: M07Actor, clinicId: string | undefined | null): boolean {
  if (actor.permissions.includes("*")) return true;
  if (actor.clinicIds === undefined) return true;
  if (!clinicId) return true;
  return actor.clinicIds.includes(clinicId);
}

/** Role packs for demo Act-as mapping and tests. */
export const M07_ROLE_PACKS = {
  payClerk: [
    "payroll.view",
    "payroll.rate.view",
    "payroll.period.create",
    "payroll.period.edit",
    "payroll.intake.run",
    "payroll.profile.edit",
    "payroll.calculate",
    "payroll.exception.view",
    "payroll.exception.resolve",
    "payroll.adjust",
    "payroll.review.submit",
    "payroll.report.view",
    "payroll.externalId.view",
  ] as M07PermissionCode[],
  payReviewer: [
    "payroll.view",
    "payroll.exception.view",
    "payroll.report.view",
  ] as M07PermissionCode[],
  payApprover: [
    "payroll.view",
    "payroll.rate.view",
    "payroll.approve",
    "payroll.exception.view",
    "payroll.exception.waive",
    "payroll.period.lock",
    "payroll.audit.view",
  ] as M07PermissionCode[],
  exportOperator: [
    "payroll.view",
    "payroll.export.create",
    "payroll.export.reconcile",
    "payroll.report.view",
    "payroll.audit.view",
    "payroll.externalId.view",
  ] as M07PermissionCode[],
  payAdmin: [
    "payroll.view",
    "payroll.rate.view",
    "payroll.period.create",
    "payroll.period.edit",
    "payroll.period.lock",
    "payroll.export.profile.edit",
    "payroll.entity.settings",
    "payroll.profile.edit",
    "payroll.rules.edit",
    "payroll.codes.edit",
    "payroll.settings.edit",
    "payroll.adjust",
    "payroll.exception.waive",
    "payroll.audit.view",
    "payroll.bulk",
    "payroll.externalId.view",
    "payroll.externalId.edit",
    "payroll.report.view",
    "payroll.exception.view",
  ] as M07PermissionCode[],
  clinicManager: [
    "payroll.view",
    "payroll.exception.view",
    "payroll.report.view",
  ] as M07PermissionCode[],
} as const;

export function mapDemoIdentityPermissions(identity: {
  permissions: string[];
  managerControls: boolean;
  sensitivityClearance: "full" | "restricted" | string;
}): string[] {
  if (identity.permissions.includes("*")) {
    return ["*", ...M07_PERMISSION_CODES];
  }

  if (!identity.managerControls) {
    return [...M07_ROLE_PACKS.clinicManager];
  }

  if (identity.sensitivityClearance === "full") {
    return [...M07_ROLE_PACKS.payAdmin, ...M07_ROLE_PACKS.payApprover, ...M07_ROLE_PACKS.payClerk];
  }

  return [...M07_ROLE_PACKS.payClerk, ...M07_ROLE_PACKS.payReviewer];
}

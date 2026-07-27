/**
 * Wave 1A authentication & user provisioning tests (current stack — no Supabase).
 */

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  resetAuthMemoryState,
  seedDemoAuthWorld,
  getAuthMemoryState,
} from "../repository/memory-store";
import { resetConsoleEmailProvider, getConsoleEmailProvider } from "../email/console-provider";
import {
  authorizeApiAction,
  filterProfilesForOrganisation,
  getEffectivePermissionCodes,
  getEffectiveRoleAssignments,
  profileCanAccessPlatform,
} from "../services/authorization-service";
import {
  acceptInvitation,
  cancelInvitation,
  createAndSendInvitation,
  expireInvitations,
  resendInvitation,
} from "../services/invitation-service";
import {
  confirmPasswordReset,
  removeLoginAccessPreservingWorkforce,
  requestPasswordReset,
  suspendProfileLogin,
} from "../services/password-reset-service";
import { assignRole, assignClinicAccess } from "../services/role-assignment-service";
import { listAccessChangesForOrg } from "../services/access-audit-service";
import { createAuthAdminAdapter } from "../services/auth-admin-adapter";
import { assertBaseAccountRole, isBaseAccountRole } from "../contracts/base-role";
import { relinkWorkforcePerson } from "../services/workforce-link-service";
import {
  assertDemoActAsAllowed,
  getAuthEnforcementMode,
} from "../demo/demo-isolation";

describe("Wave 1A auth provisioning", () => {
  beforeEach(() => {
    resetAuthMemoryState();
    seedDemoAuthWorld();
    resetConsoleEmailProvider();
    delete process.env.AUTH_ENFORCEMENT;
    delete process.env.NEXT_PUBLIC_AUTH_ENFORCEMENT;
  });

  it("authorised administrator can create and invite several separate users", async () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    const adapter = createAuthAdminAdapter();
    const a = await adapter.createInvitedIdentity({
      actor: admin,
      email: "one@example.com",
      displayName: "One",
      organisationId: "org_hcdp",
      baseRole: "user",
      workforcePersonId: "person_one",
      intendedDetailedRoleIds: ["role_staff"],
      intendedClinicIds: ["clinic_chapel"],
    });
    const b = await adapter.createInvitedIdentity({
      actor: admin,
      email: "two@example.com",
      displayName: "Two",
      organisationId: "org_hcdp",
      baseRole: "manager",
      intendedDetailedRoleIds: ["role_staff"],
      intendedClinicIds: ["clinic_indooroopilly"],
    });
    assert.notEqual(a.invitation.id, b.invitation.id);
    assert.equal(a.profile.role, "user");
    assert.equal(b.profile.role, "manager");
    assert.ok(getConsoleEmailProvider().sent.length >= 2);
  });

  it("ordinary user cannot create, invite, suspend or grant privileged access", async () => {
    const staff = getAuthMemoryState().profiles.find((p) => p.id === "profile_staff")!;
    await assert.rejects(
      () =>
        createAndSendInvitation({
          actor: staff,
          email: "nope@example.com",
          displayName: "Nope",
          organisationId: "org_hcdp",
          baseRole: "user",
          intendedRoleIds: [],
          intendedClinicIds: [],
        }),
      /Missing permission|users\.invite/
    );
    assert.throws(() => suspendProfileLogin(staff, "profile_admin"), /Missing permission/);
    assert.equal(
      authorizeApiAction({
        actorProfileId: "profile_staff",
        permission: "users.manage",
      }).ok,
      false
    );
  });

  it("rejects any base role outside user, manager and admin", () => {
    assert.equal(isBaseAccountRole("user"), true);
    assert.equal(isBaseAccountRole("manager"), true);
    assert.equal(isBaseAccountRole("admin"), true);
    assert.equal(isBaseAccountRole("superadmin"), false);
    assert.throws(() => assertBaseAccountRole("owner"), /Invalid base role/);
    assert.throws(() => assertBaseAccountRole("Staff Member"), /Invalid base role/);
  });

  it("new user can create a password from a time-limited invitation", async () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    const { rawToken } = await createAndSendInvitation({
      actor: admin,
      email: "newhire@example.com",
      displayName: "New Hire",
      organisationId: "org_hcdp",
      baseRole: "user",
      intendedRoleIds: ["role_staff"],
      intendedClinicIds: ["clinic_chapel"],
    });
    const accepted = acceptInvitation({
      rawToken,
      password: "SecurePass1!",
    });
    assert.equal(accepted.invitation.status, "Accepted");
    assert.equal(accepted.profile.status, "Active");
    assert.ok(accepted.profile.authIdentityId);
    assert.equal(accepted.profile.role, "user");
  });

  it("existing user can complete password recovery through a separate reset link", async () => {
    const result = await requestPasswordReset("staff@hcdp.example");
    assert.equal(result.sent, true);
    assert.ok(result.rawToken);
    const confirmed = confirmPasswordReset({
      rawToken: result.rawToken!,
      newPassword: "AnotherPass9!",
    });
    assert.equal(confirmed.profile.email, "staff@hcdp.example");
    const events = getAuthMemoryState().passwordResets.map((e) => e.eventType);
    assert.ok(events.includes("requested"));
    assert.ok(events.includes("completed"));
  });

  it("invitations can be resent, cancelled and allowed to expire safely", async () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    const { invitation } = await createAndSendInvitation({
      actor: admin,
      email: "resend@example.com",
      displayName: "Resend Me",
      organisationId: "org_hcdp",
      baseRole: "user",
      intendedRoleIds: ["role_staff"],
      intendedClinicIds: [],
    });
    await resendInvitation(admin, invitation.id);
    const toExpire = await createAndSendInvitation({
      actor: admin,
      email: "expire@example.com",
      displayName: "Expire Me",
      organisationId: "org_hcdp",
      baseRole: "user",
      intendedRoleIds: [],
      intendedClinicIds: [],
    });
    toExpire.invitation.expiresAt = new Date(Date.now() - 1000).toISOString();
    expireInvitations();
    assert.equal(
      getAuthMemoryState().invitations.find((i) => i.id === toExpire.invitation.id)?.status,
      "Expired"
    );
    const cancelled = cancelInvitation(admin, invitation.id);
    assert.equal(cancelled.status, "Cancelled");
  });

  it("user can have one base role plus multiple effective-dated detailed role and clinic assignments", () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    const staff = getAuthMemoryState().profiles.find((p) => p.id === "profile_staff")!;
    assert.equal(staff.role, "user");
    assignRole(admin, {
      profileId: "profile_staff",
      roleId: "role_org_admin",
      clinicId: "clinic_chapel",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      reason: "temporary elevation",
    });
    assignClinicAccess(admin, {
      profileId: "profile_staff",
      clinicId: "clinic_indooroopilly",
      accessLevel: "read",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
    });
    const roles = getEffectiveRoleAssignments("profile_staff");
    assert.ok(roles.length >= 2);
    assert.ok(roles.some((r) => r.clinicId === "clinic_chapel"));
    assert.equal(staff.role, "user");
  });

  it("temporary role and clinic access expire automatically", () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    assignRole(admin, {
      profileId: "profile_staff",
      roleId: "role_org_admin",
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      effectiveTo: "2026-06-01T00:00:00.000Z",
      reason: "temp",
    });
    const before = getEffectivePermissionCodes(
      "profile_staff",
      new Date("2026-03-01T00:00:00.000Z")
    );
    const after = getEffectivePermissionCodes(
      "profile_staff",
      new Date("2026-07-01T00:00:00.000Z")
    );
    assert.ok(before.includes("users.invite"));
    assert.equal(after.includes("users.invite"), false);
  });

  it("suspended and locked users cannot access protected APIs", () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    const suspended = suspendProfileLogin(admin, "profile_staff");
    assert.equal(profileCanAccessPlatform(suspended).allowed, false);
    assert.equal(
      authorizeApiAction({
        actorProfileId: "profile_staff",
        permission: "users.view",
      }).ok,
      false
    );
  });

  it("direct API authorization cannot bypass hidden UI controls", () => {
    assert.equal(
      authorizeApiAction({
        actorProfileId: "profile_staff",
        permission: "users.invite",
        targetOrganisationId: "org_hcdp",
      }).ok,
      false
    );
    assert.equal(
      authorizeApiAction({
        actorProfileId: "profile_admin",
        permission: "users.invite",
        targetOrganisationId: "org_hcdp",
      }).ok,
      true
    );
  });

  it("one organisation cannot read another organisation's users", () => {
    const state = getAuthMemoryState();
    state.profiles.push({
      id: "profile_other",
      organisationId: "org_other",
      authIdentityId: "auth_other",
      email: "other@example.com",
      displayName: "Other",
      role: "admin",
      status: "Active",
      workforcePersonId: null,
      managerProfileId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const admin = state.profiles.find((p) => p.id === "profile_admin")!;
    const visible = filterProfilesForOrganisation(admin, state);
    assert.ok(visible.every((p) => p.organisationId === "org_hcdp"));
    assert.equal(
      authorizeApiAction({
        actorProfileId: "profile_admin",
        permission: "users.view",
        targetOrganisationId: "org_other",
      }).ok,
      false
    );
  });

  it("removing authentication access does not delete workforce history", () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    const staff = getAuthMemoryState().profiles.find((p) => p.id === "profile_staff")!;
    const workforceId = staff.workforcePersonId;
    assert.ok(workforceId);
    const archived = removeLoginAccessPreservingWorkforce(admin, "profile_staff");
    assert.equal(archived.authIdentityId, null);
    assert.equal(archived.workforcePersonId, workforceId);
    assert.equal(profileCanAccessPlatform(archived).allowed, false);
  });

  it("invitation, activation, reset, role, clinic and suspension changes are audited", async () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    await createAndSendInvitation({
      actor: admin,
      email: "audit@example.com",
      displayName: "Audit",
      organisationId: "org_hcdp",
      baseRole: "user",
      intendedRoleIds: [],
      intendedClinicIds: [],
    });
    assignRole(admin, {
      profileId: "profile_staff",
      roleId: "role_org_admin",
      effectiveFrom: "2026-07-01T00:00:00.000Z",
      reason: "audit me",
    });
    suspendProfileLogin(admin, "profile_staff");
    const history = listAccessChangesForOrg("org_hcdp");
    assert.ok(history.some((h) => h.changeType === "invitation.created"));
    assert.ok(history.some((h) => h.changeType === "role.assigned"));
    assert.ok(history.some((h) => h.changeType === "profile.suspended"));
  });

  it("demo Act-as is isolated from production enforcement", () => {
    assert.equal(getAuthEnforcementMode(), "demo");
    assert.doesNotThrow(() => assertDemoActAsAllowed());
    process.env.AUTH_ENFORCEMENT = "production";
    assert.throws(() => assertDemoActAsAllowed(), /production/);
  });

  it("keeps auth identity, profile, workforce person and base role separated", () => {
    const staff = getAuthMemoryState().profiles.find((p) => p.id === "profile_staff")!;
    assert.notEqual(staff.authIdentityId, staff.workforcePersonId);
    assert.notEqual(staff.id, staff.workforcePersonId);
    assert.equal(staff.role, "user");
    assert.ok(getEffectiveRoleAssignments(staff.id).length >= 1);
  });

  it("audited workforcePersonId relink is nullable and rejects dual active links", () => {
    const admin = getAuthMemoryState().profiles.find((p) => p.id === "profile_admin")!;
    const staff = getAuthMemoryState().profiles.find((p) => p.id === "profile_staff")!;
    assert.equal(staff.workforcePersonId, "person_staff");

    const cleared = relinkWorkforcePerson({
      actor: admin,
      profileId: staff.id,
      workforcePersonId: null,
      reason: "Vendor support account — no workforce person",
    });
    assert.equal(cleared.workforcePersonId, null);

    assert.throws(
      () =>
        relinkWorkforcePerson({
          actor: admin,
          profileId: staff.id,
          workforcePersonId: "person_admin",
          reason: "conflict",
        }),
      /already linked/
    );

    const linked = relinkWorkforcePerson({
      actor: admin,
      profileId: staff.id,
      workforcePersonId: "person_staff",
      reason: "Restore staff link",
    });
    assert.equal(linked.workforcePersonId, "person_staff");
    const history = listAccessChangesForOrg("org_hcdp");
    assert.ok(history.some((h) => h.changeType === "profile.workforce_relink"));
  });
});

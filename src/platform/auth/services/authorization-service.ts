import type { ApplicationProfile, UserRoleAssignment } from "../contracts/identity-separation";
import type { PlatformPermissionCode } from "../contracts/statuses";
import { getAuthMemoryState, type AuthMemoryState } from "../repository/memory-store";

function isEffective(from: string, to: string | null, at: Date): boolean {
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Number.POSITIVE_INFINITY;
  const t = at.getTime();
  return start <= t && t < end;
}

export function getEffectiveRoleAssignments(
  profileId: string,
  at: Date = new Date(),
  state: AuthMemoryState = getAuthMemoryState()
): UserRoleAssignment[] {
  return state.roleAssignments.filter(
    (a) => a.profileId === profileId && isEffective(a.effectiveFrom, a.effectiveTo, at)
  );
}

export function getEffectivePermissionCodes(
  profileId: string,
  at: Date = new Date(),
  state: AuthMemoryState = getAuthMemoryState()
): string[] {
  const assignments = getEffectiveRoleAssignments(profileId, at, state);
  const codes = new Set<string>();
  for (const a of assignments) {
    const role = state.roles.find((r) => r.id === a.roleId);
    if (!role) continue;
    for (const c of role.permissionCodes) codes.add(c);
  }
  // Delegations
  for (const d of state.delegations) {
    if (
      d.toProfileId === profileId &&
      isEffective(d.effectiveFrom, d.effectiveTo, at)
    ) {
      for (const c of d.permissionCodes) codes.add(c);
    }
  }
  return [...codes];
}

export function profileCanAccessPlatform(
  profile: ApplicationProfile | null | undefined
): { allowed: boolean; reason?: string } {
  if (!profile) return { allowed: false, reason: "Profile missing" };
  if (profile.status === "Suspended") return { allowed: false, reason: "Account suspended" };
  if (profile.status === "Locked") return { allowed: false, reason: "Account locked" };
  if (profile.status === "Archived") return { allowed: false, reason: "Account archived" };
  if (profile.status === "Offboarding") return { allowed: false, reason: "Account offboarding" };
  if (profile.status !== "Active") return { allowed: false, reason: `Status ${profile.status}` };
  return { allowed: true };
}

export function assertPermission(
  actor: ApplicationProfile,
  permission: PlatformPermissionCode,
  at: Date = new Date(),
  state: AuthMemoryState = getAuthMemoryState()
): void {
  const access = profileCanAccessPlatform(actor);
  if (!access.allowed) throw new Error(access.reason ?? "Access denied");
  const codes = getEffectivePermissionCodes(actor.id, at, state);
  if (!codes.includes(permission) && !codes.includes("org.admin")) {
    throw new Error(`Missing permission: ${permission}`);
  }
}

export function assertSameOrganisation(actorOrgId: string, targetOrgId: string): void {
  if (actorOrgId !== targetOrgId) {
    throw new Error("Cross-organisation access denied");
  }
}

/** API-layer check used by routes — UI hiding is never sufficient alone. */
export function authorizeApiAction(input: {
  actorProfileId: string;
  permission: PlatformPermissionCode;
  targetOrganisationId?: string;
  at?: Date;
  state?: AuthMemoryState;
}): { ok: true; actor: ApplicationProfile } | { ok: false; error: string } {
  const state = input.state ?? getAuthMemoryState();
  const actor = state.profiles.find((p) => p.id === input.actorProfileId);
  if (!actor) return { ok: false, error: "Actor not found" };
  try {
    assertPermission(actor, input.permission, input.at ?? new Date(), state);
    if (input.targetOrganisationId) {
      assertSameOrganisation(actor.organisationId, input.targetOrganisationId);
    }
    return { ok: true, actor };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Denied" };
  }
}

/** Simulates RLS org isolation for foundation-mode queries. */
export function filterProfilesForOrganisation(
  viewer: ApplicationProfile,
  state: AuthMemoryState = getAuthMemoryState()
): ApplicationProfile[] {
  return state.profiles.filter((p) => p.organisationId === viewer.organisationId);
}

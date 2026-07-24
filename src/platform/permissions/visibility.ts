/**
 * Platform permission helpers for navigation and enterprise visibility.
 * Module-specific RBAC remains inside each module; this layer only coordinates shell access.
 */

import {
  canSeeEnterpriseExtensions,
  modulesVisibleForRole,
  type PlatformModule,
} from "@/platform/module-registry";
import type { DemoIdentity } from "@/platform/context/identity-context";

export function modulesForIdentity(identity: DemoIdentity): PlatformModule[] {
  return modulesVisibleForRole(identity.role);
}

export function identitySeesEnterprise(identity: DemoIdentity): boolean {
  return canSeeEnterpriseExtensions(identity.role) && identity.enterpriseExtensionsVisible;
}

export function identityAllowsManagerControls(identity: DemoIdentity): boolean {
  return identity.managerControls;
}

export function identityAllowsExecutiveControls(identity: DemoIdentity): boolean {
  return identity.executiveControls;
}

export function identityHasFullSensitivity(identity: DemoIdentity): boolean {
  return identity.sensitivityClearance === "full";
}

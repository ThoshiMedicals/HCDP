"use client";

import type { DemoIdentity } from "@/platform/demo";

export function PermissionGuard({
  identity,
  requireManager,
  requireExecutive,
  requireEnterprise,
  requireSensitivity,
  fallback = null,
  children,
}: {
  identity: DemoIdentity;
  requireManager?: boolean;
  requireExecutive?: boolean;
  requireEnterprise?: boolean;
  requireSensitivity?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (requireManager && !identity.managerControls) return <>{fallback}</>;
  if (requireExecutive && !identity.executiveControls) return <>{fallback}</>;
  if (requireEnterprise && !identity.enterpriseExtensionsVisible) return <>{fallback}</>;
  if (requireSensitivity && identity.sensitivityClearance !== "full") return <>{fallback}</>;
  return <>{children}</>;
}

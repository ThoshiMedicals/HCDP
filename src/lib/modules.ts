/**
 * Compatibility module catalogue — sourced from the authoritative platform register.
 * Prefer `@/platform/module-registry` for new code.
 */

import {
  PLATFORM_MODULES,
  coreModules,
  enterpriseModules,
  getPlatformModule,
  getPlatformModuleByRouteSlug,
  type IconName,
  type PlatformModule,
} from "@/platform/module-registry";

export type { IconName };

export interface ModuleDef {
  id: string;
  htmlId: string;
  label: string;
  title: string;
  subtitle: string;
  icon: IconName;
  group: string;
  groupId: string;
  polished?: boolean;
  /** Approved platform module id */
  platformId: string;
  moduleNumber: number;
  tier: "core" | "enterprise";
  forceNext: boolean;
  condition: PlatformModule["condition"];
}

function toModuleDef(mod: PlatformModule): ModuleDef {
  return {
    id: mod.mainRoute.replace(/^\//, ""),
    htmlId: mod.primaryHtmlId ?? mod.id,
    label: mod.shortName,
    title: mod.displayName,
    subtitle: mod.purpose,
    icon: mod.icon,
    group: mod.navigationFamily,
    groupId: mod.navigationFamily.toLowerCase().replace(/\s+/g, "-"),
    polished: mod.forceNext,
    platformId: mod.id,
    moduleNumber: mod.number,
    tier: mod.tier,
    forceNext: mod.forceNext,
    condition: mod.condition,
  };
}

/** Approved modules only (24). Used for sidebar and static params. */
export const MODULES: ModuleDef[] = PLATFORM_MODULES.map(toModuleDef);

export const CORE_MODULES = coreModules().map(toModuleDef);
export const ENTERPRISE_MODULES = enterpriseModules().map(toModuleDef);

/** Navigation families for sidebar grouping (compact). */
export const NAV_GROUPS: {
  id: string;
  title: string;
  icon: IconName;
  accent: string;
  soft: string;
  short: string;
  items: string[];
  tier: "core" | "enterprise";
}[] = (() => {
  const familyOrder = [
    "Executive",
    "Organisation",
    "People",
    "Roster",
    "Operations",
    "Governance",
    "Assets",
    "Communications",
    "Digital",
    "Analytics",
    "Commercial",
  ] as const;

  const groups: {
    id: string;
    title: string;
    icon: IconName;
    accent: string;
    soft: string;
    short: string;
    items: string[];
    tier: "core" | "enterprise";
  }[] = familyOrder
    .map((family) => {
      const mods = coreModules().filter((m) => m.navigationFamily === family);
      const sample = mods[0];
      return {
        id: family.toLowerCase(),
        title: family === "Executive" ? "Executive Command" : family,
        icon: (sample?.icon ?? "file") as IconName,
        accent: sample?.familyAccent ?? "#2563eb",
        soft: sample?.familySoft ?? "#eff6ff",
        short: family.slice(0, 2).toUpperCase(),
        items: mods.map((m) => m.mainRoute.replace(/^\//, "")),
        tier: "core" as const,
      };
    })
    .filter((g) => g.items.length > 0);

  const enterprise = enterpriseModules();
  if (enterprise.length) {
    groups.push({
      id: "enterprise-extensions",
      title: "Enterprise Extensions",
      icon: "globe",
      accent: "#4338ca",
      soft: "#eef2ff",
      short: "EN",
      items: enterprise.map((m) => m.mainRoute.replace(/^\//, "")),
      tier: "enterprise",
    });
  }
  return groups;
})();

export const FAMILY_PALETTE = NAV_GROUPS.filter((g) => g.tier === "core").map((g) => ({
  title: g.title,
  accent: g.accent,
  soft: g.soft,
  short: g.short,
  icon: g.icon,
  groupId: g.id,
}));

const MODULE_MAP = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export function getModule(id: string): ModuleDef | undefined {
  if (MODULE_MAP[id]) return MODULE_MAP[id];
  const plat = getPlatformModuleByRouteSlug(id) ?? getPlatformModule(id);
  return plat ? toModuleDef(plat) : undefined;
}

export function getModuleByHtmlId(htmlId: string): ModuleDef | undefined {
  const hit = PLATFORM_MODULES.find(
    (m) => m.primaryHtmlId === htmlId || m.htmlIds?.includes(htmlId) || m.id === htmlId
  );
  return hit ? toModuleDef(hit) : undefined;
}

export function getModuleByPlatformId(platformId: string): ModuleDef | undefined {
  const hit = getPlatformModule(platformId);
  return hit ? toModuleDef(hit) : undefined;
}

export function isModuleId(id: string): boolean {
  return id in MODULE_MAP;
}

export const GROUP_ACCENT = Object.fromEntries(
  NAV_GROUPS.map((g) => [g.title, g.accent])
) as Record<string, string>;

export const GROUP_SOFT = Object.fromEntries(
  NAV_GROUPS.map((g) => [g.title, g.soft])
) as Record<string, string>;

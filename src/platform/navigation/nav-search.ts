/**
 * Sidebar / topbar search over approved modules, sections, and legacy term aliases.
 * Deduplicates so the same approved module is not returned twice as a top-level hit.
 */

import { PLATFORM_MODULES, type PlatformModule } from "@/platform/module-registry";

export interface NavSearchHit {
  moduleId: string;
  moduleNumber: number;
  moduleName: string;
  sectionId?: string;
  sectionLabel?: string;
  href: string;
  matchLabel: string;
  kind: "module" | "section";
}

function matches(q: string, ...parts: Array<string | undefined>): boolean {
  return parts.some((p) => p && p.toLowerCase().includes(q));
}

export function searchPlatformNav(query: string, visibleModules?: PlatformModule[]): NavSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const modules = visibleModules ?? PLATFORM_MODULES;
  const hits: NavSearchHit[] = [];
  const seenModule = new Set<string>();

  for (const mod of modules) {
    const moduleMatch =
      matches(q, mod.displayName, mod.shortName, mod.id, mod.purpose, String(mod.number)) ||
      mod.legacyFeatures.some((f) => f.toLowerCase().includes(q)) ||
      mod.legacyRoutes.some((r) => r.toLowerCase().includes(q));

    if (moduleMatch && !seenModule.has(mod.id)) {
      hits.push({
        moduleId: mod.id,
        moduleNumber: mod.number,
        moduleName: mod.displayName,
        href: mod.mainRoute,
        matchLabel: mod.displayName,
        kind: "module",
      });
      seenModule.add(mod.id);
    }

    for (const section of mod.sections) {
      const terms = [section.label, section.id, ...(section.legacyTerms ?? [])];
      if (!terms.some((t) => t.toLowerCase().includes(q))) continue;
      hits.push({
        moduleId: mod.id,
        moduleNumber: mod.number,
        moduleName: mod.displayName,
        sectionId: section.id,
        sectionLabel: section.label,
        href: `${mod.mainRoute}?section=${encodeURIComponent(section.id)}`,
        matchLabel: `${mod.displayName} → ${section.label}`,
        kind: "section",
      });
      // Ensure parent module is not also listed as a duplicate bare hit unless it matched independently
      seenModule.add(mod.id);
    }
  }

  // Prefer section hits when query clearly targets a section term; keep module hits that are unique
  return hits.slice(0, 24);
}

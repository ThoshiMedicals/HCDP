import locationsJson from "./locations.json";
import doctorsJson from "./doctors.json";
import staffJson from "./staff.json";
import checklistsJson from "./checklists.json";
import accreditationJson from "./accreditation.json";
import riskSeedJson from "./risk-seed.json";
import complianceSeedJson from "./compliance-seed.json";
import familyStylesJson from "./family-styles.json";
import navJson from "./nav.json";
import themeJson from "./theme.json";
import brdModulesJson from "./brd-modules.json";
import checklistTemplateItemsJson from "./checklist-template-items.json";
import moduleBlueprintsJson from "./module-blueprints.json";

export type FamilyStyle = {
  accent: string;
  soft: string;
  short: string;
  icon: string;
};

export type HtmlNavGroup = {
  id: string;
  label: string;
  icon: string;
  items: [string, string][];
};

/** Convert HTML camelCase module ids to URL slugs. */
export function htmlIdToSlug(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

export const extractedLocations = locationsJson as Array<{
  id: string;
  name: string;
  shortName: string;
  phone: string;
  email: string;
  address: string;
  manager: string;
  publicHolidayRegion: string;
  status: string;
}>;

export const extractedDoctors = doctorsJson as Array<Record<string, unknown>>;
export const extractedStaff = staffJson as Array<Record<string, unknown>>;
export const extractedChecklists = checklistsJson as Array<Record<string, unknown>>;
export const extractedAccreditation = accreditationJson as Array<Record<string, unknown>>;
export const extractedRisks = riskSeedJson as Array<Record<string, unknown>>;
export const extractedCompliance = complianceSeedJson as Array<Record<string, unknown>>;
export const extractedFamilyStyles = familyStylesJson as Record<string, FamilyStyle>;
export const extractedNav = navJson as HtmlNavGroup[];
export const extractedTheme = themeJson as {
  root: Record<string, string>;
  v34: Record<string, string>;
  v33: Record<string, string>;
  themes: Record<string, Record<string, string>>;
  settingsDefaults: Record<string, string | number>;
};
export const extractedBrdModules = brdModulesJson as Array<Record<string, unknown>>;
export const extractedChecklistTemplateItems = checklistTemplateItemsJson as Record<
  string,
  string[]
>;
export const extractedModuleBlueprints = moduleBlueprintsJson as Record<
  string,
  Record<string, unknown>
>;

/** Map of slug → HTML module id */
export const slugToHtmlId: Record<string, string> = {};
/** Map of HTML id → slug */
export const htmlIdToSlugMap: Record<string, string> = {};

for (const group of extractedNav) {
  for (const [htmlId] of group.items) {
    const slug = htmlIdToSlug(htmlId);
    slugToHtmlId[slug] = htmlId;
    htmlIdToSlugMap[htmlId] = slug;
  }
}

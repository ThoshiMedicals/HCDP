import type { ActionCategory, LayoutPeriod } from "./types";
import type { Location } from "@/lib/types";

export function buildFilterSentence(opts: {
  count: number;
  priority: string | null;
  categories: ActionCategory[];
  selectedClinicIds: string[];
  locations: Location[];
  period: LayoutPeriod;
  status?: string | null;
  assignee?: string | null;
}): string {
  const {
    count,
    priority,
    categories,
    selectedClinicIds,
    locations,
    period,
    status,
    assignee,
  } = opts;

  const allSelected =
    selectedClinicIds.length === 0 || selectedClinicIds.length === locations.length;

  const clinicLabel = allSelected
    ? "all clinics"
    : selectedClinicIds
        .map((id) => locations.find((l) => l.id === id)?.shortName ?? id)
        .join(", ");

  const priorityLabel = priority ?? "active";
  const categoryLabel =
    categories.length === 0
      ? "all categories"
      : categories.length === 1
        ? categories[0]
        : `${categories.slice(0, -1).join(", ")} and ${categories[categories.length - 1]}`;

  let sentence = `Showing ${count} ${priorityLabel} action${count === 1 ? "" : "s"}`;
  if (categories.length) sentence += ` across ${categoryLabel}`;
  else sentence += ` across ${categoryLabel}`;
  sentence += ` for ${clinicLabel}`;
  sentence += ` · Reporting window: ${period}`;
  if (period === "Custom Range") {
    sentence += " (custom date range)";
  }
  if (status) sentence += ` · Status: ${status}`;
  if (assignee) sentence += ` · Assigned: ${assignee}`;
  return sentence;
}

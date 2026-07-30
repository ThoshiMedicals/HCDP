export type M07SectionId =
  | "overview"
  | "people"
  | "leave"
  | "adjustments"
  | "exceptions"
  | "variances"
  | "approval"
  | "export"
  | "reconciliation"
  | "history"
  | "settings";

export const M07_SECTION_META: Record<
  M07SectionId,
  { label: string; batch1: "available" | "planned"; batchNote?: string }
> = {
  overview: { label: "Pay Run Overview", batch1: "available" },
  people: { label: "People Review", batch1: "available" },
  leave: {
    label: "Leave & Allowances",
    batch1: "available",
    batchNote: "Leave, allowance and deduction preparation available (Batch 4)",
  },
  adjustments: {
    label: "Adjustments",
    batch1: "available",
    batchNote:
      "PPA-1 prior-period adjustment foundation: register, create and cancel draft only",
  },
  exceptions: { label: "Exceptions", batch1: "available", batchNote: "Batch 4 resolve/waive" },
  variances: { label: "Variances", batch1: "available", batchNote: "Batch 4 informational" },
  approval: {
    label: "Approval",
    batch1: "available",
    batchNote: "Batch 5 management approval (non-certified)",
  },
  export: {
    label: "Export",
    batch1: "available",
    batchNote: "Batch 6 non-certified export preparation (not payment)",
  },
  reconciliation: {
    label: "Reconciliation",
    batch1: "available",
    batchNote: "Batch 6 package-level reconciliation (not provider return files)",
  },
  history: { label: "History / Reports", batch1: "planned" },
  settings: { label: "Settings", batch1: "available" },
};

const VALID: M07SectionId[] = Object.keys(M07_SECTION_META) as M07SectionId[];

export function resolveM07Section(raw: string | null | undefined): M07SectionId {
  if (!raw) return "overview";
  if (raw === "pay-prep" || raw === "pay-run") return "overview";
  if (raw === "exports") return "export";
  if (raw === "reports") return "history";
  if ((VALID as string[]).includes(raw)) return raw as M07SectionId;
  return "overview";
}

import fieldSchemasJson from "@/lib/extracted/field-schemas.json";
import checklistWizardJson from "@/lib/extracted/checklist-wizard.json";
import staffWizardJson from "@/lib/extracted/staff-wizard.json";
import taskWizardJson from "@/lib/extracted/task-wizard.json";
import modulesDictJson from "@/lib/extracted/modules-dict.json";

export type FieldType =
  | "text"
  | "email"
  | "date"
  | "number"
  | "textarea"
  | "select"
  | "location"
  | "locationMulti"
  | "checkbox"
  | "personAssignment";

export interface FieldSchema {
  name: string;
  label: string;
  type: FieldType | string;
  required?: boolean;
  full?: true | boolean;
  options?: string[];
  default?: string | boolean | number;
  placeholder?: string;
  hint?: string;
}

export interface WizardSchema {
  title: string;
  tabs: string[];
  fields: FieldSchema[];
  submitLabel: string;
}

/** Complete FIELD_SCHEMAS from HTML (base + all addFieldsOnce patches) — 41 modules. */
export const FIELD_SCHEMAS = fieldSchemasJson as Record<string, FieldSchema[]>;

export const CHECKLIST_WIZARD = checklistWizardJson as WizardSchema;
export const STAFF_WIZARD = staffWizardJson as WizardSchema;
export const TASK_WIZARD = taskWizardJson as WizardSchema;

const MODULES_DICT = modulesDictJson as Record<
  string,
  { label?: string; title?: string; primary?: string }
>;

export function hasFieldSchema(moduleKey: string): boolean {
  return Array.isArray(FIELD_SCHEMAS[moduleKey]) && FIELD_SCHEMAS[moduleKey].length > 0;
}

export function moduleLabel(moduleKey: string): string {
  const fromDict = MODULES_DICT[moduleKey];
  if (fromDict?.primary) {
    return fromDict.primary.replace(/^(Create|Add)\s+/i, "");
  }
  if (fromDict?.label) return fromDict.label;
  const fallback: Record<string, string> = {
    locations: "Location",
    tasks: "Task",
    checklists: "Checklist",
    incidents: "Incident",
    staff: "Staff",
    doctors: "Doctor",
    hrDocs: "HR Document",
    training: "Training",
    roster: "Roster Shift",
    timeclock: "Time Entry",
    staffpay: "Staff Pay Period",
    doctorpay: "Doctor Pay Run",
    bbpip: "BBPIP Estimate",
    rooms: "Room",
    inventory: "Inventory Item",
    stock: "Stock Item",
    equipment: "Equipment",
    website: "Website",
    accreditation: "Evidence",
    qi: "QI Activity",
    policies: "Policy",
    memos: "Memo",
    commbook: "Note",
    email: "Email Campaign",
    sms: "SMS Campaign",
    noticeboards: "Noticeboard",
    remote: "Remote Access",
    vault: "Secret",
    cameras: "Camera Access",
    printers: "Printer",
    ticketing: "Ticket",
    finance: "Finance Record",
    leave: "Leave Request",
    shiftswap: "Shift Swap",
    awardRules: "Award Rule",
    doctorportal: "Doctor Portal Item",
    stocktransfer: "Stock Transfer",
    consent: "Consent Record",
    cameraInventory: "Camera Inventory",
    users: "User",
    departments: "Department",
  };
  return fallback[moduleKey] || moduleKey;
}

/** Create redirects that match HTML openCreate / openForm overrides. */
export function createRedirect(moduleKey: string): "checklist" | "staff" | "task" | "schema" | null {
  if (moduleKey === "checklists" || moduleKey === "frontdesk") return "checklist";
  if (moduleKey === "staff") return "staff";
  if (moduleKey === "tasks") return "task";
  if (hasFieldSchema(moduleKey)) return "schema";
  return null;
}

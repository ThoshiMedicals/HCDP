const fs = require("fs");
const path = require("path");

const htmlPath = path.join(process.cwd(), "public", "pulse-html-prototype.html");
const outDir = path.join(process.cwd(), "src", "lib", "extracted");
const html = fs.readFileSync(htmlPath, "utf8");

function sliceAssign(name) {
  const re = new RegExp(`(?:const|let|var)\\s+${name}\\s*=`);
  const m = html.match(re);
  if (!m) throw new Error("not found " + name);
  const start = m.index;
  const eq = html.indexOf("=", start);
  let i = eq + 1;
  while (/\s/.test(html[i])) i++;
  const open = html[i];
  const close = open === "[" ? "]" : open === "{" ? "}" : null;
  if (!close) throw new Error("bad open " + open + " for " + name);
  let depth = 0;
  let inStr = false;
  let strCh = "";
  let escape = false;
  for (let j = i; j < html.length; j++) {
    const ch = html[j];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === strCh) inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) return html.slice(i, j + 1);
    }
  }
  throw new Error("unbalanced " + name);
}

const schemas = Function(`"use strict"; return (${sliceAssign("FIELD_SCHEMAS")});`)();
fs.writeFileSync(path.join(outDir, "field-schemas.json"), JSON.stringify(schemas, null, 2));
console.log("FIELD_SCHEMAS modules:", Object.keys(schemas).length);
console.log(Object.keys(schemas).join(", "));

// Extract checklist wizard HTML exact form markup for reference
const wizardMatch = html.match(
  /window\.openChecklistWizard\s*=\s*function\s*\(\)\s*\{([\s\S]*?)\n  \}/
);
if (wizardMatch) {
  fs.writeFileSync(path.join(outDir, "checklist-wizard.js.txt"), wizardMatch[1]);
  console.log("checklist wizard snippet saved");
}

const staffMatch = html.match(
  /window\.openStaffWizard\s*=\s*function\s*\(id=''\)\s*\{([\s\S]*?)\n  window\.saveStaffWizard/
);
if (staffMatch) {
  fs.writeFileSync(path.join(outDir, "staff-wizard.js.txt"), staffMatch[1]);
  console.log("staff wizard snippet saved");
}

// Build structured checklist wizard schema matching HTML exactly
const checklistWizard = {
  title: "Create Checklist",
  tabs: ["1 Frequency", "2 Type", "3 Items", "4 Assign", "5 Publish"],
  fields: [
    {
      name: "frequency",
      label: "Frequency",
      type: "select",
      options: ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "Custom"],
    },
    {
      name: "timeOfDay",
      label: "Time of day",
      type: "select",
      options: ["AM Morning", "PM Afternoon", "Custom Time", "Clock-out", "Clock-in"],
    },
    {
      name: "workflowScope",
      label: "Checklist type",
      type: "select",
      options: [
        "General",
        "Front Desk",
        "Nurse Accreditation Checklist",
        "Manager Accreditation Review",
        "Room Setup",
      ],
    },
    {
      name: "assignment",
      label: "Assignment",
      type: "select",
      options: ["Group", "Individual"],
    },
    {
      name: "department",
      label: "Department",
      type: "select",
      options: [
        "All Departments",
        "Reception",
        "Nursing",
        "Management",
        "Doctors",
        "IT Support",
        "Cleaners",
      ],
    },
    {
      name: "responsibleRole",
      label: "Responsible person / role",
      type: "text",
      placeholder: "e.g. Reception opening staff",
    },
    {
      name: "name",
      label: "Title",
      type: "text",
      required: true,
      full: true,
      placeholder: "e.g. Morning Opening",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      full: true,
      placeholder: "Brief description",
    },
    {
      name: "items",
      label: "Checklist items",
      type: "textarea",
      full: true,
      placeholder:
        "One item per line\nTurn on reception computers\nCheck Best Practice opens\nRecord vaccine fridge AM temperature",
      hint: "Action type defaults to tick. Critical items create manager review if skipped.",
    },
    {
      name: "instructions",
      label: "Instructions",
      type: "textarea",
      full: true,
      placeholder: "Any notes for completing this checklist",
    },
    {
      name: "managerReviewRequired",
      label: "Manager review if skipped/incomplete",
      type: "checkbox",
      default: true,
    },
    {
      name: "publishNow",
      label: "Publish checklist now",
      type: "checkbox",
      default: true,
    },
  ],
  submitLabel: "Publish Checklist",
};

const staffWizard = {
  title: "Add Staff",
  tabs: ["Basic", "Emergency", "Prefs", "Personal"],
  fields: [
    { name: "email", label: "Email Address *", type: "email", required: true, placeholder: "staff@example.com" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "firstName", label: "First Name *", type: "text", required: true },
    { name: "lastName", label: "Last Name *", type: "text", required: true },
    {
      name: "department",
      label: "Department *",
      type: "select",
      required: true,
      options: ["Reception", "Nursing", "Management", "Administration", "IT Support", "Cleaners", "Doctors"],
    },
    {
      name: "role",
      label: "Role *",
      type: "select",
      required: true,
      options: ["Receptionist", "Nurse", "Manager", "Area Manager", "Office Manager", "Employee", "IT Support"],
    },
    { name: "address", label: "Address", type: "text", full: true },
    { name: "emergencyContact", label: "Emergency Contact", type: "text" },
    { name: "emergencyRelationship", label: "Relationship", type: "text", placeholder: "e.g. Spouse, Partner" },
    { name: "emergencyPhone", label: "Emergency Phone", type: "text" },
    { name: "emergencyEmail", label: "Emergency Email", type: "email" },
    { name: "nextOfKin", label: "Next of Kin", type: "text" },
    { name: "nextOfKinPhone", label: "Next of Kin Phone", type: "text" },
    {
      name: "dietaryRestrictions",
      label: "Dietary Restrictions",
      type: "text",
      full: true,
      placeholder: "e.g. Vegetarian, Gluten-free",
    },
    {
      name: "workPreferences",
      label: "Work Preferences",
      type: "textarea",
      full: true,
      placeholder: "e.g. morning shifts, no weekends",
    },
    {
      name: "communicationPreference",
      label: "Communication Preference",
      type: "select",
      options: ["Email", "SMS", "Phone", "WhatsApp"],
    },
    { name: "birthday", label: "Birthday", type: "date" },
    {
      name: "personalNotes",
      label: "Likes / Dislikes / Notes",
      type: "textarea",
      full: true,
      placeholder: "Likes, dislikes, cultural celebrations and notes",
    },
    {
      name: "locations",
      label: "Medical centre allocation",
      type: "locationMulti",
      full: true,
    },
  ],
  submitLabel: "Add & Send Invite",
};

fs.writeFileSync(path.join(outDir, "checklist-wizard.json"), JSON.stringify(checklistWizard, null, 2));
fs.writeFileSync(path.join(outDir, "staff-wizard.json"), JSON.stringify(staffWizard, null, 2));
console.log("wizards written");

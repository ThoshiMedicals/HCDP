"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  CHECKLIST_WIZARD,
  FIELD_SCHEMAS,
  STAFF_WIZARD,
  TASK_WIZARD,
  createRedirect,
  moduleLabel,
} from "@/lib/forms/schemas";
import { defaultsFromFields, SchemaForm } from "@/components/forms/SchemaForm";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { usePortal } from "@/lib/portal-context";
import { ALL_LOCATIONS_ID } from "@/lib/types";

type CreateTarget =
  | { kind: "schema"; moduleKey: string }
  | { kind: "checklist-wizard" }
  | { kind: "staff-wizard" }
  | { kind: "task-wizard" }
  | null;

interface CreateFormContextValue {
  openCreate: (moduleKey: string) => void;
  openChecklistWizard: () => void;
  openStaffWizard: () => void;
  openTaskWizard: () => void;
}

const CreateFormContext = createContext<CreateFormContextValue | null>(null);

export function useCreateForm() {
  const ctx = useContext(CreateFormContext);
  if (!ctx) throw new Error("useCreateForm must be used within CreateFormProvider");
  return ctx;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function CreateFormProvider({ children }: { children: React.ReactNode }) {
  const {
    locations,
    setLocations,
    activeLocationId,
    pushToast,
    records,
    setRecords,
    setTasks,
  } = usePortal();
  const [target, setTarget] = useState<CreateTarget>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});

  const staff = records.staff || [];
  const doctors = records.doctors || [];

  const openCreate = useCallback(
    (moduleKey: string) => {
      const redirect = createRedirect(moduleKey);
      if (redirect === "checklist") {
        setValues(defaultsFromFields(CHECKLIST_WIZARD.fields));
        setTarget({ kind: "checklist-wizard" });
        return;
      }
      if (redirect === "staff") {
        setValues(defaultsFromFields(STAFF_WIZARD.fields));
        setTarget({ kind: "staff-wizard" });
        return;
      }
      if (redirect === "task") {
        setValues(defaultsFromFields(TASK_WIZARD.fields));
        setTarget({ kind: "task-wizard" });
        return;
      }
      if (redirect === "schema") {
        setValues(defaultsFromFields(FIELD_SCHEMAS[moduleKey]));
        setTarget({ kind: "schema", moduleKey });
        return;
      }
      pushToast(`No HTML form schema found for ${moduleKey}.`, "warn");
    },
    [pushToast]
  );

  const openChecklistWizard = useCallback(() => openCreate("checklists"), [openCreate]);
  const openStaffWizard = useCallback(() => openCreate("staff"), [openCreate]);
  const openTaskWizard = useCallback(() => openCreate("tasks"), [openCreate]);

  const onChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const close = useCallback(() => {
    setTarget(null);
    setValues({});
  }, []);

  const saveSchemaRecord = useCallback(() => {
    if (!target || target.kind !== "schema") return;
    const fields = FIELD_SCHEMAS[target.moduleKey] || [];
    for (const field of fields) {
      if (field.required && !String(values[field.name] ?? "").trim()) {
        pushToast(`${field.label} is required.`, "danger");
        return;
      }
    }

    const now = new Date().toISOString();
    const record = {
      id: uid(target.moduleKey),
      createdAt: now,
      updatedAt: now,
      ...values,
    };

    if (target.moduleKey === "locations") {
      const loc = {
        id: `loc_${String(values.shortName || values.name || "new")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "")}_${Date.now().toString(36)}`,
        name: String(values.name || ""),
        shortName: String(values.shortName || values.name || "Clinic"),
        code: String(values.shortName || "NEW").slice(0, 3).toUpperCase(),
        phone: String(values.phone || ""),
        email: String(values.email || ""),
        address: String(values.address || "Address not set"),
        manager: String(values.manager || "Unassigned"),
        status: (String(values.status || "Active") === "Active"
          ? "Active"
          : "Paused") as "Active" | "Paused" | "Closed",
        users: 0,
        doctors: 0,
        health: "Amber" as const,
        healthScore: 70,
        healthReasons: ["Newly created from HTML location form"],
      };
      setLocations((prev) => [...prev, loc]);
      pushToast(`${loc.name} created.`, "success");
      close();
      return;
    }

    setRecords((prev) => ({
      ...prev,
      [target.moduleKey]: [record, ...(prev[target.moduleKey] || [])],
    }));
    pushToast(`${moduleLabel(target.moduleKey)} saved.`, "success");
    close();
  }, [target, values, pushToast, setLocations, setRecords, close]);

  const saveTaskWizard = useCallback(() => {
    const department = String(values.department || "").trim();
    const assignedTo = String(values.assignedTo || "").trim();
    const taskTopic = String(values.taskTopic || "").trim();
    if (!department) {
      pushToast("Department is required", "danger");
      return;
    }
    if (!assignedTo) {
      pushToast("Assign To is required", "danger");
      return;
    }
    if (!taskTopic) {
      pushToast("Task Topic is required", "danger");
      return;
    }
    const now = new Date().toISOString();
    const important = Boolean(values.importantTask);
    const data = {
      id: uid("tasks"),
      createdAt: now,
      updatedAt: now,
      department,
      category: department,
      assignedTo,
      taskTopic,
      title: taskTopic,
      completionDate: String(values.completionDate || ""),
      dueDate: String(values.completionDate || ""),
      taskDescription: String(values.taskDescription || ""),
      description: String(values.taskDescription || ""),
      importantTask: important,
      reminderEmail: Boolean(values.reminderEmail),
      reminderSms: Boolean(values.reminderSms),
      priority: important ? "P2 Urgent" : "P3 Routine",
      location: activeLocationId === ALL_LOCATIONS_ID ? "" : activeLocationId,
      status: "Pending",
    };
    setTasks((prev) => [
      {
        id: data.id,
        title: taskTopic,
        assignee: assignedTo,
        locationId:
          activeLocationId !== ALL_LOCATIONS_ID
            ? activeLocationId
            : locations[0]?.id || "",
        status: "Open",
        due: String(values.completionDate || ""),
        priority: important ? "High" : "Medium",
        type: "Task",
      },
      ...prev,
    ]);
    setRecords((prev) => ({
      ...prev,
      tasks: [data, ...(prev.tasks || [])],
    }));
    pushToast("Task created", "success");
    close();
  }, [values, activeLocationId, locations, setTasks, setRecords, pushToast, close]);

  const saveChecklistWizard = useCallback(() => {
    const name = String(values.name || "").trim();
    if (!name) {
      pushToast("Checklist title is required", "danger");
      return;
    }
    const items = String(values.items || "")
      .split(/\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    const now = new Date().toISOString();
    const rec = {
      id: uid("check"),
      createdAt: now,
      updatedAt: now,
      name,
      description: String(values.description || ""),
      frequency: String(values.frequency || "Daily"),
      timeOfDay: String(values.timeOfDay || ""),
      type: String(values.workflowScope || "General"),
      workflowScope: String(values.workflowScope || "General"),
      assignment: String(values.assignment || "Group"),
      department: String(values.department || ""),
      responsibleRole: String(values.responsibleRole || ""),
      items: items.length ? items : ["Review and complete checklist item"],
      instructions: String(values.instructions || ""),
      managerReviewRequired: Boolean(values.managerReviewRequired),
      managerReviewStatus: "Not submitted",
      status: values.publishNow ? "Active" : "Draft",
      location: activeLocationId === ALL_LOCATIONS_ID ? "" : activeLocationId,
      sourceDocument: "Created in portal",
      assignedTo: String(values.responsibleRole || "Team"),
    };
    setRecords((prev) => ({
      ...prev,
      checklists: [rec, ...(prev.checklists || [])],
    }));
    pushToast("Checklist published", "success");
    close();
  }, [values, activeLocationId, setRecords, pushToast, close]);

  const saveStaffWizard = useCallback(() => {
    const first = String(values.firstName || "").trim();
    const last = String(values.lastName || "").trim();
    const email = String(values.email || "").trim();
    if (!first || !last || !email) {
      pushToast("First name, last name and email are required", "danger");
      return;
    }
    const now = new Date().toISOString();
    const rec = {
      id: uid("staff"),
      createdAt: now,
      updatedAt: now,
      name: `${first} ${last}`.trim(),
      firstName: first,
      lastName: last,
      email,
      phone: String(values.phone || ""),
      contactNo: String(values.phone || ""),
      department: String(values.department || ""),
      role: String(values.role || ""),
      designation: String(values.role || ""),
      sourceDesignation: String(values.role || ""),
      employmentType: "Full-time",
      address: String(values.address || ""),
      emergencyContact: String(values.emergencyContact || ""),
      emergencyRelationship: String(values.emergencyRelationship || ""),
      emergencyPhone: String(values.emergencyPhone || ""),
      emergencyEmail: String(values.emergencyEmail || ""),
      nextOfKin: String(values.nextOfKin || ""),
      nextOfKinPhone: String(values.nextOfKinPhone || ""),
      dietaryRestrictions: String(values.dietaryRestrictions || ""),
      workPreferences: String(values.workPreferences || ""),
      communicationPreference: String(values.communicationPreference || "Email"),
      birthday: String(values.birthday || ""),
      personalNotes: String(values.personalNotes || ""),
      locations: Array.isArray(values.locations) ? values.locations : [],
      status: "Pending",
      maxWeeklyHours: 40,
      bankReady: false,
      immunisationStatus: "Not set",
    };
    setRecords((prev) => ({
      ...prev,
      staff: [rec, ...(prev.staff || [])],
    }));
    pushToast("Staff profile saved", "success");
    close();
  }, [values, setRecords, pushToast, close]);

  const api = useMemo(
    () => ({ openCreate, openChecklistWizard, openStaffWizard, openTaskWizard }),
    [openCreate, openChecklistWizard, openStaffWizard, openTaskWizard]
  );

  const schemaOpen = target?.kind === "schema";
  const checklistOpen = target?.kind === "checklist-wizard";
  const staffOpen = target?.kind === "staff-wizard";
  const taskOpen = target?.kind === "task-wizard";
  const schemaKey = target?.kind === "schema" ? target.moduleKey : "";

  const formPeopleProps = { staff, doctors };

  return (
    <CreateFormContext.Provider value={api}>
      {children}

      <Drawer
        open={schemaOpen}
        title={`Create ${moduleLabel(schemaKey)}`}
        subtitle="Form fields copied exactly from HTML FIELD_SCHEMAS (including all patches)."
        onClose={close}
        footer={
          <>
            <Button variant="line" onClick={close}>
              Cancel
            </Button>
            <Button variant="teal" onClick={saveSchemaRecord}>
              Save
            </Button>
          </>
        }
      >
        {schemaOpen ? (
          <SchemaForm
            fields={FIELD_SCHEMAS[schemaKey] || []}
            values={values}
            onChange={onChange}
            locations={locations}
            activeLocationId={activeLocationId}
            {...formPeopleProps}
          />
        ) : null}
      </Drawer>

      <Modal
        open={taskOpen}
        title={TASK_WIZARD.title}
        onClose={close}
        footer={
          <>
            <Button
              variant="line"
              onClick={() => setValues(defaultsFromFields(TASK_WIZARD.fields))}
            >
              Clear
            </Button>
            <Button variant="line" onClick={close}>
              Cancel
            </Button>
            <Button variant="teal" onClick={saveTaskWizard}>
              {TASK_WIZARD.submitLabel}
            </Button>
          </>
        }
      >
        <p className="mb-4 mt-0 text-sm text-[#526479]">
          Exact HTML task create modal: Department → Assign To → Topic → Date → Reminders.
        </p>
        <SchemaForm
          fields={TASK_WIZARD.fields}
          values={values}
          onChange={onChange}
          locations={locations}
          activeLocationId={activeLocationId}
          {...formPeopleProps}
        />
      </Modal>

      <Modal
        open={checklistOpen}
        title="Create Checklist"
        onClose={close}
        footer={
          <>
            <Button variant="line" onClick={close}>
              Cancel
            </Button>
            <Button variant="teal" onClick={saveChecklistWizard}>
              Publish Checklist
            </Button>
          </>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {CHECKLIST_WIZARD.tabs.map((tab) => (
            <span
              key={tab}
              className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-extrabold text-[#1d4ed8]"
            >
              {tab}
            </span>
          ))}
        </div>
        <SchemaForm
          fields={CHECKLIST_WIZARD.fields}
          values={values}
          onChange={onChange}
          locations={locations}
          activeLocationId={activeLocationId}
          {...formPeopleProps}
        />
      </Modal>

      <Modal
        open={staffOpen}
        title="Add Staff"
        onClose={close}
        footer={
          <>
            <Button variant="line" onClick={close}>
              Cancel
            </Button>
            <Button variant="teal" onClick={saveStaffWizard}>
              Add & Send Invite
            </Button>
          </>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {STAFF_WIZARD.tabs.map((tab) => (
            <span
              key={tab}
              className="rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-extrabold text-[#7c3aed]"
            >
              {tab}
            </span>
          ))}
        </div>
        <SchemaForm
          fields={STAFF_WIZARD.fields}
          values={values}
          onChange={onChange}
          locations={locations}
          activeLocationId={activeLocationId}
          {...formPeopleProps}
        />
      </Modal>
    </CreateFormContext.Provider>
  );
}

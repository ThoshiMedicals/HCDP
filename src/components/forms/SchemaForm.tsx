"use client";

import type { FieldSchema } from "@/lib/forms/schemas";
import type { Location } from "@/lib/types";
import { ALL_LOCATIONS_ID } from "@/lib/types";
import { cn } from "@/lib/cn";
import taskDepartments from "@/lib/extracted/task-departments.json";
import deptRoleMap from "@/lib/extracted/dept-role-map.json";

const inputClass =
  "min-h-10 w-full rounded-xl border border-[#dfe6ee] bg-white px-3 py-2.5 text-sm font-medium text-[#24364a] outline-none transition focus:border-[#93c5fd] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)]";

const DEPT_ROLE_MAP = deptRoleMap as Record<string, string[]>;
const TASK_DEPARTMENTS = taskDepartments as string[];

function peopleForDepartment(
  dept: string,
  staff: Array<Record<string, unknown>>,
  doctors: Array<Record<string, unknown>>
): string[] {
  if (!dept) return [];
  if (dept === "Doctors") {
    return doctors
      .filter((d) => d.status !== "Archived")
      .map((d) => String(d.name || ""))
      .filter(Boolean)
      .sort();
  }
  const roles = DEPT_ROLE_MAP[dept] || [];
  let rows = staff.filter((s) => s.status !== "Archived");
  if (roles.length) {
    rows = rows.filter((s) =>
      roles.some(
        (role) =>
          String(s.role || s.sourceDesignation || "")
            .toLowerCase()
            .includes(role.toLowerCase()) ||
          String(s.sourceDesignation || "")
            .toLowerCase()
            .includes(role.toLowerCase())
      )
    );
  }
  return rows
    .map((s) => String(s.name || ""))
    .filter(Boolean)
    .sort();
}

export function SchemaField({
  field,
  value,
  onChange,
  locations,
  activeLocationId,
  formValues,
  staff = [],
  doctors = [],
}: {
  field: FieldSchema;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  locations: Location[];
  activeLocationId: string;
  formValues?: Record<string, unknown>;
  staff?: Array<Record<string, unknown>>;
  doctors?: Array<Record<string, unknown>>;
}) {
  const label = (
    <label className="text-xs font-bold text-[#54657a]">
      {field.label}
      {field.required ? <span className="text-[var(--danger)]"> *</span> : null}
    </label>
  );

  if (field.type === "checkbox") {
    return (
      <label
        className={cn(
          "flex items-center gap-2 text-sm font-semibold text-[#31445a]",
          field.full && "md:col-span-2"
        )}
      >
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className={cn("grid gap-1.5", field.full && "md:col-span-2")}>
        {label}
        <textarea
          className={cn(inputClass, "min-h-24 resize-y")}
          value={String(value ?? "")}
          placeholder={field.placeholder || ""}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
        {field.hint ? <div className="text-xs text-[var(--muted)]">{field.hint}</div> : null}
      </div>
    );
  }

  if (field.type === "select") {
    const options =
      field.name === "department" && (!field.options || !field.options.length)
        ? TASK_DEPARTMENTS
        : field.options || [];
    return (
      <div className={cn("grid gap-1.5", field.full && "md:col-span-2")}>
        {label}
        <select
          className={inputClass}
          value={String(value ?? field.default ?? options[0] ?? "")}
          onChange={(e) => {
            onChange(field.name, e.target.value);
            if (field.name === "department") onChange("assignedTo", "");
          }}
        >
          {field.required ? <option value="">Select {field.label.toLowerCase()}</option> : null}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "personAssignment") {
    const dept = String(formValues?.department || "");
    const people = peopleForDepartment(dept, staff, doctors);
    const groupOption = dept ? `All ${dept}` : "";
    const options = dept
      ? [groupOption, ...people].filter(Boolean)
      : [];
    return (
      <div className={cn("grid gap-1.5", field.full && "md:col-span-2")}>
        {label}
        <select
          className={inputClass}
          value={String(value ?? "")}
          disabled={!dept}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">{dept ? "Select assignee" : "Select department first"}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "location") {
    return (
      <div className={cn("grid gap-1.5", field.full && "md:col-span-2")}>
        {label}
        <select
          className={inputClass}
          value={String(
            value ||
              (activeLocationId !== ALL_LOCATIONS_ID ? activeLocationId : "")
          )}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <option value="">Select location</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "locationMulti") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className={cn("grid gap-1.5", field.full && "md:col-span-2")}>
        {label}
        <div className="grid gap-2 sm:grid-cols-2">
          {locations.map((loc) => {
            const checked = selected.includes(loc.id);
            return (
              <label
                key={loc.id}
                className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, loc.id]
                      : selected.filter((id) => id !== loc.id);
                    onChange(field.name, next);
                  }}
                />
                {loc.shortName}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  const inputType =
    field.type === "email" || field.type === "date" || field.type === "number"
      ? field.type
      : "text";

  return (
    <div className={cn("grid gap-1.5", field.full && "md:col-span-2")}>
      {label}
      <input
        className={inputClass}
        type={inputType}
        value={String(value ?? "")}
        placeholder={field.placeholder || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
      {field.hint ? <div className="text-xs text-[var(--muted)]">{field.hint}</div> : null}
    </div>
  );
}

export function SchemaForm({
  fields,
  values,
  onChange,
  locations,
  activeLocationId,
  staff,
  doctors,
}: {
  fields: FieldSchema[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  locations: Location[];
  activeLocationId: string;
  staff?: Array<Record<string, unknown>>;
  doctors?: Array<Record<string, unknown>>;
}) {
  return (
    <div className="form-grid grid gap-3.5 md:grid-cols-2">
      {fields.map((field) => (
        <SchemaField
          key={field.name}
          field={field}
          value={values[field.name]}
          onChange={onChange}
          locations={locations}
          activeLocationId={activeLocationId}
          formValues={values}
          staff={staff}
          doctors={doctors}
        />
      ))}
    </div>
  );
}

export function defaultsFromFields(fields: FieldSchema[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      values[field.name] = field.default ?? false;
    } else if (field.type === "locationMulti") {
      values[field.name] = [];
    } else if (field.default !== undefined) {
      values[field.name] = field.default;
    } else if (field.type === "select" && field.options?.length) {
      values[field.name] = field.required ? "" : field.options[0];
    } else {
      values[field.name] = "";
    }
  }
  return values;
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, inputClass } from "./cc-ui";
import type {
  ActionCategory,
  Announcement,
  CommandAction,
  DashboardSectionLayout,
  HolidayHandling,
  PriorityLevel,
  RecurrenceFrequency,
  RecurringSchedule,
  ReportSchedule,
} from "@/lib/command-centre/types";
import type { Location } from "@/lib/types";
import { CATEGORY_LIST, DEFAULT_SECTIONS } from "@/lib/command-centre/mock-data";
import {
  computeDraftMissing,
  discardActionDraft,
  loadActionDrafts,
  appendAudit,
  type ActionDraft,
  upsertActionDraft,
} from "@/lib/command-centre/action-repository";
import type { SavedLayout } from "@/lib/command-centre/storage";
import { readTemplates, readRecurring, writeRecurring, writeReportSchedules, readReportSchedules } from "@/lib/command-centre/cc-extras";
import type { EnrichSearchResult } from "@/lib/command-centre/search";
import type { SearchNavigate } from "@/lib/command-centre/search";

// Prototype labels (Emergency / Important / Information / Positive Update) mapped onto the
// existing Announcement["type"] values so downstream state/logic is unchanged.
const ANNOUNCEMENT_TYPE_OPTIONS: Array<{ value: Announcement["type"]; label: string }> = [
  { value: "Emergency", label: "Emergency" },
  { value: "Urgent", label: "Important" },
  { value: "Info", label: "Information" },
  { value: "Normal", label: "Positive Update" },
];

export function PasswordConfirmModal({
  open,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [password, setPassword] = useState("");
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="teal"
            disabled={password.length < 4}
            onClick={() => {
              onConfirm();
              setPassword("");
            }}
          >
            Confirm with password
          </Button>
        </>
      }
    >
      <div className="cc-demo-banner mb-3">
        Demonstration confirmation only — not secure authentication. A real login service is required before production
        use.
      </div>
      <p className="m-0 mb-3 text-sm text-[var(--cc-muted)]">
        High-risk decision or sensitive export. Re-enter your demonstration password to continue.
      </p>
      <Field label="Login password">
        <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
    </Modal>
  );
}

export function CreateActionModal({
  open,
  locations,
  onClose,
  onCreate,
  onContinue,
  pushToast,
}: {
  open: boolean;
  locations: Location[];
  onClose: () => void;
  onCreate: (actions: CommandAction[], opts?: { assign?: boolean; monitor?: boolean }) => void;
  onContinue?: (draftId: string) => void;
  pushToast?: (msg: string, tone?: "success" | "warn" | "default") => void;
}) {
  const [draftId, setDraftId] = useState(() => `draft-${Date.now()}`);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("Attention Required");
  const [category, setCategory] = useState<ActionCategory>("Clinic Operations");
  const [clinicIds, setClinicIds] = useState<string[]>([]);
  const [ownerType, setOwnerType] = useState<"person" | "role" | "team">("person");
  const [owner, setOwner] = useState("Neil");
  const [template, setTemplate] = useState("None");
  const [recurring, setRecurring] = useState("None");
  const [details, setDetails] = useState("");
  const [due, setDue] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().slice(0, 16);
  });
  const [draftMeta, setDraftMeta] = useState<{ createdAt: string; lastEdited: string } | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const templates = readTemplates();

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      const drafts = loadActionDrafts();
      const latest = drafts[0];
      if (latest) {
        setDraftId(latest.id);
        setTitle(latest.title);
        setPriority(latest.priority as PriorityLevel);
        setCategory(latest.category as ActionCategory);
        setClinicIds(latest.clinicIds);
        setOwnerType(latest.ownerType);
        setOwner(latest.owner);
        setTemplate(latest.template);
        setRecurring(latest.recurring);
        setDetails(latest.details);
        setDue(latest.due);
        setDraftMeta({ createdAt: latest.createdAt, lastEdited: latest.lastEdited });
      }
    });
  }, [open]);

  function toggleClinic(id: string) {
    setClinicIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function buildDraft(): ActionDraft {
    const now = new Date().toISOString();
    const d: ActionDraft = {
      id: draftId,
      title,
      priority,
      category,
      clinicIds,
      ownerType,
      owner,
      template,
      recurring,
      details,
      due,
      createdBy: "Neil",
      createdAt: draftMeta?.createdAt ?? now,
      lastEdited: now,
      monitoringNow: false,
      assignment: `${ownerType}: ${owner}`,
      missing: [],
    };
    d.missing = computeDraftMissing(d);
    return d;
  }

  function saveDraft() {
    const d = buildDraft();
    upsertActionDraft(d);
    setDraftMeta({ createdAt: d.createdAt, lastEdited: d.lastEdited });
    pushToast?.("Action draft saved locally.", "success");
  }

  function applyTemplate(name: string) {
    setTemplate(name);
    const t = templates.find((x) => x.name === name);
    if (!t) return;
    setPriority(t.priority);
    setCategory(t.category);
    setOwnerType(t.ownerType);
    setOwner(t.owner);
    setDetails(t.details);
  }

  function submit(opts?: { assign?: boolean; monitor?: boolean }) {
    if (!title.trim()) return;
    const targets = clinicIds.length ? clinicIds : ["all"];
    const base = Date.now();
    const created: CommandAction[] = targets.map((loc, i) => {
      const ref = `ACT-2026-${String(1280 + (base % 1000) + i).padStart(6, "0")}`;
      return {
        id: ref,
        reference: ref,
        linkedReferences:
          targets.length > 1
            ? targets
                .map((_, j) => `ACT-2026-${String(1280 + (base % 1000) + j).padStart(6, "0")}`)
                .filter((r) => r !== ref)
            : [],
        priority,
        title: title.trim(),
        locationId: loc,
        category,
        sourceModule: "Command Centre",
        owner: `${ownerType}: ${owner}`,
        due: new Date(due || Date.now() + 86400000).toISOString(),
        stage: opts?.assign ? "Assigned" : "Submitted",
        reminders:
          priority === "Emergency"
            ? "Emergency — daily"
            : priority === "Urgent"
              ? "Urgent — every two days"
              : "Attention Required — weekly",
        escalation: "Responsible User",
        latestUpdate: "Created from Command Centre",
        attachments: 0,
        summary: details.slice(0, 120) || title,
        details: details || title,
        comments: [],
        timeline: [
          {
            id: `t-${base}-${i}`,
            at: new Date().toISOString(),
            actor: "Neil",
            event: `Created${template !== "None" ? ` from template ${template}` : ""}${
              recurring !== "None" ? ` · Recurring ${recurring}` : ""
            }${opts?.monitor ? " · Monitoring started" : ""}`,
          },
        ],
        relatedActions: [],
        monitoringStarted: opts?.monitor,
        searchable: true,
      };
    });
    discardActionDraft(draftId);
    onCreate(created, opts);
    setTitle("");
    setDetails("");
    setDraftId(`draft-${Date.now()}`);
    setDraftMeta(null);
    onClose();
  }

  const missing = computeDraftMissing(buildDraft());

  return (
    <>
      <Modal
        open={open}
        title="Create Action"
        onClose={onClose}
        footer={
          <>
            <Button variant="line" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="line" onClick={() => setShowDiscard(true)}>
              Discard
            </Button>
            <Button variant="line" onClick={saveDraft}>
              Save Draft
            </Button>
            <Button variant="soft" onClick={() => onContinue?.(draftId)}>
              Continue later
            </Button>
            <Button variant="line" onClick={() => submit()}>
              Submit
            </Button>
            <Button variant="soft" onClick={() => submit({ assign: true })}>
              Submit and Assign
            </Button>
            <Button variant="teal" onClick={() => submit({ assign: true, monitor: true })}>
              Start Monitoring Now
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          {draftMeta ? (
            <p className="m-0 text-[length:var(--type-control)] text-[var(--cc-muted)]">
              Draft saved · Created {new Date(draftMeta.createdAt).toLocaleString("en-AU")} · Last edited{" "}
              {new Date(draftMeta.lastEdited).toLocaleString("en-AU")}
              {missing.length ? ` · Missing: ${missing.join(", ")}` : ""}
            </p>
          ) : null}
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Priority">
              <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)}>
                {["Emergency", "Urgent", "Attention Required", "Routine"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ActionCategory)}>
                {CATEGORY_LIST.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Clinics (several clinics default to separate linked actions)">
            <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--cc-card-line)] p-2">
              {locations.map((l) => (
                <label key={l.id} className="flex items-center gap-1 text-xs font-semibold">
                  <input type="checkbox" checked={clinicIds.includes(l.id)} onChange={() => toggleClinic(l.id)} />
                  {l.shortName}
                </label>
              ))}
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Assign to">
              <select className={inputClass} value={ownerType} onChange={(e) => setOwnerType(e.target.value as typeof ownerType)}>
                <option value="person">One person</option>
                <option value="role">Role</option>
                <option value="team">Team</option>
              </select>
            </Field>
            <Field label="Name / role / team">
              <input className={inputClass} value={owner} onChange={(e) => setOwner(e.target.value)} />
            </Field>
            <Field label="Template">
              <select
                className={inputClass}
                value={template}
                onChange={(e) => applyTemplate(e.target.value)}
              >
                <option>None</option>
                {templates.filter((t) => !t.archived).map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Due date / time">
            <input className={inputClass} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field label="Recurring">
            <select className={inputClass} value={recurring} onChange={(e) => setRecurring(e.target.value)}>
              {["None", "Daily", "Weekdays", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Yearly", "Custom"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <p className="m-0 text-[length:var(--type-control)] text-[var(--cc-muted)]">
            Public holidays default to next working day. Next occurrence is created even if the previous is incomplete.
            Team members are not required to Accept Responsibility.
          </p>
          <Field label="Details">
            <textarea className={inputClass} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Field>
        </div>
      </Modal>
      <Modal
        open={showDiscard}
        title="Discard draft?"
        onClose={() => setShowDiscard(false)}
        footer={
          <>
            <Button variant="line" onClick={() => setShowDiscard(false)}>
              Keep editing
            </Button>
            <Button
              variant="warn"
              onClick={() => {
                discardActionDraft(draftId);
                setShowDiscard(false);
                setTitle("");
                setDetails("");
                setDraftMeta(null);
                onClose();
                pushToast?.("Draft discarded.", "default");
              }}
            >
              Discard draft
            </Button>
          </>
        }
      >
        <p className="m-0 text-sm">This removes the locally saved draft. Submitted actions are not affected.</p>
      </Modal>
    </>
  );
}

export function PublishAnnouncementModal({
  open,
  locations,
  onClose,
  onPublish,
  onPreview,
  pushLocalDraft,
}: {
  open: boolean;
  locations: Location[];
  onClose: () => void;
  onPublish: (a: Announcement) => void;
  onPreview?: (draft: { title: string; type: Announcement["type"]; message: string }) => void;
  pushLocalDraft?: (title: string, message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Announcement["type"]>("Info");
  const [message, setMessage] = useState("");
  const [requireAck, setRequireAck] = useState(true);
  const [channels, setChannels] = useState<Announcement["channels"]>(["Dashboard", "Email"]);
  const [roles, setRoles] = useState("Owner / Director, Practice Manager, Reception");
  const [clinicMode, setClinicMode] = useState<"all" | "selected">("all");
  const [clinicIds, setClinicIds] = useState<string[]>([]);
  const [publishAt, setPublishAt] = useState("2026-07-16T14:00");
  const [endAt, setEndAt] = useState("");
  const [related, setRelated] = useState("");

  function toggleChannel(c: Announcement["channels"][number]) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function buildAnnouncement(when: "now" | "schedule"): Announcement | null {
    if (!title.trim() || !message.trim()) return null;
    const clinics = clinicMode === "all" || !clinicIds.length ? ["all"] : clinicIds;
    return {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      type,
      message: message.trim(),
      clinics,
      roles: roles.split(",").map((r) => r.trim()).filter(Boolean),
      publishAt:
        when === "now" ? new Date().toISOString() : new Date(publishAt || Date.now()).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      requireAck,
      channels,
      attachments: related.trim() ? 1 : 0,
      relatedActionId: related.trim() || undefined,
      readership: { read: 0, total: 45 },
      delivery: {
        delivered: when === "now" && channels.includes("Dashboard") ? 45 : 0,
        total: 45,
      },
      acknowledgements: { acked: 0, total: requireAck ? 18 : 0 },
    };
  }

  function reset() {
    setTitle("");
    setMessage("");
    setRelated("");
  }

  return (
    <Modal
      open={open}
      title="Publish Announcement"
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="line"
            onClick={() => {
              pushLocalDraft?.(title, message);
            }}
          >
            Save Draft
          </Button>
          <Button variant="soft" onClick={() => onPreview?.({ title, type, message })}>
            Preview
          </Button>
          <Button
            variant="line"
            onClick={() => {
              const a = buildAnnouncement("schedule");
              if (!a) return;
              onPublish(a);
              reset();
              onClose();
            }}
          >
            Schedule
          </Button>
          <Button
            variant="teal"
            onClick={() => {
              const a = buildAnnouncement("now");
              if (!a) return;
              onPublish(a);
              reset();
              onClose();
            }}
          >
            Publish Now
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Type">
          <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as Announcement["type"])}>
            {ANNOUNCEMENT_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Message">
          <textarea className={inputClass} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </Field>
        <Field label="Clinics">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={clinicMode === "all"}
                onChange={() => setClinicMode("all")}
              />
              All clinics
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                checked={clinicMode === "selected"}
                onChange={() => setClinicMode("selected")}
              />
              Selected clinics
            </label>
          </div>
          {clinicMode === "selected" ? (
            <div className="mt-2 grid max-h-32 gap-1 overflow-auto sm:grid-cols-2">
              {locations.map((l) => (
                <label key={l.id} className="flex items-center gap-1 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={clinicIds.includes(l.id)}
                    onChange={() =>
                      setClinicIds((prev) =>
                        prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id]
                      )
                    }
                  />
                  {l.shortName}
                </label>
              ))}
            </div>
          ) : null}
        </Field>
        <Field label="Roles affected">
          <input className={inputClass} value={roles} onChange={(e) => setRoles(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Publish time">
            <input
              className={inputClass}
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
            />
          </Field>
          <Field label="End time">
            <input className={inputClass} type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={requireAck} onChange={(e) => setRequireAck(e.target.checked)} />
          Acknowledgement required
        </label>
        <div className="flex flex-wrap gap-3 text-sm font-semibold">
          {(["Dashboard", "Email", "SMS"] as const).map((c) => (
            <label key={c} className="flex items-center gap-1">
              <input type="checkbox" checked={channels.includes(c)} onChange={() => toggleChannel(c)} />
              {c}
            </label>
          ))}
        </div>
        <p className="m-0 text-[length:var(--type-control)] text-[var(--cc-muted)]">
          Dashboard delivery is demonstrated locally. Email and SMS are recorded as chosen channels only — no live
          message is sent without a future messaging backend.
        </p>
        <Field label="Attachments / related action">
          <input
            className={inputClass}
            placeholder="Optional attachment names or ACT reference"
            value={related}
            onChange={(e) => setRelated(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

export function CustomiseDashboardModal({
  open,
  sections,
  layouts,
  activeLayoutId,
  onClose,
  onChange,
  onSave,
  onSaveAsNew,
  onRestoreSaved,
  onRestoreDefault,
  onRenameLayout,
  onDuplicateLayout,
  onDeleteLayout,
  onSetDefaultLayout,
  onSelectLayout,
  unsaved,
}: {
  open: boolean;
  sections: DashboardSectionLayout[];
  layouts?: SavedLayout[];
  activeLayoutId?: string | null;
  onClose: () => void;
  onChange: (sections: DashboardSectionLayout[]) => void;
  onSave: () => void;
  onSaveAsNew?: () => void;
  onRestoreSaved?: () => void;
  onRestoreDefault?: () => void;
  onRenameLayout?: (id: string, name: string) => void;
  onDuplicateLayout?: (id: string) => void;
  onDeleteLayout?: (id: string) => void;
  onSetDefaultLayout?: (id: string) => void;
  onSelectLayout?: (id: string) => void;
  unsaved: boolean;
}) {
  const catalogIds = new Set(DEFAULT_SECTIONS.map((s) => s.id));
  const extraSections = sections.filter((s) => !catalogIds.has(s.id));

  function update(id: string, patch: Partial<DashboardSectionLayout>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function move(id: string, dir: -1 | 1) {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swap];
    onChange(
      sections.map((s) => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      })
    );
  }

  function addSection(catalogId: string) {
    const cat = DEFAULT_SECTIONS.find((s) => s.id === catalogId);
    if (!cat || sections.some((s) => s.id === catalogId)) return;
    const maxOrder = Math.max(...sections.map((s) => s.order), 0);
    onChange([...sections, { ...cat, order: maxOrder + 1 }]);
  }

  function removeSection(id: string) {
    if (id === "priority") return;
    onChange(sections.filter((s) => s.id !== id));
  }

  const missingFromLayout = DEFAULT_SECTIONS.filter((c) => !sections.some((s) => s.id === c.id));

  return (
    <Modal
      open={open}
      title="Customise Dashboard"
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel Changes
          </Button>
          <Button variant="line" onClick={onRestoreSaved} disabled={!unsaved}>
            Restore Last Saved
          </Button>
          <Button variant="line" onClick={onRestoreDefault}>
            Restore Role Default
          </Button>
          <Button variant="soft" onClick={onSaveAsNew}>
            Save as New Layout
          </Button>
          <Button variant="teal" onClick={onSave} disabled={!unsaved}>
            Save Layout
          </Button>
        </>
      }
    >
      {unsaved ? (
        <p className="cc-text-warn m-0 mb-3 text-xs font-bold">
          Unsaved changes — save before switching layouts or closing.
        </p>
      ) : null}
      {layouts?.length ? (
        <div className="mb-4">
          <div className="mb-2 text-[length:var(--type-control)] font-extrabold uppercase text-[var(--cc-muted)]">Saved layouts</div>
          <div className="grid max-h-40 gap-1 overflow-auto">
            {layouts.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--cc-card-line)] px-2 py-1.5"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-xs font-bold"
                  onClick={() => onSelectLayout?.(l.id)}
                >
                  {l.name}
                  {l.id === activeLayoutId ? " (active)" : ""}
                  {l.isDefault ? " · default" : ""}
                </button>
                <Button
                  small
                  variant="line"
                  onClick={() => {
                    const name = window.prompt("Rename layout", l.name);
                    if (name?.trim()) onRenameLayout?.(l.id, name.trim());
                  }}
                >
                  Rename
                </Button>
                <Button small variant="line" onClick={() => onDuplicateLayout?.(l.id)}>
                  Duplicate
                </Button>
                <Button small variant="line" onClick={() => onSetDefaultLayout?.(l.id)}>
                  Set default
                </Button>
                <Button
                  small
                  variant="warn"
                  onClick={() => {
                    if (window.confirm(`Delete layout “${l.name}”?`)) onDeleteLayout?.(l.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <p className="m-0 mb-3 text-sm text-[var(--cc-muted)]">
        Unlimited personal layouts. Changes apply only when Save Layout is selected. Critical emergency content cannot be
        permanently hidden.
      </p>
      {missingFromLayout.length ? (
        <div className="mb-3 flex flex-wrap gap-1">
          {missingFromLayout.map((c) => (
            <Button key={c.id} small variant="soft" onClick={() => addSection(c.id)}>
              + {c.label}
            </Button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2">
        {[...sections]
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] p-2.5">
              <strong className="min-w-[180px] flex-1 text-sm">{s.label}</strong>
              <label className="flex items-center gap-1 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={s.visible}
                  disabled={s.id === "priority"}
                  onChange={(e) => update(s.id, { visible: e.target.checked })}
                />
                Visible
              </label>
              <label className="flex items-center gap-1 text-xs font-semibold">
                <input type="checkbox" checked={s.collapsed} onChange={(e) => update(s.id, { collapsed: e.target.checked })} />
                Collapse
              </label>
              <select
                className="rounded-lg border border-[var(--line)] px-2 py-1 text-xs font-bold"
                value={s.size}
                onChange={(e) => update(s.id, { size: e.target.value as DashboardSectionLayout["size"] })}
              >
                <option>Small</option>
                <option>Medium</option>
                <option>Large</option>
              </select>
              <Button small variant="line" onClick={() => move(s.id, -1)}>
                Up
              </Button>
              <Button small variant="line" onClick={() => move(s.id, 1)}>
                Down
              </Button>
              {s.id !== "priority" && catalogIds.has(s.id) ? (
                <Button small variant="warn" onClick={() => removeSection(s.id)}>
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        {extraSections.length ? (
          <p className="m-0 text-[length:var(--type-control)] text-[var(--cc-muted)]">Custom sections: {extraSections.map((s) => s.label).join(", ")}</p>
        ) : null}
      </div>
    </Modal>
  );
}

export function ExportModal({
  open,
  onClose,
  onExport,
  onSchedule,
}: {
  open: boolean;
  onClose: () => void;
  onExport: (opts: { format: string; sensitive: boolean; sections: string[]; recipients: string; schedule?: string }) => void;
  onSchedule?: () => void;
}) {
  const [format, setFormat] = useState("PDF");
  const [sensitive, setSensitive] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("Weekly Monday 07:00");
  const [recipients, setRecipients] = useState("");
  const sectionOptions = [
    "Selected sections",
    "Clinics",
    "Periods",
    "Charts",
    "Actions",
    "Completed work",
    "Financial values",
    "AI briefing",
    "Confidential information",
  ] as const;
  const [sections, setSections] = useState<string[]>(
    sectionOptions.filter((x) => x !== "Confidential information")
  );

  function toggleSection(x: string) {
    setSections((prev) => (prev.includes(x) ? prev.filter((s) => s !== x) : [...prev, x]));
  }

  return (
    <Modal
      open={open}
      title="Export & Scheduled Reports"
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          {onSchedule ? (
            <Button variant="soft" onClick={onSchedule}>
              Open schedule form
            </Button>
          ) : null}
          <Button
            variant="teal"
            onClick={() =>
              onExport({
                format,
                sensitive,
                sections,
                recipients,
                schedule: schedule ? scheduleValue : undefined,
              })
            }
          >
            Export {format} (local demo)
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="cc-demo-banner">
          Exports are prepared locally for this demonstration. Email delivery and live document generation require a
          future backend connection.
        </div>
        <Field label="Format">
          <select className={inputClass} value={format} onChange={(e) => setFormat(e.target.value)}>
            <option>PDF</option>
            <option>Spreadsheet</option>
            <option>Print</option>
            <option>Email</option>
          </select>
        </Field>
        <div className="grid gap-1 text-sm font-semibold">
          {sectionOptions.map((x) => (
            <label key={x} className="flex items-center gap-2">
              <input type="checkbox" checked={sections.includes(x)} onChange={() => toggleSection(x)} />
              {x}
            </label>
          ))}
        </div>
        <Field label="Recipients">
          <input
            className={inputClass}
            placeholder="Internal and external email addresses"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
          Optional scheduled report (quick preset)
        </label>
        {schedule ? (
          <Field label="Schedule">
            <select className={inputClass} value={scheduleValue} onChange={(e) => setScheduleValue(e.target.value)}>
              <option>Daily 07:00</option>
              <option>Weekdays 07:00</option>
              <option>Weekly Monday 07:00</option>
              <option>Monthly 1st 07:00</option>
              <option>Month-end 18:00</option>
              <option>Quarterly</option>
            </select>
          </Field>
        ) : null}
        <label className="cc-text-warn flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
          Include confidential / sensitive financial information (password required)
        </label>
      </div>
    </Modal>
  );
}

export function ScheduleReportModal({
  open,
  onClose,
  reportName,
  locations,
  pushToast,
  editSchedule,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  reportName?: string;
  locations: Location[];
  pushToast: (msg: string, tone?: "success" | "warn" | "default") => void;
  editSchedule?: ReportSchedule | null;
  onSaved?: () => void;
}) {
  const report = editSchedule?.report ?? reportName ?? "Executive Operations Summary";
  const [recipient, setRecipient] = useState("");
  const [recipientType, setRecipientType] = useState<ReportSchedule["recipientType"]>("Internal");
  const [deliveryFormat, setDeliveryFormat] = useState<ReportSchedule["deliveryFormat"]>("PDF");
  const [cadence, setCadence] = useState<ReportSchedule["cadence"]>("Weekly");
  const [deliveryTime, setDeliveryTime] = useState("07:00");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [noEndDate, setNoEndDate] = useState(true);
  const [clinicIds, setClinicIds] = useState<string[]>([]);
  const [includeConfidential, setIncludeConfidential] = useState(false);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      if (editSchedule) {
        setRecipient(editSchedule.recipient);
        setRecipientType(editSchedule.recipientType);
        setDeliveryFormat(editSchedule.deliveryFormat);
        setCadence(editSchedule.cadence);
        setDeliveryTime(editSchedule.deliveryTime);
        setStartDate(editSchedule.startDate);
        setEndDate(editSchedule.endDate ?? "");
        setNoEndDate(editSchedule.noEndDate);
        setClinicIds(editSchedule.clinicIds.filter((id) => id !== "all"));
        setIncludeConfidential(editSchedule.includeConfidential);
      } else {
        setRecipient("");
        setRecipientType("Internal");
        setDeliveryFormat("PDF");
        setCadence("Weekly");
        setDeliveryTime("07:00");
        setStartDate(new Date().toISOString().slice(0, 10));
        setEndDate("");
        setNoEndDate(true);
        setClinicIds([]);
        setIncludeConfidential(false);
      }
    });
  }, [open, editSchedule]);

  function submit() {
    const schedule: ReportSchedule = {
      id: editSchedule?.id ?? `rs-${Date.now()}`,
      report,
      recipient,
      recipientType,
      deliveryFormat,
      cadence,
      deliveryTime,
      startDate,
      endDate: noEndDate ? undefined : endDate,
      noEndDate,
      clinicIds: clinicIds.length ? clinicIds : ["all"],
      includeConfidential,
      createdAt: editSchedule?.createdAt ?? new Date().toISOString(),
      paused: editSchedule?.paused,
    };
    const all = readReportSchedules();
    const next = editSchedule
      ? all.map((s) => (s.id === editSchedule.id ? schedule : s))
      : [schedule, ...all];
    writeReportSchedules(next);
    pushToast(
      editSchedule
        ? "Schedule updated locally — backend delivery connection required."
        : "Scheduled locally — backend delivery connection required.",
      "success"
    );
    onSaved?.();
    onClose();
  }

  return (
    <Modal
      open={open}
      title={editSchedule ? "Edit Report Schedule" : "Schedule Report"}
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="teal" onClick={submit} disabled={!recipient.trim()}>
            Save schedule (local)
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="cc-demo-banner text-[length:var(--type-control)]">
          Scheduled locally — backend delivery connection required for live email.
        </div>
        <Field label="Report">
          <input className={inputClass} value={report} readOnly />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Recipient">
            <input className={inputClass} value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </Field>
          <Field label="Recipient type">
            <select
              className={inputClass}
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as ReportSchedule["recipientType"])}
            >
              <option value="Internal">Internal</option>
              <option value="External">External</option>
              <option value="Role">Role</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Delivery format">
            <select
              className={inputClass}
              value={deliveryFormat}
              onChange={(e) => setDeliveryFormat(e.target.value as ReportSchedule["deliveryFormat"])}
            >
              <option value="PDF">PDF</option>
              <option value="Spreadsheet">Spreadsheet</option>
              <option value="Email">Email</option>
            </select>
          </Field>
          <Field label="Cadence">
            <select
              className={inputClass}
              value={cadence}
              onChange={(e) => setCadence(e.target.value as ReportSchedule["cadence"])}
            >
              {["Daily", "Weekdays", "Weekly", "Every Monday", "Monthly", "Month-end", "Quarterly", "Custom"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Delivery time">
            <input type="time" className={inputClass} value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
          </Field>
          <Field label="Start date">
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={noEndDate} onChange={(e) => setNoEndDate(e.target.checked)} />
          No end date
        </label>
        {!noEndDate ? (
          <Field label="End date">
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        ) : null}
        <Field label="Clinics">
          <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--cc-card-line)] p-2">
            {locations.map((l) => (
              <label key={l.id} className="flex items-center gap-1 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={clinicIds.includes(l.id)}
                  onChange={() =>
                    setClinicIds((prev) =>
                      prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id]
                    )
                  }
                />
                {l.shortName}
              </label>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={includeConfidential} onChange={(e) => setIncludeConfidential(e.target.checked)} />
          Include confidential financial information
        </label>
      </div>
    </Modal>
  );
}

export function RecurringTemplatesModal({
  open,
  onClose,
  locations,
  pushToast,
}: {
  open: boolean;
  onClose: () => void;
  locations: Location[];
  pushToast: (msg: string, tone?: "success" | "warn" | "default") => void;
}) {
  const [tab, setTab] = useState<"templates" | "recurring">("templates");
  const templates = readTemplates();
  const [recurring, setRecurring] = useState<RecurringSchedule[]>(() => readRecurring());
  const [freq, setFreq] = useState<RecurrenceFrequency>("Weekly");
  const [holidayHandling, setHolidayHandling] = useState<HolidayHandling>("Next Working Day");
  const [templateName, setTemplateName] = useState("Organisation · Opening follow-up");
  const [pauseReason, setPauseReason] = useState("");
  const [endReason, setEndReason] = useState("");

  function createRecurring() {
    const row: RecurringSchedule = {
      id: `rec-${Date.now()}`,
      templateName,
      frequency: freq,
      clinicIds: locations.map((l) => l.id),
      linkedPerClinic: true,
      ownerType: "role",
      owner: "Practice Manager",
      priority: "Attention Required",
      dueTime: "09:00",
      startDate: new Date().toISOString().slice(0, 10),
      noEndDate: true,
      reminder: "Attention Required — weekly",
      escalation: "Responsible User",
      finalApproval: false,
      createInAdvanceDays: 1,
      holidayHandling,
      status: "Active",
    };
    const next = [row, ...recurring];
    setRecurring(next);
    writeRecurring(next);
    pushToast("Recurring schedule saved locally.", "success");
  }

  function pauseSchedule(id: string) {
    if (!pauseReason.trim()) return;
    const next = recurring.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "Paused" as const,
            paused: {
              reason: pauseReason,
              pauseStart: new Date().toISOString(),
              plannedResume: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
              approver: "Neil",
            },
          }
        : r
    );
    setRecurring(next);
    writeRecurring(next);
    appendAudit({
      actionId: id,
      event: "Recurring schedule paused",
      user: "Neil",
      at: new Date().toISOString(),
      previousValue: "Active",
      newValue: "Paused",
      reason: pauseReason.trim(),
      approval: "Neil (demonstration)",
      evidence: "Evidence placeholder (local demonstration)",
    });
    setPauseReason("");
    pushToast("Recurring schedule paused.", "success");
  }

  function resumeSchedule(id: string) {
    const next = recurring.map((r) =>
      r.id === id ? { ...r, status: "Active" as const, paused: undefined } : r
    );
    setRecurring(next);
    writeRecurring(next);
    pushToast("Recurring schedule resumed.", "success");
  }

  function endSchedule(id: string) {
    if (!endReason.trim()) return;
    const next = recurring.map((r) =>
      r.id === id ? { ...r, status: "Ended" as const, ended: true, endDate: new Date().toISOString().slice(0, 10) } : r
    );
    setRecurring(next);
    writeRecurring(next);
    setEndReason("");
    pushToast("Recurring schedule ended.", "success");
  }

  return (
    <Modal
      open={open}
      title="Templates & Recurring Actions"
      onClose={onClose}
      footer={
        <Button variant="line" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="mb-3 flex gap-2">
        <Button small variant={tab === "templates" ? "teal" : "line"} onClick={() => setTab("templates")}>
          Template library
        </Button>
        <Button small variant={tab === "recurring" ? "teal" : "line"} onClick={() => setTab("recurring")}>
          Recurring schedules
        </Button>
      </div>
      {tab === "templates" ? (
        <div className="grid gap-2">
          {(["Organisation", "Personal"] as const).map((scope) => (
            <div key={scope}>
              <div className="mb-1 text-[length:var(--type-control)] font-extrabold uppercase text-[var(--cc-muted)]">{scope}</div>
              {templates
                .filter((t) => t.scope === scope && !t.archived)
                .map((t) => (
                  <div key={t.id} className="mb-2 rounded-xl border border-[var(--cc-card-line)] p-2.5 text-sm">
                    <strong>{t.name}</strong>
                    <p className="m-0 mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">
                      {t.priority} · {t.category} · {t.owner}
                    </p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="rounded-xl border border-[var(--cc-card-line)] p-3">
            <h4 className="m-0 text-sm font-extrabold">Create recurring</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Field label="Template">
                <select className={inputClass} value={templateName} onChange={(e) => setTemplateName(e.target.value)}>
                  {templates.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Frequency">
                <select className={inputClass} value={freq} onChange={(e) => setFreq(e.target.value as RecurrenceFrequency)}>
                  {(["Daily", "Weekdays", "Weekly", "Fortnightly", "Monthly", "Quarterly", "Yearly", "Custom"] as const).map(
                    (f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    )
                  )}
                </select>
              </Field>
              <Field label="Holiday handling">
                <select
                  className={inputClass}
                  value={holidayHandling}
                  onChange={(e) => setHolidayHandling(e.target.value as HolidayHandling)}
                >
                  <option value="Next Working Day">Next Working Day</option>
                  <option value="Previous Working Day">Previous Working Day</option>
                  <option value="Keep Original Date">Keep Original Date</option>
                  <option value="Skip Occurrence">Skip Occurrence</option>
                </select>
              </Field>
            </div>
            <Button small variant="teal" className="mt-2" onClick={createRecurring}>
              Save recurring schedule
            </Button>
          </div>
          {recurring.map((r) => (
            <div key={r.id} className="rounded-xl border border-[var(--cc-card-line)] p-3 text-sm">
              <strong>{r.templateName}</strong>
              <p className="m-0 text-[length:var(--type-control)] text-[var(--cc-muted)]">
                {r.frequency} · {r.status} · Holidays: {r.holidayHandling}
              </p>
              {r.status === "Active" ? (
                <div className="mt-2 grid gap-2">
                  <input
                    className={inputClass}
                    placeholder="Pause reason"
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                  />
                  <div className="flex gap-1">
                    <Button small variant="line" onClick={() => pauseSchedule(r.id)}>
                      Pause
                    </Button>
                    <input
                      className={inputClass}
                      placeholder="End reason"
                      value={endReason}
                      onChange={(e) => setEndReason(e.target.value)}
                    />
                    <Button small variant="warn" onClick={() => endSchedule(r.id)}>
                      End
                    </Button>
                  </div>
                </div>
              ) : r.status === "Paused" ? (
                <Button small variant="soft" className="mt-2" onClick={() => resumeSchedule(r.id)}>
                  Resume
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export function CustomRangeModal({
  open,
  onClose,
  start,
  end,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  start: string;
  end: string;
  onApply: (start: string, end: string) => void;
}) {
  const [s, setS] = useState(start);
  const [e, setE] = useState(end);
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setS(start);
      setE(end);
    });
  }, [start, end, open]);
  return (
    <Modal
      open={open}
      title="Custom Range"
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="teal" onClick={() => { onApply(s, e); onClose(); }}>
            Apply range
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start">
          <input type="date" className={inputClass} value={s} onChange={(ev) => setS(ev.target.value)} />
        </Field>
        <Field label="End">
          <input type="date" className={inputClass} value={e} onChange={(ev) => setE(ev.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

export function SearchResultsPanel({
  query,
  results,
  onNavigate,
  onClose,
}: {
  query: string;
  results: EnrichSearchResult[];
  onNavigate: (nav?: SearchNavigate) => void;
  onClose: () => void;
}) {
  if (!query.trim()) return null;
  const grouped = results.reduce<Record<string, EnrichSearchResult[]>>((acc, r) => {
    (acc[r.type] ||= []).push(r);
    return acc;
  }, {});
  return (
    <div className="cc-surface-info rounded-2xl border p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <strong>Search results for “{query}”</strong>
        <Button small variant="line" onClick={onClose}>
          Clear
        </Button>
      </div>
      <p className="m-0 mb-3 text-xs text-[var(--cc-muted)]">Whole permitted platform · plain-language questions supported</p>
      {Object.entries(grouped).map(([type, rows]) => (
        <div key={type} className="mb-3">
          <div className="cc-text-info mb-1 text-[length:var(--type-control)] font-extrabold uppercase">{type}</div>
          <div className="grid gap-1.5">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] px-3 py-2 text-left hover:bg-[var(--cc-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent,#2563eb)]"
                onClick={() => onNavigate(r.navigate)}
              >
                <strong className="block text-sm">{r.title}</strong>
                <span className="text-xs text-[var(--cc-muted)]">{r.snippet}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {!results.length ? <p className="text-sm text-[var(--cc-muted)]">No matches in permitted records.</p> : null}
    </div>
  );
}

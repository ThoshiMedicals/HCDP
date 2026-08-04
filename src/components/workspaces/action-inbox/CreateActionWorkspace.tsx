"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  findPossibleDuplicates,
  nextActionNumber,
} from "@/lib/action-inbox/repository";
import { CLINIC_OPTIONS, STAFF_DIRECTORY } from "@/lib/action-inbox/mock-data";
import type {
  ActionCategory,
  ActionDraft,
  ActionPriority,
  ActionTemplate,
  InboxAction,
  SensitivityLevel,
} from "@/lib/action-inbox/types";
import { DEMO_USER } from "@/lib/action-inbox/types";
import { nowIso, uid } from "@/lib/action-inbox/utils";

const inputCls =
  "w-full rounded-[10px] border border-[var(--line)] bg-[var(--card)] px-2.5 py-2 text-[13px] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]";

export function CreateActionWorkspace({
  drafts,
  templates,
  actions,
  onClose,
  onSaveDraft,
  onSubmit,
}: {
  drafts: ActionDraft[];
  templates: ActionTemplate[];
  actions: InboxAction[];
  onClose: () => void;
  onSaveDraft: (draft: ActionDraft) => void;
  onSubmit: (action: InboxAction) => void;
}) {
  const [step, setStep] = useState<"form" | "review">("form");
  const [showMore, setShowMore] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState("Approval");
  const [category, setCategory] = useState<ActionCategory>("Approval");
  const [clinicId, setClinicId] = useState(CLINIC_OPTIONS[0].id);
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState<ActionPriority>("Medium");
  const [dueAt, setDueAt] = useState("");
  const [team, setTeam] = useState("Clinic Operations");
  const [requester, setRequester] = useState(DEMO_USER.name);
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>("Standard");
  const [watchers, setWatchers] = useState("");
  const [sharedWith, setSharedWith] = useState("");
  const [isPrivateDraft, setIsPrivateDraft] = useState(true);

  // Approval
  const [approvalPurpose, setApprovalPurpose] = useState("");
  const [approver1, setApprover1] = useState("Alex Chen");
  const [approver2, setApprover2] = useState("Jordan Blake");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionEffect, setDecisionEffect] = useState("");
  const [evidenceRequired, setEvidenceRequired] = useState(true);

  // Exception
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [cause, setCause] = useState("");
  const [effect, setEffect] = useState("");
  const [recommended, setRecommended] = useState("");
  const [ackRequired, setAckRequired] = useState(false);
  const [verifyRequired, setVerifyRequired] = useState(false);

  // Reminder
  const [reminderType, setReminderType] = useState("One-time");
  const [reminderAt, setReminderAt] = useState("");
  const [repeatPattern, setRepeatPattern] = useState("None");
  const [eventTrigger, setEventTrigger] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("Platform");
  const [snoozeAllowed, setSnoozeAllowed] = useState(true);

  // Escalation
  const [escLevel, setEscLevel] = useState(1);
  const [escReason, setEscReason] = useState("");
  const [escOwner, setEscOwner] = useState("Alex Chen");
  const [escRecipients, setEscRecipients] = useState("Jordan Blake");
  const [escDue, setEscDue] = useState("");
  const [escResponse, setEscResponse] = useState("");

  const [errors, setErrors] = useState<string[]>([]);

  const clinicName = CLINIC_OPTIONS.find((c) => c.id === clinicId)?.name || "";

  const duplicates = useMemo(
    () => findPossibleDuplicates(actions, title, clinicId),
    [actions, title, clinicId]
  );

  function applyTemplate(t: ActionTemplate) {
    setCategory(t.category);
    setActionType(t.defaults.actionType || t.category);
    if (t.defaults.priority) setPriority(t.defaults.priority);
    setTitle(t.name);
    setDescription(t.description);
  }

  function onTypeChange(type: string) {
    setActionType(type);
    if (type === "Approval" || type === "Exception" || type === "Escalation" || type === "Reminder") {
      setCategory(type);
    }
  }

  function validate(): string[] {
    const e: string[] = [];
    if (!title.trim()) e.push("Action title is required");
    if (!description.trim()) e.push("Description is required");
    if (!owner.trim()) e.push("Owner is required");
    if (!dueAt) e.push("Due date is required");
    if (!STAFF_DIRECTORY.includes(owner) && owner) e.push("Owner authority check: select an authorised staff member");
    if (category === "Approval") {
      if (!approver1) e.push("Approval path requires at least one approver");
      if (evidenceRequired && !description.includes("evidence") && !approvalPurpose)
        e.push("Evidence required — confirm approval purpose / evidence expectation");
    }
    if (category === "Exception" && (!expected || !actual)) {
      e.push("Exception requires expected and actual results");
    }
    if (category === "Escalation" && !escReason) e.push("Escalation reason is required");
    if (category === "Reminder" && !reminderAt && !dueAt) e.push("Reminder date/time is required");
    return e;
  }

  function buildAction(): InboxAction {
    const id = uid("m2");
    return {
      id,
      number: nextActionNumber(actions),
      title: title.trim(),
      explanation: description.trim().slice(0, 140),
      fullExplanation: description.trim(),
      category,
      clinicId,
      clinicName,
      team,
      owner,
      requestedBy: requester,
      priority,
      status: category === "Approval" ? "Awaiting Approval" : "Open",
      sensitivity,
      createdAt: nowIso(),
      dueAt: new Date(dueAt).toISOString(),
      requiredOutcome:
        category === "Approval"
          ? "Complete approval pathway"
          : category === "Exception"
            ? "Resolve exception"
            : category === "Escalation"
              ? escResponse || "Respond to escalation"
              : "Complete reminder",
      expectedResult: expected || undefined,
      actualResult: actual || undefined,
      possibleCause: cause || undefined,
      possibleEffect: effect || undefined,
      recommendedNextAction: recommended || undefined,
      unread: true,
      isDemo: true,
      escalationLevel: category === "Escalation" ? (escLevel as 1 | 2 | 3 | 4) : 0,
      watchers: watchers
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean),
      notes: "",
      attachments: [],
      comments: [],
      relatedRecords: [],
      approvalSteps:
        category === "Approval"
          ? [
              { id: uid("as"), order: 1, approver: approver1, status: "Pending" },
              ...(approver2
                ? [{ id: uid("as"), order: 2, approver: approver2, status: "Pending" as const }]
                : []),
            ]
          : [],
      approvalPurpose: approvalPurpose || undefined,
      decisionEffect: decisionEffect || undefined,
      evidenceRequired: category === "Approval" ? evidenceRequired : false,
      acknowledgementRequired: ackRequired,
      managerVerificationRequired: verifyRequired,
      reminderType: category === "Reminder" ? reminderType : undefined,
      reminderAt: reminderAt ? new Date(reminderAt).toISOString() : undefined,
      repeatPattern: category === "Reminder" ? repeatPattern : undefined,
      snoozeAllowed: category === "Reminder" ? snoozeAllowed : false,
      ownershipHistory: [
        {
          at: nowIso(),
          from: requester,
          to: owner,
          reason: "Created",
          kind: "assign",
        },
      ],
      linkedFollowUps: [],
      completionRequirements: ["Completion note"],
      notificationMethods: [deliveryMethod || "Platform"],
    };
  }

  function saveDraft() {
    const draft: ActionDraft = {
      id: uid("draft"),
      title,
      description,
      actionType,
      category,
      clinicId,
      owner,
      priority,
      dueAt: dueAt ? new Date(dueAt).toISOString() : "",
      team,
      requester,
      sensitivity,
      sharedWith: isPrivateDraft
        ? []
        : sharedWith
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      isPrivate: isPrivateDraft,
      updatedAt: nowIso(),
      payload: { actionType },
    };
    onSaveDraft(draft);
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(15,23,42,0.28)]" onClick={onClose} />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-[min(920px,98vw)] flex-col bg-[var(--card)] text-[var(--ink)] shadow-[-20px_0_60px_rgba(15,23,42,0.2)]">
        <div className="flex h-[70px] items-center justify-between border-b border-[var(--line)] px-5">
          <div>
            <h2 className="m-0 text-[19px] font-extrabold">Create Action</h2>
            <p className="m-0 text-[13px] text-[var(--muted)]">Wide workspace · demonstration form</p>
          </div>
          <Button variant="line" className="h-10 w-10 min-h-0 justify-center px-0" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {step === "form" ? (
            <div className="grid gap-4">
              <div>
                <h4 className="m-0 mb-2 text-sm font-extrabold">Templates</h4>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="rounded-lg border border-[var(--line)] bg-[var(--soft)] px-2.5 py-1.5 text-[length:var(--type-control)] font-bold"
                      onClick={() => applyTemplate(t)}
                    >
                      {t.name} <Badge tone="default">{t.scope}</Badge>
                    </button>
                  ))}
                </div>
                {drafts[0] ? (
                  <p className="mt-2 text-[length:var(--type-control)] text-[var(--muted)]">
                    Latest draft: {drafts[0].title || "Untitled"} (drafts never enter the inbox)
                  </p>
                ) : null}
              </div>

              <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                Action Title *
                <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                Description *
                <textarea
                  className={inputCls + " min-h-[90px]"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                  Action Type
                  <select
                    className={inputCls}
                    value={actionType}
                    onChange={(e) => onTypeChange(e.target.value)}
                  >
                    <option>Approval</option>
                    <option>Exception</option>
                    <option>Escalation</option>
                    <option>Reminder</option>
                    <option>General</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                  Category
                  <select
                    className={inputCls}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActionCategory)}
                  >
                    <option value="Approval">Approval</option>
                    <option value="Exception">Exception</option>
                    <option value="Escalation">Escalation</option>
                    <option value="Reminder">Reminder</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                  Clinic *
                  <select className={inputCls} value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
                    {CLINIC_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                  Owner *
                  <select className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value)}>
                    <option value="">Select owner</option>
                    {STAFF_DIRECTORY.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                  Priority
                  <select
                    className={inputCls}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ActionPriority)}
                  >
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                  Due Date *
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                  />
                </label>
              </div>

              {/* Type-specific sections */}
              {category === "Approval" ? (
                <fieldset className="grid gap-2 rounded-xl border border-[var(--hcdp-status-info-border)] bg-[var(--hcdp-status-info-surface)] p-3">
                  <legend className="px-1 text-[length:var(--type-control)] font-extrabold text-[#1d4ed8]">Approval fields</legend>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Approval purpose
                    <input className={inputCls} value={approvalPurpose} onChange={(e) => setApprovalPurpose(e.target.value)} />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                      Approver step 1
                      <select className={inputCls} value={approver1} onChange={(e) => setApprover1(e.target.value)}>
                        {STAFF_DIRECTORY.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                      Approver step 2
                      <select className={inputCls} value={approver2} onChange={(e) => setApprover2(e.target.value)}>
                        <option value="">None</option>
                        {STAFF_DIRECTORY.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Required decision date
                    <input type="date" className={inputCls} value={decisionDate} onChange={(e) => setDecisionDate(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Decision effect
                    <input className={inputCls} value={decisionEffect} onChange={(e) => setDecisionEffect(e.target.value)} />
                  </label>
                  <label className="flex items-center gap-2 text-[length:var(--type-control)] font-semibold">
                    <input type="checkbox" checked={evidenceRequired} onChange={(e) => setEvidenceRequired(e.target.checked)} />
                    Evidence required
                  </label>
                </fieldset>
              ) : null}

              {category === "Exception" ? (
                <fieldset className="grid gap-2 rounded-xl border border-[var(--hcdp-status-warning-border)] bg-[var(--hcdp-status-warning-surface)] p-3">
                  <legend className="px-1 text-[length:var(--type-control)] font-extrabold text-[#b45309]">Exception fields</legend>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    What was expected?
                    <input className={inputCls} value={expected} onChange={(e) => setExpected(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    What actually happened?
                    <input className={inputCls} value={actual} onChange={(e) => setActual(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Possible cause
                    <input className={inputCls} value={cause} onChange={(e) => setCause(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Possible effect
                    <input className={inputCls} value={effect} onChange={(e) => setEffect(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Recommended action
                    <input className={inputCls} value={recommended} onChange={(e) => setRecommended(e.target.value)} />
                  </label>
                  <label className="flex items-center gap-2 text-[length:var(--type-control)] font-semibold">
                    <input type="checkbox" checked={ackRequired} onChange={(e) => setAckRequired(e.target.checked)} />
                    Acknowledgement required
                  </label>
                  <label className="flex items-center gap-2 text-[length:var(--type-control)] font-semibold">
                    <input type="checkbox" checked={verifyRequired} onChange={(e) => setVerifyRequired(e.target.checked)} />
                    Manager verification required
                  </label>
                </fieldset>
              ) : null}

              {category === "Reminder" ? (
                <fieldset className="grid gap-2 rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] p-3">
                  <legend className="px-1 text-[length:var(--type-control)] font-extrabold text-[#7c3aed]">Reminder fields</legend>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Reminder type
                    <select className={inputCls} value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
                      <option>One-time</option>
                      <option>Repeating</option>
                      <option>Event-triggered</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Reminder date and time
                    <input type="datetime-local" className={inputCls} value={reminderAt} onChange={(e) => setReminderAt(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Repeat pattern
                    <select className={inputCls} value={repeatPattern} onChange={(e) => setRepeatPattern(e.target.value)}>
                      <option>None</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Event trigger
                    <input className={inputCls} value={eventTrigger} onChange={(e) => setEventTrigger(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    End date
                    <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Delivery method
                    <select className={inputCls} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                      <option>Platform</option>
                      <option>Email</option>
                      <option>SMS</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-[length:var(--type-control)] font-semibold">
                    <input type="checkbox" checked={snoozeAllowed} onChange={(e) => setSnoozeAllowed(e.target.checked)} />
                    Snooze allowed
                  </label>
                </fieldset>
              ) : null}

              {category === "Escalation" ? (
                <fieldset className="grid gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
                  <legend className="px-1 text-[length:var(--type-control)] font-extrabold text-[#dc2626]">Escalation fields</legend>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Current escalation level
                    <select className={inputCls} value={escLevel} onChange={(e) => setEscLevel(Number(e.target.value))}>
                      <option value={1}>Level 1 — Reminder to owner</option>
                      <option value={2}>Level 2 — Owner and team leader</option>
                      <option value={3}>Level 3 — Clinic manager</option>
                      <option value={4}>Level 4 — Senior management</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Escalation reason
                    <input className={inputCls} value={escReason} onChange={(e) => setEscReason(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Escalation owner
                    <select className={inputCls} value={escOwner} onChange={(e) => setEscOwner(e.target.value)}>
                      {STAFF_DIRECTORY.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Notification recipients
                    <input className={inputCls} value={escRecipients} onChange={(e) => setEscRecipients(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    New due date
                    <input type="datetime-local" className={inputCls} value={escDue} onChange={(e) => setEscDue(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Required response
                    <input className={inputCls} value={escResponse} onChange={(e) => setEscResponse(e.target.value)} />
                  </label>
                </fieldset>
              ) : null}

              <Button variant="line" onClick={() => setShowMore((v) => !v)}>
                {showMore ? "Hide More Options" : "More Options"}
              </Button>

              {showMore ? (
                <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Team
                    <input className={inputCls} value={team} onChange={(e) => setTeam(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Requester
                    <select className={inputCls} value={requester} onChange={(e) => setRequester(e.target.value)}>
                      {STAFF_DIRECTORY.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Watchers (comma-separated)
                    <input className={inputCls} value={watchers} onChange={(e) => setWatchers(e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                    Sensitivity
                    <select
                      className={inputCls}
                      value={sensitivity}
                      onChange={(e) => setSensitivity(e.target.value as SensitivityLevel)}
                    >
                      <option>Standard</option>
                      <option>Restricted</option>
                      <option>Confidential</option>
                      <option>Highly Confidential</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-[length:var(--type-control)] font-semibold">
                    <input
                      type="checkbox"
                      checked={isPrivateDraft}
                      onChange={(e) => setIsPrivateDraft(e.target.checked)}
                    />
                    Private draft when saving
                  </label>
                  {!isPrivateDraft ? (
                    <label className="grid gap-1 text-[length:var(--type-control)] font-bold">
                      Share draft with (comma-separated staff)
                      <input className={inputCls} value={sharedWith} onChange={(e) => setSharedWith(e.target.value)} />
                    </label>
                  ) : null}
                </div>
              ) : null}

              {duplicates.length > 0 ? (
                <div className="rounded-xl border border-[var(--hcdp-status-warning-border)] bg-[var(--hcdp-status-warning-surface)] p-3 text-sm text-[var(--hcdp-status-warning-text)]">
                  <strong>Possible duplicate warning:</strong> similar open actions exist —{" "}
                  {duplicates.map((d) => d.number).join(", ")}
                </div>
              ) : null}

              {errors.length > 0 ? (
                <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-[#991b1b]">
                  <ul className="m-0 pl-4">
                    {errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-2 text-sm">
              <h3 className="m-0 text-base font-extrabold">Final review summary</h3>
              {[
                ["Title", title],
                ["Type / Category", `${actionType} / ${category}`],
                ["Clinic", clinicName],
                ["Owner", owner],
                ["Priority", priority],
                ["Due", dueAt],
                ["Requester", requester],
                ["Sensitivity", sensitivity],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-2 border-b border-[var(--line)] py-2">
                  <span className="font-bold text-[var(--muted)]">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <p className="text-[length:var(--type-control)] text-[var(--muted)]">{description}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] bg-[var(--soft)] px-5 py-3.5">
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="line" onClick={saveDraft}>
            Save Draft
          </Button>
          {step === "form" ? (
            <Button
              variant="teal"
              onClick={() => {
                const e = validate();
                setErrors(e);
                if (e.length) return;
                setStep("review");
              }}
            >
              Continue to review
            </Button>
          ) : (
            <>
              <Button variant="line" onClick={() => setStep("form")}>
                Back
              </Button>
              <Button
                variant="teal"
                onClick={() => {
                  const e = validate();
                  setErrors(e);
                  if (e.length) {
                    setStep("form");
                    return;
                  }
                  onSubmit(buildAction());
                }}
              >
                Submit Action
              </Button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

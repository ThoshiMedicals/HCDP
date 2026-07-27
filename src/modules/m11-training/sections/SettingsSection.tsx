"use client";

import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import {
  createPolicyVersion,
  publishPolicyVersion,
  listPolicies,
} from "../services/policy-service";
import { listCourses } from "../services/catalogue-service";
import { hasM11Permission } from "../permissions";
import { M11_PERMISSION_CODES } from "../permissions";
import { M11_STORAGE_KEYS } from "../storage/keys";
import type { PolicyRuleStatus, PolicyRule } from "../types/domain";
import {
  EmptyState,
  RestrictedState,
  ValidationErrorState,
  OfflineState,
} from "./ux-states";

const POLICY_STATUS_TONES: Record<PolicyRuleStatus, "success" | "warn" | "default"> = {
  draft: "warn",
  published: "success",
  archived: "default",
};

export function SettingsSection() {
  const { actor, actorName, migrationReport, bump, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canManagePolicy = hasM11Permission(actor, "training.manage_policy");

  const [tab, setTab] = useState<"policy" | "actor" | "storage">("policy");
  const [policyLabel, setPolicyLabel] = useState("");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [policyErrors, setPolicyErrors] = useState<string[]>([]);

  const [newRuleCourseId, setNewRuleCourseId] = useState("");
  const [newRuleReqId, setNewRuleReqId] = useState("");
  const [newRuleReqLabel, setNewRuleReqLabel] = useState("");
  const [newRuleRecurrence, setNewRuleRecurrence] = useState("");
  const [draftRules, setDraftRules] = useState<
    Omit<PolicyRule, "id" | "policyVersionId" | "createdAt" | "version">[]
  >([]);

  const policies = listPolicies();
  const courses = listCourses();
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  const addDraftRule = () => {
    if (!newRuleCourseId || !newRuleReqId.trim() || !newRuleReqLabel.trim()) {
      setPolicyErrors(["Course, requirement ID, and label are required."]);
      return;
    }
    setPolicyErrors([]);
    setDraftRules((prev) => [
      ...prev,
      {
        requirementId: newRuleReqId.trim(),
        courseId: newRuleCourseId,
        requirementLabel: newRuleReqLabel.trim(),
        requireCompletion: true,
        requireCompetency: false,
        allowCompletionAsCompetency: true,
        recurrenceMonths: newRuleRecurrence ? Number(newRuleRecurrence) : null,
        graceDays: 14,
        organisationId: "org_parent",
        clinicIds: [],
      },
    ]);
    setNewRuleCourseId("");
    setNewRuleReqId("");
    setNewRuleReqLabel("");
    setNewRuleRecurrence("");
  };

  const handleCreateDraft = () => {
    const errs: string[] = [];
    if (!policyLabel.trim()) errs.push("Policy label is required.");
    if (draftRules.length === 0) errs.push("At least one rule is required.");
    if (errs.length) { setPolicyErrors(errs); return; }
    setPolicyErrors([]);

    try {
      createPolicyVersion(actor, {
        label: policyLabel.trim(),
        rules: draftRules,
      });
      setPolicyLabel("");
      setDraftRules([]);
      bump();
      pushToast("Policy draft created.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Create failed", "danger");
    }
  };

  const handlePublish = (policyId: string) => {
    try {
      publishPolicyVersion(actor, policyId);
      setPublishingId(null);
      bump();
      pushToast("Policy published. Prior published version archived (immutable).", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Publish failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Policy & Settings</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Versioned training policy management. Prior published versions are archived (immutable) when
          a new version is published.
        </p>
      </div>

      <div className="flex gap-2">
        {(["policy", "actor", "storage"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? "bg-[var(--teal-3)] text-[#1d4ed8]"
                : "border border-[var(--line)] text-[#526479] hover:bg-[#f8fafc]"
            }`}
          >
            {t === "policy" ? "Policy" : t === "actor" ? "Actor" : "Storage"}
          </button>
        ))}
      </div>

      {tab === "policy" ? (
        <>
          {!canManagePolicy ? (
            <RestrictedState permission="training.manage_policy" />
          ) : (
            <>
              <Panel>
                <PanelTitle>Create policy draft</PanelTitle>
                <PanelSub>
                  Draft policies can be published. Publishing archives the prior published version.
                  Published versions are immutable.
                </PanelSub>
                <ValidationErrorState errors={policyErrors} onDismiss={() => setPolicyErrors([])} />
                <div className="mt-3">
                  <input
                    className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                    placeholder="Policy label (e.g. Clinical Policy v2)"
                    value={policyLabel}
                    onChange={(e) => setPolicyLabel(e.target.value)}
                    aria-label="Policy label"
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-sm font-semibold text-[var(--ink)]">Add rule to draft</div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <select
                      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                      value={newRuleCourseId}
                      onChange={(e) => setNewRuleCourseId(e.target.value)}
                      aria-label="Course"
                    >
                      <option value="">— Course —</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.courseCode} — {c.title}
                        </option>
                      ))}
                    </select>
                    <input
                      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                      placeholder="Requirement ID"
                      value={newRuleReqId}
                      onChange={(e) => setNewRuleReqId(e.target.value)}
                      aria-label="Requirement ID"
                    />
                    <input
                      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                      placeholder="Requirement label"
                      value={newRuleReqLabel}
                      onChange={(e) => setNewRuleReqLabel(e.target.value)}
                      aria-label="Requirement label"
                    />
                    <input
                      className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
                      type="number"
                      min={1}
                      placeholder="Recurrence months"
                      value={newRuleRecurrence}
                      onChange={(e) => setNewRuleRecurrence(e.target.value)}
                      aria-label="Recurrence months"
                    />
                  </div>
                  <Button className="mt-2" variant="line" small onClick={addDraftRule}>
                    + Add rule
                  </Button>
                </div>

                {draftRules.length > 0 ? (
                  <div className="mt-3">
                    <div className="mb-1 text-xs font-semibold text-[#526479]">
                      Rules in this draft ({draftRules.length})
                    </div>
                    <ul className="space-y-1">
                      {draftRules.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-[var(--line)] px-3 py-2 text-xs"
                        >
                          <span>
                            <strong>{r.requirementLabel}</strong> → {courseMap[r.courseId] ?? r.courseId}
                            {r.recurrenceMonths ? ` · every ${r.recurrenceMonths}mo` : ""}
                          </span>
                          <button
                            type="button"
                            className="ml-2 text-[#b91c1c] hover:opacity-70"
                            onClick={() =>
                              setDraftRules((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            aria-label={`Remove rule ${r.requirementLabel}`}
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Button
                  className="mt-4"
                  variant="teal"
                  onClick={handleCreateDraft}
                  disabled={!policyLabel.trim() || draftRules.length === 0}
                >
                  Create draft
                </Button>
              </Panel>
            </>
          )}

          {policies.length === 0 ? (
            <EmptyState
              title="No policy versions"
              description="Create a draft policy and publish it to activate training requirements."
            />
          ) : (
            <Panel pad={false}>
              <div className="border-b border-[var(--line)] px-5 py-3">
                <PanelTitle>Policy versions</PanelTitle>
                <PanelSub>
                  Published versions are immutable. Prior published versions are archived on new
                  publish.
                </PanelSub>
              </div>
              <Table>
                <THead>
                  <Th>Label</Th>
                  <Th>Status</Th>
                  <Th>Rules</Th>
                  <Th>Published</Th>
                  <Th>Created by</Th>
                  <Th>Created at</Th>
                  {canManagePolicy ? <Th>Actions</Th> : null}
                </THead>
                <tbody>
                  {policies
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((p) => (
                      <Fragment key={p.id}>
                        <tr key={p.id}>
                          <Td className="font-semibold">{p.label}</Td>
                          <Td>
                            <Badge tone={POLICY_STATUS_TONES[p.status]}>{p.status}</Badge>
                          </Td>
                          <Td>{p.rules.length}</Td>
                          <Td className="text-xs">
                            {p.publishedAt ? p.publishedAt.slice(0, 10) : "—"}
                          </Td>
                          <Td className="text-xs text-[#64748b]">{p.createdBy}</Td>
                          <Td className="text-xs">{p.createdAt.slice(0, 10)}</Td>
                          {canManagePolicy ? (
                            <Td>
                              {p.status === "draft" ? (
                                <Button
                                  small
                                  variant="teal"
                                  onClick={() =>
                                    setPublishingId(publishingId === p.id ? null : p.id)
                                  }
                                >
                                  Publish
                                </Button>
                              ) : (
                                <span className="text-xs text-[#64748b] italic">
                                  {p.status === "published" ? "immutable" : "archived"}
                                </span>
                              )}
                            </Td>
                          ) : null}
                        </tr>
                        {publishingId === p.id ? (
                          <tr key={`${p.id}-publish`}>
                            <td colSpan={canManagePolicy ? 7 : 6} className="bg-[#f0fdf4]">
                              <div className="flex items-center gap-3 p-2 text-sm">
                                <span className="text-[#15803d]">
                                  Publishing will archive the current published version (if any) and
                                  activate this policy. This action cannot be undone.
                                </span>
                                <Button
                                  small
                                  variant="teal"
                                  onClick={() => handlePublish(p.id)}
                                >
                                  Confirm publish
                                </Button>
                                <Button
                                  small
                                  variant="line"
                                  onClick={() => setPublishingId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                        {p.rules.length > 0 ? (
                          <tr key={`${p.id}-rules`}>
                            <td
                              colSpan={canManagePolicy ? 7 : 6}
                              className="bg-[#f8fafc] py-1"
                            >
                              <div className="flex flex-wrap gap-2 px-2 py-1">
                                {p.rules.map((r) => (
                                  <span
                                    key={r.id}
                                    className="rounded bg-white px-2 py-0.5 text-xs border border-[var(--line)]"
                                  >
                                    {r.requirementLabel} ({courseMap[r.courseId] ?? r.courseId})
                                    {r.recurrenceMonths ? ` · ${r.recurrenceMonths}mo` : ""}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    ))}
                </tbody>
              </Table>
            </Panel>
          )}
        </>
      ) : null}

      {tab === "actor" ? (
        <Panel>
          <PanelTitle>Active actor</PanelTitle>
          <PanelSub>
            {actorName} ({actor.userId})
          </PanelSub>
          <ul className="mt-2 max-h-48 overflow-auto text-xs text-[#526479]">
            {actor.permissions.includes("*") ? (
              <li>* (all M11 permissions)</li>
            ) : (
              M11_PERMISSION_CODES.filter((c) => actor.permissions.includes(c)).map((c) => (
                <li key={c}>{c}</li>
              ))
            )}
          </ul>
          {migrationReport ? (
            <p className="mt-3 text-sm text-[#526479]">
              Last seed: {migrationReport.migratedCount}/{migrationReport.sourceCount} at{" "}
              {migrationReport.ranAt}
            </p>
          ) : null}
        </Panel>
      ) : null}

      {tab === "storage" ? (
        <Panel>
          <PanelTitle>Storage keys</PanelTitle>
          <PanelSub>
            Repositories own these keys — components must not write localStorage directly.
          </PanelSub>
          <ul className="mt-2 text-xs text-[#526479]">
            {Object.entries(M11_STORAGE_KEYS).map(([k, v]) => (
              <li key={k}>
                <code>{v}</code>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <PanelTitle>Rollback note</PanelTitle>
            <PanelSub>
              Clear <code>pulse.m11.training.*</code> keys to reset. Seed migration flags should be
              cleared via <code>rollbackSeedOwnedM11</code> in the storage module. Do not
              dual-write portal + M11.
            </PanelSub>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

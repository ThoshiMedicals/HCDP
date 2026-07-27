"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import {
  createPolicyVersion,
  listPolicies,
  publishPolicy,
} from "../services/policy-service";
import {
  EmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";
import { SectionFrame } from "../components/SectionFrame";

const DEFAULT_ORG = "org_parent";

export function SettingsSection() {
  const { actor, bump, pushToast, migrationReport, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canManage = hasM05Permission(actor, "roster.policy.manage");

  const [label, setLabel] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const policies = useMemo(() => {
    if (!canView) return [];
    return listPolicies(DEFAULT_ORG);
  }, [canView, refreshKey]);

  const handleCreate = () => {
    if (!label.trim()) {
      setErrors(["Label is required."]);
      return;
    }
    setErrors([]);
    try {
      createPolicyVersion(actor, { label: label.trim() });
      setLabel("");
      bump();
      pushToast("Draft policy created.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Create failed", "danger");
    }
  };

  const handlePublish = (policyId: string) => {
    try {
      publishPolicy(actor, policyId);
      bump();
      pushToast("Policy published.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Publish failed", "danger");
    }
  };

  if (!canView) {
    return (
      <SectionFrame sectionId="settings" title="Settings">
        <RestrictedState permission="roster.view" />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame sectionId="settings" title="Settings">
      <OfflineState />
      <div>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Manage versioned roster conflict/fatigue policies. Publishing archives the
          prior published policy for the organisation.
        </p>
      </div>

      {migrationReport ? (
        <Panel>
          <PanelTitle>Seed report</PanelTitle>
          <PanelSub>
            Migrated {migrationReport.migratedCount}/{migrationReport.sourceCount} · duplicates{" "}
            {migrationReport.duplicates} · rejected {migrationReport.rejected}
          </PanelSub>
          {migrationReport.warnings.length > 0 ? (
            <ul className="mt-2 text-xs text-[#64748b]">
              {migrationReport.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ) : null}

      {canManage ? (
        <Panel>
          <PanelTitle>Create draft policy version</PanelTitle>
          <PanelSub>Requires roster.policy.manage.</PanelSub>
          <ValidationErrorState errors={errors} onDismiss={() => setErrors([])} />
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm md:col-span-2"
              placeholder="Policy label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              aria-label="Policy label"
            />
            <Button variant="teal" onClick={handleCreate}>
              Create draft
            </Button>
          </div>
        </Panel>
      ) : null}

      {policies.length === 0 ? (
        <div data-testid="m05-policy-list">
          <EmptyState
            title="No policies yet"
            description="Seed runs on mount. Draft/publish above to add more."
          />
        </div>
      ) : (
        <div data-testid="m05-policy-list">
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Conflict policies</PanelTitle>
            <PanelSub>Single published policy per organisation.</PanelSub>
          </div>
          <Table>
            <THead>
              <Th>Label</Th>
              <Th>Version</Th>
              <Th>Status</Th>
              <Th>Rules</Th>
              <Th>Published at</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id}>
                  <Td className="font-semibold">{p.label}</Td>
                  <Td>v{p.policyVersion}</Td>
                  <Td>
                    <Badge
                      tone={
                        p.status === "published"
                          ? "success"
                          : p.status === "archived"
                            ? "default"
                            : "warn"
                      }
                    >
                      {p.status}
                    </Badge>
                  </Td>
                  <Td className="text-xs">{p.rules.length}</Td>
                  <Td className="text-xs">{p.publishedAt ?? "—"}</Td>
                  <Td>
                    {canManage && p.status === "draft" ? (
                      <Button
                        small
                        variant="teal"
                        onClick={() => handlePublish(p.id)}
                      >
                        Publish
                      </Button>
                    ) : (
                      <span className="text-xs text-[#64748b]">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
        </div>
      )}

      <Panel>
        <PanelTitle>Actor</PanelTitle>
        <div className="text-sm text-[#526479]">
          {actor.userId} · {actor.permissions.includes("*") ? "superuser" : `${actor.permissions.length} permissions`} ·{" "}
          {actor.clinicIds === undefined ? "all clinics" : `${actor.clinicIds.length} clinic(s)`}
        </div>
      </Panel>
    </SectionFrame>
  );
}

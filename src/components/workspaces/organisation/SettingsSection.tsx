"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useOrganisation } from "@/lib/organisation/context";
import { appendAudit } from "@/lib/organisation/store";
import { SectionHeader, StatusPill, WarningBanner, useConfirm } from "./org-ui";

const CHANNELS = ["Platform", "Email", "SMS"] as const;
const NOTIF_TYPES = [
  "Access request",
  "Permission change",
  "Emergency access",
  "Account lock",
  "Critical alert",
  "Clinic status",
  "Access removal",
  "Temporary expiry",
];
const SMS_LOCKED_TYPES = ["Emergency access", "Account lock", "Critical alert"];

export function SettingsSection() {
  const { state, patchState, pushToast } = useOrganisation();
  const { settings } = state;
  const { ask, dialog } = useConfirm();
  const [freqDraft, setFreqDraft] = useState(settings.defaultReviewFrequencyDays);

  const toggleChannel = (type: string, channel: (typeof CHANNELS)[number]) => {
    if (settings.mandatoryNotificationTypes.includes(type) && channel === "Platform") {
      pushToast("Mandatory notification channels cannot be disabled.", "warn");
      return;
    }
    if (SMS_LOCKED_TYPES.includes(type) && channel === "SMS") {
      pushToast("SMS is locked on for Emergency access, Account lock and Critical alert notifications.", "warn");
      return;
    }
    patchState((prev) => {
      const current = prev.settings.notificationChannels[type] || [];
      const next = current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel];
      return {
        ...prev,
        settings: {
          ...prev.settings,
          notificationChannels: { ...prev.settings.notificationChannels, [type]: next },
        },
      };
    });
  };

  const confirmAndUpdate = (
    field: "defaultReviewFrequencyDays" | "dualApprovalThreshold",
    value: string | number,
    label: string
  ) => {
    ask({
      title: "Confirm setting change",
      message: `Changing ${label} to "${value}" requires Director approval sign-off. This change is recorded in the audit log.`,
      confirmLabel: "Confirm change",
      onConfirm: () => {
        patchState((prev) =>
          appendAudit(
            { ...prev, settings: { ...prev.settings, [field]: value } },
            {
              entityType: "Setting",
              entityId: field,
              entityLabel: label,
              field,
              previousValue: String(settings[field]),
              newValue: String(value),
              reason: "Director-approved organisation settings change",
              approval: "Director / Senior Administrator",
              device: "Desktop · Demo",
              locationLabel: "Module 3",
            }
          )
        );
        pushToast("Setting updated with Director approval recorded.", "success");
      },
    });
  };

  return (
    <div className="grid gap-[18px]">
      <SectionHeader title="Organisation settings" subtitle="Defaults, clinic exceptions and notification channels." />

      <WarningBanner>
        Changes to global approval rules and dual-approval threshold require risk-based sign-off from a Director or Senior Administrator.
      </WarningBanner>

      <Panel>
        <PanelTitle>Organisation defaults</PanelTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-bold">Default review frequency (days)</span>
            <input
              key={settings.defaultReviewFrequencyDays}
              type="number"
              className="rounded-lg border px-3 py-2"
              defaultValue={settings.defaultReviewFrequencyDays}
              onChange={(e) => setFreqDraft(Number(e.target.value))}
              onBlur={() => {
                if (freqDraft !== settings.defaultReviewFrequencyDays) {
                  confirmAndUpdate("defaultReviewFrequencyDays", freqDraft, "Default review frequency (days)");
                }
              }}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-bold">Dual approval threshold</span>
            <select
              className="rounded-lg border px-3 py-2"
              value={settings.dualApprovalThreshold}
              onChange={(e) => confirmAndUpdate("dualApprovalThreshold", e.target.value, "Dual approval threshold")}
            >
              {["Low", "Medium", "High", "Critical"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.allowClinicSettingExceptions}
            onChange={(e) =>
              patchState((prev) => ({
                ...prev,
                settings: { ...prev.settings, allowClinicSettingExceptions: e.target.checked },
              }))
            }
          />
          <span className="text-sm text-[#526479]">Allow clinic-level setting exceptions</span>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>Notification channels</PanelTitle>
        <PanelSub>Mandatory types always include Platform. SMS is locked on for emergency access, account lock and critical alert events.</PanelSub>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-[#526479]">
                <th className="pb-2">Type</th>
                {CHANNELS.map((c) => <th key={c}>{c}</th>)}
                <th>Mandatory</th>
              </tr>
            </thead>
            <tbody>
              {NOTIF_TYPES.map((type) => (
                <tr key={type} className="border-t border-[#f0f3f6]">
                  <td className="py-2 font-semibold">{type}</td>
                  {CHANNELS.map((ch) => {
                    const on = (settings.notificationChannels[type] || []).includes(ch);
                    const locked =
                      (settings.mandatoryNotificationTypes.includes(type) && ch === "Platform") ||
                      (SMS_LOCKED_TYPES.includes(type) && ch === "SMS");
                    return (
                      <td key={ch} className="py-2">
                        <Button
                          small
                          variant={on ? "teal" : "line"}
                          disabled={locked}
                          onClick={() => toggleChannel(type, ch)}
                          title={locked ? "Locked channel" : `Toggle ${ch}`}
                        >
                          {on ? "On" : "Off"}
                        </Button>
                      </td>
                    );
                  })}
                  <td>
                    {settings.mandatoryNotificationTypes.includes(type) ? (
                      <StatusPill label="Mandatory" tone="warn" />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <PanelTitle>Temporary access warnings</PanelTitle>
        <PanelSub>Days before expiry: {settings.temporaryAccessExpiryWarnings.join(", ")}</PanelSub>
      </Panel>
      {dialog}
    </div>
  );
}

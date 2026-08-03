"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import type { NotificationSettings } from "@/lib/action-inbox/types";

const inputCls =
  "rounded-[10px] border border-[var(--line)] bg-[var(--card)] px-2.5 py-2 text-[13px] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563eb]";

export function NotificationSettingsPanel({
  settings,
  onClose,
  onSave,
}: {
  settings: NotificationSettings;
  onClose: () => void;
  onSave: (s: NotificationSettings) => void;
}) {
  const [form, setForm] = useState(settings);
  const patch = (p: Partial<NotificationSettings>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Drawer
      open
      title="Notification Settings"
      subtitle="Routine may be silenced · urgent / escalation / emergency / mandatory cannot"
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="teal"
            onClick={() => {
              // Critical channels cannot be silenced
              onSave({
                ...form,
                escalationAlerts: true,
                // Keep platform on for mandatory delivery path in demo
                platform: true,
              });
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-3 text-sm">
        {(
          [
            ["platform", "Platform"],
            ["email", "Email"],
            ["sms", "SMS"],
            ["dailySummary", "Daily summary"],
            ["delegationUpdates", "Delegation updates"],
            ["watchedActionUpdates", "Watched-action updates"],
            ["groupRoutine", "Group routine notifications"],
            ["silenceRoutine", "Silence routine notifications"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={Boolean(form[key])}
              onChange={(e) => patch({ [key]: e.target.checked } as Partial<NotificationSettings>)}
            />
            {label}
          </label>
        ))}

        <label className="flex items-center gap-2 font-semibold text-[#991b1b]">
          <input type="checkbox" checked disabled />
          Escalation alerts (cannot silence)
        </label>
        <p className="m-0 text-[length:var(--type-control)] text-[var(--muted)]">
          Urgent, escalation, emergency and mandatory approval alerts cannot be silenced.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-[12px] font-bold">
            Quiet hours start
            <input
              type="time"
              className={inputCls}
              value={form.quietHoursStart}
              onChange={(e) => patch({ quietHoursStart: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-[12px] font-bold">
            Quiet hours end
            <input
              type="time"
              className={inputCls}
              value={form.quietHoursEnd}
              onChange={(e) => patch({ quietHoursEnd: e.target.value })}
            />
          </label>
        </div>

        <label className="grid gap-1 text-[12px] font-bold">
          Reminder frequency
          <select
            className={inputCls}
            value={form.reminderFrequency}
            onChange={(e) =>
              patch({
                reminderFrequency: e.target.value as NotificationSettings["reminderFrequency"],
              })
            }
          >
            <option>Immediate</option>
            <option>Hourly digest</option>
            <option>Daily digest</option>
          </select>
        </label>

        <label className="grid gap-1 text-[12px] font-bold">
          Leave-period behaviour
          <select
            className={inputCls}
            value={form.leavePeriodBehaviour}
            onChange={(e) =>
              patch({
                leavePeriodBehaviour: e.target.value as NotificationSettings["leavePeriodBehaviour"],
              })
            }
          >
            <option>Pause routine</option>
            <option>Keep all</option>
            <option>Delegate only</option>
          </select>
        </label>
      </div>
    </Drawer>
  );
}

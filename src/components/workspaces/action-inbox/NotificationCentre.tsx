"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import type {
  InboxAction,
  InboxNotification,
  NotificationSettings,
} from "@/lib/action-inbox/types";
import { formatDateTime, maskNotificationForSensitivity } from "@/lib/action-inbox/utils";

export function NotificationCentre({
  notifications,
  actions,
  canSeeSensitive,
  settings,
  isManager,
  onClose,
  onOpenAction,
  onMarkRead,
  onOpenSettings,
}: {
  notifications: InboxNotification[];
  actions: InboxAction[];
  canSeeSensitive: boolean;
  settings: NotificationSettings;
  isManager: boolean;
  onClose: () => void;
  onOpenAction: (actionId: string) => void;
  onMarkRead: (id: string) => void;
  onOpenSettings: () => void;
}) {
  const visible = useMemo(() => {
    return notifications
      .filter((n) => {
        if (settings.silenceRoutine && n.kind === "routine") return false;
        return true;
      })
      .map((n) => {
        const masked = maskNotificationForSensitivity(n, actions, canSeeSensitive);
        return { ...n, title: masked.title, reason: masked.reason };
      });
  }, [notifications, actions, canSeeSensitive, settings.silenceRoutine]);

  const grouped = useMemo(() => {
    const urgent = visible.filter(
      (n) =>
        n.kind === "urgent" ||
        n.kind === "escalation" ||
        n.kind === "emergency" ||
        n.kind === "mandatory-approval"
    );
    const routine = visible.filter((n) => n.kind === "routine");
    const groups = new Map<string, typeof visible>();
    for (const n of routine) {
      if (settings.groupRoutine && n.groupKey) {
        const list = groups.get(n.groupKey) || [];
        list.push(n);
        groups.set(n.groupKey, list);
      } else {
        groups.set(n.id, [n]);
      }
    }
    return { urgent, groups };
  }, [visible, settings.groupRoutine]);

  return (
    <Drawer
      open
      title="Notification Centre"
      subtitle="Urgent and escalations stay separate · routine may group"
      onClose={onClose}
      footer={
        <>
          <Button variant="line" onClick={onOpenSettings}>
            Notification Settings
          </Button>
          <Button variant="line" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {settings.quietHoursStart && settings.quietHoursEnd ? (
          <p className="m-0 rounded-lg bg-[#f8fafc] px-3 py-2 text-[11px] text-[#64748b]">
            Quiet hours: {settings.quietHoursStart} – {settings.quietHoursEnd} (routine may be
            deferred; critical alerts still deliver)
          </p>
        ) : null}

        <section>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold text-[#dc2626]">
            Urgent / Escalation / Mandatory
          </h4>
          {grouped.urgent.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">None</p>
          ) : (
            grouped.urgent.map((n) => (
              <NotifRow
                key={n.id}
                n={n}
                isManager={isManager}
                onOpen={() => onOpenAction(n.actionId)}
                onMarkRead={() => onMarkRead(n.id)}
              />
            ))
          )}
        </section>

        <section>
          <h4 className="m-0 mb-2 text-[13px] font-extrabold text-[#475569]">
            Routine{" "}
            {settings.silenceRoutine ? "(silenced — critical alerts unaffected)" : ""}
          </h4>
          {[...grouped.groups.entries()].map(([key, items]) => {
            if (items.length > 1) {
              const latest = items[0];
              return (
                <div
                  key={key}
                  className="mb-2 rounded-xl border border-[var(--line)] bg-[#f8fafc] p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="default">Grouped ×{items.length}</Badge>
                    <span className="text-sm font-bold">{latest.title}</span>
                  </div>
                  <p className="m-0 text-[12px] text-[#64748b]">{latest.reason}</p>
                  <div className="mt-2 flex gap-2">
                    <Button small variant="teal" onClick={() => onOpenAction(latest.actionId)}>
                      Open Action
                    </Button>
                    {isManager ? (
                      <Button
                        small
                        variant="line"
                        onClick={() => items.forEach((i) => onMarkRead(i.id))}
                      >
                        Mark group read
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            }
            return (
              <NotifRow
                key={items[0].id}
                n={items[0]}
                isManager={isManager}
                onOpen={() => onOpenAction(items[0].actionId)}
                onMarkRead={() => onMarkRead(items[0].id)}
              />
            );
          })}
        </section>
      </div>
    </Drawer>
  );
}

function NotifRow({
  n,
  isManager,
  onOpen,
  onMarkRead,
}: {
  n: InboxNotification;
  isManager: boolean;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  return (
    <div
      className={`mb-2 rounded-xl border border-[var(--line)] p-3 ${n.read ? "bg-white" : "bg-[#f8fbff]"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-sm ${n.read ? "font-semibold" : "font-extrabold"}`}>{n.title}</span>
            {!n.read ? <Badge tone="info">Unread</Badge> : null}
            <Badge
              tone={
                n.priority === "Urgent" || n.priority === "High"
                  ? "danger"
                  : n.priority === "Medium"
                    ? "warn"
                    : "default"
              }
            >
              {n.priority}
            </Badge>
          </div>
          <p className="m-0 mt-1 text-[12px] text-[#64748b]">{n.reason}</p>
          <p className="m-0 text-[11px] text-[#94a3b8]">
            {n.actionNumber} · {n.clinicName} · {formatDateTime(n.at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button small variant="teal" onClick={onOpen}>
            Open Action
          </Button>
          {isManager && !n.read ? (
            <Button small variant="line" onClick={onMarkRead}>
              Mark read
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

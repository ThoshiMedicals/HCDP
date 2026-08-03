"use client";

import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useStaffDoctors } from "../context";
import { M04_PERMISSION_CODES } from "../permissions";
import { M04_STORAGE_KEYS, M04_PORTAL_SEED_MIGRATION_ID } from "../storage/keys";

export function SettingsSection() {
  const { actor, actorName, migrationReport, peopleCount } = useStaffDoctors();

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Settings</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">M04 storage ownership and rollback notes.</p>
      </div>
      <Panel>
        <PanelTitle>Active actor</PanelTitle>
        <PanelSub>
          {actorName} ({actor.userId})
        </PanelSub>
        <ul className="mt-2 max-h-40 overflow-auto text-xs text-[var(--muted)]">
          {actor.permissions.includes("*") ? (
            <li>* (all M04 permissions)</li>
          ) : (
            M04_PERMISSION_CODES.filter((c) => actor.permissions.includes(c)).map((c) => <li key={c}>{c}</li>)
          )}
        </ul>
      </Panel>
      <Panel>
        <PanelTitle>Storage keys</PanelTitle>
        <PanelSub>Repositories own these keys — components must not write localStorage directly.</PanelSub>
        <ul className="mt-2 text-xs text-[var(--muted)]">
          {Object.entries(M04_STORAGE_KEYS).map(([k, v]) => (
            <li key={k}>
              <code>{v}</code>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">People in store: {peopleCount}</p>
        {migrationReport ? (
          <p className="mt-1 text-sm text-[var(--muted)]">
            Last portal seed: {migrationReport.migratedCount}/{migrationReport.sourceCount} at {migrationReport.ranAt}
          </p>
        ) : null}
      </Panel>
      <Panel>
        <PanelTitle>Rollback (portal seed)</PanelTitle>
        <PanelSub>
          Clear <code>pulse.m04.workforce.*</code> keys and migration flag{" "}
          <code>{M04_PORTAL_SEED_MIGRATION_ID}</code>. Legacy JSON and portal records.staff/doctors remain untouched.
          Do not dual-write portal + M04.
        </PanelSub>
      </Panel>
    </div>
  );
}

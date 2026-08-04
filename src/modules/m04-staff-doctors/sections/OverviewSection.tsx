"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useHydrated } from "@/lib/use-hydrated";
import { useStaffDoctors } from "../context";
import { listPeople } from "../services/person-service";
import { getEffectiveReadiness, calculateReadiness } from "../services/readiness-service";
import { listCredentials } from "../services/credential-service";
import { listLeave } from "../services/leave-service";
import { listOnboarding, listOffboarding } from "../services/lifecycle-service";

export function OverviewSection() {
  const { counts, setSection, bump, pushToast, actor, migrationReport, refreshKey } = useStaffDoctors();
  const hydrated = useHydrated();
  void refreshKey;
  // Leaf-level hydrate gate: parent effects may update counts before this section finishes hydrating.
  const displayCounts = hydrated
    ? counts
    : { activeStaff: 0, activeDoctors: 0, blockedReadiness: 0, onLeave: 0 };
  const people = hydrated
    ? listPeople().filter((p) => p.status !== "Archived").slice(0, 8)
    : [];

  return (
    <div className="grid min-w-0 gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Workforce overview</h2>
        <p className="m-0 mt-1 text-sm text-[var(--muted)]">
          Authoritative staff and doctor management. Recalculate readiness from credentials and lifecycle state.
        </p>
      </div>

      <div className="grid min-w-0 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        <button type="button" className="w-full min-w-0 max-w-full text-left" onClick={() => setSection("staff-profiles")}>
          <Metric label="Active staff" value={displayCounts.activeStaff} icon="users" tone="success" />
        </button>
        <button type="button" className="w-full min-w-0 max-w-full text-left" onClick={() => setSection("doctor-profiles")}>
          <Metric label="Active doctors" value={displayCounts.activeDoctors} icon="users" tone="info" />
        </button>
        <button type="button" className="w-full min-w-0 max-w-full text-left" onClick={() => setSection("credentials")}>
          <Metric label="Blocked readiness" value={displayCounts.blockedReadiness} icon="alert" tone="warning" />
        </button>
        <button type="button" className="w-full min-w-0 max-w-full text-left" onClick={() => setSection("leave-availability")}>
          <Metric label="On leave today" value={displayCounts.onLeave} icon="calendar" tone="default" />
        </button>
      </div>

      <Panel>
        <PanelTitle>Quick workflows</PanelTitle>
        <PanelSub>All 12 Wave 2 workflows are reachable from the section nav.</PanelSub>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button small variant="teal" onClick={() => setSection("people")}>
            Add / find people
          </Button>
          <Button small variant="line" onClick={() => setSection("engagements")}>
            Engagements
          </Button>
          <Button small variant="line" onClick={() => setSection("credentials")}>
            Credentials
          </Button>
          <Button small variant="line" onClick={() => setSection("onboarding")}>
            Onboarding
          </Button>
          <Button small variant="line" onClick={() => setSection("offboarding")}>
            Offboarding
          </Button>
          <Button
            small
            variant="soft"
            onClick={() => {
              for (const p of listPeople().filter((x) => x.status === "Active").slice(0, 20)) {
                calculateReadiness(p.id);
              }
              bump();
              pushToast("Readiness recalculated for active people.", "success");
            }}
          >
            Recalculate readiness
          </Button>
        </div>
      </Panel>

      {hydrated && migrationReport ? (
        <Panel>
          <PanelTitle>Portal seed report</PanelTitle>
          <PanelSub>
            Migrated {migrationReport.migratedCount}/{migrationReport.sourceCount} · duplicates{" "}
            {migrationReport.duplicates} · rejected {migrationReport.rejected}
          </PanelSub>
        </Panel>
      ) : null}

      <Panel pad={false}>
        <div className="border-b border-[var(--line)] px-5 py-3">
          <PanelTitle>People snapshot</PanelTitle>
        </div>
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Kind</Th>
            <Th>Status</Th>
            <Th>Readiness</Th>
            <Th>Acting</Th>
          </THead>
          <tbody>
            {people.map((p) => {
              const ready = getEffectiveReadiness(p.id);
              return (
                <tr key={p.id}>
                  <Td>{p.preferredName}</Td>
                  <Td>{p.personKind}</Td>
                  <Td>
                    <Badge tone={p.status === "Active" ? "success" : "warn"}>{p.status}</Badge>
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        ready.readiness === "ready"
                          ? "success"
                          : ready.readiness === "blocked"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {ready.stale ? "unknown/stale" : ready.readiness}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-[var(--muted)]">{actor.userId}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>

      <div className="grid gap-3 md:grid-cols-3">
        <Panel>
          <PanelTitle>Credentials</PanelTitle>
          <div className="text-2xl font-extrabold">
            {hydrated ? listCredentials().length : 0}
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Leave requests</PanelTitle>
          <div className="text-2xl font-extrabold">{hydrated ? listLeave().length : 0}</div>
        </Panel>
        <Panel>
          <PanelTitle>Lifecycle</PanelTitle>
          <div className="text-sm text-[var(--muted)]">
            Onboarding {hydrated ? listOnboarding().length : 0} · Offboarding{" "}
            {hydrated ? listOffboarding().length : 0}
          </div>
        </Panel>
      </div>
    </div>
  );
}

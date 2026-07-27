"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useTraining } from "../context";
import { buildContributions } from "../services/readiness-bridge";
import { listCourses } from "../services/catalogue-service";
import { OfflineState } from "./ux-states";

export function OverviewSection() {
  const { counts, setSection, bump, pushToast, actor, migrationReport, refreshKey } =
    useTraining();
  void refreshKey;

  const courses = listCourses();

  const handleRecalculate = () => {
    try {
      const samplePeople = ["person_demo_001", "person_demo_002", "person_demo_003"];
      for (const pid of samplePeople) {
        buildContributions(pid, new Date().toISOString());
      }
      bump();
      pushToast("Training readiness contributions recalculated.", "success");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Recalculate failed", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Training overview</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          M11 training compliance: courses, assignments, sessions, certificates and policy.
        </p>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <button type="button" className="text-left" onClick={() => setSection("assignments")}>
          <Metric
            label="Total assignments"
            value={counts.totalAssignments}
            icon="users"
            tone="default"
          />
        </button>
        <button type="button" className="text-left" onClick={() => setSection("assignments")}>
          <Metric
            label="Overdue assignments"
            value={counts.overdueAssignments}
            icon="alert"
            tone="warning"
          />
        </button>
        <button type="button" className="text-left" onClick={() => setSection("assignments")}>
          <Metric
            label="Completed this month"
            value={counts.completedThisMonth}
            icon="users"
            tone="success"
          />
        </button>
        <button type="button" className="text-left" onClick={() => setSection("certificates")}>
          <Metric
            label="Expired certificates"
            value={counts.expiredCertificates}
            icon="alert"
            tone="danger"
          />
        </button>
        <button type="button" className="text-left" onClick={() => setSection("exemptions")}>
          <Metric
            label="Pending exemptions"
            value={counts.pendingExemptions}
            icon="calendar"
            tone="warning"
          />
        </button>
        <button type="button" className="text-left" onClick={() => setSection("reports")}>
          <Metric
            label="Non-compliant persons"
            value={counts.nonCompliantPersons}
            icon="alert"
            tone="danger"
          />
        </button>
      </div>

      <Panel>
        <PanelTitle>Quick actions</PanelTitle>
        <PanelSub>All 11 M11 sections are reachable from the section nav.</PanelSub>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button small variant="teal" onClick={() => setSection("catalogue")}>
            Course catalogue
          </Button>
          <Button small variant="line" onClick={() => setSection("assignments")}>
            Assignments
          </Button>
          <Button small variant="line" onClick={() => setSection("sessions")}>
            Sessions
          </Button>
          <Button small variant="line" onClick={() => setSection("certificates")}>
            Certificates
          </Button>
          <Button small variant="line" onClick={() => setSection("exemptions")}>
            Exemptions
          </Button>
          <Button small variant="soft" onClick={handleRecalculate}>
            Recalculate readiness contributions
          </Button>
        </div>
        <p className="mt-3 text-xs text-[#64748b]">
          Recalculate rebuilds M11 training contributions consumed by M04 authoritative readiness.
          M04 owns final eligibility outcome.
        </p>
      </Panel>

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
      ) : (
        <Panel>
          <PanelTitle>Seed status</PanelTitle>
          <PanelSub>
            Demo catalogue seeded: {courses.length > 0 ? `${courses.length} courses loaded` : "No courses yet — seed runs on mount."}
          </PanelSub>
        </Panel>
      )}

      <Panel pad={false}>
        <div className="border-b border-[var(--line)] px-5 py-3">
          <PanelTitle>Course catalogue snapshot</PanelTitle>
        </div>
        {courses.length === 0 ? (
          <div className="px-5 py-4 text-sm text-[#64748b]">No courses in catalogue yet.</div>
        ) : (
          <Table>
            <THead>
              <Th>Code</Th>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Versions</Th>
              <Th>Active version</Th>
            </THead>
            <tbody>
              {courses.slice(0, 10).map((c) => (
                <tr key={c.id}>
                  <Td className="font-mono text-xs">{c.courseCode}</Td>
                  <Td>{c.title}</Td>
                  <Td>{c.category ?? "—"}</Td>
                  <Td>{c.versions.length}</Td>
                  <Td>
                    {c.activeVersionId ? (
                      <Badge tone="success">
                        v{c.versions.find((v) => v.versionId === c.activeVersionId)?.versionNumber ?? "?"}
                      </Badge>
                    ) : (
                      <Badge tone="warn">none</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <div className="grid gap-3 md:grid-cols-3">
        <Panel>
          <PanelTitle>Active actor</PanelTitle>
          <div className="text-sm text-[#526479]">{actor.userId}</div>
        </Panel>
        <Panel>
          <PanelTitle>Permissions</PanelTitle>
          <div className="text-sm text-[#526479]">
            {actor.permissions.includes("*") ? "All (superuser)" : `${actor.permissions.length} codes`}
          </div>
        </Panel>
        <Panel>
          <PanelTitle>Clinic scope</PanelTitle>
          <div className="text-sm text-[#526479]">
            {actor.clinicIds === undefined ? "All clinics" : `${actor.clinicIds.length} clinic(s)`}
          </div>
        </Panel>
      </div>
    </div>
  );
}

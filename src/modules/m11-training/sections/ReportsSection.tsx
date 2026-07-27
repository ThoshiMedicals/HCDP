"use client";

import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useTraining } from "../context";
import { hasM11Permission } from "../permissions";
import { listCourses } from "../services/catalogue-service";
import { listCertificates } from "../services/certificate-service";
import { listExemptions } from "../services/exemption-service";
import { exportTrainingSummary } from "../services/reports-service";
import { RestrictedState, OfflineState } from "./ux-states";

export function ReportsSection() {
  const { actor, counts, pushToast, refreshKey } = useTraining();
  void refreshKey;

  const canView = hasM11Permission(actor, "training.view");
  const canExport = hasM11Permission(actor, "training.export");

  const handleExport = () => {
    try {
      const payload = exportTrainingSummary(actor);
      pushToast(`Export ready (${payload.courses} courses, ${payload.assignments} assignments).`, "success");
      console.info("[m11-export]", payload);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Export denied", "danger");
    }
  };

  if (!canView) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Reports</h2>
        </div>
        <RestrictedState permission="training.view" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Reports</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Training compliance counts and export. Export requires <code>training.export</code>.
        </p>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Total assignments"
          value={counts.totalAssignments}
          icon="users"
          tone="default"
        />
        <Metric
          label="Overdue assignments"
          value={counts.overdueAssignments}
          icon="alert"
          tone="warning"
        />
        <Metric
          label="Completed this month"
          value={counts.completedThisMonth}
          icon="users"
          tone="success"
        />
        <Metric
          label="Expired certificates"
          value={counts.expiredCertificates}
          icon="alert"
          tone="danger"
        />
        <Metric
          label="Pending exemptions"
          value={counts.pendingExemptions}
          icon="calendar"
          tone="warning"
        />
        <Metric
          label="Non-compliant persons"
          value={counts.nonCompliantPersons}
          icon="alert"
          tone="danger"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Panel>
          <PanelTitle>Courses</PanelTitle>
          <div className="text-2xl font-extrabold">{listCourses().length}</div>
        </Panel>
        <Panel>
          <PanelTitle>Certificates</PanelTitle>
          <div className="text-2xl font-extrabold">{listCertificates().length}</div>
        </Panel>
        <Panel>
          <PanelTitle>Exemptions</PanelTitle>
          <div className="text-2xl font-extrabold">{listExemptions().length}</div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle>Export training summary</PanelTitle>
        <PanelSub>
          Requires <code>training.export</code>. Output is logged to <code>console.info</code> — no
          portal records are mutated.
        </PanelSub>
        {canExport ? (
          <Button className="mt-3" variant="teal" onClick={handleExport}>
            Export summary
          </Button>
        ) : (
          <p className="mt-3 text-sm text-[#64748b]">
            You do not have <code>training.export</code> — contact your administrator.
          </p>
        )}
      </Panel>
    </div>
  );
}

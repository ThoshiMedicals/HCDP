"use client";

import { Button } from "@/components/ui/Button";
import { Metric } from "@/components/ui/Metric";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useStaffDoctors } from "../context";
import { assertM04Permission } from "../permissions";
import { listPeople } from "../services/person-service";
import { listCredentials } from "../services/credential-service";
import { listEngagements } from "../services/engagement-service";
import { listLeave } from "../services/leave-service";

export function ReportsSection() {
  const { actor, counts, pushToast, refreshKey } = useStaffDoctors();
  void refreshKey;

  const exportReport = () => {
    try {
      assertM04Permission(actor, "workforce.export");
      const payload = {
        counts,
        people: listPeople().length,
        engagements: listEngagements().length,
        credentials: listCredentials().length,
        leave: listLeave().length,
        exportedAt: new Date().toISOString(),
        exportedBy: actor.userId,
      };
      pushToast(`Export ready (${payload.people} people).`, "success");
      console.info("[m04-export]", payload);
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Export denied", "danger");
    }
  };

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="m-0 text-xl font-extrabold">Reports</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">Workforce counts and export (permission-gated).</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active staff" value={counts.activeStaff} icon="users" />
        <Metric label="Active doctors" value={counts.activeDoctors} icon="users" tone="info" />
        <Metric label="Blocked readiness" value={counts.blockedReadiness} icon="alert" tone="warning" />
        <Metric label="On leave" value={counts.onLeave} icon="calendar" />
      </div>
      <Panel>
        <PanelTitle>Export workforce summary</PanelTitle>
        <PanelSub>Requires workforce.export. Does not mutate portal records.</PanelSub>
        <Button className="mt-3" variant="teal" onClick={exportReport}>
          Export summary
        </Button>
      </Panel>
    </div>
  );
}

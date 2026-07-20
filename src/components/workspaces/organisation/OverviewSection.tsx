"use client";

import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { useOrganisation } from "@/lib/organisation/context";
import {
  ClickableMetric,
  EmergencyBanner,
  SectionHeader,
  SimpleChartBar,
  WarningBanner,
} from "./org-ui";

export function OverviewSection() {
  const { state, metrics, navigate, clinics } = useOrganisation();

  const usersByClinic = clinics.map((c) => ({
    label: c.shortName,
    value: state.users.filter((u) => u.primaryClinicId === c.id && u.status === "Active").length,
    tone: "info" as const,
  }));

  const usersByRole = Object.entries(
    state.users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {})
  )
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, tone: "default" as const }));

  const reviewCompletion = [
    { label: "Completed", value: state.reviews.filter((r) => r.status === "Completed").length, tone: "success" as const },
    { label: "Open / In progress", value: state.reviews.filter((r) => r.status !== "Completed" && r.status !== "Overdue").length, tone: "info" as const },
    { label: "Overdue", value: state.reviews.filter((r) => r.status === "Overdue").length, tone: "danger" as const },
  ];

  const permChanges = state.audit.filter((a) => a.entityType === "Permission" || a.entityType === "Approval").slice(0, 5);
  const tempExpiry = state.assignments.filter((a) => a.endDate && (a.type === "Temporary Cover" || a.type === "Emergency Access"));
  const alertsByRisk = (["Critical", "High", "Medium", "Low"] as const).map((r) => ({
    label: r,
    value: state.alerts.filter((a) => !a.resolved && a.risk === r).length,
    tone: (r === "Critical" ? "emergency" : r === "High" ? "danger" : r === "Medium" ? "warn" : "success") as "emergency" | "danger" | "warn" | "success",
  }));

  const clinicLifecycle = Object.entries(
    clinics.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value, tone: "default" as const }));

  const userStatus = Object.entries(
    state.users.reduce<Record<string, number>>((acc, u) => {
      acc[u.status] = (acc[u.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({
    label,
    value,
    tone: (label === "Locked" || label === "Access Review Required" ? "warn" : "default") as "warn" | "default",
  }));

  const accessWarnings = [
    ...state.users.filter((u) => u.accessIssues.length > 0).slice(0, 3).map((u) => `${u.firstName} ${u.lastName}: ${u.accessIssues[0]}`),
    ...clinics.filter((c) => c.warnings.length > 0).slice(0, 2).map((c) => `${c.shortName}: ${c.warnings[0]}`),
  ];

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Organisation overview"
        subtitle="Summary cards drill into filtered sections. Acting as Sarah Mitchell (Senior Administrator)."
      />

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <ClickableMetric
          label="Total Locations"
          value={metrics.totalLocations}
          icon="building"
          onClick={() => navigate("locations")}
        />
        <ClickableMetric
          label="Active Users"
          value={metrics.activeUsers}
          icon="users"
          tone="success"
          onClick={() => navigate("users", { status: "Active" })}
        />
        <ClickableMetric
          label="Users with Access Issues"
          value={metrics.usersWithAccessIssues}
          icon="alert"
          tone="warning"
          onClick={() => navigate("users", { status: "issues" })}
        />
        <ClickableMetric
          label="Access Reviews Due"
          value={metrics.accessReviewsDue}
          icon="shield"
          tone="info"
          onClick={() => navigate("access-reviews")}
        />
        <ClickableMetric
          label="Clinics with Warnings"
          value={metrics.clinicsWithWarnings}
          icon="building"
          tone="warning"
          onClick={() => navigate("locations", { status: "warnings" })}
        />
        <ClickableMetric
          label="Recent Permission Changes"
          value={metrics.recentPermissionChanges}
          icon="lock"
          onClick={() => navigate("audit", { query: "Permission" })}
        />
      </div>

      {accessWarnings.length > 0 ? (
        <Panel>
          <PanelTitle>Access warnings</PanelTitle>
          <PanelSub>Items needing attention across users and clinics.</PanelSub>
          <ul className="mt-3 grid gap-2 text-sm text-[#526479]">
            {accessWarnings.map((w) => (
              <li key={w}>
                <WarningBanner>{w}</WarningBanner>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {state.emergency.some((e) => e.active) ? (
        <EmergencyBanner>
          {state.emergency.filter((e) => e.active).length} emergency access session
          {state.emergency.filter((e) => e.active).length === 1 ? "" : "s"} active — open Security for monitoring.
        </EmergencyBanner>
      ) : null}

      <div className="grid gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
        <SimpleChartBar
          title="Users by clinic"
          items={usersByClinic}
          onItemClick={(label) => {
            const clinic = clinics.find((c) => c.shortName === label);
            navigate("users", { clinicId: clinic?.id, query: label });
          }}
        />
        <SimpleChartBar
          title="Users by role"
          items={usersByRole}
          onItemClick={(label) => navigate("users", { role: label })}
        />
        <SimpleChartBar
          title="Access-review completion"
          items={reviewCompletion}
          onItemClick={(label) =>
            navigate("access-reviews", {
              status: label.includes("Overdue") ? "Overdue" : label.includes("Completed") ? "Completed" : "OpenAndInProgress",
            })
          }
        />
        <SimpleChartBar
          title="Permission changes"
          items={
            permChanges.length
              ? permChanges.map((a) => ({ label: a.entityLabel.slice(0, 24), value: 1, tone: "info" as const }))
              : [{ label: "None recent", value: 0, tone: "default" as const }]
          }
          onItemClick={() => navigate("audit", { query: "Permission" })}
        />
        <SimpleChartBar
          title="Temporary access expiry"
          items={[
            { label: "With end date", value: tempExpiry.length, tone: "warn" as const },
            { label: "Emergency", value: tempExpiry.filter((a) => a.type === "Emergency Access").length, tone: "emergency" as const },
          ]}
          onItemClick={(label) =>
            navigate(label === "Emergency" ? "security" : "users", { query: label === "Emergency" ? "Emergency" : "Temporary" })
          }
        />
        <SimpleChartBar
          title="Security alerts by risk"
          items={alertsByRisk}
          onItemClick={(label) => navigate("security", { risk: label })}
        />
        <SimpleChartBar
          title="Clinic lifecycle status"
          items={clinicLifecycle}
          onItemClick={(label) => navigate("locations", { status: label })}
        />
        <SimpleChartBar
          title="User-account status"
          items={userStatus}
          onItemClick={(label) => navigate("users", { status: label })}
        />
      </div>
    </div>
  );
}

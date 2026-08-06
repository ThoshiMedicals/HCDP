"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CcCard, CcCardHeader, HealthBadge, PriorityBadge, StatBlock, TrendChartBlock, ExpandableBlock, inputClass } from "./cc-ui";
import type {
  ActivityItem,
  AssetFacilitiesSnapshot,
  ClinicHealthProfile,
  ComplianceItem,
  DigitalSecuritySnapshot,
  ExecutiveItem,
  FinanceSnapshot,
  IncidentRecord,
  PositiveMessage,
  PrivateNote,
  StaffingSnapshot,
  TaskDeliverySummary,
  TrendCard,
} from "@/lib/command-centre/types";
import type { Location } from "@/lib/types";
import { locationShort } from "@/lib/mock/data";
import { formatMoneyExact } from "@/lib/command-centre/utils";
import { cn } from "@/lib/cn";
import { comparePeriodLabel } from "@/lib/command-centre/period-engine";
import type { LayoutPeriod } from "@/lib/command-centre/types";

export function PositiveHealthSummary({ messages }: { messages: PositiveMessage[] }) {
  return (
    <CcCard accent="#047857">
      <CcCardHeader title="Positive Health Summary" subtitle="Short status messages and achievements" />
      <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-sm font-semibold",
              m.kind === "achievement"
                ? "cc-surface-success border"
                : "border-[var(--cc-card-line)] bg-[var(--cc-soft)]"
            )}
          >
            {m.period ? <span className="mr-2 text-[length:var(--type-control)] font-extrabold uppercase">{m.period}</span> : null}
            {m.message}
          </div>
        ))}
      </div>
    </CcCard>
  );
}

export function MyExecutiveActions({
  items,
  locations,
  onOpen,
  onDelegate,
  onAction,
}: {
  items: ExecutiveItem[];
  locations: Location[];
  onOpen: (actionId?: string) => void;
  onDelegate: (id: string) => void;
  onAction?: (id: string, verb: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 5);
  return (
    <CcCard accent="var(--hcdp-action)">
      <CcCardHeader
        title="My Executive Actions"
        subtitle="Approvals, escalations, decisions and delegated work awaiting final executive approval"
        actions={
          <Button small variant="soft" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show first 5" : "View All Executive Actions"}
          </Button>
        }
      />
      <div className="grid gap-2 px-4 pb-4 md:grid-cols-2 2xl:grid-cols-1">
        {visible.map((item) => (
          <div key={item.id} className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
            <div className="mb-1 flex flex-wrap gap-1.5">
              <Badge tone="info">{item.type}</Badge>
              {item.priority ? <PriorityBadge priority={item.priority} short /> : null}
              <span className="cc-text-warn text-[length:var(--type-control)] font-bold">Decision by {item.decisionBy}</span>
            </div>
            <strong className="block text-[13px] leading-snug">{item.title}</strong>
            <div className="mt-1 grid gap-0.5 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">
              <span>{locationShort(item.locationId, locations)}</span>
              {item.reason ? <span>Reason: {item.reason}</span> : null}
              <span>
                Requested by {item.requestedBy ?? "—"} · Responsible {item.responsible ?? "Neil"}
              </span>
              {item.attachments != null ? <span>Supporting documents: {item.attachments}</span> : null}
              <span>
                Delegation: {item.delegationStatus ?? (item.canDelegate ? "Available" : "Not available")}
                {item.finalApprovalRequired ? " · Final approval required" : ""}
              </span>
            </div>
            <div className="cc-action-btns mt-2">
              {item.actionId ? (
                <Button small variant="teal" onClick={() => onOpen(item.actionId)}>
                  Open Full Action
                </Button>
              ) : null}
              <Button small variant="line" onClick={() => onAction?.(item.id, "Approve")}>
                Approve
              </Button>
              <Button small variant="line" onClick={() => onAction?.(item.id, "Approve with Conditions")}>
                Approve with Conditions
              </Button>
              <details className="relative">
                <summary className="cc-ctrl cursor-pointer list-none text-[length:var(--type-control)]">More</summary>
                <div className="absolute left-0 top-[110%] z-20 w-[220px] rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-card)] p-1 shadow-lg">
                  {[
                    "Reject",
                    "Request More Information",
                    "Add Comment",
                    "Change Due Date",
                    "Escalate",
                    "Acknowledge",
                    "Mark Complete",
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
                      onClick={() => onAction?.(item.id, label)}
                    >
                      {label}
                    </button>
                  ))}
                  {item.canDelegate ? (
                    <button
                      type="button"
                      className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-[var(--cc-soft)]"
                      onClick={() => onDelegate(item.id)}
                    >
                      Delegate
                    </button>
                  ) : null}
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>
    </CcCard>
  );
}

const CLINIC_FTE_GUESS: Record<string, number> = {
  loc_baldhills: 14, loc_cannonhill: 12, loc_woolloongabba: 18, loc_eightmile: 13,
  loc_chapelhill: 15, loc_indooroopilly: 16, loc_forestlake: 11, loc_lawnton: 10, loc_beachmere: 8,
};
const CLINIC_INCOME_GUESS: Record<string, number> = {
  loc_baldhills: 52400, loc_cannonhill: 48100, loc_woolloongabba: 71200, loc_eightmile: 45600,
  loc_chapelhill: 53800, loc_indooroopilly: 61200, loc_forestlake: 39800, loc_lawnton: 35200, loc_beachmere: 0,
};
const CLINIC_ROOMS_GUESS: Record<string, number> = {
  loc_baldhills: 6, loc_cannonhill: 5, loc_woolloongabba: 8, loc_eightmile: 5,
  loc_chapelhill: 6, loc_indooroopilly: 7, loc_forestlake: 4, loc_lawnton: 4, loc_beachmere: 3,
};

export function ClinicOperationsPanel({
  health,
  locations,
  onOpenHealth,
}: {
  health: ClinicHealthProfile[];
  locations: Location[];
  onOpenHealth?: (locationId: string) => void;
}) {
  const groups = {
    "Operating Normally": health.filter(
      (h) => h.openingStatus !== "Temporarily Closed" && (h.overallScore ?? -1) >= 80 && !h.emergencyStatus
    ),
    "Attention Required": health.filter(
      (h) => h.openingStatus !== "Temporarily Closed" && (h.overallScore ?? -1) >= 65 && (h.overallScore ?? -1) < 80
    ),
    Urgent: health.filter(
      (h) => h.openingStatus !== "Temporarily Closed" && ((h.overallScore ?? -1) < 65 || h.emergencyStatus)
    ),
    "Temporarily Closed": health.filter((h) => h.openingStatus === "Temporarily Closed"),
  } as const;

  const ranked = [...health].sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));

  return (
    <CcCard accent="#1e40af">
      <CcCardHeader
        title="Clinic Operations & Comparison"
        subtitle="Overall 0–100% score across eight equal areas. Emergency status shown separately. Actual totals shown alongside fair / FTE and / room rates."
      />
      {/*
        Collapse earlier than sm: 2-col from 640px forces clinic cards past the main pane at
        768 short-height (VQA-C2-SHORT). Stack until lg; 2-col at lg; 4-col at xl+.
      */}
      <div className="grid grid-cols-1 gap-3 px-4 pb-4 lg:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(groups) as Array<keyof typeof groups>).map((g) => (
          <div key={g} className="min-w-0 max-w-full">
            <div className="mb-1.5 truncate text-[length:var(--type-control)] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">
              {g} ({groups[g].length})
            </div>
            <div className="grid min-w-0 gap-2">
              {groups[g].length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--cc-card-line)] px-3 py-4 text-center text-[length:var(--type-control)] text-[var(--cc-muted)]">
                  None
                </div>
              ) : null}
              {groups[g].map((h) => {
                const loc = locations.find((l) => l.id === h.locationId);
                const fte = CLINIC_FTE_GUESS[h.locationId] || 12;
                const rooms = CLINIC_ROOMS_GUESS[h.locationId] || 4;
                const income = CLINIC_INCOME_GUESS[h.locationId] || 0;
                return (
                  <div
                    key={h.locationId}
                    className="min-w-0 max-w-full overflow-hidden rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-2.5"
                  >
                    <div className="mb-1 flex min-w-0 items-start justify-between gap-2">
                      <strong className="min-w-0 truncate text-[13px]">{loc?.shortName}</strong>
                      <span className="shrink-0">
                        <HealthBadge band={h.override?.band ?? h.band} score={h.overallScore} compact />
                      </span>
                    </div>
                    {h.emergencyStatus ? (
                      <div className="cc-text-danger mb-1 text-[length:var(--type-control)] font-extrabold">
                        Emergency status active (separate from score)
                      </div>
                    ) : null}
                    {h.openingChecklist === "Late" ? (
                      <div className="cc-text-warn mb-1 text-[length:var(--type-control)] font-bold">Warning: opening checklist late</div>
                    ) : null}
                    {h.missingInfo?.length ? (
                      <div className="mb-1 break-words text-[length:var(--type-control)] text-[var(--cc-muted)]">
                        Data incomplete: {h.missingInfo.join(", ")} (score not reduced)
                      </div>
                    ) : null}
                    <div className="grid min-w-0 gap-0.5 break-words text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">
                      <span>
                        {h.openingStatus} · Checklist {h.openingChecklist}
                      </span>
                      <span>
                        Staffing {h.staffingStatus} · Rooms {h.roomsStatus} · Systems {h.systemsStatus}
                      </span>
                      <span>
                        Urgent {h.urgentIssues} · Overdue {h.overdueWork} · Manager {h.manager}
                      </span>
                      <span>
                        Trend {h.trend} · Strongest {h.strongest} · Weakest {h.weakest}
                      </span>
                      <span className="tabular-nums">
                        Income {formatMoneyExact(income)} · {formatMoneyExact(fte ? income / fte : 0)} / FTE ·{" "}
                        {formatMoneyExact(rooms ? income / rooms : 0)} / room
                      </span>
                    </div>
                    {onOpenHealth ? (
                      <Button small variant="line" className="mt-1.5 max-w-full" onClick={() => onOpenHealth(h.locationId)}>
                        View Health Breakdown
                      </Button>
                    ) : null}
                    <ExpandableBlock
                      title="Audit and override detail"
                      summary={`Last refreshed ${new Date(h.lastUpdate).toLocaleString("en-AU")}`}
                      className="mt-1.5"
                    >
                      {h.override ? (
                        <div className="cc-text-warn mb-1 text-[length:var(--type-control)] font-extrabold">Manager Override Active</div>
                      ) : null}
                      <div className="grid gap-0.5 text-[length:var(--type-control)] leading-snug text-[var(--cc-muted)]">
                        <span>Last refreshed {new Date(h.lastUpdate).toLocaleString("en-AU")}</span>
                      </div>
                    </ExpandableBlock>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="min-w-0 max-w-full border-t border-[var(--cc-card-line)] px-4 py-3">
        <h4 className="m-0 mb-2 text-[13px] font-extrabold">Ranked comparison (normalised)</h4>
        {/* min-w-0 required: bare overflow-x-auto expands to table min-w-[820px] and widens the executive grid */}
        <div className="min-w-0 max-w-full overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[length:var(--type-table)]">
            <thead>
              <tr className="text-[length:var(--type-table)] uppercase text-[var(--cc-muted)]">
                <th className="py-1 pr-2">Rank</th>
                <th className="pr-2">Clinic</th>
                <th className="pr-2">Score</th>
                <th className="pr-2">Income (actual)</th>
                <th className="pr-2">Income / FTE</th>
                <th className="pr-2">Income / room</th>
                <th className="pr-2">Urgent / 10 FTE</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((h, i) => {
                const fte = CLINIC_FTE_GUESS[h.locationId] || 12;
                const rooms = CLINIC_ROOMS_GUESS[h.locationId] || 4;
                const income = CLINIC_INCOME_GUESS[h.locationId] || 0;
                return (
                  <tr key={h.locationId} className="border-t border-[var(--cc-card-line)]">
                    <td className="py-1.5 font-bold">{i + 1}</td>
                    <td>{locations.find((l) => l.id === h.locationId)?.shortName}</td>
                    <td className="font-black tabular-nums">
                      {h.overallScore === null ? "—" : `${h.overallScore}%`}
                    </td>
                    <td className="tabular-nums">{formatMoneyExact(income)}</td>
                    <td className="tabular-nums">{formatMoneyExact(income / fte)}</td>
                    <td className="tabular-nums">{formatMoneyExact(income / rooms)}</td>
                    <td className="tabular-nums">{((h.urgentIssues / fte) * 10).toFixed(1)}</td>
                    <td>{h.trend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[length:var(--type-control)] text-[var(--cc-muted)]">
          Normalisation prevents larger clinics from looking worse simply because they have higher absolute volumes.
          Actual totals remain visible beside fair rates.
        </p>
      </div>
    </CcCard>
  );
}

function rollupStaffing(staffing: StaffingSnapshot[]) {
  const gapsByRole = new Map<string, number>();
  const nextSevenDayRisks: string[] = [];
  const coverRecommendations: Array<{ role: string; person: string; reason: string }> = [];
  const totals = staffing.reduce(
    (acc, s) => {
      for (const g of s.gapsByRole) gapsByRole.set(g.role, (gapsByRole.get(g.role) ?? 0) + g.gaps);
      for (const r of s.nextSevenDayRisks) if (!nextSevenDayRisks.includes(r)) nextSevenDayRisks.push(r);
      coverRecommendations.push(...s.coverRecommendations);
      return {
        rostered: acc.rostered + s.rostered,
        present: acc.present + s.present,
        absent: acc.absent + s.absent,
        late: acc.late + s.late,
        unfilled: acc.unfilled + s.unfilled,
        overtimeRisk: acc.overtimeRisk + s.overtimeRisk,
        onLeave: acc.onLeave + s.onLeave,
        agencyLocum: acc.agencyLocum + s.agencyLocum,
        doctorCoverage: acc.doctorCoverage + s.doctorCoverage,
        estimatedOvertimeCost: acc.estimatedOvertimeCost + s.estimatedOvertimeCost,
      };
    },
    {
      rostered: 0,
      present: 0,
      absent: 0,
      late: 0,
      unfilled: 0,
      overtimeRisk: 0,
      onLeave: 0,
      agencyLocum: 0,
      doctorCoverage: 0,
      estimatedOvertimeCost: 0,
    }
  );
  return {
    ...totals,
    gapsByRole: Array.from(gapsByRole.entries()).map(([role, gaps]) => ({ role, gaps })),
    nextSevenDayRisks,
    coverRecommendations,
  };
}

export function StaffingPanel({
  staffing,
  locations,
  onCreateFollowUp,
}: {
  staffing: StaffingSnapshot[];
  locations: Location[];
  onCreateFollowUp?: (locationId: string, cover: { role: string; person: string; reason: string }) => void;
}) {
  const org = rollupStaffing(staffing);
  return (
    <CcCard>
      <CcCardHeader
        title="Staffing & Roster"
        subtitle="Exact counts. Cover recommendations only — staff are not moved between clinics from this dashboard."
      />
      <div className="grid grid-cols-2 gap-2 px-4 pb-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatBlock label="Rostered" value={org.rostered} />
        <StatBlock label="Present" value={org.present} tone="success" />
        <StatBlock label="Absent" value={org.absent} tone={org.absent ? "warn" : "default"} />
        <StatBlock label="Late" value={org.late} />
        <StatBlock label="Unfilled" value={org.unfilled} tone={org.unfilled ? "danger" : "default"} />
        <StatBlock label="OT risk" value={org.overtimeRisk} />
        <StatBlock label="Leave" value={org.onLeave} />
        <StatBlock label="Agency/locum" value={org.agencyLocum} />
        <StatBlock label="Doctor coverage" value={org.doctorCoverage} />
        <StatBlock label="Est. OT cost" value={formatMoneyExact(org.estimatedOvertimeCost)} tone="warn" />
      </div>
      <div className="px-4 pb-3 text-xs">
        <div className="font-bold">Gaps by role (organisation)</div>
        <div className="mt-1 flex flex-wrap gap-2">
          {org.gapsByRole.map((g) => (
            <Badge key={g.role} tone={g.gaps ? "warn" : "success"}>
              {g.role}: {g.gaps}
            </Badge>
          ))}
          {!org.gapsByRole.length ? <span className="text-[var(--cc-muted)]">No role gaps reported.</span> : null}
        </div>
        <div className="mt-2 font-bold">Next 7-day risks (organisation)</div>
        <ul className="m-0 pl-4">
          {org.nextSevenDayRisks.map((r) => (
            <li key={r}>{r}</li>
          ))}
          {!org.nextSevenDayRisks.length ? <li className="text-[var(--cc-muted)]">No risks flagged.</li> : null}
        </ul>
        <div className="mt-2 font-bold">Recommended cover (organisation)</div>
        {org.coverRecommendations.length ? (
          <p className="m-0 leading-relaxed">
            {org.coverRecommendations.map((c) => `${c.role}: ${c.person} — ${c.reason}`).join(" · ")}
          </p>
        ) : (
          <p className="m-0 text-[var(--cc-muted)]">No cover recommended for the current filters.</p>
        )}
      </div>
      <div className="grid gap-2 px-4 pb-4">
        {staffing.map((s) => {
          const name = locationShort(s.locationId, locations);
          return (
            <ExpandableBlock
              key={s.locationId}
              title={name}
              summary={`Present ${s.present}/${s.rostered} · Unfilled ${s.unfilled} · OT risk ${s.overtimeRisk} · Est. OT ${formatMoneyExact(s.estimatedOvertimeCost)}`}
              defaultOpen={Boolean(s.coverRecommendations.length)}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                <StatBlock label="Rostered" value={s.rostered} />
                <StatBlock label="Present" value={s.present} tone="success" />
                <StatBlock label="Absent" value={s.absent} tone={s.absent ? "warn" : "default"} />
                <StatBlock label="Late" value={s.late} />
                <StatBlock label="Unfilled" value={s.unfilled} tone={s.unfilled ? "danger" : "default"} />
                <StatBlock label="OT risk" value={s.overtimeRisk} />
                <StatBlock label="Leave" value={s.onLeave} />
                <StatBlock label="Agency/locum" value={s.agencyLocum} />
                <StatBlock label="Doctor coverage" value={s.doctorCoverage} />
                <StatBlock label="Est. OT cost" value={formatMoneyExact(s.estimatedOvertimeCost)} tone="warn" />
              </div>
              <div className="mt-2 text-xs">
                <div className="font-bold">Gaps by role</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {s.gapsByRole.map((g) => (
                    <Badge key={g.role} tone={g.gaps ? "warn" : "success"}>
                      {g.role}: {g.gaps}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 font-bold">Next 7-day risks</div>
                <ul className="m-0 pl-4">
                  {s.nextSevenDayRisks.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {s.coverRecommendations.length ? (
                  <>
                    <div className="mt-2 font-bold">Recommended cover (open full shift action to apply)</div>
                    <ul className="m-0 space-y-1 pl-0 list-none">
                      {s.coverRecommendations.map((c) => (
                        <li
                          key={`${c.role}-${c.person}`}
                          className="flex flex-wrap items-center justify-between gap-1 rounded-lg border border-[var(--cc-card-line)] px-2 py-1.5"
                        >
                          <span>
                            {c.role}: {c.person} — {c.reason}
                          </span>
                          {onCreateFollowUp ? (
                            <Button small variant="line" onClick={() => onCreateFollowUp(s.locationId, c)}>
                              Create follow-up
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </ExpandableBlock>
          );
        })}
      </div>
    </CcCard>
  );
}

export function CompliancePanel({
  items,
  orgPercent,
  onTemporaryUse,
}: {
  items: ComplianceItem[];
  orgPercent: number;
  onTemporaryUse: (id: string) => void;
}) {
  const groups = ["Expired", "Due within 7 days", "Due within 30 days", "Due within 60 days"] as const;
  return (
    <CcCard>
      <CcCardHeader
        title="Compliance & Expiries"
        subtitle={`Organisation compliance ${orgPercent}%. Serious expired items create Urgent actions — people/equipment are not auto-blocked.`}
      />
      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <div key={g} className="min-w-0">
            <div className="mb-1.5 truncate text-[length:var(--type-control)] font-extrabold uppercase tracking-wide text-[var(--cc-muted)]">
              {g}
            </div>
            <div className="grid gap-2">
              {items
                .filter((i) => i.group === g)
                .map((i) => (
                  <div
                    key={i.id}
                    className={cn(
                      "rounded-xl border p-2.5 text-sm",
                      i.serious ? "cc-surface-danger border" : "border-[var(--cc-card-line)] bg-[var(--cc-soft)]"
                    )}
                  >
                    <strong className="block text-[13px] leading-snug">{i.title}</strong>
                    <span className="text-[length:var(--type-control)] text-[var(--cc-muted)]">
                      {i.subject} · Due {i.due}
                    </span>
                    {i.temporaryContinuedUse ? (
                      <p className="m-0 mt-1 text-[length:var(--type-control)] leading-snug">
                        Temporary continued use: {i.temporaryContinuedUse.reason}. Controls:{" "}
                        {i.temporaryContinuedUse.controls}
                      </p>
                    ) : i.serious ? (
                      <Button small variant="warn" className="mt-1.5" onClick={() => onTemporaryUse(i.id)}>
                        Record temporary continued use
                      </Button>
                    ) : null}
                  </div>
                ))}
              {!items.some((i) => i.group === g) ? (
                <div className="rounded-xl border border-dashed border-[var(--cc-card-line)] px-3 py-3 text-center text-[length:var(--type-control)] text-[var(--cc-muted)]">
                  None
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </CcCard>
  );
}

export function FinancePanel({
  finance,
  locations,
  onAction,
}: {
  finance: FinanceSnapshot[];
  locations?: Location[];
  onAction?: (target: string, verb: "Review" | "Approve" | "Reject" | "Request Information") => void;
}) {
  const org = finance.find((f) => f.locationId === "all") ?? finance[0];
  const clinics = finance.filter((f) => f.locationId !== "all");
  return (
    <CcCard accent="var(--hcdp-action)">
      <CcCardHeader
        title="Finance & Pay"
        subtitle="Organisation totals first — expand a clinic for full pay and variance detail"
      />
      <div className="grid gap-2 px-4 pb-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <StatBlock label="Income" value={formatMoneyExact(org.income)} tone="success" />
        <StatBlock label="Expenses" value={formatMoneyExact(org.expenses)} />
        <StatBlock label="Profit / Loss" value={formatMoneyExact(org.profitLoss)} tone="info" />
        <StatBlock label="Staff pay" value={formatMoneyExact(org.staffPay)} />
        <StatBlock label="Doctor pay" value={formatMoneyExact(org.doctorPay)} />
        <StatBlock label="Supplier payments" value={formatMoneyExact(org.supplierPayments)} />
        <StatBlock label="Pending approvals" value={org.pendingApprovals} tone="warn" />
        <StatBlock label="Pending amounts" value={formatMoneyExact(org.pendingAmounts)} />
        <StatBlock
          label="Forecast vs actual"
          value={formatMoneyExact(org.actual)}
          hint={`Forecast ${formatMoneyExact(org.forecast)} · Var ${formatMoneyExact(org.varianceDollar)} (${org.variancePercent}%)`}
        />
      </div>
      {org.alerts.length ? (
        <div className="cc-surface-danger mx-4 mb-3 rounded-xl border p-3">
          {org.alerts.map((a, i) => (
            <div key={a.title} className="mt-1 text-sm">
              Material unusual change — {a.title}: expected {formatMoneyExact(a.expected)}, actual{" "}
              {formatMoneyExact(a.actual)} ({formatMoneyExact(a.dollarDiff)}, {a.percentDiff}%)
              {onAction ? (
                <div className="cc-action-btns mt-1.5">
                  {(["Review", "Approve", "Reject", "Request Information"] as const).map((verb) => (
                    <Button key={verb} small variant="line" onClick={() => onAction(`alert:${i}`, verb)}>
                      {verb}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid gap-2 px-4 pb-4">
        {clinics.map((c) => (
          <ExpandableBlock
            key={c.locationId}
            title={locations ? locationShort(c.locationId, locations) : c.locationId.replace("loc_", "")}
            summary={`Income ${formatMoneyExact(c.income)} · P/L ${formatMoneyExact(c.profitLoss)} · Pending ${c.pendingApprovals}`}
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatBlock label="Income" value={formatMoneyExact(c.income)} tone="success" />
              <StatBlock label="Expenses" value={formatMoneyExact(c.expenses)} />
              <StatBlock label="P/L" value={formatMoneyExact(c.profitLoss)} tone="info" />
              <StatBlock label="Staff pay" value={formatMoneyExact(c.staffPay)} />
              <StatBlock label="Doctor pay" value={formatMoneyExact(c.doctorPay)} />
              <StatBlock label="Suppliers" value={formatMoneyExact(c.supplierPayments)} />
              <StatBlock label="Pending approvals" value={c.pendingApprovals} tone="warn" />
              <StatBlock label="Pending amounts" value={formatMoneyExact(c.pendingAmounts)} />
              <StatBlock
                label="Variance"
                value={formatMoneyExact(c.varianceDollar)}
                hint={`${c.variancePercent}% vs forecast`}
              />
            </div>
            {onAction ? (
              <div className="cc-action-btns mt-2">
                {(["Review", "Approve", "Reject", "Request Information"] as const).map((verb) => (
                  <Button key={verb} small variant="line" onClick={() => onAction(c.locationId, verb)}>
                    {verb}
                  </Button>
                ))}
              </div>
            ) : null}
          </ExpandableBlock>
        ))}
      </div>
    </CcCard>
  );
}

export function IncidentsPanel({
  incidents,
  onOpen,
  onAction,
}: {
  incidents: IncidentRecord[];
  onOpen: (actionId?: string) => void;
  onAction?: (id: string, verb: "Review RCA" | "Review CAPA" | "Close serious") => void;
}) {
  const [typeFilter, setTypeFilter] = useState<"All" | "Incident" | "Complaint">("All");
  const list = incidents.filter((i) => typeFilter === "All" || i.type === typeFilter);
  return (
    <CcCard>
      <CcCardHeader
        title="Incidents, Complaints & Risk"
        subtitle="Combined view with filters. No separate headline total of open risks."
        actions={
          <>
            {(["All", "Incident", "Complaint"] as const).map((t) => (
              <Button key={t} small variant={typeFilter === t ? "teal" : "line"} onClick={() => setTypeFilter(t)}>
                {t}
              </Button>
            ))}
          </>
        }
      />
      <div className="grid gap-2 px-4 pb-4">
        {list.map((i) => (
          <div key={i.id} className="rounded-xl border border-[var(--cc-card-line)] p-3">
            <div className="mb-1 flex flex-wrap gap-1.5">
              <Badge tone={i.serious ? "danger" : "warn"}>{i.type}</Badge>
              <Badge tone="info">{i.stage}</Badge>
            </div>
            <strong>{i.title}</strong>
            <div className="mt-1 grid gap-0.5 text-[length:var(--type-control)] text-[var(--cc-muted)] sm:grid-cols-2">
              <span>Investigator: {i.investigator}</span>
              <span>Due: {i.due}</span>
              <span>RCA: {i.rca}</span>
              <span>Corrective: {i.correctiveActions}</span>
              <span className="sm:col-span-2">Latest: {i.latestUpdate}</span>
              {i.executiveDecision ? <span>Executive decision: {i.executiveDecision}</span> : null}
            </div>
            {i.actionId ? (
              <Button small variant="soft" className="mt-2" onClick={() => onOpen(i.actionId)}>
                Open Full Action
              </Button>
            ) : null}
            {onAction ? (
              <div className="cc-action-btns mt-2">
                <Button small variant="line" onClick={() => onAction(i.id, "Review RCA")}>
                  Review RCA
                </Button>
                <Button small variant="line" onClick={() => onAction(i.id, "Review CAPA")}>
                  Review CAPA
                </Button>
                {i.serious ? (
                  <Button small variant="danger" onClick={() => onAction(i.id, "Close serious")}>
                    Close serious
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
        {!list.length ? (
          <div className="rounded-xl border border-dashed border-[var(--cc-card-line)] px-3 py-6 text-center text-sm text-[var(--cc-muted)]">
            No matching incidents or complaints for the current filters.
          </div>
        ) : null}
      </div>
    </CcCard>
  );
}

export function TasksDeliveryPanel({
  tasks,
  onPanelAction,
}: {
  tasks: TaskDeliverySummary[];
  onPanelAction?: (locationId: string, verb: "Create action" | "Assign" | "Escalate") => void;
}) {
  const org = tasks.find((t) => t.locationId === "all") ?? tasks[0];
  return (
    <CcCard>
      <CcCardHeader
        title="Tasks & Operational Delivery"
        subtitle="Tasks, checklists, meeting actions, opening/closing, room readiness and manager follow-up"
      />
      <div className="grid gap-2 px-4 pb-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatBlock label="Org completion" value={`${org.completionPercent}%`} tone="info" />
        <StatBlock label="Open tasks" value={org.openTasks} />
        <StatBlock label="Checklists due" value={org.checklistsDue} />
        <StatBlock label="Meeting actions" value={org.meetingActions} />
        <StatBlock label="Opening missed" value={org.openingMissed} tone={org.openingMissed ? "warn" : "success"} />
        <StatBlock label="Closing missed" value={org.closingMissed} />
        <StatBlock label="Room readiness gaps" value={org.roomReadinessGaps} />
        <StatBlock label="Manager follow-ups" value={org.managerFollowUps} />
      </div>
      {org.repeatedMissPattern ? (
        <div className="cc-surface-warn mx-4 mb-3 rounded-xl border p-3 text-sm font-semibold">
          Pattern rule: {org.repeatedMissPattern}
        </div>
      ) : null}
      <div className="grid gap-2 px-4 pb-4">
        {tasks
          .filter((t) => t.locationId !== "all")
          .map((t) => (
            <ExpandableBlock
              key={t.locationId}
              title={t.locationId.replace("loc_", "")}
              summary={`Completion ${t.completionPercent}% · Open ${t.openTasks} · Checklists ${t.checklistsDue}`}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatBlock label="Completion" value={`${t.completionPercent}%`} tone="info" />
                <StatBlock label="Open tasks" value={t.openTasks} />
                <StatBlock label="Checklists due" value={t.checklistsDue} />
                <StatBlock label="Meeting actions" value={t.meetingActions} />
                <StatBlock label="Opening missed" value={t.openingMissed} tone={t.openingMissed ? "warn" : "success"} />
                <StatBlock label="Closing missed" value={t.closingMissed} />
                <StatBlock label="Room gaps" value={t.roomReadinessGaps} />
                <StatBlock label="Manager follow-ups" value={t.managerFollowUps} />
              </div>
              {onPanelAction ? (
                <div className="cc-action-btns mt-2">
                  <Button small variant="teal" onClick={() => onPanelAction(t.locationId, "Create action")}>
                    Create action
                  </Button>
                  <Button small variant="line" onClick={() => onPanelAction(t.locationId, "Assign")}>
                    Assign
                  </Button>
                  <Button small variant="line" onClick={() => onPanelAction(t.locationId, "Escalate")}>
                    Escalate
                  </Button>
                </div>
              ) : null}
            </ExpandableBlock>
          ))}
      </div>
    </CcCard>
  );
}

export function AssetsPanel({
  assets,
  onPanelAction,
}: {
  assets: AssetFacilitiesSnapshot[];
  onPanelAction?: (locationId: string, verb: "Create action" | "Assign" | "Escalate") => void;
}) {
  const a = assets[0];
  const locId = a?.locationId ?? "all";
  return (
    <CcCard>
      <CcCardHeader
        title="Assets, Suppliers & Facilities"
        subtitle="Equipment, stock, rooms, printers, suppliers, work orders, servicing and calibration"
      />
      <div className="grid gap-2 px-4 pb-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatBlock label="Asset value" value={formatMoneyExact(a.assetValue)} />
        <StatBlock label="Unavailable equipment" value={a.unavailableEquipment} tone="danger" />
        <StatBlock label="Low stock" value={a.lowStock} tone="warn" />
        <StatBlock label="Service / calibration" value={a.serviceCalibrationDue} />
        <StatBlock label="Open work orders" value={a.openWorkOrders} />
        <StatBlock label="Supplier issues" value={a.supplierIssues} tone="warn" />
        <StatBlock label="Expected costs" value={formatMoneyExact(a.expectedCosts)} />
      </div>
      <ul className="mx-4 mb-3 list-disc pl-5 text-sm">
        {a.impactNotes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      {onPanelAction ? (
        <div className="cc-action-btns mx-4 mb-4">
          <Button small variant="teal" onClick={() => onPanelAction(locId, "Create action")}>
            Create action
          </Button>
          <Button small variant="line" onClick={() => onPanelAction(locId, "Assign")}>
            Assign
          </Button>
          <Button small variant="line" onClick={() => onPanelAction(locId, "Escalate")}>
            Escalate
          </Button>
        </div>
      ) : null}
    </CcCard>
  );
}

export function DigitalPanel({
  digital,
  onPanelAction,
}: {
  digital: DigitalSecuritySnapshot[];
  onPanelAction?: (locationId: string, verb: "Create action" | "Assign" | "Escalate") => void;
}) {
  return (
    <CcCard>
      <CcCardHeader
        title="Websites, Systems & Security"
        subtitle="Availability, outages, business impact and restoration estimate"
      />
      <div className="grid gap-3 px-4 pb-4">
        {digital.map((d) => (
          <div key={d.locationId} className="rounded-xl border border-[var(--cc-card-line)] p-3">
            <strong className="block mb-2">{d.locationId === "all" ? "Organisation" : d.locationId.replace("loc_", "")}</strong>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              <StatBlock label="Availability" value={`${d.availabilityPercent}%`} />
              <StatBlock label="Active outages" value={d.activeOutages} tone={d.activeOutages ? "danger" : "success"} />
              <StatBlock label="Websites" value={d.websites} />
              <StatBlock label="Internet" value={d.internet} tone={d.internet === "Down" ? "danger" : "default"} />
              <StatBlock label="Phones" value={d.phones} />
              <StatBlock label="Practice systems" value={d.practiceSystems} />
              <StatBlock label="Backup" value={d.backupStatus} />
            </div>
            <p className="m-0 mt-2 text-sm">
              Impact: {d.businessImpact}
              {d.restorationEstimate ? ` · Restoration estimate: ${d.restorationEstimate}` : ""}
            </p>
            {onPanelAction ? (
              <div className="cc-action-btns mt-2">
                <Button small variant="teal" onClick={() => onPanelAction(d.locationId, "Create action")}>
                  Create action
                </Button>
                <Button small variant="line" onClick={() => onPanelAction(d.locationId, "Assign")}>
                  Assign
                </Button>
                <Button small variant="line" onClick={() => onPanelAction(d.locationId, "Escalate")}>
                  Escalate
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </CcCard>
  );
}

export function TrendsPanel({ trends, period }: { trends: TrendCard[]; period?: LayoutPeriod }) {
  const compare = period ? comparePeriodLabel(period) : "Previous period";
  return (
    <CcCard accent="var(--hcdp-action)">
      <CcCardHeader
        title="Performance Trends"
        subtitle={`Every chart has title, period, comparison (${compare}), labels and View as Table`}
      />
      <div className="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
        {trends.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3",
              t.size === "Large" && "md:col-span-2 xl:col-span-3",
              t.size === "Medium" && "xl:col-span-1"
            )}
          >
            <div className="mb-1 text-[length:var(--type-control)] font-extrabold uppercase text-[var(--cc-muted)]">
              {t.area} · {t.size}
            </div>
            {(t.size === "Medium" || t.size === "Large") && (
              <TrendChartBlock
                title={t.title}
                period={period ?? "Today"}
                comparison={compare}
                series={t.series}
                values={t.result}
                change={t.change}
                direction={t.direction}
                summary={t.explanation}
                tableRows={t.tableRows}
              />
            )}
            {t.size === "Small" ? (
              <div className="flex items-start justify-between gap-2">
                <strong>{t.title}</strong>
                <div className="text-right">
                  <div className="text-2xl font-black">{t.result}</div>
                  <div
                    className={cn(
                      "text-xs font-bold",
                      t.direction === "up"
                        ? "cc-text-success"
                        : t.direction === "down"
                          ? "cc-text-danger"
                          : "text-[var(--cc-muted)]"
                    )}
                  >
                    {t.change}
                  </div>
                </div>
              </div>
            ) : null}
            {t.size === "Large" ? (
              <div className="mt-2 grid gap-2 lg:grid-cols-2">
                <div>
                  <div className="text-[length:var(--type-control)] font-bold">Clinic comparison</div>
                  <ul className="m-0 pl-4 text-xs">
                    {t.clinicComparison.map((c) => (
                      <li key={c.clinic}>
                        {c.clinic}: {c.value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[length:var(--type-control)] font-bold">Recommendations</div>
                  <ul className="m-0 pl-4 text-xs">
                    {t.recommendations.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </CcCard>
  );
}

export function RecentActivityPanel({
  items,
  onOpen,
  onPinRead,
}: {
  items: ActivityItem[];
  onOpen: (actionId?: string) => void;
  onPinRead: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"All" | "Critical" | "High">("All");
  const list = items
    .filter((i) => filter === "All" || i.importance === filter)
    .sort((a, b) => Number(!!b.pinned && !b.read) - Number(!!a.pinned && !a.read))
    .slice(0, 10);
  return (
    <CcCard>
      <CcCardHeader
        title="Recent Activity"
        subtitle="Only important updates — default 10. Pinned until read, acknowledged or actioned."
        actions={
          <>
            {(["All", "Critical", "High"] as const).map((f) => (
              <Button key={f} small variant={filter === f ? "teal" : "line"} onClick={() => setFilter(f)}>
                {f}
              </Button>
            ))}
          </>
        }
      />
      <div className="grid gap-2 px-4 pb-4">
        {list.map((i) => (
          <div key={i.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[var(--cc-card-line)] p-3">
            <div>
              <div className="mb-1 flex flex-wrap gap-1.5">
                <Badge tone={i.importance === "Critical" ? "danger" : i.importance === "High" ? "warn" : "info"}>
                  {i.importance}
                </Badge>
                {i.pinned && !i.read ? <Badge tone="teal">Pinned</Badge> : null}
              </div>
              <strong className="block text-sm">{i.title}</strong>
              <span className="text-[length:var(--type-control)] text-[var(--cc-muted)]">
                {new Date(i.at).toLocaleString("en-AU")} · {i.summary}
              </span>
            </div>
            <div className="flex gap-1.5">
              {i.actionId ? (
                <Button small variant="soft" onClick={() => onOpen(i.actionId)}>
                  Open
                </Button>
              ) : null}
              <Button small variant="line" onClick={() => onPinRead(i.id)}>
                Mark read
              </Button>
            </div>
          </div>
        ))}
      </div>
    </CcCard>
  );
}

export function PrivateNotesCard({
  notes,
  onSave,
  onDelete,
  onUpdate,
}: {
  notes: PrivateNote[];
  onSave: (note: PrivateNote) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (note: PrivateNote) => void;
}) {
  const [cardId, setCardId] = useState("priority");
  const [text, setText] = useState("");
  const [reminderDraft, setReminderDraft] = useState<Record<string, string>>({});

  function noteKey(n: PrivateNote) {
    return n.id ?? `${n.cardId}-${n.note}`;
  }

  return (
    <CcCard>
      <CcCardHeader
        title="Private notes"
        subtitle="Visible only to the Owner/Director — not shared with clinic teams"
      />
      <div className="grid gap-2 px-4 pb-4">
        <select className={inputClass} value={cardId} onChange={(e) => setCardId(e.target.value)}>
          <option value="priority">Priority Summary</option>
          <option value="finance">Finance & Pay</option>
          <option value="executive">My Executive Actions</option>
        </select>
        <textarea className={inputClass} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Personal reminder…" />
        <Button
          small
          variant="line"
          onClick={() => {
            if (!text.trim()) return;
            onSave({ id: `pn-${Date.now()}`, cardId, note: text.trim() });
            setText("");
          }}
        >
          Save private note
        </Button>
        {notes.map((n) => {
          const key = noteKey(n);
          return (
            <div key={key} className="rounded-lg border border-dashed border-[var(--cc-card-line)] p-2 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <span className="font-bold">{n.cardId}: </span>
                  {n.note}
                  {n.reminderAt ? (
                    <div className="mt-0.5 text-[length:var(--type-control)] font-semibold cc-text-warn">
                      Reminder: {new Date(n.reminderAt).toLocaleString("en-AU")}
                    </div>
                  ) : null}
                </div>
                {onDelete && n.id ? (
                  <Button small variant="line" onClick={() => onDelete(n.id!)}>
                    Delete
                  </Button>
                ) : null}
              </div>
              {onUpdate && n.id ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={reminderDraft[key] ?? (n.reminderAt ? n.reminderAt.slice(0, 16) : "")}
                    onChange={(e) => setReminderDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    aria-label="Reminder date and time"
                  />
                  <Button
                    small
                    variant="soft"
                    onClick={() => {
                      const at = reminderDraft[key];
                      if (!at) return;
                      onUpdate({ ...n, reminderAt: new Date(at).toISOString() });
                    }}
                  >
                    Add reminder
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </CcCard>
  );
}

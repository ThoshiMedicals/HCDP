"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Field, HealthBadge, inputClass, ExpandableBlock } from "./cc-ui";
import type {
  ClinicHealthProfile,
  HealthAreaDetail,
  HealthBand,
  HealthOverrideRecord,
} from "@/lib/command-centre/types";
import type { Location } from "@/lib/types";
import { locationShort } from "@/lib/mock/data";
import { HEALTH_AREA_ORDER } from "@/lib/command-centre/period-engine";
import { cn } from "@/lib/cn";

function bandFromScore(score: number | null): HealthBand {
  if (score === null) return "Data incomplete";
  if (score >= 85) return "Healthy";
  if (score >= 75) return "On Track";
  if (score >= 60) return "Attention Required";
  return "Urgent Review";
}

function buildAreaDetails(profile: ClinicHealthProfile): HealthAreaDetail[] {
  if (profile.areaDetails?.length) return profile.areaDetails;
  return HEALTH_AREA_ORDER.map((area) => {
    const today = profile.areas.find((a) => a.area === area)?.score ?? null;
    const yesterday = profile.yesterdayAreas?.find((a) => a.area === area)?.score ?? null;
    const change = today != null && yesterday != null ? today - yesterday : null;
    return {
      area,
      todayScore: today,
      yesterdayScore: yesterday,
      change,
      status: bandFromScore(today),
      positiveFactors:
        today != null && today >= 80
          ? [`${area} tracking within acceptable range`, "No emergency flags in this area"]
          : [`${area} partial positives recorded`],
      reducedReasons:
        today != null && today < 75
          ? [`Score below target for ${area}`, profile.weakest === area ? "Weakest organisational area today" : "Variance vs yesterday"]
          : today === null
            ? ["Source fields incomplete — excluded from overall mean"]
            : [],
      attentionItems:
        today != null && today < 70
          ? [`Review ${area} contributing records`, `${profile.urgentIssues} clinic urgent issues may relate`]
          : [],
      dataCompleteness: today === null ? "Incomplete" : "Complete for demonstration",
      lastUpdated: profile.lastUpdate,
      contributingRecords: [
        { id: `${area}-1`, label: `${area} source snapshot`, actionId: undefined },
        { id: `${area}-2`, label: `Related ${locationShort(profile.locationId, [])} activity` },
      ],
    };
  });
}

export function HealthBreakdownDrawer({
  open,
  profile,
  locations,
  onClose,
  onRequestUpdate,
  onCreateAction,
  onAssignFollowUp,
  onMarkNotRequired,
  onAddExecutiveNote,
  onOpenRecords,
  onOverride,
  onWithdrawOverride,
}: {
  open: boolean;
  profile: ClinicHealthProfile | null;
  locations: Location[];
  onClose: () => void;
  onRequestUpdate: () => void;
  onCreateAction: () => void;
  onAssignFollowUp: () => void;
  onMarkNotRequired: () => void;
  onAddExecutiveNote: (note: string) => void;
  onOpenRecords: (area: string) => void;
  onOverride: (payload: HealthOverrideRecord) => void;
  onWithdrawOverride: () => void;
}) {
  if (!profile) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Health Breakdown — ${locationShort(profile.locationId, locations)}`}
      subtitle="Eight equal areas · 12.5% each · incomplete areas excluded from the mean"
    >
      <HealthBreakdownBody
        key={profile.locationId + String(profile.override?.recordedAt ?? "")}
        profile={profile}
        locations={locations}
        onRequestUpdate={onRequestUpdate}
        onCreateAction={onCreateAction}
        onAssignFollowUp={onAssignFollowUp}
        onMarkNotRequired={onMarkNotRequired}
        onAddExecutiveNote={onAddExecutiveNote}
        onOpenRecords={onOpenRecords}
        onOverride={onOverride}
        onWithdrawOverride={onWithdrawOverride}
      />
    </Drawer>
  );
}

function HealthBreakdownBody({
  profile,
  locations,
  onRequestUpdate,
  onCreateAction,
  onAssignFollowUp,
  onMarkNotRequired,
  onAddExecutiveNote,
  onOpenRecords,
  onOverride,
  onWithdrawOverride,
}: {
  profile: ClinicHealthProfile;
  locations: Location[];
  onRequestUpdate: () => void;
  onCreateAction: () => void;
  onAssignFollowUp: () => void;
  onMarkNotRequired: () => void;
  onAddExecutiveNote: (note: string) => void;
  onOpenRecords: (area: string) => void;
  onOverride: (payload: HealthOverrideRecord) => void;
  onWithdrawOverride: () => void;
}) {
  const areas = useMemo(() => buildAreaDetails(profile), [profile]);
  const [execNote, setExecNote] = useState("");
  const [proposed, setProposed] = useState<HealthBand>(profile.band);
  const [reason, setReason] = useState("");
  const [startAt, setStartAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [expiry, setExpiry] = useState("");
  const [attachment, setAttachment] = useState("");
  const [manager, setManager] = useState(profile.manager || "Neil");
  const [reviewDate, setReviewDate] = useState("");
  const [affected, setAffected] = useState<string[]>([profile.locationId]);

  const change =
    profile.overallScore != null && profile.yesterdayScore != null
      ? profile.overallScore - profile.yesterdayScore
      : null;

  function toggleClinic(id: string) {
    setAffected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Today" value={profile.overallScore === null ? "—" : `${profile.overallScore}%`} />
        <Stat label="Yesterday" value={profile.yesterdayScore == null ? "—" : `${profile.yesterdayScore}%`} />
        <Stat
          label="Change"
          value={change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`}
          tone={change === null ? undefined : change >= 0 ? "success" : "danger"}
        />
        <div className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
          <div className="text-[length:var(--type-meta)] font-bold uppercase text-[var(--cc-muted)]">Automatic status</div>
          <div className="mt-1">
            <HealthBadge band={profile.band} score={profile.overallScore} />
          </div>
          {profile.emergencyStatus ? (
            <div className="cc-text-danger mt-1 text-[length:var(--type-control)] font-extrabold">Emergency (separate)</div>
          ) : null}
        </div>
      </div>

      {profile.override ? (
        <div className="cc-surface-warn rounded-xl border p-3 text-sm">
          <strong>Approved override (separate from automatic)</strong>
          <p className="m-0 mt-1 text-[length:var(--type-control)]">
            Automatic remains <strong>{profile.override.automaticBand}</strong>. Override:{" "}
            <strong>{profile.override.band}</strong>
          </p>
          <p className="m-0 mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">
            Reason: {profile.override.reason}. Start {new Date(profile.override.startAt).toLocaleString("en-AU")} ·
            Expires {new Date(profile.override.expiry).toLocaleString("en-AU")}. Manager{" "}
            {profile.override.approvingManager}. Review {profile.override.reviewDate || "—"}.
          </p>
          <Button small variant="line" className="mt-2" onClick={onWithdrawOverride}>
            Withdraw override
          </Button>
        </div>
      ) : null}

      <div className="grid gap-2">
        <h4 className="m-0 text-[13px] font-extrabold">Eight health areas</h4>
        {areas.map((a) => (
          <ExpandableBlock
            key={a.area}
            title={a.area}
            summary={`Today ${a.todayScore ?? "—"}% · Yesterday ${a.yesterdayScore ?? "—"}% · ${
              a.change == null ? "—" : `${a.change > 0 ? "+" : ""}${a.change}%`
            } · ${a.status}`}
          >
            <div className="grid gap-2 text-[length:var(--type-control)]">
              <div className="flex flex-wrap gap-2">
                <HealthBadge band={a.status} score={a.todayScore} />
                <span className="text-[var(--cc-muted)]">Completeness: {a.dataCompleteness}</span>
                <span className="text-[var(--cc-muted)]">
                  Updated {new Date(a.lastUpdated).toLocaleString("en-AU")}
                </span>
              </div>
              <ListBlock title="Positive factors" items={a.positiveFactors} />
              <ListBlock title="Reasons for reduced score" items={a.reducedReasons} />
              <ListBlock title="Items requiring attention" items={a.attentionItems} />
              <div>
                <div className="mb-1 font-extrabold">Contributing records</div>
                <ul className="m-0 pl-4 text-[var(--cc-muted)]">
                  {a.contributingRecords.map((r) => (
                    <li key={r.id}>{r.label}</li>
                  ))}
                </ul>
                <Button small variant="line" className="mt-2" onClick={() => onOpenRecords(a.area)}>
                  Open Contributing Records
                </Button>
              </div>
            </div>
          </ExpandableBlock>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button small variant="line" onClick={onRequestUpdate}>
          Request Update
        </Button>
        <Button small variant="teal" onClick={onCreateAction}>
          Create Action
        </Button>
        <Button small variant="soft" onClick={onAssignFollowUp}>
          Assign Follow-up
        </Button>
        <Button small variant="line" onClick={onMarkNotRequired}>
          Mark Not Required
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--cc-card-line)] p-3">
        <h4 className="m-0 text-[13px] font-extrabold">Add Executive Note</h4>
        <textarea
          className={`${inputClass} mt-2`}
          rows={2}
          value={execNote}
          onChange={(e) => setExecNote(e.target.value)}
          placeholder="Executive note for this clinic health profile"
        />
        <Button
          small
          variant="teal"
          className="mt-2"
          disabled={!execNote.trim()}
          onClick={() => {
            onAddExecutiveNote(execNote.trim());
            setExecNote("");
          }}
        >
          Save executive note
        </Button>
      </div>

      <div className="rounded-xl border border-[var(--cc-card-line)] p-3">
        <h4 className="m-0 text-[13px] font-extrabold">Temporary manager override</h4>
        <p className="m-0 mt-1 text-[length:var(--type-control)] text-[var(--cc-muted)]">
          Password confirmation is a demonstration until real authentication exists. Automatic status remains visible
          after approval.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Automatic calculated status">
            <input className={inputClass} value={profile.band} readOnly />
          </Field>
          <Field label="Proposed override status">
            <select className={inputClass} value={proposed} onChange={(e) => setProposed(e.target.value as HealthBand)}>
              {(
                ["Healthy", "On Track", "Attention Required", "Urgent Review", "Data incomplete"] as HealthBand[]
              ).map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Start date and time">
            <input type="datetime-local" className={inputClass} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </Field>
          <Field label="Expiry date and time">
            <input type="datetime-local" className={inputClass} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </Field>
          <Field label="Approving manager">
            <input className={inputClass} value={manager} onChange={(e) => setManager(e.target.value)} />
          </Field>
          <Field label="Review date">
            <input type="date" className={inputClass} value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Written reason" className="mt-2">
          <textarea className={inputClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Field label="Supporting attachment (placeholder)" className="mt-2">
          <input
            className={inputClass}
            placeholder="Filename or evidence reference"
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
          />
        </Field>
        <Field label="Affected clinics" className="mt-2">
          <div className="flex max-h-28 flex-wrap gap-2 overflow-auto rounded-xl border border-[var(--cc-card-line)] p-2">
            {locations.map((l) => (
              <label key={l.id} className="flex items-center gap-1 text-xs font-semibold">
                <input type="checkbox" checked={affected.includes(l.id)} onChange={() => toggleClinic(l.id)} />
                {l.shortName}
              </label>
            ))}
          </div>
        </Field>
        <Button
          small
          variant="warn"
          className="mt-3"
          disabled={!reason.trim() || !expiry || !manager.trim() || !affected.length}
          onClick={() =>
            onOverride({
              band: proposed,
              automaticBand: profile.band,
              reason: reason.trim(),
              startAt: new Date(startAt).toISOString(),
              expiry: new Date(expiry).toISOString(),
              attachmentName: attachment.trim() || undefined,
              approvingManager: manager.trim(),
              reviewDate,
              affectedClinicIds: affected,
              recordedBy: "Neil",
              recordedAt: new Date().toISOString(),
            })
          }
        >
          Apply override (demo password next)
        </Button>
      </div>

      {profile.auditTimeline?.length ? (
        <div>
          <h4 className="m-0 mb-1 text-[13px] font-extrabold">Local audit timeline</h4>
          <ul className="m-0 space-y-1 pl-0 text-[length:var(--type-control)] text-[var(--cc-muted)]">
            {profile.auditTimeline.map((t) => (
              <li key={t.id} className="list-none rounded-lg border border-[var(--cc-card-line)] px-2 py-1.5">
                <strong className="text-[var(--cc-ink)]">{t.event}</strong> · {t.actor} ·{" "}
                {new Date(t.at).toLocaleString("en-AU")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
      <div className="text-[length:var(--type-meta)] font-bold uppercase text-[var(--cc-muted)]">{label}</div>
      <div
        className={cn(
          "mt-1 text-[18px] font-black tabular-nums",
          tone === "success" && "cc-text-success",
          tone === "danger" && "cc-text-danger"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-0.5 font-extrabold">{title}</div>
      {items.length ? (
        <ul className="m-0 pl-4 text-[var(--cc-muted)]">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[var(--cc-muted)]">None recorded.</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { CcCard, CcCardHeader } from "./cc-ui";
import { BackendHint } from "./CcStates";
import type { AiFeedback, AiFinding } from "@/lib/command-centre/types";

const FEEDBACK: AiFeedback[] = [
  "Useful Finding",
  "Not Relevant",
  "Already Resolved",
  "Incorrect Priority",
  "Missing Context",
  "Correct Information",
];

export function AiBriefing({
  findings,
  onFeedback,
  onOpenAction,
  onCreateAction,
  generatedAt,
  clinicLabel,
  period,
}: {
  findings: AiFinding[];
  onFeedback: (id: string, feedback: AiFeedback) => void;
  onOpenAction: (actionId: string) => void;
  onCreateAction: () => void;
  generatedAt: Date;
  clinicLabel: string;
  period: string;
}) {
  const [open, setOpen] = useState(false);
  const top = findings.slice(0, 5);

  return (
    <>
      <CcCard accent="#0f3f7a">
        <CcCardHeader
          title="AI Executive Briefing"
          subtitle="Short findings only. Feedback never silently changes source records."
          actions={
            <Button small variant="soft" onClick={() => setOpen(true)}>
              Open Full Briefing
            </Button>
          }
        />
        <div className="grid gap-2 px-4 pb-4">
          {top.map((f) => (
            <div key={f.id} className="rounded-xl border border-[var(--cc-card-line)] bg-[var(--cc-soft)] p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    f.label === "Action Required"
                      ? "danger"
                      : f.label === "Watch Closely"
                        ? "warn"
                        : f.label === "Positive Result"
                          ? "success"
                          : "info"
                  }
                >
                  {f.label}
                </Badge>
                {f.feedback ? (
                  <span className="text-[10px] font-bold text-[var(--cc-muted)]">Feedback: {f.feedback}</span>
                ) : null}
              </div>
              <p className="m-0 text-[13px] font-semibold leading-snug text-[var(--cc-ink)]">{f.text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {f.relatedActionId ? (
                  <Button small variant="line" onClick={() => onOpenAction(f.relatedActionId!)}>
                    Open related action
                  </Button>
                ) : null}
                <Button small variant="soft" onClick={onCreateAction}>
                  Create Action
                </Button>
                <Button small variant="line" disabled title="Evidence retrieval requires a future AI backend">
                  View Evidence
                </Button>
                <Button small variant="line" disabled title="Ask AI chat requires a future AI backend">
                  Ask AI
                </Button>
                <Button small variant="line" disabled title="Assignment workflow requires a future backend">
                  Assign
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="AI feedback">
                {FEEDBACK.map((fb) => (
                  <Button
                    key={fb}
                    small
                    variant={f.feedback === fb ? "teal" : "line"}
                    onClick={() => onFeedback(f.id, fb)}
                  >
                    {fb}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <BackendHint>
            AI generation, evidence retrieval and Ask AI chat require a future backend connection. Feedback is stored
            locally in this demonstration only.
          </BackendHint>
        </div>
      </CcCard>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Full AI Executive Briefing"
        subtitle={`${clinicLabel} · ${period} · Generated ${generatedAt.toLocaleString("en-AU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Australia/Brisbane",
        })}`}
      >
        <div className="grid gap-3">
          <section>
            <h4 className="m-0 text-[13px] font-extrabold">Executive summary</h4>
            <p className="m-0 mt-1 text-sm text-[var(--cc-muted)]">
              Beachmere emergency closure and Indooroopilly staffing/finance pressure are the main organisation risks
              today. Most other clinics remain healthy.
            </p>
          </section>
          {[
            ["Urgent matters", findings.filter((f) => f.label === "Action Required")],
            ["Watch closely", findings.filter((f) => f.label === "Watch Closely")],
            ["Positive achievements", findings.filter((f) => f.label === "Positive Result")],
            ["Recommended management actions", findings.filter((f) => f.label === "Recommendation")],
          ].map(([title, list]) => (
            <section key={String(title)}>
              <h4 className="m-0 text-[13px] font-extrabold">{title as string}</h4>
              <ul className="mt-1 mb-0 pl-4 text-sm">
                {(list as AiFinding[]).map((f) => (
                  <li key={f.id} className="mb-1">
                    {f.text}
                    {f.relatedActionId ? (
                      <Button
                        small
                        variant="line"
                        className="ml-2"
                        onClick={() => {
                          setOpen(false);
                          onOpenAction(f.relatedActionId!);
                        }}
                      >
                        Open
                      </Button>
                    ) : null}
                  </li>
                ))}
                {!(list as AiFinding[]).length ? <li className="text-[var(--cc-muted)]">None in this briefing.</li> : null}
              </ul>
            </section>
          ))}
          <section>
            <h4 className="m-0 text-[13px] font-extrabold">Information sources</h4>
            <p className="m-0 mt-1 text-[12px] text-[var(--cc-muted)]">
              Demonstration seed: actions, staffing, compliance, finance, incidents, digital availability. Live module
              feeds require a future backend connection.
            </p>
          </section>
        </div>
      </Drawer>
    </>
  );
}

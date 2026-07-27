"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useRoster } from "../context";
import { hasM05Permission } from "../permissions";
import {
  listPublicationsForActor,
  recomputePublicationAckStatus,
} from "../services/publication-service";
import { acknowledgePublication } from "../services/acknowledgement-service";
import * as store from "../repository/local-store";
import type { RosterPublication } from "../types/domain";
import {
  EmptyState,
  OfflineState,
  RestrictedState,
  ValidationErrorState,
} from "../components/ux";

export function PublishedHistorySection() {
  const { actor, bump, pushToast, refreshKey } = useRoster();
  void refreshKey;

  const canView = hasM05Permission(actor, "roster.view");
  const canAcknowledge = hasM05Permission(actor, "roster.acknowledge");

  const [ackFor, setAckFor] = useState<string | null>(null);
  const [ackPerson, setAckPerson] = useState("");
  const [ackNote, setAckNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const publications = useMemo<RosterPublication[]>(() => {
    if (!canView) return [];
    try {
      return listPublicationsForActor(actor).sort(
        (a, b) => b.publishedAt.localeCompare(a.publishedAt)
      );
    } catch {
      return [];
    }
  }, [canView, actor, refreshKey]);

  const handleAcknowledge = (pub: RosterPublication, outcome: "acknowledged" | "declined") => {
    if (!ackPerson.trim()) {
      setErrors(["Act-as person id is required."]);
      return;
    }
    setErrors([]);
    try {
      acknowledgePublication(actor, {
        publicationId: pub.id,
        publicationVersion: pub.publicationVersion,
        outcome,
        note: ackNote.trim() || undefined,
        actAsPersonId: ackPerson.trim(),
      });
      recomputePublicationAckStatus(pub.id);
      setAckFor(null);
      setAckPerson("");
      setAckNote("");
      bump();
      pushToast(`Publication ${outcome}.`, outcome === "acknowledged" ? "success" : "warn");
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Acknowledge failed", "danger");
    }
  };

  if (!canView) {
    return (
      <div className="grid gap-4">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Published & History</h2>
        </div>
        <RestrictedState permission="roster.view" />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <OfflineState />
      <div>
        <h2 className="m-0 text-xl font-extrabold text-[var(--ink)]">Published & History</h2>
        <p className="m-0 mt-1 text-sm text-[#526479]">
          Publications are IMMUTABLE. Ack status is DERIVED from acknowledgement rows —
          period stays in <code>published</code> while acks are in flight.
        </p>
      </div>

      {publications.length === 0 ? (
        <EmptyState
          title="No publications yet"
          description="Publish a period from services or seed data to see history here."
        />
      ) : (
        <Panel pad={false}>
          <div className="border-b border-[var(--line)] px-5 py-3">
            <PanelTitle>Publications</PanelTitle>
            <PanelSub>Most recent first. Superseded rows retained for audit.</PanelSub>
          </div>
          <Table>
            <THead>
              <Th>Publication</Th>
              <Th>Version</Th>
              <Th>Published at</Th>
              <Th>Ack status</Th>
              <Th>Assignments</Th>
              <Th>Warnings</Th>
              <Th>Actions</Th>
            </THead>
            <tbody>
              {publications.map((pub) => {
                const acks = store.listAcknowledgements(pub.id);
                return (
                  <tr key={pub.id}>
                    <Td className="font-mono text-xs">{pub.id}</Td>
                    <Td>v{pub.publicationVersion}</Td>
                    <Td className="text-xs">{pub.publishedAt}</Td>
                    <Td>
                      <Badge
                        tone={
                          pub.acknowledgementStatus === "full"
                            ? "success"
                            : pub.acknowledgementStatus === "partial"
                              ? "warn"
                              : "default"
                        }
                      >
                        {pub.acknowledgementStatus}
                      </Badge>
                      {pub.supersededById ? (
                        <span className="ml-1">
                          <Badge tone="danger">superseded</Badge>
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-xs">{pub.assignments.length}</Td>
                    <Td className="text-xs">{pub.warnings.length}</Td>
                    <Td>
                      {canAcknowledge && !pub.supersededById ? (
                        ackFor === pub.id ? (
                          <div className="grid gap-1">
                            <input
                              className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                              placeholder="Act as person"
                              value={ackPerson}
                              onChange={(e) => setAckPerson(e.target.value)}
                              aria-label="Act as person"
                            />
                            <input
                              className="rounded border border-[var(--line)] px-2 py-1 text-xs"
                              placeholder="Note (optional)"
                              value={ackNote}
                              onChange={(e) => setAckNote(e.target.value)}
                              aria-label="Ack note"
                            />
                            <ValidationErrorState
                              errors={errors}
                              onDismiss={() => setErrors([])}
                            />
                            <div className="flex gap-1">
                              <Button
                                small
                                variant="teal"
                                onClick={() => handleAcknowledge(pub, "acknowledged")}
                              >
                                Acknowledge
                              </Button>
                              <Button
                                small
                                variant="line"
                                onClick={() => handleAcknowledge(pub, "declined")}
                              >
                                Decline
                              </Button>
                              <Button
                                small
                                variant="line"
                                onClick={() => setAckFor(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                            <div className="text-[11px] text-[#64748b]">
                              {acks.length} ack row(s) recorded.
                            </div>
                          </div>
                        ) : (
                          <Button
                            small
                            variant="line"
                            onClick={() => setAckFor(pub.id)}
                          >
                            Acknowledge
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-[#64748b]">—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Panel>
      )}
    </div>
  );
}

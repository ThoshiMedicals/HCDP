"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Panel, PanelSub, PanelTitle } from "@/components/ui/Panel";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { useOrganisation } from "@/lib/organisation/context";
import { EmptyStateWithAction, FilterBar, FilterChip, SectionHeader, StatusPill } from "./org-ui";

export function AuditSection() {
  const { state, filters, setFilters, addCorrectionNote } = useOrganisation();
  const [noteModal, setNoteModal] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const entries = useMemo(() => {
    let list = [...state.audit];
    if (filters.query) list = list.filter((a) => `${a.entityLabel} ${a.field} ${a.reason} ${a.entityType}`.toLowerCase().includes(filters.query!.toLowerCase()));
    return list;
  }, [state.audit, filters]);

  const submitNote = () => {
    if (!noteModal || !note.trim()) return;
    addCorrectionNote(noteModal, note);
    setNoteModal(null);
    setNote("");
  };

  return (
    <div className="grid gap-[18px]">
      <SectionHeader
        title="Audit history"
        subtitle="Immutable records — add correction notes only. All fields retained for compliance."
      />

      <FilterBar onClear={() => setFilters({})}>
        <FilterChip label="All" active={!filters.query} onClick={() => setFilters({})} />
        <FilterChip label="Permission" active={filters.query === "permission"} onClick={() => setFilters({ query: "permission" })} />
        <FilterChip label="Clinic" active={filters.query === "clinic"} onClick={() => setFilters({ query: "clinic" })} />
        <FilterChip label="Security" active={filters.query === "security"} onClick={() => setFilters({ query: "security" })} />
      </FilterBar>

      <Panel>
        <PanelTitle>Immutable audit trail</PanelTitle>
        <PanelSub>Original values cannot be edited. Correction notes append to the record.</PanelSub>
      </Panel>

      {entries.length === 0 ? (
        <EmptyStateWithAction
          title="No audit entries match these filters"
          description="Try clearing filters to see the full audit trail."
          actionLabel="Clear filters"
          onAction={() => setFilters({})}
        />
      ) : (
      <Table>
        <THead>
          <Th>When</Th>
          <Th>Actor</Th>
          <Th>Entity</Th>
          <Th>Change</Th>
          <Th>Reason</Th>
          <Th>Device / location</Th>
          <Th />
        </THead>
        <tbody>
          {entries.map((a) => (
            <tr key={a.id}>
              <Td>{new Date(a.at).toLocaleString()}</Td>
              <Td>{a.actorName}</Td>
              <Td>
                <strong>{a.entityLabel}</strong>
                <div className="text-xs text-[var(--muted)]">{a.entityType} · {a.entityId}</div>
              </Td>
              <Td>{a.field}: {a.previousValue} → {a.newValue}</Td>
              <Td>{a.reason}</Td>
              <Td>{a.device || "—"} · {a.locationLabel || "—"}</Td>
              <Td>
                <Button small variant="line" onClick={() => setNoteModal(a.id)} title="Add correction note">
                  Note
                </Button>
                {a.correctionNotes.length ? (
                  <StatusPill label={`${a.correctionNotes.length} note(s)`} tone="info" />
                ) : null}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      )}

      <Modal open={!!noteModal} title="Add correction note" onClose={() => setNoteModal(null)} footer={
        <>
          <Button variant="line" onClick={() => setNoteModal(null)}>Cancel</Button>
          <Button variant="teal" onClick={submitNote}>Append note</Button>
        </>
      }>
        <p className="text-sm text-[var(--muted)]">Correction notes do not alter the original audit entry.</p>
        <textarea className="mt-3 w-full rounded-lg border px-3 py-2" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
        {noteModal ? (
          <div className="mt-3 text-xs text-[var(--muted)]">
            Existing notes: {state.audit.find((a) => a.id === noteModal)?.correctionNotes.map((n) => n.note).join("; ") || "None"}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

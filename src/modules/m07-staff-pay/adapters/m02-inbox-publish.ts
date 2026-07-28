/**
 * M07 → M02 action/notification publishing interface only (Batch 1).
 * Does not import M02 repositories. No dual-write to M02 SoT.
 */

export type M02InboxProjection = {
  sourceModule: "staff-pay";
  kind: string;
  title: string;
  legalEntityId: string;
  entityId: string;
  severity: "info" | "warning" | "blocking";
  readOnlyProjection: true;
};

const projections: M02InboxProjection[] = [];

export function resetM02InboxPublishForTests(): void {
  projections.length = 0;
}

export function publishM07InboxProjection(input: Omit<M02InboxProjection, "sourceModule" | "readOnlyProjection">): M02InboxProjection {
  const row: M02InboxProjection = {
    ...input,
    sourceModule: "staff-pay",
    readOnlyProjection: true,
  };
  projections.push(row);
  return row;
}

export function listM07InboxProjections(): M02InboxProjection[] {
  return [...projections];
}

export const M07_M02_INBOX_PUBLISH_MODE = "interface-only" as const;

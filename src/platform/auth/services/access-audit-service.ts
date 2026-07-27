import type { AccessChangeHistoryEntry } from "../contracts/identity-separation";
import { getAuthMemoryState, newId, type AuthMemoryState } from "../repository/memory-store";

export function recordAccessChange(
  input: Omit<AccessChangeHistoryEntry, "id" | "createdAt">,
  state: AuthMemoryState = getAuthMemoryState()
): AccessChangeHistoryEntry {
  const entry: AccessChangeHistoryEntry = {
    ...input,
    id: newId("ach"),
    createdAt: new Date().toISOString(),
  };
  state.accessHistory.push(entry);
  return entry;
}

export function listAccessChangesForOrg(
  organisationId: string,
  state: AuthMemoryState = getAuthMemoryState()
): AccessChangeHistoryEntry[] {
  return state.accessHistory.filter((e) => e.organisationId === organisationId);
}

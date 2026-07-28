/**
 * Legal-entity pay settings — Batch 1 remediation.
 * payroll.view NEVER persists. Defaults may be derived ephemerally.
 */

import {
  assertM07LegalEntityScope,
  assertM07Permission,
  type M07Actor,
} from "../permissions";
import {
  getEntitySettings,
  listEntitySettings,
  newEntitySettingsId,
  upsertEntitySettings,
} from "../repository/local-store";
import type { CadenceKind, LegalEntityPaySettings } from "../types/domain";
import { recordM07Audit } from "./audit-service";
import { assertNoProhibitedFields } from "./sensitive-fields";

export const M07_EPHEMERAL_ENTITY_SETTINGS_DEFAULTS = {
  cadenceDefault: "fortnightly" as CadenceKind,
  separationOfDuties: true,
} as const;

/** Non-persisted defaults for display/validation when no stored row exists. */
export function deriveEntityPaySettingsDefaults(
  legalEntityId: string
): LegalEntityPaySettings {
  return {
    id: `ephemeral:${legalEntityId}`,
    legalEntityId,
    cadenceDefault: M07_EPHEMERAL_ENTITY_SETTINGS_DEFAULTS.cadenceDefault,
    separationOfDuties: M07_EPHEMERAL_ENTITY_SETTINGS_DEFAULTS.separationOfDuties,
    updatedAt: "",
    updatedBy: "system-ephemeral",
    version: 0,
  };
}

export function isEphemeralEntitySettings(settings: LegalEntityPaySettings): boolean {
  return settings.version === 0 || settings.id.startsWith("ephemeral:");
}

/**
 * Read settings. Never writes. Absent → ephemeral defaults (not stored).
 */
export function readEntityPaySettings(
  actor: M07Actor,
  legalEntityId: string
): LegalEntityPaySettings {
  assertM07Permission(actor, "payroll.view");
  assertM07LegalEntityScope(actor, legalEntityId);
  return getEntitySettings(legalEntityId) ?? deriveEntityPaySettingsDefaults(legalEntityId);
}

/**
 * Authorised create/update. Requires payroll.entity.settings.
 * Insert-if-absent or version bump — never destructive overwrite of unrelated fields beyond patch.
 */
export function upsertEntityPaySettings(
  actor: M07Actor,
  legalEntityId: string,
  patch: Partial<Pick<LegalEntityPaySettings, "cadenceDefault" | "separationOfDuties">>
): LegalEntityPaySettings {
  assertM07Permission(actor, "payroll.entity.settings");
  assertM07LegalEntityScope(actor, legalEntityId);
  assertNoProhibitedFields(patch);

  const existing = getEntitySettings(legalEntityId);
  const now = new Date().toISOString();
  const updated: LegalEntityPaySettings = existing
    ? {
        ...existing,
        ...patch,
        version: existing.version + 1,
        updatedAt: now,
        updatedBy: actor.userId,
      }
    : {
        id: newEntitySettingsId(),
        legalEntityId,
        cadenceDefault: patch.cadenceDefault ?? M07_EPHEMERAL_ENTITY_SETTINGS_DEFAULTS.cadenceDefault,
        separationOfDuties:
          patch.separationOfDuties ?? M07_EPHEMERAL_ENTITY_SETTINGS_DEFAULTS.separationOfDuties,
        updatedAt: now,
        updatedBy: actor.userId,
        version: 1,
      };

  upsertEntitySettings(updated);
  recordM07Audit({
    actor,
    action: existing ? "entity-settings.update" : "entity-settings.create",
    entityType: "legal-entity-settings",
    entityId: updated.id,
    legalEntityId,
    before: existing ?? undefined,
    after: updated,
  });
  return updated;
}

/**
 * Bootstrap/migration seed — insert-if-absent only. No actor permission (system path).
 * Does not overwrite existing settings.
 */
export function seedEntityPaySettingsIfAbsent(
  legalEntityId: string,
  defaults?: Partial<Pick<LegalEntityPaySettings, "cadenceDefault" | "separationOfDuties">>,
  seededBy = "system-bootstrap"
): { created: boolean; settings: LegalEntityPaySettings } {
  const existing = getEntitySettings(legalEntityId);
  if (existing) return { created: false, settings: existing };

  const now = new Date().toISOString();
  const created: LegalEntityPaySettings = {
    id: newEntitySettingsId(),
    legalEntityId,
    cadenceDefault: defaults?.cadenceDefault ?? M07_EPHEMERAL_ENTITY_SETTINGS_DEFAULTS.cadenceDefault,
    separationOfDuties:
      defaults?.separationOfDuties ?? M07_EPHEMERAL_ENTITY_SETTINGS_DEFAULTS.separationOfDuties,
    updatedAt: now,
    updatedBy: seededBy,
    version: 1,
  };
  upsertEntitySettings(created);
  return { created: true, settings: created };
}

/** Idempotent bootstrap for known demo/org keys — never overwrites. */
export function bootstrapDefaultEntityPaySettings(legalEntityIds: string[]): {
  createdIds: string[];
  skippedIds: string[];
} {
  const createdIds: string[] = [];
  const skippedIds: string[] = [];
  for (const id of legalEntityIds) {
    const result = seedEntityPaySettingsIfAbsent(id);
    if (result.created) createdIds.push(id);
    else skippedIds.push(id);
  }
  return { createdIds, skippedIds };
}

export function countStoredEntitySettings(): number {
  return listEntitySettings().length;
}

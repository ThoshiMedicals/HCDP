"use client";

import { useMemo, useState } from "react";
import { useStaffPay } from "../context";
import {
  createPayProfile,
  linkExternalPayrollEmployeeId,
  listPayProfiles,
} from "../services/profile-service";
import {
  createPreparationRule,
  createClassificationMapping,
  listPreparationRules,
} from "../services/rule-service";
import { createGenericCode, listGenericCodes } from "../services/code-service";
import {
  createExportProfile,
  listExportProfilesForEntity,
} from "../services/export-profile-service";
import { upsertEntityPaySettings } from "../services/entity-settings-service";
import {
  M07PermissionError,
  M07ValidationError,
  hasM07Permission,
} from "../permissions";
import { M07_NON_CERTIFIED_DISCLAIMER } from "../types/domain";
import { injectTestPersonIdentity } from "../adapters/m04-person-read";

export function SettingsSection() {
  const { actor, legalEntityId, refresh, tick } = useStaffPay();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const profiles = useMemo(() => {
    try {
      return listPayProfiles(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  const rules = useMemo(() => {
    try {
      return listPreparationRules(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  const codes = useMemo(() => {
    try {
      return listGenericCodes(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  const exportProfiles = useMemo(() => {
    try {
      return listExportProfilesForEntity(actor, legalEntityId);
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, legalEntityId, tick]);

  function run(label: string, fn: () => void) {
    setErr(null);
    setMsg(null);
    try {
      fn();
      setMsg(label);
      refresh();
    } catch (e) {
      if (e instanceof M07PermissionError || e instanceof M07ValidationError) setErr(e.message);
      else setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  const actions: Array<{
    id: string;
    label: string;
    permission: Parameters<typeof hasM07Permission>[1];
    onClick: () => void;
  }> = [
    {
      id: "create-profile",
      label: "Create pay profile",
      permission: "payroll.profile.edit",
      onClick: () =>
        run("Profile created", () => {
          injectTestPersonIdentity({
            personId: "person_batch1_demo",
            displayLabel: "Batch 1 Demo Staff",
            personKind: "staff",
            organisationId: legalEntityId,
            classificationRef: "class_demo_rn",
            readOnly: true,
            source: "m04-adapter",
          });
          createPayProfile(actor, {
            personId: "person_batch1_demo",
            legalEntityId,
            m04ClassificationRef: "class_demo_rn",
            effectiveFrom: "2026-01-01",
          });
        }),
    },
    {
      id: "link-external-id",
      label: "Link external payroll employee ID",
      permission: "payroll.externalId.edit",
      onClick: () =>
        run("External id linked", () => {
          const p = profiles[0];
          if (!p) throw new M07ValidationError("not-found", "Create a profile first");
          linkExternalPayrollEmployeeId(actor, p.id, `EXT-${Date.now()}`, "batch1-demo-link");
        }),
    },
    {
      id: "create-rule",
      label: "Create rule + classification map",
      permission: "payroll.rules.edit",
      onClick: () =>
        run("Rule created", () => {
          const rule = createPreparationRule(actor, {
            legalEntityId,
            code: "ORD-OT",
            label: "Ordinary + OT prep",
            effectiveFrom: "2026-01-01",
          });
          createClassificationMapping(actor, {
            legalEntityId,
            m04ClassificationRef: "class_demo_rn",
            preparationRuleId: rule.id,
            effectiveFrom: "2026-01-01",
          });
        }),
    },
    {
      id: "create-code",
      label: "Create generic code",
      permission: "payroll.codes.edit",
      onClick: () =>
        run("Code created", () => {
          createGenericCode(actor, {
            legalEntityId,
            code: "ALLOW-MEAL",
            label: "Meal allowance (prep)",
            lineType: "allowance",
            effectiveFrom: "2026-01-01",
          });
        }),
    },
    {
      id: "create-export-profile",
      label: "Create export profile",
      permission: "payroll.export.profile.edit",
      onClick: () =>
        run("Export profile created", () => {
          createExportProfile(actor, {
            legalEntityId,
            name: "Entity min-PII",
            effectiveFrom: "2026-01-01",
            isDefaultMinimumPii: false,
            includeNames: false,
            includeRatesOrMoney: false,
          });
        }),
    },
    {
      id: "upsert-entity-settings",
      label: "Save entity cadence defaults",
      permission: "payroll.entity.settings",
      onClick: () =>
        run("Entity settings saved", () => {
          upsertEntityPaySettings(actor, legalEntityId, {
            cadenceDefault: "fortnightly",
            separationOfDuties: true,
          });
        }),
    },
  ];

  return (
    <section className="space-y-4 min-w-0" aria-labelledby="m07-settings-heading">
      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800" role="status">
          Batch 1 foundation — configuration · available
        </p>
        <h2 id="m07-settings-heading" className="mt-1 text-lg font-bold">
          Settings
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Pay profiles, external payroll employee IDs, non-certified preparation rules, classification
          maps, generic codes and export profiles. Award/tax/super certification is out of scope.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{M07_NON_CERTIFIED_DISCLAIMER}</p>
      </div>

      {msg ? (
        <p className="text-sm text-emerald-800" role="status">
          Success: {msg}
        </p>
      ) : null}
      {err ? (
        <p className="text-sm text-red-700" role="alert">
          Error: {err}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const allowed = hasM07Permission(actor, action.permission);
          return (
            <div key={action.id} className="min-w-0">
              <button
                type="button"
                className="w-full rounded-lg border border-[var(--v34-card-line)] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!allowed}
                aria-disabled={!allowed}
                aria-describedby={!allowed ? `${action.id}-denied` : undefined}
                onClick={action.onClick}
              >
                {action.label}
              </button>
              {!allowed ? (
                <p id={`${action.id}-denied`} className="mt-1 text-xs text-[var(--muted)]" role="status">
                  Unavailable: requires {action.permission}.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--v34-card-line)] bg-[var(--card)] p-6 text-sm space-y-2">
        <p>Profiles: {profiles.length}</p>
        <p>Rules: {rules.length} (certified=false)</p>
        <p>Codes: {codes.length}</p>
        <p>Export profiles: {exportProfiles.length}</p>
      </div>
    </section>
  );
}

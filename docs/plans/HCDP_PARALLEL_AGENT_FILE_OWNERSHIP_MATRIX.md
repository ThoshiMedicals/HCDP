# HCDP Parallel Agent File Ownership Matrix

**Document type:** Parallel-development ownership / collision control
**Created:** 30 July 2026
**Pinned baseline:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`
**Companion:** `docs/plans/HCDP_PARALLEL_AGENT_OPERATING_PLAN.md`
**Status:** Documentation only â€” path claims for future authorised batches; **no** feature work authorised by this matrix alone

---

## How to use

1. Controller publishes the authorised batch id and pin.
2. Each agent copies the relevant rows into its prompt and marks **Claimed by**.
3. Soft/Hard collision rules in the operating plan apply.
4. Paths not listed default to: **module-local Feature Agent** if under that module and not hotspot; otherwise **Integration Agent**.

**Legend**

| Owner code | Meaning |
|---|---|
| `CTRL` | Parallel Development Controller (+ owner for wave-control) |
| `INT` | Integration Agent only |
| `FEAT-<module>` | Feature Agent for that module slice |
| `EVID` | Evidence Agent (new batch docs only) |
| `QA` | Independent QA (verify; docs/repro only unless hotfix authorised) |
| `FROZEN` | Read-only without defect/CR + owner review |
| `PLAN` | Planning docs â€” editable only when authorised as planning task |
| `EXCL` | Explicitly out of scope â€” do not touch for feature work |

---

## A. Repository control and tooling (hotspots)

| Path | Default owner | Collision | Notes |
|---|---|---|---|
| `.cursor/rules/hcdp-wave-control.mdc` | `CTRL` | Hard | Owner-reviewed only; never feature agents |
| `.cursor/rules/**` (other) | `CTRL` / `INT` | Hard | Shared agent behaviour |
| `package.json` | `INT` | Hard | Scripts/deps |
| `package-lock.json` | `INT` | Hard | Lockfile with package.json |
| `tsconfig.json` | `INT` | Hard | |
| `next.config.ts` / `next.config.js` / `next.config.mjs` | `INT` | Hard | Use whichever exists at pin |
| `eslint.config.*` | `INT` | Hard | |
| `postcss.config.*` | `INT` | Hard | |
| `README.md` | `INT` / `CTRL` | Soft | |
| `.gitignore` | `INT` | Hard | |
| `scripts/platform-integration-qa.mjs` | `INT` | Hard | |
| `scripts/platform-integration-browser-qa.mjs` | `INT` | Hard | |
| `scripts/wave*-*.mjs` | `INT` / `QA` | Soft | Regression evidence runners; do not alter closed-wave semantics without CR |

---

## B. App shell and shared UI (hotspots)

| Path | Default owner | Collision | Notes |
|---|---|---|---|
| `src/app/**` | `INT` | Hard | Thin routes only |
| `src/app/globals.css` | `INT` | Hard | Shared styles |
| `src/components/shell/**` | `INT` | Hard | Chrome |
| `src/components/ui/**` | `INT` | Hard | Design primitives |
| `src/components/shared/**` | `INT` | Hard | Cross-module visuals |
| `src/components/workspaces/**` | `FROZEN` / `INT` | Hard | M01â€“M03 temporary UIs â€” defect/CR only |
| `src/components/forms/**` | `INT` | Soft | Prefer module-local forms when possible |
| `src/lib/modules.ts` | `INT` | Hard | Compatibility catalogue |
| `src/lib/portal-context.tsx` | `INT` | Hard | Shell toasts/sidebar |
| `src/lib/platform/**` | `INT` | Hard | Re-export shims |
| `src/legacy/**` | `EXCL` / `FROZEN` | Hard | No new features |
| `public/**` | `INT` | Soft | Static assets; no payroll semantics |

---

## C. Platform spine (hotspots)

| Path | Default owner | Collision | Notes |
|---|---|---|---|
| `src/platform/module-registry/**` | `INT` | Hard | 24-module register |
| `src/platform/context/**` | `INT` | Hard | Clinic + identity |
| `src/platform/contracts/**` | `INT` | Hard | Inbox/audit/notification/summary |
| `src/platform/workforce/contracts/**` | `INT` | Hard | Shared refs/events â€” additive versioning only |
| `src/platform/workforce/services/**` | `INT` | Hard | |
| `src/platform/workforce/validation/**` | `INT` | Hard | |
| `src/platform/workforce/tests/**` | `INT` / `QA` | Soft | Contract tests |
| `src/platform/services/**` | `INT` | Hard | Bridge/publish/summary |
| `src/platform/navigation/**` | `INT` | Hard | |
| `src/platform/permissions/**` | `INT` | Hard | Shell visibility |
| `src/platform/storage/**` | `INT` | Hard | Shared helpers |
| `src/platform/auth/**` | `FROZEN` / `INT` | Hard | Wave 1A â€” defect/CR only |
| `src/platform/demo/**` | `INT` | Soft | Demo identities |
| `src/platform/status/**` | `INT` | Soft | |
| `src/platform/validation/**` | `INT` | Soft | |

---

## D. Frozen workforce modules (Waves 2â€“5)

Edits require documented defect/CR, impact analysis, focused regression, and owner review.

| Path | Default owner | Collision | Notes |
|---|---|---|---|
| `src/modules/m04-staff-doctors/**` | `FROZEN` | Hard | M04 SoT; adapters-out only for consumers |
| `src/modules/m05-roster/**` | `FROZEN` | Hard | Includes `BLOCKED-M10` informational boundary |
| `src/modules/m06-time-attendance/**` | `FROZEN` | Hard | Publishes `TimesheetRef` / `timesheet.approved`; must not write `pulse.m07.*` except authorised intake contracts |
| `src/modules/m11-training/**` | `FROZEN` | Hard | |
| `docs/audits/WAVE2_*.md` | `FROZEN` | Hard | Accepted evidence |
| `docs/audits/WAVE3_*.md` | `FROZEN` | Hard | |
| `docs/audits/WAVE4_*.md` | `FROZEN` | Hard | |
| `docs/audits/WAVE5_*.md` | `FROZEN` | Hard | |

---

## E. M07 Staff Pay (Batches 1â€“6 closed)

Ordinary prep behaviour is closed. New feature ownership applies **only** after a named authorised batch (e.g. future PPA-1). Until then treat as `FROZEN` except Controller-authorised defect/CR.

| Path | Default owner (when batch authorised) | Collision | Notes |
|---|---|---|---|
| `src/modules/m07-staff-pay/types/**` | `FEAT-m07` â†’ then `INT` if shared | Hard | Additive types preferred |
| `src/modules/m07-staff-pay/storage/**` | `FEAT-m07` / `INT` | Hard | Additive migrations only; **no rewrite** of accepted Batch 1â€“6 history |
| `src/modules/m07-staff-pay/permissions.ts` | `INT` | Hard | Authz catalogue |
| `src/modules/m07-staff-pay/section-meta.ts` | `INT` | Hard | Nav/section availability |
| `src/modules/m07-staff-pay/module.config.ts` | `INT` | Hard | |
| `src/modules/m07-staff-pay/StaffPayModule.tsx` | `INT` | Hard | Entry |
| `src/modules/m07-staff-pay/StaffPayWorkspace.tsx` | `INT` | Hard | Shell workspace |
| `src/modules/m07-staff-pay/index.ts` | `INT` | Soft | Public exports |
| `src/modules/m07-staff-pay/services/period-service.ts` | `FEAT-m07` | Hard | Single writer per batch |
| `src/modules/m07-staff-pay/services/period-lock-service.ts` | `FEAT-m07` / `INT` | Hard | Lock semantics â€” serialize |
| `src/modules/m07-staff-pay/services/period-unlock-service.ts` | `FEAT-m07` / `INT` | Hard | Unlock â‰  PPA |
| `src/modules/m07-staff-pay/services/period-lock-guard.ts` | `FEAT-m07` / `INT` | Hard | |
| `src/modules/m07-staff-pay/services/calculate-service.ts` | `FEAT-m07` | Hard | |
| `src/modules/m07-staff-pay/services/approval-service.ts` | `FEAT-m07` | Hard | |
| `src/modules/m07-staff-pay/services/approval-invalidation.ts` | `FEAT-m07` | Hard | |
| `src/modules/m07-staff-pay/services/export-*.ts` | `FEAT-m07` / `INT` | Hard | Export cluster â€” one owner per batch |
| `src/modules/m07-staff-pay/services/reconciliation-service.ts` | `FEAT-m07` | Hard | Package recon â‰  provider returns |
| `src/modules/m07-staff-pay/services/published-timesheet-*.ts` | `FEAT-m07` | Hard | Intake/replay/lifecycle |
| `src/modules/m07-staff-pay/services/*` (other) | `FEAT-m07` | Soft/Hard | Claim per file before edit |
| `src/modules/m07-staff-pay/adapters/**` | `FEAT-m07` | Hard | No foreign repository imports |
| `src/modules/m07-staff-pay/repository/**` | `FEAT-m07` | Hard | M07 SoT only |
| `src/modules/m07-staff-pay/sections/**` | `FEAT-m07` | Soft | Prefer one section file per agent |
| `src/modules/m07-staff-pay/tests/**` | `FEAT-m07` / `QA` | Soft | Distinct test file names |
| `docs/audits/WAVE6_BATCH1_*.md` â€¦ `WAVE6_BATCH6_*.md` | `FROZEN` | Hard | Accepted evidence â€” do not rewrite |
| `docs/architecture/WAVE6_M07_*.md` | `PLAN` / `CTRL` | Soft | Architecture; not silent scope expansion |

**PPA-related paths (planned only â€” `EXCL` until PPA batch authorised):**

| Path / concern | Owner until authorised | Notes |
|---|---|---|
| New `ppa-*.ts` services | `EXCL` | Do not create |
| `kind: "adjustment"` create path | `EXCL` | Types may already exist; do not wire |
| Adjustments section un-plan | `EXCL` | `section-meta.ts` remains planned |
| `docs/plans/WAVE6_M07_PPA_*.md` | `PLAN` | Planning edits only when tasked |

---

## F. Other modules

| Path | Default owner | Collision | Notes |
|---|---|---|---|
| `src/modules/m01-command-centre/**` | `FROZEN` / `INT` | Hard | Summaries only via contracts |
| `src/modules/m02-action-inbox/**` | `FROZEN` / `INT` | Hard | Projections only |
| `src/modules/m03-organisation-access/**` | `FROZEN` / `INT` | Hard | Identity/access |
| `src/modules/m08-doctor-pay/**` | `EXCL` | Hard | Do not begin Module 8 |
| `src/modules/m09-bbpip/**` â€¦ `m24-financial-forecast/**` (except noted) | `EXCL` / out of workforce wave | Soft | Outside current parallel workforce programme unless owner names batch |
| `src/modules/m10-tasks-actions/**` | `EXCL` | Hard | `BLOCKED-M10` remains |
| `src/modules/m22-recruitment/**` | `EXCL` | Hard | Wave 7 not authorised |

---

## G. Documentation trees

| Path | Default owner | Collision | Notes |
|---|---|---|---|
| `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md` | `CTRL` | Hard | Controlling plan |
| `docs/architecture/PLATFORM_BASELINE_V1.md` | `FROZEN` | Hard | |
| `docs/architecture/WORKFORCE_*.md` | `CTRL` / `INT` | Soft | |
| `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` | `CTRL` | Soft | |
| `docs/plans/HCDP_PARALLEL_AGENT_*.md` | `CTRL` | Soft | This pack |
| `docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md` | `PLAN` | Soft | Not implementation authority |
| `docs/plans/WAVE6_M07_PPA_IMPLEMENTATION_PLAN.md` | `PLAN` | Soft | Not implementation authority |
| `docs/templates/HCDP_CURSOR_AGENT_COMPLETION_REPORT.md` | `CTRL` | Soft | Template |
| `docs/templates/HCDP_PARALLEL_PR_CHECKLIST.md` | `CTRL` | Soft | Template |
| `docs/audits/**` (new batch only) | `EVID` | Soft | Never overwrite closed-batch files |
| `docs/specifications/**` | `CTRL` / `PLAN` | Soft | |

---

## H. Example claim table (copy per batch)

| Agent | Batch | Slice | Claimed paths | Out of bounds |
|---|---|---|---|---|
| _name_ | _none today_ | â€” | â€” | All production feature paths |

---

## I. Collision protocol (summary)

1. Duplicate claim â†’ Controller reassigns or serializes.
2. Accidental dual edit â†’ Integration branch owns resolution; others rebase.
3. Hotspot touch by Feature Agent â†’ revert and file Integration request.
4. Frozen path touch without CR â†’ reject PR.
5. Excluded path (PPA/M08/payment/â€¦) â†’ reject PR regardless of tests.

---

## J. Validation note

All paths in this matrix were checked against repository layout at pin `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`. Config filenames that use globs (`next.config.*`, `eslint.config.*`) must be resolved to the file present at pin before editing.

---

*End of ownership matrix.*

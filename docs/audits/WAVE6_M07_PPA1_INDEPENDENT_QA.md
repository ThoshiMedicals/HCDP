# Wave 6 / M07 PPA-1 Foundation — Independent QA Report

**PPA** = Prior-Period Adjustment.

**Lane:** Independent QA (report-only).  
**Date:** 30 July 2026  
**Repository:** ThoshiMedicals/HCDP  
**Authorised common baseline:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Integration candidate:** `cursor/m07-ppa1-integration` @ `739e42a39c51558311d030bcd96017c9056159fb`  
**QA branch:** `cursor/m07-ppa1-independent-qa` (created from integration tip)  
**QA worktree:** `.worktrees/m07-ppa1-independent-qa`

This report does **not** authorise merge, owner acceptance, production release, or PPA-2. No production code, existing tests, plans, wave-control rules, or accepted evidence were modified.

---

## Verdict

**PASS WITH QUALIFICATIONS**

Technically suitable for **owner decision** with explicitly accepted residual limitations. Not an unqualified pass. Independent QA does **not** authorise merge.

| Dimension | Status |
|---|---|
| Production implementation (PPA-1 scope) | **PASS** — register/create/cancel foundation present; excluded capabilities not shipped |
| Automated-test status | **PASS** — full M07 (ts+tsx) **260/260**; focused PPA suites all green |
| Browser-validation status | **BLOCKED** — webpack `node:crypto` UnhandledSchemeError (pre-dates PPA-1) |
| Atomicity status | **QUALIFIED** — fail-closed compensation across storage keys; true multi-key transaction **not** proven |
| Concurrency status | **QUALIFIED (Major limitation)** — one-open-PPA is pre-write check only; no storage-level uniqueness; true interleaving not exercised |
| Audit status | **PASS with qualifications** — `ppa.create` / `ppa.create.replay` / `ppa.cancel` observed; audit-after-write non-atomic; replay audit best-effort |
| Permission/scope status | **PASS** — `payroll.adjust` + LE/clinic fail-closed at service; UI cannot widen |
| Regression status | **PASS** — Batch 5/6, authz, lifecycle, boundary/arch, shell, full M07 green |
| Merge recommendation | **Owner-gated** — merge of integration candidate only if qualifications below are explicitly accepted; Independent QA does not authorise |
| Owner-acceptance recommendation | **Do not accept yet** without explicit acceptance of Q1–Q4; live browser UI still unproven; no owner-acceptance evidence created by this lane |

---

## Pre-flight (verified)

| Check | Result |
|---|---|
| `git fetch origin` | OK |
| `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` (exact) |
| Integration commit exists | `739e42a39c51558311d030bcd96017c9056159fb` |
| Merge-base vs baseline | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Ahead / behind baseline | **3 ahead / 0 behind** (`git rev-list --left-right --count 0afe878…HEAD` → `0	3`) |
| Working tree (QA worktree at tip) | Clean at inspection start |
| QA branch created from tip | `cursor/m07-ppa1-independent-qa` @ `739e42a…` |

### Integration commits (baseline → tip)

1. `995ee86` — feat(m07): add PPA-1 prior-period adjustment core domain and service  
2. `2ad5f4d` — feat(m07): add isolated PPA-1 foundation adjustments UI  
3. `739e42a` — feat(m07): wire PPA-1 Adjustments into production shell  

Read: wave-control rule, PPA implementation plan, Batch 6 closure qualifications, all three commits, full baseline→integration diff, and relevant M07 services/repos/permissions/context/shell/tests.

---

## Scope confirmation

### Provided (verified from production paths + tests)

- PPA register (list) via `listPriorPeriodAdjustmentsForEntity`
- Creation against locked ordinary source only
- Dedicated `kind=adjustment` period via `createAdjustmentPayPeriod`
- Mandatory `reasonCode` + `reasonText`; optional `evidenceRefs`
- Immutable source pins copied at create (version, lock, export, manifest, reconciliation, approval refs)
- At most one **open** PPA per source (pre-write enforcement; see concurrency finding)
- Draft cancellation archives adjustment period; does not unlock/mutate source
- List/get LE + clinic scope fail-closed
- `payroll.adjust` enforcement (service authoritative; UI gates on same permission)
- Idempotent create (same key + payload → replay; conflicting payload rejected)
- `ppa.create`, `ppa.create.replay`, `ppa.cancel` audit actions
- Production shell wiring: `StaffPayWorkspace` → `ConnectedAdjustmentsSection` → real `ppa-service`

### Not provided (confirmed absent from PPA-1 surface)

- Adjustment lines / deltas, calculation, approval, export/download, reconciliation mutations for PPA, provider returns, payments, net pay, Xero, bank files, STP, superannuation, doctor pay / M08, certification or operational-release claims

UI scope banner and component controls match; no decorative calc/export/payment actions observed in UI/integration suites.

---

## Changed-file audit (baseline → `739e42a`)

| File | Classification |
|---|---|
| `types/domain.ts` | Verified core candidate |
| `services/period-service.ts` | Verified core candidate (`createAdjustmentPayPeriod`) |
| `services/ppa-service.ts` | Verified core candidate |
| `storage/ppa-repository.ts` | Verified core candidate |
| `tests/m07-ppa1-core.test.ts` | Necessary independent test support |
| `sections/AdjustmentsSection.tsx` | Verified UI + necessary integration hotspot (`ConnectedAdjustmentsSection`) |
| `sections/adjustments/*` | Verified UI candidate |
| `tests/m07-ppa1-ui.test.tsx` | Necessary independent test support |
| `StaffPayWorkspace.tsx` | Necessary integration hotspot (minimal: import + `case "adjustments"`) |
| `section-meta.ts` | Necessary integration hotspot (`planned` → `available` + PPA-1 note) |
| `sections/index.ts` | Necessary integration hotspot (re-exports) |
| `repository/local-store.ts` | Necessary integration hotspot (test period-write fail injection only) |
| `services/audit-service.ts` | Necessary integration hotspot (action-scoped audit fail injection) |
| `tests/_helpers.ts` | Necessary independent test support (hook reset) |
| `tests/m07-shell.test.ts` | Necessary independent test support (adjustments available + wiring string asserts) |
| `tests/m07-ppa1-atomicity.test.ts` | Necessary independent test support |
| `tests/m07-ppa1-integration.test.tsx` | Necessary independent test support |

**Unauthorised / unnecessary scope expansion:** none identified among the 19 changed files. Shared-file deltas are minimal and PPA-1-related. Batch 1–6 ordinary prep behaviour not rewritten in these diffs.

---

## Production-wiring QA

| # | Check | Result |
|---|---|---|
| 1 | `StaffPayWorkspace` mounts `ConnectedAdjustmentsSection` for `adjustments` | PASS |
| 2 | Connected component invokes real `ppa-service` | PASS |
| 3 | No UI-local mock repository for production behaviour | PASS |
| 4 | Authoritative actor + legal-entity context used | PASS (`useStaffPay`) |
| 5 | Service enforcement remains authoritative | PASS |
| 6 | Only locked ordinary periods as sources | PASS (`listLockedOrdinarySourceOptionsForActor`) |
| 7 | Adjustment / unlocked periods excluded | PASS |
| 8 | Clinic + LE scope fail-closed | PASS (service + list filter) |
| 9 | Create/cancel refresh from persisted state | PASS (`refresh` + `load`) |
| 10 | Empty / denied / loading / error states | PASS (integration + UI suites) |
| 11 | Enabled controls perform real actions | PASS |
| 12 | No fake success / decorative action / production seed | PASS |

Idempotency key: generated per intentional submit, retained across retry of same submission, cleared on success and on actor/LE change; rerender does not mint a key until submit.

---

## Idempotency / atomicity / concurrency (independent)

Independently re-ran atomicity suite **8/8**. Exercised production storage path with injected failures for:

1. Adjustment-period write failure  
2. PPA-case write failure after period create  
3. Consistency-verification failure after both writes  
4. `ppa.create` audit failure  
5. Duplicate creation  
6. Identical idempotency replay  
7. Conflicting idempotency replay  
8. Near-concurrent **sequential** racing creates  

Observed for failure cases: source ordinary period unchanged; no success return on failed ops; compensation archives residual adjustment periods / cancels residual cases where applicable; compensated residuals do not satisfy successful replay.

**Atomicity qualification (preserve precisely):** platform writes span separate storage keys (periods + adjustments + audit). Compensation is fail-closed. **True transactional atomicity across keys is not proven and must not be certified.**

**Concurrency classification:** **Major / qualified limitation** (not safely prevented at storage level).

- Guarantee enforced via pre-write `findOpenPriorPeriodAdjustmentForSource` only.  
- No unique constraint / atomic compare-and-set on `(sourcePeriodId, open-status)`.  
- Suite case 8 models interleaved creates as **sequential** attempts after first commit — it does **not** prove two overlapping in-flight creates cannot both pass validation.  
- Under true concurrent/interleaved execution, both callers can pass the open check before either writes → residual risk of two open PPAs for one source.

---

## Audit QA

| Scenario | Result |
|---|---|
| `ppa.create` | Recorded on successful create |
| `ppa.create.replay` | Present on identical replay (best-effort; swallow on replay-audit failure) |
| `ppa.cancel` | Recorded on cancel |
| Duplicate open rejection | Fail-closed; no false success audit |
| Conflicting replay | Fail-closed |
| Invalid / non-locked / non-ordinary source | Fail-closed |
| Cross-entity | Fail-closed |
| Partial-write compensation | No false-success `ppa.create` when create fails after partial write |
| Audit-write failure on create | No success response; compensation runs |

**Test hooks:** `__setPpaCaseWriteFailForTests`, `__setPpaCorruptAfterWriteForTests`, `__setPeriodWriteFailForTests`, `__setM07AuditFailActionsForTests` — intended no-op when `NODE_ENV === "production"`, but gate is:

```ts
typeof process === "undefined" || process.env.NODE_ENV !== "production"
```

See finding **QA-PPA1-001**.

---

## Permission and scope QA

Service + UI boundary coverage (core + integration + authz regressions):

- `payroll.adjust` permitted → create/list/cancel allowed  
- Missing adjust / view-only → denied (PPA-1 plan uses `payroll.adjust` for view/list/create/cancel)  
- Cross-LE / caller `legalEntityId` widening → rejected (`legal-entity-mismatch` / scope errors)  
- Clinic scope fail-closed  
- UI cannot override service enforcement  

---

## Data integrity QA

- Source period structurally unchanged on create/cancel/fail paths (asserted in suites)  
- Source lock identity/version pins copied onto case  
- Dedicated period `kind=adjustment`; source must be ordinary + locked  
- Adjustment periods not selectable as PPA sources  
- Cancel archives adjustment period; does not unlock source  
- Persistence via existing `M07_STORAGE_KEYS.adjustments` — no silent migration/schema-version change in this diff  
- Malformed list entries filtered by repository `id` guard  

---

## Test integrity review

- Core/atomicity/integration suites invoke real production services against memory localStorage.  
- Hooks reset in `resetM07TestEnv`.  
- Some shell assertions are source-string checks (`ConnectedAdjustmentsSection`); behavioural mounting covered by integration suite — string checks are supplemental only.  
- Atomicity case 8 title overstates concurrency coverage (sequential race model).  
- No skipped/todo in full M07 run.  
- `npm run test:m07` package script matches `**/*.test.ts` only; independent QA ran **ts + tsx** for complete PPA coverage (**260**).

---

## Regression — exact commands and totals

Working directory: `.worktrees/m07-ppa1-independent-qa`

| Suite | Command | Result |
|---|---|---|
| PPA core | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/m07-ppa1-core.test.ts"` | **10/10** pass; 0 fail; 0 skip |
| PPA UI | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/m07-ppa1-ui.test.tsx"` | **10/10** pass |
| PPA atomicity | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/m07-ppa1-atomicity.test.ts"` | **8/8** pass |
| PPA integration | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/m07-ppa1-integration.test.tsx"` | **11/11** pass |
| M07 shell | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/m07-shell.test.ts"` | **5/5** pass |
| Authz / permissions | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/m07-authz.test.ts"` | **13/13** pass |
| Lifecycle | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/m07-lifecycle-cp26.test.ts"` | **8/8** pass |
| Batch 5 | `npx --yes tsx --test` …`m07-batch5-*.test.ts` (3 files) | **49/49** pass |
| Batch 6 | `npx --yes tsx --test` …`m07-batch6-*.test.ts` (5 files) | **43/43** pass |
| Boundary + arch + mutation + migration | `m07-boundary-cp23`, `m07-architecture-cp27`, `m07-mutation-matrix`, `m07-migration` | **30/30** pass (combined run) |
| Full M07 (ts+tsx) | `npx --yes tsx --test "src/modules/m07-staff-pay/tests/**/*.test.ts" "src/modules/m07-staff-pay/tests/**/*.test.tsx"` | **260/260** pass; 0 fail; 0 skip; 0 todo |

Scoped typecheck command: none dedicated for M07-only in package scripts; not claimed.

Period lock / unlock behaviour covered inside Batch 6 suites (no separately named `m07-period-lock*.test.ts` files in this tree).

---

## Browser validation

**Command:** `npm run dev -- -p 3457` (resolves to `next dev --webpack -p 3457`)  
**URL attempted:** `http://localhost:3457/` → `/dashboard`

**Exact error (captured in stderr):**

```text
UnhandledSchemeError: Reading from "node:crypto" is not handled by plugins (Unhandled scheme).
Import trace:
node:crypto
./src/platform/workforce/contracts/published-timesheet-hash.ts
./src/modules/m06-time-attendance/adapters/m06-published-timesheet-publisher.ts
./src/modules/m06-time-attendance/adapters/index.ts
./src/modules/m06-time-attendance/index.ts
./src/components/workspaces/ModuleWorkspace.tsx
```

**Predates integration:** YES — same `import { createHash } from "node:crypto"` exists on authorised baseline `0afe878…` in `published-timesheet-hash.ts`. Not introduced by PPA-1.

**Browser cases:** all **BLOCKED** (1440/1280/1024/768/430/390; light/dark; device; keyboard-only; labels; focus; announcements; colour-only; reduced motion; overflow; register/create/detail live UX).

SSR/component coverage and UI/integration tests partially substitute; **do not claim live browser validation passed**.

**Owner-acceptance impact:** may remain a **documented qualification** (pre-existing platform debt) rather than a PPA-1 functional defect; still blocks live UI acceptance until cleared outside this QA lane. **This lane did not fix webpack.**

---

## Findings

### QA-PPA1-001 — Test-hook gate enables when `process` is undefined

- **Severity:** Blocker (security / test-hook policy for this lane)  
- **Requirement:** Production builds must not activate test hooks; `typeof process === "undefined"` must not enable hooks in browser production runtime  
- **Reproduction:** Inspect `allowPpaRepoTestHooks` / `allowLocalStoreTestHooks` / `allowTestHooks` in `ppa-repository.ts`, `local-store.ts`, `audit-service.ts`  
- **Expected:** Hooks only when explicitly in a Node test environment  
- **Actual:** `typeof process === "undefined" || NODE_ENV !== "production"` → hooks allowed if `process` is absent  
- **Evidence:** Source as above; setters exported from modules reachable via client import graph (`ConnectedAdjustmentsSection` → `ppa-service` / storage / `local-store`)  
- **Likely cause:** Reused Batch 6-era gate pattern extended for PPA-1 injections  
- **Remediation lane:** Security / small hardening batch (invert gate; strip setters from client bundles) — **not** this QA lane  
- **Blocks merge:** Owner decision — Independent QA recommends treating as must-accept qualification or remediate before merge  
- **Blocks owner acceptance:** Yes, until accepted as residual risk or fixed  

### QA-PPA1-002 — One-open-PPA race (TOCTOU)

- **Severity:** Major  
- **Requirement:** At most one open PPA per source  
- **Reproduction:** Conceptual race — two creates both pass `findOpenPriorPeriodAdjustmentForSource` before either writes; suite case 8 is sequential only  
- **Expected:** Storage-level atomic uniqueness or equivalent  
- **Actual:** Pre-write check only; localStorage multi-key non-atomic  
- **Evidence:** `ppa-service.ts` create path; `m07-ppa1-atomicity.test.ts` case 8 comments/sequence  
- **Classification:** Qualified limitation — **not** proven safely prevented under true concurrency  
- **Remediation lane:** Core hardening (compare-and-set / single-key record / mutex) in a named remediation — not PPA-2  
- **Blocks merge:** Only if owner requires concurrency proof before merge  
- **Blocks owner acceptance:** Blocks **unqualified** acceptance  

### QA-PPA1-003 — Multi-key create is compensation, not a transaction

- **Severity:** Major (qualification; expected by plan)  
- **Requirement:** Fail-closed create; no partial success claim; true atomicity only if proven  
- **Actual:** Period then case then verify; compensate on failure; residuals may remain archived/cancelled  
- **Evidence:** Comments and catch path in `createPriorPeriodAdjustment`; atomicity suite  
- **Remediation lane:** Future storage transaction / single-key aggregate if required  
- **Blocks merge:** No if qualification accepted  
- **Blocks owner acceptance:** Blocks claiming transactional atomicity  

### QA-PPA1-004 — Live browser blocked by pre-existing `node:crypto` webpack failure

- **Severity:** Major (environment) / qualification for PPA-1 functional merge  
- **Requirement:** Live mount of M07 Adjustments section  
- **Actual:** Dashboard compile **500**; UnhandledSchemeError  
- **Evidence:** `npm run dev -- -p 3457`; stderr import trace; baseline contains `node:crypto` import  
- **Remediation lane:** Platform/webpack (outside PPA-1 QA)  
- **Blocks merge:** No for logic merge if owner accepts  
- **Blocks owner acceptance:** Blocks live UI acceptance until cleared or explicitly waived  

### QA-PPA1-005 — Cancel persists before audit; audit failure leaves cancelled state with thrown error

- **Severity:** Moderate  
- **Requirement:** No false success; consistent cancel semantics  
- **Actual:** Case/period archived then `recordM07Audit`; if audit throws, UI shows error while cancel already persisted  
- **Evidence:** `cancelPriorPeriodAdjustmentDraft` ordering  
- **Remediation lane:** PPA cancel/audit consistency hardening  
- **Blocks merge:** No  
- **Blocks owner acceptance:** Prefer fix or accept as audit non-atomicity inheritance  

### QA-PPA1-006 — Shell wiring asserts partly source-string based

- **Severity:** Minor  
- **Requirement:** Behavioural proof of wiring  
- **Actual:** `m07-shell.test.ts` matches source text; integration suite mounts real connected path  
- **Remediation lane:** Optional test hygiene  
- **Blocks merge / OA:** No  

---

## Qualifications (must be explicitly accepted for owner decision)

1. **Q1 — Atomicity:** Fail-closed compensation across separate storage keys; **not** a proven multi-key transaction.  
2. **Q2 — Concurrency:** One-open-PPA is pre-write only; true interleaved dual-open residual risk remains.  
3. **Q3 — Browser:** Live Adjustments UX **BLOCKED** by pre-existing webpack `node:crypto` resolution failure.  
4. **Q4 — Test hooks:** Gate uses `typeof process === "undefined" || …`; browser-runtime activation risk must be accepted or remediated before unqualified security acceptance.  
5. **Q5 — No owner-acceptance evidence** produced; PPA-2 not authorised.  
6. **Q6 — Inherited:** Audit/M02 non-atomicity and Batch 6 unlock≠PPA qualifications remain in force.

---

## Stop checkpoint

Independent QA complete.

**Did not:**

- Fix production code  
- Update accepted evidence  
- Merge to `main`  
- Authorise merge  
- Begin PPA-2  
- Begin payment / provider-return / M08 / Wave 1A Auth  

**Report file:** `docs/audits/WAVE6_M07_PPA1_INDEPENDENT_QA.md` (this document only).

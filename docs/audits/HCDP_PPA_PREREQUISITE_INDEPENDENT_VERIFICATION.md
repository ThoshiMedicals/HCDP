# HCDP — PPA Prerequisite Independent Verification

**Document:** `docs/audits/HCDP_PPA_PREREQUISITE_INDEPENDENT_VERIFICATION.md`  
**Lane:** Verification only (no production change, no OD-A2 repair, no UI Batch 1 integration, no merge)  
**Date:** 30 July 2026  
**Verification branch:** `cursor/ppa-prerequisite-independent-verification`  
**Verification tip base:** `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc`  
**Purpose:** Determine whether `995ee86 → 2ad5f4d → 739e42a → c8c9995` is the exact, complete, safe prerequisite stack for the UI Batch 1 controlled-integration base, under owner OD-INT-01…07 recommended answers.

**PPA** = Prior-Period Adjustment.

---

## 1. Executive recommendation

| Item | Verdict |
|---|---|
| Final PPA prerequisite acceptance | **PASS / ACCEPT** for use as the controlled-integration **base** |
| Proposed future controlled-integration base | **`c8c99950eaad6a2440a9fb91744d37a7d5dfdacc`** |
| Stack reconstruction required? | **No** — accept intact |
| Hidden prerequisite? | **No** |
| Main merge of PPA / UI | **Not authorised by this report** |
| UI Batch 1 controlled-integration branch | **Not created** |
| OD-A2 | Separate infra; **non-regressed**; not blocking prerequisite acceptance |
| Explicit non-blocking deferrals | True multi-key transactional atomicity not certified; audit-after-write non-atomic (prior QA Qs retained); `node:crypto` webpack failure at this tip (fixed later by accepted `a1efd47`, outside PPA stack); OD-A2 typecheck/build debt |

Owner OD-INT-01…07 recommended answers are treated as binding intent for **this verification**. This report does **not** merge anything.

---

## 2. Pre-flight (verified)

| Check | Result |
|---|---|
| `git fetch origin` | OK |
| Working tree clean at start | Yes |
| `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Local `main` (non-authoritative) | `739e42a39c51558311d030bcd96017c9056159fb` |
| Treat local main as authoritative? | **No** |
| `c8c9995` parent of `834cf22`? | **Yes** (`834cf22^` = `c8c9995`) |
| Ancestry difference / blocker? | **None** |

### 2.1 Resolved full SHAs and parent links

| Commit | Full SHA | Parent | Parent link |
|---|---|---|---|
| (baseline) | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` | — | `origin/main` tip |
| `995ee86` | `995ee861455cbda397783c5339e642a627c8f195` | `0afe878…` | **OK** |
| `2ad5f4d` | `2ad5f4d5743eae915c7bb77cd64d888b7dee572e` | `995ee86…` | **OK** |
| `739e42a` | `739e42a39c51558311d030bcd96017c9056159fb` | `2ad5f4d…` | **OK** |
| `c8c9995` | `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` | `739e42a…` | **OK** |

`origin/main...c8c9995` ahead/behind = **0 / 4**. Exactly four unique commits. No intervening commits.

### 2.2 Reachability / push status

| Commit | On `origin/main`? | Pushed on remotes? | Notable containing remotes |
|---|---|---|---|
| `995ee86` | **No** | **Yes** | `origin/cursor/m07-ppa1-integration`, `origin/cursor/m07-ppa1-security-concurrency-remediation`, UI Batch 1 / crypto / QC branches |
| `2ad5f4d` | **No** | **Yes** | same family |
| `739e42a` | **No** | **Yes** | `origin/cursor/m07-ppa1-integration` tip; also local `main` |
| `c8c9995` | **No** | **Yes** | `origin/cursor/m07-ppa1-security-concurrency-remediation` tip; UI Batch 1 lineage branches |

**Note:** Parallel non-lineage SHAs `86512b9` / `995c903` exist with similar messages but are **not** ancestors of `c8c9995`. They are **not** part of the prerequisite stack.

### 2.3 UI Batch 1 dependency on Adjustments

| Check | Result |
|---|---|
| `AdjustmentsSection` on `origin/main` | **Absent** |
| `AdjustmentsSection` at `c8c9995` | **Present** |
| `834cf22` modifies `AdjustmentsSection.tsx` | **Yes** |
| Applying UI Batch 1 to bare `origin/main` | **Incomplete / unsafe** |

---

## 3. Authoritative references inspected

| Source | Path | Source commit | Role |
|---|---|---|---|
| PPA implementation plan | `docs/plans/WAVE6_M07_PPA_IMPLEMENTATION_PLAN.md` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` | Scope / phases (planning authority on main) |
| PPA readiness/design | `docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md` | `484bcb0bc4884f4cbc166b7c6c730f2e16b11630` | Discovery; not implementation authorisation |
| PPA-1 independent QA | `docs/audits/WAVE6_M07_PPA1_INDEPENDENT_QA.md` | `4be4c04e438eb1fcb359b3f078acb10fc0bb80c7` (parent `739e42a`) | Independent QA at shell-wire tip; concurrency Major then open |
| Batch 6 owner acceptance | `docs/audits/WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md` | `ad54aed94b0c798d3f26fe66bf811d6e3b083151` | Ordinary prep closed; PPA deferred; OD-A2 noted |
| Batch 6 traceability | `docs/audits/WAVE6_BATCH6_REQUIREMENT_TRACEABILITY.md` | on `origin/main` / Batch 6 evidence set | Regression baseline |
| Wave-control | `.cursor/rules/hcdp-wave-control.mdc` | programme control (local + parent) | PPA planned-only until express batch auth; unlock ≠ PPA |
| UI Batch 1 controlled-integration plan | `docs/plans/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_PLAN.md` | `7f636a61a3ba730f1ee356314f01e0a644782087` | Names this prerequisite stack |
| Owner UI Decision Register | `docs/specifications/HCDP_OWNER_UI_DECISION_REGISTER.md` | `a4d9d3b2dc321ff16f6a42795e8e5bdbc996630b` | PPA-1 presentation bounds |
| Workforce contracts | `docs/architecture/WORKFORCE_CONTRACTS.md` | on main / architecture tree | M06–M07 contract context |
| M07 permissions matrix | `docs/architecture/WAVE6_M07_PERMISSIONS_MATRIX.md` | architecture tree | `payroll.adjust` context |
| Security remediation commit message / diff | `c8c9995` itself | `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` | QA-PPA1-001 hooks; QA-PPA1-002 open uniqueness |

Independent QA evaluated tip **`739e42a`** (3 commits). This verification evaluates tip **`c8c9995`** (4 commits), which **remediates** the prior concurrency Major (storage-level uniqueness + create gate + genuine interleave test).

---

## 4. Commit-by-commit inventory

| Commit | Parent | Purpose | Production files | Tests | Config | Docs/evidence | Dependencies | Scope classification | Acceptance evidence |
|---|---|---|---|---|---|---|---|---|---|
| `995ee86` | `0afe878` | PPA-1 core domain/service | `period-service.ts`, `ppa-service.ts`, `ppa-repository.ts`, `types/domain.ts` | `m07-ppa1-core.test.ts` | — | — | Batch 6 baseline | **Required PPA prerequisite** + **required test** | Covered by independent QA scope PASS; core suite green here |
| `2ad5f4d` | `995ee86` | Isolated Adjustments UI | `AdjustmentsSection.tsx`, `adjustments/*` | `m07-ppa1-ui.test.tsx` | — | — | `995ee86` | **Required PPA prerequisite** + **required test** | UI excludes calc/export/payment controls |
| `739e42a` | `2ad5f4d` | Wire into production shell | `StaffPayWorkspace`, `section-meta`, `sections/index`, store/audit/ppa wiring | atomicity + integration + shell/UI updates | — | — | `2ad5f4d` | **Required PPA prerequisite** + **required test** | Independent QA production-wiring PASS |
| `c8c9995` | `739e42a` | Hook security + one-open concurrency | `ppa-repository`, `ppa-service`, hooks gate, audit/store/inbox adapter touch | `m07-ppa1-hook-security.test.ts` + atomicity updates | — | — | `739e42a` | **Required PPA prerequisite** + **required test** | Addresses QA-PPA1-001/002; overlapping create test green |

### 4.1 File classification (`origin/main...c8c9995`)

All 22 paths are under `src/modules/m07-staff-pay/` only:

| Classification | Paths |
|---|---|
| Required PPA prerequisite | domain types; `ppa-service`; `ppa-repository`; `period-service` (adjustment period create); Adjustments UI; shell/section-meta/index wiring; audit/local-store deltas for PPA/test injection; hooks gate; minor `m02-inbox-publish` gate alignment |
| Required test | `m07-ppa1-*.test.*`, `_helpers`, `m07-shell.test.ts` updates |
| Required configuration | **None** (no package/tsconfig/next config) |
| Evidence/documentation | **None** in this four-commit production stack |
| Unrelated / potentially unauthorised | **None identified** |
| Protected-scope risk | Shared M07 files touched only for PPA wiring/hardening; **no** calculate/export/approval/lock-service/M06/platform/auth/Postgres/M08 paths |

---

## 5. PPA prerequisite verification checklist

| # | Question | Result |
|---|---|---|
| 1 | `AdjustmentsSection` exists by `c8c9995` | **Yes** |
| 2 | UI Batch 1 depends on that surface | **Yes** (`834cf22` edits it) |
| 3 | UI Batch 1 on bare `origin/main` incomplete/unsafe | **Yes** |
| 4 | Four-commit stack complete | **Yes** (exactly 4 commits; no gaps) |
| 5 | Additional hidden prerequisite required | **No** |
| 6 | Planning/evidence commit required for runtime | **No** |
| 7 | PPA-2 functionality introduced | **No** (lines/deltas/calc/approval/export absent; UI asserts absence) |
| 8 | Payment/export/provider integration introduced | **No** |
| 9 | Adjustment-line capability | **No** |
| 10 | PPA calculation/approval capability | **No** |
| 11 | PPA-1 within presentation/readiness scope | **Yes** — register/create/cancel draft; truthful `section-meta` note |
| 12 | Overview/Adjustments language truthful | **Yes** at this tip — Adjustments banner excludes payment/STP/Xero/M08; meta says foundation only. Overview GAP-PAR-003 copy fix lands later in `834cf22` (UI Batch 1), not required of PPA tip |
| 13 | Fake production data/metric/status | **No** evidence in PPA UI/integration suites; integration asserts no decorative calc/export actions |

---

## 6. PPA security and concurrency

| Rule | Status | Evidence |
|---|---|---|
| Authorisation (`payroll.adjust`) | **Pass** | core + integration deny paths; authz suite |
| Clinic / legal-entity boundaries | **Pass** | cross-LE fail-closed; clinic-scoped selector tests |
| Workforce identity | **Pass** | actor from staff-pay context; no widen via caller metadata |
| Repository access | **Pass** | LE-scoped list/get |
| Optimistic concurrency / stale writes | **Pass** (ordinary Batch 6 preserved) | Batch 6 unlock/version suites green; PPA does not unlock source |
| Idempotency | **Pass** | identical replay; conflicting replay rejected |
| Audit semantics | **Qualified pass** | `ppa.create` / replay / cancel present; audit-after-write non-atomic retained as known limitation |
| Lock/unlock behaviour | **Pass** | unlock ≠ PPA; source unchanged on create/cancel |
| PPA scope | **Pass** | draft cancel archives adjustment period only |
| Protected period lifecycle | **Pass** | only locked ordinary sources; Batch 6 green |
| Denial / error behaviour | **Pass** | fail-closed validation and permission errors |
| One-open-PPA concurrency | **Pass at `c8c9995`** | storage uniqueness + `withOpenPpaCreateGate`; atomicity case 8 genuine nested interleave |

**Relative to independent QA @ `739e42a`:** prior **Major** concurrency limitation (pre-write check only) is **remediated** by `c8c9995`. Residual **atomicity** qualification (compensation ≠ certified multi-key transaction) remains and is recorded as an explicit deferral, not a Critical.

---

## 7. Published-timesheet and crypto boundary

| Check | Result |
|---|---|
| PPA stack touches published-timesheet / hash / M06 / workforce contracts? | **No** (`git diff --name-only origin/main...c8c9995` has zero such paths) |
| Published-timesheet create/verify tests | **46/46** pass |
| Full M06 | **83/83** pass |
| Workforce contracts/events | **45/45** pass |
| Hash vector | **EXACT** `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Later browser-crypto assumptions | **Preserved** — PPA does not alter hash module; webpack `node:crypto` failure at this tip is **pre-existing** and fixed by later accepted `a1efd47` |

Evidence: `docs/audits/ppa-prerequisite-independent-verification/hash-vector-result.json`.

---

## 8. Protected-scope audit

| Protected area | Result |
|---|---|
| Ordinary payroll calculations | **Untouched** |
| Staff-pay prep rules (Batch 1–6) | **No rewrite**; Batch 5/6 regression green |
| Period lifecycle outside PPA-1 adjustment create/archive | **Preserved** |
| PPA repos beyond PPA-1 | **Within PPA-1** |
| PPA security/concurrency | **Hardened** toward accepted intent (hooks + open uniqueness) |
| PPA audit semantics | **Additive** `ppa.*` actions; qualifications retained |
| Locks/unlocks | **Not redefined**; unlock ≠ PPA proven |
| Published-timesheet / hashes / canonicalisation | **Untouched**; hash exact |
| Permissions / clinic / LE / identity | **Enforced**; no widen |
| Module availability / legacy aliases | Shell adds Adjustments availability only; aliases suite not re-run as browser (no PPA browser script at this tip); M07 shell unit green |
| M08 / Auth / Postgres / payment-export-provider | **Absent from diff** |
| Accepted evidence / wave-control files | **Not modified by PPA commits** |

**Scope expansion by commit/file:** none unauthorised identified.

---

## 9. OD-A2 inspection (no correction)

| Question | Answer |
|---|---|
| Exact error | `published-timesheet-outbox.ts:235` — `Property 'code'/'message' does not exist on type 'PublishFromOutboxResult'` |
| Exists at `origin/main` | **Yes** (blob `b194e9b9…` identical) |
| Exists at each PPA commit / `c8c9995` / `9d98d6e` | **Yes** — **identical blob** at all listed tips |
| First introduction | `4fed8ad9` (Wave 6 Batch 2) |
| Caused/worsened by PPA? | **No** |
| Runtime impact | Typecheck/build gate debt; not a PPA behavioural defect |
| Blocks prerequisite acceptance? | **No** (per OD-INT-04: separate infra correction) |
| Later correction boundary | Separate infrastructure CR; must not weaken typecheck/build gates; must not be folded into UI Batch 1 integration |

**Typecheck at `c8c9995`:** `npx tsc --noEmit` exit 2; includes OD-A2 plus pre-existing test typing noise (incl. new hook-security test `NODE_ENV` readonly issues — test typing only; runtime suite green).

**Production build at `c8c9995`:** `npx next build --webpack` fails earlier on **`node:crypto` UnhandledSchemeError** via `published-timesheet-hash.ts` barrel (pre-crypto remediation). OD-A2 typecheck phase is therefore **not reached** at this tip. That crypto failure is **outside** the PPA stack and is addressed by later accepted `a1efd47`.

---

## 10. Tests — exact commands and totals

All run at HEAD `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc`. Machine-readable: `docs/audits/ppa-prerequisite-independent-verification/independent-test-matrix.json`.

| # | Suite | Command | Exit | Totals |
|---|---|---|---|---|
| 1–5 | PPA-1 repo/integration/security/concurrency/audit (focused) | `npx tsx --test` five `m07-ppa1-*.test.*` files | 0 | **46/46** |
| 6 | Period/lock (Batch 6 + PPA unlock≠PPA) | Batch 6 cmds + PPA suites | 0 | **43** + PPA cases |
| 7–8 | Published-timesheet + contracts | registry + `m06-published-timesheet` ; `npm run test:workforce` | 0 | **46/46** ; **45/45** |
| 9 | Hash vector | `calculatePayrollContentHash` + `node:crypto` of `canonicalPayrollJson` | 0 | **EXACT** |
| 10–11 | Architecture/boundaries/permissions | arch + boundary + authz | 0 | **28/28** |
| 12 | Legacy routes/aliases | **Not re-executed as browser** at this tip (no QC-1 browser script on PPA tip); shell unit alias resolution remains in M07 shell suite | — | **Deferred to UI integration gates** (non-blocking for PPA prerequisite) |
| 13–14 | Batch 5 / Batch 6 | focused file sets | 0 | **49/49** ; **43/43** |
| 15–16 | Full M06 / Full M07 | `npm run test:m06` / `npm run test:m07` | 0 | **83/83** ; **246/246** |
| 17–18 | Typecheck | `npx tsc --noEmit` | 2 | OD-A2 + pre-existing / test typing (**preserved**, not manufactured pass) |
| 19 | Production build | `npx next build --webpack` | 1 | Fails on pre-existing `node:crypto` barrel (**not PPA**; **not OD-A2**) |

Wave5 evidence JSON files mutated transiently by M06 runs were **restored** and not committed.

---

## 11. Diff and integration-base determination

| Comparison | Meaning |
|---|---|
| `origin/main → 995ee86` | Core PPA-1 |
| `995ee86 → 2ad5f4d` | Isolated UI |
| `2ad5f4d → 739e42a` | Production shell wire-up |
| `739e42a → c8c9995` | Security/concurrency harden |
| `origin/main → c8c9995` | Full prerequisite tree (22 M07 paths) |
| `c8c9995 → 834cf22` | UI Batch 1 presentation only (tokens/primitives/Overview/Adjustments polish) |

| Determination | Value |
|---|---|
| Exact prerequisite tip | **`c8c99950eaad6a2440a9fb91744d37a7d5dfdacc`** |
| Exact rollback base for future UI integration | **`c8c9995`** (or `origin/main` if rolling back the whole prerequisite inclusion) |
| Ahead/behind vs `origin/main` | **0 / 4** |
| Unique commits | Exactly the four listed |
| File overlap with UI Batch 1 | `StaffPayWorkspace`, `AdjustmentsSection`, shell tests — semantic dependency confirmed |
| Exclude any prerequisite commit? | **No** |
| Accept intact without reconstruction? | **Yes** |
| Correct future controlled-integration base? | **Yes — `c8c9995`** |

---

## 12. Required verdicts

| # | Dimension | Verdict |
|---|---|---|
| 1 | Prerequisite lineage integrity | **PASS / ACCEPT** |
| 2 | PPA-1 scope compliance | **PASS / ACCEPT** |
| 3 | PPA security and concurrency | **PASS / ACCEPT** (at `c8c9995`; remediates prior Major at `739e42a`) |
| 4 | Published-timesheet compatibility | **PASS / ACCEPT** |
| 5 | Hash compatibility | **PASS / ACCEPT** (exact vector) |
| 6 | Protected-scope compliance | **PASS / ACCEPT** |
| 7 | OD-A2 non-regression status | **PASS / ACCEPT** (identical; separate CR) |
| 8 | Suitability of `c8c9995` as controlled-integration base | **PASS / ACCEPT** |
| 9 | Final PPA prerequisite acceptance recommendation | **PASS / ACCEPT** for controlled-integration **base** use |

**Explicit deferrals (non-blocking for base authorisation):**

1. Multi-key transactional atomicity not certified (compensation fail-closed only).  
2. Audit-after-write non-atomic / replay-audit best-effort (prior QA).  
3. OD-A2 outbox type error — separate infrastructure correction.  
4. Webpack `node:crypto` failure at this tip — remediated by later accepted browser-crypto commit, not by PPA.  
5. Live browser/legacy-alias crawl not re-proven on the PPA tip alone — required again on the future UI integration candidate.

---

## 13. Owner gate mapping

| Gate condition | Met? |
|---|---|
| Ancestry exact | **Yes** |
| All four commits present and pushed | **Yes** |
| No hidden prerequisite | **Yes** |
| Required PPA tests pass | **Yes** (46/46 focused; M07 246/246) |
| Security and concurrency correct | **Yes** at `c8c9995` |
| No Critical / unresolved Major | **Yes** for prerequisite acceptance |
| Stored-hash compatibility exact | **Yes** |
| No unauthorised PPA-2 / payment-export | **Yes** |
| OD-A2 separate and non-regressed | **Yes** |
| Protected-scope audit passes | **Yes** |

**Recommendation:** Owner may **authorise `c8c9995` as the controlled-integration base** for the future `cursor/ui-batch1-controlled-integration` lane. This is **not** main-merge authorisation for PPA or UI Batch 1.

---

## 14. Lane confirmations

| Item | Status |
|---|---|
| Production code changed | **No** |
| Tests/config changed | **No** |
| OD-A2 repaired | **No** |
| UI Batch 1 controlled-integration branch created | **No** |
| Merged / rebased / cherry-picked | **No** |
| UI Batch 2 started | **No** |
| Only new report + independent evidence | **Yes** |

---

*End of PPA prerequisite independent verification. STOP until a separately authorised controlled-integration implementation lane.*

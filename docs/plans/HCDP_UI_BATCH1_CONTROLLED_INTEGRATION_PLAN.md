# HCDP — Controlled Integration Plan: Accepted UI Batch 1 + Browser-Crypto + QC-1

**Document:** `docs/plans/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_PLAN.md`  
**Lane:** Planning and verification only (no merge, rebase, cherry-pick, production change, or OD-A2 repair)  
**Date:** 30 July 2026  
**Planning branch:** `cursor/ui-batch1-controlled-integration-plan`  
**Planning base:** `origin/main` @ `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Future implementation branch (NOT created by this lane):** `cursor/ui-batch1-controlled-integration`  
**UI Batch 2:** Unauthorised and not started  

---

## 1. Executive recommendation

| Item | Verdict |
|---|---|
| Production integration candidate | **`9d98d6e57ba3afaef4aa38e20640d2bfbc128122`** |
| Evidence-only tip (do not treat as production tip) | **`8ede3a0698d99d644c62a0e84f2d6c8850b101b9`** |
| Accepted production stack to integrate | `834cf22` → `a1efd47` → `9d98d6e` |
| Accepted lineage base (not itself a UI Batch 1 commit) | `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` |
| Recommended method | **Option A** — dedicated integration candidate from then-current `origin/main` |
| Direct merge to `main` | **Not authorised** by this plan |
| Fast-forward of `9d98d6e` onto current `origin/main` | Git-feasible, **governance-blocked** without explicit PPA-prerequisite authorisation |
| Main merge | Stop checkpoint only; requires later separate owner authorisation |

**Core finding:** `origin/main` (`0afe878`) is a strict ancestor of `9d98d6e` (ahead/behind `0 / 7`). Textual merge conflicts with current `origin/main` are **none**. However, between `origin/main` and the accepted UI lineage base sit **four PPA-1 commits** that are **not** on `origin/main`. UI Batch 1 production files (`AdjustmentsSection` presentation polish, Overview, shell) **depend** on that PPA surface. Integrating only `834cf22`/`a1efd47`/`9d98d6e` onto bare `origin/main` is not viable without those prerequisites.

**Recommended sequencing (subject to owner OD-INT-02 / OD-INT-04):**

1. Confirm or authorise the PPA-1 prerequisite tip that already contains `c8c9995` (or an equivalent accepted base).  
2. Create `cursor/ui-batch1-controlled-integration` from that then-current base.  
3. Apply only the accepted production stack `834cf22` → `a1efd47` → `9d98d6e` (or FF/merge equivalent if the base is already an ancestor of `9d98d6e` and no extra commits are desired beyond that tip).  
4. Keep `8ede3a0` and other independent-QA / planning commits **out** of the production integration tip.  
5. Rerun the full gate set in §14–15.  
6. **STOP** before any `main` merge.

This plan does **not** authorise main merge, OD-A2 repair, or UI Batch 2.

---

## 2. Authoritative commits and branches

### 2.1 Verified references (all objects present after `git fetch origin`)

| Role | Ref | SHA | Verified |
|---|---|---|---|
| Current `origin/main` tip | `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` | Yes |
| Local `main` (diverged; **not** used as planning base) | `main` | `739e42a39c51558311d030bcd96017c9056159fb` | Yes — local only |
| UI Decision Register | docs + commit | `a4d9d3b2dc321ff16f6a42795e8e5bdbc996630b` | Yes |
| First independent verification | docs + commit | `a4350c942aa2ce6987c62e9c348354900dfab712` | Yes |
| UI Batch 1 qualification plan | docs + commit | `86235bfa8ca976589ff675d0b239485d2a8b99d7` | Yes |
| QC-1 / production candidate branch | `origin/cursor/ui-batch1-qualification-completion` | `9d98d6e57ba3afaef4aa38e20640d2bfbc128122` | Yes |
| Independent re-verification branch | `origin/cursor/ui-batch1-qc1-independent-reverification` | `8ede3a0698d99d644c62a0e84f2d6c8850b101b9` | Yes |
| Browser-crypto remediation | candidate | `a1efd472ea086d98e82b6ca60da8b9071b1808e2` | Yes |
| UI Batch 1 implementation | candidate | `834cf22a63efc36423533586d56e8913d8bedd8b` | Yes |
| Accepted lineage base (PPA-1 security tip) | base | `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` | Yes |

### 2.2 Owner-accepted status (binding for this plan)

| Item | Status |
|---|---|
| UI Batch 1 implementation | PASS / OWNER ACCEPTED |
| Browser-crypto remediation | PASS / OWNER ACCEPTED |
| QC-1 narrow qualification | Independently accepted |
| F-MAJ-01 closure | Closed (OD-A1 NARROW) |
| F-MIN-04 closure | Closed (real in-app appearance) |
| Exact published-timesheet hash-vector compatibility | Accepted |
| Controlled integration | Qualified for **planning only** |
| Merge to `main` | **Not authorised** |
| UI Batch 2 | **Not authorised** |
| OD-A2 outbox | Unresolved; accepted known infra issue |
| OD-MIN-05 | Accepted non-blocking cosmetic deferral |

---

## 3. Production candidate versus evidence-tip distinction

| Question | Result |
|---|---|
| Is `8ede3a0` a direct child of `9d98d6e`? | **Yes** — `git rev-parse 8ede3a0^` = `9d98d6e…` |
| Does `8ede3a0` change production / test / config source? | **No** |
| `9d98d6e..8ede3a0` contents | `docs/audits/HCDP_UI_BATCH1_QC1_INDEPENDENT_REVERIFICATION.md` + `docs/audits/ui-batch1-qc1-independent-reverification/*` (report, JSON, screenshots only) |
| Appropriate production integration tip | **`9d98d6e` only** |
| Appropriate evidence tip / branch tip | **`8ede3a0` on `cursor/ui-batch1-qc1-independent-reverification`** |

**Rule:** Do not merge, FF, or cherry-pick `8ede3a0` merely because it descends from the candidate. Evidence may later be integrated as documentation under a separate owner decision (OD-INT-05).

---

## 4. Verified ancestry

```text
origin/main  0afe878  docs(m07): add PPA prior-period adjustment implementation plan
  └── 995ee86  feat(m07): add PPA-1 prior-period adjustment core domain and service
        └── 2ad5f4d  feat(m07): add isolated PPA-1 foundation adjustments UI
              └── 739e42a  feat(m07): wire PPA-1 Adjustments into production shell
                    └── c8c9995  fix(m07): harden PPA-1 test hooks and one-open-PPA concurrency
                          └── 834cf22  feat(ui): Premium Clinical Batch 1 for completed surfaces     ← UI Batch 1
                                └── a1efd47  fix(platform): remove node:crypto from browser hash path ← crypto
                                      └── 9d98d6e  fix(ui): close UI Batch 1 QC-1 gates               ← PRODUCTION CANDIDATE
                                            └── 8ede3a0  docs(audit): independent re-verification     ← EVIDENCE ONLY
```

Ancestry checks (exit 0 = ancestor):

| Check | Result |
|---|---|
| `c8c9995` → `834cf22` | True |
| `834cf22` → `a1efd47` | True |
| `a1efd47` → `9d98d6e` | True |
| `9d98d6e` → `8ede3a0` | True |
| `834cf22` / `a1efd47` / `9d98d6e` / `8ede3a0` on `origin/main` | **False** (none merged) |
| `origin/main` ancestor of `9d98d6e` | **True** (FF technically possible) |
| Merge-base(`origin/main`, `9d98d6e`) | `0afe878` (= current `origin/main`) |

**Lineage identity matches the owner-accepted stack. No material candidate-identity blocker.**

**Hidden-dependency finding (must not be assumed away):** accepted UI functionality depends on PPA commits `995ee86`…`c8c9995`, which exist on feature branches (and on **local** `main` @ `739e42a`) but **not** on `origin/main`.

---

## 5. Current-main divergence

| Metric | Value |
|---|---|
| Authoritative remote main tip | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Local `main` tip (unpushed relative to origin) | `739e42a` (includes PPA through shell wire-up; **not** planning base) |
| Accepted candidate | `9d98d6e` |
| `origin/main...9d98d6e` ahead/behind | **0 / 7** (main has no unique commits) |
| `origin/main...8ede3a0` ahead/behind | **0 / 8** |
| Commits unique to `origin/main` vs candidate | **None** |
| Commits unique to candidate vs `origin/main` | See §6 full stack |
| Overlapping changed files vs main tip | **None** (main has not moved in those paths since merge-base) |
| Likely textual conflicts vs current `origin/main` | **None** (`git merge-tree` scan: no `changed in both`) |
| Likely semantic conflicts vs current `origin/main` | **Low vs tip files**; **High vs programme intent** if PPA is pulled without authorisation |
| Candidate stale vs `origin/main`? | **No** — main has not advanced past the shared base |
| Fresh integration branch necessary? | **Yes** — for reviewability, evidence separation, and protected-scope audit (Option A) |

### 5.1 Attention areas (candidate vs accepted base / main)

| Area | Touched by accepted UI/crypto/QC-1 stack? | Notes |
|---|---|---|
| Dashboard / shell | Yes (`DashboardWorkspace`, `PageHeader`) | QC-1 F-MAJ-01 NARROW |
| Appearance / hydration | Yes (clinic/identity `getServerSnapshot`) | F-MIN-04 support |
| Clinic / identity context | Yes | Referential stability only |
| Shared UI primitives | Yes | Batch 1 tokens/components |
| M06/M07 browser barrels | Yes (`index.ts` stop re-exporting adapters/services) | Crypto boundary |
| Hashing / canonicalisation | Yes (`published-timesheet-hash`, `sha256-hex-utf8`) | Exact vector retained |
| Published-timesheet create/verify | Tests only in stack; outbox file untouched | OD-A2 separate |
| PageHeader / tokens / globals | Yes | Presentation |
| PPA-1 presentation | Yes (Adjustments polish on top of PPA UI) | Depends on PPA commits |
| Permissions / contracts / module availability | No domain permission changes in UI/crypto/QC-1 deltas | Preserve |

---

## 6. Commit-by-commit stack inventory

### 6.1 Prerequisite commits between `origin/main` and accepted lineage base

These are **not** UI Batch 1 / crypto / QC-1 commits. They are **required ancestors** of the accepted candidate and are **absent from `origin/main`**.

| Commit | Purpose | Production files | Tests | Evidence/docs | Dependencies | Accepted status | Integration classification |
|---|---|---|---|---|---|---|---|
| `995ee86` | PPA-1 core domain/service | `period-service`, `ppa-service`, `ppa-repository`, `types/domain` | `m07-ppa1-core.test.ts` | — | M07 Batch 6 baseline on main | PPA implementation (outside this UI acceptance statement) | **Requires separate PPA authorisation / prerequisite** — not UI Batch 1 |
| `2ad5f4d` | Isolated PPA-1 Adjustments UI | `AdjustmentsSection` + adjustments/* | `m07-ppa1-ui.test.tsx` | — | `995ee86` | Same | **Prerequisite** |
| `739e42a` | Wire Adjustments into production shell | `StaffPayWorkspace`, `section-meta`, store, audit, ppa services, sections/index | atomicity + integration + shell updates | — | `2ad5f4d` | Same; local `main` currently here | **Prerequisite** |
| `c8c9995` | PPA-1 security/concurrency harden | ppa/audit/store/hooks gate; inbox adapter | hook-security + atomicity updates | — | `739e42a` | Accepted lineage **base** | **Prerequisite base** — do not classify as UI Batch 1 production |

### 6.2 Accepted production stack (owner-accepted UI Batch 1 + crypto + QC-1)

| Commit | Purpose | Production files | Tests | Evidence/docs | Dependencies | Accepted status | Integration classification |
|---|---|---|---|---|---|---|---|
| `834cf22` | Premium Clinical UI Batch 1 | `globals.css`, `tokens.css`, `PageHeader`, UI primitives, `StaffPayWorkspace`, `OverviewSection`, `AdjustmentsSection` (presentation) | `m07-shell.test.ts`, `m07-ui-batch1-presentation.test.ts` | — | Requires `c8c9995` tree (Adjustments exists) | OWNER ACCEPTED | **Required production implementation** + **required regression test** |
| `a1efd47` | Browser-crypto remediation | `published-timesheet-hash.ts`, `sha256-hex-utf8.ts`, M06/M07 `index.ts` barrels | `browser-crypto-remediation.test.ts` | `docs/audits/browser-crypto-remediation/*` (incl. report JSON + screenshots), `scripts/browser-crypto-remediation-validate.mjs` | `834cf22` | OWNER ACCEPTED | **Required production implementation** + **required regression test** + **config/script**; bundled remediation evidence travels with commit |
| `9d98d6e` | QC-1 chrome truthfulness + appearance | `DashboardWorkspace.tsx`, `clinic-context.tsx`, `identity-context.tsx` | `ui-batch1-qualification-chrome.test.ts` | `docs/audits/ui-batch1-qualification-completion/*`, `scripts/ui-batch1-qualification-browser-validate.mjs` | `a1efd47` | OWNER ACCEPTED / QC-1 | **Required production implementation** + **required regression test** + validation script; QC-1 evidence bundle travels with commit |

### 6.3 Evidence / planning commits — exclude from production tip

| Commit | Purpose | Classification |
|---|---|---|
| `8ede3a0` | Independent QC-1 re-verification report + screenshots/JSON | **Evidence-only** — retain on evidence branch; optional later docs integration (OD-INT-05) |
| `a4350c9` | First independent crypto+UI verification report | **Evidence-only** (parent `a1efd47`) — not production tip |
| `86235bf` | Qualification completion **plan** | **Planning-only** |
| `a4d9d3b` | Owner UI Decision Register | **Documentation** — integrate separately if/when owner wants register on main |

### 6.4 Hidden-dependency confirmation

| Question | Answer |
|---|---|
| Does accepted UI Batch 1 depend on commits only on planning/QA/evidence branches? | **Production behaviour depends on PPA commits on implementation branches, not on evidence-only commits.** |
| Does accepted functionality depend on `8ede3a0` / `a4350c9` / `86235bf`? | **No** |
| Can `834cf22` apply cleanly onto current `origin/main` without PPA? | **No** — `AdjustmentsSection.tsx` does not exist on `origin/main` |
| Any prohibited-from-production items in `9d98d6e` tip? | Evidence screenshots/JSON under `docs/audits/...` are non-runtime; acceptable to carry with implementation commits or strip later under OD-INT-05. Independent report commit must stay out. |

---

## 7. File-level overlap and conflict analysis

### 7.1 Comparisons performed

| Comparison | Result |
|---|---|
| `origin/main` → `834cf22` | Includes full PPA + UI Batch 1 file set |
| `origin/main` → `a1efd47` | Above + crypto production/tests/script + remediation evidence |
| `origin/main` → `9d98d6e` | Above + QC-1 production/tests/script + QC-1 evidence |
| `9d98d6e` → `8ede3a0` | Evidence/docs only |

### 7.2 Production / test / script files at `origin/main...9d98d6e` (excluding PNG)

Includes PPA prerequisite + accepted stack (abbreviated by role):

**UI Batch 1 / QC-1 / crypto (accepted):**  
`src/app/globals.css`, `src/styles/tokens.css`, `src/components/shell/PageHeader.tsx`, `src/components/ui/{Badge,Button,EmptyState,Panel,Table,Tabs}.tsx`, `src/components/workspaces/DashboardWorkspace.tsx`, `src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts`, `src/modules/m06-time-attendance/index.ts`, `src/modules/m07-staff-pay/index.ts`, `src/modules/m07-staff-pay/StaffPayWorkspace.tsx`, `OverviewSection.tsx`, `AdjustmentsSection.tsx` (presentation delta), `src/platform/context/{clinic,identity}-context.tsx`, `src/platform/workforce/contracts/{published-timesheet-hash,sha256-hex-utf8}.ts`, `src/platform/workforce/tests/browser-crypto-remediation.test.ts`, `src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts` (+ shell test updates), `scripts/browser-crypto-remediation-validate.mjs`, `scripts/ui-batch1-qualification-browser-validate.mjs`

**PPA prerequisite (also in range):**  
`ppa-service`, `ppa-repository`, adjustments components, PPA tests, period-service/domain additions, audit/local-store/section-meta wiring, hooks gate, etc.

### 7.3 Conflict risk summary

| Risk | Assessment |
|---|---|
| Textual conflict vs current `origin/main` | **None** |
| Semantic overlap with recent main commits | **None** (main unique commits empty) |
| Programme / wave-control overlap | **PPA prerequisite inclusion** — owner decision required |
| Local vs remote main mismatch | Local `main` @ `739e42a` already contains PPA shell wire-up; **do not assume origin equals local** |

---

## 8. OD-A2 outbox classification

| # | Question | Evidence-backed answer |
|---|---|---|
| 1 | Exact file and error | `src/modules/m06-time-attendance/services/published-timesheet-outbox.ts:235` — `Property 'code' does not exist on type 'PublishFromOutboxResult'` (also `message`) when building `lastError` after non-success branch |
| 2 | First known introducing commit | `4fed8ad9` — Wave 6 Batch 2 timesheet boundary (blame on line 235) |
| 3 | Predates UI Batch 1? | **Yes** |
| 4 | UI Batch 1 touched it? | **No** (`git log` / diff empty for this file on accepted stack) |
| 5 | Crypto remediation touched it? | **No** |
| 6 | QC-1 touched it? | **No** |
| 7 | Exists on current `origin/main`? | **Yes** (identical) |
| 8 | Exists at `9d98d6e`? | **Yes** (identical; severity unchanged) |
| 9 | Affects scoped/full typecheck? | **Yes** — `npx tsc --noEmit` fails (pre-existing) |
| 9b | Production build? | Webpack compile can succeed; build typecheck fails at outbox:235 (`npx next build --webpack`) |
| 9c | Browser runtime / published-timesheet runtime? | **No** direct browser runtime failure from this type error; independent browser gates passed at candidate |
| 9d | Integration safety? | Does **not** alter candidate behavioural correctness for UI/crypto; **does** leave full typecheck/build gates red unless repaired or explicitly accepted as known gate debt |
| 10 | Can controlled integration occur before repair? | **Technically yes** for constructing an integration candidate and rerunning UI/crypto gates; **not** a claim that production build is green |
| 11 | Separate infra correction before integration? | Owner decision **OD-INT-04** |
| 12 | Correction posture | Recommend: **separate follow-up infrastructure CR after (or in parallel with) integration-candidate construction**; **not** silently fixed inside UI Batch 1 integration; **not** suppressed by weakening typecheck/build gates; **not** resolved by any commit currently unique to `origin/main` |

**This lane does not repair or suppress OD-A2.**

---

## 9. Integration options comparison

| Option | Feasible | Risks | Evidence preservation | Conflict risk | Rollback clarity | Recommendation |
|---|---|---|---|---|---|---|
| **A — Dedicated integration candidate from then-current main** | **Yes** (preferred) | Must explicitly decide PPA prerequisite handling if main lacks `c8c9995` | Keep evidence commits off tip; re-run gates on new branch | Low textual vs current origin/main; governance risk if PPA pulled implicitly | High — branch + known parent tip | **RECOMMENDED** |
| **B — Merge accepted candidate tip `9d98d6e`** | Git-yes onto ancestor main | Pulls entire 7-commit range including PPA; less selective review | Evidence tip still separable if merge stops at `9d98d6e` | Textual low | Medium | Acceptable only if owner explicitly authorises full ancestral range as the integration content |
| **C — Contiguous cherry-pick `834cf22`→`a1efd47`→`9d98d6e`** | Only if base already contains `c8c9995` | Onto bare `0afe878`: missing files / failed picks; duplicate-commit risk if later FF also used | Good if evidence omitted | High on bare main; low on `c8c9995` base | Medium | Viable **after** PPA base is present |
| **D — Fast-forward to `9d98d6e`** | Git-yes (`origin/main` ancestor) | Silently lands PPA+UI+crypto+QC-1; weak review boundary; wave-control tension | Excludes `8ede3a0` if FF stops at candidate | None textual | High mechanically, weak governance | **Not recommended** unless owner expressly authorises FF of the full ancestral range |

**Direct merging to `main` is not selected.** Any main merge requires a later, separate owner authorisation after integration-candidate verification (§20).

---

## 10. Recommended integration method

**Select Option A.**

Rationale:

1. Preserves a reviewable, named candidate branch.  
2. Separates production tip (`9d98d6e` content) from evidence tip (`8ede3a0`).  
3. Forces explicit handling of the PPA prerequisite gap vs `origin/main`.  
4. Avoids treating FF convenience as governance approval.  
5. Matches rollback and stop-checkpoint discipline.

---

## 11. Exact future branch / base / commit sequence

### 11.1 Future implementation branch (do **not** create in this lane)

| Item | Value |
|---|---|
| Branch name | `cursor/ui-batch1-controlled-integration` |
| Proposed base | **Then-current `origin/main` tip at implementation start**, subject to OD-INT-02 |
| Hard requirement | Base must already contain accepted lineage base `c8c9995` **or** owner must expressly authorise including prerequisite commits `995ee86`→`2ad5f4d`→`739e42a`→`c8c9995` in the same integration candidate |

### 11.2 Commits to integrate (production), in order

If base already contains `c8c9995`:

1. `834cf22a63efc36423533586d56e8913d8bedd8b` — UI Batch 1  
2. `a1efd472ea086d98e82b6ca60da8b9071b1808e2` — browser-crypto  
3. `9d98d6e57ba3afaef4aa38e20640d2bfbc128122` — QC-1  

If base is still `0afe878` (or equivalent without PPA): **STOP** — do not invent a partial UI-only apply; obtain OD-INT-02 authorisation for prerequisite inclusion or prior PPA integration.

### 11.3 Commits explicitly excluded from production tip

| Commit | Reason |
|---|---|
| `8ede3a0698d99d644c62a0e84f2d6c8850b101b9` | Evidence-only independent re-verification |
| `a4350c942aa2ce6987c62e9c348354900dfab712` | Evidence-only first independent QA |
| `86235bfa8ca976589ff675d0b239485d2a8b99d7` | Planning-only |
| `a4d9d3b2dc321ff16f6a42795e8e5bdbc996630b` | Register docs — separate docs integration |
| Any UI Batch 2 / opportunistic cleanup commits | Unauthorised |
| OD-A2 “drive-by” fixes | Prohibited in this integration lane |

### 11.4 Treatment of evidence and documentation

| Artifact | Treatment |
|---|---|
| Independent re-verification report + screenshots (`8ede3a0`) | Remain on `cursor/ui-batch1-qc1-independent-reverification`; optional later docs merge (OD-INT-05) |
| First independent QA (`a4350c9`) | Remain on evidence/QA branch; optional later docs merge |
| Qualification plan (`86235bf`) | Planning branch retention; optional later docs merge |
| Owner UI Decision Register (`a4d9d3b`) | Separate documentation integration if desired |
| Evidence bundled inside `a1efd47` / `9d98d6e` (`docs/audits/browser-crypto-remediation/*`, `docs/audits/ui-batch1-qualification-completion/*`) | Travels with those commits unless owner directs stripping in a docs-only follow-up |
| Machine-readable matrices / hash-vector JSON on evidence branch | Evidence branch retention |

---

## 12. Evidence and documentation treatment (summary)

- Production tip = behavioural + required tests + validation scripts at `9d98d6e`.  
- Independent QA narrative commits stay off production tip.  
- Planning docs created by this lane stay on the planning branch until separately authorised.  
- Do not rewrite accepted evidence history.

---

## 13. Conflict-management rules

1. Integration lane may resolve **textual** conflicts only under a separately authorised implementation run — **not** in this planning lane.  
2. No conflict resolution may alter payroll calculations, PPA repositories/security/concurrency/audit semantics, locks/unlocks, hash compatibility, permissions, clinic/legal-entity semantics, workforce identity semantics, M06–M07 contracts, module availability, legacy aliases, wave-control, Auth, Postgres, payment/export integrations, or M08.  
3. If a conflict would require behavioural change in protected scope → **STOP** and escalate to owner.  
4. No opportunistic cleanup, formatting-only sweeps, or UI Batch 2 work while resolving conflicts.  
5. Conflict ownership: future authorised integration implementer; independent QA re-verifies after resolution.

---

## 14. Required tests and exact commands

Commands discovered from repository scripts / QC-1 independent matrix. Do not invent substitutes.

### 14.1 Command → requirement mapping

| Gate #s | Requirement coverage | Exact command |
|---|---|---|
| 1–4, 7 (partial) | QC-1 focused; dashboard truthfulness; chrome interaction assertions; Light/Dark/System + hydration/persistence (suite) | `npx tsx --test src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts` |
| 5, 9 (presentation) | UI Batch 1 presentation | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts` |
| 10 (partial) | M07 shell / navigation unit | `npx tsx --test src/modules/m07-staff-pay/tests/m07-shell.test.ts` |
| 11 | M05 regression | `npm run test:m05` |
| 12 | Full M06 regression | `npm run test:m06` |
| 13 | Full M07 regression (includes Batch 5/6, PPA, shell, authz, architecture overlaps) | `npm run test:m07` |
| 14 | PPA-1 UI | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-ui.test.tsx` |
| 14 | PPA-1 integration | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-integration.test.tsx` |
| 14 | PPA-1 security / concurrency / core / atomicity | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-hook-security.test.ts src/modules/m07-staff-pay/tests/m07-ppa1-core.test.ts src/modules/m07-staff-pay/tests/m07-ppa1-atomicity.test.ts` |
| 15–16, 18 (partial) | Browser/server boundary + crypto remediation | `npx tsx --test src/platform/workforce/tests/browser-crypto-remediation.test.ts` |
| 16 + workforce | Workforce / hash contracts | `npm run test:workforce` |
| 18 | Published-timesheet registry create/verify | `npx tsx --test src/platform/workforce/tests/published-timesheet-registry.test.ts` |
| 18 | M06 published-timesheet create/verify | `npx tsx --test src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts` |
| 17 | Exact hash-vector compatibility | Reproduce independent vector check used in re-verification (expected hex `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` per `docs/audits/ui-batch1-qc1-independent-reverification/hash-vector-result.json` on evidence branch). Prefer the same pure/node/calc equality method recorded in that evidence; do not weaken expected digest. |
| 19 | Architecture + boundary | `npx tsx --test src/modules/m07-staff-pay/tests/m07-architecture-cp27.test.ts src/modules/m07-staff-pay/tests/m07-boundary-cp23.test.ts` |
| 20 | Permissions / authz | `npx tsx --test src/modules/m07-staff-pay/tests/m07-authz.test.ts` |
| 21 | Legacy alias/redirect | Covered by browser validation script alias crawl (`scripts/ui-batch1-qualification-browser-validate.mjs`) |
| 22 | Scoped / full typecheck | `npx tsc --noEmit` |
| 23–24 | Production build | `npx next build --webpack` (and note default `npm run build` / `next build` behaviour on the integration host) |
| 6, 8, 21, 25–27 | Real browser / responsive / a11y | `node scripts/ui-batch1-qualification-browser-validate.mjs` (with app served as in prior QC-1 evidence); plus `node scripts/browser-crypto-remediation-validate.mjs` for crypto console/`node:crypto` absence |
| 28 | Changed-file + protected-scope audit | `git diff --name-status <integration-base>...<integration-tip>` reviewed against §16 checklist |

**Overlaps:** `npm run test:m07` already includes many PPA/Batch/shell/authz/architecture files; focused commands above remain required for explicit QC-1 mapping and failure isolation. Independent matrix also recorded Batch 5/6 focused runs; full `test:m07` satisfies those suites when green.

### 14.2 Git ancestry / diff-scope verification (Gate 1)

After constructing the candidate:

```text
git fetch origin
git rev-parse HEAD
git merge-base --is-ancestor <expected-base> HEAD
git log --oneline <base>..HEAD
git diff --name-status <base>...HEAD
```

Confirm tip equals intended production content of `9d98d6e` (or equivalent tree) and that `8ede3a0` is **not** required on HEAD.

---

## 15. Browser, responsive and accessibility gates

### 15.1 Real-browser route validation

Validate (cold + warm where applicable) with HTTP result, console errors, hydration errors, client/server boundary errors, runtime exceptions, `node:crypto` absence, operational-control behaviour, and in-app appearance switching:

- `/dashboard`
- `/action-inbox`
- `/settings`
- `/staff-doctors`
- `/roster`
- `/time-attendance`
- `/staffpay`
- every completed M07 section reachable in production shell
- `/staffpay?section=overview`
- `/staffpay?section=adjustments`

**Do not** accept shell-text snippets as sufficient route proof. Prefer scripted Playwright validation already in-repo:

- `scripts/ui-batch1-qualification-browser-validate.mjs`
- `scripts/browser-crypto-remediation-validate.mjs`

Appearance: exercise **in-app** Light / Dark / System selector (not OS `colorScheme` alone).

### 15.2 Responsive widths

Verify at **1440, 1280, 1024, 768, 430, 390**:

- no unintended horizontal overflow  
- usable navigation  
- reachable primary actions  
- meaningful labels  
- acceptable OD-MIN-05 cosmetic truncation (non-blocking)  
- keyboard navigation; logical focus order; visible focus  
- accessible names; landmarks/headings  
- readable statuses; no colour-only meaning  
- usable touch targets  
- reduced-motion behaviour  

---

## 16. Protected-scope audit

Future integration **must not** change:

| Protected area | Audit method |
|---|---|
| Payroll calculations | Diff must not touch calculation services beyond already-accepted PPA prerequisite (if authorised) / UI presentation |
| Period lifecycle | No unintended period-service behaviour deltas beyond accepted prerequisite |
| PPA repositories / security / concurrency / audit semantics | If PPA prerequisite included, tree must match accepted `c8c9995` semantics; UI commits must remain presentation-only on Adjustments |
| Locks / unlocks | No new lock/unlock behaviour in UI/crypto/QC-1 commits |
| PPA scope creep (PPA-2+, lines/deltas, calc/approval/export UI) | Absent from diff |
| Stored hash compatibility / published-timesheet canonicalisation | Hash-vector gate must remain exact |
| Permissions; clinic/legal-entity; workforce identity semantics | Context diffs limited to hydration snapshot stability |
| M06–M07 contracts; module availability; legacy aliases | Barrel changes only as in `a1efd47`; aliases still redirect |
| Wave-control; accepted evidence rewrite | No rule/evidence history mutation |
| M08; Auth; Postgres; payment/export integrations | Absent from diff |

**Explicit diff audit command:**

```text
git diff --name-status <integration-base>...<integration-tip>
git diff <integration-base>...<integration-tip> -- src/modules/m07-staff-pay/services src/modules/m07-staff-pay/storage src/platform/workforce/contracts src/platform/auth src/modules/m08*
```

Fail the audit if unexpected paths appear or protected semantics drift.

---

## 17. Rollback procedure

1. Do not merge to `main` until authorised.  
2. If the future integration branch is unhealthy: reset or abandon the branch pointer to the recorded base SHA; keep rejected tip reachable via tag/ref if evidence needed (`ui-batch1-integration-rejected-<date>` optional).  
3. Rollback point = **exact integration-base SHA** recorded at branch creation.  
4. Retain evidence branches (`cursor/ui-batch1-qc1-independent-reverification`, first QA branch, planning branches) untouched.  
5. Never force-push `main`.  
6. Never delete accepted candidate SHAs (`834cf22`, `a1efd47`, `9d98d6e`, `8ede3a0`).

---

## 18. Stop checkpoints

| Checkpoint | Condition | Action |
|---|---|---|
| SC-0 (this lane) | Planning doc committed/pushed | **STOP** — no implementation branch, no merge |
| SC-1 | Owner decides OD-INT-01…07 | Proceed only under explicit authorisation |
| SC-2 | Integration branch created + stack applied | Run §14–16 gates; do not merge |
| SC-3 | Gates green **or** known failures classified (incl. OD-A2) | Independent verification optional/required per OD-INT-06 |
| SC-4 | Pre-main-merge | Requires **separate** owner main-merge authorisation (§20) |
| SC-5 | UI Batch 2 | Remains blocked until separate owner prompt after SC-4 |

---

## 19. Owner decision matrix

### OD-INT-01 — Integration method

| Options | Risks | Recommended answer |
|---|---|---|
| A dedicated candidate branch | Slightly more steps | **Select A** |
| B merge `9d98d6e` | Pulls PPA ancestors if from bare main | Only if ancestral range expressly authorised |
| C cherry-pick three commits | Fails without PPA base | Only after `c8c9995` present |
| D FF to `9d98d6e` | Governance blur | Avoid unless expressly authorised |

### OD-INT-02 — Exact integration base

| Options | Risks | Recommended answer |
|---|---|---|
| Then-current `origin/main` **without** PPA | Cannot apply UI stack alone | **Do not** use bare `0afe878` without prerequisite decision |
| Base that already contains `c8c9995` | Requires prior/parallel PPA integration to origin | **Preferred** |
| Explicitly include `995ee86…c8c9995` in same candidate | Wave-control / PPA authorisation tension | Only with explicit PPA authorisation |

**Note:** Local `main` currently sits at `739e42a` while `origin/main` is `0afe878`. Owner should reconcile remote main before implementation.

### OD-INT-03 — Evidence-only commits

| Options | Risks | Recommended answer |
|---|---|---|
| Keep `8ede3a0` / first QA off production tip | Docs not on main yet | **Recommended** |
| Include evidence commits in integration tip | Mixes audit narrative into production history | Avoid |
| Later docs-only PR | Extra step | Acceptable follow-up |

### OD-INT-04 — OD-A2 repair before integration?

| Options | Risks | Recommended answer |
|---|---|---|
| Prerequisite repair before constructing candidate | Delays UI landing; expands scope | Not required for candidate construction |
| Separate follow-up after/alongside integration | Build/typecheck remain red | **Recommended** — separate infra CR; do not weaken gates |
| Accept as known issue through main merge | Production build debt on main | Owner-only; this plan does not approve |
| Claim main already fixed it | False — identical failure on origin/main | Reject |

### OD-INT-05 — Documentation follows separately?

| Options | Risks | Recommended answer |
|---|---|---|
| Yes — register, plans, independent reports later | Temporary doc lag on main | **Recommended** |
| Bundle all docs into integration tip | Larger review; evidence/prod mix | Avoid for independent reports |
| Never land docs on main | Loss of discoverability | Not recommended long-term |

### OD-INT-06 — Validation depth before main merge

| Options | Risks | Recommended answer |
|---|---|---|
| Full §14–15 gates + protected-scope audit | Time | **Recommended minimum** |
| QC-1 focused only | Insufficient for main | Reject for main-merge readiness |
| Allow fail on OD-A2 typecheck/build | Known debt | Possible only with explicit owner acceptance of gate debt |

### OD-INT-07 — Rollback and branch-retention

| Options | Risks | Recommended answer |
|---|---|---|
| Retain candidate + evidence branches; abandon bad integration tip | Storage negligible | **Recommended** |
| Delete evidence branches after merge | Loss of audit trail | Reject |
| Force-push recovery on main | History hazard | Reject |

**This plan does not make a merge-authorisation decision on the owner’s behalf.**

---

## 20. Criteria for later main-merge authorisation

Main merge remains **unauthorised** until the owner separately confirms all of:

1. Integration candidate branch exists and tip tree matches accepted production intent of `9d98d6e` (with prerequisite policy satisfied).  
2. §14–15 gates executed on that candidate; results recorded.  
3. Protected-scope audit passed.  
4. OD-A2 disposition explicitly recorded (repair done **or** accepted known gate debt).  
5. Evidence commits policy (OD-INT-03/05) recorded.  
6. Rollback ref/base SHA recorded.  
7. Explicit written authorisation to merge **that named tip** into `main`.  
8. UI Batch 2 still not started from this merge.

---

## 21. UI Batch 2 boundary confirmation

- No UI Batch 2 design or implementation enters the integration diff.  
- No opportunistic cleanup.  
- No new dashboard redesign beyond accepted QC-1 NARROW chrome truthfulness.  
- No new module scope.  
- UI Batch 2 requires a **separate owner-authorisation prompt** after controlled integration reaches its stop checkpoint (SC-4/SC-5).

---

## 22. Planning-lane execution record

| Item | Value |
|---|---|
| Pre-flight fetch | Performed |
| Working tree at planning start | Clean |
| Planning branch | `cursor/ui-batch1-controlled-integration-plan` |
| Planning base | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` (`origin/main`) |
| Created file | `docs/plans/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_PLAN.md` |
| Production code changed | **No** |
| OD-A2 repaired | **No** |
| Implementation integration branch created | **No** |
| Merged / rebased / cherry-picked | **No** |
| UI Batch 2 started | **No** |

---

*End of controlled-integration plan. Stop until owner decisions OD-INT-01…07 and a separately authorised implementation lane.*

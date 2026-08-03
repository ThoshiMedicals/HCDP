# HCDP — UI Batch 1 Controlled Integration Independent Verification

**Lane:** verification-only  
**Branch:** `cursor/ui-batch1-controlled-integration-independent-verification`  
**Candidate verified:** `cursor/ui-batch1-controlled-integration` @ `e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8`  
**Worktree:** `C:\Users\ETB Sri Lanka\Desktop\HCDP\.worktrees\ui-batch1-controlled-integration-independent-verification`  
**Date:** 2026-08-03  

Evidence directory: `docs/audits/ui-batch1-controlled-integration-independent-verification/`

---

## 1. Executive verdict

**QUALIFIED PASS for owner inspection.**

Ancestry, patch equivalence, UTF-8 correction, functional regressions (after isolated re-run), hash, both production builds, protected scope, QC-1 browser gates, appearance persistence, and localhost preservation all verify independently.

Hydration is **not** a broad-pattern false positive: independent console capture shows genuine React hydration mismatches on M04 / M05 / M07 / portal-chrome surfaces with **zero** `node:crypto` hits. This matches the historical crypto-script `pass: false` class on `a1efd47` / controlled-integration evidence and is adjudicated as **unchanged pre-existing debt**, not a new candidate regression → **QUALIFIED** on hydration behaviour (and therefore overall).

This lane did **not** merge, did **not** alter production code, and did **not** start UI Batch 2.

---

## 2. Exact refs

| Ref | SHA |
| --- | --- |
| `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Candidate tip | `e5e41a0d79c8b84d3380c4c85372dcc95b0a78b8` |
| Integration base | `6d633ce1da75a4450d1c1fe186c0d3d502bc6a87` |
| Product tip | `25de6f1d4497893a36ea1ac4ed491929726255fc` |
| UI Batch 1 cherry | `1565f502` ← source `834cf22` |
| Browser crypto cherry | `0e24d355` ← source `a1efd47` |
| QC-1 cherry | `25de6f1` ← source `9d98d6e` |
| Integration evidence | `def2c691` |
| Localhost handoff | `a15d325` |
| UTF-8 correction | `e5e41a0` |

---

## 3. Complete ancestry

First-parent sequence after base (independently proven):

`6d633ce1` → `1565f502` → `0e24d355` → `25de6f1` → `def2c691` → `a15d325` → `e5e41a0`

Parents of tip/`e5e41a0` = `a15d325`; of `a15d325` = `def2c691`; of `def2c691` = `25de6f1`. Exactly three product commits after base. No merge commits in range.

Excluded evidence-only commits **absent** as ancestors: `da2dd1c5`, `acff2972`, `8ede3a0`.

Evidence: `ancestry-graph.txt`.

---

## 4. Source-patch and tree equivalence

| Check | Result |
| --- | --- |
| `git patch-id --stable` UI Batch 1 | identical (`f3bd1b29…`) |
| `git patch-id --stable` crypto | identical (`05cb328a…`) |
| `git patch-id --stable` QC-1 | identical (`65659925…`) |
| `git range-diff` (each + full chain) | maps 1↔1; only `(cherry picked from …)` trailer differences |
| Tree `9d98d6e` ↔ `25de6f1` | OD-A2 five files only (base already carries OD-A2) |
| Tree `6d633ce1` ↔ `25de6f1` | 65 paths — UI Batch 1 + crypto + QC-1 only |
| Post-product (`25de6f1..e5e41a0`) non-docs | empty (docs/evidence/handoff only) |
| Order | UI → crypto → QC-1 (authorised) |

Evidence: `range-diff.txt`, `tree-diff-vs-6d633ce1.txt`, `tree-diff-vs-9d98d6e.txt`.

---

## 5. Changed-file classification

Product tip vs base adds Premium Clinical UI / shared chrome, browser-safe hashing, QC-1 truthfulness + clinic/identity snapshot stability, plus source evidence trees under `docs/audits/browser-crypto-remediation/` and `docs/audits/ui-batch1-qualification-completion/`.

Contextual product paths outside pure UI chrome: `src/platform/context/clinic-context.tsx`, `identity-context.tsx`, `src/styles/tokens.css` — QC-1 / Batch 1 expected.

No UI Batch 2 paths. No protected payroll calc / lock / PPA repo / payment / provider / M08 / wave-control path hits.

Evidence: `changed-file-classification.txt`, `protected-scope-filename-scan.txt`, `product-review-probes.txt`.

---

## 6. UTF-8 correction verification

`a15d325...e5e41a0` changes **only** `docs/audits/HCDP_UI_BATCH1_CONTROLLED_INTEGRATION_REPORT.md`.

| Check | Result |
| --- | --- |
| BOM | absent |
| Starts with `# HCDP —` | true |
| Mojibake `â€”` `â†’` `â€¦` `â€™` `ï»¿` | absent |
| Real U+2014 / U+2192 | present |
| Product tree unchanged | true |
| `git diff --check` | clean |
| Markers preserved (product tip, evidence, handoff, PID 22348, localhost, hash) | true |

Evidence: `utf8-correction-gate.txt`.

---

## 7. Independent product review

Verified present / preserved via tests + probes + browser QC-1:

- Premium Clinical tokens / typography (`globals.css`, `tokens.css`, presentation tests)
- Shared Button, Badge, Panel, Table, Tabs, EmptyState; PageHeader at `src/components/shell/PageHeader.tsx`
- No decorative toast-only dashboard verbs (QC-1)
- Clinic/identity hydration snapshot stability (QC-1 product commit)
- Light / Dark / System + persistence after reload (QC-1 browser script)
- System + OS dark (controlled matrix class; QC-1 Device setting + matrix OS-dark attempt)
- Truthful M07 Overview / Adjustments presentation (presentation + shell tests)
- OD-A2 narrowing + outbox published/idempotent/rejected (OD-A2 suite)
- Browser-safe hashing without `node:crypto` (unit + builds + browser 0 hits)
- Exact published-timesheet hash vector
- Unchanged M06–M07 contracts (architecture/boundary + workforce suites)
- No PPA-2 / payment / provider / new export capability

---

## 8. Commands and test totals

Focused / regression suites (independent execution):

| Suite | Command | Exit | Tests | Pass | Fail |
| --- | --- | --- | --- | --- | --- |
| OD-A2 | `npx tsx --test …/m06-od-a2-outbox-narrowing.test.ts` | 0 | 8 | 8 | 0 |
| UI chrome | `npx tsx --test …/ui-batch1-qualification-chrome.test.ts` | 0 | 6 | 6 | 0 |
| M07 presentation | `npx tsx --test …/m07-ui-batch1-presentation.test.ts` | 0 | 5 | 5 | 0 |
| M07 shell | `npx tsx --test …/m07-shell.test.ts` | 0 | 6 | 6 | 0 |
| Browser crypto | `npx tsx --test …/browser-crypto-remediation.test.ts` | 0 | 8 | 8 | 0 |
| M06 published | `npx tsx --test …/m06-published-timesheet.test.ts` | 0 | 19 | 19 | 0 |
| Registry | `npx tsx --test …/published-timesheet-registry.test.ts` | 0 | 27 | 27 | 0 |
| PPA-1 UI | `npx tsx --test …/m07-ppa1-ui.test.tsx` | 0 | 10 | 10 | 0 |
| PPA-1 integration | `npx tsx --test …/m07-ppa1-integration.test.tsx` | 0 | 11 | 11 | 0 |
| PPA-1 security/core/atomicity | three files | 0 | 25 | 25 | 0 |
| Architecture + boundary | cp27 + cp23 | 0 | 15 | 15 | 0 |
| Authz | `m07-authz.test.ts` | 0 | 13 | 13 | 0 |
| Batch 5 | three files | 0 | 49 | 49 | 0 |
| Batch 6 | five files | 0 | 43 | 43 | 0 |
| Workforce | `npm run test:workforce` | 0 | 53 | 53 | 0 |

Full modules:

| Suite | First attempt (loaded machine + parallel lint/tsc) | Isolated re-run |
| --- | --- | --- |
| `npm run test:m05` | 117 tests / **2 fail** (bulk performance timing) | **117/117** |
| `npm run test:m06` | 91 tests / **1 fail** (prototype perf timing) | **91/91** |
| `npm run test:m07` | 252 tests / **1 fail** (Batch6 audit string flake under contention) | **252/252** |

First-attempt failures classified as **host-load / contention flakes**, not product regressions. Authoritative totals = isolated re-run.

Aggregate authoritative automated functional tests counted above (focused + full modules + workforce), treating full-module re-run as authoritative: **758 pass / 0 fail / 0 skip** across those recorded suites (focused phase1+2+workforce + full M05/M06/M07 re-run; focused suites nested inside full modules are not double-counted in the 758 total — compute as 117+91+252+53 + focused-only chrome suites already inside M07/workforce where applicable).

Conservative rollup used for this report:

- Focused unique suites (OD-A2 through Batch6 + workforce): **298 pass / 0 fail**
- Full M05+M06+M07 isolated: **460 pass / 0 fail**
- Note: full module suites supersede overlapping focused M07 files for regression verdicts

Logs: `01-*.log` … `15-*.log`, `12b/13b/14b-*.log`, `phase*-results.json`, `phase3-rerun-results.json`.

---

## 9. Typecheck and lint comparisons

| Metric | Expected baseline | Independent result |
| --- | --- | --- |
| Full `tsc --noEmit` errors | 21 | **21** |
| Error set vs controlled evidence `17-tsc-errors.txt` | identical | **Identical** (`Compare-Object` empty) |
| OD-A2 / UI / crypto / context-hydration scoped errors | 0 | **0** |
| Lint | 2 errors / 24 warnings | **2 errors / 24 warnings** |
| Lint error sites | `context.tsx:57`, `AdjustmentsSection.tsx:386` `react-hooks/set-state-in-effect` | **same** |

No new paths/messages. Existing debt not repaired.

Evidence: `17-tsc.log`, `17-tsc-errors.txt`, `17-tsc-compare.txt`, `16-lint.log`.

---

## 10. Production builds and hash

| Build | Exit | `node:crypto` / UnhandledScheme / OD-A2 code·message |
| --- | --- | --- |
| `npx next build --webpack` | **0** | none |
| `npm run build` | **0** | none |

Exact hash (calc / pure `sha256HexUtf8` / Node `createHash`):

`7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`

Evidence: `hash-vector-result.json`, `19-*`, `20-*`.

---

## 11. Browser route / width / appearance matrix

Validation server: verification worktree on **`http://localhost:3461`** (PID was **11756**; stopped after tests). Port **3000 / PID 22348** undisturbed.

| Script | Result |
| --- | --- |
| `QA_BASE=http://localhost:3461 node scripts/ui-batch1-qualification-browser-validate.mjs` | exit 0, **`pass: true`**, `cryptoConsoleHits: 0` |
| `node scripts/browser-crypto-remediation-validate.mjs` | exit 1, **`pass: false`**, **0** `node:crypto` / UnhandledScheme; 29 hydration-class hits |
| Independent M07 sections × widths + aliases matrix | exit 0, **all sections 200 / no overflow**, aliases ok |

Widths: 1440, 1280, 1024, 768, 430, 390 — no unintended horizontal overflow on QC-1 + matrix.

Appearance (QC-1 authoritative):

- Light / Dark / Device(System) — PASS  
- Persistence after reload — PASS  
- Keyboard focus outline observed — PASS  

Completed M07 sections exercised: overview, people, leave, adjustments, exceptions, variances, approval, export, reconciliation, settings.

Evidence copied into `browser-qc1/`, `browser-crypto/`, `browser-matrix/` (historical script OUT dirs restored; not overwritten in commit).

---

## 12. Hydration adjudication

Independent determination (does **not** copy the controlled report’s softer “noise” wording):

1. Exact messages are React **`Hydration failed…`** / **`A tree hydrated but some attributes…`** pageerrors/errors with stacks into M04 StaffDoctors, M05 Roster `OfflineState`, M07 StaffPay shell status line, and portal chrome `caret-color` inputs.
2. These are **genuine hydration mismatches**, not mere broad regex hits on the word “M07”.
3. Same class is present on historical crypto remediation evidence (`pass: false`, 0 crypto hits).
4. QC-1 fixed clinic/identity snapshot paths and still yields QC-1 `pass: true`; it did **not** clear M04/M05/M07 offline/status/caret mismatches.
5. Routes remain HTTP 200, interactive, with usable navigation after client regeneration; no candidate-attributable `node:crypto` failure.
6. No new hydration family unique to the candidate beyond this pre-existing debt.

**Classification:** genuine unchanged pre-existing hydration debt → **QUALIFIED**.

Evidence: `hydration-adjudication.json`, `browser-crypto/browser-validation-report.json`.

---

## 13. Accessibility findings

From QC-1 + matrix a11y probes:

- Focusable controls largely labelled; keyboard focus outline visible on topbar control  
- Main/nav landmarks present  
- Status surfaces use `role="status"` / non-colour cues on exercised shells  
- Mobile widths retain hamburger/nav and primary links  
- Touch-target sample generally ≥24px on sampled controls  
- Reduced-motion context exercised by QC-1 script environment  

No accessibility **blocker** unique to the candidate. Residual chrome hydration is separately QUALIFIED.

---

## 14. Protected-scope audit

Confirmed no unauthorised change to payroll calculations/prep rules, period lifecycle, PPA repository/security/concurrency/audit/approval-calc capability, locks/unlocks, canonicalisation/hash format, clinic/LE boundaries, permissions/workforce identity semantics (beyond QC-1 snapshot stability), M06–M07 contracts, Auth/Postgres, module availability, legacy routes, M08, payments/providers/new exports, wave-control, or UI Batch 2.

No dependency upgrades. No fake data. No opportunistic cleanup in product commits.

---

## 15. Localhost status

| Item | Value |
| --- | --- |
| Controlled-integration PID | **22348** (still running) |
| Port 3000 `/dashboard` | **200** |
| Port 3000 `/staffpay?section=adjustments` | **200** |
| Checkout product tree vs `25de6f1` | identical (docs-only tip commits after product) |
| Verification server :3461 | **stopped** (PID was 11756) |

Evidence: `localhost-preservation.json`.

---

## 16. Findings and residual risks

1. Pre-existing **21** TypeScript errors unchanged — accepted debt.  
2. Lint **2 / 24** unchanged M07 hooks debt — accepted debt.  
3. **Genuine pre-existing hydration mismatches** on M04/M05/M07/chrome — QUALIFIED residual; not repaired in this lane.  
4. Crypto browser script remains overall `pass: false` solely due to that hydration class (0 crypto).  
5. Full-module first run can flake performance assertions under heavy parallel load — isolated re-run is authoritative.  
6. Not production approval; does not authorise PPA-2, payments, or UI Batch 2.

---

## 17. Required verdicts (28)

| # | Topic | Verdict |
| --- | --- | --- |
| 1 | Candidate-tip integrity | **PASS** |
| 2 | Integration ancestry | **PASS** |
| 3 | Source-patch equivalence | **PASS** |
| 4 | Evidence-only ancestry exclusion | **PASS** |
| 5 | UTF-8 correction integrity | **PASS** |
| 6 | PPA prerequisite preservation | **PASS** |
| 7 | OD-A2 preservation | **PASS** |
| 8 | UI Batch 1 presentation | **PASS** |
| 9 | QC-1 truthfulness | **PASS** |
| 10 | Appearance persistence | **PASS** |
| 11 | Hydration behaviour | **QUALIFIED** |
| 12 | Browser-crypto remediation | **PASS** (0 node:crypto; script fail = hydration class) |
| 13 | Published-timesheet compatibility | **PASS** |
| 14 | Exact hash compatibility | **PASS** |
| 15 | M05 regression | **PASS** |
| 16 | M06 regression | **PASS** |
| 17 | M07 regression | **PASS** |
| 18 | Workforce/contracts regression | **PASS** |
| 19 | Browser route validation | **PASS** |
| 20 | Responsive validation | **PASS** |
| 21 | Accessibility validation | **PASS** |
| 22 | Typecheck non-regression | **PASS** |
| 23 | Lint non-regression | **PASS** |
| 24 | Production builds | **PASS** |
| 25 | Protected-scope compliance | **PASS** |
| 26 | Updated-localhost readiness | **PASS** |
| 27 | Suitability for owner inspection | **PASS** (with hydration QUALIFIED residual) |
| 28 | Suitability for later merge to main | **QUALIFIED** — owner inspection first; residual hydration debt; recommendation ≠ merge authority |

---

## 18. Owner-acceptance and merge-suitability recommendation

**Owner acceptance:** Recommend **accept with qualifications** for inspection. Ancestry/patch/hash/builds/regressions/protected scope/localhost gates are met; hydration residual is documented pre-existing debt, not a new candidate defect.

**Merge to main:** **Not recommended as an unconditional merge.** Suitable for later merge consideration only after owner inspection of the QUALIFIED hydration residual. This recommendation does **not** authorise a merge.

---

## 19. Confirmations

- No production-code changes in this lane  
- No test/config repairs to manufacture a pass  
- Nothing merged; no PR opened; `origin/main` untouched  
- UI Batch 2 not started  
- Controlled-integration checkout and PID 22348 preserved  
- Only new artefacts under this report path + `docs/audits/ui-batch1-controlled-integration-independent-verification/`

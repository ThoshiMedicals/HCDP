# HCDP — UI Batch 1 Controlled Integration Report

**Lane:** Controlled integration (candidate only)
**Branch:** `cursor/ui-batch1-controlled-integration`
**Product integration tip:** `25de6f1d4497893a36ea1ac4ed491929726255fc`
**Integration evidence commit:** `def2c691fdd2a3a747c9487764963492bddb69b4`
**Localhost handoff commit:** `a15d325a5e6dd13a6da216e929aaef38440b8361`

**Date:** 3 August 2026
**Status:** Candidate ready for independent integration verification — **not** merged; **not** production-approved; UI Batch 2 **not** started.

---

## 1. Pre-flight

| Check | Result |
| --- | --- |
| `origin/main` | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` (unchanged from authorisation) |
| Local `main` (non-authoritative) | `739e42a39c51558311d030bcd96017c9056159fb` |
| Working tree before construction | Clean |
| Implementation branch pre-existence | Absent locally and on `origin` |
| Required source commits on origin | Present |
| Production parent links | Exact (0afe8780→…→c8c99950→6d633ce1) |
| UI source parent links | Exact (c8c99950→834cf22a→a1efd472→9d98d6e) |
| Base `6d633ce1` content | OD-A2 outbox narrowing + evidence; ancestry includes accepted PPA prerequisite through `c8c9995` |
| Evidence-only commits | `da2dd1c5`, `acff2972`, `8ede3a0` confirmed docs-only; not required at runtime; not cherry-picked |

Governance: wave-control rules under `.cursor/rules/hcdp-wave-control.mdc` observed. No AGENTS.md found in-repo.

---

## 2. Construction

Created branch from exactly `6d633ce1da75a4450d1c1fe186c0d3d502bc6a87`.

Cherry-picked with `-x` (no conflicts):

| Order | Source SHA | Resulting SHA | Subject |
| --- | --- | --- | --- |
| 1 | `834cf22a63efc36423533586d56e8913d8bedd8b` | `1565f5022c9f3c6f7b47031afa7f78d425724726` | Premium Clinical UI Batch 1 |
| 2 | `a1efd472ea086d98e82b6ca60da8b9071b1808e2` | `0e24d3559881281b5becffe265c3872dff366db3` | Browser-crypto remediation |
| 3 | `9d98d6e57ba3afaef4aa38e20640d2bfbc128122` | `25de6f1d4497893a36ea1ac4ed491929726255fc` | QC-1 chrome + appearance |

Not included (as authorised): `da2dd1c5`, `acff2972`, `8ede3a0`, planning commits `7f636a61` / `86235bfa` / `a4d9d3b2`, and any UI Batch 2 content.

### Ancestry graph (tip)

```text
* 25de6f1 fix(ui): close UI Batch 1 QC-1 … (cherry picked from 9d98d6e…)
* 0e24d35 fix(platform): remove node:crypto … (cherry picked from a1efd47…)
* 1565f50 feat(ui): Premium Clinical Batch 1 … (cherry picked from 834cf22…)
* 6d633ce fix(m06): narrow PublishFromOutboxResult … (OD-A2)
* c8c9995 fix(m07): harden PPA-1 test hooks …
* 739e42a feat(m07): wire PPA-1 Adjustments …
* 2ad5f4d feat(m07): isolated PPA-1 foundation UI
* 995ee86 feat(m07): PPA-1 core domain/service
* 0afe878 (origin/main)
```

---

## 3. Patch-equivalence gates

| Gate | Result |
| --- | --- |
| Patch bytes source ↔ cherry-pick (all three) | **Identical** |
| `git range-diff` UI range → integration range | Maps 1:1; only `(cherry picked from …)` trailer differences |
| Tree `HEAD` vs `9d98d6e` | **Only** OD-A2 five paths |
| Tree `HEAD` vs `6d633ce1` | **Only** UI Batch 1 + crypto + QC-1 paths |
| Evidence-only ancestry | Absent |
| Duplicate PPA prerequisite commit | Absent |
| UI Batch 2 content | Absent |

### Expected OD-A2-only difference from `9d98d6e` (confirmed)

- `src/modules/m06-time-attendance/services/published-timesheet-outbox.ts`
- `src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts`
- `docs/audits/HCDP_OD_A2_PUBLISHED_TIMESHEET_OUTBOX_CORRECTION_REPORT.md`
- `docs/audits/od-a2-published-timesheet-outbox-correction/hash-vector-result.json`
- `docs/audits/od-a2-published-timesheet-outbox-correction/independent-test-matrix.json`

Artifacts: `docs/audits/ui-batch1-controlled-integration/range-diff.txt`, `tree-diff-vs-*.txt`, `ancestry-graph.txt`.

---

## 4. Changed-file classification (`6d633ce1..HEAD`)

| Class | Paths (summary) |
| --- | --- |
| Premium Clinical / shared UI | `globals.css`, `tokens.css`, `PageHeader`, `Badge`, `Button`, `EmptyState`, `Panel`, `Table`, `Tabs` |
| QC-1 chrome / hydration | `DashboardWorkspace.tsx`, `clinic-context.tsx`, `identity-context.tsx`, chrome test |
| M07 presentation | `StaffPayWorkspace.tsx`, `OverviewSection.tsx`, `AdjustmentsSection.tsx` (presentation), shell + presentation tests |
| Browser-crypto | `published-timesheet-hash.ts`, `sha256-hex-utf8.ts`, M06/M07 `index.ts` barrels, remediation test + script + historical remediation evidence bundle traveling with source commit |
| QC-1 validation assets | qualification script + historical qualification evidence bundle traveling with source commit |

No payroll-calc, PPA repository/security/concurrency semantics, lock/unlock, hash-format, permissions, Auth, Postgres, payment/export/provider, M08, or wave-control edits in the three cherry-picks beyond accepted presentation/crypto/QC-1 scope.

---

## 5. Tests and totals

| Suite | Command | Result |
| --- | --- | --- |
| OD-A2 focused | `npx tsx --test …/m06-od-a2-outbox-narrowing.test.ts` | **8/8** |
| UI Batch 1 chrome | `npx tsx --test …/ui-batch1-qualification-chrome.test.ts` | **6/6** |
| M07 presentation | `npx tsx --test …/m07-ui-batch1-presentation.test.ts` | **5/5** |
| M07 shell | `npx tsx --test …/m07-shell.test.ts` | **6/6** |
| Browser-crypto | `npx tsx --test …/browser-crypto-remediation.test.ts` | **8/8** |
| M06 published-timesheet | `npx tsx --test …/m06-published-timesheet.test.ts` | **19/19** |
| Registry | `npx tsx --test …/published-timesheet-registry.test.ts` | **27/27** |
| PPA-1 UI | `npx tsx --test …/m07-ppa1-ui.test.tsx` | **10/10** |
| PPA-1 integration | `npx tsx --test …/m07-ppa1-integration.test.tsx` | **11/11** |
| PPA-1 security/core/atomicity | three files | **25/25** |
| Architecture + boundary | cp27 + cp23 | **15/15** |
| Authz | `m07-authz.test.ts` | **13/13** |
| Batch 5 | three files | **49/49** |
| Batch 6 | five files | **43/43** |
| Full M05 | `npm run test:m05` | **117/117** |
| Full M06 | `npm run test:m06` | **91/91** |
| Full M07 | `npm run test:m07` | **252/252** |
| Workforce | `npm run test:workforce` | **53/53** |
| Lint | `npm run lint` | exit 1 — **2 errors / 24 warnings** (pre-existing hooks debt; not repaired) |
| `tsc --noEmit` | full repo | **21** errors — **identical** to OD-A2 baseline `6d633ce1` |
| Scoped tsc (OD-A2 / UI / crypto / context) | filter of full log | **0** each |
| `npx next build --webpack` | production | **exit 0** |
| `npm run build` | default (Turbopack) | **exit 0** |

M07 252 and workforce 53 are expected increases vs OD-A2-era 246/45 because UI/crypto/QC-1 tests are now on the tip.

Logs under `docs/audits/ui-batch1-controlled-integration/*.log`.

---

## 6. Hash gate

Expected and actual (calc / pure `sha256HexUtf8` / Node `createHash`):

`7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`

**Exact match.** Evidence: `docs/audits/ui-batch1-controlled-integration/hash-vector-result.json`.

---

## 7. Typecheck comparison

| Metric | OD-A2 baseline `6d633ce1` | Integration tip |
| --- | --- | --- |
| Full-repo `error TS` count | 21 | 21 |
| Exact error set | — | **Identical** (`Compare-Object` empty) |
| Outbox OD-A2 `code`/`message` errors | 0 | 0 |
| New UI/crypto/QC-1 errors | — | 0 |

The previously recorded 21 unrelated errors remain; none were repaired in this lane.

---

## 8. Build gate

After OD-A2 + `a1efd47` crypto remediation on the candidate:

- `node:crypto` **does not** block the browser/production webpack build
- OD-A2 `code`/`message` TypeScript build failures **do not** return
- `npx next build --webpack` **PASS**
- `npm run build` **PASS**

---

## 9. Browser / responsive / appearance

Validation served from tip worktree on `http://localhost:3461` (same SHA as branch tip). Fresh evidence copied into `docs/audits/ui-batch1-controlled-integration/` so historical `docs/audits/ui-batch1-qualification-completion/` and `docs/audits/browser-crypto-remediation/` in the main working tree were **not** overwritten for commit.

| Check | Result |
| --- | --- |
| QC-1 script (`scripts/ui-batch1-qualification-browser-validate.mjs` via `QA_BASE`) | **PASS** (`pass: true`, `cryptoConsoleHits: 0`) |
| Crypto remediation script | Script `pass: false` — **0** `node:crypto` / UnhandledScheme hits; failures are pre-existing module hydration mismatches (same class as accepted `a1efd47` historical report `pass: false`, 0 node:crypto) |
| Routes | `/dashboard`, `/action-inbox`, `/settings`, `/staff-doctors`, `/roster`, `/time-attendance`, `/staffpay`, overview, adjustments + aliases |
| Completed M07 sections | overview, people, leave, adjustments, exceptions, variances, approval, export, reconciliation, settings — all 200, no unintended overflow at all widths |
| Widths | 1440, 1280, 1024, 768, 430, 390 |
| Light / Dark / System (in-app) | PASS |
| Persistence after reload | PASS |
| System + OS dark (`colorScheme: dark`) | PASS — `themeDark: true`, canvas `rgb(7, 17, 31)` |
| Horizontal overflow | None observed on exercised matrix |
| `node:crypto` browser import | **0** hits |
| Keyboard focus / labelled controls / reduced-motion | Exercised by QC-1 script (focus outline observed; `reducedMotion: reduce` context) |

Evidence: `browser-qc1/`, `browser-crypto/`, `m07-sections-aliases-osdark-report.json`, `system-os-dark-and-crypto-console.json`, `inapp-system-os-dark-dashboard-1440.png`.

---

## 10. Protected-scope audit

No candidate changes expand or alter:

- ordinary payroll calculation / staff-pay prep rules / period lifecycle
- PPA repository behaviour; PPA security/concurrency/audit semantics; PPA calc/approval capability beyond accepted prerequisite ancestry
- locks/unlocks
- published-timesheet canonicalisation / stored hash format
- permissions; clinic/legal-entity; workforce identity semantics (hydration snapshot stability only)
- M06–M07 contracts
- module availability; legacy aliases
- M08; Auth; Postgres
- payment / export / provider integrations
- wave-control; UI Batch 2
- accepted historical reports outside this new evidence directory

No fake data, decorative non-functional controls, dependency upgrades, or broad formatting rewrites introduced by this lane.

---

## 11. Localhost handoff

| Item | Value |
| --- | --- |
| Branch checked out | `cursor/ui-batch1-controlled-integration` |
| Product integration tip | `25de6f1d4497893a36ea1ac4ed491929726255fc` |
| Integration evidence commit | `def2c691fdd2a3a747c9487764963492bddb69b4` |
| Localhost handoff commit | `a15d325a5e6dd13a6da216e929aaef38440b8361` |
| Start command | `node node_modules/next/dist/bin/next dev --webpack -p 3000` |
| Port | `3000` |
| Listen PID | `22348` |
| Dashboard | `http://localhost:3000/dashboard` — HTTP/browser **200** |
| Adjustments | `http://localhost:3000/staffpay?section=adjustments` — HTTP/browser **200** (warm) |
| Server status | **Running** (left up) |

## 12. Findings and residual risks

1. **Pre-existing full-repo TypeScript debt (21 errors)** remains — QUALIFIED for typecheck non-regression, not a clean tsc tree.
2. **Lint** still reports 2 `react-hooks/set-state-in-effect` errors in M07 context/Adjustments — pre-existing relative to this integration; not in scope to repair.
3. **Module hydration console noise** (M04 metrics, M05 offline flash, M07 status line) still trips the crypto browser script’s broad `hydration` pattern — historical accepted crypto evidence showed the same script-level `pass: false` with **zero** `node:crypto` hits. Classified as residual Observation, not crypto regression.
4. Candidate is **not** production approval and does **not** authorise PPA-2 / payment / UI Batch 2.

---

## 13. Rollback base

Reset/recreate candidate from:

`6d633ce1da75a4450d1c1fe186c0d3d502bc6a87`

or discard branch `cursor/ui-batch1-controlled-integration`.

`origin/main` remains `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` — untouched by this lane.

---

## 14. Required verdicts

| # | Verdict topic | Result |
| --- | --- | --- |
| 1 | Integration ancestry | **PASS** |
| 2 | Source-patch equivalence | **PASS** |
| 3 | PPA prerequisite preservation | **PASS** |
| 4 | OD-A2 preservation | **PASS** |
| 5 | UI Batch 1 presentation | **PASS** |
| 6 | QC-1 truthfulness | **PASS** |
| 7 | Appearance and hydration | **PASS** |
| 8 | Browser-crypto remediation | **PASS** (unit + build + 0 node:crypto browser; script overall fail = historical hydration class) |
| 9 | Published-timesheet compatibility | **PASS** |
| 10 | Exact hash compatibility | **PASS** |
| 11 | M05 regression | **PASS** |
| 12 | M06 regression | **PASS** |
| 13 | M07 regression | **PASS** |
| 14 | Browser route validation | **PASS** |
| 15 | Responsive validation | **PASS** |
| 16 | Accessibility checks | **PASS** |
| 17 | Typecheck non-regression | **PASS** (21 identical pre-existing) |
| 18 | Production build | **PASS** |
| 19 | Protected-scope compliance | **PASS** |
| 20 | Suitability for independent integration verification | **PASS** |
| 21 | Updated-localhost readiness | **PASS** (see handoff) |

---

## 15. Confirmations

- `main` / `origin/main` **not** updated or merged
- UI Batch 2 **not** started
- Evidence-only verification commit `da2dd1c5` **not** included
- New evidence only under `docs/audits/ui-batch1-controlled-integration/` plus this report
- Independent integration verifier **not** run concurrently with this task

Machine matrix: `docs/audits/ui-batch1-controlled-integration/independent-test-matrix.json`.

# Independent verification — browser-crypto remediation + UI Batch 1 enablement

**Document:** `BROWSER_CRYPTO_AND_UI_BATCH1_INDEPENDENT_VERIFICATION.md`  
**Lane:** Verification only (no production repair/refactor/merge)  
**Date:** 30 July 2026  
**QA branch:** `cursor/browser-crypto-ui-batch1-independent-qa`  
**Worktree:** `C:\Users\ETB Sri Lanka\Desktop\HCDP\.worktrees\browser-crypto-ui-batch1-independent-qa`  
**UI authority (read-only):** `docs/specifications/HCDP_OWNER_UI_DECISION_REGISTER.md` @ `a4d9d3b2dc321ff16f6a42795e8e5bdbc996630b` (not on candidate tree; inspected via `git show`)

---

## 1. Candidate and ancestry (verified)

| Ref | SHA | Role |
|---|---|---|
| Security baseline | `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` | PPA-1 security/concurrency tip |
| UI Batch 1 | `834cf22a63efc36423533586d56e8913d8bedd8b` | Premium Clinical Batch 1 |
| Crypto remediation (candidate) | `a1efd472ea086d98e82b6ca60da8b9071b1808e2` | remove `node:crypto` from browser hash path |
| Register authority | `a4d9d3b2dc321ff16f6a42795e8e5bdbc996630b` | Owner UI Decision Register |

**Ancestry (exact):**

```text
c8c9995 (security)
  └── 834cf22 (UI Batch 1)
        └── a1efd47 (browser-crypto remediation)  ← verification HEAD
```

| Check | Result |
|---|---|
| `git merge-base --is-ancestor c8c9995 a1efd47` | **0 (true)** |
| `git merge-base --is-ancestor 834cf22 a1efd47` | **0 (true)** |
| `git merge-base --is-ancestor a1efd47 origin/main` | **1 (false)** — candidate not merged |
| `origin/main` tip | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` (unchanged vs register expectation) |
| Parent of `a1efd47` | `834cf22` |
| Parent of `834cf22` | `c8c9995` |
| Working tree at checkout | Clean at `a1efd47` before QA artifacts |

Fetch performed from Development folder remotes; SHAs and branch `cursor/browser-crypto-remediation` confirmed present.

---

## 2. Diff inventory and scope

### 2.1 Crypto-only delta (`834cf22..a1efd47`)

**Production / test / tooling (non-screenshot):**

| Status | Path |
|---|---|
| M | `src/modules/m06-time-attendance/index.ts` — stop re-exporting `./adapters` |
| M | `src/modules/m07-staff-pay/index.ts` — stop re-exporting `./adapters` and `./services` |
| M | `src/platform/workforce/contracts/published-timesheet-hash.ts` — remove `node:crypto`; use pure helper |
| A | `src/platform/workforce/contracts/sha256-hex-utf8.ts` — sync pure SHA-256 |
| A | `src/platform/workforce/tests/browser-crypto-remediation.test.ts` |
| A | `scripts/browser-crypto-remediation-validate.mjs` |
| A | `docs/audits/browser-crypto-remediation/*` (prior remediation evidence; read-only reference) |

**Scope verdict (crypto):** Within authorised infrastructure/browser-boundary remediation. No M07 calculation, period lifecycle, permissions, PPA storage/concurrency, locks/unlocks, Auth/Postgres, M08, or package/webpack config changes in this delta.

### 2.2 Full stack (`c8c9995..a1efd47`) = UI Batch 1 + crypto

UI Batch 1 (`c8c9995..834cf22`) additionally changed:

- `src/app/globals.css`, `src/styles/tokens.css`
- Shell/UI primitives: `PageHeader`, `Badge`, `Button`, `EmptyState`, `Panel`, `Table`, `Tabs`
- M07 presentation: `StaffPayWorkspace`, `OverviewSection`, `AdjustmentsSection`
- Tests: `m07-shell.test.ts`, `m07-ui-batch1-presentation.test.ts`

**UI Batch 1 scope vs register:** Presentation/token/chrome + GAP-PAR-003 Overview copy correction. No domain/payroll behaviour changes observed in the UI delta. Does **not** by itself satisfy the full register redesign objective (shell fake-chrome / GAP-PAR-008 class, full Premium Clinical visual completion, dark-token wiring via app appearance selector, etc.).

### 2.3 Unrelated / out-of-scope observations

- Default `npx next build` (Turbopack) fails on Windows junctioned `node_modules` (`Symlink … points out of the filesystem root`) — environment/tooling issue of this worktree pattern, not introduced by crypto source changes.
- Webpack compile of the app **succeeds**; production build then fails typecheck on **pre-existing** `published-timesheet-outbox.ts` (not in crypto or UI Batch 1 file lists).
- Auth server routes still correctly use `node:crypto` on the **server** only.

---

## 3. Independent crypto implementation assessment

| # | Check | Result |
|---|---|---|
| 1 | M06/M07 client barrels no longer re-export adapters/services | **PASS** |
| 2 | ModuleWorkspace → barrels path has no `node:crypto` / server adapters | **PASS** (`ModuleWorkspace` imports `@/modules/m06-time-attendance` and `@/modules/m07-staff-pay` only) |
| 3 | Server-side consumers keep deep imports | **PASS** — publisher/intake/outbox/registry still import `@/platform/workforce/contracts/published-timesheet-hash` or adapters/services by deep path |
| 4 | Sync SHA-256 deterministic | **PASS** (tests + independent vector) |
| 5 | Canonical ordering/normalisation unchanged | **PASS** (known canonical JSON exact match) |
| 6 | Stored hashes compatible | **PASS** (identical hex to Node `createHash`) |
| 7 | Known vector exact | **PASS** (see §4) |
| 8 | Published-timesheet create/verify behaviour | **PASS** (registry + m06 published suites green) |
| 9 | No weakening / fallback / silent migration | **PASS** — single pure sync impl; no dual-hash accept path; no Web Crypto async branch in production path |
| 10 | No duplicated hashing authority | **PASS** — `calculatePayrollContentHash` remains sole definer in `published-timesheet-hash.ts`; architecture test still asserts uniqueness |

**Client static bundles:** `rg` over `.next/static/**/*.js` found **no** `node:crypto`. Remaining `node:crypto` hits are server Auth API chunks only (expected).

---

## 4. Exact hash-vector result (independent)

Command (temporary local script; not committed):

```text
npx tsx <independent vector runner>
```

| Field | Value |
|---|---|
| Canonical JSON | `{"allowanceInputs":[],"attendanceSessionIds":["sess_a","sess_b"],"leaveInputs":[],"legalEntityId":"org_demo_a","ordinaryHourInputs":[{"code":"ORD","hours":8,"localDate":"2026-07-02"}],"organisationId":"org_demo_a","overtimeHourInputs":[],"penaltyHourInputs":[],"periodEnd":"2026-07-14","periodStart":"2026-07-01","timesheetRecordId":"ts_vector_1","workforcePersonId":"person_a"}` |
| Pure `sha256HexUtf8` | `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Node `createHash("sha256")` | `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| `calculatePayrollContentHash` | `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Expected | `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Verdict | **EXACT MATCH — Critical hash gate PASS** |

---

## 5. Independent tests (exact commands + totals)

All run from QA worktree HEAD `a1efd47`. Mutated Wave 5 evidence JSON from M06 runs was **discarded** (`git checkout --`) and not committed.

| # | Command | Exit | Totals |
|---|---|---|---|
| 1 | `npx tsx --test src/platform/workforce/tests/browser-crypto-remediation.test.ts` | 0 | tests **8** pass **8** fail **0** skipped **0** |
| 2 | `npx tsx --test src/platform/workforce/tests/published-timesheet-registry.test.ts` | 0 | tests **27** pass **27** fail **0** skipped **0** |
| 3 | `npx tsx --test src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts` | 0 | tests **19** pass **19** fail **0** skipped **0** |
| 4 | `npm run test:m06` | 0 | tests **83** pass **83** fail **0** skipped **0** |
| 5 | `npm run test:m07` | 0 | tests **252** pass **252** fail **0** skipped **0** |
| 6 | `npx tsx --test …/m07-ppa1-integration.test.tsx` | 0 | **11**/11 |
| 7 | `…/m07-ppa1-hook-security.test.ts` | 0 | **6**/6 |
| 8 | `…/m07-ppa1-core.test.ts` | 0 | **10**/10 |
| 9 | `…/m07-ppa1-atomicity.test.ts` | 0 | **9**/9 |
| 10 | `…/m07-ppa1-ui.test.tsx` | 0 | **10**/10 |
| 11 | Batch 5 suite (`m07-batch5-*.test.ts`) | 0 | **49**/49 |
| 12 | Batch 6 suite (`m07-batch6-*.test.ts`) | 0 | **43**/43 |
| 13 | `m07-architecture-cp27` + `m07-boundary-cp23` | 0 | **15**/15 |
| 14 | `m07-ui-batch1-presentation` + `m07-shell` | 0 | **11**/11 |
| 15 | `m07-authz.test.ts` | 0 | **13**/13 |
| 16 | `npm run test:workforce` | 0 | **53**/53 |

**Dedicated legacy-redirect / dashboard / appearance unit tests:** no separate named suites found beyond shell presentation + browser crawl. Alias HTTP check (dev): `/approvals`, `/tasks`, `/checklists`, `/hr-docs`, `/inventory`, `/prototype` → **307** redirects (preserved).

**Typecheck:** `npx tsc --noEmit` exit **2** — **23** pre-existing errors in tests/outbox (plus none in crypto remediation production files after removing temporary QA helper). Crypto files: **no new TS errors**.

**Build:**

| Command | Result |
|---|---|
| `npx next build` (Turbopack default) | **FAIL** — junction/`node_modules` symlink outside FS root (worktree env) |
| `npx next build --webpack` | Compile **OK** (22.9s); typecheck **FAIL** on pre-existing `published-timesheet-outbox.ts:235` (`code`/`message` on union) — **not** in crypto/UI Batch 1 diffs |

Honest build verdict: **webpack compile passes; production typecheck blocked by pre-existing outbox typing** (outside remediation scope). Not treated as crypto regression.

---

## 6. Real-browser validation

**Dev server:** `npm run dev -- -p 3462` → Next.js 16.2.10 (webpack), Ready; base `http://localhost:3462`.

**Independent Playwright:** `node scripts/independent-qa-browser-validate.mjs` (local helper; evidence under new QA folder).

### 6.1 Route matrix (first full crawl)

| Route | Status | Notes |
|---|---|---|
| `/dashboard` | 500 then **200** on warm/recheck | Transient compile/race also seen in prior remediation evidence; **no crypto overlay** |
| `/action-inbox` | **200** | OK |
| `/settings` (Organisation & Access) | **200** | Canonical route |
| `/organisation-access` | **404** | Expected — not a production route; use `/settings` |
| `/staff-doctors` | **200** | OK |
| `/roster` | **200** | OK (one 1024 `networkidle` timeout flake in width matrix) |
| `/time-attendance` | **200** | OK |
| `/staffpay` | **200** | OK |
| `/staffpay?section=overview` | **200** | OK |
| `/staffpay?section=adjustments` | **200** | PPA-1 Adjustments available |

**Focused crypto recheck** (`domcontentloaded`, all in-scope routes): every route **200**; `cryptoConsoleCount=0`; body has **no** `node:crypto` / `UnhandledSchemeError`.

### 6.2 Console / crypto / hydration

| Class | First full crawl | Focused recheck |
|---|---|---|
| `node:crypto` / `UnhandledSchemeError` | **0** | **0** |
| Hydration / text mismatch hits (pattern match) | 46 (of 110 console errors/warnings) | **0** |
| Attributable to crypto remediation? | **No** — no crypto scheme errors; hydration consistent with SSR vs client theme/chrome timing (also noted historically) | — |

### 6.3 Responsive widths (1440, 1280, 1024, 768, 430, 390)

Across dashboard, action-inbox, settings, staff-doctors, roster, time-attendance, staffpay overview, staffpay adjustments:

- **overflowX:** false on all completed width×route cells except one **roster@1024** timeout flake (not overflow).
- Mobile 390: hamburger shell present; primary cards readable; no crypto crash.
- Observation: some mobile truncation of dense dashboard location labels (pre-existing density; Minor/Observation for UI Batch 1 polish, not crypto).

### 6.4 Accessibility / appearance (smoke)

| Check | Result |
|---|---|
| Landmarks (nav/main) | Present on crawled surfaces |
| Keyboard Tab focus on `/staffpay` | Focus moved to `BUTTON` with visible `outline: solid 2px` |
| Labels / named controls | A11y probe counts labelled focusables on surfaces |
| Colour-only status | Status text/tags present alongside colour (e.g. CRITICAL/CURRENT) |
| Light/dark via Playwright `colorScheme` | Screenshots captured; **app theme is class/preference driven** — `prefers-color-scheme` alone does not fully switch Premium Clinical dark tokens (Observation for appearance verification method / UI Batch 1 completeness) |
| Reduced motion | Emulated `reducedMotion: "reduce"` during crawl |

### 6.5 Independent screenshots

Directory: `docs/audits/browser-crypto-ui-batch1-independent-qa/`

Minimum set captured:

- `dashboard-1440.png`, `dashboard-390.png`
- `shell-nav-1440.png`, `shell-nav-390.png`
- `action-inbox-1440.png`, `action-inbox-390.png`
- `organisation-access-1440.png`, `organisation-access-390.png` (via `/settings`)
- `staff-doctors-1440.png`, `staff-doctors-390.png`
- `roster-1440.png`, `roster-390.png`, `time-attendance-1440.png`, `time-attendance-390.png`
- `staffpay-overview-1440.png`, `staffpay-overview-390.png`
- `staffpay-adjustments-1440.png`, `staffpay-adjustments-390.png`
- Light/dark examples: `light-_dashboard-1440.png`, `dark-_dashboard-1440.png`, plus staffpay variants
- Machine report: `browser-validation-report.json`

Truthful states observed (e.g. Adjustments register loading / empty; non-certified disclaimers; Demo Act-as banner). No manufactured production data.

---

## 7. Findings by severity

### Critical

- **None** for crypto hash correctness or browser `node:crypto` scheme failure on the remediation path.

### Major

1. **UI Batch 1 incomplete vs Owner UI Decision Register redesign objective** — tokens/primitives + GAP-PAR-003 Overview correction landed, but dashboard still carries dense prototype chrome / verbs that register treats as polish/truthfulness debt (GAP-PAR-008 class). Successful crypto fix ≠ full UI Batch 1 register pass.
2. **Production `next build --webpack` typecheck failure** in `published-timesheet-outbox.ts` (pre-existing; outside crypto/UI Batch 1 diffs) blocks clean production build gate until separately remediated.

### Minor

1. First Playwright `/dashboard` **500** (transient; warm/recheck 200) — flake/risk for CI browser gates.
2. `/organisation-access` literal 404 — naming mismatch only; `/settings` is correct Organisation & Access route.
3. One roster `networkidle` timeout at 1024 during width matrix.
4. Playwright `colorScheme` dark screenshots do not fully exercise in-app appearance preference persistence.

### Observation

1. Junctioned `node_modules` + default Turbopack build incompatible on this Windows worktree pattern; webpack dev/build compile works.
2. Hydration console noise under stress crawl; not crypto-scheme related; second focused pass quiet.
3. Auth server bundles correctly retain `node:crypto` (server-only).

---

## 8. Owner-acceptance recommendations

### 8.1 Crypto-remediation acceptance

**Recommend: PASS / ACCEPT** for `a1efd472ea086d98e82b6ca60da8b9071b1808e2` as an infrastructure/browser-boundary remediation.

Rationale: known vector exact; Node parity; barrels cleaned; client static free of `node:crypto`; M06/M07/PPA/Batch5/Batch6/workforce regression green; scope limited to authorised crypto/boundary files.

### 8.2 UI Batch 1 acceptance

**Recommend: QUALIFIED / NOT FULL PASS** against `HCDP_OWNER_UI_DECISION_REGISTER` full redesign objective.

Rationale: GAP-PAR-003 Overview copy corrected; presentation tokens/components applied; routes render; responsive overflow largely OK. Remaining register gaps (chrome truthfulness, full Premium Clinical completion, appearance preference dark-path verification) prevent an unqualified Batch 1 acceptance.

### 8.3 Controlled integration readiness

**Recommend: YES for controlled integration of crypto remediation** onto the authorised lineage (still **do not** merge to `main` without owner process).

Integrate/carry forward `a1efd47` as the browser-safe tip of UI Batch 1 + security baseline. Track outbox typecheck as a **separate** defect/CR if production build gate is required.

### 8.4 May UI Batch 2 begin?

**Recommend: NO — not yet.**

UI Batch 2 should wait until owner accepts (or explicitly waives) UI Batch 1 qualifications against the register, or authorises a named follow-up batch to close register gaps. Crypto remediation success **does not** authorise Batch 2.

---

## 9. Confirmations

- Independent evidence re-run (not sole reliance on `docs/audits/browser-crypto-remediation/`).
- No production code, tests, config, wave-control, plans, or earlier batch evidence modified for this lane.
- No merge performed; candidate not ancestor of `origin/main`.
- Wave 5 evidence JSON mutations from tests discarded.
- This report + independent QA screenshots only intended for commit on `cursor/browser-crypto-ui-batch1-independent-qa`.

---

## 10. STOP CHECKPOINT summary

| Item | Value |
|---|---|
| Verified candidate | `a1efd472ea086d98e82b6ca60da8b9071b1808e2` |
| Ancestry | `c8c9995 → 834cf22 → a1efd47` |
| Hash vector | **EXACT** `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Crypto acceptance | **PASS** |
| UI Batch 1 acceptance | **QUALIFIED / NOT FULL PASS** |
| Integration | **Controlled yes (crypto tip); no main merge** |
| UI Batch 2 | **May not begin yet** |
| Nothing merged or repaired | **Confirmed** |

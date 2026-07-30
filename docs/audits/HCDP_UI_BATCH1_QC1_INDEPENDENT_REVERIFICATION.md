# HCDP UI Batch 1 QC-1 — Independent Re-Verification

**Document:** `docs/audits/HCDP_UI_BATCH1_QC1_INDEPENDENT_REVERIFICATION.md`  
**Lane:** Independent re-verification only (no repair, redesign, merge, or UI Batch 2)  
**Date:** 30 July 2026  
**QA branch:** `cursor/ui-batch1-qc1-independent-reverification`  
**Worktree:** `C:\Users\ETB Sri Lanka\Desktop\HCDP\.worktrees\ui-batch1-qc1-independent-reverification`  
**Evidence folder:** `docs/audits/ui-batch1-qc1-independent-reverification/` (new; does not overwrite QC-1 evidence)

---

## 1. Candidate and pre-flight (verified)

| Ref | SHA | Role |
|---|---|---|
| Security / PPA-1 remediation | `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` | Ancestry base |
| UI Batch 1 | `834cf22a63efc36423533586d56e8913d8bedd8b` | Premium Clinical Batch 1 |
| Browser-crypto remediation | `a1efd472ea086d98e82b6ca60da8b9071b1808e2` | QC-1 base |
| **QC-1 candidate tip** | **`9d98d6e57ba3afaef4aa38e20640d2bfbc128122`** | Qualification completion |
| Owner UI Decision Register | `a4d9d3b2dc321ff16f6a42795e8e5bdbc996630b` | Authority (git show) |
| First independent verification | `a4350c942aa2ce6987c62e9c348354900dfab712` | Evidence-only |
| Qualification plan | `86235bfa8ca976589ff675d0b239485d2a8b99d7` | Planning authority |

**Ancestry (exact, verified):**

```text
c8c9995 → 834cf22 → a1efd47 → 9d98d6e
```

| Check | Result |
|---|---|
| `git merge-base --is-ancestor c8c9995 9d98d6e` | **0 (true)** |
| `git merge-base --is-ancestor 834cf22 9d98d6e` | **0 (true)** |
| `git merge-base --is-ancestor a1efd47 9d98d6e` | **0 (true)** |
| Parent of `9d98d6e` | `a1efd47` (exact) |
| Candidate pushed (`origin/cursor/ui-batch1-qualification-completion`) | **Yes** @ `9d98d6e` |
| Candidate / crypto / UI Batch 1 / prior QA / plan / register on `origin/main` | **No** (all merge-base exit 1) |
| Working tree at checkout of candidate | **Clean** at `9d98d6e` |
| Ancestry / unrelated production creep | **None** — proceed |

Fetch performed from `C:\Users\ETB Sri Lanka\Desktop\HCDP\Development folder` remotes.

### Authoritative references read completely

1. `HCDP_OWNER_UI_DECISION_REGISTER.md` @ `a4d9d3b`  
2. `BROWSER_CRYPTO_AND_UI_BATCH1_INDEPENDENT_VERIFICATION.md` @ `a4350c9`  
3. `HCDP_UI_BATCH1_QUALIFICATION_COMPLETION_PLAN.md` @ `86235bf`  
4. Crypto evidence under `docs/audits/browser-crypto-remediation/` @ `a1efd47`  
5. QC-1 tip evidence under `docs/audits/ui-batch1-qualification-completion/` @ `9d98d6e` (read-only; not overwritten)

Owner decisions applied: **OD-A1 NARROW**, **OD-A2**, **OD-MIN-01…05**. No waiver of F-MAJ-01 or F-MIN-04.

---

## 2. Diff inventory (`a1efd47..9d98d6e`)

### Production / test / tooling

| Status | Path | Role |
|---|---|---|
| M | `src/components/workspaces/DashboardWorkspace.tsx` | F-MAJ-01 NARROW chrome truthfulness |
| M | `src/platform/context/clinic-context.tsx` | Stable `getServerSnapshot` for hydration (F-MIN-04 support) |
| M | `src/platform/context/identity-context.tsx` | Stable `getServerSnapshot` for hydration (F-MIN-04 support) |
| A | `src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts` | QC-1 chrome + appearance + hydrate asserts |
| A | `scripts/ui-batch1-qualification-browser-validate.mjs` | QC-1 browser harness (prior evidence) |
| A | `docs/audits/ui-batch1-qualification-completion/*` | QC-1 screenshots + JSON (not overwritten here) |

**Command Centre / `command-centre/*`:** **unchanged** in `a1efd47..9d98d6e` (OD-A1 NARROW respected).

**Protected domains untouched in QC-1 delta:** payroll calculations, PPA services/domain, hashing algorithm files, permissions, contracts (except clinic/identity snapshot stability), module availability, redirects, accepted Batch 1–6 evidence, wave-control, M08, Auth, Postgres, payment/export behaviour, PPA security/concurrency files.

Full stack `c8c9995..9d98d6e` additionally contains UI Batch 1 presentation + crypto remediation (already independently verified earlier); this lane re-verified their continued integrity on tip `9d98d6e`.

---

## 3. F-MAJ-01 — DashboardShellStrip truthfulness (independent)

### 3.1 Control inventory (post-QC-1)

| Control | Location | Type | Behaviour | Data/service authority | User-visible result | Truthful? | Finding |
|---|---|---|---|---|---|---|---|
| Enterprise Sign-In (MFA) | `DashboardShellStrip` card | Disabled explanatory / status | No clickable action; `role="status"` note | None (no auth backend) | “Non-operational — live authentication backend required” | **Yes** | Closed vs prior toast-demo |
| Clinic & Workspace Scope → Review access controls | Strip card | Navigation | `Link` → `/organisation` | Route navigation | Opens organisation/access surface | **Yes** | Pass |
| Connection Healthy | Strip card | Disabled explanatory / status | No simulate action; status note | Local copy only | “Status display only — outage simulation is not available” | **Yes** | Closed vs “Simulate outage” toast |
| Restoration Reconciliation → Open staging review | Strip card | Navigation | `Link` → `/sync-centre` | Route navigation | Navigates to sync centre | **Yes** | Pass |
| Open Emergency Control | Emergency card | Navigation | `Link` → `/emergency-centre` | Route navigation | Navigates | **Yes** | Pass |
| Start intervention | Emergency card | Disabled explanatory | Non-button `span` + `role="status"` | None | “Start intervention — non-operational” | **Yes** | Closed vs danger Button + toast |
| Emergency progress rows (Bald Hills / Lawnton / Beachmere) | Emergency card | Decorative / sample status | Static constants; no mutation | Local demo constants | Progress bars + status text | **Qualified** | Pre-existing sample density; **not** toast-fake success; Group B polish if owner wants removal |
| Management Control Status rows | Management card | Legitimate info / sample status | Static rows; status badges with text (not colour-only) | Local demo constants | Sign-in / Escalation / Offline / Access statuses | **Qualified** | Same — NARROW did not require redesign; no fake buttons |
| ModuleContextStrip Quick find / Workflows / Insights / View | Below strip | Navigation / info dialogs | Modals with real links or guidance | Nav prefs / static guidance | Opens dialogs; not toast-only operational fake | **Pass (NARROW)** | Outside toast-demo verbs; not redesigned |
| Favourite star | ModuleContextStrip | Persistent local | `toggleFavorite` + toast for fav add/remove | `nav-prefs` localStorage | Favourite toggle | **Pass** | Legitimate local preference |

### 3.2 Ten truthfulness criteria (applied)

1. No toast-only demo verbs claiming live backend success on strip — **PASS** (source + live DOM).  
2. No “Simulate outage” / “Review sign-in journey” / actionable “Start Intervention” buttons — **PASS**.  
3. Non-operational affordances explicitly labelled — **PASS**.  
4. Remaining interactive strip controls are navigation-only — **PASS**.  
5. No new fake metrics invented in QC-1 — **PASS**.  
6. No Command Centre redesign under NARROW — **PASS** (`CommandCentre.tsx` identical to `a1efd47`).  
7. UI-DASH-03 / UI-FAKE-01 satisfied for authorised strip scope — **PASS**.  
8. Automated source tests alone insufficient — **PASS** (browser `chromeTruthfulness` + screenshots corroborate).  
9. Status not colour-only on strip management badges — **PASS** (text labels Current/Critical/etc.).  
10. Pre-change inventory reconciled: toast `onAction` / `pushToast` / danger Start Intervention removed; nav links retained — **PASS**.

**F-MAJ-01 verdict:** **PASS / ACCEPT** under **OD-A1 NARROW**. Remaining Command Centre density / sample emergency & management rows are **Group B / Observation**, not reopen of F-MAJ-01.

---

## 4. F-MIN-04 — In-app appearance (independent)

### 4.1 Mechanism inspected

| Item | Value |
|---|---|
| Persistence key | `pulse.cc.appearance` (`CC_STORAGE.appearance`) |
| Init path | `hydrateAppearanceFromStorage()` in `portal-context` `useLayoutEffect` |
| DOM application | `document.body.classList.toggle("theme-dark", resolveIsDark(value))` |
| Selector | `ControlBar` `<select aria-label="Appearance">` Light / Dark / Device setting |
| System listener | `subscribeSystemAppearance` → re-`applyAppearance("system")` when OS preference changes |
| Tokens | `body.theme-dark` PCE block in `tokens.css`; light canvas `#fbfbfa` / `rgb(251, 251, 250)` |

### 4.2 Fifteen criteria

| # | Criterion | Result |
|---|---|---|
| 1 | Light applies via in-app selector | **PASS** — stored=light; themeDark=false; canvas `rgb(251,251,250)` |
| 2 | Dark applies via in-app selector | **PASS** — themeDark=true; canvas `rgb(7,17,31)` |
| 3 | System + OS light | **PASS** — stored=system; themeDark=false under Playwright `colorScheme: light` |
| 4 | System + OS dark | **PASS** — separate context `colorScheme: dark`; themeDark=true; `inapp-system-os-dark-dashboard-1440.png` |
| 5 | Preference persists across nav | **PASS** — dark survives overview → adjustments |
| 6 | Preference persists across reload | **PASS** |
| 7 | Hydration / no material theme flash that blocks use | **PASS** for product gate; residual console hydration noise remains Observation (see §7) |
| 8 | No unexpected reset of M07 section | **PASS** — overview/adjustments stayed on section while theme persisted |
| 9 | Clinic / identity / filters / nav not wiped by appearance | **PASS** — clinic snapshot semantics unchanged; fav/nav intact |
| 10 | Readability light/dark | **PASS** (screenshots) |
| 11 | Status not colour-only | **PASS** (text badges retained in dark) |
| 12 | Champagne restraint | **PASS** (no new accent invent in QC-1) |
| 13 | No second theme system | **PASS** — single `pulse.cc.appearance` + `theme-dark` |
| 14 | No unnecessary tokens / remote fonts/packages in QC-1 | **PASS** — QC-1 did not add fonts/packages |
| 15 | Playwright `colorScheme` alone not used as sole evidence | **PASS** — in-app selector mandatory path exercised |

### 4.3 Hydrate fix scrutiny (`clinic-context` / `identity-context`)

| Question | Independent answer |
|---|---|
| Necessary for F-MIN-04? | **Yes, supporting.** Prior `getServerSnapshot()` called `defaultState()` / `defaultIdentity()` creating **new object identity** each call (`updatedAt: new Date().toISOString()` on clinic), violating React `useSyncExternalStore` referential stability and contributing to hydration mismatch under appearance-driven re-render. |
| Changes clinic / LE / identity semantics? | **No.** Clinic snapshot still All Clinics / empty selection / versioned shape; identity still `DEMO_IDENTITIES[1]` (Sarah). Only stability + fixed epoch `updatedAt` on the server snapshot constant. |
| Hides wider CSR/SSR boundary errors? | **No.** Fix is the correct React pattern. Residual hydration console noise (28/32 non-crypto console events) remains on stress crawl — documented Observation; not suppressed. |
| Within authorised boundary? | **Yes** — minimal platform context stability to support appearance hydrate; not domain/payroll/PPA. |

**F-MIN-04 verdict:** **PASS / ACCEPT** via **real in-app appearance system** (not Playwright `colorScheme` alone).

---

## 5. F-MIN-05 — Mobile 390/430

| Confirmation | 430 | 390 |
|---|---|---|
| Route renders | Yes | Yes |
| `overflowX` false on dashboard | Yes | Yes |
| Hamburger / nav present | Yes | Yes |
| Primary links visible / reachable | Yes (`primaryVisible`) | Yes |
| Review access / Emergency / Staging / Staff Pay / Action Inbox reachability | primaryLinkCount=7 | 7 |
| Toast-fake strip verbs absent | Yes | Yes |
| Appearance not required at mobile for this deferral | N/A | N/A |
| Task completion not blocked by label clip | Yes | Yes |
| Truncation measurement | `.truncate` samples `clipped:false` | same |
| Meaning of nav groups intact | Yes | Yes |
| Workflow chrome reachable | Yes | Yes |
| Cosmetic density remains | Yes (dense labels) | Yes |

**Classification of truncated-label samples:** nav group titles (Executive Command, Organisation, People, Roster, Operations, Governance, Assets, Communications) — **cosmetic density**; not primary CTA occlusion.

**F-MIN-05 verdict:** **QUALIFIED / ACCEPT WITH EXPLICIT DEFERRALS** under **OD-MIN-05**.

---

## 6. Protected-scope audit

| Area | QC-1 touched? | Result |
|---|---|---|
| Payroll calculations / ordinary prep domain | No | Pass |
| PPA lines / pickers / calcs / approval / recon / export / payment | No | Pass |
| Hashing algorithm / canonicalisation | No (crypto tip preserved) | Pass |
| Permissions / authz behaviour | No | Pass |
| Contracts (except stable snapshots) | No | Pass |
| Module availability / redirects | No | Pass |
| Accepted Batch 1–6 evidence rewritten | No | Pass |
| Wave-control | No | Pass |
| M08 / Auth / Postgres / PPA-2 | No | Pass |
| Overview copy (GAP-PAR-003) | Unchanged vs Batch 1; still truthful | Pass |
| PPA-1 presentation-only | Retained | Pass |
| Fake metrics added | No | Pass |

---

## 7. Browser-crypto regression

| Check | Result |
|---|---|
| Known vector exact | **`7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`** — pure / Node / `calculatePayrollContentHash` **EXACT** |
| Canonical JSON unchanged vs prior IV | Exact match |
| `node:crypto` in published-timesheet-hash / sha256 helper | Absent |
| M06/M07 barrels re-export adapters/services | Still stopped |
| Browser console crypto / UnhandledSchemeError | **0** |
| Published-timesheet registry | 27/27 |
| M06 published create/verify | 19/19 |
| Silent migration / dual-hash fallback / second authority | Not introduced |

**Browser-crypto continued acceptance:** **PASS / ACCEPT**.

---

## 8. Outbox issue (OD-A2)

| Question | Answer |
|---|---|
| Touched by QC-1 (`a1efd47..9d98d6e`)? | **No** |
| Severity change tip vs base? | **No** — identical file |
| Browser runtime? | **No** — typecheck/build gate only |
| QC-1 feature impact? | **None** |
| Exact error | `src/modules/m06-time-attendance/services/published-timesheet-outbox.ts:235` — `Property 'code' does not exist on type 'PublishFromOutboxResult'` (also `message`); webpack `next build --webpack` compile reaches typecheck then fails here |
| Classification | **Pre-existing infrastructure blocker** (non-blocking for UI Batch 1 under **OD-A2**) |

---

## 9. Tests (exact commands; no inflation)

All run from QA worktree HEAD `9d98d6e`. Wave 5 evidence JSON mutations discarded (`git checkout --`); not committed.

| # | Category | Command | Exit | Totals |
|---|---|---|---|---|
| 1 | QC-1 focused (+ chrome/appearance/hydrate) | `npx tsx --test src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts` | 0 | **6**/6 |
| 2–4 | Dashboard chrome / appearance / hydration | *(same suite as #1 — not re-counted)* | — | — |
| 5 | UI Batch 1 presentation | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts` | 0 | **5**/5 |
| 6–7 | Shell/nav + Dashboard | Browser matrix + #1/#5 | 0 | See §10 |
| 8 | M07 shell | `npx tsx --test src/modules/m07-staff-pay/tests/m07-shell.test.ts` | 0 | **6**/6 |
| 9 | PPA-1 UI | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-ui.test.tsx` | 0 | **10**/10 |
| 10 | PPA-1 integration | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-integration.test.tsx` | 0 | **11**/11 |
| 11 | PPA-1 security / concurrency | hook-security + core + atomicity | 0 | **6+10+9=25**/25 |
| 12 | Crypto remediation | `npx tsx --test src/platform/workforce/tests/browser-crypto-remediation.test.ts` | 0 | **8**/8 |
| 13 | Hash-vector / determinism | `npx tsx _qa_refs/hash-vector.mts` | 0 | **EXACT** |
| 14 | Published-timesheet create/verify | registry + `m06-published-timesheet.test.ts` | 0 | **27+19** |
| 15 | Browser/server boundary | barrels + browser crypto hits | 0 | **0 crypto hits** |
| 16 | M06 affected | covered by #14 published + #17 | — | — |
| 17 | Full M06 | `npm run test:m06` | 0 | **83**/83 |
| 18 | Full M07 | `npm run test:m07` | 0 | **252**/252 |
| 19 | Batch 5 | three `m07-batch5-*.test.ts` files | 0 | **49**/49 |
| 20 | Batch 6 | five `m07-batch6-*.test.ts` files | 0 | **43**/43 |
| 21 | Architecture / boundary | `m07-architecture-cp27` + `m07-boundary-cp23` | 0 | **15**/15 |
| 22 | Permissions / context | `m07-authz.test.ts` | 0 | **13**/13 |
| 23 | Legacy alias / redirect | browser aliases | 0 | all OK → Action Inbox / tasks / etc. |
| 24 | Full affected regression | M06+M07+workforce (overlaps noted) | 0 | **83 + 252 + 53** |
| 25 | Scoped typecheck | `npx tsc --noEmit` | 2 | Pre-existing outbox + test typing; **not QC-1** |
| 26 | Production build | `npx next build --webpack` | 1 | Compile OK; typecheck fails outbox:235 (OD-A2) |

Machine-readable: `docs/audits/ui-batch1-qc1-independent-reverification/independent-test-matrix.json`.

---

## 10. Real browser (independent)

| Item | Value |
|---|---|
| Dev server | `npm run dev -- -p 3464` (3461 busy; recorded) |
| Base | `http://localhost:3464` |
| Harness | Local `_qa_refs/independent-reverify-browser.mjs` → evidence folder (not committed) |
| Cold `/dashboard` | **200** |
| Warm `/dashboard` | **200** |
| OD-MIN-01 | Not deferred (cold+warm both OK) |
| `/organisation-access` | **404** — accepted non-defect (**OD-MIN-02**) |
| Routes | dashboard, action-inbox, settings, staff-doctors, roster, time-attendance, staffpay, overview, adjustments — all **200**; cryptoCrash=false |
| Widths 1440…390 | All cells `overflowX=false`; **0** width failures |
| Roster confirm | 200; overflowX=false (**OD-MIN-03** not needed) |
| Appearance | Light/Dark/System + System+OS-dark + persist — all **ok** |
| Chrome truthfulness | toast-only buttons absent; non-operational labels present |
| Crypto console hits | **0** |
| Console errors | 32 total; **0** crypto; ~28 hydration-ish (Observation) |
| Keyboard / focus | Tab reaches controls; `Button` defines `focus-visible:outline-2`; probe saw outlineWidth 0px with non-none boxShadow — **Observation** (not material a11y Major on this tip) |
| Screenshots | **28** files including required minima + System+OS-dark |
| Report JSON | `browser-validation-report.json` |

Truthful empty/load states observed on Adjustments; Demo Act-as banner retained; non-certified Overview copy retained.

---

## 11. Findings by severity

### Critical

- **None.**

### Major

- **None newly opened.** F-MAJ-01 closed under NARROW. Outbox build gate remains **OD-A2** pre-existing (not elevated).

### Minor

- Residual hydration console noise under stress crawl (historical F-OBS-02 class) — not crypto; not treated as F-MIN-04 failure.  
- Focus-probe outlineWidth 0px on some chrome buttons despite `focus-visible` CSS on shared `Button` — Observation/Minor harness nuance; not a material a11y Major on crawled primary paths.

### Accepted deferrals

| ID | Disposition |
|---|---|
| F-MIN-01 | N/A this run (cold OK) / OD-MIN-01 stands |
| F-MIN-02 | Accepted (`/organisation-access` 404) |
| F-MIN-03 | N/A this run (roster OK) / OD-MIN-03 stands |
| F-MIN-05 | Cosmetic density deferred (**OD-MIN-05**) |
| F-MAJ-02 / outbox | Separate infra CR (**OD-A2**) — does **not** block UI Batch 1 accept |
| F-DEFER-B01/B02 | Command Centre / module redesign → UI Batch 2 |

### Passed requirements

F-MAJ-01 (NARROW), F-MIN-04 (in-app), crypto gates, Overview GAP-PAR-003 retention, PPA-1 presentation bounds, responsive overflow, alias redirects, QC-1 scope.

---

## 12. Owner-acceptance gate (UI Batch 1)

| # | Gate condition | Met? |
|---|---|---|
| 1 | Crypto remains ACCEPTED on linear tip preserving gates | **Yes** (`9d98d6e` ⊃ `a1efd47`) |
| 2 | F-MAJ-01 closed under OD-A1 NARROW | **Yes** |
| 3 | F-MIN-04 in-app appearance Pass | **Yes** |
| 4 | F-PASS-M07-05 Overview still truthful | **Yes** |
| 5 | PPA-1 presentation truthful; no Group C controls | **Yes** |
| 6 | Responsive overflow Pass | **Yes** |
| 7 | A11y criteria on touched surfaces Pass (smoke + roles) | **Yes** (with Obs on outline probe) |
| 8 | Regression suites green | **Yes** |
| 9 | New screenshot + browser evidence filed | **Yes** (this folder) |
| 10 | Independent re-verification Pass / QUALIFIED only for deferred Minors | **Yes** |
| 11 | UI Batch 2 not started by this lane | **Yes** |
| 12 | No production/certification/payment claim | **Yes** |
| 13 | OD-A2 outbox recorded, not silently ignored | **Yes** |
| 14 | OD-MIN-02/05 applied explicitly | **Yes** |
| 15 | No waiver of F-MAJ-01 / F-MIN-04 | **Yes** |
| 16 | Candidate unmerged to main | **Yes** |
| 17 | QC-1 scope compliance | **Yes** |
| 18 | Hydrate fix within boundary / non-semantic | **Yes** |

**Recommendation:** Owner **may finally accept UI Batch 1** (with listed deferred Minors / OD-A2 outbox tracked separately).

**QC-1 accept ≠ automatic merge to `main`.**  
**QC-1 accept ≠ automatic UI Batch 2 authorisation** — Batch 2 still requires **separate explicit owner authorisation**.

---

## 13. Separate verdicts (required)

| # | Question | Verdict |
|---|---|---|
| 1 | F-MAJ-01 closure | **PASS / ACCEPT** (OD-A1 NARROW) |
| 2 | F-MIN-04 closure | **PASS / ACCEPT** (real in-app appearance) |
| 3 | F-MIN-05 deferral validity | **QUALIFIED / ACCEPT WITH EXPLICIT DEFERRALS** (OD-MIN-05) |
| 4 | QC-1 scope compliance | **PASS / ACCEPT** |
| 5 | QC-1 technical acceptance | **PASS / ACCEPT** (OD-A2 outbox excluded from UI fail) |
| 6 | Final UI Batch 1 owner acceptance | **PASS / ACCEPT** (with explicit deferred Minors + OD-A2) |
| 7 | Browser-crypto continued acceptance | **PASS / ACCEPT** |
| 8 | Controlled integration readiness | **QUALIFIED / ACCEPT WITH EXPLICIT DEFERRALS** — ready for **controlled** integration of tip `9d98d6e` onto authorised lineage; **not** main merge; outbox CR separate |
| 9 | UI Batch 2 readiness | **QUALIFIED / ACCEPT WITH EXPLICIT DEFERRALS** — **eligible for separate owner authorisation** after Batch 1 accept; **not authorised / not started** by this lane |

---

## 14. Confirmations

- Independent evidence re-run; did not rely solely on QC-1 claimed closed status.  
- No production code, tests, configuration, wave-control, plans, or prior evidence modified.  
- Only this report + new evidence folder intended for commit on `cursor/ui-batch1-qc1-independent-reverification`.  
- Candidate `cursor/ui-batch1-qualification-completion` @ `9d98d6e` untouched.  
- No merge; no Batch 2; no repair.

---

## 15. STOP CHECKPOINT

| Item | Value |
|---|---|
| Verified candidate | `9d98d6e57ba3afaef4aa38e20640d2bfbc128122` |
| Ancestry | `c8c9995 → 834cf22 → a1efd47 → 9d98d6e` |
| F-MAJ-01 | **PASS / ACCEPT** (NARROW) |
| F-MIN-04 | **PASS / ACCEPT** (in-app) |
| F-MIN-05 | **QUALIFIED deferral valid** |
| Hash vector | **EXACT** `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Crypto | **PASS / ACCEPT** |
| QC-1 technical | **PASS / ACCEPT** |
| Final UI Batch 1 owner acceptance | **PASS / ACCEPT** (deferred Minors + OD-A2 noted) |
| Controlled integration | **Qualified yes** (not main merge) |
| UI Batch 2 | **Eligible for separate auth only — not started** |
| Nothing repaired / merged | **Confirmed** |
| Evidence | `docs/audits/ui-batch1-qc1-independent-reverification/` |
| Report | this file |

*End of independent re-verification.*

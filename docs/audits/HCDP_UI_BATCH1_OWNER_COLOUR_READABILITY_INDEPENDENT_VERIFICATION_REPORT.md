# HCDP — UI Batch 1 Owner Colour/Readability Independent Verification Report

**Lane:** Independent verification only (not merge, not production approval, not UI Batch 2)  
**Owner decision:** Accepted for independent verification only — 4 August 2026  
**Verification branch:** `cursor/ui-batch1-owner-colour-readability-independent-verification`  
**Candidate branch tip (immutable):** `ee9731e38e7d20d6d825e6c243503f4aea9564c3`  
**Prior visual-remediation base:** `f3333b6f27b6c0afc5a29bcff45e9bccea392c35`  
**origin/main confirmed:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Evidence:** `docs/audits/ui-batch1-owner-colour-readability-independent-verification/`  
**Overall independent verdict:** **FAIL**

---

## 1. Independence declaration

This agent did not implement the remediation. Work was evidence-only:

- No application-source repairs
- No alteration of existing tests or thresholds
- No dependency version upgrades (`npm ci` used only to materialise the lockfile after Turbopack rejected a verification junction to sibling `node_modules`)
- No overwrite of remediation evidence directories
- No merge, PR, main update, controlled integration, or UI Batch 2 start
- Remediation screenshots/logs were treated as claims only; new screenshots and logs were captured independently

---

## 2. Pre-flight / refs / environment

| Check | Result |
| --- | --- |
| `origin/main` | `0afe8780…` exact match |
| Candidate tip | `ee9731e3…` exact match |
| Ancestry `f3333b6` ⊂ `ee9731e` | Confirmed (`merge-base --is-ancestor` exit 0) |
| Verification branch existence | Did not exist; created from full candidate SHA in isolated worktree |
| Owner-inspection port 3000 / PID 17288 | Preserved; still listening after verification |
| Verification ports | Candidate `3465`; baseline `3466` |
| Node / npm / git / OS / Playwright | See `preflight.json` (`v24.15.0` / `11.12.1` / git `2.54.0` / Windows 10 Pro 19045 / Playwright 1.49.0) |

Commits on candidate since `f3333b6`:

1. `2fb4629` fix(ui): normalise accessible light and dark theme tokens  
2. `177bf32` test(ui): verify colour contrast and typography readability  
3. `badc2f6` docs(audits): record UI Batch 1 colour readability remediation  
4. `a27ab53` docs(audits): record colour readability localhost handoff  
5. `ee9731e` docs(audits): pin colour readability handoff tip  

---

## 3. Complete candidate diff / protected-scope audit

Production/script changes are limited to presentation, tokens, and readability tests:

- `src/styles/tokens.css`, `src/app/globals.css`
- Shell / UI primitives (`Sidebar`, `Topbar`, `Badge`, `Button`, `Metric`, …)
- Command Centre, Action Inbox, Organisation, M04–M07 section className/token replacements
- New unit test `ui-batch1-owner-colour-readability.test.ts` and minor related expectation text updates
- Validation script under `scripts/`

**Not changed:** package.json/lockfile; Postgres/migrations; PPA domain/repository/security/concurrency; OD-A2 behaviour; published-timesheet hash implementation; M06–M07 contracts; workforce identity; permissions/auth; clinic/LE boundaries; M08; payments/providers/exports; wave-control rules; route registry behaviour.

Behaviour-looking added lines (handlers/permissions/fetch/hash/SQL): **none** detected in the `src` diff (`protected-scope-audit.json`).

**Protected-scope gate:** **PASS**

---

## 4. Semantic-token / focused contrast (browser-computed)

Dashboard 1440 focused token probes (`contrast-summary.json`):

| Pair | Light | Dark | Threshold |
| --- | --- | --- | --- |
| Primary text on canvas | **14.62:1** | **14.82:1** | ≥7:1 |
| Muted on surface | **5.07:1** | **7.43:1** | ≥4.5:1 |
| On-action on action | **10.97:1** | **6.63:1** | ≥4.5:1 |
| Control border on surface | **3.84:1** | **3.10:1** | ≥3:1 |

Token-layer gates match remediation claims for the Command Centre / dashboard surface.

---

## 5. Independent matrix — contrast, typography, dark leaks

Script: `scripts/ui-batch1-owner-colour-readability-independent-verify.mjs`  
Machine report: `browser-validation-report.json`, `issues.json`, `issue-samples.json`

| Metric | Result |
| --- | --- |
| Matrix entries | 252 |
| Matrix pass / fail | **0 / 252** (entry fails when any FAIL issue recorded) |
| Issue totals | 3916 FAIL adjudications |
| Dominant issue | `typography-control-below-13` × **3442** (computed **12px** on nav group labels, favourite controls, helper/ribbon text) |
| Contrast AA fails | **458** (heavily concentrated on favourite ★ chrome ≈ **2.99–3.91:1**) |
| Light-surface leaks (dark) | **8** (Settings nearly-white cards `rgb(251,252,253)`; Action Inbox light chips) |
| Focused probe anomalies | 2 × ratio `1` during dark matrix cells (token probe returned empty computed colours mid-route; dashboard focused values still pass) |

### Typography adjudication

Owner gate requires navigation/action/helper/form/table text ≥13px. Independently measured sidebar family labels (`EXECUTIVE COMMAND`, `PEOPLE`, …), favourite controls, and several helpers at **12px**. This is **not** dismissed as a scraper false-positive: selectors and computed `fontSize` are explicit in `issue-samples.json`.

### Dark-mode leak adjudication

Dark Settings and Action Inbox show near-white composited surfaces (`light-surface-leak`). Failures are individually evidenced; no general transparent-background waiver applied.

### Appearance persistence

| Check | Result |
| --- | --- |
| Clean storage default | Light / not dark — **PASS** |
| System + OS light | theme follows light — **PASS** |
| Dark reload persistence | `persistedDark: false` in matrix summary — **FAIL** |
| System + OS dark | `prefersDark: true` but `themeDark: false` after reload settle — **FAIL** |

---

## 6. Sidebar / dashboard / M04–M07 structure

| Check | Independent result |
| --- | --- |
| Exactly one `.pulse-sidebar` on canonical routes | Observed `sidebarCount=1` |
| Section sweep (all M04–M07 sections @1440 light) | `sectionSweepFail: 0` for focused token hard-gates |
| Interaction smoke | Search, favourite, collapse, appearance control, disclosure clicked; section tab clicked (`interactions.json`) |
| `/staffpay?section=overview` & `adjustments` | Reachable after compile; M07 qualification/PPA wording present in shell (hydration mismatch cites status paragraph) |

Screenshots (new): `screenshots/light-*.png`, `screenshots/dark-*.png`, system OS variants.

---

## 7. Special adjudications

### 7.1 Cold M07 Adjustments

| Run | Attempt 1 | Attempt 2 | Attempt 3 |
| --- | --- | --- | --- |
| Warm verification server (initial matrix) | **500** + `SyntaxError: Unexpected end of JSON input` | 200 | 200 |
| Clean server restart + clean contexts | **200** | 200 | 200 |

Evidence: `cold-adjustments.json`, `cold-adjustments-clean-server.json`.

**Adjudication:** **QUALIFIED**. First-hit 500 was observed independently on a warm server; clean-server restart did **not** reproduce. Not marked “harmless cold compile” without proof; not elevated to hard blocker solely on the unreproduced clean-server path. Residual risk remains.

### 7.2 `/staff-pay` and `/m07`

Same-method probe on candidate (`3465`) and baseline `f3333b6` (`3466`):

| URL | Candidate | Baseline `f3333b6` | Adjudication |
| --- | --- | --- | --- |
| `/staff-pay` | 404 | 404 | **Intentionally unsupported** (not in `APPROVED_MAIN_SLUGS` / legacy redirects) |
| `/m07` | 404 | 404 | **Intentionally unsupported** |
| `/staffpay` | 200 | 200 | Required main route |

Evidence: `alias-baseline-compare.json`.

### 7.3 M05 performance

Idle worktree, M05 alone (no concurrent browser/build):

- `npm run test:m05` → **exit 0**, **117/117 pass**, fail 0  
- Evidence: `logs/23-m05-run1.log`

Remediation’s 115/117 performance flake was **not** reproduced. **PASS** for this adjudication.

### 7.4 Hydration baseline comparison

Same routes/method on `f3333b6@3466` vs `ee9731e@3465`:

| | Baseline | Candidate |
| --- | --- | --- |
| Unique normalised hydration signatures | **0** | **1** |
| Candidate-only | M07 shell header mismatch: client `p.mt-2.text-xs… role="status"` vs server `div.mt-4` | |

Evidence: `hydration-candidate.json`, `hydration-baseline-f3333b6.json`, `hydration-comparison.json`, cold Adjustments console errors.

**Adjudication:** **FAIL / blocker for hydration non-regression** — candidate-only signature. UI remaining usable after client regenerate does not clear the gate.

### 7.5 Hash gate

Expected/actual exact:

`7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`

`calc` = `pure` = `node` = expected (`hash-vector-result.json`). **PASS**

---

## 8. Automated regressions (sequential)

| Suite | Exit | Tests | Pass | Fail |
| --- | --- | --- | --- | --- |
| Colour readability | 0 | 4 | 4 | 0 |
| Owner visual remediation | 0 | 10 | 10 | 0 |
| UI chrome | 0 | 7 | 7 | 0 |
| M07 presentation | 0 | 5 | 5 | 0 |
| M07 shell | 0 | 6 | 6 | 0 |
| OD-A2 | 0 | 8 | 8 | 0 |
| Browser-crypto | 0 | 8 | 8 | 0 |
| M06 published timesheet | 0 | 19 | 19 | 0 |
| Registry | 0 | 27 | 27 | 0 |
| PPA-1 UI | 0 | 10 | 10 | 0 |
| PPA-1 integration | 0 | 11 | 11 | 0 |
| PPA-1 security | 0 | 6 | 6 | 0 |
| PPA-1 core | 0 | 10 | 10 | 0 |
| PPA-1 atomicity | 0 | 9 | 9 | 0 |
| M04 | 0 | 16 | 16 | 0 |
| M05 (idle) | 0 | 117 | 117 | 0 |
| M06 | 0 | 91 | 91 | 0 |
| M07 | 0 | 252 | 252 | 0 |
| Workforce | 0 | 53 | 53 | 0 |
| Architecture CP27 set | 0 | 19 | 19 | 0 |
| M07 authz | 0 | 13 | 13 | 0 |
| Batch 5 | 0 | 49 | 49 | 0 |
| Batch 6 | 0 | 43 | 43 | 0 |

Logs: `docs/audits/ui-batch1-owner-colour-readability-independent-verification/logs/`  
Totals: `test-totals.json`

---

## 9. TypeScript / lint exact baseline comparison

| Check | Baseline `f3333b6` | Candidate `ee9731e` | Match |
| --- | --- | --- | --- |
| `npx tsc --noEmit` error count | 21 | 21 | **Exact path/message match** (`baseline/tsc-comparison.json`) |
| `npm run lint` | 2 errors / 24 warnings (26 problems) | 2 errors / 24 warnings (26 problems) | **Exact key-line match** (`baseline/lint-comparison.json`) |

---

## 10. Builds

| Command | Exit |
| --- | --- |
| `npx next build --webpack` | **0** |
| `npm run build` | **0** (after lockfile-faithful `npm ci`; initial Turbopack failure was due to verification-only `node_modules` junction) |

---

## 11. Findings (severity)

1. **Critical — Hydration non-regression:** Candidate-only M07 Adjustments/overview shell hydration mismatch absent on `f3333b6` same method.  
2. **High — Typography:** Widespread 12px navigation/control/helper text vs ≥13px gate.  
3. **High — Dark-mode leaks:** Near-white Settings cards / Action Inbox chips in dark appearance.  
4. **High — Meaningful icon contrast:** Favourite ★ frequently <3:1 / <4.5:1 depending on active row background.  
5. **Medium — Appearance System/Dark persistence:** Dark reload and System+OS-dark did not reliably retain `theme-dark` in independent harness.  
6. **Medium/Qualified — Warm-server Adjustments first hit 500:** Seen once independently; clean-server retest all 200.  
7. **Info — Aliases `/staff-pay`, `/m07`:** 404 on candidate and baseline; intentionally unsupported.

Residual risks: intermittent first-compile failures on warm servers; System appearance hydrate timing; incidental scraper noise on nested scrap elements (primary findings above are not reliant on that noise).

---

## 12. Twenty owner gates — independent verdicts

| # | Gate | Verdict |
| --- | --- | --- |
| 1 | Branch/base integrity | **PASS** |
| 2 | Light-mode readability | **FAIL** (12px nav/helper; fav contrast) |
| 3 | Dark-mode readability | **FAIL** (light-surface leaks + fav/icon contrast) |
| 4 | Semantic-token consistency | **PASS** (focused token probes; unit tests green) |
| 5 | Text contrast | **FAIL** (favourite/control text AA fails) |
| 6 | Controls/boundaries/focus contrast | **QUALIFIED** (token borders pass; interactive fav/control fails) |
| 7 | Typography readability | **FAIL** |
| 8 | Semantic status readability | **QUALIFIED** (tokens improved; dark Settings leak undermines status surfaces) |
| 9 | Sidebar readability | **FAIL** (12px group labels; fav contrast) |
| 10 | Dashboard readability | **QUALIFIED** (focused tokens pass; chrome issues remain) |
| 11 | M04–M07 readability | **QUALIFIED** (sections load; typography/chrome defects shared) |
| 12 | Appearance persistence | **FAIL** |
| 13 | Responsive behaviour | **QUALIFIED** (matrix ran; pervasive typography defects across widths) |
| 14 | Accessibility | **FAIL** (contrast + type minima) |
| 15 | Function preservation | **PASS** (interactions reached; no protected behaviour edits) |
| 16 | Hydration non-regression | **FAIL** (candidate-only) |
| 17 | Automated regressions | **PASS** |
| 18 | Builds and exact hash | **PASS** |
| 19 | Protected-scope compliance | **PASS** |
| 20 | Readiness for controlled-integration planning | **FAIL** |

**Overall independent-verification verdict: FAIL**

A FAIL here means the candidate must **not** proceed to controlled-integration planning until findings are remediated and re-verified. This is **not** merge approval language.

---

## 13. Evidence paths

- Report: `docs/audits/HCDP_UI_BATCH1_OWNER_COLOUR_READABILITY_INDEPENDENT_VERIFICATION_REPORT.md`
- Evidence dir: `docs/audits/ui-batch1-owner-colour-readability-independent-verification/`
- Script: `scripts/ui-batch1-owner-colour-readability-independent-verify.mjs`
- Hash helper: `scripts/ui-batch1-owner-colour-readability-independent-hash-gate.mjs`

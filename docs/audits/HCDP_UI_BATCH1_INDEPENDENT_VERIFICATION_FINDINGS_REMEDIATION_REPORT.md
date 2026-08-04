# HCDP — UI Batch 1 Independent-Verification Findings Remediation Report

**Lane:** Application remediation after independent verification FAIL  
**Branch:** `cursor/ui-batch1-owner-colour-readability-verification-fixes`  
**Application source SHA tested (final):** `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742`  
**Evidence/report commit:** `925fa1be127a00b3d843fa796f0cbb30eabdd495`  
**Final branch tip (at handoff):** see git HEAD on `cursor/ui-batch1-owner-colour-readability-verification-fixes` (docs-only after `e6e2f90`)
**Proof:** `git log e6e2f90..HEAD --name-only` shows docs/audits (+ validator scripts earlier); final matrix tested application tree at `e6e2f90`
**Base (failed candidate tip):** `ee9731e38e7d20d6d825e6c243503f4aea9564c3`  
**Independent-verification evidence tip (read-only):** `51fbfa980b9c834184a384ddcf956340397bf205`  
**origin/main confirmed:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Required corrective start tip:** `575fc32ec8d74d0a984cff5c9522349f95439325`  
**Evidence (preserved):** `docs/audits/ui-batch1-independent-verification-findings-remediation/`  
**Corrective evidence (new):** `docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/`  
**Authoritative FAIL source:** Windows independent-verification report (Linux QUALIFIED addendum does not override)

**Status:** Ready for renewed owner inspection only — **not** independent verification, **not** merge readiness, **not** production approval.  
Prior tip `1ca3ba1` / checkpoint `575fc32` claimed matrixFail 0 while a truncated global console bag retained 500/JSON/403 samples — that claim is **withdrawn**. See §0.

---

## 0. Evidence contradiction correction (mandatory)

### 0.1 Why the prior “338 / fail 0” claim was invalid

The validator at the `575fc32` checkpoint:

1. Recorded console/page errors in a **global** bag without route/final URL  
2. Excluded console/page errors from each matrix row’s fail decision  
3. Excluded hydration and horizontal overflow from fail  
4. Saved only `consoleBag.slice(0, 100)`, discarding the rest  
5. Therefore could not support `matrixEntries: 338` / `matrixFail: 0` while `consoleErrorCount: 200`

The truncated bag still contained Dark@1440 samples: **500**, **Unexpected end of JSON input**, **403** — with **no route or resource attribution**.

### 0.2 SHA traceability

| Ref | SHA |
| --- | --- |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Failed candidate | `ee9731e38e7d20d6d825e6c243503f4aea9564c3` |
| IV evidence tip | `51fbfa980b9c834184a384ddcf956340397bf205` |
| Start tip for this correction | `575fc32ec8d74d0a984cff5c9522349f95439325` |
| Prior incorrect “tested app” claim | `1ca3ba10…` |
| Last `src/` commit before corrective validator | `24ce5f3edbfdfc04292342d749bb0809a3bf0b9d` |
| **Application source SHA actually tested (final)** | **`e6e2f90ea42f39ddab1d5ce39c1e306f214a1742`** |

**Explicit:** GitHub/`git log` shows `1ca3ba1` → `575fc32` changed **only** the remediation report and summary tip pins — **no application `src/` changes**. Commits after the final tested application SHA that are evidence/docs-only will be listed at the tip after the evidence push.

### 0.3 Corrected validator fail conditions

A route **fails** for any of:

- navigation HTTP status ≥ 400  
- unallowlisted resource response ≥ 400  
- application page error  
- application console error  
- hydration mismatch (including minified React `#418`)  
- horizontal page overflow  
- typography / contrast / Dark-mode hard-gate failure  
- unallowlisted `requestfailed`

**Narrow allowlist only (still recorded separately):** Next.js webpack HMR WebSocket/status, DevTools install hints, same-origin RSC/prefetch `net::ERR_ABORTED` from Playwright route churn.  
**Never auto-allowlisted:** 403, 500, JSON parse errors, unknown resource failures.

Per-route bags record: route, final URL, appearance, viewport, nav status, page/console errors, failed requests, HTTP ≥400, hydration, overflow, visual hard-gates, timestamps. Full raw events are preserved (no truncation).

### 0.4 Corrective run totals

**A. Production-mode matrix** (`corrective-validation/prod-matrix-v3/`, `next start` :3480 after `next build --webpack`):

| Metric | Value |
| --- | --- |
| matrixEntries | **338** |
| matrixFail | **0** |
| matrixPass | **338** |
| hydrationTotal | **0** |
| pageErrorCount | **0** |
| consoleAppErrorCount | **0** |
| overflowFailCount | **0** |
| http500 / http403 / jsonParse | **0 / 0 / 0** |
| appearanceAllPass | **true** |
| allowlisted env events | 6446 (`environmental-nav-abort` only) |
| unresolved application events | **0** |

**B. Clean `next dev --webpack` (:3482)** — three clean-server starts + three warm first requests on `/staffpay?section=adjustments` (`clean-server-starts-v2/`): all navigation **200**; **zero** 500/403/JSON; eventCount **0**.

**C. Dark 1440 focused sequence + overview/adjustments + warm first-hits** (`dev-focused-v2/` on :3481): **20 / fail 0**; hydration **0**; unresolved app events **0**; HMR/DevTools noise allowlisted separately (46 events).

### 0.5 Adjudication of the prior 500 / JSON / 403

| Symptom | Exact route/resource in corrective runs | Finding |
| --- | --- | --- |
| HTTP 500 | *none reproduced* with attribution | Not present in production matrix or clean/warm probes |
| `Unexpected end of JSON input` | *none reproduced* as stable app failure | Transient `next-dev` compile on owner :3000 once logged `SyntaxError: Unexpected end of JSON input` + `GET /dashboard 500`, then recovered to 200 |
| HTTP 403 | *none reproduced* with attribution | Not observed in corrective production or clean/warm evidence |

**Explanation of the previous ~200 console errors:** global unattributed bag mixing HMR/devtools noise, aborted navigations, and unclassified messages; fail predicate ignored them; only 100 were saved. That count cannot be mapped to routes.

**Residual risk:** `next-dev --webpack` can emit transient 500/JSON during concurrent compile/HMR. Production-mode matrix is authoritative for runtime fail adjudication; owner inspection should treat single-shot next-dev 500/JSON during compile as environmental unless it repeats with a stable route+resource.

### 0.6 Application code changed in this correction?

**Yes** (within UI remediation / hydration scope): theme `html` `suppressHydrationWarning`; M04/M05/M07 selective-hydration gates; pure bootstrap snapshots; M05 offline `useSyncExternalStore` server snapshot.  
After app changes: production rebuild OK; focused UI regressions exit 0; published-timesheet hash vector **exact: true** (`corrective-validation/hash-vector-result.json`).

### 0.7 Owner server

Port **3000** preserved for owner inspection (PID recorded at handoff). Temporary validators used **3480** (production) and **3481/3482** (dev). No PR, no merge, no main update, no UI Batch 2.

---

## 1. Scope and constraints

Remediation addressed only the independent FAIL findings. Protected domain behaviour was not changed:

- No payroll calculation / period lifecycle / PPA domain changes
- No OD-A2, published-timesheet hash, workforce identity, or M06–M07 contract changes
- No permissions/auth, migrations, M08, payments, wave-control, or UI Batch 2
- No PR, merge, or main update
- Historical IV evidence was not modified

---

## 2. Corrections mapped to independent findings

### 2.1 CRITICAL — M07 hydration mismatch

**Cause (initial):** Conditional `{bootstrap ? <p role="status"> : null}` inserted a client-only node before `div.mt-4`, mismatching SSR.  
**Cause (corrective):** Selective hydration allowed parent `useEffect` bootstrap detail (`v9Ran=…`) to update before the status node finished hydrating; theme init also mutated `<html>` attributes.

**Fix:** Always render deterministic `<p role="status" data-m07-bootstrap-status="1">` with placeholder through hydration; detail text only after `useHydrated()`. Root `<html suppressHydrationWarning>` for theme-init attributes. No content hiding to silence warnings on the status node itself.

**Result:** Zero hydration signatures on M07 (and matrix-wide) in corrective production `prod-matrix-v3` and `dev-focused-v2`.

### 2.2 Typography (≥13px nav/actions/helpers/forms/tables)

**Fix:**

- `.v32-nav-toggle`, `.v33-fav-star`, section captions/badges, nav helpers → `--type-control` (13px)
- Tables → `--type-table` (14px) via shared `Table` / ranked comparison headers
- `.text-xs` remapped to `--type-control` for helpers/forms/tables
- `--type-meta` retained at 12px for true metadata only

**Result:** Matrix hard-gate kinds `typography-control-below-13` / fav size failures cleared; post-fix probe shows nav toggles 13px, table headers 14px (`summary.json` issueTotals empty after refresh).

### 2.3 Favourite / interactive contrast

**Fix:** Sidebar champagne forced to high-contrast `#d6be97` on navy (≈7.03:1 on active `#163456`); fav hover/focus/disabled states defined; focus outline retained.

**Result:** No `fav-contrast` issues in remediation matrix; computed fav colour `rgb(214, 190, 151)` at 13px.

### 2.4 Dark-mode surface leaks

**Fix:** Replaced near-white hard-codes (`#fbfcfd`, `#fbfdff`, `#eff6ff`, `#f1f5f9` hovers) on Settings / Action Inbox / related chips with semantic `--soft` / status tokens. Theme variables keyed from `html.theme-dark` (and `body.theme-dark` alias).

**Result:** Zero `light-surface-leak` adjudications in dark matrix/sweep; dark Settings/Action Inbox probe shows no near-white surfaces.

### 2.5 Appearance persistence

**Cause:** React reconciled `<body className>` and wiped imperative `body.theme-dark`.

**Fix:** Blocking `THEME_INIT_SCRIPT` on `<html>`; `applyAppearance` toggles `html.theme-dark` + `data-appearance` + `color-scheme`; body kept in sync for residual selectors/tests; CSS expanded to `html.theme-dark`.

**Result (reload via storage only):**

| Check | Result |
| --- | --- |
| Clean storage → Light | PASS |
| Dark reload | PASS |
| Light reload | PASS |
| System + OS light | PASS |
| System + OS dark | PASS |
| System OS change to light | PASS |

Evidence: `appearance-persistence.json`.

### 2.6 M07 Adjustments first-hit 500

**Investigation:** Warm-server and clean-server restarts retested (HTTP + Playwright).

| Probe | Results |
| --- | --- |
| Remediation matrix first-hit ×3 | all **200**, no `Unexpected end of JSON input` |
| Clean server restart HTTP ×3 | all **200** |
| Clean server Playwright ×3 | all **200**, empty jsonParseErrors |

**Adjudication:** Not reproduced on this tip. Residual risk remains for intermittent warm-compile races observed historically on the failed candidate; not classified as harmless without that reproduction. Evidence: `cold-adjustments.json`, `cold-adjustments-clean-server.json`, `cold-adjustments-playwright-clean.json`.

---

## 3. Browser validation matrix

Script: `scripts/ui-batch1-iv-findings-remediation-validate.mjs`  
Port: `3470` (temporary; owner handoff uses 3000)

| Metric | Result |
| --- | --- |
| Matrix entries | 338 |
| Matrix fail | **0** |
| Issue totals (hard kinds) | **{}** after typography follow-up refresh |
| Hydration signatures | **0** |
| M07 section hydration fails | **0** |
| Appearance all pass | **true** |
| First-hit all 200 | **true** |
| Screenshots | `screenshots/` (light/dark 1440 & 390; persistence) |

Widths: 1440 / 1280 / 1024 / 768 / 430 / 390  
Appearances: Light, Dark, System (at 1440/390) + section sweep light/dark @1440

---

## 4. Regression totals (sequential, exact IV commands)

| Suite | Exit | Tests | Pass | Fail |
| --- | --- | --- | --- | --- |
| Colour readability + IV findings guards | 0 | 10 | 10 | 0 |
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
| PPA-1 security (hook) | 0 | 6 | 6 | 0 |
| PPA-1 core | 0 | 10 | 10 | 0 |
| PPA-1 atomicity | 0 | 9 | 9 | 0 |
| M04 | 0 | 16 | 16 | 0 |
| M05 | 0 | 117 | 117 | 0 |
| M06 | 0 | 91 | 91 | 0 |
| M07 | 0 | 252 | 252 | 0 |
| Workforce | 0 | 53 | 53 | 0 |
| Architecture CP27 set | 0 | 19 | 19 | 0 |
| M07 authz | 0 | 13 | 13 | 0 |
| Batch 5 | 0 | 49 | 49 | 0 |
| Batch 6 | 0 | 43 | 43 | 0 |

Logs: `docs/audits/ui-batch1-independent-verification-findings-remediation/logs/`  
Totals: `test-totals.json`

Wave4/wave5 performance JSON mutations from M05/M06 runs were restored (not committed).

---

## 5. TypeScript / lint exact baseline comparison

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **21** errors — exact path/message match to IV baseline (`tsc-lint-comparison.json`) |
| `npm run lint` | **2** errors / **24** warnings — exact baseline debt |

---

## 6. Builds

| Command | Exit |
| --- | --- |
| `npx next build --webpack` | **0** |
| `npm run build` | **0** |

---

## 7. Hash gate

Expected/actual exact:

`7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`

`calc` = `pure` = `node` = expected (`hash-vector-result.json`). **PASS**

---

## 8. Commits / push

Branch tip (pre-docs commit may append): see git log on  
`cursor/ui-batch1-owner-colour-readability-verification-fixes`

Recommended series applied:

1. `fix(ui): remediate independent readability findings`
2. `test(ui): verify typography theme and hydration corrections`
3. Follow-up UI typography / bootstrap lint-safe derivation commits
4. `docs(audits): record UI Batch 1 verification fixes` (this report + evidence)

Pushed to origin on the fix branch only. **No PR. No merge. No main update. No force-push. UI Batch 2 not started.**

---

## 9. Localhost handoff

After validation, temporary port `3470` is stopped and the final tip is served on **port 3000** for owner inspection (see agent stop-checkpoint for PID/command/URLs).

---

## 10. Explicit non-claims

This remediation agent reports **readiness for renewed owner inspection only**.

It does **not** claim:

- Independent verification PASS
- Merge readiness
- Controlled integration authorisation
- Production approval
- UI Batch 2 start

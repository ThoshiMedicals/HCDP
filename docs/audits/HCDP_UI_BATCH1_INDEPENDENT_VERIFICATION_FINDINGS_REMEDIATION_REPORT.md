# HCDP — UI Batch 1 Independent-Verification Findings Remediation Report

**Lane:** Application remediation after independent verification FAIL  
**Branch:** `cursor/ui-batch1-owner-colour-readability-verification-fixes`  
**Remediation tip:** `1ca3ba10fa73a3fdedf23dc55373e6f5e79d46f7`  
**Base (failed candidate tip):** `ee9731e38e7d20d6d825e6c243503f4aea9564c3`  
**Independent-verification evidence tip (read-only):** `51fbfa980b9c834184a384ddcf956340397bf205`  
**origin/main confirmed:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Evidence:** `docs/audits/ui-batch1-independent-verification-findings-remediation/`  
**Authoritative FAIL source:** Windows independent-verification report (Linux QUALIFIED addendum does not override)

**Status:** Ready for renewed owner inspection only — **not** independent verification, **not** merge readiness, **not** production approval.

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

**Cause:** Conditional `{bootstrap ? <p role="status"> : null}` inserted a client-only node before `div.mt-4`, mismatching SSR.

**Fix:** Always render deterministic `<p role="status" data-m07-bootstrap-status="1">` with placeholder `Storage bootstrap · schema v9`; detail text is derived during render when bootstrap exists. No `suppressHydrationWarning`. Content is not hidden to silence warnings.

**Result:** Zero hydration signatures on M07 Overview/Adjustments and all completed M07 sections in remediation browser runs (`hydration.json`, focused smoke).

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

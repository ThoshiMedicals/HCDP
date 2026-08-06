# Owner-readiness evidence gate — STATUS

**Date:** 6 Aug 2026  
**Branch tip inspected:** `53727cd11ea5d70f96d4201334f15d5674cd74ee`  
**Claimed frozen app SHA:** `05f07119ec2883b7ec7a2da6bbe3b5162257c2ec`  
**origin/main:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**PR / merge:** none  

## Verdict

**FAIL — NOT CLOSED**

Programme Wave P0 / prototype-parity programme-reset is **blocked** until OWNER-READINESS EVIDENCE CONTRADICTION CORRECTION 2 is complete.

Do **not** treat `53727cd` / `05f0711` as an approved parity-programme baseline.

## Committed contradictions (exact)

### 1. Accounting equation broken

From `agent-regression/prod-matrix-final-05f0711/summary.json`:

| Field | Value |
| --- | --- |
| `controlsWithDefectFlags` | **448** |
| `justifiedExemptions` | **4** |
| `unresolvedDefects` | **0** |

Required: `controlsWithDefectFlags = justifiedExemptions + unresolvedDefects`  
Observed: `448 ≠ 4 + 0` → **444 unaccounted** defect-flagged controls.

### 2. Global centre-outside-viewport suppression

`scripts/ui-batch1-iv-findings-remediation-validate.mjs` still contains:

```js
if (!h.centreInViewport) return false;
```

inside the `elementClipFails` filter. This is a global centre-point bypass: defect-flagged controls whose centre is outside the viewport are neither counted as `justifiedExemptions` nor as `unresolvedDefects`.

### 3. Row-level matrix evidence replaced by placeholders

Committed `prod-matrix-final-05f0711/per-route-matrix.json` and `browser-validation-report.json` are stubs:

```json
{"omittedFromGit":true,"reason":"exceeds GitHub 50MB soft limit", ...}
```

Required row-level evidence is therefore **missing** in the committed tip.

### 4. Visual QA zero-open vs stillBadCount 81

`agent-visual-qa/final-05f0711/FINDINGS.json` claims `vqaFindingsOpen: 0` / verdict PASS.  
`agent-visual-qa/final-05f0711/geometry/prior-defect-reprobe.json` records **`stillBadCount: 81`**.

A DOM/geometry reprobe with 81 still-bad rows cannot be reconciled with a zero-open Visual QA close-out.

### 5. `shaMatch: false`

`agent-regression/revalidation-05f0711/run-meta.json`:

| Field | Value |
| --- | --- |
| `frozenExpected` | `05f07119ec2883b7ec7a2da6bbe3b5162257c2ec` |
| `inputSha` | `f8d27ea177b31697c664068436fdb7c329b4e61a` |
| `shaMatch` | **false** |

Final agents were not recorded against an identical frozen application SHA tip.

### 6. Work-Step proof quality insufficient

Work-Step claims PASS for Clear Filter and other workflows, but committed step evidence does not meet the required before/after domain-state proof standard (stale/unrelated messages and filter-clear value proof remain unresolved pending Correction 2 re-run).

### 7. Prior 110 defects

Ledger marks 110 CLOSED without committed individual after-geometry + linked screenshot proof package meeting Correction 2 requirements.

## What is NOT claimed

- Ready for renewed owner inspection
- Independent verification
- Merge / PR / production approval
- Prototype-parity programme baseline acceptance
- Programme Wave P1 authorisation

## Correction 2 branch

Work continues on:

`cursor/ui-batch1-owner-readiness-evidence-correction-2-f709`

created from `53727cd11ea5d70f96d4201334f15d5674cd74ee`.

# Owner-readiness evidence gate — STATUS (Correction 2)

**Date:** 6 Aug 2026  
**Branch:** `cursor/ui-batch1-owner-readiness-evidence-correction-2-f709`  
**Frozen application SHA:** `31b31115fa1bab99e2cea47c8526a4c8011e2fe2`  
**Evidence tip:** `a735a45708035bc9d2e95b28097cfd35729c8859`  
**QA base:** http://127.0.0.1:3502  
**Owner-visible:** http://127.0.0.1:3000 (same freeze)  
**PR / merge:** none  

## Verdict

**CONTRADICTIONS CORRECTED — residual OPEN Visual QA findings remain**

The specific Correction-2 evidence contradictions at `53727cd` / `05f0711` are closed with committed proof at `31b3111`.  
Visual QA is **not** a zero-open PASS: `stillBadCount=9` with **9 OPEN** short-height dashboard findings (`VQA-C2-SHORT-*`).

Programme Wave P0 / prototype-parity programme-reset remains **blocked** until the owner identifies an accepted baseline after reviewing this package.

## Contradiction closure table

| Contradiction | Status | Evidence |
| --- | --- | --- |
| Accounting identity broken (448 ≠ 4+0) | **CLOSED** | `controlsWithDefectFlags=4`, `justifiedExemptions=4`, `unresolvedDefects=0`, `accountingEquationHolds=true` in `agent-regression/prod-matrix-final-31b3111/summary.json` |
| Global `centreInViewport` hard-fail bypass | **CLOSED** | Removed from `scripts/ui-batch1-iv-findings-remediation-validate.mjs`; unit tests assert absence |
| Row-level matrix placeholders (`omittedFromGit`) | **CLOSED** | Committed `element-clip-ledger.json` (4 rows) + compact `per-route-matrix.json` (no placeholder) |
| VQA zero-open vs stillBadCount 81 | **CLOSED as contradiction** | Now `stillBadCount=9` with **9 OPEN** findings — not a buried PASS |
| `shaMatch: false` | **CLOSED** | Regression + VQA + WQA + prior-110 all `shaMatch: true` at `31b3111` |
| Work-Step Clear Filter false PASS | **CLOSED** | `WF-M06-CLEAR-FILTER` observes empty history filter value after clear via `m06-history-filter` |
| Prior 110 without individual after-geometry | **CLOSED** | `prior-110-after/`: 110 cleared, 0 stillBad, 0 missing; per-id geometry JSON + screenshots |

## Residual OPEN items (not buried)

Short-height dashboard X-overflow under Visual QA (`VQA-C2-SHORT-*`). Matrix at standard heights remains clean. Owner adjudication / follow-on containment required before claiming Visual QA PASS.

## Agent results at freeze

| Agent | Result |
| --- | --- |
| Prod matrix | matrixFail=0; accountingEquationHolds=true |
| Visual QA | stillBadCount=9; openFindings=9; verdict=FAIL |
| Prior-110 after-geometry | cleared=110; shaMatch=true |
| Work-Step QA | overall=PASS; clear-filter empty value proven; openFindings=0 |

## What is NOT claimed

- Ready for renewed owner inspection as a full Visual QA PASS
- Independent verification / merge / production approval
- Prototype-parity programme baseline acceptance
- Programme Wave P1 authorisation
- PPA implementation

## Next owner decision

Identify whether `31b31115fa1bab99e2cea47c8526a4c8011e2fe2` (with residual OPEN `VQA-C2-SHORT-*`) is the accepted programme baseline, or require short-height dashboard containment before baseline freeze.

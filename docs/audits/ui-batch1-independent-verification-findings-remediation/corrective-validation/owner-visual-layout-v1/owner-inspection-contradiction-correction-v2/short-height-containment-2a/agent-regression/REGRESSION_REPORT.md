# REGRESSION_REPORT — Correction 2A @ b1152d3

**Frozen SHA:** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**shaMatch:** `true`  
**Overall verdict:** **PASS**  
**Order:** production matrix FIRST on :3513, then sequential suites 01–28  
**Worktree:** `/tmp/hcdp-fix/c2a-reg-3513`  
**Evidence:** `/tmp/hcdp-fix/ui-batch1-vf-fixes/docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/owner-inspection-contradiction-correction-v2/agent-regression/revalidation-b1152d3`  
**Matrix out:** `/tmp/hcdp-fix/ui-batch1-vf-fixes/docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/owner-inspection-contradiction-correction-v2/agent-regression/prod-matrix-final-b1152d3`

## Freeze verification
| Check | Result |
| --- | --- |
| HEAD == freeze | `True` (`b1152d36d3f47c15277f85b3e990f5e1c94bddcb`) |
| `git diff freeze -- src scripts` bytes | `0` |
| Dashboard `http://127.0.0.1:3513/dashboard` | HTTP 200 (pre-matrix) |
| CSS asset | HTTP 200 (pre-matrix) |

## Production matrix (338)
| Metric | Value |
| --- | --- |
| matrixPass / matrixFail | 338 / 0 |
| accountingEquationHolds | True |
| controlsWithDefectFlags | 4 |
| justifiedExemptions | 4 |
| unresolvedDefects | 0 |
| identity `flags = exemptions + unresolved` | 4 = 4 + 0 |
| hydrationTotal | 0 |
| overflowFailCount | 0 |
| elementClipFailCount | 0 |
| appearanceAllPass | True |
| nonChromeElementClipHits | 22819 (informational; chrome-scoped adjudication) |

## Suites 01–28
| Suite | Name | Verdict | Exit | Notes |
| --- | --- | --- | --- | --- |
| 01 | colour+iv-findings-unit | PASS | 0 |  |
| 02 | owner-visual-unit | PASS | 0 |  |
| 03 | qualification-chrome | PASS | 0 |  |
| 04 | m07-presentation | PASS | 0 |  |
| 05 | m07-shell | PASS | 0 |  |
| 06 | m06-od-a2 | PASS | 0 |  |
| 07 | browser-crypto | PASS | 0 |  |
| 08 | m06-published | PASS | 0 |  |
| 09 | published-timesheet-registry | PASS | 0 |  |
| 10 | m07-ppa1-ui | PASS | 0 |  |
| 11 | m07-ppa1-integration | PASS | 0 |  |
| 12 | m07-ppa1-hook-security | PASS | 0 |  |
| 13 | m07-ppa1-core | PASS | 0 |  |
| 14 | m07-ppa1-atomicity | PASS | 0 |  |
| 15 | test-m04 | PASS | 0 |  |
| 16 | test-m05 | PASS | 0 | Performance JSON restored after suite. |
| 17 | test-m06 | PASS | 0 | Performance JSON restored after suite. |
| 18 | test-m07 | PASS | 0 |  |
| 19 | test-workforce | PASS | 0 |  |
| 20 | m07-architecture-boundary | PASS | 0 |  |
| 21 | m07-authz | PASS | 0 |  |
| 22 | m07-batch5 | PASS | 0 |  |
| 23 | m07-batch6 | PASS | 0 |  |
| 24 | tsc | PASS | 2 | Accepted TypeScript debt: exactly 21 errors. |
| 25 | lint | PASS | 1 | Accepted lint debt exact: ✖ 26 problems (2 errors, 24 warnings). |
| 26 | next-build-webpack | PASS | 0 |  |
| 27 | npm-build | PASS | 0 | Initial c2a-reg-3513 npm run build (Turbopack) failed on environment: Symlink [project]/node_modules is invalid, it p... |
| 28 | hash-gate | PASS | 0 | Hash vector exact match 7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83 |

## Accepted unchanged debt
| Gate | Expected | Observed | Match |
| --- | --- | --- | --- |
| TypeScript errors | 21 | 21 | yes |
| lint errors / warnings | 2 / 24 | 2 / 24 | yes |
| protected hash | `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` | `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` | exact |

## Builds
| Build | Exit | Notes |
| --- | --- | --- |
| 26 `npx next build --webpack` (reg worktree) | 0 | PASS |
| 27 `npm run build` (reg worktree Turbopack) | 1 | Environmental symlink Turbopack failure |
| 27 `npm run build` (primary ui-batch1-vf-fixes, real node_modules) | 0 | PASS — adjudicates suite 27 |
| 27 `npm run build -- --webpack` (primary) | 0 | PASS |

## Counts
```json
{
  "pass": 29,
  "fail": 0,
  "blocked": 0,
  "notRun": 0,
  "outOfScope": 0
}
```

## Logs
- Suites: `/tmp/c2a-reg-suites.log`
- Matrix: `/tmp/c2a-matrix-final.log`

## Policy adherence
- No application `src/` edits.
- Thresholds not weakened.
- No push/PR.
- Port :3000 not used.
- Matrix sealed before suite rebuilds replaced `.next`.

## Verdict
**PASS** — freeze SHA match; matrix 338/0; accounting identity holds; suites 01–28 pass (suite 27 via primary clean rebuild); accepted debt exact; hash exact; hydration 0.

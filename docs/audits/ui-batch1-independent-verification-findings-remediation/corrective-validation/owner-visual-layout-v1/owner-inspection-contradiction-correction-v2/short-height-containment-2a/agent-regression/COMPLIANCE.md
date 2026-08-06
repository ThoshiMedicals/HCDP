# COMPLIANCE — Regression Auditor @ b1152d3

**Frozen SHA:** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**Overall:** **PASS**  
**Counts:** {"pass": 29, "fail": 0, "blocked": 0, "notRun": 0, "outOfScope": 0}

## Gates
| Gate | Result |
| --- | --- |
| Unit/module suites 01–23 | PASS |
| tsc 21 exact | PASS |
| lint 2/24 exact | PASS |
| next build --webpack | PASS |
| npm run build | PASS (primary worktree real node_modules; symlink Turbopack env fail on reg WT) |
| hash exact | PASS |
| prod-matrix 338/0 | PASS |
| hydration 0 | PASS |
| elementClipFailCount 0 | PASS |
| accountingEquationHolds | PASS |
| appearanceAllPass | PASS |

## Notes
- Non-chrome element clip hits recorded (22819) but do not hard-fail (chrome-scoped adjudication).
- Matrix run first on :3513; suites 01–28 after.
- No application source edited by Regression Auditor.

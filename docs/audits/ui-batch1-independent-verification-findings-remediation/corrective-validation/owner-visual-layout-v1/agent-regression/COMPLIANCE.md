# COMPLIANCE.md — agent-regression

Recorded: `2026-08-04T04:03:45Z`  
Frozen SHA: `d68040688cbf76fb1f8715c27aa06ad6ff72242c`  
Worktree: `/tmp/hcdp-fix/ui-batch1-reg-3493`

## Policy compliance

| Constraint | Status | Evidence |
|---|---|---|
| Worktree at frozen SHA d680406 | PASS | `IMMUTABLE_SHA_CHECK.md` |
| `src/` / `scripts/` unmodified by auditor | PASS | git status clean of src/scripts; evidence-only writes |
| Evidence only under agent-regression/ | PASS | this tree |
| Do not stop :3000 / :3490 / :3491 | PASS | left listening; only :3493 used/stopped |
| Matrix server port 3493 only | PASS | `logs/29-next-start-3493.log` |
| Do not overwrite historical prod-matrix-v3 | PASS | mtime unchanged (`logs/29-prod-matrix-v3-mtime-before.txt` / `...-after.txt`) |
| Accepted tsc debt exact 21 | PASS | `TSC_LINT_COMPARISON.json` |
| Accepted lint debt exact 2/24 | FAIL | observed **4 errors / 24 warnings** |
| Hash vector exact `7c14854a...` | PASS | `hash-vector-result.json` (via `NODE_OPTIONS=--import tsx`) |
| Restore M05/M06 performance JSON mutations | PASS | git checkout after suites |
| No PPA implementation / no src edits | PASS | auditor role |

## Gate results

| Gate | Verdict |
|---|---|
| Unit / module suites 01–23 | PASS (all) |
| tsc debt | PASS (21) |
| lint debt | FAIL (4/24 ≠ 2/24) |
| `npx next build --webpack` | PASS |
| `npm run build` | PASS |
| hash vector | PASS |
| IV prod-matrix @3493 | FAIL (338/338 element-clip) |

## Overall auditor verdict

**FAIL** — lint accepted-debt mismatch and production IV matrix element-clip failures. No hydration/overflow/HTTP 500/403/application console/page errors observed in matrix.

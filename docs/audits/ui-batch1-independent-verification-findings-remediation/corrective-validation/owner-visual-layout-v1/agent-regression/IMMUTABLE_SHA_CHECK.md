# IMMUTABLE_SHA_CHECK — agent-regression

## Freeze target
- Frozen application source SHA: `d68040688cbf76fb1f8715c27aa06ad6ff72242c`
- Freeze recorded (UTC): `2026-08-04T03:42:41Z`

## Worktree under test
- Path: `/tmp/hcdp-fix/ui-batch1-reg-3493`
- `git rev-parse HEAD`: `d68040688cbf76fb1f8715c27aa06ad6ff72242c`
- Short: `d680406`
- Detached HEAD at frozen SHA: **YES** (`d68040688cbf76fb1f8715c27aa06ad6ff72242c` == `d68040688cbf76fb1f8715c27aa06ad6ff72242c`)
- `git merge-base --is-ancestor d68040688cbf76fb1f8715c27aa06ad6ff72242c HEAD`: exit `0` (0 = yes)

## App tree match
- `git diff d68040688cbf76fb1f8715c27aa06ad6ff72242c HEAD -- src scripts` name list (this worktree):
```
(empty — exact match)
```
- Diff line count: `0` (0 expected)

## Primary vf-fixes tip (docs-after allowed)
- Path: `/tmp/hcdp-fix/ui-batch1-vf-fixes`
- Tip SHA: `1353fbaac690d6044544ae4949de99ec89379e48`
- Tip `src`/`scripts` diff vs freeze:
```
(empty — app tree matches freeze; tip may contain docs-only commits)
```

## Evidence root
- `/tmp/hcdp-fix/ui-batch1-vf-fixes/docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/agent-regression`

## Source-edit policy for this run
- Application source under `src/` and `scripts/` must not be modified.
- Evidence writes only under this `agent-regression/` tree.
- Ports 3000 / 3490 / 3491 must not be stopped; regression server uses **3493** only.
- Historical `prod-matrix-v3` evidence must not be overwritten.

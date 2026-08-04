# IMMUTABLE_SHA_CHECK — agent-regression

## Freeze target
- Frozen application source SHA: `d822dfd4a80ed0c98635a0ff8631f9e39fe781f0`
- Freeze recorded (UTC): `2026-08-04T03:25:05Z`

## Worktree under test
- Path: `/tmp/hcdp-fix/ui-batch1-reg-3493`
- `git rev-parse HEAD`: `d822dfd4a80ed0c98635a0ff8631f9e39fe781f0`
- Short: `d822dfd`
- Detached HEAD at frozen SHA: **YES** (`d822dfd4a80ed0c98635a0ff8631f9e39fe781f0` == `d822dfd4a80ed0c98635a0ff8631f9e39fe781f0`)
- `git merge-base --is-ancestor d822dfd HEAD`: exit `0` (0 = yes)

## App tree match
- `git diff d822dfd HEAD -- src scripts` name list (this worktree):
```
(empty — exact match)
```
- Diff line count: `0` (0 expected)

## Primary vf-fixes tip (docs-after allowed)
- Path: `/tmp/hcdp-fix/ui-batch1-vf-fixes`
- Tip SHA: `65fade7767d091dfebf52935dfc7c3d2e66af128`
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

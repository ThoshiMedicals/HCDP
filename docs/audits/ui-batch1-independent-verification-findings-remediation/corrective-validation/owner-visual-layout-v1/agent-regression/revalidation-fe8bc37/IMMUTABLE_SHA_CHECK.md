# IMMUTABLE_SHA_CHECK — revalidation-fe8bc37

## Freeze target
- Frozen application source SHA: `fe8bc37fa370b299a4fbe721209761272f27265f`
- Freeze recorded (UTC): `2026-08-04T04:14:19Z`

## Worktree under test
- Path: `/tmp/hcdp-fix/ui-batch1-reg-3493`
- `git rev-parse HEAD`: `fe8bc37fa370b299a4fbe721209761272f27265f`
- Short: `fe8bc37`
- Detached HEAD at frozen SHA: **YES** (`fe8bc37fa370b299a4fbe721209761272f27265f` == `fe8bc37fa370b299a4fbe721209761272f27265f`)
- `git merge-base --is-ancestor fe8bc37fa370b299a4fbe721209761272f27265f HEAD`: exit `0` (0 = yes)

## App tree match
- `git diff fe8bc37fa370b299a4fbe721209761272f27265f HEAD -- src scripts` name list (this worktree):
```
(empty — exact match)
```
- Diff line count: `0` (0 expected)

## Primary vf-fixes tip (docs-after allowed)
- Path: `/tmp/hcdp-fix/ui-batch1-vf-fixes`
- Tip SHA: `523490c89177f8edfb2ba6c1e609fce629d6dbb2`
- Tip `src`/`scripts` diff vs freeze:
```
(empty — app tree matches freeze; tip may contain docs-only commits)
```

## Evidence root
- `/tmp/hcdp-fix/ui-batch1-vf-fixes/docs/audits/ui-batch1-independent-verification-findings-remediation/corrective-validation/owner-visual-layout-v1/agent-regression/revalidation-fe8bc37`

## Source-edit policy for this run
- Application source under `src/` and `scripts/` must not be modified.
- Evidence writes only under this `revalidation-fe8bc37/` tree.
- Prior `agent-regression/` historical logs retained.
- Ports 3000 / 3490 / 3491 must not be stopped; regression server uses **3493** only.
- Historical `prod-matrix-v3` evidence must not be overwritten.

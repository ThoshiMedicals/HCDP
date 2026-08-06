# IMMUTABLE_SHA_CHECK — revalidation-b1152d3

## Freeze target
- Frozen application source SHA: `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`
- Correction: HCDP Correction 2A (short-height-containment-2a)
- Recorded (UTC): `2026-08-06T03:02:41Z`

## Worktree under test
- Path: `/tmp/hcdp-fix/c2a-reg-3513`
- `git rev-parse HEAD`: `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`
- Detached HEAD at frozen SHA: **YES**
- `shaMatch`: **true**
- `git diff b1152d36d3f47c15277f85b3e990f5e1c94bddcb -- src scripts` byte count: `0` (0 expected)

## Primary evidence tree
- Path: `/tmp/hcdp-fix/ui-batch1-vf-fixes`
- HEAD: `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`
- `src`/`scripts` diff vs freeze bytes: `0`

## Policy
- No `src/` edits by Regression Auditor.
- Evidence only under authorised regression folders.
- Port :3513 only (do not use :3000).

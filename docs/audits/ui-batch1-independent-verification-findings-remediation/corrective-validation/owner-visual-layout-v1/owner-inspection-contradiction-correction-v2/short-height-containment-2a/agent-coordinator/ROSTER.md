# Correction 2A — Agent roster

| Role | Agent ID / identity | Worktree | Port | Authority |
| --- | --- | --- | --- | --- |
| Coordinator | Parent cloud agent | `/tmp/hcdp-fix/ui-batch1-vf-fixes` (branch tip) | n/a (owns :3000 handoff) | Refs, scope, freeze, evidence consolidation |
| Implementation | `b28ba5f3-bbb9-4422-ad25-5a58e46e9ef6` (+ prior impl for bfb31f9) | `/tmp/hcdp-fix/c2a-impl` scratch | n/a | Presentation fix only — **must not approve** |
| Visual QA | `fdf5b993-9838-4853-94de-88039862b36e` | `/tmp/hcdp-fix/c2a-vqa-3511` @ freeze | `127.0.0.1:3511` | Read-only vs app source; closes/reopens findings |
| Work-Step QA | `6db3a5ad-036b-40e1-b7a4-108674315fd7` | `/tmp/hcdp-fix/c2a-wqa-3512` @ freeze | `127.0.0.1:3512` | Read-only vs app source; interaction resulting-state |
| Regression / Evidence Auditor | `e179b362-1d77-4627-adc9-7fbfafecd286` | `/tmp/hcdp-fix/c2a-reg-3513` @ freeze | `127.0.0.1:3513` | Suites 01–28, 338 matrix, lint/tsc/builds/hash |

## Freeze

`b1152d36d3f47c15277f85b3e990f5e1c94bddcb`

## Confirmed separations

- No agent self-approved implementation.
- Final QA agents write evidence only; application source frozen.
- Owner-visible `:3000` reserved for post-gate handoff of the same freeze.

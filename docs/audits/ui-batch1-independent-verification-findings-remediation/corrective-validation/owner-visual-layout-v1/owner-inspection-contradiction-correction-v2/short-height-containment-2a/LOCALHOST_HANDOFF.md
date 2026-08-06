# Localhost handoff — Correction 2A

**Frozen application SHA:** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**Owner URL:** `http://127.0.0.1:3000`  
**Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes`

Temporary QA servers on `:3511` / `:3512` / `:3513` are stopped after gate consolidation. Owner-visible server serves this exact freeze.

## Health checks (required)

- `GET /dashboard` → 200  
- `GET /action-inbox` → 200  
- `GET /settings` → 200  
- CSS under `/_next/static/...` → 200  
- Short-height smoke: dashboard at 1024×600 / 768×500 / 1536×900 remains horizontally contained  

## Process

See `LOCALHOST_PROCESS.json` written at handoff time.

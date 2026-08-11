# P1 Baseline Gate Evidence (Planning Run)

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`  
**Purpose:** Capture starting-point evidence for this readiness pack. Not an implementation acceptance.

## Pins confirmed

| Item | Value |
| --- | --- |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\HCDP\.worktrees\p0c4` |
| Starting branch | `cursor/baseline-quality-remediation` |
| Starting HEAD | `9142ec30b3b2efea1e959ad85ce1406562cd5faa` |
| Remote match | `origin/cursor/baseline-quality-remediation` = same SHA |
| Planning branch created | `cursor/p1-scope-readiness-plan` @ same SHA |
| P0 programme-reset tip | `b0c4c4d20de1cce7adac5d691c506122e30610a2` (local = origin) |
| M25 parked | `cursor/m25-future-planning` @ `1bb9d2958f8ab6966865f73ff2ab1fbb9beba1b1` |
| `.env.local` | Present on disk; ignored by `.gitignore` (`.env*`); not tracked |

## Quality gates

| Gate | Result |
| --- | --- |
| Working tree before docs | Clean |
| `npx tsc --noEmit` | Pass (exit 0) |
| `npm run lint` | 0 errors, **24** warnings (react-hooks/exhaustive-deps in M05/M06) |
| `npm test` | **252** pass / 0 fail |
| `npm run build` | Pass (Next.js 16.2.10) |
| `node scripts/prototype-parity/validate-registers.mjs` | `ok: true`, `failures: []` |

## Test side-effect observed and restored

`npm test` modified:

- `docs/audits/wave3-m11-performance-evidence.json`
- `docs/audits/wave4-m05-performance-evidence.json`
- `docs/audits/wave5-m06-performance-evidence.json`
- `docs/audits/wave5-m06-workflow-evidence.json`

Restored with `git checkout --` on those paths. Working tree clean afterward (before planning-doc writes). Tracked as P1-GAP-076.

## Register validator snapshot (key fields)

| Field | Value |
| --- | --- |
| tip | `9142ec30b3b2efea1e959ad85ce1406562cd5faa` |
| totalRows | 1982 |
| openOwnerDecisions | 0 |
| canonicalScreens | 194 |
| productionControls | 28 |
| placeholderShellModules | 16 (M08–M10, M12–M24) |
| failures | `[]` |

## Explicit non-actions this run

- No application behaviour implementation  
- No commit / push / merge / PR  
- No M25 / PPA / payment / DB / dependency / secrets work  
- No historical P0 evidence alteration (only restore of test-rewritten JSON to HEAD)  

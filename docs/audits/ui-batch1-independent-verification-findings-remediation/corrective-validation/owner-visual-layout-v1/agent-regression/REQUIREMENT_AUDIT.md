# REQUIREMENT_AUDIT.md — agent-regression

Recorded: `2026-08-04T04:03:45Z`  
Frozen application source SHA: `d68040688cbf76fb1f8715c27aa06ad6ff72242c`

## Preflight

| Requirement | Result |
|---|---|
| Create/reuse worktree at d680406 | PASS — `/tmp/hcdp-fix/ui-batch1-reg-3493` |
| node_modules available | PASS |
| Write IMMUTABLE_SHA_CHECK.md proving SHA + src/scripts match | PASS |

## Sequential suite audit

| # | Command (truncated) | Verdict | Exit | Log | Notes |
|---|---|---|---|---|---|
| 01 | `npx tsx --test src/components/workspaces/tests/ui-batch1-owner-colour-readability.test.ts …` | PASS | 0 | logs/01-colour+iv-findings-unit.log |  |
| 02 | `npx tsx --test src/components/workspaces/tests/ui-batch1-owner-visual-remediation.test.ts` | PASS | 0 | logs/02-owner-visual-unit.log |  |
| 03 | `npx tsx --test src/components/workspaces/tests/ui-batch1-qualification-chrome.test.ts` | PASS | 0 | logs/03-qualification-chrome.log |  |
| 04 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts` | PASS | 0 | logs/04-m07-presentation.log |  |
| 05 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-shell.test.ts` | PASS | 0 | logs/05-m07-shell.log |  |
| 06 | `npx tsx --test src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts` | PASS | 0 | logs/06-m06-od-a2.log |  |
| 07 | `npx tsx --test src/platform/workforce/tests/browser-crypto-remediation.test.ts` | PASS | 0 | logs/07-browser-crypto.log |  |
| 08 | `npx tsx --test src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts` | PASS | 0 | logs/08-m06-published.log |  |
| 09 | `npx tsx --test src/platform/workforce/tests/published-timesheet-registry.test.ts` | PASS | 0 | logs/09-published-timesheet-registry.log |  |
| 10 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-ui.test.tsx` | PASS | 0 | logs/10-m07-ppa1-ui.log |  |
| 11 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-integration.test.tsx` | PASS | 0 | logs/11-m07-ppa1-integration.log |  |
| 12 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-hook-security.test.ts` | PASS | 0 | logs/12-m07-ppa1-hook-security.log |  |
| 13 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-core.test.ts` | PASS | 0 | logs/13-m07-ppa1-core.log |  |
| 14 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ppa1-atomicity.test.ts` | PASS | 0 | logs/14-m07-ppa1-atomicity.log |  |
| 15 | `npm run test:m04` | PASS | 0 | logs/15-test-m04.log |  |
| 16 | `npm run test:m05` | PASS | 0 | logs/16-test-m05.log | Performance JSON restored after suite. |
| 17 | `npm run test:m06` | PASS | 0 | logs/17-test-m06.log | Performance JSON restored after suite. |
| 18 | `npm run test:m07` | PASS | 0 | logs/18-test-m07.log |  |
| 19 | `npm run test:workforce` | PASS | 0 | logs/19-test-workforce.log |  |
| 20 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-architecture-cp27.test.ts src/modules/m…` | PASS | 0 | logs/20-m07-architecture-boundary.log |  |
| 21 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-authz.test.ts` | PASS | 0 | logs/21-m07-authz.log |  |
| 22 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-batch5-cp51-56.test.ts src/modules/m07-…` | PASS | 0 | logs/22-m07-batch5.log |  |
| 23 | `npx tsx --test src/modules/m07-staff-pay/tests/m07-batch6-cp61-66.test.ts src/modules/m07-…` | PASS | 0 | logs/23-m07-batch6.log |  |
| 24 | `npx tsc --noEmit` | PASS | 2 | logs/24-tsc.log | Accepted unchanged TypeScript debt: exactly 21 errors (baseline match). |
| 25 | `npm run lint` | FAIL | 1 | logs/25-lint.log | Observed 4 errors / 24 warnings; accepted debt is 2/24. Tooling drift vs historical baseline; src matches freeze. |
| 26 | `npx next build --webpack` | PASS | 0 | logs/26-next-build-webpack.log |  |
| 27 | `npm run build` | PASS | 0 | logs/27-npm-build.log |  |
| 28 | `node scripts/ui-batch1-iv-findings-remediation-hash-gate.mjs` | PASS | 0 | logs/28-hash-gate.log | Literal `node scripts/...hash-gate.mjs` fails (.ts import). Exact vector confirmed with NODE_OPTIONS=--import tsx. Hash  |
| 29 | `HCDP_BASE_URL=http://127.0.0.1:3493 HCDP_MODE=production node agent-regression/run-matrix.…` | FAIL | 2 | logs/29-prod-matrix.log | All 338 matrix entries fail on element-clip only. hydration=0 overflow=0 http500=0 http403=0 app console/page errors=0.  |

## Special gates

### tsc (24)
- Count: **21**
- Accepted: 21
- Verdict: **PASS**

### lint (25)
- Count: **4 errors / 24 warnings**
- Accepted: 2 errors / 24 warnings
- Verdict: **FAIL**
- Error files: src/modules/m04-staff-doctors/context.tsx, src/modules/m05-roster/context.tsx, src/modules/m07-staff-pay/context.tsx, src/modules/m07-staff-pay/sections/AdjustmentsSection.tsx

### hash (28)
- Expected: `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`
- Literal `node` command: FAIL (`.ts` import / ERR_UNKNOWN_FILE_EXTENSION)
- `NODE_OPTIONS=--import tsx node …`: PASS exact
- Verdict: **PASS** (vector exact; loader required)

### builds (26–27)
- `npx next build --webpack`: PASS
- `npm run build`: PASS

### IV matrix (29)
- Base: `http://127.0.0.1:3493`
- Mode: `production`
- Entries: 338 — pass 0 / fail 338
- elementClipFailCount: 3668
- hydrationTotal: 0
- overflowFailCount: 0
- http500/http403: []/[]
- app console/page errors: 0/0
- appearanceAllPass: True
- Verdict: **FAIL**
- OUT: `agent-regression/prod-matrix` (wrapper; repo script unmodified; prod-matrix-v3 untouched)

## FAIL / NOT RUN inventory

| Item | Status |
|---|---|
| 25 lint debt exactness | FAIL |
| 29 prod-matrix | FAIL |
| NOT RUN | none |
| BLOCKED | none |

## Overall

**FAIL** (lint debt drift + matrix element-clip). Suites 01–23, tsc debt, builds, and hash vector pass.

# New-PC runtime readiness — accepted P0 baseline verification

**Date:** 11 Aug 2026  
**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\HCDP\.worktrees\p0c4`  
**Branch:** `cursor/prototype-parity-programme-reset`  
**HEAD:** `b0c4c4d20de1cce7adac5d691c506122e30610a2`  
**M25:** parked on `cursor/m25-future-planning` — **not** mixed into this baseline  

## Verdict

**Verified development baseline with qualifications** — runtime is ready for the next non-M25 implementation phase. Automated tests and production build pass; `tsc --noEmit` and `eslint` fail on pre-existing issues already present at the accepted P0 tip. **This is not production approval.**

## Environment

| Item | Result |
| --- | --- |
| Node | v22.17.0 |
| npm | 10.9.2 |
| Install | `npm ci` exit **0** (368 packages) |
| `.env.local` | Created locally (gitignored). **Demo mode only** — no old-PC production secrets restored. Contents are not recorded here. Replace before production-auth/email work. |
| Localhost | `http://localhost:3000` (bind `localhost`, not `127.0.0.1`) |

## Command results

| Check | Exit | Notes |
| --- | ---: | --- |
| `npx tsc --noEmit` | **2** | Failed due to identified **pre-existing test-file** TypeScript errors (M06/M07/workforce). App `next build` TypeScript step still passes. |
| `npm run lint` | **1** | Failed due to **two M07 `set-state-in-effect` errors** plus **24 warnings** (mostly refreshKey deps in M05/M06). |
| `npm test` | **0** | **252 / 252** pass |
| `npm run build` | **0** | Next.js 16.2.10 production build OK; uses `.env.local` |

## Browser smoke

| Route | Result |
| --- | --- |
| `/` → `/dashboard` | PASS — Command Centre shell, nav, demo act-as, clinic scope |
| `/action-inbox` | PASS — Action Inbox loads demonstration actions (badge 6 open) |

Observed: Next.js hydration warning overlay can appear on Action Inbox (Sidebar); does not block demo navigation. Demo banner confirms browser-local demonstration mode.

## Explicit non-claims

- Not production approval  
- Not P1 / PPA / M08–M24 / M25 implementation authorisation  
- Not a claim that `tsc`/`eslint` are clean at this tip  
- Secrets from old PC were **not** restored (none present on this machine)

## Next phase (without M25)

1. Keep working from this tip / branch for the next owner-named implementation batch.  
2. Optionally remediate baseline `tsc`/`eslint` qualifications under a dedicated defect/CR if owner prioritises green tooling gates.  
3. Supply secure old-PC `.env.local` values when leaving demo auth.  
4. Review M25 owner decisions later on `cursor/m25-future-planning` before any M25 implementation batch.

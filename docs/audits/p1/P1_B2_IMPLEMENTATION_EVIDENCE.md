# P1-B2 — Shell truthfulness and demo honesty — implementation evidence

**Batch:** P1-B2  
**Status:** Implemented — **owner acceptance pending** (not closed)  
**Implementation branch:** `cursor/p1-b2-shell-truthfulness`  
**Source branch:** `cursor/p1-b1-shared-shell-foundation`  
**Starting source SHA:** `300b250f6970ef23254df8630a5fd0145000129e`  
**Authorised decisions implemented:** OWN-P1-004 (A+D), OWN-P1-005 (A), OWN-P1-008 (A), OWN-P1-017 (A)  

**Not claimed:** owner acceptance; batch closed; production approval; WCAG/security compliance; `OWN-P1-016` resolved; P1-B3–P1-B8 authorised; PR; merge; deploy; automatic progression

## Gaps addressed (implemented, acceptance pending)

| Gap | Portion | Disposition |
| --- | --- | --- |
| P1-GAP-005 | Full P1-B2 honesty | Topbar Export / Enterprise MFA disabled with truthful accessible explanation; New Entry preserved as local create-drawer |
| P1-GAP-006 | Accepted difference | Topbar multi-clinic warns to Command Centre; no shell-wide multi-select |
| P1-GAP-007 | Preserve | Dashboard non-operational labels retained; no toast-as-success |
| P1-GAP-018 | Labelling / identity only | M03 local demo actors gated + labelled; no durable IAM |
| P1-GAP-030 | Honesty only | Topbar Export non-op; CC/Org export labelled local demo — no export-processing backend |
| P1-GAP-032 | Demo/reset governance | QA/demo mode gate; destructive reset confirmation |
| P1-GAP-071 | Honesty | Seed/demo content labelled; demo tools inside QA boundary |
| P1-GAP-073 | Honesty | Online/offline gated + labelled browser simulation |

## Requirements → code

| Requirement | Primary code |
| --- | --- |
| OWN-P1-004 | `src/components/shell/Topbar.tsx` |
| OWN-P1-005 | `src/components/shell/Topbar.tsx` (multi guidance); CC ControlBar clinic multi retained |
| OWN-P1-008 | `src/platform/context/qa-demo-mode.tsx`; Sidebar toggle; gated Topbar Online, QaDemoMenu, M03/M02 demo tools |
| OWN-P1-017 | Sidebar / CC greeting / CC user menu / Action Inbox signed-in / Org overview via `identity.displayName` |
| GAP-007 | `DashboardShellControls.tsx` (preserved) |
| GAP-030 | Topbar disabled Export; CC `Export (local demo)`; Org reports honesty copy |
| GAP-071/073 | Seed banners; Online (demo) gated |

## Requirements → tests

| Area | Tests |
| --- | --- |
| Contracts | `src/components/shell/tests/p1-b2-shell-truthfulness.test.ts` (`npm run test:p1-b2`) — 17 tests |
| Visual/interaction | `scripts/p1-b2-shell-truthfulness-harness.mjs` → `docs/audits/p1/b2-shell-truthfulness/` |
| Regression | `npm run test:p1-b1`; full `npm test`; `npx tsc --noEmit`; `npm run lint`; `npm run build`; register validators |

## Files changed (implementation set)

- `src/platform/storage/storage.ts` — `PLATFORM_KEYS.qaDemoMode`
- `src/platform/context/qa-demo-mode.tsx` — **new** QA/demo gate
- `src/app/(portal)/layout.tsx` — wrap `QaDemoModeProvider`
- `src/components/shell/Topbar.tsx` — disable Export/MFA; gate Online; multi-clinic guidance; New Entry preserved
- `src/components/shell/Sidebar.tsx` — QA toggle + status; current-user test id
- `src/components/workspaces/command-centre/CommandCentre.tsx` — identity greeting/actors; QA menu gating
- `src/components/workspaces/command-centre/ControlBar.tsx` — current-user menu; Export (local demo)
- `src/components/workspaces/command-centre/QaDemoMenu.tsx` — title honesty
- `src/components/workspaces/OrganisationWorkspace.tsx` — gate demo tools; confirm reset
- `src/components/workspaces/organisation/OverviewSection.tsx` — identity-consistent subtitle
- `src/components/workspaces/organisation/ReportsSection.tsx` — export honesty copy
- `src/components/workspaces/action-inbox/ActionInboxApp.tsx` — signed-in identity; gate demo tools; confirm reset
- `src/components/shell/tests/p1-b2-shell-truthfulness.test.ts` — **new**
- `scripts/p1-b2-shell-truthfulness-harness.mjs` — **new**
- `package.json` — `test:p1-b2` script
- Docs/registers + `docs/audits/p1/b2-shell-truthfulness/*` evidence

## Screenshot paths

Under `docs/audits/p1/b2-shell-truthfulness/shots/`:

- `01-ordinary-mode-dashboard-1440-light.png`
- `02-export-disabled-focus-1440-light.png`
- `03-mfa-disabled-focus-1440-light.png`
- `04-new-entry-available-1440-light.png`
- `05-multi-clinic-guidance-toast-1440-light.png`
- `06-identity-sidebar-and-cc-greeting-1440-light.png`
- `07-act-as-propagated-1440-light.png` (Sarah → David King)
- `08-qa-demo-mode-active-1440-light.png`
- `09-online-offline-demo-labelled-1440-light.png`
- `10-cc-qa-demo-menu-and-clinic-controls-1440-light.png`
- `11-org-local-demo-override-labelled-1440-light.png`
- `12-org-reset-confirmation-path-1440-light.png`
- `13-inbox-signed-in-identity-1440-light.png`
- `14-mobile-ordinary-390-light.png`
- `15-mobile-qa-demo-mode-390-light.png`
- `16-qa-demo-mode-1440-dark.png`
- `17-responsive-ordinary-{1280,1024,768,430}-light.png`

Harness summary: `docs/audits/p1/b2-shell-truthfulness/harness-smoke-summary.md`

## Known limitations

- Local validation only — **no GitHub CI** on this branch (same qualification pattern as P1-B1).
- QA/demo mode is a demonstration facility (localStorage / `?qaDemo=1`), **not** a production security boundary; forced off when `AUTH_ENFORCEMENT=production`.
- Command Centre / Organisation local export remain **browser-local demo** only — no reporting backend.
- Pixel-diff / full WCAG not claimed.
- Intermittent Next.js `JSON.parse` 500s observed under hot reload during harness; harness retries; not introduced as a product feature.

## Deferred / remains open

- `OWN-P1-016` remains **open**
- P1-B3 through P1-B8 remain **unauthorised**
- Export-processing services, MFA/IdP, SQL/migrations, PPA, payment, M25, patient/clinical SoR — out of scope
- Owner acceptance of P1-B2 tip — **pending**

## Scope preservation confirmations

- P1-B1 remains accepted and closed with qualifications at `fdb2beb…`
- 83 gaps / 8 batches accounted for
- 24 runtime modules remain; M25 unimplemented
- No SQL/schema/migration; no lockfile dependency change beyond script entry; no secrets; no CI/CD; no PR/merge/deploy
- Best Practice (or equivalent) remains clinical system of record

## GitHub CI status

**None claimed** — branch has no GitHub Actions check run for this implementation. Local validators/tests/build/harness only.

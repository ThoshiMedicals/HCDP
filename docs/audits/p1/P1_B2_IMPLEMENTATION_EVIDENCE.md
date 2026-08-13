# P1-B2 — Shell truthfulness and demo honesty — implementation evidence

**Batch:** P1-B2  
**Status:** Accessibility and acceptance evidence **remediated** — **owner acceptance remains pending** (not closed)  
**Implementation branch:** `cursor/p1-b2-shell-truthfulness`  
**Source branch:** `cursor/p1-b1-shared-shell-foundation`  
**Starting source SHA:** `300b250f6970ef23254df8630a5fd0145000129e`  
**Prior published implementation tip:** `d425adaad2ac8f29de893ca0dd996e147ad6febe` (`feat(p1-b2): implement shell truthfulness and demo honesty`)  
**Remediation tip:** *(this commit)* `fix(p1-b2): remediate truthfulness acceptance evidence`  
**Authorised decisions implemented:** OWN-P1-004 (A+D), OWN-P1-005 (A), OWN-P1-008 (A), OWN-P1-017 (A)  

**Not claimed:** owner acceptance; batch closed; production approval; WCAG/security compliance; `OWN-P1-016` resolved; P1-B3–P1-B8 authorised; PR; merge; deploy; automatic progression

## Remediation (2026-08-13) — defects found and corrections

| Defect | Correction |
| --- | --- |
| Export / Enterprise MFA used native `disabled` (not keyboard-focusable; `title`/labels not reliably discoverable) | Focusable `aria-disabled="true"` controls with `aria-describedby`, activation prevented (no success toast), visible **Unavailable** label, and focus-visible fixed explanation (avoids topbar overflow clipping) |
| Multi-clinic harness **DOM-fabricated** a Topbar `<option value="multiple">` | Removed fabrication. Evidence uses Command Centre **Select Clinics → Saved group: North corridor** → Topbar truthful `Multiple Clinics · N (set in Command Centre)`; Topbar re-select warns (not success) |
| System appearance evidence treated ordinary Light/Dark OS emulation as System-mode proof | Separate captures: app Light; app Dark; app `system` + OS Light; app `system` + OS Dark — assert stored preference `system` and resolved `theme-dark` |
| Working tree polluted by wave performance/workflow JSON rewritten by unrelated test suites | Confirmed mechanical test mutation only; recovery patch saved outside repo; restored four files to `HEAD` before remediation coding |
| Production-enforcement visual vs concurrent `next dev` lock | Objective unit test (`AUTH_ENFORCEMENT=production`); exclusive-process browser shot via `scripts/p1-b2-production-enforcement-shot.mjs` → `18-production-enforcement-qa-refused-1440-light.png` |

### Worktree restoration

- Recovery patch (outside repo): `%TEMP%\hcdp-p1-b2-remediation-20260813-125108\wave-evidence-test-mutation.patch`
- Restored only:
  - `docs/audits/wave3-m11-performance-evidence.json`
  - `docs/audits/wave4-m05-performance-evidence.json`
  - `docs/audits/wave5-m06-performance-evidence.json`
  - `docs/audits/wave5-m06-workflow-evidence.json`
- Tree was clean before remediation edits.

### Superseded evidence

Prior harness shot `05-multi-clinic-guidance-toast-1440-light.png` (DOM-fabricated option) is archived under:

`docs/audits/p1/b2-shell-truthfulness/historical-superseded-dom-fabricated/`

**Do not** treat it as product evidence. Live replacements:

- `05-cc-multi-clinic-topbar-truthful-1440-light.png`
- `05b-topbar-multi-clinic-guidance-warn-1440-light.png`

## Gaps addressed (implemented, acceptance pending)

| Gap | Portion | Disposition |
| --- | --- | --- |
| P1-GAP-005 | Full P1-B2 honesty | Topbar Export / Enterprise MFA **keyboard-explainable** unavailable controls; New Entry preserved as local create-drawer |
| P1-GAP-006 | Accepted difference | Topbar multi-clinic warns to Command Centre; no shell-wide multi-select; CC remains the product multi-clinic path |
| P1-GAP-007 | Preserve | Dashboard non-operational labels retained; no toast-as-success |
| P1-GAP-018 | Labelling / identity only | M03 local demo actors gated + labelled; no durable IAM |
| P1-GAP-030 | Honesty only | Topbar Export non-op; CC/Org export labelled local demo — no export-processing backend |
| P1-GAP-032 | Demo/reset governance | QA/demo mode gate; destructive reset confirmation |
| P1-GAP-071 | Honesty | Seed/demo content labelled; demo tools inside QA boundary |
| P1-GAP-073 | Honesty | Online/offline gated + labelled browser simulation |

## Requirements → code

| Requirement | Primary code |
| --- | --- |
| OWN-P1-004 | `src/components/shell/Topbar.tsx` (`aria-disabled` + focus explanation) |
| OWN-P1-005 | `src/components/shell/Topbar.tsx` (multi guidance); CC ControlBar clinic multi retained |
| OWN-P1-008 | `src/platform/context/qa-demo-mode.tsx`; Sidebar toggle; gated Topbar Online, QaDemoMenu, M03/M02 demo tools |
| OWN-P1-017 | Sidebar / CC greeting / CC user menu / Action Inbox signed-in / Org overview via `identity.displayName` |

## Requirements → tests

| Area | Tests |
| --- | --- |
| Contracts | `src/components/shell/tests/p1-b2-shell-truthfulness.test.ts` (`npm run test:p1-b2`) |
| Visual/interaction | `scripts/p1-b2-shell-truthfulness-harness.mjs` (+ exclusive `scripts/p1-b2-production-enforcement-shot.mjs`) → `docs/audits/p1/b2-shell-truthfulness/` |
| Regression | `npm run test:p1-b1`; full `npm test`; `npx tsc --noEmit`; `npm run lint`; `npm run build`; register validators |

## Screenshot paths (live)

Under `docs/audits/p1/b2-shell-truthfulness/shots/`:

- `01-ordinary-mode-dashboard-1440-light.png`
- `02-export-unavailable-keyboard-focus-1440-light.png` / `02b-export-activation-no-op-1440-light.png`
- `03-mfa-unavailable-keyboard-focus-1440-light.png` / `03b-mfa-activation-no-op-1440-light.png`
- `04-new-entry-available-1440-light.png`
- `05-cc-multi-clinic-topbar-truthful-1440-light.png` / `05b-topbar-multi-clinic-guidance-warn-1440-light.png`
- `06-identity-sidebar-and-cc-greeting-1440-light.png`
- `07-act-as-propagated-1440-light.png`
- `08-qa-demo-mode-active-1440-light.png`
- `09-online-offline-demo-labelled-1440-light.png`
- `10-cc-qa-demo-menu-and-clinic-controls-1440-light.png`
- `11-org-local-demo-override-labelled-1440-light.png`
- `12-org-reset-confirmation-path-1440-light.png`
- `13-inbox-signed-in-identity-1440-light.png`
- `14-mobile-ordinary-390-light.png`
- `15-mobile-qa-demo-mode-390-light.png`
- `16a-appearance-app-light-1440.png`
- `16b-appearance-app-dark-1440.png`
- `16c-appearance-system-os-light-1440.png`
- `16d-appearance-system-os-dark-1440.png`
- `17-responsive-ordinary-{1280,1024,768,430}-light.png`
- `18-production-enforcement-qa-refused-1440-light.png`

Harness summary: `docs/audits/p1/b2-shell-truthfulness/harness-smoke-summary.md`  
Production shot report: `docs/audits/p1/b2-shell-truthfulness/production-enforcement-shot-report.json`

## QA/demo gate review (retained)

- Default off; active mode persistently and visibly labelled
- Production enforcement forces off (`AUTH_ENFORCEMENT` / `NEXT_PUBLIC_AUTH_ENFORCEMENT=production`)
- Documented demonstration facility — not a security boundary
- No hidden P1-B1-style runtime test hooks
- Ordinary mode hides demo controls; destructive resets require confirmation
- `?qaDemo=1|0` and localStorage remain local-demo activation only (not secure authorisation)

## Known limitations

- Local validation only — **no GitHub CI** on this branch (same qualification pattern as P1-B1).
- QA/demo mode is a demonstration facility (localStorage / `?qaDemo=1`), **not** a production security boundary.
- Command Centre / Organisation local export remain **browser-local demo** only — no reporting backend.
- Pixel-diff / full WCAG not claimed.
- Intermittent Next.js `JSON.parse` 500s under hot reload during harness; harness retries; not a product feature.
- Concurrent second `next dev` in the same project dir is refused by Next — production browser shot requires an exclusive process.
- Demo Act-as chrome may still render under production-enforcement builds; QA/demo **tools** and activation are forced off (verified by unit test + shot 18).

## Deferred / remains open

- `OWN-P1-016` remains **open**
- P1-B3 through P1-B8 remain **unauthorised**
- Export-processing services, MFA/IdP, SQL/migrations, PPA, payment, M25, patient/clinical SoR — out of scope
- Owner acceptance of P1-B2 tip — **pending**

## Scope preservation confirmations

- P1-B1 remains accepted and closed with qualifications at `fdb2beb…`
- 83 gaps / 8 batches accounted for
- 24 runtime modules remain; M25 unimplemented
- No SQL/schema/migration; no lockfile dependency change; no secrets; no CI/CD; no PR/merge/deploy
- Best Practice (or equivalent) remains clinical system of record

## GitHub CI status

**None claimed** — branch has no GitHub Actions check run for this remediation. Local validators/tests/build/harness only.

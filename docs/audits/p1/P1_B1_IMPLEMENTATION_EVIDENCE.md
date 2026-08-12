# P1-B1 — Shared Decision A shell foundation — implementation evidence

**Batch:** P1-B1  
**Branch:** `cursor/p1-b1-shared-shell-foundation`  
**Approved planning baseline:** `c960a397fbec94edb55cbd377f65a5df4eac4fa9`  
**Starting engineering tip (pre-remediation):** `fa2cc7f401fab95d1320f00897bca4438207191b`  
**Remediation commit:** *this tip after `test(p1-b1): complete shell acceptance evidence`*  
**Owner acceptance:** **pending**  
**Engineering status:** acceptance evidence remediated for independent owner review (local validators/tests/harness green)  
**Not claimed:** owner-accepted, closed, production-approved, B2–B8 start, merge, deploy, GitHub CI pass

## Supersession

Original fa2cc7f harness artefacts are preserved under:

- `docs/audits/p1/b1-shell/archive-fa2cc7f/`
- `docs/audits/p1/archive-fa2cc7f-P1_B1_IMPLEMENTATION_EVIDENCE.md`
- `docs/audits/p1/archive-fa2cc7f-P1_B1_VISUAL_QA_NOTES.md`

Those artefacts are **not** current acceptance evidence. This document and the live `docs/audits/p1/b1-shell/` tree supersede them.

## Authorised gaps addressed

| Gap ID | Outcome |
| --- | --- |
| P1-GAP-002 | Decision A `--dp-*` tokens + shell chrome regions wired |
| P1-GAP-003 | Shared `KpiStrip`, `PrimaryToolbar`, `DetailPanel` primitives added (+ harness probe proof) |
| P1-GAP-004 | Sidebar 240/72 + topbar 48 asserted (visible geometry; mobile off-screen when closed) |
| P1-GAP-010 | Harness smoke **remediated** (`scripts/p1-b1-shell-harness-smoke.mjs`) — start only; not Programme P1 exit |
| P1-GAP-049 | No Executive Blue / Medical Emerald globals; champagne retained as nav cue only |
| P1-GAP-051 | Detail panel width band 320–420 (default 360); drawer width 420 |

## Defects investigated (confirmed) and disposition

| # | Finding | Disposition |
| --- | --- | --- |
| 1 | GitHub Actions reports no workflow runs/checks for the P1-B1 branch tip | **Recorded as assurance limitation** — local results only; CI/CD not created/modified |
| 2 | 390/430 shots captured mobile nav closed only | **Corrected** — open + closed interaction shots + geometry asserts |
| 3 | Action Inbox shots captured loading as completed | **Corrected** — wait-for-ready; loading captured separately |
| 4 | Mobile sidebar width checked via CSS while off-screen | **Corrected** — visible geometry + off-screen when closed |
| 5 | Keyboard focus / Escape / focus restore lacked objective evidence | **Corrected** — mobile menu Escape+restore; drawer Escape; DetailPanel Escape |
| 6 | Seven regions listed but only three required to pass | **Corrected** — fail on missing **required** regions for the screen; optional regions validated when mounted |
| 7 | System appearance not dual-proved for OS light and OS dark | **Corrected** — `system-os-light` + `system-os-dark` |
| 8 | Drawer/detail interaction evidence inadequate | **Corrected** — drawer open/closed + DetailPanel via harness probe |
| 9 | Mobile-nav-open screenshot missing | **Corrected** |
| 10 | Separate visual QA outstanding | **Still true** — owner/separate reviewer inspection required |

### Additional defects found during remediation

| Finding | Disposition |
| --- | --- |
| Mobile menu lacked Escape close, focus move/restore, `aria-expanded`/`aria-controls` | **Corrected** in Sidebar/Topbar (P1-B1 shell a11y) |
| Mobile menu touch target 32×32 | **Corrected** to 44×44 for the menu control |
| Closed Create drawer always present; first `shell-drawer` query was ambiguous | **Corrected** in harness (select visible open drawer) |
| Empty `[]` Action Inbox storage re-seeds by design | **Harness uses filtered empty**; product re-seed behaviour unchanged |
| `writeJson` swallows storage throws — native error hard to force | **Harness force flag** `p1-b1-harness-force-inbox-error` for error-state evidence only |
| Topbar search truncates on 390/430 (intentional `overflow-x-auto`) | **Deferred residual** — intentional scroll container; not page overflow |
| Mobile sidebar group title truncation (“EXECUTIVE COMMA…”) | **Deferred** — later responsive/a11y polish (B4), not blocking shell foundation evidence |
| Demo Act-as identity vs Command Centre greeting (“Sarah” vs “Neil”) | **Deferred to P1-B2** honesty / stub disposition |
| `OWN-P1-016` (localStorage vs SQL) | **Remains open** — not resolved |
| Pixel-diff vs Decision A PNGs | **Remains for separate Visual QA / B8 close of GAP-010** |

## Routes / widths / appearances tested (local harness)

**Routes:** `/dashboard`, `/action-inbox`  

**Widths:** 1440, 1280, 1024, 768, 430, 390  

**Appearances:**

- light  
- dark  
- system with OS preference light (`system-os-light`)  
- system with OS preference dark (`system-os-dark`)  

**Distinct evidence states captured:** desktop/tablet/mobile normal; mobile nav closed/open; active nav; keyboard focus; Escape/focus-return; drawer open/closed; DetailPanel open/closed (probe); intentional loading; filtered empty; forced error; access-denied/restricted where present.

## Objective interaction results (local)

Harness assertions: **425 pass / 0 fail** (see `harness-smoke-report.json`).

Includes: mobile menu open/close (control + Escape + overlay), focus move/restore, drawer dialog attrs + Escape, DetailPanel geometry 320–420 + Escape, reduced-motion context, required-region gates, document overflow vs intentional scrollers, dual System OS preferences.

## Local validation (do not claim as GitHub CI)

| Check | Result |
| --- | --- |
| `node scripts/prototype-parity/validate-registers.mjs` | `failures: []` (local) |
| `npx tsc --noEmit` | pass (local) |
| `npm run lint` | pass — **0 errors**; 24 pre-existing warnings (local) |
| `npm test` | **252 pass / 0 fail** (local) |
| `npm run test:p1-b1` | **16 pass / 0 fail** (local) |
| Harness (`HCDP_BASE_URL=http://localhost:3000`) | **0 failures / 425 assertions / 66 shots** (local) |
| `npm run build` | pass (local) |
| GitHub Actions / commit checks for this branch | **none** (`total_count: 0`) — known assurance limitation |
| Runtime module count | **24** (unchanged); M25 not implemented |

## Evidence artefacts (current)

- `docs/audits/p1/b1-shell/harness-smoke-report.json`  
- `docs/audits/p1/b1-shell/harness-smoke-summary.md`  
- `docs/audits/p1/b1-shell/shots/*.png`  
- `docs/audits/p1/P1_B1_VISUAL_QA_NOTES.md`  
- Archive of fa2cc7f evidence under `docs/audits/p1/b1-shell/archive-fa2cc7f/`

## Explicit non-claims / residuals

- Owner acceptance **pending**; separate reviewer/owner inspection **still required**  
- Not closed; not production approval  
- P1-B2 through P1-B8 **unauthorised**  
- `OWN-P1-016` **open**  
- Not PPA / payment / patient / clinical SoR change / M25  
- Not full Decision A module presentation parity (B5/B6)  
- Not GitHub CI green  
- Best Practice / appropriate clinical system remains SoR for clinical functions  

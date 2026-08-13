# P1-B1 — Shared Decision A shell foundation — implementation evidence

**Batch:** P1-B1  
**Branch:** `cursor/p1-b1-shared-shell-foundation`  
**Approved planning baseline:** `c960a397fbec94edb55cbd377f65a5df4eac4fa9`  
**Accepted implementation tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`  
**Implementation sequence (accepted):**  
1. `fa2cc7f401fab95d1320f00897bca4438207191b` — `feat(p1-b1): implement shared Decision A shell foundation`  
2. `4069ed429072138c81eeca85e14f879d4bfb6cf6` — `test(p1-b1): complete shell acceptance evidence`  
3. `fdb2beb5b0e786e42d358efa9875b6bba52666cd` — `test(p1-b1): remove runtime acceptance hooks`  

**Owner acceptance:** **Owner accepted with qualifications — CLOSED (2026-08-13)**  
**Accepted scope:** P1-B1 shared Decision A shell foundation only  
**Validation basis:** verified local tests, validators, build and visual harness (local only)  
**GitHub CI:** none — branch has no GitHub Actions checks; **no CI pass claimed**  

**Not claimed:** overall Programme P1 complete; production-approved; WCAG/security compliance; pixel parity complete; `OWN-P1-016` resolved; B2–B8 authorised/started; PR; merge; deploy; automatic progression

## Owner decision (2026-08-13)

P1-B1 is **owner accepted with qualifications** at tip `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. Within approved P1-B1 scope the batch is **closed**. This acceptance does **not** authorise P1-B2–P1-B8, a pull request, merge, deployment, production release, or automatic batch progression.

### Required qualifications (remain visible)

| Qualification | Record |
| --- | --- |
| GitHub CI | No Actions/check status exists; local validation only |
| Pixel comparison | Deferred to the controlled later batch |
| Demo identity consistency | Sarah/Neil issue remains P1-B2 *(historical B1 text)* — **satisfied for accepted demo runtime by P1-B2** at `66f3f8d27803f5b8d24043639d21b9069f58e77a` (`P1-B2-OWNER-ACCEPT-2026-08-13`; OWN-P1-017). Production authentication remains outside P1-B2. |
| Data architecture | `OWN-P1-016` remains open |
| Later batches | P1-B2 through P1-B8 remain unauthorised |
| Production | No production approval or readiness claim |
| Delivery | No PR, merge or deployment authorised |
| Progression | No automatic progression to P1-B2 |

## Supersession

Original fa2cc7f harness artefacts are preserved under:

- `docs/audits/p1/b1-shell/archive-fa2cc7f/`
- `docs/audits/p1/archive-fa2cc7f-P1_B1_IMPLEMENTATION_EVIDENCE.md`
- `docs/audits/p1/archive-fa2cc7f-P1_B1_VISUAL_QA_NOTES.md`

Synthetic probe/forced-error screenshots from tip `4069ed4` are preserved under:

- `docs/audits/p1/b1-shell/historical-synthetic-4069ed4/`

Those artefacts are **historical/synthetic** and are **not** ordinary product-runtime evidence. Live `docs/audits/p1/b1-shell/shots/` plus unit contract tests supersede them for current review.

## Runtime acceptance-hook cleanup (at accepted tip)

| Hook / path | Action |
| --- | --- |
| `ShellHarnessProbe` mounted from `src/app/(portal)/layout.tsx` | **Removed** from product layout |
| `src/components/shell/ShellHarnessProbe.tsx` | **Deleted** |
| `sessionStorage p1-b1-harness-probe` | **Removed** (no product activation path) |
| `postMessage` `p1-b1-detail-open` / `p1-b1-detail-close` | **Removed** with probe |
| `sessionStorage p1-b1-harness-force-inbox-error` in `ActionInboxApp` | **Removed** |
| Harness browser dependence on probe / forced error | **Removed**; replaced with unit/contract tests + honest limitation notes |

Ordinary users cannot activate artificial P1-B1 testing content via session/local storage, query params, fragments, `postMessage`, console config, or hidden production controls for these hooks.

**Preserved product improvements:** mobile nav open/closed, Escape, focus move/restore, `aria-expanded` / `aria-controls`, accessible naming, 44×44 menu target, sidebar geometry, appearance modes, shared shell primitives, Decision A tokens/dimensions, drawer a11y.

**Replacement test strategy:**

- `src/components/shell/tests/p1-b1-shell-primitives.test.ts` — DetailPanel / KpiStrip / PrimaryToolbar / Drawer contracts + absence of hooks  
- Browser harness continues for product drawer, mobile nav, loading, filtered empty, keyboard chrome  
- Forced error and DetailPanel probe browser shots classified **historical/synthetic** only  

## Authorised gaps — disposition at acceptance

| Gap ID | Disposition at `fdb2beb…` |
| --- | --- |
| P1-GAP-002 | **Owner accepted / closed** for P1-B1 shell foundation scope |
| P1-GAP-003 | **Owner accepted / closed** for shared primitives (unit + visual region evidence) |
| P1-GAP-004 | **Partial** — B1 dimension evidence owner-accepted; residual responsive/a11y evidence remains P1-B4 |
| P1-GAP-010 | **Partial / not closed** — harness start owner-accepted; full Decision A pixel-difference and Programme P1 exit remain for later controlled batch (P1-B8) |
| P1-GAP-049 | **Owner accepted / closed** for B1 theme-discipline watch (no banned globals) |
| P1-GAP-051 | **Owner accepted / closed** for detail-panel width band |

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
| 8 | Drawer/detail interaction evidence inadequate | **Corrected** — drawer open/closed; DetailPanel via unit contracts after probe removal |
| 9 | Mobile-nav-open screenshot missing | **Corrected** |
| 10 | Separate Decision A pixel-diff outstanding | **Deferred** — controlled later batch; does not block qualified B1 acceptance |

### Additional defects found during remediation

| Finding | Disposition |
| --- | --- |
| Mobile menu lacked Escape close, focus move/restore, `aria-expanded`/`aria-controls` | **Corrected** in Sidebar/Topbar (P1-B1 shell a11y) |
| Mobile menu touch target 32×32 | **Corrected** to 44×44 for the menu control |
| Closed Create drawer always present; first `shell-drawer` query was ambiguous | **Corrected** in harness (select visible open drawer) |
| Empty `[]` Action Inbox storage re-seeds by design | **Harness uses filtered empty**; product re-seed behaviour unchanged |
| `writeJson` swallows storage throws — native error hard to force | **Force hook removed**; error UI covered by source contract test; prior forced-error shot = historical/synthetic only |
| Topbar search truncates on 390/430 (intentional `overflow-x-auto`) | **Deferred residual** — intentional scroll container; not page overflow |
| Mobile sidebar group title truncation (“EXECUTIVE COMMA…”) | **Deferred** — later responsive/a11y polish (B4), not blocking shell foundation acceptance |
| Demo Act-as identity vs Command Centre greeting (“Sarah” vs “Neil”) | **Deferred to P1-B2** honesty / stub disposition — **later satisfied for accepted demo runtime by P1-B2** (`66f3f8d…`, 2026-08-13); historical B1 deferral text preserved |
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

**Distinct evidence states captured:** desktop/tablet/mobile normal; mobile nav closed/open; active nav; keyboard focus; Escape/focus-return; drawer open/closed; DetailPanel (unit contract after probe removal); intentional loading; filtered empty; historical/synthetic forced error (not ordinary runtime); access-denied/restricted where present.

## Objective interaction results (local)

Harness assertions: **421 pass / 0 fail** (see `harness-smoke-report.json`; post hook-cleanup).

Includes: mobile menu open/close (control + Escape + overlay), focus move/restore, drawer dialog attrs + Escape, DetailPanel geometry 320–420 + Escape (unit), reduced-motion context, required-region gates, document overflow vs intentional scrollers, dual System OS preferences.

## Local validation (do not claim as GitHub CI)

| Check | Result |
| --- | --- |
| `node scripts/prototype-parity/validate-registers.mjs` | `failures: []` (local) |
| `npx tsc --noEmit` | pass (local) |
| `npm run lint` | pass — **0 errors**; 24 pre-existing warnings (local) |
| `npm test` | **252 pass / 0 fail** (local) |
| `npm run test:p1-b1` | **21 pass / 0 fail** (local; includes primitives contract suite) |
| Harness (`HCDP_BASE_URL=http://localhost:3000`) | **0 failures / 421 assertions / 62 shots** (local; post hook-cleanup) |
| `npm run build` | pass (local) |
| GitHub Actions / commit checks for this branch | **none** (`total_count: 0`) — known assurance limitation |
| Runtime module count | **24** (unchanged); M25 not implemented |

## Evidence artefacts (current)

- `docs/audits/p1/b1-shell/harness-smoke-report.json`  
- `docs/audits/p1/b1-shell/harness-smoke-summary.md`  
- `docs/audits/p1/b1-shell/shots/*.png`  
- `docs/audits/p1/P1_B1_VISUAL_QA_NOTES.md`  
- Archive of fa2cc7f evidence under `docs/audits/p1/b1-shell/archive-fa2cc7f/`  
- Historical/synthetic probe evidence under `docs/audits/p1/b1-shell/historical-synthetic-4069ed4/`

## Explicit non-claims / residuals after acceptance

- Qualified owner acceptance of **P1-B1 only** — not overall Programme P1 or production acceptance  
- P1-B2 through P1-B8 **remain unauthorised** — no automatic progression  
- `OWN-P1-016` **open**  
- Not PPA / payment / patient / clinical SoR change / M25  
- Not full Decision A module presentation parity (B5/B6)  
- Not GitHub CI green  
- Not full Decision A pixel-difference / Programme P1 exit (GAP-010 remains open)  
- Best Practice / appropriate clinical system remains SoR for clinical functions  

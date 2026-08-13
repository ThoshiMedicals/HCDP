 P1-B4 — Responsive / a11y / appearance hardening — implementation evidence

**Batch:** P1-B4
**Status:** Remediated and published for **final owner review** — **owner acceptance remains pending**
**Stamp:** `P1-B4 — REMEDIATED FOR FINAL OWNER REVIEW (acceptance pending)`
**Implementation branch:** `cursor/p1-b4-responsive-a11y-appearance`
**Feat tip (archived evidence):** `9052a677820ac18b44610b0a35c1bba9c35ad196`
**Authorised source tip:** `c5d919cc2921ab43949b37cad499e29a79cfa6b0` (`cursor/p1-b3-register-hygiene`)
**Authorisation:** Express named-batch owner authorisation for gaps 008 / 009 / 031 / 052 / 074 only
**Remediation date:** 2026-08-14

> Owner acceptance is **not** granted by implementation, remediation or this evidence pack.
> Do **not** claim full WCAG compliance, pixel parity, GitHub CI, production approval, or Programme P1 completion.
> Aurora (`cursor/aurora-design-foundation`) remained **isolated and unintegrated**.
> P1-B5 through P1-B8 remain **`P1 — PLANNED, NOT AUTHORISED`**.
> `OWN-P1-011` and `OWN-P1-016` remain **open**.
> Inventory unchanged: **83** gaps / **8** batches / **24** modules; **M25** unimplemented.
> Gaps 008/009/031/052/074 remain **addressed but not closed** before acceptance.

---

## 1. Scope delivered

| Gap | Topic | Disposition (pre-acceptance) |
| --- | --- | --- |
| P1-GAP-008 | System appearance hydrate settle | **Addressed for owner review** — acceptance pending (not closed) |
| P1-GAP-009 | Keyboard / focus baselines | **Addressed for owner review** — acceptance pending (not closed) |
| P1-GAP-031 | Responsive tablet/mobile residual | **Addressed for owner review** — acceptance pending (not closed) |
| P1-GAP-052 | Prefers-reduced-motion coverage | **Addressed for owner review** — acceptance pending (not closed) |
| P1-GAP-074 | Historical M04/M05/M07 hydration observations | **Re-verified (shared chrome only)** — acceptance pending; domain behaviour unchanged |

P1-B1 / P1-B2 / P1-B3 remain **owner accepted with qualifications and closed**.

---

## 2. Defects found and corrected

1. **False Light pre-hydrate snapshot (GAP-008):** `getAppearanceSnapshot()` returned `"light"` while theme-init and server snapshot default to `"system"`, enabling a material false Light flash/store disagreement. Corrected to return `"system"` until hydrated.
2. **Mobile nav focus containment (GAP-009):** Escape + restore existed; Tab was not trapped; closed mobile sidebar lacked `inert` / non-interactive geometry hardening. Added shared focus-trap, `inert`, `pointer-events-none` when closed on mobile, and `aria-modal` when open.
3. **Drawer / DetailPanel focus trap (GAP-009):** Escape + restore existed without Tab containment; close targets undersized on DetailPanel. Added focus trap (drawer mode), 44px close targets, dialog role in drawer mode.
4. **Module section navigation pattern (GAP-009):** Feat tip used `role=tablist`/`tab` without tabpanels/`aria-controls`. Independent review corrected to **navigation** semantics (`<nav>` + `aria-current="page"`) with arrow/Home/End focus movement retained; compact mobile select unchanged.
5. **Reduced-motion consistency (GAP-052):** Global reduce rule strengthened (`transition-delay`, `scroll-behavior`); shell overlays use `motion-safe:` transitions so reduce collapses motion while state changes remain understandable.
6. **Mobile menu target (GAP-031):** Explicit `min-h/[44px]` / `min-w/[44px]` on the shell mobile menu control.
7. **Cross-tab appearance sync (GAP-008 remediation):** `subscribeAppearanceStorage` listens for `storage` events on `pulse.cc.appearance` and re-hydrates (cleanup on unmount).
8. **Diff hygiene (remediation):** Feat tip converted Sidebar/Topbar/Drawer/storage from parent CRLF → LF (near-whole-file GitHub churn). Remediation restored parent CRLF EOLs so ordinary `numstat` vs `c5d919cc…` matches semantic `-w` counts.

No Aurora redesign, navigation architecture change, domain/PPA/payment/M08 work, dependency/lockfile change, SQL/migration, CI, env/secret, PR, merge, or deploy was performed.

---

## 2b. Remediation evidence (2026-08-14)

| Item | Value |
| --- | --- |
| Archived feat tip evidence | `docs/audits/p1/b4-responsive-a11y-appearance/historical-superseded-9052a677/` |
| Live harness (production `:3021`) | **765** assertions pass / 0 fail / **69** screenshots |
| Assertion groups | appearance 232; responsive 262; keyboard 44; reducedMotion 53; hydration 90; consumer 84 |
| Full suite | 252 pass |
| `test:p1-b4` | 17 pass |
| Full lint | **0 errors**, **24 warnings** (M05/M06 exhaustive-deps `refreshKey`/`bump` — present on authorised parent lineage; not introduced by P1-B4) |
| GitHub Actions workflows | `total_count=0` |
| Check-runs for `9052a677…` | `total_count=0` |
| Commit status contexts for `9052a677…` | `statuses.length=0` (local-only validation) |
| CRLF restore vs parent | Sidebar 11/6; Topbar 1/1; Drawer 12/5; storage 12/1 |
6. **Mobile menu target (GAP-031):** Explicit `min-h/[44px]` / `min-w/[44px]` on the shell mobile menu control.

No Aurora redesign, navigation architecture change, domain/PPA/payment/M08 work, dependency/lockfile change, SQL/migration, CI, env/secret, PR, merge, or deploy was performed.

---

## 3. Files changed (implementation)

| Path | Role |
| --- | --- |
| `src/lib/command-centre/storage.ts` | Pre-hydrate appearance snapshot = System |
| `src/lib/shell/focus-trap.ts` | Shared Tab focus-trap helpers |
| `src/components/shell/Sidebar.tsx` | Mobile focus trap, inert, motion-safe |
| `src/components/shell/Topbar.tsx` | 44px mobile menu target (explicit) |
| `src/components/shell/DetailPanel.tsx` | Focus trap, dialog role, 44px close |
| `src/components/shell/ModuleSectionNav.tsx` | Arrow-key tabs pattern |
| `src/components/ui/Drawer.tsx` | Focus trap, 44px close, motion-safe |
| `src/app/globals.css` | Strengthened `prefers-reduced-motion: reduce` |
| `scripts/p1-b4-responsive-a11y-appearance-harness.mjs` | Browser acceptance harness |
| `src/components/shell/tests/p1-b4-responsive-a11y-appearance.test.ts` | Focused contract tests |
| `package.json` | `test:p1-b4` script only (no lockfile) |
| `docs/audits/p1/P1_B4_IMPLEMENTATION_EVIDENCE.md` | This pack |
| `docs/audits/p1/b4-responsive-a11y-appearance/` | Harness reports + shots |
| Authoritative P1 control docs + wave-control rule | Status stamps |

---

## 4. Evidence location

| Artefact | Path |
| --- | --- |
| Harness report | `docs/audits/p1/b4-responsive-a11y-appearance/harness-report.json` |
| Screenshot manifest | `docs/audits/p1/b4-responsive-a11y-appearance/screenshot-manifest.json` |
| Hydration re-verification | `docs/audits/p1/b4-responsive-a11y-appearance/hydration-reverification.json` |
| Shots | `docs/audits/p1/b4-responsive-a11y-appearance/shots/` |

**Authoritative runtime:** production (`next build` + `next start`) labelled `HCDP_EVIDENCE_RUNTIME=production`.
Development-server evidence, if any, is labelled separately and is supplementary only.

---

## 5. Matrix exercised

| Dimension | Cases |
| --- | --- |
| Width | 1440, 1280, 1024, 768, 430, 390 |
| Appearance | Light, Dark, System+OS Light, System+OS Dark |
| Navigation | Desktop sidebar geometry; mobile open/closed |
| Interaction | Keyboard Tab, Enter activation, Escape, focus trap/restore, ARIA expanded/controls |
| Motion | Normal and `prefers-reduced-motion: reduce` |
| Surfaces | Dashboard, Action Inbox, B2 demo honesty, B3 M11/M07 History/Adjustments, M04/M05/M07 hydrate routes |
| Runtime | Production authoritative |

Exact assertion and screenshot totals are recorded in `harness-report.json` after the harness run (filled below once validated).

### Totals (post-validation)

| Metric | Value |
| --- | --- |
| Unit `test:p1-b4` | **16 pass / 0 fail** |
| Full suite (`npm test`) | **252 pass / 0 fail** |
| Harness assertions | **695 pass / 0 fail** |
| Harness screenshots | **65** |
| Authoritative runtime | Production on `localhost:3020` |
| `tsc --noEmit` | **0** errors |
| Register validator failures | `[]` |
| Lint (P1-B4 changed files) | **0** errors after DetailPanel refs fix; repo-wide still has pre-existing warnings (**25**) and historically may report exit 1 for warnings-only elsewhere — P1-B4 files clean |
| `git diff --check` | **0** after hygiene |
| GitHub Actions | `gh` CLI not available in environment — **do not claim CI** |

---

## 6. Hydration findings (GAP-074)

Re-verified shared appearance/chrome on `/staff`, `/roster`, `/staffpay` (plus primary P1 surfaces) under Light / System+OS Dark with production server. Domain behaviour of M04/M05/M07 was **not** changed. Residuals unrelated to shared P1-B4 infrastructure, if any, remain documented in the harness hydration log without scope expansion.

---

## 7. Limitations (explicit)

- Owner acceptance **pending**
- Not full WCAG 2.2 AA certification
- Not pixel-parity vs Decision A PNGs
- Not GitHub Actions CI proof (local validation)
- Not production approval / payment / PPA / M08
- Aurora not integrated
- Gaps 008/009/031/052/074 **not closed** until owner acceptance
- `OWN-P1-011` / `OWN-P1-016` remain open
- P1-B5–P1-B8 remain unauthorised
- 83 / 8 / 24 / M25 unimplemented unchanged

---

## 8. Final claim (implementation publish)

P1-B4 responsive, accessibility, reduced-motion and System-appearance hardening implemented, validated and published for owner review — owner acceptance remains pending, Aurora remained isolated, and no later batch, merge or deployment was authorised or performed.

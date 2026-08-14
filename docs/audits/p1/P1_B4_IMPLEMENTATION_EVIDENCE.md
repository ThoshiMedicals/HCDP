# P1-B4 — Responsive / a11y / appearance hardening — implementation evidence

**Batch:** P1-B4
**Status:** **Owner accepted with qualifications — CLOSED (2026-08-14)**
**Stamp:** `P1-B4-OWNER-ACCEPT-2026-08-14`
**Implementation branch:** `cursor/p1-b4-responsive-a11y-appearance`
**Accepted implementation tip:** `c58f2843d47b6fa875cd155d166c1f7c916d5250`
**Feat tip (archived evidence):** `9052a677820ac18b44610b0a35c1bba9c35ad196`
**Authorised source tip:** `c5d919cc2921ab43949b37cad499e29a79cfa6b0` (`cursor/p1-b3-register-hygiene`)
**Authorisation:** Express named-batch owner authorisation for gaps 008 / 009 / 031 / 052 / 074 only
**Owner acceptance:** **Owner accepted with qualifications — CLOSED (2026-08-14)** (`P1-B4-OWNER-ACCEPT-2026-08-14`)
**Accepted scope:** P1-B4 responsive, accessibility, reduced-motion and System-appearance hardening only
**Validation basis:** verified local tests, validators, production build, Chromium/Playwright production-runtime harness (local only)
**GitHub CI:** none — workflows=0; check-runs=0; status-contexts=0; **no CI pass claimed**

> Acceptance closes **P1-B4 only**. It does **not** authorise P1-B5–P1-B8, PR, merge, deployment, production, Aurora integration, or automatic progression.
> Do **not** claim full WCAG compliance, pixel parity, GitHub CI, production approval, or Programme P1 completion.
> Aurora (`cursor/aurora-design-foundation`) remained **isolated and unintegrated**.
> `OWN-P1-011` and `OWN-P1-016` remain **open**.
> Inventory unchanged: **83** gaps / **8** batches / **24** modules; **M25** unimplemented.

## Owner decision (2026-08-14)

P1-B4 is **owner accepted with qualifications** at tip `c58f2843d47b6fa875cd155d166c1f7c916d5250`. Within approved P1-B4 scope the batch is **closed**. This acceptance does **not** authorise P1-B5–P1-B8, a pull request, merge, deployment, production release, Aurora integration, or automatic batch progression.

### Gap disposition at acceptance

| Gap | Disposition |
| --- | --- |
| P1-GAP-008 | **Closed** — P1 System appearance/hydration scope |
| P1-GAP-009 | **Closed** — P1 shared-shell keyboard/focus scope |
| P1-GAP-031 | **Partial** — tested P1 shell/shared surfaces closed; module-specific responsive residual retained |
| P1-GAP-052 | **Partial** — shared P1 reduced-motion closed; broader platform-wide residual retained |
| P1-GAP-074 | **Closed** — historical observation re-verified; no M04/M05/M07 domain acceptance implied |

### Binding qualifications

| # | Qualification |
| ---: | --- |
| 1 | Validation is local-only |
| 2 | GitHub workflow count is zero |
| 3 | GitHub check-run count is zero |
| 4 | GitHub status-context count is zero |
| 5 | No GitHub CI pass is claimed |
| 6 | No full WCAG compliance is claimed |
| 7 | No pixel-parity claim is made |
| 8 | Evidence is based primarily on Chromium/Playwright production-runtime testing |
| 9 | Cross-browser and assistive-technology certification remains outside this acceptance |
| 10 | Full platform-wide 200%/400% zoom certification is not claimed |
| 11 | The 24 lint warnings remain verified parent-lineage warnings; no lint errors remain |
| 12 | Intentional CRLF parent-lineage files can produce raw `git diff --check` CR-at-EOL output; semantic inspection found no genuine trailing whitespace defect |
| 13 | P1-GAP-031 retains any module-specific responsive residual outside tested P1 surfaces |
| 14 | P1-GAP-052 retains any broader platform-wide reduced-motion residual |
| 15 | M04/M05/M07 domain behaviour is unchanged |
| 16 | `OWN-P1-011` remains open |
| 17 | `OWN-P1-016` remains open |
| 18 | Aurora remains separately approved as a design foundation but unintegrated |
| 19 | Aurora integration into P1 remains unauthorised |
| 20 | P1-B5 through P1-B8 remain unauthorised |
| 21 | No automatic progression is permitted |
| 22 | No production approval is granted |
| 23 | No PR, merge or deployment is authorised |
| 24 | This is not overall Programme P1 acceptance |

---

## 1. Scope delivered

| Gap | Topic | Disposition (at acceptance) |
| --- | --- | --- |
| P1-GAP-008 | System appearance hydrate settle | **Closed** — P1 System appearance/hydration scope |
| P1-GAP-009 | Keyboard / focus baselines | **Closed** — P1 shared-shell keyboard/focus scope |
| P1-GAP-031 | Responsive tablet/mobile residual | **Partial** — tested P1 surfaces closed; module residual retained |
| P1-GAP-052 | Prefers-reduced-motion coverage | **Partial** — shared P1 closed; platform residual retained |
| P1-GAP-074 | Historical M04/M05/M07 hydration observations | **Closed** — re-verified; domain unchanged |

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
9. **44×44px evidence gate:** Harness threshold corrected from weaker `>= 40` to both dimensions `>= 44`; topbar raised above overlay for operable close; focus ring offset fitted to 48px topbar.

No Aurora redesign, navigation architecture change, domain/PPA/payment/M08 work, dependency/lockfile change, SQL/migration, CI, env/secret, PR, merge, or deploy was performed under this batch.

---

## 2b. Remediation evidence (2026-08-14)

| Item | Value |
| --- | --- |
| Archived feat tip evidence | `docs/audits/p1/b4-responsive-a11y-appearance/historical-superseded-9052a677/` |
| Live harness (production) | Authoritative totals in section 5 / harness-report.json |
| Full suite | 252 pass |
| Full lint | **0 errors**, **24 warnings** (M05/M06 exhaustive-deps — parent lineage) |
| GitHub Actions / check-runs / statuses | `0` (local-only validation) |

---

## 2c. Final gate — 44×44px mobile navigation targets (2026-08-14)

Authorised P1-B4 minimum effective target is **44×44 CSS pixels**. Corrected harness threshold: both width and height `>= 44`. Measured production values at 390 and 430 for open and close controls: **44.00×44.00**.

---

## 3. Files changed (implementation)

See accepted tip history. This acceptance commit is **documentation/control-only**.

---

## 4. Evidence location

| Artefact | Path |
| --- | --- |
| Harness report | `docs/audits/p1/b4-responsive-a11y-appearance/harness-report.json` |
| Screenshot manifest | `docs/audits/p1/b4-responsive-a11y-appearance/screenshot-manifest.json` |
| Hydration re-verification | `docs/audits/p1/b4-responsive-a11y-appearance/hydration-reverification.json` |
| Shots | `docs/audits/p1/b4-responsive-a11y-appearance/shots/` |

**Authoritative runtime:** production (`next build` + `next start`) labelled `HCDP_EVIDENCE_RUNTIME=production`.

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

### Totals (accepted tip)

| Metric | Value |
| --- | --- |
| Unit `test:p1-b4` | **19 pass / 0 fail** |
| Full suite (`npm test`) | **252 pass / 0 fail** |
| Harness assertions | **825 pass / 0 fail** |
| Harness screenshots | **69** |
| `tsc --noEmit` | **0** errors |
| Register validator failures | `[]` |
| Full lint | **0** errors / **24** warnings (parent-lineage) |
| Mobile nav target threshold | both dimensions `>= 44` |

---

## 6. Hydration findings (GAP-074)

Re-verified shared appearance/chrome on `/staff`, `/roster`, `/staffpay` (plus primary P1 surfaces) under Light / System+OS Dark with production server. Domain behaviour of M04/M05/M07 was **not** changed.

---

## 7. Limitations (explicit)

- Not full WCAG 2.2 AA certification
- Not pixel-parity vs Decision A PNGs
- Not GitHub Actions CI proof (local validation)
- Not production approval / payment / PPA / M08
- Aurora not integrated
- P1-GAP-031 / P1-GAP-052 retain stated residuals
- `OWN-P1-011` / `OWN-P1-016` remain open
- P1-B5–P1-B8 remain unauthorised
- 83 / 8 / 24 / M25 unimplemented unchanged
- Not overall Programme P1 acceptance

---

## 8. Final claim (owner acceptance)

P1-B4 qualified owner acceptance recorded and published — P1-B5 through P1-B8 remain unauthorised, Aurora remains isolated, and no merge or deployment was performed.

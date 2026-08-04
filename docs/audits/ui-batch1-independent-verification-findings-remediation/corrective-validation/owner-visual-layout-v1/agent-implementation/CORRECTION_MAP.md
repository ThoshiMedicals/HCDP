# Owner Visual Layout v1 — Correction Map (Phase 2, read-only)

**Agent:** Implementation Agent  
**Phase:** 2 — READ-ONLY mapping (no application source / test / script edits)  
**Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes`  
**Input SHA:** `f837bdd08e1db30e68c63cfb2542e3120bc40d00`  
**App source SHA:** `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742`  
**Findings closed this phase:** **none** (map only)  
**Business-behaviour changes proposed:** **none**

Machine-readable twin: `CORRECTION_MAP.json`  
Hydration analysis: `HYDRATION_SUPPRESSION_NOTES.md`

---

## Authorised defect areas (1–7)

### D1 — EmergencyBanner mobile action clipping + desktop grid

| Field | Value |
| ----- | ----- |
| **Component** | `src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx` → `EmergencyBanner` |
| **CSS / tokens** | Tailwind utility classes on banner root / action cluster; `Button` base (`src/components/ui/Button.tsx`: `whitespace-nowrap`, `inline-flex`); surface helpers `.cc-pulse` / `.cc-surface-danger` in `src/styles/tokens.css` (~L250–282); parent overflow `html, body { overflow-x: hidden }` and `@media (max-width:1023px) { .cc-root { overflow-x: hidden } }` in `globals.css` / `tokens.css` |
| **Root-cause hypothesis** | Outer row is `flex flex-wrap items-center`; action cluster is `flex shrink-0 flex-wrap`. `shrink-0` + nowrap buttons lets the action group keep a large min-content width. On narrow viewports the cluster can sit beside content or overflow and be clipped by `overflow-x: hidden` ancestors instead of stacking cleanly. On desktop, side-by-side `flex` (content `flex-1` + actions `shrink-0`) is not a stable two-column grid, so long titles/meta + 5–6 action buttons compete horizontally. |
| **Proposed minimal CSS/layout change** | (1) Outer banner layout → responsive grid, e.g. `grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]` (or `flex-col sm:flex-row` with `w-full` actions). (2) Action cluster → `flex w-full min-w-0 flex-wrap gap-1.5 md:w-auto` — **remove `shrink-0`**. (3) Keep all existing `onPrev` / `onNext` / `onAcknowledge` / handlers untouched. No Button API changes unless a className override is required for wrap. |
| **Tests / validators to update** | `scripts/ui-batch1-iv-findings-remediation-validate.mjs` (element-clip probe — see D5); optionally `scripts/ui-batch1-owner-visual-remediation-validate.mjs`; new/extended assertions in `src/components/workspaces/tests/ui-batch1-owner-visual-remediation.test.ts` (class pattern for EmergencyBanner layout). |
| **Protected-scope risk** | **None** for business rules — presentation/layout only; announcement acknowledge/withdraw handlers unchanged. |
| **Phase 3 files expected** | `PriorityAndAnnouncements.tsx`; possibly small token utility if a named class is preferred; tests/validators listed above. |

---

### D2 — Topbar mobile brand overlap

| Field | Value |
| ----- | ----- |
| **Component** | `src/components/shell/Topbar.tsx` |
| **CSS / tokens** | `.brand-compact`, `.brand-dot`, `.brand-compact strong/small`, `.clinic-select-compact` in `src/styles/tokens.css` (~L414–468); ribbon utilities on `.pulse-top-ribbon` / `.ribbon-left` / `.ribbon-right` (Tailwind in component). |
| **Root-cause hypothesis** | Mobile first row packs hamburger (`h-10 w-10`) + `.brand-compact` (`flex: none`, full “Doctors Pulse” + “Operations Portal”) + clinic select (`max-width: 160px`) in `.ribbon-left` (`flex-1 min-w-0`) while `.ribbon-right` keeps Online (and other) controls `shrink-0`. Brand cannot shrink; clinic + brand collide/overlap under ~390–430px. |
| **Proposed minimal CSS/layout change** | Prefer CSS-only: at `max-width: 1023px` (or `639px`), hide `.brand-compact small` and truncate/clamp `.brand-compact strong`, **or** hide `.brand-compact` text block and keep `.brand-dot` only while hamburger is visible. Optionally reduce `.clinic-select-compact` `max-width` on the smallest breakpoint. Do not change clinic/search/online handlers. |
| **Tests / validators to update** | Owner visual presentation test (brand-compact mobile rules); IV inject probe for `.brand-compact` / `.ribbon-left` clipping (D5); colour-readability tests already assert brand colour tokens — preserve those. |
| **Protected-scope risk** | **None** — chrome layout/CSS only; clinic scope and search behaviour unchanged. |
| **Phase 3 files expected** | `src/styles/tokens.css` (primary); possibly minor class tweaks in `Topbar.tsx`; tests/validators. |

---

### D3 — Page H1 truncation

| Field | Value |
| ----- | ----- |
| **Component** | `src/components/shell/PageHeader.tsx` |
| **CSS / tokens** | Tailwind `truncate` on `<h1>`; typography `.hcdp-type-display` / `.page-title h1` in `src/app/globals.css` (~L36–43); wrapper `.page-title.min-w-0`. |
| **Root-cause hypothesis** | Explicit `truncate` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`) on the module title forces single-line ellipsis whenever the header row is width-constrained (bell affordance + padding). This is intentional CSS truncation, not content loss in data. |
| **Proposed minimal CSS/layout change** | Remove `truncate` from the H1; allow wrap via default/`break-words` (keep `min-w-0` on `.page-title`). Do not change module registry titles or subtitle logic. |
| **Tests / validators to update** | Presentation test asserting PageHeader H1 lacks `truncate` and may wrap; element-clip probe should include `header .page-title h1` / `.hcdp-type-display` (D5). |
| **Protected-scope risk** | **None** — typography/layout only. |
| **Phase 3 files expected** | `PageHeader.tsx`; tests; validator selector list. |

---

### D4 — Sidebar footer overlap

| Field | Value |
| ----- | ----- |
| **Component** | `src/components/shell/Sidebar.tsx` (`.sidebar-user` block) |
| **CSS / tokens** | `.sidebar-user`, `.sidebar-user .avatar`, `.user-name`, `.user-role`, `.v27-sidebar-role`, `.v27-sidebar-role select` in `src/styles/tokens.css` (~L794–838); `--sidebar: 288px`. |
| **Root-cause hypothesis** | Footer is a single horizontal `display: flex; align-items: center` row containing avatar + name/role + `.v27-sidebar-role` (`margin-left: auto`, select `max-width: 112px`) plus a multi-line demo note. Inside 288px, name block and act-as select compete; flex centering causes visual overlap/cramping rather than a stacked identity → role control layout. |
| **Proposed minimal CSS/layout change** | Restyle `.sidebar-user` to wrap or CSS grid, e.g. `grid-template-columns: auto minmax(0,1fr)` with `.v27-sidebar-role { grid-column: 1 / -1; margin-left: 0; width: 100% }` and select `max-width: 100%`. Keep identity `select` `onChange` / demo act-as behaviour unchanged. |
| **Tests / validators to update** | `ui-batch1-owner-visual-remediation.test.ts` (sidebar-user layout tokens; existing gradient absence asserts stay); D5 clip probe for `.sidebar-user`, `.v27-sidebar-role`. |
| **Protected-scope risk** | **None** — footer chrome layout only; identity switching logic untouched. |
| **Phase 3 files expected** | `src/styles/tokens.css` (primary); `Sidebar.tsx` only if a structural wrapper class is needed (prefer CSS-only). |

---

### D5 — Element-clipping QA gap

| Field | Value |
| ----- | ----- |
| **Component / scripts** | `scripts/ui-batch1-iv-findings-remediation-validate.mjs` (`pageProbe` overflowHits ~L349–363; `adjudicateFail` ~L528–547); optionally `scripts/ui-batch1-owner-visual-remediation-validate.mjs` |
| **CSS / tokens** | N/A (validator gap) |
| **Root-cause hypothesis** | Probe only queries `button, a, .module-section-nav__tab, .v32-nav-toggle, main, .content` via `scrollWidth > clientWidth`. It misses EmergencyBanner action clusters, `.brand-compact`, PageHeader H1, `.sidebar-user`. Parent `overflow-x: hidden` clipping is not detected via bounding-box vs containing block. Collected `overflowHits` are **not** fed into `adjudicateFail` (only page-level `horizontalOverflow` fails) — so element clipping cannot fail the matrix. prod-matrix-v3 shows 232 overflowHits dominated by broad `.content`/`.main` scrollWidth noise, not the owner chrome defects. |
| **Proposed minimal change** | (1) Expand selectors to include `.cc-pulse.cc-surface-danger button` (or EmergencyBanner action root), `.brand-compact`, `.pulse-top-ribbon`, `header .page-title h1`, `.sidebar-user`, `.v27-sidebar-role`. (2) Add ancestor-clip check: element `getBoundingClientRect()` vs nearest scroll/overflow parent (epsilon). (3) Optionally gate a **narrow** `element-clip` fail for chrome selectors only (avoid failing on noisy `.content` scrollWidth). (4) Keep recording full hits for evidence. |
| **Tests / validators to update** | `ui-batch1-iv-findings-remediation-validate.mjs`; unit/presentation guards in `src/components/workspaces/tests/ui-batch1-iv-findings-remediation.test.ts` and/or `ui-batch1-owner-visual-remediation.test.ts` asserting selector coverage strings; owner-visual validator if used in final QA. |
| **Protected-scope risk** | **None** for product business rules — QA harness only. Risk of flaky matrix if `.content` scrollWidth remains a hard fail — mitigate by chrome-scoped gating. |
| **Phase 3 files expected** | `scripts/ui-batch1-iv-findings-remediation-validate.mjs`; optionally `scripts/ui-batch1-owner-visual-remediation-validate.mjs`; workspace tests above. |

---

### D6 — Abort allowlist precision (`ERR_ABORTED`)

| Field | Value |
| ----- | ----- |
| **Component / scripts** | `scripts/ui-batch1-iv-findings-remediation-validate.mjs` `onRequestFailed` (~L424–448); classification writers (~L914–916, ~L963–965); historical `classification-rationale.json` under corrective-validation matrices |
| **CSS / tokens** | N/A |
| **Root-cause hypothesis** | Current allowlist for `net::ERR_ABORTED` accepts same-origin failures when `url.includes("_rsc=") \|\| url.includes("/_next/") \|\| req.resourceType() === "fetch"`. The bare `resourceType() === "fetch"` branch allowlists **any** aborted same-origin fetch, which is broader than documented RSC/prefetch intent. |
| **Proposed minimal change** | Narrow to same-origin + `net::ERR_ABORTED` + (`_rsc=` query **or** documented Next App Router prefetch signature, e.g. request header `Next-Router-Prefetch` / `Purpose: prefetch` / `Sec-Purpose: prefetch` when exposed by Playwright). **Remove** unrestricted `resourceType() === "fetch"`. Treat bare `/_next/` path match cautiously (prefer RSC/prefetch signals only). Update in-script and matrix `classification-rationale` text to describe the narrowed rule. |
| **Proof preserved (prior 6446)** | `corrective-validation/prod-matrix-v3/summary.json`: `allowlistedEnvironmentalEventCount: 6446`, class `environmental-nav-abort: 6446`. Sample file `allowlisted-environmental-events.json`: **6446/6446** entries are same-origin `127.0.0.1` fetches with `_rsc=` in URL and `net::ERR_ABORTED` — **zero** fetch aborts without `_rsc=`. Narrowing away from arbitrary `fetch` **preserves** that historical proof set. |
| **Tests / validators to update** | Validator script; optionally a small node test asserting the allowlist predicate source contains `_rsc=` and does **not** contain the bare `resourceType() === "fetch"` disjunct; update rationale JSON on next validation run (do not rewrite frozen prod-matrix-v3 evidence blobs except rationale docs if Coordinator permits docs-only clarification pointing at the 6446 proof). |
| **Protected-scope risk** | **None** for business rules. Residual risk: a future non-`_rsc` aborted prefetch could surface as unallowlisted — desired (precision). |
| **Phase 3 files expected** | `scripts/ui-batch1-iv-findings-remediation-validate.mjs`; `src/components/workspaces/tests/ui-batch1-iv-findings-remediation.test.ts` (optional guard); classification-rationale documentation as authorised. |

---

### D7 — Hydration suppression governance

| Field | Value |
| ----- | ----- |
| **Component** | `src/app/layout.tsx` (`suppressHydrationWarning` on `<html>`); `src/components/shell/theme-init-script.ts` |
| **CSS / tokens** | `html.theme-dark` selectors throughout `src/styles/tokens.css` |
| **Root-cause hypothesis** | Theme-init mutates `<html>` `class` / `data-appearance` / `style.colorScheme` before hydrate; SSR emits bare `className="h-full"`. Suppression on root `<html>` is required for that intentional divergence. It must not be copied onto content nodes. |
| **Proposed minimal change** | **No behaviour change.** Document governance (`HYDRATION_SUPPRESSION_NOTES.md`). Optionally tighten tests: suppression only in `layout.tsx`; theme-init targets `documentElement`. Do **not** remove suppression without cookie/SSR theme (out of scope). |
| **Tests / validators to update** | `ui-batch1-iv-findings-remediation.test.ts` (extend single-site assertion). |
| **Protected-scope risk** | **None**. |
| **Phase 3 files expected** | Docs/tests primarily; `layout.tsx` / `theme-init-script.ts` untouched unless comment-only authorisation. |

---

## Aggregated Phase 3 touch list (expected)

Application / styles (layout-only):

1. `src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx`
2. `src/components/shell/Topbar.tsx` *(only if class hooks needed; prefer tokens.css)*
3. `src/components/shell/PageHeader.tsx`
4. `src/components/shell/Sidebar.tsx` *(only if structural wrapper needed; prefer tokens.css)*
5. `src/styles/tokens.css`
6. `src/app/globals.css` *(only if page-title display rules need a wrap helper; prefer not)*

Validators / tests:

7. `scripts/ui-batch1-iv-findings-remediation-validate.mjs`
8. `scripts/ui-batch1-owner-visual-remediation-validate.mjs` *(optional companion)*
9. `src/components/workspaces/tests/ui-batch1-owner-visual-remediation.test.ts`
10. `src/components/workspaces/tests/ui-batch1-iv-findings-remediation.test.ts`

Governance docs (this folder / evidence):

11. `HYDRATION_SUPPRESSION_NOTES.md` (finalise)
12. Classification-rationale updates as Coordinator directs (preserve prod-matrix-v3 6446 proof)

**Explicitly out of Phase 3 scope unless separately authorised:** M04–M07 business logic, payment/export certification claims, PPA, Module 8, handler behaviour changes, new `suppressHydrationWarning` sites.

---

## Confirmation

- Phase 2 produced **documentation only** under `agent-implementation/`.
- **ZERO** application source, test, or script files were modified.
- **No findings closed.**
- Reserved port **3492** was not used; ports 3000/3480/3481 were not competed with.

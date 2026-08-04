# Phase 4 — Regression Auditor remediation (Loop 2)

**Agent:** Implementation Agent  
**Branch:** `cursor/ui-batch1-owner-colour-readability-verification-fixes`  
**Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes`  
**Invalidated prior app SHA (VQA pass, regression fail):** `d68040688cbf76fb1f8715c27aa06ad6ff72242c`  
**New application source SHA:** `fe8bc37fa370b299a4fbe721209761272f27265f`  
**Findings claimed closed:** **none**

---

## Commits

| Commit | SHA |
| ------ | --- |
| `fix(ui): restore m04/m05 lint-safe effect updates` | `f984ef6951843bd2e7aad6154b172ffc3a8503d3` |
| `test(ui): exempt legitimate scroll from element-clip fails` | `fe8bc37fa370b299a4fbe721209761272f27265f` |

**New final application source SHA:** `fe8bc37fa370b299a4fbe721209761272f27265f` (validator + tests). Lint fix: `f984ef6951843bd2e7aad6154b172ffc3a8503d3`.

---

## A) Lint debt restored

| Metric | IV baseline | Before | After |
| ------ | ----------- | ------ | ----- |
| Errors | 2 | 4 | **2** |
| Warnings | 24 | 24 | **24** |

**Summary line:** `✖ 26 problems (2 errors, 24 warnings)`

### Extra errors cleared (no behaviour change)

- `src/modules/m04-staff-doctors/context.tsx` — `queueMicrotask(() => { setCounts…; setPeopleCount… })`
- `src/modules/m05-roster/context.tsx` — `queueMicrotask(() => setRefreshKey…)`

### Baseline-retained (untouched)

- `src/modules/m07-staff-pay/context.tsx` ~L57
- `src/modules/m07-staff-pay/sections/AdjustmentsSection.tsx` ~L386

---

## B) Element-clip validator false positives

File: `scripts/ui-batch1-iv-findings-remediation-validate.mjs`

Still **records** rect / viewport / clip ancestor / occlusion / truncation.

### Precision hard-fail exemptions

1. **`nearestVerticalScrollport`** — only ancestors that **actually scroll** (`scrollHeight > clientHeight`) with `overflow-y: auto|scroll`
2. **Client-box scrollports** — constrained scrollers expose `clientHeight`/`clientWidth` visible box (not content-tall border boxes like unconstrained `.cc-root`)
3. **`legitimateScrollRegionExemption`** — centre/majority outside viewport-clamped scrollport client box
4. **`stickyFooterScrollOcclusion`** — `elementFromPoint` hits `.sidebar-user` over scrollable sidebar nav links
5. **`belowViewportPageScroll`** — vertical-only viewport escape (full or partial below/above fold)
6. **`horizontalScrollEscape`** — overflow-x auto/scroll rows (tables, ribbon-right)
7. **`centreInViewport`** — hard-fail only for meaningfully visible controls (centre on-screen)
8. **Chrome-scoped gates retained** for `.pulse-top-ribbon`, `.brand-compact`, `.seg-mini`, `.cc-pulse.cc-surface-danger`, `.sidebar-user`/`.v27-sidebar-role`, page H1 when on-screen and truly clipped/occluded/truncated

### Smoke (Playwright vs :3490 — not stopped)

`elementClipFails` after fix:

| Route | 390 | 1024 | 1440 |
| ----- | --- | ---- | ---- |
| `/dashboard` | 0 | 0 | 0 |
| `/staffpay?section=overview` | 0 | 0 | 0 |
| `/action-inbox` | 0 | 0 | 0 |

Prior noise: ~3668 `elementClipFailCount` / 338 routes.

### Unit tests

`ui-batch1-iv-findings-remediation.test.ts` asserts exemption strings + hard-fail filter; abort-allowlist precision preserved.

Focused tests: **29 pass / 0 fail**, exit **0**.

---

## Ports

Did **not** stop `:3000` / `:3490` / `:3491`. No PR. Source editing stopped after this note.

# Correction 2A — Implementation Summary

**Branch:** `cursor/ui-batch1-owner-readiness-evidence-correction-2-f709`  
**Starting tip:** `f64fcc5c98cfe1e6dfe53376209fcdc1b13f6e49`  
**Frozen application SHA (candidate):** `b1152d36d3f47c15277f85b3e990f5e1c94bddcb`  
**Scope:** Presentation-only. No business logic / handlers / data / schemas / permissions changes.  
**Self-approval:** Not claimed — Independent Visual QA / Work-Step QA / Regression adjudication required.

## Application commits (source/test only)

| Order | SHA | Message |
| --- | --- | --- |
| 1 | `bfb31f9bee714ee70b61952604961291c83256f1` | `fix(ui): contain dashboard at short viewport heights` |
| 2 | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` | `fix(ui): contain dashboard More menus at short heights` |

## 1. Root cause by finding ID

| Finding IDs | Viewport × appearance | Root cause | Correction |
| --- | --- | --- | --- |
| **VQA-C2-SHORT-001, 003, 005** | 1024×600 × light/dark/system | Executive `grid gap-3` widened by Clinic Ops ranked table (`min-w-[820px]` without wrapper `min-w-0`) + FilterSentenceBar / ExpandableBlock lacking width containment. Clear filters / Audit past viewport X. | `min-w-0 max-w-full` on cards/grids; table wrapper `min-w-0 overflow-x-auto`; FilterSentenceBar wrap/basis containment |
| **VQA-C2-SHORT-002, 004, 006** | 768×500 × light/dark/system | Same, amplified by `sm:grid-cols-2` clinic-ops grid + ranked table min-content (~854px vs ~744px pane). | Earlier clinic-ops collapse `grid-cols-1 lg:grid-cols-2 xl:grid-cols-4` + same containment |
| **VQA-C2-SHORT-007, 008, 009** | 1536×900 × light/dark/system | Clinic Operations multi-column cards + ExpandableBlock audit toggles without parent `min-w-0`; Audit button ~1539.89. | Card/ExpandableBlock `min-w-0 max-w-full overflow-hidden` |

**Residual after commit 1 (bfb31f9):** Clear filters / Audit closed, but Chromium still geometry-laid-out absolute children inside **closed** `<details>` More menus (`left-0 w-[220px]`), so Add Comment reported `overflowsViewportX` at 1024/768 — matching original VQA control lists.

**Commit 2 (b1152d3):** More menus use `group` + `right-0` + `hidden group-open:block` so closed panels do not layout and open panels anchor within the card/viewport.

Shared mechanism: CSS grid/flex min-content expansion and absolute menu geometry — not missing business content. No blanket page `overflow-x-hidden` as the correction strategy.

## 2. Changed files

### Commit 1
- `src/components/workspaces/command-centre/Sections.tsx`
- `src/components/workspaces/command-centre/cc-ui.tsx`
- `src/components/workspaces/command-centre/CommandCentre.tsx`
- `src/components/workspaces/command-centre/PriorityAndAnnouncements.tsx`
- `src/components/workspaces/command-centre/CcStates.tsx`
- `src/components/workspaces/command-centre/InboxProjectionSummary.tsx`
- `src/components/workspaces/command-centre/ActiveActionList.tsx`
- `src/components/workspaces/DashboardWorkspace.tsx`
- `src/components/workspaces/tests/ui-batch1-c2a-short-height-containment.test.ts`

### Commit 2
- `src/components/workspaces/command-centre/Sections.tsx` — More menu containment
- `src/components/workspaces/command-centre/ActiveActionList.tsx` — More menu containment
- `src/components/workspaces/tests/ui-batch1-c2a-short-height-containment.test.ts` — menu guards (15 pass)

## 3. Focused tests

```bash
npx tsx --test src/components/workspaces/tests/ui-batch1-c2a-short-height-containment.test.ts
```

Expected at freeze: 15 pass / 0 fail.

## 4. Risks

- Clinic Ops stacks to one column below `lg` — intentional; content unchanged.
- More menus open leftward (`right-0`) — still fully usable; keyboard via native `<details>`.
- Prior portal `overflow-x-hidden` ancestors remain; fix does not rely on them as the containment strategy.
- Implementation agent must **not** approve; Visual QA must close findings independently.

# Phase 4 — VQA-005 EmergencyBanner mid-width remediation

**Agent:** Implementation Agent  
**Finding:** VQA-005 (Critical) — OPEN for Visual QA to re-verify (not claimed closed)  
**Prior final QA SHA invalidated:** `d822dfd4a80ed0c98635a0ff8631f9e39fe781f0`  
**New application source SHA:** `d68040688cbf76fb1f8715c27aa06ad6ff72242c`  
**Branch:** `cursor/ui-batch1-owner-colour-readability-verification-fixes`  
**Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes`

---

## Root cause

Phase 3 used `md:grid-cols-[minmax(0,1fr)_auto]` with action cluster `md:w-auto`. At 1024×768 the unconstrained `auto` action track starved the copy column (~1–2 words/line) and allowed action buttons to overlap/obscure body text.

Evidence (Visual QA): `agent-visual-qa/after/defect-crops/inspect-1024-emergency-full.png`, `findings/VQA-005.md`.

## Fix (handlers unchanged)

`EmergencyBanner` in `PriorityAndAnnouncements.tsx`:

- Outer layout: `grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]`
- Stacks content → actions below `xl` (covers 390 / 768 / 1024)
- Side-by-side only at ≥1280 with a **bounded** action column (`minmax(0,18rem)` — never unconstrained `auto` from `md`)
- Actions always: `flex w-full min-w-0 flex-wrap` (removed `md:w-auto` / `shrink-0`)

`AnnouncementCarousel` retained its existing `flex-wrap` pattern (not the failing `md:…_auto` grid).

## Preserved closed findings (must remain fixed)

| ID | Concern | Status for this change |
| -- | -------- | ---------------------- |
| VQA-001 | 390 wrap / no clipping | Stack + full-width wrap retained |
| VQA-002 | Topbar brand / seg-mini | Untouched |
| VQA-003 | PageHeader H1 | Untouched |
| VQA-004 | Sidebar footer | Untouched |

## Tests

Updated `ui-batch1-owner-visual-remediation.test.ts` to assert xl bounded grid and forbid `md:grid-cols-[…_auto]` / `md:w-auto`.

```bash
npx tsx --test \
  src/components/workspaces/tests/ui-batch1-owner-visual-remediation.test.ts \
  src/components/workspaces/tests/ui-batch1-iv-findings-remediation.test.ts
```

Exit code: **0** (28 pass / 0 fail)

## Ports

Did not stop 3000 / 3490 / 3491. No PR. Source editing stopped after this note commit.

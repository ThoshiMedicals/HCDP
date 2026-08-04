# Owner-inspection contradiction correction v1 — Correction Map

**Agent:** Implementation Agent  
**Worktree:** `/tmp/hcdp-fix/ui-batch1-contradiction-v1`  
**Base tip:** `247048a58bee67b10fb885fad56b9653e76f1b7a`  
**Scope:** Presentation/layout + clipping-gate restore only  
**Business-behaviour changes:** **none**  
**Findings closed by this agent:** **none** (Visual QA / Work-Step close findings)

---

## Root cause (confirmed)

1. `Table.tsx` wraps `min-w-[800px]` table in `overflow-auto` **without** `min-w-0` → CSS grid/flex ancestors expand to ~800px → siblings stretch → clipped by portal `overflow-x-hidden`.
2. M04–M06 section nav: desktop tabs `flex: 0 0 auto` + nowrap (~1200px) inside a nav card lacking `min-w-0` → content column blow-out → buttons/inputs stretch and clip.

---

## Files changed

| File | Why |
| ---- | --- |
| `src/components/ui/Table.tsx` | Add `min-w-0 max-w-full` on overflow wrapper so table scrolls internally without expanding ancestors. Keep `min-w-[800px]` on `<table>`. |
| `src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx` | Nav card: `min-w-0 max-w-full` so section-tab scroller can contain itself. |
| `src/modules/m05-roster/RosterWorkspace.tsx` | Same nav-card containment. |
| `src/modules/m06-time-attendance/AttendanceWorkspace.tsx` | Same nav-card containment. |
| `src/styles/tokens.css` | `.module-section-nav`, `__desktop-only`, `__scroller`: `width/min-width/max-width` so horizontal tab scroll does not expand ancestors. |
| `src/modules/m05-roster/components/SectionFrame.tsx` | `grid min-w-0 gap-4` — section body may shrink inside content column. |
| `src/modules/m06-time-attendance/components/SectionFrame.tsx` | Same. |
| `src/modules/m04-staff-doctors/sections/PeopleSection.tsx` | Form grid `min-w-0`; controls `min-w-0 w-full max-w-full`. |
| `src/modules/m04-staff-doctors/sections/CredentialsSection.tsx` | Same form-grid containment. |
| `src/modules/m04-staff-doctors/sections/OverviewSection.tsx` | KPI buttons `w-full min-w-0 max-w-full`; grids `min-w-0`. |
| `src/modules/m04-staff-doctors/sections/EngagementsSection.tsx` | Same form-grid containment (engagement inputs were in reconciliation). |
| `src/modules/m05-roster/sections/OpenShiftsSection.tsx` | Offer form grid/controls containment. |
| `src/modules/m05-roster/sections/CoverageSection.tsx` | Coverage evaluate form containment. |
| `src/modules/m05-roster/sections/AvailabilityLeaveSection.tsx` | Filter + declaration form containment. |
| `src/modules/m05-roster/sections/ConflictsWarningsSection.tsx` | Evaluate form containment. |
| `src/modules/m05-roster/sections/SettingsSection.tsx` | Create-draft form containment. |
| `src/modules/m05-roster/sections/RosterBoardSection.tsx` | Create-period form (`Clinic id` / `Ends on`) containment — failing controls in reconciliation. |
| `src/modules/m06-time-attendance/sections/LiveAttendanceSection.tsx` | Wrap refresh actions in flex wrap; `w-auto max-w-full` so grid items do not stretch full blown width. |
| `src/modules/m06-time-attendance/sections/ApprovalsSection.tsx` | Same for bulk-approve action. |
| `src/modules/m06-time-attendance/sections/CorrectionsSection.tsx` | Same for request-correction action. |
| `src/modules/m06-time-attendance/sections/AttendanceHistorySection.tsx` | Filter input containment + clear-filter wrap. |
| `src/modules/m06-time-attendance/sections/SettingsSection.tsx` | Publish-policy action wrap. |
| `scripts/ui-batch1-iv-findings-remediation-validate.mjs` | Restore complete meaningful-control clipping gate (remove non-chrome bypass); extend summary aggregates. |
| `src/components/workspaces/tests/ui-batch1-iv-findings-remediation.test.ts` | Assert complete gate; remove chrome-only bypass test. |

---

## Explicitly untouched

- onClick / store / service call bodies
- permissions, routes, schemas, contracts, calculations
- `_rsc` / prefetch ERR_ABORTED allowlist
- Historical evidence under `owner-visual-layout-v1/agent-*` (except **new** files here)
- Owner server on `:3000`

---

## Residual risk

- Full 338-route matrix not run by Implementation Agent (Coordinator/Regression).
- Nested table/toolbars outside listed sections may still clip if a similar min-content blow-out exists elsewhere.
- Intentional table horizontal scroll remains; gate must continue to honour `horizontalScrollEscape` / scroll-region exemptions.

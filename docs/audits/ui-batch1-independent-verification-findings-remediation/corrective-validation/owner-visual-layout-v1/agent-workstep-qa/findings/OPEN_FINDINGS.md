# OPEN findings — Work-Step QA Phase 2 baseline

No OPEN WQA-* findings at baseline close.

Informational notes (not defects vs source contracts):
- Emergency Previous/Next are **disabled** when only one unacknowledged Emergency announcement is seeded (source: `disabled={items.length < 2}` in `PriorityAndAnnouncements.tsx`). Observed title: Beachmere clinic temporary closure.
- Topbar does **not** host Appearance; Appearance lives in Command Centre control bar (`select[aria-label="Appearance"]`).
- Sidebar has family expand/collapse only; no dedicated sidebar width collapse control.
- External payments/providers/communications are OUT OF SCOPE (WQA-007) and must never be marked PASS.

Raw: `baseline/_raw-results.json`

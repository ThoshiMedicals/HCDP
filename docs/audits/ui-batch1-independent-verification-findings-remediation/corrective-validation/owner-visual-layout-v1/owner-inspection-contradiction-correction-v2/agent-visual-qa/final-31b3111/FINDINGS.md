# Visual QA Findings — Correction 2 / final-31b3111

- Frozen app SHA: 
- shaMatch: true
- stillBadCount: **9**
- Open findings: **9**
- Verdict: **FAIL**

Correction-2 Visual QA records stillBadCount=9 with 9 OPEN findings (short-height dashboard X-overflow). Topbar/search probes pass. Prior-110 after-geometry cleared 110/110. This is not a zero-open PASS and does not bury geometry failures.

## Open findings

### VQA-C2-SHORT-001 — OPEN
- Route:  @ 1024x600 (light)
- Screenshot: 
- Controls: Add Comment, Audit and override detailLast refreshed , Clear filters, Create follow-up
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-002 — OPEN
- Route:  @ 768x500 (light)
- Screenshot: 
- Controls: Add Comment, Audit and override detailLast refreshed , Clear filters, Create follow-up
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-003 — OPEN
- Route:  @ 1024x600 (dark)
- Screenshot: 
- Controls: Add Comment, Audit and override detailLast refreshed , Clear filters, Create follow-up
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-004 — OPEN
- Route:  @ 768x500 (dark)
- Screenshot: 
- Controls: Add Comment, Audit and override detailLast refreshed , Clear filters, Create follow-up
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-005 — OPEN
- Route:  @ 1024x600 (system)
- Screenshot: 
- Controls: Add Comment, Audit and override detailLast refreshed , Clear filters, Create follow-up
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-006 — OPEN
- Route:  @ 768x500 (system)
- Screenshot: 
- Controls: Add Comment, Audit and override detailLast refreshed , Clear filters, Create follow-up
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-007 — OPEN
- Route:  @ 1536x900 (light)
- Screenshot: 
- Controls: Audit and override detailLast refreshed 
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-008 — OPEN
- Route:  @ 1536x900 (dark)
- Screenshot: 
- Controls: Audit and override detailLast refreshed 
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

### VQA-C2-SHORT-009 — OPEN
- Route:  @ 1536x900 (system)
- Screenshot: 
- Controls: Audit and override detailLast refreshed 
- Below-fold Command Centre controls (Clear filters / Audit expandable) report overflowsViewportX at short-height viewports. Matrix at standard heights accounts cleanly; these remain open for owner adjudication / follow-on layout containment.

## Closed
- VQA-C-001 topbar hide-until-2xl / Online presence
- VQA-C-017 ribbon search width

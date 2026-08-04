# Requirement → evidence checklist — Phase 4 FINAL

| Field | Value |
|---|---|
| Agent | Work-Step / Functional QA |
| Final app SHA | `d822dfd4a80ed0c98635a0ff8631f9e39fe781f0` |
| Port | `http://127.0.0.1:3491` |
| Worktree | `/tmp/hcdp-fix/ui-batch1-wqa-3491` |

| Instruction ID | Action | Agent | Input SHA | Evidence path | Outcome |
|---|---|---|---|---|---|
| WQA-P4-SHA | Confirm HEAD == d822dfd; write after/input-sha.txt | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/input-sha.txt` | DONE |
| WQA-P4-INV | Re-inventory controls on :3491 | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/CONTROL_INVENTORY.md` | DONE |
| WF-EMERGENCY | Emergency desktop + clip/brand ops + keyboard View All | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/workflows/WQA-001.md` | PASS |
| WF-EMERGENCY-390 | Emergency mobile 390 | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/workflows/WQA-002.md` | PASS |
| WF-TOPBAR | Dashboard/Inbox/search Enter/Online + mobile Open menu | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/workflows/WQA-003.md` | PASS |
| WF-SIDEBAR | Family expand, Act-as 900/720, drawer focus return | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/workflows/WQA-004.md` | PASS |
| WF-ROUTES | Canonical routes, H1 no-ellipsis Settings/M07, reload, Back/Forward, mobile Settings | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/workflows/WQA-005.md` | PASS |
| WF-APPEARANCE | Clean default; Light/Dark/System + reload | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/workflows/WQA-006.md` | PASS |
| WF-PAYMENTS | Payments/providers/communications | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/workflows/WQA-007.md` | OUT OF SCOPE |
| WQA-P4-SUM | WORKFLOW_SUMMARY.json | Work-Step QA | d822dfd4a80ed0c98635a0ff8631f9e39fe781f0 | `after/WORKFLOW_SUMMARY.json` | DONE |

## OPEN findings
None.

## Closed by this agent
- WQA-BRAND-MOBILE390 (intentional mobile H-mark-only brand)

## Confirmation
Application source/tests were **not** edited. Ports 3000/3490 were **not** stopped.

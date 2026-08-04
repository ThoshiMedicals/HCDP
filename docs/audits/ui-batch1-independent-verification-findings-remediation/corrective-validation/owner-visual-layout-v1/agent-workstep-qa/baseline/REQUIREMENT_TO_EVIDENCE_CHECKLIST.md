# Requirement → evidence checklist (skeleton) — Work-Step QA Phase 2 baseline

| Field | Value |
|---|---|
| Agent | Work-Step / Functional QA |
| Input SHA | `f837bdd08e1db30e68c63cfb2542e3120bc40d00` |
| App source SHA | `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742` |
| Port | `http://127.0.0.1:3000` |
| Phase | Baseline pre-remediation |

Process-audit rows executed by this agent. Outcomes are workflow results only — **not** independent verification or merge readiness.

| Instruction ID | Action | Agent | Input SHA | Evidence path | Outcome |
|---|---|---|---|---|---|
| WQA-BASE-SHA | Record input + app SHA | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../input-sha.txt` | DONE |
| WQA-INV-01 | Inventory emergency controls (DOM+source) | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `CONTROL_INVENTORY.md` §1; `screenshots/INV-*.png` | DONE |
| WQA-INV-02 | Inventory Topbar controls | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `CONTROL_INVENTORY.md` §2 | DONE |
| WQA-INV-03 | Inventory Sidebar / Act-as / drawer | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `CONTROL_INVENTORY.md` §3; `WF-SIDEBAR-*.png` | DONE |
| WQA-INV-04 | Inventory canonical routes/headings | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `CONTROL_INVENTORY.md` §4 | DONE |
| WQA-INV-05 | Inventory Appearance controls | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `CONTROL_INVENTORY.md` §5 | DONE |
| WF-EMERGENCY | Previous/Next/View All desktop | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../workflows/WQA-001.md`; `screenshots/WF-EMERGENCY-DESKTOP-*` | PASS |
| WF-EMERGENCY-390 | Previous/Next/View All mobile 390 | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../workflows/WQA-002.md`; `screenshots/WF-EMERGENCY-MOBILE390-*` | PASS |
| WF-TOPBAR | Dashboard/Inbox/search/Online | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../workflows/WQA-003.md`; `screenshots/WF-TOPBAR-*` | PASS |
| WF-SIDEBAR | Family expand, nav, drawer, Act-as 1440×900/720 | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../workflows/WQA-004.md`; `screenshots/WF-SIDEBAR-*` | PASS |
| WF-ROUTES | Dashboard/Inbox/Settings/M07 overview+adjustments; reload; Back/Forward | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../workflows/WQA-005.md`; `screenshots/WF-ROUTES-*` | PASS |
| WF-APPEARANCE | Clean default; Light/Dark/System + reload | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../workflows/WQA-006.md`; `screenshots/WF-APPEARANCE-*` | PASS |
| WF-PAYMENTS | External payments/providers/communications | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `../workflows/WQA-007.md` | OUT OF SCOPE |
| WQA-SUM-01 | Write workflow summary totals + OPEN findings | Work-Step QA | f837bdd08e1db30e68c63cfb2542e3120bc40d00 | `WORKFLOW_SUMMARY.json` | DONE |

## OPEN findings

None at baseline close (`wqaFindingIds: []`).

## Notes for coordinator

- Playwright launched successfully (system Chrome); not BLOCKED.
- Early false miss on emergency banner (hydration/locator race) was re-probed and closed as PASS; historical `*-missing.png` retained under baseline screenshots.
- No application source or tests were edited by this agent.

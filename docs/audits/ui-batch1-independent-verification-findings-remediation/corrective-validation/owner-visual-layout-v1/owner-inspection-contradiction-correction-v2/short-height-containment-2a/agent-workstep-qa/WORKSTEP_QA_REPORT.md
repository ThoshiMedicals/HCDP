# Work-Step QA Report — Correction 2A (short-height containment)

| Field | Value |
| --- | --- |
| Agent | Work-Step / Functional QA (READ-ONLY vs application source) |
| Correction | 2A |
| Frozen application SHA | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` |
| Worktree | `/tmp/hcdp-fix/c2a-wqa-3512` (detached at freeze) |
| Server | `http://127.0.0.1:3512` |
| Dashboard preflight | HTTP 200 |
| `shaMatch` | **true** |
| Preflight `src/scripts` diff vs freeze | **0 lines** (`emptyDiff=true`) |
| Recorded | `2026-08-06T02:57:23.420Z` |
| Overall verdict | **PASS** |
| Open WQA findings | **0** |
| Application source/tests edited | **No** |

Does **not** approve Visual QA findings. Does **not** claim independent verification, merge readiness, or production approval.

## Totals

| Metric | Value |
| --- | --- |
| Workflows | 33 |
| PASS | 32 |
| FAIL | 0 |
| BLOCKED | 0 |
| OUT_OF_SCOPE | 1 (`WF-PAYMENTS-OOS`) |
| Steps PASS | 191 |
| Steps FAIL | 0 |
| Steps OOS | 1 |
| Open findings | 0 |

## Clear Filter empty-value proof (retained)

Workflow `WF-M06-CLEAR-FILTER` — **PASS** (6/6 steps)

| Step | Action | Observed |
| --- | --- | --- |
| 2 | History filter initial | `value=` (empty) |
| 4 | History filter set | `value=demo-filter` |
| 6 | Clear filter (domain) | `value=` (empty after clear) |

Empty history-filter value after Clear is retained in `_raw-results.json`.

## Resulting-state evidence matrix (required areas)

| Area | Workflow evidence | Result |
| --- | --- | --- |
| Dashboard cards / drill-downs | `WF-M04-KPI-NAV` — Active staff → Staff profiles; Active doctors → Doctor profiles; Blocked readiness → Credentials; On leave today → Leave & availability | PASS |
| Topbar search lifecycle | `WF-TOPBAR` — Search → Staff Pay (`/staffpay`); Mobile Open menu visible; Mobile search → Action Inbox (`/action-inbox`) | PASS |
| Emergency announcement | `WF-EMERGENCY-1440/1024/390` — banner visible; View All operable in viewport; keyboard Enter opens modal | PASS |
| Sidebar collapse / mobile drawer / focus | `WF-SIDEBAR` family toggle `aria-expanded` true→false; `WF-TOPBAR` Mobile Open menu visible; `WF-A11Y-FORMS-*` Tab focus moves Preferred name → Email + keyboard activate | PASS (runner steps) |
| Keyboard / focus visibility | `WF-A11Y-FORMS-390` + `WF-A11Y-FORMS-1024` — Tab focus move; Enter activates Create/Offer | PASS |
| Light / Dark / System persistence | `WF-APPEARANCE` — select light/dark/system; light+reload persist; dark+reload persist (`theme-dark`) | PASS |
| Reload and Back / Forward | `WF-NAV-STATE` — reload retains M04 credentials / M07 overview; Back approvals→open-shifts; Forward→approvals | PASS |

## Evidence paths

| Artefact | Path |
| --- | --- |
| Runner log | `/tmp/c2a-wqa-final.log` |
| Canonical final pack | `.../owner-inspection-contradiction-correction-v2/agent-workstep-qa/final-b1152d3/` |
| Mirrored final pack | `.../short-height-containment-2a/agent-workstep-qa/final-b1152d3/` |
| Raw results | `final-b1152d3/_raw-results.json` |
| Summary JSON | `final-b1152d3/WORKSTEP_SUMMARY.json` |
| Results MD | `final-b1152d3/WORKSTEP_RESULTS.md` |
| Open findings | `final-b1152d3/findings/OPEN_FINDINGS.md` |
| This report | `short-height-containment-2a/agent-workstep-qa/WORKSTEP_QA_REPORT.md` |

## Workflow outcomes (all)

| Workflow | Outcome |
| --- | --- |
| PREFLIGHT | PASS |
| WF-M04-PEOPLE-CREATE | PASS |
| WF-M04-CREDENTIALS-ADD | PASS |
| WF-M04-ENGAGEMENTS | PASS |
| WF-M04-KPI-NAV | PASS |
| WF-M04-CLIP-OPS | PASS |
| WF-M05-OFFER | PASS |
| WF-M05-COVERAGE | PASS |
| WF-M05-CLINIC-FILTER | PASS |
| WF-M05-CONFLICTS | PASS |
| WF-M05-CREATE-DRAFT | PASS |
| WF-M05-ROSTER-BOARD | PASS |
| WF-M05-CLIP-OPS | PASS |
| WF-M06-REFRESH | PASS |
| WF-M06-BULK-APPROVE | PASS |
| WF-M06-CORRECTION | PASS |
| WF-M06-PUBLISH-POLICY | PASS |
| WF-M06-CLEAR-FILTER | PASS |
| WF-M06-CLIP-OPS | PASS |
| WF-EMERGENCY-1440 | PASS |
| WF-EMERGENCY-1024 | PASS |
| WF-EMERGENCY-390 | PASS |
| WF-TOPBAR | PASS |
| WF-SIDEBAR | PASS |
| WF-APPEARANCE | PASS |
| WF-DEEPLINK-M04 | PASS |
| WF-DEEPLINK-M05 | PASS |
| WF-DEEPLINK-M06 | PASS |
| WF-DEEPLINK-M07 | PASS |
| WF-NAV-STATE | PASS |
| WF-A11Y-FORMS-390 | PASS |
| WF-A11Y-FORMS-1024 | PASS |
| WF-PAYMENTS-OOS | OUT OF SCOPE |

## Claims explicitly not made

- Visual QA finding closure / Visual QA PASS
- Independent verification
- Merge readiness
- Production approval
- Programme baseline acceptance

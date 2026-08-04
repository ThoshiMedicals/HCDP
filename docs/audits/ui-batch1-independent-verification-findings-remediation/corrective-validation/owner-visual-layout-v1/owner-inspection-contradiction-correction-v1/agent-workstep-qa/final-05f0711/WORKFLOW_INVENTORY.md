# Work-Step QA — Workflow Inventory

| Field | Value |
| --- | --- |
| Agent | Work-Step / Functional QA (READ-ONLY against application source) |
| Worktree | `/tmp/hcdp-fix/ui-batch1-contradiction-v1` |
| Frozen app SHA | `05f07119ec2883b7ec7a2da6bbe3b5162257c2ec` |
| `git diff 05f0711 -- src scripts` | empty (0 lines) before start |
| Live target | `http://127.0.0.1:3501` (`next start`; do not kill; not `:3000`) |
| Evidence root | `…/owner-inspection-contradiction-correction-v1/agent-workstep-qa/final-05f0711/` |
| Prior evidence (do not overwrite) | `…/agent-workstep-qa/revalidation-b661b6c/`, `…/final-b1d0683/` |
| Method | Playwright + system Chrome; DOM geometry + click/keyboard + URL/heading asserts |
| Scope claim | Functional operability of previously clipped / affected controls + shell workflows |

Does **not** claim independent verification, merge readiness, production approval, payment readiness, or statutory correctness.

---

## Preflight

| ID | Check |
| --- | --- |
| PRE-01 | Confirm frozen SHA + empty `src`/`scripts` diff vs `05f0711` |
| PRE-02 | Confirm `:3501` serves app (HTTP 200 on `/dashboard`) |
| PRE-03 | Confirm app CSS HTTP 200 (`/_next/static/css/*.css`) |

---

## Group A — M04 Staff & Doctors (affected Create/Add/filter/KPI)

| Workflow ID | Route | Controls / actions | Safe demo notes |
| --- | --- | --- | --- |
| WF-M04-PEOPLE-CREATE | `/staff-doctors?section=people` | Kind select, Preferred name, Email, **Create** | Unique demo email; local store only |
| WF-M04-CREDENTIALS-ADD | `/staff-doctors?section=credentials` | Person select, type, expiry, **Add** | Demo credential type |
| WF-M04-ENGAGEMENTS | `/staff-doctors?section=engagements` | Engagement form fields + **Create** if operable | Demo clinic id |
| WF-M04-KPI-NAV | `/staff-doctors` (overview) | KPI tiles: Active staff / Active doctors / Blocked readiness / On leave today | Navigates to section headings |
| WF-M04-CLIP-OPS | people + credentials at **390** and **1024** | Previously clipped inputs/buttons: Preferred name, Email, Create, Add, selects | Geometry + click + not covered |

---

## Group B — M05 Roster (Offer / Coverage / Clinic filter / Conflicts / Draft)

| Workflow ID | Route | Controls / actions | Safe demo notes |
| --- | --- | --- | --- |
| WF-M05-OFFER | `/roster?section=open-shifts` | Shift select, Audience, **Offer** | Demo audience string |
| WF-M05-COVERAGE | `/roster?section=coverage` | Period select, **Evaluate coverage** | Demo period |
| WF-M05-CLINIC-FILTER | `/roster?section=availability-leave` | **Clinic id filter** input | Type filter value |
| WF-M05-CONFLICTS | `/roster?section=conflicts-warnings` | Candidate shift / person, **Evaluate conflicts** | Demo evaluate |
| WF-M05-CREATE-DRAFT | `/roster?section=settings` | Policy label, **Create draft** | Demo label |
| WF-M05-ROSTER-BOARD | `/roster` / `?section=roster-board` | Clinic id / Ends on containment + period form | Geometry operability |
| WF-M05-CLIP-OPS | open-shifts + coverage at **390** and **1024** | Offer / Evaluate coverage / Audience / selects | Geometry + click |

---

## Group C — M06 Time & Attendance (authorised safe demo)

| Workflow ID | Route | Controls / actions | Safe demo notes |
| --- | --- | --- | --- |
| WF-M06-REFRESH | `/time-attendance` / `?section=live` | **Refresh live board** | Local refresh only |
| WF-M06-BULK-APPROVE | `/time-attendance?section=approvals` | **Bulk approve pending** | Demo queue; no external provider |
| WF-M06-CORRECTION | `/time-attendance?section=corrections` | **Request correction** | Demo request |
| WF-M06-CLEAR-FILTER | `/time-attendance?section=history` | Filter + **Clear filter** | Local filter |
| WF-M06-PUBLISH-POLICY | `/time-attendance?section=settings` | **Publish policy** | Demo policy publish (not payment) |
| WF-M06-CLIP-OPS | live + approvals at **1024** / **1440** context | Refresh / Bulk approve operability | Geometry + click |

---

## Group D — Shell (Topbar / Sidebar / Emergency / Appearance)

| Workflow ID | Route | Controls / actions |
| --- | --- | --- |
| WF-EMERGENCY-1440 | `/dashboard` @ 1440×900 | Banner, Prev/Next, View All (+ keyboard) |
| WF-EMERGENCY-1024 | `/dashboard` @ 1024×768 | View All inside card; no page H-scroll |
| WF-EMERGENCY-390 | `/dashboard` @ 390×844 | View All + keyboard Enter |
| WF-TOPBAR | `/dashboard` | Dashboard / Action Inbox; **Online** toggle; **Export**/New Entry/Enterprise MFA visible at **2xl+** (hidden below 2xl incl. 1440); short **Enterprise MFA** label; search; mobile Open menu |
| WF-SIDEBAR | `/dashboard` | Act-as at 900/720; family toggle |
| WF-APPEARANCE | `/dashboard` | Light / Dark / System (+ reload persistence for Light/Dark; System select) |

---

## Group E — Deep links (`?section=`) M04–M07

| Workflow ID | Coverage |
| --- | --- |
| WF-DEEPLINK-M04 | All M04 section ids → correct `h2` |
| WF-DEEPLINK-M05 | All M05 section ids → `data-m05-section-title` / `h2` |
| WF-DEEPLINK-M06 | All M06 section ids → `data-m06-section-title` / `h2` |
| WF-DEEPLINK-M07 | All M07 section ids → section heading text (planned History allowed) |

---

## Group F — Reload / Back-Forward / persistence

| Workflow ID | Actions |
| --- | --- |
| WF-NAV-STATE | Reload retains `?section=`; Back/Forward between module sections; Appearance Light/Dark persist across reload |

---

## Group G — Keyboard / focus / responsive forms (390 & 1024)

| Workflow ID | Actions |
| --- | --- |
| WF-A11Y-FORMS-390 | Tab order / keyboard activate Create (M04) and Offer focus path; controls fully in viewport |
| WF-A11Y-FORMS-1024 | Same at 1024; focus order smoke on people form |

---

## Out of scope (protected)

| Workflow ID | Reason |
| --- | --- |
| WF-PAYMENTS-OOS | External payment / provider / bank-file / STP / super / mark-as-paid / Xero production / communication providers — **OUT OF SCOPE** |

---

## Section deep-link map (expected headings)

### M04 `/staff-doctors`

| section | Expected h2 |
| --- | --- |
| overview | Workforce overview |
| people | People directory |
| staff-profiles | Staff profiles |
| doctor-profiles | Doctor profiles |
| engagements | Engagements |
| credentials | Credentials |
| leave-availability | Leave & availability |
| restrictions | Restrictions & adjustments |
| onboarding | Onboarding |
| offboarding | Offboarding |
| reports | Reports |
| settings | Settings |

### M05 `/roster`

| section | Expected title |
| --- | --- |
| roster-board | Roster Board |
| coverage | Coverage |
| open-shifts | Open Shifts |
| availability-leave | Availability & Leave |
| requests | Requests |
| conflicts-warnings | Conflicts & Warnings |
| published-history | Published History |
| cost-forecast | Cost Forecast |
| reports | Reports |
| settings | Settings |

### M06 `/time-attendance`

| section | Expected title |
| --- | --- |
| live | Live Attendance |
| clock | Clock In/Out |
| timesheets | Timesheets |
| exceptions | Exceptions |
| corrections | Corrections |
| approvals | Approvals |
| breaks | Breaks |
| history | Attendance History |
| reports | Reports |
| settings | Settings & Policies |

### M07 `/staffpay`

| section | Expected heading |
| --- | --- |
| overview | Pay Run Overview |
| people | People Review (or people heading) |
| leave | Leave & Allowances |
| adjustments | Adjustments |
| exceptions | Exceptions |
| variances | Variances |
| approval | Approval |
| export | Export |
| reconciliation | Reconciliation |
| history | History / Reports (planned) |
| settings | Settings |

---

## Evidence artefacts produced

- `WORKFLOW_INVENTORY.md` (this file)
- `_run-workstep-qa.mjs` (evidence runner; not under `src/` / `scripts/`)
- `_emit-reports.mjs` (report emitter)
- `_raw-results.json`
- `WORKSTEP_RESULTS.md`
- `WORKSTEP_SUMMARY.json`
- `findings/OPEN_FINDINGS.md` (or empty open list)
- `screenshots/`, `traces/`, `workflows/`
- `input-sha.txt`

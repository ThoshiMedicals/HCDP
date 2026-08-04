# Work-Step QA — Results

| Field | Value |
| --- | --- |
| Agent | Work-Step / Functional QA (READ-ONLY) |
| Frozen app SHA | `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1` |
| Worktree | `/tmp/hcdp-fix/ui-batch1-contradiction-v1` |
| Server | `http://127.0.0.1:3501` |
| Started | 2026-08-04T05:45:57.437Z |
| Finished | 2026-08-04T05:50:09.391Z |
| Preflight empty src/scripts diff | true |
| Overall verdict | **PASS** |

## Totals

- Workflows: **33** (PASS 32 / FAIL 0 / OUT_OF_SCOPE 1 / BLOCKED 0)
- Steps: PASS 182 / FAIL 0 / OUT_OF_SCOPE 1
- Open WQA findings: **0**

## Workflow outcomes

| Workflow | Outcome | Steps |
| --- | --- | ---: |
| PREFLIGHT | PASS | 2 |
| WF-M04-PEOPLE-CREATE | PASS | 6 |
| WF-M04-CREDENTIALS-ADD | PASS | 4 |
| WF-M04-ENGAGEMENTS | PASS | 4 |
| WF-M04-KPI-NAV | PASS | 8 |
| WF-M04-CLIP-OPS | PASS | 16 |
| WF-M05-OFFER | PASS | 5 |
| WF-M05-COVERAGE | PASS | 4 |
| WF-M05-CLINIC-FILTER | PASS | 3 |
| WF-M05-CONFLICTS | PASS | 3 |
| WF-M05-CREATE-DRAFT | PASS | 4 |
| WF-M05-ROSTER-BOARD | PASS | 2 |
| WF-M05-CLIP-OPS | PASS | 12 |
| WF-M06-REFRESH | PASS | 3 |
| WF-M06-BULK-APPROVE | PASS | 3 |
| WF-M06-CORRECTION | PASS | 3 |
| WF-M06-PUBLISH-POLICY | PASS | 3 |
| WF-M06-CLEAR-FILTER | PASS | 4 |
| WF-M06-CLIP-OPS | PASS | 4 |
| WF-EMERGENCY-1440 | PASS | 4 |
| WF-EMERGENCY-1024 | PASS | 4 |
| WF-EMERGENCY-390 | PASS | 4 |
| WF-TOPBAR | PASS | 5 |
| WF-SIDEBAR | PASS | 3 |
| WF-APPEARANCE | PASS | 6 |
| WF-DEEPLINK-M04 | PASS | 12 |
| WF-DEEPLINK-M05 | PASS | 10 |
| WF-DEEPLINK-M06 | PASS | 10 |
| WF-DEEPLINK-M07 | PASS | 11 |
| WF-NAV-STATE | PASS | 4 |
| WF-A11Y-FORMS-390 | PASS | 8 |
| WF-A11Y-FORMS-1024 | PASS | 8 |
| WF-PAYMENTS-OOS | OUT OF SCOPE | 1 |

## PREFLIGHT

- Route: `/`
- Starting state: sha+server
- Outcome: **PASS**
- Screenshots: screenshots/PREFLIGHT-dashboard.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Empty git diff b661b6c -- src scripts | 0 lines | 0 | PASS |
| 2 | GET /dashboard on :3501 | HTTP 2xx | status=200 url=http://127.0.0.1:3501/dashboard | PASS |

## WF-M04-PEOPLE-CREATE

- Route: `/staff-doctors?section=people`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M04-PEOPLE-CREATE.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load people section | h2 People directory | People directory | PASS |
| 2 | Operability: Preferred name | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Preferred name","rect":{"top":459.1875,"left":602.5,"right":860,"bottom":501.6875,"width":257.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Email | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Email","rect":{"top":459.1875,"left":868,"right":1125.5,"bottom":501.6875,"width":257.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Operability: Create | Visible, in viewport, not covered, no page H-scroll (disabled-until-valid OK) | {"present":true,"text":"Create","rect":{"top":459.1875,"left":1133.5,"right":1391,"bottom":501.6875,"width":257.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":true,"pointerEvents":"auto","operable":true} | PASS |
| 5 | Operability: Create after fill | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Create","rect":{"top":459.1875,"left":1133.5,"right":1391,"bottom":501.6875,"width":257.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 6 | Create person (demo) | Person appears in table / toast | visible=true toast=Acting as Sarah Mitchell | PASS |

## WF-M04-CREDENTIALS-ADD

- Route: `/staff-doctors?section=credentials`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M04-CREDENTIALS-ADD.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load credentials | h2 Credentials | Credentials | PASS |
| 2 | Operability: Person select | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Akith HettiarachchiAlana CheneyAlvina RathodAnita ThayaniBen WallegamaarachchiBr","rect":{"top":459.1875,"left":337,"right":594.5,"bottom":501.6875,"width":257.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Add | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Add","rect":{"top":459.1875,"left":1133.5,"right":1391,"bottom":501.6875,"width":257.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Add credential (demo) | Credential added / table updates | before=0 after=1 toast=Acting as Sarah Mitchell | PASS |

## WF-M04-ENGAGEMENTS

- Route: `/staff-doctors?section=engagements`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M04-ENGAGEMENTS.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load engagements | h2 Engagements | Engagements | PASS |
| 2 | Operability: Clinic id | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Clinic id","rect":{"top":459.1875,"left":549.390625,"right":753.796875,"bottom":501.6875,"width":204.40625,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Create engagement | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Create","rect":{"top":459.1875,"left":1186.59375,"right":1390.984375,"bottom":501.6875,"width":204.390625,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Create engagement attempt | Button operable; create when enabled | disabled=false toast=Acting as Sarah Mitchell | PASS |

## WF-M04-KPI-NAV

- Route: `/staff-doctors`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M04-KPI-NAV.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Operability: /ACTIVE STAFF/i | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Active staff41","rect":{"top":378.890625,"left":316,"right":579.5,"bottom":482.390625,"width":263.5,"height":103.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 2 | KPI navigate /ACTIVE STAFF/i | /Staff profiles/i | Staff profiles | PASS |
| 3 | Operability: /ACTIVE DOCTORS/i | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Active doctors48","rect":{"top":378.890625,"left":593.5,"right":857,"bottom":482.390625,"width":263.5,"height":103.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | KPI navigate /ACTIVE DOCTORS/i | /Doctor profiles/i | Doctor profiles | PASS |
| 5 | Operability: /BLOCKED READINESS/i | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Blocked readiness89","rect":{"top":378.890625,"left":871,"right":1134.5,"bottom":482.390625,"width":263.5,"height":103.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 6 | KPI navigate /BLOCKED READINESS/i | /Credentials/i | Credentials | PASS |
| 7 | Operability: /ON LEAVE TODAY/i | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"On leave today0","rect":{"top":378.890625,"left":1148.5,"right":1412,"bottom":482.390625,"width":263.5,"height":103.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 8 | KPI navigate /ON LEAVE TODAY/i | /Leave & availability/i | Leave & availability | PASS |

## WF-M04-CLIP-OPS

- Route: `people+credentials`
- Starting state: 390 + 1024
- Outcome: **PASS**
- Screenshots: screenshots/WF-M04-CLIP-OPS-390.png, screenshots/WF-M04-CLIP-OPS-1024.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Operability: Preferred name@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Preferred name","rect":{"top":642.6875,"left":37,"right":353,"bottom":683.1875,"width":316,"height":40.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 2 | Operability: Email@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Email","rect":{"top":691.1875,"left":37,"right":353,"bottom":731.6875,"width":316,"height":40.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Create@390 | Visible, in viewport, not covered, no page H-scroll (disabled-until-valid OK) | {"present":true,"text":"Create","rect":{"top":739.6875,"left":37,"right":353,"bottom":782.1875,"width":316,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":true,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Operability: Kind select@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"StaffDoctor","rect":{"top":594.6875,"left":37,"right":353,"bottom":634.6875,"width":316,"height":40},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 5 | Operability: Create enabled@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Create","rect":{"top":739.6875,"left":37,"right":353,"bottom":782.1875,"width":316,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 6 | Create click @390 | Click succeeds without overlay block | clicked | PASS |
| 7 | Operability: Cred person select@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Akith HettiarachchiAlana CheneyAlvina RathodAnita ThayaniBen WallegamaarachchiBr","rect":{"top":594.6875,"left":37,"right":353,"bottom":634.6875,"width":316,"height":40},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 8 | Operability: Add@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Add","rect":{"top":739.6875,"left":37,"right":353,"bottom":782.1875,"width":316,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 9 | Operability: Preferred name@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Preferred name","rect":{"top":481.6875,"left":498.5,"right":652,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 10 | Operability: Email@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Email","rect":{"top":481.6875,"left":660,"right":813.5,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 11 | Operability: Create@1024 | Visible, in viewport, not covered, no page H-scroll (disabled-until-valid OK) | {"present":true,"text":"Create","rect":{"top":481.6875,"left":821.5,"right":975,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":true,"pointerEvents":"auto","operable":true} | PASS |
| 12 | Operability: Kind select@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"StaffDoctor","rect":{"top":481.6875,"left":337,"right":490.5,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 13 | Operability: Create enabled@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Create","rect":{"top":481.6875,"left":821.5,"right":975,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 14 | Create click @1024 | Click succeeds without overlay block | clicked | PASS |
| 15 | Operability: Cred person select@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Akith HettiarachchiAlana CheneyAlvina RathodAnita ThayaniBen WallegamaarachchiBr","rect":{"top":481.6875,"left":337,"right":490.5,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 16 | Operability: Add@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Add","rect":{"top":481.6875,"left":821.5,"right":975,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |

## WF-M05-OFFER

- Route: `/roster?section=open-shifts`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M05-OFFER.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load open-shifts | Open Shifts | Open Shifts | PASS |
| 2 | Operability: Shift | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Select shift…Clinical Nurse · 2026-08-03T08:00 → 2026-08-03T16:00Reception · 202","rect":{"top":475.1875,"left":337,"right":683,"bottom":517.6875,"width":346,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Audience | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Audience","rect":{"top":475.1875,"left":691,"right":1037,"bottom":517.6875,"width":346,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Operability: Offer | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Offer","rect":{"top":475.1875,"left":1045,"right":1391,"bottom":517.6875,"width":346,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 5 | Offer open shift (demo) | Click completes (toast or validation) | toast=Acting as Sarah Mitchell | PASS |

## WF-M05-COVERAGE

- Route: `/roster?section=coverage`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M05-COVERAGE.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load coverage | Coverage | Coverage | PASS |
| 2 | Operability: Period | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Select period…Demo Roster — Week A (2026-08-03..2026-08-09)","rect":{"top":475.1875,"left":337,"right":683,"bottom":517.6875,"width":346,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Evaluate coverage | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Evaluate coverage","rect":{"top":475.1875,"left":691,"right":1037,"bottom":517.6875,"width":346,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Evaluate coverage (demo) | Action runs | toast=Acting as Sarah Mitchell | PASS |

## WF-M05-CLINIC-FILTER

- Route: `/roster?section=availability-leave`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M05-CLINIC-FILTER.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load availability-leave | Availability & Leave | Availability & Leave | PASS |
| 2 | Operability: Clinic id filter | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Clinic id filter","rect":{"top":448.6875,"left":868,"right":1391,"bottom":489.1875,"width":523,"height":40.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Type clinic id filter | Value retained | clinic_filter_wqa | PASS |

## WF-M05-CONFLICTS

- Route: `/roster?section=conflicts-warnings`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M05-CONFLICTS.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load conflicts | Conflicts & Warnings | Conflicts & Warnings | PASS |
| 2 | Operability: Evaluate conflicts | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Evaluate conflicts","rect":{"top":475.1875,"left":1045,"right":1391,"bottom":517.6875,"width":346,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Evaluate conflicts (demo) | Action runs | toast=Acting as Sarah Mitchell | PASS |

## WF-M05-CREATE-DRAFT

- Route: `/roster?section=settings`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M05-CREATE-DRAFT.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load settings | Settings | Settings | PASS |
| 2 | Operability: Policy label | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Policy label","rect":{"top":475.1875,"left":337,"right":1037,"bottom":517.6875,"width":700,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Create draft | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Create draft","rect":{"top":475.1875,"left":1045,"right":1391,"bottom":517.6875,"width":346,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Create draft policy (demo) | Action runs | toast=Acting as Sarah Mitchell | PASS |

## WF-M05-ROSTER-BOARD

- Route: `/roster?section=roster-board`
- Starting state: 1024x768
- Outcome: **PASS**
- Screenshots: screenshots/WF-M05-ROSTER-BOARD.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Operability: Clinic id | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Clinic id","rect":{"top":495.1875,"left":724.59375,"right":845.796875,"bottom":537.6875,"width":121.203125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 2 | Operability: Ends on | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Ends on","rect":{"top":495.1875,"left":595.390625,"right":716.59375,"bottom":537.6875,"width":121.203125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |

## WF-M05-CLIP-OPS

- Route: `open-shifts+coverage`
- Starting state: 390 + 1024
- Outcome: **PASS**
- Screenshots: screenshots/WF-M05-CLIP-OPS-390.png, screenshots/WF-M05-CLIP-OPS-1024.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Operability: Shift@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Select shift…Clinical Nurse · 2026-08-03T08:00 → 2026-08-03T16:00Reception · 202","rect":{"top":588.1875,"left":37,"right":353,"bottom":628.1875,"width":316,"height":40},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 2 | Operability: Audience@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Audience","rect":{"top":636.1875,"left":37,"right":353,"bottom":676.6875,"width":316,"height":40.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Offer@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Offer","rect":{"top":684.6875,"left":37,"right":353,"bottom":727.1875,"width":316,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Offer click @390 | Clickable | clicked | PASS |
| 5 | Operability: Period@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Select period…Demo Roster — Week A (2026-08-03..2026-08-09)","rect":{"top":610.6875,"left":37,"right":353,"bottom":650.6875,"width":316,"height":40},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 6 | Operability: Evaluate coverage@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Evaluate coverage","rect":{"top":658.6875,"left":37,"right":353,"bottom":701.1875,"width":316,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 7 | Operability: Shift@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Select shift…Clinical Nurse · 2026-08-03T08:00 → 2026-08-03T16:00Reception · 202","rect":{"top":475.1875,"left":337,"right":544.328125,"bottom":517.6875,"width":207.328125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 8 | Operability: Audience@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Audience","rect":{"top":475.1875,"left":552.328125,"right":759.65625,"bottom":517.6875,"width":207.328125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 9 | Operability: Offer@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Offer","rect":{"top":475.1875,"left":767.65625,"right":974.984375,"bottom":517.6875,"width":207.328125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 10 | Offer click @1024 | Clickable | clicked | PASS |
| 11 | Operability: Period@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Select period…Demo Roster — Week A (2026-08-03..2026-08-09)","rect":{"top":475.1875,"left":337,"right":544.328125,"bottom":517.6875,"width":207.328125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 12 | Operability: Evaluate coverage@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Evaluate coverage","rect":{"top":475.1875,"left":552.328125,"right":759.65625,"bottom":517.6875,"width":207.328125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |

## WF-M06-REFRESH

- Route: `/time-attendance?section=live`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M06-REFRESH.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load /time-attendance?section=live | Live Attendance | Live Attendance | PASS |
| 2 | Operability: Refresh live board | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Refresh live board","rect":{"top":597.890625,"left":316,"right":473.21875,"bottom":642.390625,"width":157.21875,"height":44.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Refresh live board (demo) | Click completes; no crash | toast=Acting as Sarah Mitchell url=http://127.0.0.1:3501/time-attendance?section=live | PASS |

## WF-M06-BULK-APPROVE

- Route: `/time-attendance?section=approvals`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M06-BULK-APPROVE.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load /time-attendance?section=approvals | Approvals | Approvals | PASS |
| 2 | Operability: Bulk approve pending | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Bulk approve pending","rect":{"top":354.890625,"left":316,"right":498.875,"bottom":397.390625,"width":182.875,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Bulk approve pending (demo) | Click completes; no crash | toast=Acting as Sarah Mitchell url=http://127.0.0.1:3501/time-attendance?section=approvals | PASS |

## WF-M06-CORRECTION

- Route: `/time-attendance?section=corrections`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M06-CORRECTION.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load /time-attendance?section=corrections | Corrections | Corrections | PASS |
| 2 | Operability: Request correction | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Request correction","rect":{"top":354.890625,"left":316,"right":476.90625,"bottom":397.390625,"width":160.90625,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Request correction (demo) | Click completes; no crash | toast=Acting as Sarah Mitchell url=http://127.0.0.1:3501/time-attendance?section=corrections | PASS |

## WF-M06-PUBLISH-POLICY

- Route: `/time-attendance?section=settings`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M06-PUBLISH-POLICY.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load /time-attendance?section=settings | Settings & Policies | Settings & Policies | PASS |
| 2 | Operability: Publish policy | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Publish policy","rect":{"top":402.890625,"left":316,"right":440.5625,"bottom":445.390625,"width":124.5625,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Publish policy (demo) | Click completes; no crash | toast=Acting as Sarah Mitchell url=http://127.0.0.1:3501/time-attendance?section=settings | PASS |

## WF-M06-CLEAR-FILTER

- Route: `/time-attendance?section=history`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-M06-CLEAR-FILTER.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Load history | Attendance History | Attendance History | PASS |
| 2 | Operability: History filter | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Find a module or section","rect":{"top":19.25,"left":46,"right":264,"bottom":38.75,"width":218,"height":19.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Clear filter | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Clear filter","rect":{"top":506.890625,"left":316,"right":419.296875,"bottom":551.390625,"width":103.296875,"height":44.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Clear filter (demo) | Filter cleared or action runs | value=demo-filter | PASS |

## WF-M06-CLIP-OPS

- Route: `live+approvals`
- Starting state: 1024 + 1440
- Outcome: **PASS**
- Screenshots: screenshots/WF-M06-CLIP-OPS-1024.png, screenshots/WF-M06-CLIP-OPS-1440.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Operability: Refresh@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Refresh live board","rect":{"top":597.890625,"left":316,"right":473.21875,"bottom":642.390625,"width":157.21875,"height":44.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 2 | Operability: BulkApprove@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Bulk approve pending","rect":{"top":354.890625,"left":316,"right":498.875,"bottom":397.390625,"width":182.875,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Refresh@1440 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Refresh live board","rect":{"top":597.890625,"left":316,"right":473.21875,"bottom":642.390625,"width":157.21875,"height":44.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Operability: BulkApprove@1440 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Bulk approve pending","rect":{"top":354.890625,"left":316,"right":498.875,"bottom":397.390625,"width":182.875,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |

## WF-EMERGENCY-1440

- Route: `/dashboard`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-EMERGENCY-1440-end.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Locate Emergency banner | Visible | visible | PASS |
| 2 | View All inside emergency card | Inside banner + viewport; no H-scroll | {"present":true,"text":"View All Announcements","rect":{"top":138,"left":1115,"right":1318.703125,"bottom":182.5,"width":203.703125,"height":44.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true,"insideParentFully":true} | PASS |
| 3 | Click View All | Modal opens | opened=true | PASS |
| 4 | Keyboard Enter on View All | Modal opens | opened=true | PASS |

## WF-EMERGENCY-1024

- Route: `/dashboard`
- Starting state: 1024x768
- Outcome: **PASS**
- Screenshots: screenshots/WF-EMERGENCY-1024-end.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Locate Emergency banner | Visible | visible | PASS |
| 2 | View All inside emergency card | Inside banner + viewport; no H-scroll | {"present":true,"text":"View All Announcements","rect":{"top":275.5,"left":490.078125,"right":693.78125,"bottom":320,"width":203.703125,"height":44.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true,"insideParentFully":true} | PASS |
| 3 | Click View All | Modal opens | opened=true | PASS |
| 4 | Keyboard Enter on View All | Modal opens | opened=true | PASS |

## WF-EMERGENCY-390

- Route: `/dashboard`
- Starting state: 390x844
- Outcome: **PASS**
- Screenshots: screenshots/WF-EMERGENCY-390-end.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Locate Emergency banner | Visible | visible | PASS |
| 2 | View All inside emergency card | Inside banner + viewport; no H-scroll | {"present":true,"text":"View All Announcements","rect":{"top":464.25,"left":29,"right":232.703125,"bottom":508.75,"width":203.703125,"height":44.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true,"insideParentFully":true} | PASS |
| 3 | Click View All | Modal opens | opened=true | PASS |
| 4 | Keyboard Enter on View All | Modal opens | opened=true | PASS |

## WF-TOPBAR

- Route: `/dashboard`
- Starting state: desktop+mobile
- Outcome: **PASS**
- Screenshots: screenshots/WF-TOPBAR-390.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Topbar Dashboard | /dashboard | http://127.0.0.1:3501/dashboard | PASS |
| 2 | Topbar Action Inbox | /action-inbox | http://127.0.0.1:3501/action-inbox | PASS |
| 3 | Search → Staff Pay | /staffpay | http://127.0.0.1:3501/staffpay | PASS |
| 4 | Mobile Open menu | visible | visible=true | PASS |
| 5 | Mobile search → Action Inbox | /action-inbox | http://127.0.0.1:3501/action-inbox | PASS |

## WF-SIDEBAR

- Route: `/dashboard`
- Starting state: 1440x900/720
- Outcome: **PASS**
- Screenshots: screenshots/WF-SIDEBAR.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Act-as usable at 1440x900 | In viewport + changeable | {"probe":{"present":true,"text":"David King · DirectorSarah Mitchell · Senior AdministratorJames Okafor · Clinic ","rect":{"top":834.125,"left":12,"right":275,"bottom":862.125,"width":263,"height":28},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true},"changed":true} | PASS |
| 2 | Act-as usable at 1440x720 | In viewport + changeable | {"probe":{"present":true,"text":"David King · DirectorSarah Mitchell · Senior AdministratorJames Okafor · Clinic ","rect":{"top":654.125,"left":12,"right":275,"bottom":682.125,"width":263,"height":28},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true},"changed":true} | PASS |
| 3 | Family toggle | aria-expanded flips | true→false | PASS |

## WF-APPEARANCE

- Route: `/dashboard`
- Starting state: Light/Dark/System
- Outcome: **PASS**
- Screenshots: screenshots/WF-APPEARANCE.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Select light | light | light | PASS |
| 2 | Select dark | dark | dark | PASS |
| 3 | Select system | system | system | PASS |
| 4 | Light + reload persist | select=light, not theme-dark | {"select":"light","themeDark":false} | PASS |
| 5 | Dark + reload persist | select=dark, theme-dark | {"select":"dark","themeDark":true} | PASS |
| 6 | System selectable | system | system | PASS |

## WF-DEEPLINK-M04

- Route: `/staff-doctors`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-DEEPLINK-M04.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Deep link overview | /Workforce overview/i | heading="Workforce overview" url=http://127.0.0.1:3501/staff-doctors?section=overview | PASS |
| 2 | Deep link people | /People directory/i | heading="People directory" url=http://127.0.0.1:3501/staff-doctors?section=people | PASS |
| 3 | Deep link staff-profiles | /Staff profiles/i | heading="Staff profiles" url=http://127.0.0.1:3501/staff-doctors?section=staff-profiles | PASS |
| 4 | Deep link doctor-profiles | /Doctor profiles/i | heading="Doctor profiles" url=http://127.0.0.1:3501/staff-doctors?section=doctor-profiles | PASS |
| 5 | Deep link engagements | /Engagements/i | heading="Engagements" url=http://127.0.0.1:3501/staff-doctors?section=engagements | PASS |
| 6 | Deep link credentials | /Credentials/i | heading="Credentials" url=http://127.0.0.1:3501/staff-doctors?section=credentials | PASS |
| 7 | Deep link leave-availability | /Leave & availability/i | heading="Leave & availability" url=http://127.0.0.1:3501/staff-doctors?section=leave-availability | PASS |
| 8 | Deep link restrictions | /Restrictions/i | heading="Restrictions & adjustments" url=http://127.0.0.1:3501/staff-doctors?section=restrictions | PASS |
| 9 | Deep link onboarding | /Onboarding/i | heading="Onboarding" url=http://127.0.0.1:3501/staff-doctors?section=onboarding | PASS |
| 10 | Deep link offboarding | /Offboarding/i | heading="Offboarding" url=http://127.0.0.1:3501/staff-doctors?section=offboarding | PASS |
| 11 | Deep link reports | /Reports/i | heading="Reports" url=http://127.0.0.1:3501/staff-doctors?section=reports | PASS |
| 12 | Deep link settings | /Settings/i | heading="Settings" url=http://127.0.0.1:3501/staff-doctors?section=settings | PASS |

## WF-DEEPLINK-M05

- Route: `/roster`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-DEEPLINK-M05.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Deep link roster-board | /Roster Board/i | heading="Roster Board" url=http://127.0.0.1:3501/roster?section=roster-board | PASS |
| 2 | Deep link coverage | /Coverage/i | heading="Coverage" url=http://127.0.0.1:3501/roster?section=coverage | PASS |
| 3 | Deep link open-shifts | /Open Shifts/i | heading="Open Shifts" url=http://127.0.0.1:3501/roster?section=open-shifts | PASS |
| 4 | Deep link availability-leave | /Availability & Leave/i | heading="Availability & Leave" url=http://127.0.0.1:3501/roster?section=availability-leave | PASS |
| 5 | Deep link requests | /Requests/i | heading="Requests" url=http://127.0.0.1:3501/roster?section=requests | PASS |
| 6 | Deep link conflicts-warnings | /Conflicts & Warnings/i | heading="Conflicts & Warnings" url=http://127.0.0.1:3501/roster?section=conflicts-warnings | PASS |
| 7 | Deep link published-history | /Published History/i | heading="Published History" url=http://127.0.0.1:3501/roster?section=published-history | PASS |
| 8 | Deep link cost-forecast | /Cost Forecast/i | heading="Cost Forecast" url=http://127.0.0.1:3501/roster?section=cost-forecast | PASS |
| 9 | Deep link reports | /Reports/i | heading="Reports" url=http://127.0.0.1:3501/roster?section=reports | PASS |
| 10 | Deep link settings | /Settings/i | heading="Settings" url=http://127.0.0.1:3501/roster?section=settings | PASS |

## WF-DEEPLINK-M06

- Route: `/time-attendance`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-DEEPLINK-M06.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Deep link live | /Live Attendance/i | heading="Live Attendance" url=http://127.0.0.1:3501/time-attendance?section=live | PASS |
| 2 | Deep link clock | /Clock In\/Out/i | heading="Clock In/Out" url=http://127.0.0.1:3501/time-attendance?section=clock | PASS |
| 3 | Deep link timesheets | /Timesheets/i | heading="Timesheets" url=http://127.0.0.1:3501/time-attendance?section=timesheets | PASS |
| 4 | Deep link exceptions | /Exceptions/i | heading="Exceptions" url=http://127.0.0.1:3501/time-attendance?section=exceptions | PASS |
| 5 | Deep link corrections | /Corrections/i | heading="Corrections" url=http://127.0.0.1:3501/time-attendance?section=corrections | PASS |
| 6 | Deep link approvals | /Approvals/i | heading="Approvals" url=http://127.0.0.1:3501/time-attendance?section=approvals | PASS |
| 7 | Deep link breaks | /Breaks/i | heading="Breaks" url=http://127.0.0.1:3501/time-attendance?section=breaks | PASS |
| 8 | Deep link history | /Attendance History/i | heading="Attendance History" url=http://127.0.0.1:3501/time-attendance?section=history | PASS |
| 9 | Deep link reports | /Reports/i | heading="Reports" url=http://127.0.0.1:3501/time-attendance?section=reports | PASS |
| 10 | Deep link settings | /Settings & Policies/i | heading="Settings & Policies" url=http://127.0.0.1:3501/time-attendance?section=settings | PASS |

## WF-DEEPLINK-M07

- Route: `/staffpay`
- Starting state: 1440x900
- Outcome: **PASS**
- Screenshots: screenshots/WF-DEEPLINK-M07.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Deep link overview | /Pay Run Overview/i | heading="Pay Run Overview" url=http://127.0.0.1:3501/staffpay?section=overview | PASS |
| 2 | Deep link people | /People Review/i | heading="People Review" url=http://127.0.0.1:3501/staffpay?section=people | PASS |
| 3 | Deep link leave | /Leave/i | heading="Leave & Allowances" url=http://127.0.0.1:3501/staffpay?section=leave | PASS |
| 4 | Deep link adjustments | /Adjustments/i | heading="Prior-period adjustments" url=http://127.0.0.1:3501/staffpay?section=adjustments | PASS |
| 5 | Deep link exceptions | /Exceptions/i | heading="Exceptions" url=http://127.0.0.1:3501/staffpay?section=exceptions | PASS |
| 6 | Deep link variances | /Variances/i | heading="Variances" url=http://127.0.0.1:3501/staffpay?section=variances | PASS |
| 7 | Deep link approval | /Approval/i | heading="Approval" url=http://127.0.0.1:3501/staffpay?section=approval | PASS |
| 8 | Deep link export | /Export/i | heading="Payroll export preparation" url=http://127.0.0.1:3501/staffpay?section=export | PASS |
| 9 | Deep link reconciliation | /Reconciliation/i | heading="Package reconciliation" url=http://127.0.0.1:3501/staffpay?section=reconciliation | PASS |
| 10 | Deep link history | /History/i | heading="History / Reports" url=http://127.0.0.1:3501/staffpay?section=history | PASS |
| 11 | Deep link settings | /Settings/i | heading="Settings" url=http://127.0.0.1:3501/staffpay?section=settings | PASS |

## WF-NAV-STATE

- Route: `multi`
- Starting state: reload+history
- Outcome: **PASS**
- Screenshots: screenshots/WF-NAV-STATE.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Reload retains M04 credentials | section=credentials | http://127.0.0.1:3501/staff-doctors?section=credentials | PASS |
| 2 | Back approvals → open-shifts | roster open-shifts | http://127.0.0.1:3501/roster?section=open-shifts | PASS |
| 3 | Forward → approvals | time-attendance approvals | http://127.0.0.1:3501/time-attendance?section=approvals | PASS |
| 4 | Reload M07 overview | section retained | http://127.0.0.1:3501/staffpay?section=overview | PASS |

## WF-A11Y-FORMS-390

- Route: `/staff-doctors?section=people`
- Starting state: 390x844
- Outcome: **PASS**
- Screenshots: screenshots/WF-A11Y-FORMS-390.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Tab Preferred name → next | Focus moves | f1=Preferred name f2=Email | PASS |
| 2 | Operability: Preferred name@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Preferred name","rect":{"top":642.6875,"left":37,"right":353,"bottom":683.1875,"width":316,"height":40.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Email@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Email","rect":{"top":691.1875,"left":37,"right":353,"bottom":731.6875,"width":316,"height":40.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Operability: Create@390 | Visible, in viewport, not covered, no page H-scroll (disabled-until-valid OK) | {"present":true,"text":"Create","rect":{"top":739.6875,"left":37,"right":353,"bottom":782.1875,"width":316,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":true,"pointerEvents":"auto","operable":true} | PASS |
| 5 | Operability: Create enabled@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Create","rect":{"top":739.6875,"left":37,"right":353,"bottom":782.1875,"width":316,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 6 | Keyboard activate Create | Enter activates | toast=Acting as Sarah Mitchell | PASS |
| 7 | Operability: Audience@390 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Audience","rect":{"top":636.1875,"left":37,"right":353,"bottom":676.6875,"width":316,"height":40.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 8 | Keyboard Offer focus+Enter | Activates | activated | PASS |

## WF-A11Y-FORMS-1024

- Route: `/staff-doctors?section=people`
- Starting state: 1024x768
- Outcome: **PASS**
- Screenshots: screenshots/WF-A11Y-FORMS-1024.png

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | Tab Preferred name → next | Focus moves | f1=Preferred name f2=Email | PASS |
| 2 | Operability: Preferred name@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Preferred name","rect":{"top":481.6875,"left":498.5,"right":652,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 3 | Operability: Email@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Email","rect":{"top":481.6875,"left":660,"right":813.5,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 4 | Operability: Create@1024 | Visible, in viewport, not covered, no page H-scroll (disabled-until-valid OK) | {"present":true,"text":"Create","rect":{"top":481.6875,"left":821.5,"right":975,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":true,"pointerEvents":"auto","operable":true} | PASS |
| 5 | Operability: Create enabled@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Create","rect":{"top":481.6875,"left":821.5,"right":975,"bottom":524.1875,"width":153.5,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 6 | Keyboard activate Create | Enter activates | toast=Acting as Sarah Mitchell | PASS |
| 7 | Operability: Audience@1024 | Visible, in viewport, not covered, no page H-scroll, enabled | {"present":true,"text":"Audience","rect":{"top":475.1875,"left":552.328125,"right":759.65625,"bottom":517.6875,"width":207.328125,"height":42.5},"visible":true,"fullyInViewport":true,"pageHorizontalScroll":false,"covered":false,"disabled":false,"pointerEvents":"auto","operable":true} | PASS |
| 8 | Keyboard Offer focus+Enter | Activates | activated | PASS |

## WF-PAYMENTS-OOS

- Route: `n/a`
- Starting state: protected
- Outcome: **OUT OF SCOPE**

| # | Action | Expected | Observed | Result |
| --- | --- | --- | --- | --- |
| 1 | External payment/provider/communication actions | OUT OF SCOPE | Not executed — bank-file, STP, super, mark-as-paid, Xero production, payment-provider returns, external communications | OUT OF SCOPE |

## Open findings

None.

## Out of scope

External payment / provider / bank-file / STP / superannuation / mark-as-paid / Xero production / payment-provider return processing / external communications — marked OUT OF SCOPE (WF-PAYMENTS-OOS).

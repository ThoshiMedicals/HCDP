# FINDINGS — Visual QA (contradiction correction v1)

**Frozen app SHA:** `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1`  
**Live base:** `http://127.0.0.1:3501`  
**Verdict:** **FAIL** — Prior 110 content-control clipping defects are visually closed at b661b6c, but new shell finding VQA-C-001 (topbar Export clip at 1024) remains OPEN.

## Open findings

### VQA-C-001 — Topbar Export control clipped at 1024px viewport width

| Field | Value |
| --- | --- |
| Status | **OPEN** |
| Severity | Medium |
| Routes | `/dashboard`, `/roster`, `/roster?section=coverage`, `/time-attendance`, `/time-attendance?section=settings`, `/staff-doctors`… |
| Themes | light, dark, system |
| Viewports | 1024x768, 1024x600 |
| Criteria | clipping, responsive transformation, alignment |

**Observation:** Shared shell topbar Export button overflows the viewport (~right 1039.8 > 1024) with no horizontal scroll parent. Trailing chrome (Enterprise Sign-In · MFA, Online) is fully off-viewport at the same width. Not present at 1280/1440; mobile shell hides Export.

**Evidence:**

- `screenshots/light-1024x768-roster_section_coverage.png`
- `screenshots/light-1024x600-dashboard.png`
- `screenshots/light-1024x768-time-attendance_section_settings.png`
- `defect-crops/VQA-C-001-light-1024x768-topbar-export-clip.png`
- `defect-crops/VQA-C-001-light-1024x768-topbar-right-edge.png`
- `defect-crops/VQA-C-001-dark-1024x768-topbar-export-clip.png`
- `defect-crops/VQA-C-001-system-1024x768-topbar-export-clip.png`
- `geometry/topbar-export-probe.json`

**Notes:** Distinct from the 110 min-content blow-out defects (module form/KPI controls). Shell chrome overcrowding at mid-desktop width.

## Closed findings (prior defect remediation)

### VQA-C-010 — M04 KPI buttons no longer clip at 430 (prior D-301/D-302/D-303 family)

- **Status:** CLOSED (screenshot evidence of fix)
- **Routes:** `/staff-doctors`
- **Viewports:** 430x932, 390x844, 768x1024, 1024x768, 1280x900
- **Observation:** ACTIVE STAFF / ACTIVE DOCTORS / BLOCKED READINESS / ON LEAVE TODAY stack full-width within content column; no viewport/ancestor clip.
- **Prior defect IDs closed (16):** D-098, D-137, D-175, D-176, D-216, D-217, D-257, D-258, D-279, D-280, D-301, D-302…
- **Evidence:** `screenshots/light-430x932-staff-doctors.png`, `screenshots/dark-430x932-staff-doctors.png`, `screenshots/system-430x932-staff-doctors.png`

### VQA-C-011 — M04 People Directory form controls no longer clip at 430/1024/1280

- **Status:** CLOSED (screenshot evidence of fix)
- **Routes:** `/staff-doctors?section=people`
- **Viewports:** 430x932, 1024x768, 1280x900
- **Observation:** Staff select, Preferred name, Email, Create are full-width stacked within card; geometry overflowContentX=false.
- **Prior defect IDs closed (14):** D-100, D-139, D-177, D-218, D-259, D-281, D-304, D-305, D-306, D-307, D-327, D-328…
- **Evidence:** `screenshots/light-430x932-staff-doctors_section_people.png`, `screenshots/dark-430x932-staff-doctors_section_people.png`, `screenshots/system-430x932-staff-doctors_section_people.png`

### VQA-C-012 — M04 Credentials form controls no longer clip at 430/1024/1280

- **Status:** CLOSED (screenshot evidence of fix)
- **Routes:** `/staff-doctors?section=credentials`
- **Viewports:** 430x932, 1024x768, 1280x900
- **Observation:** Person select, type, expiry, Add button contained; table header truncation is intentional horizontal table scroll (min-w 800).
- **Prior defect IDs closed (14):** D-102, D-141, D-178, D-219, D-260, D-282, D-308, D-309, D-310, D-311, D-331, D-332…
- **Evidence:** `screenshots/light-430x932-staff-doctors_section_credentials.png`, `screenshots/dark-430x932-staff-doctors_section_credentials.png`

### VQA-C-013 — M05 Open Shifts Offer form no longer clips at 390/430/1024/1440

- **Status:** CLOSED (screenshot evidence of fix)
- **Routes:** `/roster?section=open-shifts`
- **Viewports:** 390x844, 430x932, 1024x768, 1440x900
- **Observation:** Shift select, Audience, Offer fully inside card; no content blow-out.
- **Prior defect IDs closed (22):** D-012, D-044, D-076, D-194, D-235, D-312, D-313, D-314, D-335, D-336, D-337, D-349…
- **Evidence:** `screenshots/light-390x844-roster_section_open-shifts.png`, `screenshots/light-430x932-roster_section_open-shifts.png`, `screenshots/system-390x844-roster_section_open-shifts.png`, `screenshots/dark-430x932-roster_section_open-shifts.png`

### VQA-C-014 — M05 Coverage/Availability/Conflicts/Settings/Board create controls contained

- **Status:** CLOSED (screenshot evidence of fix)
- **Routes:** `/roster`, `/roster?section=coverage`, `/roster?section=availability-leave`, `/roster?section=conflicts-warnings`, `/roster?section=settings`
- **Viewports:** 1024x768, 1280x900, 1440x900
- **Observation:** Evaluate coverage, Evaluate conflicts, Create draft, Clinic id / Ends on / Create period remain inside content column.
- **Prior defect IDs closed (18):** D-107, D-146, D-184, D-190, D-225, D-231, D-347, D-348, D-361, D-362, D-375, D-376…
- **Evidence:** `screenshots/light-1024x768-roster_section_coverage.png`, `screenshots/light-1024x768-roster.png`, `screenshots/light-1024x768-roster_section_settings.png`, `screenshots/light-1024x768-roster_section_conflicts-warnings.png`…

### VQA-C-015 — M06 Refresh / Bulk Approve / Request Correction / Clear Filter / Publish contained

- **Status:** CLOSED (screenshot evidence of fix)
- **Routes:** `/time-attendance`, `/time-attendance?section=approvals`, `/time-attendance?section=corrections`, `/time-attendance?section=history`, `/time-attendance?section=settings`
- **Viewports:** 1024x768, 1280x900, 1440x900
- **Observation:** Action buttons fully visible with natural width; no stretch-to-blown-grid clip.
- **Prior defect IDs closed (24):** D-016, D-023, D-048, D-055, D-080, D-087, D-119, D-126, D-158, D-165, D-199, D-206…
- **Evidence:** `screenshots/light-1440x900-time-attendance.png`, `screenshots/light-1280x900-time-attendance.png`, `screenshots/light-1024x768-time-attendance.png`, `screenshots/light-1440x900-time-attendance_section_approvals.png`…

### VQA-C-016 — Remaining prior 110 meaningful-control surfaces visually closed

- **Status:** CLOSED (screenshot evidence of fix)
- **Routes:** `/staff-doctors?section=engagements`
- **Viewports:** varied — see DEFECT_RECONCILIATION_110
- **Observation:** Re-inspected via full 840-shot matrix + focused geometry; no remaining content-control outsideViewport/clippedByAncestor without intentional scroll exemption.
- **Prior defect IDs closed (2):** D-389, D-497
- **Evidence:** `geometry/prior-defect-reprobe.json`, `CAPTURE_META.json`

## Prior 110 reconciliation

- Meaningful prior defects from `phase1-reproduction/DEFECT_RECONCILIATION_110.json`: **110**
- Visually OPEN after this pass: **0**
- Visually CLOSED after this pass: **110**

None of the 110 prior content-control clipping defects remain visually open at `b661b6c`.

## Exemptions noted

- Module section-nav desktop tabs use intentional horizontal scroll (.module-section-nav__scroller overflow-x:auto; scrollWidth>clientWidth). Edge-cut of last visible tab before scroll is expected, not a content blow-out defect.
- Table min-w-[800px] headers/actions may truncate until horizontal scroll inside Table overflow-auto wrapper — intentional.

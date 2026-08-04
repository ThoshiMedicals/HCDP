# FINDINGS — Visual QA (final-b1d0683)

**Frozen app SHA:** `b1d0683057882546b68c73b1ae679630d8dbbcb8`  
**Live base:** `http://127.0.0.1:3501`  
**Verdict:** **FAIL** — VQA-C-001 is CLOSED with screenshot proof, and the prior 110 content-control clipping defects remain visually closed, but new OPEN shell finding **VQA-C-017** (ribbon search crush at 1024) remains.

## Open findings

### VQA-C-017 — Topbar ribbon search field crushed at mid-desktop width

| Field | Value |
| --- | --- |
| Status | **OPEN** |
| Severity | Medium |
| Routes | Shared shell (`/dashboard`, modules, settings…) |
| Themes | light, dark, system |
| Viewports | 1024x768, 1024x600 |
| Criteria | clipping, responsive transformation, alignment |

**Observation:** Ribbon search input (`aria-label="Search modules and sections"`) collapses to ~44.5px content width at 1024, so the placeholder reads only “Sear”. Distinct from VQA-C-001. At 1280 ≈110px (still tight); at 1440 ≈270px (readable). At 1536 ≈151px after Enterprise returns.

**Evidence:**

- `defect-crops/VQA-C-017-light-1024x768-ribbon-search-crush.png`
- `defect-crops/VQA-C-017-light-1024x768-topbar-search-zone.png`
- `defect-crops/VQA-C-017-dark-1024x768-ribbon-search-crush.png`
- `defect-crops/VQA-C-017-system-1024x768-ribbon-search-crush.png`
- `screenshots/light-1024x768-dashboard.png`
- `screenshots/light-1024x768-time-attendance.png`
- `geometry/ribbon-search-probe.json`

## Closed findings

### VQA-C-001 — Topbar Export / New Entry / Enterprise / Online responsive containment

| Field | Value |
| --- | --- |
| Status | **CLOSED** (screenshot proof of fix) |
| Severity | Medium |
| Viewports re-checked | 1024, 1280, 1440, 1536 (+1024x600) |

**Observation:**

- **1024:** Export and + New Entry intentionally `hidden` until `xl`; Enterprise hidden until `2xl`; **Online fully in viewport** (right ≈ 1010 ≤ 1024). No Export clip / no “Expor…” ellipsis.
- **1280 / 1440:** Export and + New Entry fully visible with complete “Export” label; Enterprise still hidden; Online in viewport.
- **1536 (`2xl`):** Enterprise Sign-In · MFA appears; Export / + New Entry / Enterprise / Online all fully inside viewport.

**Geometry:** 84/84 topbar probes `passAll=true` (`geometry/topbar-export-probe.json`).

**Evidence:**

- `defect-crops/VQA-C-001-light-1024x768-topbar-right.png`
- `defect-crops/VQA-C-001-light-1024x768-topbar-full.png`
- `defect-crops/VQA-C-001-light-1280x900-topbar-right.png`
- `defect-crops/VQA-C-001-light-1440x900-topbar-right.png`
- `defect-crops/VQA-C-001-light-1536x900-topbar-right.png`
- `defect-crops/VQA-C-001-dark-1024x768-topbar-right.png`
- `defect-crops/VQA-C-001-system-1280x900-topbar-right.png`
- `screenshots/light-1024x768-dashboard.png` / `…-1280…` / `…-1440…` / `…-1536…`

### VQA-C-010 — M04 KPI buttons contained at 430

- **Status:** CLOSED
- **Evidence:** `screenshots/light-430x932-staff-doctors.png` (+ dark/system)

### VQA-C-011 — M04 People Directory form controls contained

- **Status:** CLOSED
- **Evidence:** `screenshots/light-430x932-staff-doctors_section_people.png` (+ dark/system)

### VQA-C-012 — M04 Credentials form controls contained

- **Status:** CLOSED
- **Evidence:** `screenshots/light-430x932-staff-doctors_section_credentials.png` (+ dark)
- Table header edge-cut remains intentional `min-w-[800px]` scroll.

### VQA-C-013 — M05 Open Shifts Offer form contained

- **Status:** CLOSED
- **Evidence:** `screenshots/light-390x844-roster_section_open-shifts.png`, `…-430x932-…`

### VQA-C-014 — M05 Coverage / Availability / Conflicts / Settings / Board controls contained

- **Status:** CLOSED
- **Evidence:** `screenshots/light-1024x768-roster_section_coverage.png`, `…-roster.png`, `…-settings.png`, …

### VQA-C-015 — M06 Refresh / Bulk Approve / Request Correction / Clear Filter / Publish contained

- **Status:** CLOSED
- **Evidence:** `screenshots/light-1024x768-time-attendance.png` (+ 1280/1440 approvals/corrections/history/settings)

### VQA-C-016 — Remaining prior 110 meaningful-control surfaces visually closed

- **Status:** CLOSED
- **Evidence:** `geometry/prior-defect-reprobe.json`, `geometry/prior-control-visual-probe.json`

## Prior 110 reconciliation

- Meaningful prior defects from `phase1-reproduction/DEFECT_RECONCILIATION_110.json`: **110**
- Visually OPEN after this pass: **0**
- Visually CLOSED after this pass: **110**

## Exemptions noted

- Module section-nav desktop tabs use intentional horizontal scroll (`.module-section-nav__scroller`). Edge-cut of last visible tab before scroll is expected.
- Table `min-w-[800px]` headers/actions may truncate until horizontal scroll inside Table `overflow-auto` wrapper — intentional.

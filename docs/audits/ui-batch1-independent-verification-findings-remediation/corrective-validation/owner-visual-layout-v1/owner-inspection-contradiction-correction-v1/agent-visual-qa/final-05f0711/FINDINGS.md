# Visual QA Findings — final-05f0711

**Frozen app SHA:** `05f07119ec2883b7ec7a2da6bbe3b5162257c2ec`  
**Live base:** `http://127.0.0.1:3501`  
**Verdict:** **PASS** — VQA-C-001, VQA-C-017, and the prior 110 content-control clipping surfaces are visually CLOSED with screenshot proof.

## Must-close findings

### VQA-C-001 — Topbar Export / New Entry / Enterprise / Online responsive containment

- **Status:** CLOSED
- **Severity:** Medium
- **Observation:** At 1024 / 1280 / 1440, Export and + New Entry (and Enterprise MFA) are intentionally hidden until `2xl`; Online remains fully inside the viewport. At 1536, Export, + New Entry, Enterprise MFA, and Online all render fully inside the viewport (Online right ≈1522 ≤ 1536). 84/84 topbar probes pass.
- **Evidence:**
  - `defect-crops/VQA-C-001-light-1024x768-topbar-right.png`
  - `defect-crops/VQA-C-001-light-1280x900-topbar-right.png`
  - `defect-crops/VQA-C-001-light-1440x900-topbar-right.png`
  - `defect-crops/VQA-C-001-light-1536x900-topbar-right.png`
  - `defect-crops/VQA-C-001-dark-1024x768-topbar-right.png`
  - `defect-crops/VQA-C-001-system-1280x900-topbar-right.png`
  - `screenshots/light-1024x768-dashboard.png`
  - `screenshots/light-1536x900-dashboard.png`
  - `geometry/topbar-export-probe.json`
- **Notes:** Hide-until-2xl is accepted remediation, not clipping. Distinct from dashboard content-bar Export / Create Action controls.

### VQA-C-017 — Topbar ribbon search crushed at mid-desktop

- **Status:** CLOSED
- **Severity:** Medium
- **Observation:** Ribbon search input width is ≥160px at 1024 (476px, second ribbon row), 1280 (300.5px), and 1440 (396px). At 1536 search remains usable at 212.5px with full placeholder. 84/84 search probes pass. Closes OPEN state from `final-b1d0683` (~44px / “Sear”).
- **Evidence:**
  - `defect-crops/VQA-C-017-light-1024x768-topbar-search-zone-tall.png`
  - `defect-crops/VQA-C-017-light-1024x768-ribbon-search-usable.png`
  - `defect-crops/VQA-C-017-dark-1024x768-ribbon-search-usable.png`
  - `defect-crops/VQA-C-017-system-1024x768-ribbon-search-usable.png`
  - `screenshots/light-1024x768-dashboard.png`
  - `geometry/ribbon-search-probe.json`

## Prior module clipping (VQA-C-010…016 / prior 110)

### VQA-C-010 — M04 KPI buttons contained at 430

- **Status:** CLOSED
- **Evidence:** `screenshots/light-430x932-staff-doctors.png` (+ dark/system) — ACTIVE STAFF / ACTIVE DOCTORS / BLOCKED READINESS / ON LEAVE TODAY stack full-width; no horizontal clip.

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

- Module section-nav desktop tabs use intentional horizontal scroll (`.module-section-nav__scroller`). Edge-cut of last visible tab (e.g. “Published & History” at 1024) before scroll is expected.
- Table `min-w-[800px]` headers/actions may truncate until horizontal scroll inside Table `overflow-auto` wrapper — intentional.
- Closed mobile drawer “Act as User / Role” at negative X is off-canvas, not content clipping.
- Sidebar nav items below the fold (vertical scroll) are not horizontal content-control clipping.

## Totals

| Metric | Value |
| --- | ---: |
| Screens inspected | **858** |
| Capture errors | **0** |
| Topbar probes | 84 (fails 0) |
| Search probes | 84 (fails 0) |
| VQA findings OPEN | **0** |
| VQA findings CLOSED | **9** (VQA-C-001, VQA-C-017, VQA-C-010…016) |
| Prior 110 visually OPEN | **0** |
| Prior 110 visually CLOSED | **110** |

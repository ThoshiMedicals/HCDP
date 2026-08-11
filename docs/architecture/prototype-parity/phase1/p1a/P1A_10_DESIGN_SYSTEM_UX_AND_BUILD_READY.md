# P1A Design System, UX Upgrade Audit & Build-Ready Design Spec

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## A. Design-system SoT

- `FINAL_DESIGN_SYSTEM_CONTRACT.md` + `design-system-contract.json`  
- Decision A PNGs @ `66e6e6488b27b9098dadd8962473fedea5053614`  
- Appearance: Light / Dark / System only (`DEC-BRANDED-THEMES`)  
- Forbidden globals: Executive Blue, Medical Emerald  

## B. Component catalogue (current vs contract)

| Component | Current | Contract target | Upgrade class |
| --- | --- | --- | --- |
| Sidebar | Implemented | 240/72 dims evidenced | Align/evidence |
| Topbar | Implemented; stubs | 48 height; truthful controls | Honesty + align |
| Module section nav | Shared | 40 height; keyboard | Align/a11y |
| Page header | Partial | 56 height | Align |
| KPI strip | Mostly M01-local | Shared primitive | New shared |
| Primary toolbar | Mixed | Shared 44 height | New shared |
| Detail panel / drawer | Drawer exists | 320–420 band | Align |
| Tables/filters/chips | Module-local | Density tokens | Align |
| Modals | UI primitives | Sizes 480/640/800 | Align |
| Toasts | Present | Must not fake success | Honesty |
| Theme tokens | Partial CSS vars | Full `--dp-*` set | Align |

## C. UX upgrade audit — 20 dimensions

Classification: **Parity-required** · **Accepted difference** · **Future** · **Excluded** · **Definition gap**

| # | Dimension | SHARED | M01–M03 | M04–M07/M11 | M08–M24 PH | Classification |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Screens/routes | Partial | Routes; thin domain | Strong | Landing | Parity-required (honesty) / Future (rebuilds) |
| 2 | Tabs/sections | Shared nav | Present | Present | Chips | Parity-required |
| 3 | Data states | N/A/demo | Seed heavy | Domain | None | Definition gap + Future |
| 4 | Actions | Mixed stub/real | Many UI | Domain | None | Honesty / Future |
| 5 | Forms | Appearance | Partial | Domain | None | Future outside P1 |
| 6 | Filters/search | Nav search | Varies | Domain | None | Parity-required consistency |
| 7 | Drill-downs | Drawer | Present | Present | None | Parity-required primitives |
| 8 | Roles/permissions | Nav gate | Classification | Enforced domain | Badge | Parity-required denied UX |
| 9 | Alerts | Toasts/demo | M02 UI | Domain | None | Honesty |
| 10 | Empty/load/error/denied | Partial | Partial | Partial→good | N/A | Parity-required |
| 11 | Audit | N/A chrome | Absent durable | Present | None | Honesty / P2 |
| 12 | Reports/export/print | Stub export | Demo | Varies | None | Honesty / Future |
| 13 | Responsive | Partial | Partial | Partial | Landing | Parity-required |
| 14 | Appearance L/D/S | Implemented | Shared | Shared | Shared | Parity-required evidence |
| 15 | A11y/keyboard | Partial | Partial | Partial | Minimal | Parity-required |
| 16 | Demo/reset | Present | Heavy | Some | None | Owner disposition |
| 17 | Business rules | N/A | Thin | Qualified | None | Future / frozen |
| 18 | Prototype-only | Dual surface OK | Seed titles | Quals | Entire | Accepted difference / Future |
| 19 | Material dash diffs | Batch1 | De-crowded | Pending design | N/A | Accepted difference / Parity |
| 20 | Patient/clinical | Firewall | Mock ops titles | Workforce | M08 wording risk | Excluded |

## D. Build-ready design specification system (planned)

| Artefact | Purpose | Status |
| --- | --- | --- |
| Tokens (`--dp-*`) | Colour/type/space | Contract exists; apply incomplete |
| Component spec sheets | States: default/hover/focus/disabled/loading/error/denied | Partial |
| Page templates | Shell + KPI + toolbar + table + detail | Partial |
| Viewport matrix | 390, 430, 768, 1024, 1280, 1440, ref 1672×941, 125% zoom | Contract; harness incomplete |
| A11y annotations | Focus order, labels, live regions | Missing bulk — DEF-GAP-013 |
| Content honesty annotations | Demo vs durable vs non-op | Needed for B2 |
| Visual QA tolerances | Decision A regions | In contract; P1 exit incomplete |

### Conflicts needing owner decisions

| Conflict | Decision |
| --- | --- |
| Clinic multi-select shell-wide vs CC-only | OWN-P1-005 |
| Stub controls hide vs label | OWN-P1-004 |
| Demo menus visibility | OWN-P1-008 |
| Broad vs narrow P1 design apply | OWN-P1-002 |

Do not silently invent a third visual system.

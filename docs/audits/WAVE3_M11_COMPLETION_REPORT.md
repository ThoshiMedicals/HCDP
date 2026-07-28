# Wave 3 Acceptance Report — Module 11 Training & Learning

**Date:** 27 July 2026  
**Codebase:** `Development folder/`  
**Owner acceptance:** **GRANTED** 27 July 2026  

## Status

**Wave 3: Owner accepted and frozen.**

This acceptance is based on the final amended completion evidence in this file (closure gate) and covers:

- the Module 11 source of truth and all 11 functional sections;
- the ten approved M11 workflows;
- versioned catalogue, requirements and policy behaviour;
- recurrence, assessment, competency, evidence, certificates and exemptions;
- clinic-IANA-timezone calculations;
- service-layer permissions and clinic-scope enforcement;
- sensitive-evidence masking and scoped exports;
- M11 training-status contributions to the authoritative M04 readiness result;
- M05 consumption of the M04/platform eligibility authority;
- M02 action creation, deduplication, update, closure and stale-replay protection;
- role-specific, responsive, accessibility and keyboard evidence;
- light, dark and device/system appearance modes;
- all seven designed functional UX states;
- migration, seed, rollback, performance and regression evidence.

**Not included:** production deployment approval.

## Preserve under freeze

- frozen Wave 2 functionality and data;
- M11 immutable and effective-dated history;
- canonical and legacy identifiers;
- service-layer permissions and clinic scope;
- module ownership and contract boundaries;
- M04 as the owner of combined workforce readiness;
- M05’s use of the M04/platform eligibility authority (read-only until Wave 4);
- M02 lifecycle and stale-event protections;
- clinic IANA timezone behaviour;
- non-destructive, idempotent migration and rollback boundaries;
- the prohibition on legacy dual-write and cross-module repository imports.

## Deferred (still outstanding — not production-ready)

- authenticated production server APIs;
- production database persistence and transactions;
- optimistic concurrency and offline conflict resolution;
- full WCAG assessment beyond the tested primary paths;
- M11-to-M04 workforce-credential promotion;
- any other deferred integration recorded below / historically in Wave 2–3 reports.

## Wave 4 / Wave 5

**Wave 4 (M05): Owner accepted and frozen** (28 July 2026).  
Accepted implementation checkpoint: `15f020800bbca40702ef08ad25f94f1d1999112f`.  
Evidence: `docs/audits/WAVE4_M05_COMPLETION_REPORT.md`.  
**`BLOCKED-M10` remains blocked** (workflow 12).

**WAVE 5 EXECUTION IS NOT APPROVED.**  
Wave 5 planning document: `docs/architecture/WAVE5_M06_IMPLEMENTATION_PLAN.md`.  
Wave 5 remains planning-only until explicit owner execution approval.



---

## Closure gate evidence (accepted baseline)

| Gate | Result |
|---|---|
| Clinic IANA timezone calculations | **pass** |
| M02 create / update / dedupe / close / stale-replay | **pass** |
| Clinic-scope service-layer enforcement | **pass** |
| Appearance light / dark / device | **pass** |
| Seven functional UX states | **pass** |
| Fresh gates re-run | **pass** |

### Clinic timezone

UTC is **not** an authoritative clinic-day proxy. Implementation: `src/platform/workforce/services/clinic-timezone.ts`.

| Scenario | Result |
|---|---|
| Auckland date boundary vs UTC | **pass** |
| Due → overdue on clinic calendar | **pass** |
| Grace ending | **pass** |
| Certificate / recurring expiry | **pass** |
| Deterministic same `asOf` | **pass** |
| Missing TZ → explainable unresolved (no silent UTC) | **pass** |

### M02 lifecycle

Keys: `training::training-overdue::`, `training::certificate-expired::`, `training::exemption-expiring::`.

| Projection | Create | Dedupe | Update | Close | Stale replay blocked |
|---|---|---|---|---|---|
| Training overdue | pass | pass | pass | pass | pass |
| Certificate expiry | pass | pass | pass | pass | pass |
| Exemption expiring | pass | pass | pass | pass | pass |

### Clinic-scope (service layer)

In-scope success; out-of-scope deny; multi-clinic bulk partial fail; sensitive evidence masking; scoped export — all **pass**.

### Appearance (three modes)

`ux.appearance.light`, `ux.appearance.dark`, `ux.appearance.device` — all **pass**.

### UX states (seven)

loading, empty, filtered-empty, restricted, validation-error, system-error, offline — all **pass** (`ux.state.*`).

### Fresh gate counts (acceptance baseline)

| Suite | Pass | Fail | Skipped | Blocked |
|---|---|---|---|---|
| Workforce contracts | 18 | 0 | 0 | 0 |
| Auth Wave 1A | 16 | 0 | 0 | 0 |
| M04 domain | 16 | 0 | 0 | 0 |
| M11 domain + closure + performance | 37 | 0 | 0 | 0 |
| Platform integration QA | 152 | 0 | 0 | 0 |
| Playwright Wave 3 acceptance | 42 | 0 | 0 | 0 |
| lint / tsc / production build | pass | — | 0 | 0 |

Evidence artifacts: `wave3-m11-acceptance-evidence.json`, `wave3-m11-performance-evidence.json`.

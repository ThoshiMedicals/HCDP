# P1C API and Integration Contracts

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Current integration style (observed)

| Style | Status |
| --- | --- |
| In-process module adapters / platform contracts | Present pattern for workforce family |
| Browser localStorage persistence | Primary runtime persistence |
| External HTTP public API (OpenAPI) | **Absent** |
| Payment provider / bank / STP / Xero production | **Excluded** |
| Clinical/Best Practice patient API import | **Excluded** |

## Contract catalogue (planning)

| Contract | Direction | SoR | Status | Notes |
| --- | --- | --- | --- | --- |
| TimesheetRef / `timesheet.approved` | M06 → M07 | M06 | Implemented (wave) | No M06 repo import into M07 |
| WorkforcePersonRef / EngagementRef | M04 → consumers | M04 | Implemented (wave) | |
| Roster published refs | M05 → M07 variances | M05 | Implemented (wave) | |
| Action inbox projections | Producers → M02 | Mixed | IN-DEVELOPMENT | |
| Export package CSV+JSON | M07 → external payroll | External pay SoR | Prep only | Not mark-as-paid |
| Identity subject | IdP → profiles | External IdP | Planned (AUTH) | Demo Act-as today |
| Best Practice / clinical PAS | External clinical | Clinical SoR | **Boundary only** | Integration refs must not import patient records, appointments, clinical notes, prescriptions, referrals, clinical billing |

## Best Practice / clinical boundary (mandatory)

Allowed: connector status, de-identified operational aggregates, workforce pay context wording that does not store BP patient records.  
Forbidden: storing/duplicating patient clinical SoR inside Doctors Pulse.

## Gaps

| ID | Gap | Closure stage |
| --- | --- | --- |
| INT-GAP-001 | No OpenAPI/asyncAPI catalogue for future server APIs | S7 |
| INT-GAP-002 | No versioned external connector SDK policy | S7 |
| INT-GAP-003 | M10 connective layer BLOCKED | P3 |
| INT-GAP-004 | M01/M02 producer projections incomplete | P2 |

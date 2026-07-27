# Workforce Family — Data Map and Proposed Migration Map (Wave 0)

**Date:** 27 July 2026  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md` (v1.0)  
**Companion audit:** `docs/audits/WORKFORCE_FAMILY_CURRENT_STATE.md`  
**Status:** Proposed for owner review. No migrations executed in Wave 0.

---

## 1. Purpose

Map every current workforce-related data source, route and schema to its **approved owning module** and **target storage / section**. Identify what Wave 1 must create before any full module UI.

---

## 2. Source-of-truth ownership (target)

| Information | Owning module | Referenced by | Current state |
|---|---|---|---|
| Candidate | M22 | Hiring until promotion | Landing only; no candidate store |
| Person | M04 | M05, M06, M07, M11, M02, M01 | Portal `records.staff` / `records.doctors` (session) |
| Engagement / role / clinic scope | M04 | M05, M06, M07, M11, M03 | Flat role/location fields on seed rows only |
| Credential | M04 | M05, M11, M02, M01 | Seed `cprExpiry` / immunisation fields; M02 WWCC demo action only |
| Leave / availability / restriction | M04 | M05, M06, M07 | Schema extract `leave` only; no store |
| Training / competency | M11 | M04 readiness, M05 eligibility | Schema extract `training`; M03 `trainingComplete` flag (access, not SoT) |
| Roster period / shift | M05 | M06, M07, M10, M01 | Schema extract `roster` / `shiftswap`; M01 staffing seed counts |
| Clock event / timesheet | M06 | M07, M01 | Schema extract `timeclock`; no store |
| Payroll prep / export / reconciliation | M07 | External payroll, M01 | Schema extract `staffpay` / `awardRules`; M01 `staffPay` finance seed |
| Action requiring work | Source module → M02 projection | M02 | M02 seed WWCC + roster publish demos only |

**Rule after promotion:** person exists once in M04. M05–M07 and M11 store references only.

---

## 3. Legacy route → approved internal section map

| Legacy / incoming | Approved route | Approved section | Target plan section (later waves) | Notes |
|---|---|---|---|---|
| `/staff` | `/staff-doctors` | `staff` | People Directory / Staff Profiles | Working redirect |
| `/doctors` | `/staff-doctors` | `doctors` | People Directory / Doctor Profiles | Working redirect |
| `/hr-docs` | `/staff-doctors` | `hr-documents` | Credentials / Documents (plan) | Redirect only; no distinct HR docs UI |
| `/staff-doctors` | `/staff-doctors` | (query) | M04 sections | Main route |
| `/roster` | `/roster` | (query) | Roster Board etc. | Main route; chips decorative |
| `/timeclock` | `/time-attendance` | `attendance` | Live Attendance / My Clock | Working redirect |
| `/sync-centre` | `/time-attendance` | `offline-reconciliation` | Offline Reconciliation | Working redirect |
| `/time-attendance` | `/time-attendance` | (query) | M06 sections | Main route |
| `/staffpay` | `/staffpay` | (query) | M07 sections | Main route |
| `/training` | `/training` | (query) | M11 sections | Main route |
| `/recruitment` | `/recruitment` | (query) | M22 sections | Main route |

Preserve on redirect: `recordId`, `recordType`, `id`, `tab`, `category`, `clinicId`, `q`, `view`, `section` override.

---

## 4. Current data sources → target storage keys

| Current source | Location | Durability | Target owner | Target keys (Wave 1+) |
|---|---|---|---|---|
| `HTML_STAFF` / `records.staff` | `staff.json` + portal state | Session only | M04 person | `pulse.m04.workforce.people` (exact key names TBD in Wave 1) |
| `HTML_DOCTORS` / `records.doctors` | `doctors.json` + portal state | Session only | M04 person (doctor type) | Same M04 people store; type/engagement distinguishes doctor |
| Field schema `staff` / `doctors` / `hrDocs` | `field-schemas.json` | Static extract | M04 forms | Migrate into M04 validation; do not keep as SoT |
| Field schema `leave` | `field-schemas.json` | Static | M04 leave/availability | `pulse.m04.workforce.leave.*` |
| Field schema `roster` / `shiftswap` | `field-schemas.json` | Static | M05 | `pulse.m05.roster.*` |
| Field schema `timeclock` | `field-schemas.json` | Static | M06 | `pulse.m06.attendance.*` |
| Field schema `staffpay` / `awardRules` | `field-schemas.json` | Static | M07 | `pulse.m07.staffpay.*` |
| Field schema `training` | `field-schemas.json` | Static | M11 | `pulse.m11.training.*` |
| Staff wizard JSON | `staff-wizard.json` | Static | M04 onboarding UX | Inform M04 create flows |
| M01 `STAFFING` / finance `staffPay` | `command-centre/mock-data.ts` | M01 seed UI | Remains M01 projection until Wave 8 wires real counts | Do **not** migrate into M04–M07 stores |
| M02 WWCC / roster publish seeds | `action-inbox/mock-data.ts` | `pulse.m2.inbox.*` | Remains M02 projections | Later: published by M04/M05 adapters |
| M03 `trainingComplete` | `organisation` store | `pulse.org.m3.state` | Remains M03 access attribute | Not M11 SoT; later may consume M11 readiness refs |
| M03 `export.sensitive.payroll` | organisation mock | M03 permissions | Remains M03 | Consumed by M07 later |

### Declared vs planned prefixes

| Declared today (`module.config`) | Planned namespace (architecture plan) |
|---|---|
| `pulse.m04.` | `pulse.m04.workforce.*` |
| `pulse.m05.` | `pulse.m05.roster.*` |
| `pulse.m06.` | `pulse.m06.attendance.*` |
| `pulse.m07.` | `pulse.m07.staffpay.*` |
| `pulse.m11.` | `pulse.m11.training.*` |
| `pulse.m22.` | `pulse.m22.recruitment.*` |

Wave 1 must define exact key names, versions and idempotent migration skeletons. Components must not write `localStorage` directly.

---

## 5. Shared workforce contracts to introduce (Wave 1)

Create under `src/platform/workforce/contracts/`:

| Contract | Purpose |
|---|---|
| `WorkforcePersonRef` | Stable person reference after M04 ownership |
| `EngagementRef` | Effective-dated role/clinic engagement |
| `ReadinessRef` | Aggregated readiness for roster/eligibility |
| `CredentialRef` | Credential status projection |
| `TrainingStatusRef` | M11 → M04/M05 training status |
| `ShiftRef` | Published/planned shift reference |
| `AttendanceRef` | Clock/attendance event reference |
| `TimesheetRef` | Approved timesheet reference |
| `PayPeriodRef` | Pay period / export reference |
| `CandidateRef` | Pre-promotion candidate reference |

Each ref must include: owning module, record ID, clinic/organisation scope, status, route, safe display label.

### Required domain events (Wave 1 definitions; producers later)

`candidate.promoted`, `engagement.created`, `engagement.changed`, `worker.status.changed`, `credential.status.changed`, `training.assignment.created`, `training.status.changed`, `competency.status.changed`, `leave.approved`, `availability.changed`, `restriction.changed`, `roster.published`, `shift.created`, `shift.changed`, `shift.cancelled`, `attendance.event.recorded`, `attendance.exception.created`, `attendance.exception.resolved`, `timesheet.approved`, `payperiod.status.changed`, `payroll.export.created`, `payroll.reconciliation.completed`, `worker.offboarding.started`, `worker.offboarding.completed`.

Events: idempotent; include event ID, source version, time, active identity, clinic scope, source-record reference.

Cross-module path:

```text
source module → module adapter → shared platform contract/service → destination projection
```

Modules must not import another module’s internal repository.

---

## 6. Proposed target folder structure (from plan — Wave 1+)

```text
src/modules/
  m04-staff-doctors/   (+ types, sections, repository, services, adapters, storage, …)
  m05-roster/
  m06-time-attendance/
  m07-staff-pay/
  m11-training/
  m22-recruitment/

src/platform/workforce/
  contracts/
  services/
  validation/
  tests/
```

Use `src/platform/workforce/` **only** for cross-module contracts and projection services. Module-specific rules stay in the owning module.

---

## 7. Register section expansion map (later waves; not Wave 0)

| Module | Keep / redirect current section ids | Expand toward plan IA |
|---|---|---|
| M04 | Keep `staff`, `doctors`, `credentials`, `availability`, `offboarding`, `hr-documents` as aliases where useful | Add Overview, Engagements, Leave, Restrictions, Onboarding, Reports, Settings |
| M05 | Keep `roster-grid`, `shift-swaps`, `publish` as aliases | Add Coverage, Open Shifts, Conflicts, Cost Forecast, History, Reports, Settings |
| M06 | Keep existing five ids | Add My Clock, Approval History, Reports, Settings |
| M07 | Keep `pay-prep`, `exceptions`, `exports` | Add Variances, Adjustments, Approval, Reconciliation, History, Reports, Settings |
| M11 | Keep `records`, `expiry`, `catalogue` | Add My Learning, Assignments, Sessions, Assessments, Competencies, Exemptions, Reports, Settings |
| M22 | Keep `vacancies`, `candidates`, `onboarding` | Add Requisitions, Interviews, Offers, Talent Pool, Promotion, Reports, Settings |

Legacy aliases must continue to resolve to the correct internal section after expansion.

---

## 8. M01–M03 non-regression data boundaries

| Consumer | May read (later) | Must not become SoT for |
|---|---|---|
| M01 | Aggregated workforce counts / readiness summaries via adapters | People, shifts, attendance, pay runs, training records |
| M02 | Actionable projections from source modules | Same as above |
| M03 | Identity/access; may reference M04 person / M11 readiness later | Candidate, person, roster, attendance, payroll preparation |

Do not overwrite: `pulse.cc.*`, `pulse.cc.m1.*`, `pulse.m2.inbox.*`, `pulse.org.m3.state`, `pulse.platform.context.*`.

---

## 9. Reusable extract → migration inputs

These are **inputs** for Wave 1+ design, not live module storage:

| Extract | Suggested consumer |
|---|---|
| `staff.json` (100) | M04 demo people seed (staff) |
| `doctors.json` (48) | M04 demo people seed (doctors) |
| `staff-wizard.json` | M04 create/onboarding UX |
| `field-schemas.json` keys listed in §4 | Module form validation baselines |
| M02 WWCC / roster seeds | Adapter contract examples for M02 projections |
| M01 staffing snapshot shape | M01 executive summary adapter interface |

Seed parity goal: retain demo volume (100 staff / 48 doctors) when introducing M04 repositories, then version through migrations.

---

## 10. Exact files expected to change in Wave 1

Wave 1 scope per controlling plan: **shared workforce foundation only** — no full module screens.

### Expected to create

```text
src/platform/workforce/contracts/workforce-person-ref.ts
src/platform/workforce/contracts/engagement-ref.ts
src/platform/workforce/contracts/readiness-ref.ts
src/platform/workforce/contracts/shift-ref.ts
src/platform/workforce/contracts/attendance-ref.ts
src/platform/workforce/contracts/pay-period-ref.ts
src/platform/workforce/contracts/candidate-ref.ts
src/platform/workforce/contracts/workforce-events.ts
  (+ CredentialRef / TrainingStatusRef / TimesheetRef as needed)
src/platform/workforce/services/workforce-event-bus.ts
src/platform/workforce/services/readiness-projection.ts
src/platform/workforce/services/workforce-link-resolver.ts
src/platform/workforce/validation/workforce-reference-validation.ts
src/platform/workforce/tests/workforce-contracts.test.ts

src/modules/m04-staff-doctors/storage/   (keys + migration skeleton)
src/modules/m05-roster/storage/
src/modules/m06-time-attendance/storage/
src/modules/m07-staff-pay/storage/
src/modules/m11-training/storage/
src/modules/m22-recruitment/storage/

Repository interface files under each module (no cross-module repository editing)
Adapter interface stubs for Action Inbox, notification, audit, executive summary
Demo reference fixtures (person, engagement, credential, training, roster, attendance, pay-period, candidate)

docs/architecture/WORKFORCE_CONTRACTS.md
```

### Expected to update (likely)

```text
src/platform/index.ts                          (export workforce surface)
PLATFORM_STORAGE_REGISTER.md                   (register new keys)
docs/architecture/PROJECT_FILE_STRUCTURE.md    (if structure docs require sync)
Possibly package.json test script if contract tests need a runner
```

### Explicitly out of Wave 1

- Full M04–M07/M11/M22 section UIs
- Replacing portal `records.staff/doctors` in the live M04 partial (may start migration scaffolding only)
- Changing M01 staffing seed behaviour beyond adapter interfaces
- Breaking legacy routes or 24-module register IDs
- Direct edits to another module’s repository

---

## 11. Recommended Wave 1 acceptance gates (for approval)

1. Contracts and events versioned and tested (including idempotency).
2. Storage key files + repeated-run migration skeletons for all six modules.
3. Repository and adapter **interfaces** only — no full UI.
4. Demo refs load without creating duplicate person models.
5. `npm run build` passes; M01–M03 smoke unchanged.
6. Completion report returned; Wave 2 not started.

---

## 12. Wave 0 stop confirmation

This data map and proposed migration map are submitted for **owner review and approval**.  
**No migrations were executed.**  
**Wave 1 was not started.**

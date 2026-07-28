# Healthcare Doctors Pulse
# Connected Workforce-Family Architecture and Cursor Development Plan

**Plan version:** 1.0  
**Date:** 27 July 2026  
**Platform baseline:** `docs/architecture/PLATFORM_BASELINE_V1.md` - signed off  
**Scope:** Modules 4, 5, 6, 7, 11 and 22, with controlled interfaces to Modules 1, 2, 3, 8 and 10.

---

## 1. How Cursor must use this plan

This is a multi-wave development plan. It is deliberately not one large build task.

Cursor must:

1. Read this whole plan before starting.
2. Work on **one wave only** at a time.
3. Preserve the signed-off Platform Baseline V1 and Modules 1-3.
4. Run the required tests for the current wave.
5. Produce the required completion report and stop.
6. Wait for explicit approval before starting the next wave.

A successful build alone is not completion. Every wave requires browser workflow checks, responsive checks, permission checks, storage checks and regression evidence.

---

## 2. Non-negotiable architecture decisions

### 2.1 One connected workforce domain

The family consists of:

- **M04 Staff & Doctor Management** - person, engagement, credential, leave, availability, restriction and workforce readiness source of truth.
- **M11 Training & Learning Management** - training, assessment, competency, certificate, expiry and exemption source of truth.
- **M05 Roster & Shift Management** - roster period, shift, coverage, publication, swap and open-shift source of truth.
- **M06 Time & Attendance** - clock event, break, attendance exception, timesheet and attendance approval source of truth.
- **M07 Staff Pay & Payroll Preparation** - payroll readiness, calculation, adjustment, export and reconciliation source of truth.
- **M22 Recruitment & Talent Acquisition** - candidate and recruitment source of truth until approved promotion to M04.

### 2.2 No duplicate person stores

After candidate promotion, the person exists once in M04. M05, M06, M07 and M11 store references to the M04 person; they must not create independent staff or doctor profiles.

### 2.3 Source modules own business records

M02 holds actionable projections only. M01 holds summaries and executive-only actions. Neither may become the source of truth for workforce records.

### 2.4 Cross-module communication

Use:

`source module -> module adapter -> shared platform contract/service -> destination projection`

A module must not import another module's internal repository and edit it directly.

### 2.5 Effective-dated history

Engagements, classifications, roles, clinic assignments, roster versions, pay rules, training rules and approvals preserve the version and effective period used.

### 2.6 Protected baseline

Do not break:

- `src/platform/**`
- 24-module register and route aliases
- shared clinic context
- shared identity context
- M03 -> M02 projections
- M02 -> M01 executive projection
- global notification badge
- shared audit contracts
- signed-off responsive behaviour

---

## 3. Source-of-truth map

| Information | Owning module | Referenced by |
|---|---|---|
| Candidate | M22 | Hiring workflows until promotion |
| Person | M04 | M05, M06, M07, M11, M02, M01 |
| Engagement / role / clinic scope | M04 | M05, M06, M07, M11, M03 |
| Credential | M04 | M05, M11, M02, M01 |
| Leave / availability / restriction | M04 | M05, M06, M07 |
| Training / competency | M11 | M04 readiness, M05 eligibility, M12 reporting |
| Roster period / shift | M05 | M06, M07 forecast, M10 duties, M01 |
| Clock event / timesheet | M06 | M07, M01 |
| Payroll preparation / export / reconciliation | M07 | External payroll/accounting, M01 |
| Action requiring work | Original source module | M02 projection |

---

## 4. Target file structure

```text
src/modules/
  m04-staff-doctors/
    module.config.ts
    StaffDoctorsModule.tsx
    types/
    sections/
    components/
    forms/
    modals/
    repository/
    services/
    adapters/
    storage/
    data/
    hooks/
    validation/
    tests/

  m05-roster/
  m06-time-attendance/
  m07-staff-pay/
  m11-training/
  m22-recruitment/

src/platform/workforce/
  contracts/
    workforce-person-ref.ts
    engagement-ref.ts
    readiness-ref.ts
    shift-ref.ts
    attendance-ref.ts
    pay-period-ref.ts
    candidate-ref.ts
    workforce-events.ts
  services/
    workforce-event-bus.ts
    readiness-projection.ts
    workforce-link-resolver.ts
  validation/
    workforce-reference-validation.ts
  tests/
    workforce-contracts.test.ts
```

Use `src/platform/workforce/` only for cross-module workforce contracts and projection services. Module-specific rules remain inside the owning module.

### Storage ownership

```text
pulse.m04.workforce.*
pulse.m05.roster.*
pulse.m06.attendance.*
pulse.m07.staffpay.*
pulse.m11.training.*
pulse.m22.recruitment.*
```

Storage access must pass through repositories. Components must not write directly to `localStorage`.

---

## 5. Shared workforce contracts

Create stable versioned contracts for:

- `WorkforcePersonRef`
- `EngagementRef`
- `ReadinessRef`
- `CredentialRef`
- `TrainingStatusRef`
- `ShiftRef`
- `AttendanceRef`
- `TimesheetRef`
- `PayPeriodRef`
- `CandidateRef`

Each cross-module reference must include the owning module, record ID, clinic/organisation scope, status, route and safe display label.

### Required domain events

- `candidate.promoted`
- `engagement.created`
- `engagement.changed`
- `worker.status.changed`
- `credential.status.changed`
- `training.assignment.created`
- `training.status.changed`
- `competency.status.changed`
- `leave.approved`
- `availability.changed`
- `restriction.changed`
- `roster.published`
- `shift.created`
- `shift.changed`
- `shift.cancelled`
- `attendance.event.recorded`
- `attendance.exception.created`
- `attendance.exception.resolved`
- `timesheet.approved`
- `payperiod.status.changed`
- `payroll.export.created`
- `payroll.reconciliation.completed`
- `worker.offboarding.started`
- `worker.offboarding.completed`

Events must be idempotent and include event ID, source version, time, active identity, clinic scope and source-record reference.

---

## 6. Development wave register

| Wave | Scope | Main outcome |
|---|---|---|
| 0 | Preflight and baseline protection | Current-state workforce audit and regression guardrails |
| **1A** | **Authentication and user provisioning** | **Base role enum, profiles, AuthAdminAdapter, invitations, reset, detailed access** |
| 1 | Shared workforce foundation | Contracts, repositories, events, migrations and demo identities |
| 2 | M04 core | Authoritative workforce profiles and readiness |
| 3 | M11 | Training, competency and readiness connection |
| 4 | M05 | Roster, eligibility, coverage and publication |
| 5 | M06 | Attendance, exceptions, offline sync and timesheets |
| 6 | M07 | Payroll readiness, export and reconciliation |
| 7 | M22 | Recruitment and candidate-to-workforce promotion |
| 8 | End-to-end integration | Connected journeys, M02 projections and M01 summaries |
| 9 | Reporting and UX completion | Analytics, reports, mobile, accessibility and states |
| 10 | Legacy transition and final QA | Route/data migration, parity check and baseline sign-off |

**Gate:** Complete and approve Wave 1A before Wave 1 (shared workforce foundation) and before detailed M04/M05/M06/M07/M11/M22 screens.

---

# WAVE 0 - Preflight and baseline protection

## Objective

Create an exact inventory of current workforce-related code, routes, schemas, storage and legacy behaviour before changing implementation.

## Cursor tasks

- Inspect current M04, M05, M06, M07, M11 and M22 routes and landing/partial components.
- Identify reusable components, forms, schemas and demo data.
- Identify generic portal records still used by workforce partials.
- Map every legacy route to its approved internal section.
- Record Module 1-3 workforce-related expectations that must not regress.
- Create `docs/audits/WORKFORCE_FAMILY_CURRENT_STATE.md`.
- Create `docs/architecture/WORKFORCE_FAMILY_DATA_MAP.md`.
- Do not develop new module features in this wave.

## Tests

- `npm run build`
- Verify all current routes still load.
- Confirm no code changes beyond audit/documentation unless a critical audit blocker must be repaired.

## Stop condition

Return the audit, proposed migration map and exact files expected to change in Wave 1. Stop.

---

# WAVE 1A - Authentication and User Provisioning

## Objective

Implement shared authentication identity and administrator-controlled user provisioning using the **current project stack**. Do not introduce a competing authentication platform (including Supabase-specific schemas).

## Boundary

Do not implement detailed workforce/roster/attendance/payroll/training/recruitment screens. Do not begin Wave 1 shared workforce foundation until Wave 1A is approved (if Wave 1 artifacts already exist from prior work, do not expand them in this wave).

## Mandatory technical direction

- Verify current framework, DB/ORM/migrations, auth identity store, session handling, and Module 3 identity/access.
- Create PostgreSQL enum: `CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');`
- Create/migrate `public.profiles` with base `role user_role`, status, optional `workforce_person_id`, and identity linkage:
  - If a local auth user table exists: FK to it.
  - If identity is external / demo-only (current HCDP state): use unique `auth_identity_id` (or `auth_subject`) — **do not invent a false FK**.
- `profiles.role` is the **validated base account role only**. It does not replace organisation memberships, detailed roles, permissions, role_permissions, effective-dated assignments, clinic access, acting authority, delegations, access reviews, or separation-of-duties.
- Implement Module 3 administrator Add User → invite → password setup (admin never knows password) → activation after approvals.
- Separate password-recovery workflow for existing users.
- Disable uncontrolled public self-registration.
- Implement server-only `AuthAdminAdapter`: create invited identity, send/resend/cancel/expire invitation, password reset, suspend/restore, revoke sessions, read safe status.
- Privileged secrets server-only.
- User statuses: Draft, Pending Approval, Invited, Active, Suspended, Locked, Offboarding, Archived.
- Invitation statuses: Draft, Pending Approval, Ready to Send, Invited, Delivered, Accepted, Expired, Cancelled, Failed.
- Enforce access at UI, API, and repository/query layers. Demo Act-as clearly isolated — not a production bypass.
- Suspending login must not delete workforce/history.

## Stop condition

Return the Wave 1A completion report and stop. Do not begin Wave 1 expansion or Module 4+ screens until reviewed.

---

# WAVE 1 - Shared workforce foundation

## Objective

Create the connected data and event foundation without building full module screens.

## Cursor tasks

- Create `src/platform/workforce/contracts/**`.
- Create versioned workforce event definitions.
- Create safe reference resolver and validation.
- Create module storage-key files and idempotent migration skeletons.
- Create demo person, engagement, credential, training, roster, attendance, pay-period and candidate references.
- Create repository interfaces for each module, but no cross-module repository editing.
- Create action-inbox, notification, audit and executive-summary adapter interfaces for M04/M05/M06/M07/M11/M22.
- Add contract tests and event idempotency tests.
- Document contracts in `docs/architecture/WORKFORCE_CONTRACTS.md`.

## Tests

- Contract type tests.
- Invalid/missing reference tests.
- Event duplicate/idempotency tests.
- Storage migration repeated-run tests.
- `npm run build`.
- Regression smoke for M01-M03.

## Stop condition

No full workforce UI. Return created files, contract versions, storage keys, test totals and remaining risks. Stop.

---

# WAVE 2 - Module 4 core

## Objective

Make M04 the authoritative workforce source of truth.

## Sections to build

- Overview
- People Directory
- Staff Profiles
- Doctor Profiles
- Engagements
- Credentials
- Leave & Availability
- Restrictions & Adjustments
- Onboarding
- Offboarding
- Reports
- Settings

## Minimum workflows

1. Add staff member.
2. Add doctor.
3. Duplicate-person check.
4. Create effective-dated engagement.
5. Add and verify credential.
6. Calculate readiness and explain blockers.
7. Request/approve leave.
8. Add availability.
9. Add restricted operational adjustment with sensitivity masking.
10. Start and complete onboarding.
11. Start offboarding and transfer open responsibilities.
12. Suspend and reinstate.

## Integration

- Publish readiness and credential events.
- Create M02 projections for expiring/expired blockers and incomplete offboarding.
- Provide M01 workforce counts.
- Use shared clinic and identity contexts.

## Tests

- Role and clinic permissions.
- Effective-date history.
- Duplicate prevention.
- Readiness calculation.
- Sensitive restriction masking.
- M02 and M01 projections.
- Responsive widths and accessibility.
- `npm run build`.

## Stop condition

M04 workflows and tests complete; M05/M06/M07/M11/M22 remain landing screens except contract consumers. Stop.

---

# WAVE 3 - Module 11 Training & Learning

## Objective

Create the training and competency source of truth and connect it to M04 readiness.

## Sections

- Overview
- Catalogue
- My Learning
- Assignments
- Sessions
- Assessments
- Competencies
- Certificates & Expiry
- Exemptions
- Reports
- Settings

## Minimum workflows

- Create versioned training requirement.
- Create role/clinic assignment rule.
- Assign training automatically and manually.
- Complete training with evidence.
- Record assessment and reassessment.
- Record observed competency.
- Verify certificate.
- Approve time-limited exemption.
- Trigger retraining after role change or event.
- Recalculate M04 readiness.

## Tests

- Rule-version retention.
- Training vs competency distinction.
- Expiry and refresher recurrence.
- Exemption expiry.
- Roster eligibility projection interface.
- Action Inbox and Command Centre summaries.
- Responsive/accessibility/build.

## Stop condition

M11 complete and M04 readiness updated from authoritative M11 records. Stop.

---

# WAVE 4 - Module 5 Roster & Shift Management

## Objective

Build shift-first roster planning using M04 and M11 authoritative readiness.

## Sections

- Roster Board
- Coverage
- Open Shifts
- Availability & Leave
- Requests
- Conflicts & Warnings
- Published History
- Cost Forecast
- Reports
- Settings

## Minimum workflows

- Create roster period.
- Add and edit shifts.
- Assign eligible worker.
- Display blocking/advisory eligibility reasons.
- Check cross-clinic conflicts and fatigue.
- Publish whole or selected clinic roster.
- Notify and request acknowledgement.
- Request/approve swap.
- Offer open shift and assign approved replacement.
- Urgent coverage escalation.
- Version published change.
- Transfer opening/closing duties to M10 adapter.

## Tests

- Credential/training/leave restrictions.
- Double booking and fatigue.
- Cost estimate.
- Publication history.
- Acknowledgement.
- M02 coverage actions and M01 summaries.
- Mobile triage and desktop high-density roster.
- Build/regression.

## Stop condition

M05 complete; do not build attendance or payroll beyond adapters. Stop.

**Status (28 July 2026):** Wave 4 (M05) is **owner accepted and frozen** at checkpoint `15f020800bbca40702ef08ad25f94f1d1999112f` (planning checkpoint `03a0beff267c9aaf382d161cbfec9f3d0df013e1`). Not production-approved. **`BLOCKED-M10` remains blocked.** Wave 5 execution is **not** approved.

---

# WAVE 5 - Module 6 Time & Attendance

## Objective

Build actual attendance, exceptions, offline reconciliation and timesheets linked to M05 shifts.

## Sections

- Live Attendance
- My Clock
- Clock Events
- Exceptions
- Timesheets
- Offline Reconciliation
- Approval History
- Reports
- Settings

## Minimum workflows

- Normal clock in/break/out.
- Unscheduled attendance.
- Missing event report.
- Manager correction with reason.
- Late/early/break/overtime exception.
- Employee explanation and evidence.
- Offline event queue and retry.
- Conflict comparison and resolution.
- Timesheet review and approval.
- Reopen through linked adjustment.

## Tests

- Shift linkage.
- Actual vs roster separation.
- No automatic wage denial.
- Conflict protection.
- Blocking exception behaviour.
- M02 exception actions and M01 live counts.
- Responsive/accessibility/build.

## Stop condition

M06 complete and approved timesheet output available to M07 contract. Stop.

---

# WAVE 6 - Module 7 Staff Pay & Payroll Preparation

## Objective

Build payroll readiness and controlled export/reconciliation without replacing payroll/accounting.

## Sections

- Pay Run Overview
- People Review
- Exceptions
- Variances
- Adjustments
- Approval
- Export
- Reconciliation
- History
- Reports
- Settings

## Minimum workflows

- Create pay period.
- Import/refresh approved M04 and M06 source records.
- Validate employment rule version.
- Resolve blockers.
- Calculate ordinary hours, overtime, leave, allowances and adjustments.
- Review person and clinic variances.
- Prepare and approve export.
- Generate versioned export.
- Record external accepted/rejected results.
- Reconcile differences.
- Lock period.
- Create prior-period adjustment.

## Tests

- Separation of duties.
- Effective-rule retention.
- Blocking exceptions.
- Export does not equal paid.
- Locked-period adjustment.
- Duplicate and reconciliation checks.
- M02 blockers and M01 readiness summary.
- Responsive/accessibility/build.

## Stop condition

M07 complete. Do not develop final accounting or bank execution. Stop.

---

# WAVE 7 - Module 22 Recruitment & Talent Acquisition

## Objective

Build controlled recruitment and one-way promotion into M04 without duplicate people.

## Sections

- Overview
- Requisitions
- Vacancies
- Candidate Pipeline
- Candidate Profiles
- Interviews & Assessments
- References & Checks
- Offers
- Talent Pool
- Promotion to Workforce
- Reports
- Settings

## Minimum workflows

- Create/approve requisition.
- Create/publish vacancy.
- Add candidate through authorised intake.
- Move stages with owner and due date.
- Schedule interview and submit independent scorecard.
- Record references and checks.
- Prepare/approve/send offer.
- Record acceptance and pre-employment completion.
- Duplicate-person check.
- Promote to M04 and create onboarding actions.
- Preserve recruitment-only notes under recruitment permissions.

## Tests

- Candidate privacy and role access.
- Conflict-of-interest handling.
- Offer version and expiry.
- Promotion idempotency.
- No duplicate M04 person.
- Document/credential transfer rules.
- M02 stage actions and M01 vacancy summary.
- Responsive/accessibility/build.

## Stop condition

M22 complete with one tested candidate-to-workforce journey. Stop.

---

# WAVE 8 - End-to-end integration

## Objective

Complete connected family journeys and remove remaining disconnected demo behaviour.

## Required journeys

1. Requisition -> Candidate -> Offer -> Promotion -> Onboarding -> Ready.
2. Credential expiry -> Renewal -> Verification -> Readiness -> Roster eligibility.
3. Training failure -> Restriction -> Reassessment -> Competency -> Ready.
4. Leave approved after publication -> Coverage -> Roster version -> Notification.
5. Published shift -> Attendance -> Exception -> Timesheet -> Pay readiness.
6. Pay blocker -> Resolution -> Export -> External result -> Reconciliation -> Lock.
7. Employment change -> Effective-dated update -> Training/roster/pay effects.
8. Offboarding -> Shift removal -> handover -> access/asset/final-pay completion.

## Integration checks

- M02 source links open exact records.
- M01 cards use real counts and drill down.
- M03 access and identity changes affect eligibility appropriately.
- M10 opening/closing duty ownership follows published shifts.
- M08 consumes approved doctor engagement references without duplicating profiles.
- Shared audit and notification structures are used.

## Stop condition

All journeys pass with no duplicate records and no direct cross-module repository editing. Stop.

---

# WAVE 9 - Reporting and UX completion

## Objective

Complete module dashboards, reports, saved views, mobile, accessibility and designed states.

## Requirements

- Relevant summary cards only.
- Cards/charts/tables with drill-down.
- Standard reporting periods and freshness labels.
- Private and manager-shared saved views.
- Permission-controlled PDF/CSV/Excel/print actions.
- Mobile priority workflows.
- Loading, empty, filtered-empty, restricted, offline, sync, partial-data and error states.
- WCAG 2.2 AA checks.

## Stop condition

All six modules pass the shared UX and reporting acceptance checklist. Stop.

---

# WAVE 10 - Legacy transition and final QA

## Objective

Finish migration from legacy/partial workforce routes and sign off a connected workforce baseline.

## Tasks

- Confirm route aliases open correct sections.
- Migrate approved legacy demo data through versioned migrations.
- Remove remaining user-facing legacy workforce fallback controls.
- Compare legacy prototype capabilities to the new modules and record intentional exclusions.
- Run full browser, permission, workflow, responsive, accessibility, storage and regression test matrix.
- Create:
  - `docs/audits/WORKFORCE_FAMILY_FINAL_QA.md`
  - `docs/audits/workforce-family-evidence.json`
  - `docs/architecture/WORKFORCE_FAMILY_BASELINE_V1.md`

## Required viewport widths

1440, 1280, 1024, 768, 430 and 390 with full-page `overflow-x = 0`.

## Stop condition

No critical or major defects remain; build passes; baseline signed off. Stop.

---

## 7. Completion report required after every wave

Cursor must return:

1. Wave completed.
2. Exact files created.
3. Exact files updated.
4. Data contracts or storage keys added.
5. Workflows implemented.
6. Cross-module integrations added.
7. Tests performed.
8. Passed, failed and blocked counts.
9. Defects found and repaired.
10. Responsive results.
11. Accessibility result.
12. Build result.
13. Remaining limitations.
14. Confirmation that the next wave was not started.

---

## 8. Master instruction to place at the top of Cursor Plan Mode

```text
Use HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md as the controlling development plan for the connected workforce family.

Read the complete plan before changing code.

Implement only the wave explicitly approved by the owner. Do not combine waves, do not start the next module early, and do not treat a successful build as complete QA.

Wave order gate: Wave 0 → Wave 1A (Authentication) → Wave 1 (workforce foundation) → Wave 2+. Do not introduce Supabase or another competing auth platform. Use the current stack. Base profiles.role is enum user|manager|admin only; keep detailed multi-role/clinic access separate. Link identity via auth_identity_id when no local auth user table exists.

Preserve Platform Baseline V1, Modules 1-3, the 24-module register, shared clinic and identity contexts, Action Inbox contracts, executive summary projection, notifications, audit and legacy route compatibility.

Use one authoritative source of truth for every data type. Do not create duplicate staff, doctor, candidate-after-promotion, roster, attendance, training or pay records. Do not directly edit another module's internal repository.

At the end of the approved wave, run all required tests, create evidence, return the specified completion report and stop for review.
```

---

## 9. Recommended first instruction to Cursor

After Wave 0: begin **Wave 1A only** (Authentication and User Provisioning). Do not begin Wave 1 shared workforce foundation or Module 4+ screens until Wave 1A is reviewed and approved.

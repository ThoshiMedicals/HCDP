# Workforce Contracts (Wave 1)

**Date:** 27 July 2026 (updated Wave 1 expansion)  
**Contract version:** `1` (`WORKFORCE_CONTRACT_VERSION`)  
**Controlling plan:** `HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Code root:** `Development folder/src/platform/workforce/`

---

## 1. Purpose

Shared, versioned workforce references and domain events for Modules 4, 5, 6, 7, 11 and 22.

Rules:

- One person store after promotion — M04 owns people.
- Cross-module links use refs, not duplicated profiles.
- Communication path: `source module → module adapter → platform workforce service → destination projection`.
- Modules must not import or edit another module’s internal repository.
- Authentication code must not import M04 repositories. Use `resolveProfileWorkforcePerson` / `registerWorkforcePersonLookup` only.

### Auth profile linkage (`workforcePersonId`)

- nullable (auditors/vendors/admins may have no person);
- one profile → at most one M04 person; one active profile per person when linked;
- auth identity id ≠ workforce person id;
- login suspend/archive never deletes M04 person;
- relink via authorised audited `relinkWorkforcePerson` (auth service);
- no cascade delete from profiles into M04.

Demo seed person ids (`person_admin`, `person_staff`) must never equal `auth_identity_id` values.

---

## 2. Reference contracts

| Contract | Owning module | Factory | File |
|---|---|---|---|
| `WorkforcePersonRef` | M04 `staff-doctors` | `createWorkforcePersonRef` | `contracts/workforce-person-ref.ts` |
| `EngagementRef` | M04 | `createEngagementRef` | `contracts/engagement-ref.ts` |
| `ReadinessRef` | M04 (projection) | `createReadinessRef` / `projectReadiness` | `contracts/readiness-ref.ts` |
| `CredentialRef` | M04 | `createCredentialRef` | `contracts/credential-ref.ts` |
| `TrainingStatusRef` | M11 `training` | `createTrainingStatusRef` | `contracts/training-status-ref.ts` |
| `ShiftRef` | M05 `roster` | `createShiftRef` | `contracts/shift-ref.ts` |
| `AttendanceRef` | M06 `time-attendance` | `createAttendanceRef` | `contracts/attendance-ref.ts` |
| `TimesheetRef` | M06 | `createTimesheetRef` | `contracts/timesheet-ref.ts` |
| `PayPeriodRef` | M07 `staff-pay` | `createPayPeriodRef` | `contracts/pay-period-ref.ts` |
| `CandidateRef` | M22 `recruitment` | `createCandidateRef` | `contracts/candidate-ref.ts` |

### Base fields (`WorkforceRefBase`)

Every ref includes:

- `contractVersion` (currently `1`)
- `owningModuleId`
- `recordId`
- `clinicId?` / `organisationId?`
- `status`
- `route` / `section?`
- `displayLabel`

Validation: `src/platform/workforce/validation/workforce-reference-validation.ts`.

Link resolver: `resolveWorkforceLink(ref, sourceRecordType)` → `SourceRecordRef` + href.

---

## 3. Domain events

Envelope: `WorkforceEventEnvelope` in `contracts/workforce-events.ts`.

Required fields: `eventId`, `eventType`, `sourceVersion`, `occurredAt`, `activeIdentityId`, clinic/org scope, `source: SourceRecordRef`.

| Event type |
|---|
| `candidate.promoted` |
| `engagement.created` / `engagement.changed` |
| `worker.status.changed` |
| `credential.status.changed` |
| `training.assignment.created` / `training.status.changed` |
| `competency.status.changed` |
| `leave.approved` / `availability.changed` / `restriction.changed` |
| `roster.published` |
| `shift.created` / `shift.changed` / `shift.cancelled` |
| `attendance.event.recorded` |
| `attendance.exception.created` / `attendance.exception.resolved` |
| `timesheet.approved` |
| `payperiod.status.changed` |
| `payroll.export.created` / `payroll.reconciliation.completed` |
| `worker.offboarding.started` / `worker.offboarding.completed` |

Idempotent publish: `publishWorkforceEvent` ignores duplicate `eventId`.

---

## 4. Platform services

| Service | Role |
|---|---|
| `workforce-event-bus` | Validate + idempotent publish/subscribe |
| `readiness-projection` | Combine credential + training refs → `ReadinessRef` |
| `workforce-link-resolver` | Safe deep links via `SourceRecordRef` |

---

## 5. Adapter interfaces

Shared interfaces in `src/platform/workforce/adapters/types.ts`:

- `WorkforceActionInboxAdapter`
- `WorkforceNotificationAdapter`
- `WorkforceAuditAdapter`
- `WorkforceExecutiveSummaryAdapter`
- `WorkforceModuleAdapters`

Re-exported from each module’s `adapters/platform.ts` (stubs only in Wave 1).

---

## 6. Storage keys (v1 skeletons)

| Module | Prefix | Migration id |
|---|---|---|
| M04 | `pulse.m04.workforce.*` | `m04-workforce-storage-v1` |
| M05 | `pulse.m05.roster.*` | `m05-roster-storage-v1` |
| M06 | `pulse.m06.attendance.*` | `m06-attendance-storage-v1` |
| M07 | `pulse.m07.staffpay.*` | `m07-staffpay-storage-v1` |
| M11 | `pulse.m11.training.*` | `m11-training-storage-v1` |
| M22 | `pulse.m22.recruitment.*` | `m22-recruitment-storage-v1` |

Migrations seed empty collections once via `runMigrationOnce`. Portal `records.staff/doctors` are **not** migrated in Wave 1.

---

## 7. Demo references

`src/platform/workforce/demo/workforce-demo-refs.ts` exports `WORKFORCE_DEMO_REFS` (person, engagement, credential, training, readiness, shift, attendance, timesheet, pay period, candidate).

Demo person aligns with M02 WWCC narrative (`Sam Ortega` / expired WWCC) for later projection wiring.

---

## 8. Tests

```bash
npm run test:workforce
```

Covers: contract/ref validation, invalid/missing refs, event idempotency, repeated migration runs.

---

## 9. Out of scope (Wave 1)

- Full M04–M22 UI sections (Wave 2 delivered M04 workspace; M05–M07/M11/M22 remain landings)
- Live replacement of portal staff/doctor session records (Wave 2 seeds M04 people; portal not dual-written)
- Publishing real M02 / M01 projections from workforce modules (Wave 2: M02 inbox sync + M01 count adapter)
- Cross-module repository implementations

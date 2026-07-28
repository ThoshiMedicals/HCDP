# Wave 5 Implementation Plan — Module 6 Time & Attendance

**Date:** 28 July 2026  
**Status:** **Owner accepted and frozen** — **NOT** production-approved  
**Accepted implementation checkpoint:** `6cfee6ca7ae2d0f58695569b9f61ffa939b97e49`  
**Accepted date:** 2026-07-28  
**Planning checkpoint:** `309e36b0719229fbc618a05b7fdc046be3952e85`  
**Planning correction of:** `bfd83c268c9fe4bc07dd528265bfdb8c92e065a7`  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Prerequisites:** Waves 1A–4 **owner accepted and frozen**  
**Wave 4 planning checkpoint:** `03a0beff267c9aaf382d161cbfec9f3d0df013e1`  
**Wave 4 accepted implementation:** `15f020800bbca40702ef08ad25f94f1d1999112f`  
**Wave 4 status closure:** `cdc0478322307bd484afcd3dcbdc517b0d3918e9`  
**Wave 4 evidence:** `docs/audits/WAVE4_M05_COMPLETION_REPORT.md`  
**Wave 5 freeze checkpoint:** `docs/audits/WAVE5_CHECKPOINT_STOP_BEFORE_WAVE6.md`  
**Wave 5 evidence:** `docs/audits/WAVE5_M06_COMPLETION_REPORT.md`

```json
{
  "ownerAccepted": true,
  "waveFrozen": true,
  "acceptedCommit": "6cfee6ca7ae2d0f58695569b9f61ffa939b97e49",
  "acceptedDate": "2026-07-28",
  "productionApproved": false
}
```

Do **not** alter frozen Wave 5 without documented defect/CR, impact analysis, focused regression and owner review.  
Do **not** alter frozen Waves 1A–4 runtime code, tests or evidence.  
Do **not** begin M07 (Wave 6) or any later wave without separate explicit authorization.  
Do **not** convert `BLOCKED-M10` or `BLOCKED-M07` into pass/skip/waive.  
Do **not** claim production approval.

Paths are relative to the GitHub repository root (`ThoshiMedicals/HCDP` = `Development folder/`).

---

## 1. Exact scope and exclusions

### In scope (execution, when approved)

- Rebuild **Module 6 Time & Attendance** as the authoritative SoT for attendance sessions, clock/break events, exceptions, employee declarations, correction requests, approvals, timesheet calculation inputs, device/geofence verification evidence and attendance audit history.
- Replace M06 `ModuleLanding` / `TimeAttendanceModule` with a full ten-section workspace (M04/M05/M11 pattern).
- Link attendance to **M05** planned shifts/assignments via `ShiftRef` / `AssignmentRef` only (read/contracts — never edit M05 repositories or published roster history).
- Resolve people/employment/leave/clinic eligibility via **M04**/platform contracts only.
- Project actionable conditions to **M02** and aggregate operational summaries to **M01** via adapters.
- **WF-19A:** Publish approved `TimesheetRef` + emit `timesheet.approved` (M06-owned; must pass in Wave 5).
- **WF-19B:** M07-owned intake remains **`BLOCKED-M07`** until a safe M07 contract exists; M06 must not write `pulse.m07.*`.
- Idempotent, non-destructive M06 seed/migration; preserve frozen Wave 2–4 data; no dual-write; no M07 payroll record generation.

### Explicit exclusions

- Wave 5 **execution** until owner approval (this document is planning only).
- M07 payroll SoT, payslips, payment runs, wage calculation as payment truth.
- Wave 6+ workflows.
- Production DB auth / server-side persistence (deferred).
- Dual-write to portal staff/doctors or cross-module repository imports/writes.
- Inferring that rostered time was worked without attendance evidence.
- Modifying published M05 roster history.
- Overwriting M04 workforce data.
- Claiming geofence/IP/QR/PIN/biometrics alone proves work performed.
- Claiming employment-law, industrial-award, payroll or clinical-safety certification for prototype policies.
- Treating local prototype performance as a production SLA.
- Treating Wave 5 planning as acceptance or production approval.

---

## 2. Repository and dependency audit (as of Wave 4 freeze)

### 2.1 Existing M06 skeleton (reuse)

| Path | Finding |
|---|---|
| `src/modules/m06-time-attendance/TimeAttendanceModule.tsx` | Landing placeholder only — must be replaced by workspace on execution |
| `src/modules/m06-time-attendance/module.config.ts` | `MODULE_ID=time-attendance`, route `/time-attendance`, `STORAGE_PREFIX=pulse.m06.` |
| `src/modules/m06-time-attendance/storage/keys.ts` | Keys: `meta`, `events`, `exceptions`, `timesheets`, `offlineQueue` under `pulse.m06.attendance.*` — **extend** for sessions/breaks/corrections/approvals/policies/audit/evidence |
| `src/modules/m06-time-attendance/storage/migrations.ts` | Skeleton migration `m06-attendance-storage-v1` — extend additively |
| `src/modules/m06-time-attendance/repository/types.ts` | Interface stubs using `AttendanceRef` / `TimesheetRef` / `ShiftRef` |
| `src/modules/m06-time-attendance/adapters/platform.ts` | Wave 1 stubs — no M05/M04/M07 adapters yet |
| Registry `time-attendance` | Registered; legacy `/timeclock`, `/sync-centre`; sections outdated vs this plan |

### 2.2 Platform contracts / events (reuse + additive)

| Asset | Status for M06 |
|---|---|
| `ShiftRef`, `AssignmentRef`, `RosterPeriodRef`, `RosterPublicationRef` | **Consume** (M05-owned) |
| `WorkforcePersonRef`, leave/availability events | **Consume** via M04/platform |
| `AttendanceRef`, `TimesheetRef` | **Own/publish** (already stubbed; extend fields in additive contract revision) |
| Events: `attendance.event.recorded`, `attendance.exception.*`, `timesheet.approved` | **Reuse** event names; flesh producers |
| `clinic-timezone` service | **Reuse** (no silent UTC) |
| `action-inbox-bridge` / `dispatchActionInboxEvent` | **Reuse** M05 inbox-sync pattern |
| Roster projection registry | Optional hooks only — M06 inbox path must use action-inbox bridge (same lesson as Wave 4 M02 evidence) |

### 2.3 Module boundaries

| Module | M06 may | M06 must not |
|---|---|---|
| M01 | Aggregate ops projections | Dump raw location/biometric/sensitive evidence |
| M02 | Project/dedupe/close attendance actions | Own general tasks |
| M03 | Consume clinic/user/role identity | Bypass service permissions |
| M04 | Read person, employment, leave, clinic eligibility | Write M04 stores |
| M05 | Read ShiftRef/AssignmentRef/publication status | Edit periods/shifts/assignments/publications |
| M07 | Emit TimesheetRef + events for future intake | Write `pulse.m07.*`, create pay runs/payslips |
| M10 | No M06 ownership of duties | Do not “fix” `BLOCKED-M10` |

### 2.4 M07 intake finding → blocked dependency (WF-19B only)

M07 exists only as a Wave 1 skeleton (`StaffPayModule` landing + storage stubs). Repository comments mention `linkApprovedTimesheet`, but **no safe M07-owned intake service/contract is implemented**.

**Planning decision:**

| Outcome | Ownership | Wave 5 status |
|---|---|---|
| **WF-19A** M06 approval publication | M06 owns approved timesheet; publish `TimesheetRef`; emit `timesheet.approved`; verify payload/version/idempotency | **Must implement and pass** |
| **WF-19B** M07-owned intake | Acknowledgement/ingestion by M07-owned contract | **`BLOCKED-M07`** until Wave 6 |

M06 must **not** invent a competing payroll SoT or write `pulse.m07.*`.

`BLOCKED-M10` from Wave 4 remains unchanged, **informational**, and **outside** Wave 5 M06 execution accounting.

### 2.5 Patterns to reuse (from M04/M05/M11)

- Service-layer `assertPermission` + `assertClinicScope`
- `SectionFrame` + UX state components pattern
- Local store + migration flags + seed-safe insert-if-absent + seed rollback
- Evidence harness scripts (`scripts/wave*-acceptance-evidence.mjs`)
- Performance suite writing `docs/audits/wave*-performance-evidence.json`
- Optimistic `version` checks → `ConcurrentConflictError` / ConcurrentConflictState

---

## 3. Authoritative ownership

### 3.1 M06 owns

- Attendance sessions (open/closed/cancelled/superseded)
- Clock events (in/out/correction-linked)
- Break events (start/end/missed)
- Attendance exceptions
- Employee attendance declarations / explanations
- Timesheet calculation inputs and approved timesheet records (attendance SoT — **not** payroll)
- Correction requests
- Attendance approvals / reopens
- Device / network / geofence verification **evidence** (proof-of-context, not proof-of-work)
- Attendance audit history

### 3.2 Other owners (unchanged)

| Owner | Remains authoritative for |
|---|---|
| M05 | Planned roster shifts, assignments, publication history |
| M04 | Workforce identity, employment status, clinic eligibility, relationships |
| M07 | Payroll preparation and payable outcomes (Wave 6+) |
| M02 | Action inbox item SoT after projection |
| M01 | Executive aggregate presentation |
| M03 / platform | Users, roles, clinic registry, permission evaluation inputs |

### 3.3 Hard prohibitions

- Modify published roster history.
- Infer rostered time was worked without attendance evidence.
- Create payroll runs, payslips or payment records.
- Overwrite M04 workforce data.
- Directly write another module’s source-of-truth store.
- Use legacy dual-write.
- Write `pulse.m07.*` from M06.

---

## 4. Functional sections (ten)

Canonical permission codes used below are defined in **§10.1**.

### 4.1 Live Attendance

| Field | Spec |
|---|---|
| Purpose | Real-time board of open sessions, on-break, exceptions requiring attention |
| Actors | Managers with `attendance.view.team`; workers see self row with `attendance.view.self` |
| Permissions | `attendance.view.team` (board) / `attendance.view.self` (own) |
| Clinic scope | Actor clinic scope only |
| Data | Sessions, breaks, exception badges, ShiftRef labels (read) |
| Controls | Filter clinic/role/status; open session detail; escalate |
| Mutations | None on board itself (actions deep-link to Clock/Exceptions) |
| Empty/error/restricted | Empty / filtered-empty / restricted / loading / system-error |
| Evidence | `section.live` |

### 4.2 Clock In/Out

| Field | Spec |
|---|---|
| Purpose | Authenticated / kiosk / manager-entered clock mutations |
| Actors | Worker (`attendance.clock.self`); manager enter (`attendance.manager.enter`) |
| Permissions | `attendance.clock.self`, `attendance.manager.enter`, `attendance.override` (policy hard-block override) |
| Clinic scope | Clocking clinic; multi-clinic open session blocked unless override |
| Data | Session, clock events, verification evidence refs, ShiftRef/AssignmentRef |
| Controls | Clock in/out, method selector, early/late acknowledgements |
| Mutations | `clockIn`, `clockOut`, `managerEnterAttendance` |
| States | Loading, validation-error, restricted, offline, concurrent-conflict, system-error |
| Evidence | `section.clock` |

### 4.3 Timesheets

| Field | Spec |
|---|---|
| Purpose | Generate/view/submit/approve timesheet calculation inputs |
| Actors | Worker view/submit; manager approve/reopen |
| Permissions | `attendance.timesheet.view`, `attendance.timesheet.generate`, `attendance.timesheet.submit`, `attendance.approve`, `attendance.reopen` |
| Clinic scope | Person’s home/session clinics in actor scope |
| Data | Timesheet rows linked to sessions/events |
| Controls | Generate, submit, approve, reject, reopen |
| Mutations | `generateTimesheet`, `submitTimesheet`, `approveTimesheet`, `rejectTimesheet`, `reopenTimesheet` |
| Evidence | `section.timesheets` |

### 4.4 Exceptions

| Field | Spec |
|---|---|
| Purpose | Open attendance exceptions and escalation |
| Actors | System creates; worker declares; manager resolves/overrides |
| Permissions | `attendance.exception.view`, `attendance.exception.raise`, `attendance.declare`, `attendance.exception.resolve`, `attendance.override` |
| Clinic scope | Exception clinic |
| Data | Exception records + M02 projection status |
| Mutations | `raiseException`, `declareException`, `resolveException`, `escalateException`, `overrideException` |
| Evidence | `section.exceptions` |

### 4.5 Corrections

| Field | Spec |
|---|---|
| Purpose | Employee correction requests and manager corrections |
| Actors | Worker request; manager apply/approve |
| Permissions | `attendance.correction.request`, `attendance.correction.apply`, `attendance.approve` |
| Clinic scope | Target session clinic |
| Data | Correction requests, expectedVersion |
| Mutations | `requestCorrection`, `withdrawCorrection`, `approveCorrection`, `rejectCorrection`, `applyManagerCorrection` |
| Evidence | `section.corrections` |

### 4.6 Approvals

| Field | Spec |
|---|---|
| Purpose | Unified approval queue for corrections and timesheets; bulk actions |
| Actors | Managers |
| Permissions | `attendance.approve`, `attendance.bulk.approve`, `attendance.reopen` |
| Clinic scope | Scoped queue |
| Mutations | Approve/reject/reopen; bulk preview/submit |
| Evidence | `section.approvals` |

### 4.7 Breaks

| Field | Spec |
|---|---|
| Purpose | Break start/end and missed-break handling |
| Actors | Worker; system for missed |
| Permissions | `attendance.break.self`, `attendance.exception.raise` (system path) |
| Mutations | `startBreak`, `endBreak`, `recordMissedBreak` |
| Evidence | `section.breaks` |

### 4.8 Attendance History

| Field | Spec |
|---|---|
| Purpose | Historical sessions/events with audit trail (masked evidence) |
| Actors | Self / team viewers; sensitive evidence requires `attendance.evidence.view` / `attendance.audit.view` |
| Permissions | `attendance.view.self` / `attendance.view.team` + evidence/audit codes |
| Evidence | `section.history` |

### 4.9 Reports

| Field | Spec |
|---|---|
| Purpose | Roster-vs-attendance, exception rates, offline conflicts; scoped export |
| Permissions | `attendance.report`, `attendance.export` |
| Mutations | Report build; export (mask evidence without `attendance.evidence.view`) |
| Evidence | `section.reports` |

### 4.10 Settings & Policies

| Field | Spec |
|---|---|
| Purpose | Versioned attendance policies and verification method config |
| Actors | Managers with `attendance.policy.manage` |
| Mutations | `publishPolicy`, `archivePolicy` |
| Caveat | Prototype policies ≠ law/award/payroll/clinical certification |
| Evidence | `section.settings` |

---

## 5. End-to-end workflow matrix

Columns: **ID | Trigger | Actor | Preconditions | Service | Validations | State changes | Permission | Clinic | Audit/Event | Failure | Evidence**

| ID | Trigger | Actor | Preconditions | Service | Validations | State changes | Permission | Clinic | Audit / Event | Failure | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WF-01 | Rostered clock-in | Worker | Published assignment; no open session | `clockIn` | ShiftRef match; leave advisory/block; device policy | Session `open`; event `recorded` | `attendance.clock.self` | Session clinic | Audit + `attendance.event.recorded` | Validation / restricted | `U-WF01` |
| WF-02 | Unrostered clock-in | Worker | Policy allows unrostered | `clockIn` (unrostered) | Policy flag; raise exception if required | Session open + maybe exception | `attendance.clock.self` | Selected clinic | Event + maybe `attendance.exception.created` | Policy block | `U-WF02` |
| WF-03 | Early clock-in | Worker | Before shift start − threshold | `clockIn` | Early threshold | Session open + early exception/advisory | `attendance.clock.self` | Clinic | Exception event | Override needs `attendance.override` | `U-WF03` |
| WF-04 | Late arrival | Worker/system | Clock-in after start + grace | `clockIn` / evaluator | Late threshold | Late exception `open` | `attendance.clock.self` | Clinic | Exception → M02 | — | `U-WF04` |
| WF-05 | Missed clock-in | System | Shift started; no clock-in by threshold | `raiseMissedClockIn` | Roster published | Exception `open` | `(system)` + may stamp `attendance.exception.raise` | Clinic | M02 create | Idempotent key | `U-WF05` |
| WF-06 | Break start | Worker | Open session; not on break | `startBreak` | Break policy | Break `in_progress`; session `on_break` | `attendance.break.self` | Clinic | Event | Validation | `U-WF06` |
| WF-07 | Break end | Worker | Break in progress | `endBreak` | Duration rules | Break `completed`; session `open` | `attendance.break.self` | Clinic | Event | — | `U-WF07` |
| WF-08 | Missed break | System | Required break window elapsed | `recordMissedBreak` | Policy required break | Break `missed` + exception | `(system)` | Clinic | M02 | Dedupe | `U-WF08` |
| WF-09 | Normal clock-out | Worker | Open session | `clockOut` | End after start; TZ resolved | Session `closed` | `attendance.clock.self` | Clinic | Event | — | `U-WF09` |
| WF-10 | Early departure | Worker | Clock-out before shift end − threshold | `clockOut` | Early-out threshold | Session `closed` + exception | `attendance.clock.self` | Clinic | Exception | — | `U-WF10` |
| WF-11 | Missed clock-out | System | Max duration / shift end + threshold | `raiseMissedClockOut` | Open session stale | Exception; optional auto-close policy | `(system)` | Clinic | M02 | Idempotent | `U-WF11` |
| WF-12 | Cross-midnight | Worker | Shift crosses local midnight | `clockIn`/`clockOut` | Clinic IANA; folds/offsets | Session spans local dates | `attendance.clock.self` | Clinic | Events with TZ fields | Unresolved TZ | `U-WF12` / `TZ-*` |
| WF-13 | Offline capture → sync | Worker/device | Offline queue entries | `enqueueOfflineEvent`, `syncOfflineQueue` | Idempotency keys; order | Events applied / conflict | `attendance.clock.self` (+ `attendance.sync.resolve` on conflict) | Clinic | Sync audit | Sync-conflict UX | `U-WF13` |
| WF-14 | Employee correction request | Worker | Target event/session exists | `requestCorrection` | Reason; expectedVersion | Correction `requested` | `attendance.correction.request` | Clinic | Audit + M02 pending | Concurrent conflict | `U-WF14` |
| WF-15 | Manager correction | Manager | Permission | `applyManagerCorrection` | Reason; version | Prior event `corrected` (superseded); recalc | `attendance.correction.apply` | Scope | Audit | Conflict | `U-WF15` |
| WF-16 | Approve/reject correction | Manager | Correction `requested` | `approveCorrection` / `rejectCorrection` | Version | `approved`/`rejected` → apply path | `attendance.approve` | Scope | Event | — | `U-WF16` |
| WF-17 | Reopen timesheet | Manager | Timesheet `approved` | `reopenTimesheet` | Reason; not future M07-locked | Timesheet `reopened` | `attendance.reopen` | Scope | Audit | Block if future M07 lock | `U-WF17` |
| WF-18 | Exception escalation | Manager/system | Open exception | `escalateException` | — | Exception `escalated`; M02 urgent | `attendance.exception.resolve` | Scope | M02 update | Dedupe | `U-WF18` |
| **WF-19A** | **M06 approval publication** | Manager/system | Timesheet `approved` | `publishTimesheetApproved` | Approved status; version; idempotency key | Publish `TimesheetRef`; emit `timesheet.approved` | `attendance.approve` | Scope | `timesheet.approved` + audit | Idempotent no-op on replay | **`U-WF19A` (must pass)** |
| **WF-19B** | **M07-owned intake** | M07 (future) | WF-19A published | `m07Intake.acknowledge` (deferred adapter) | M07 contract exists | M07 ack only | M07-owned | M07 | — | **`BLOCKED-M07`** | **`BLOCKED-M07`** |
| WF-20 | Roster vs attendance reconcile | Manager | Period selected | `reconcileRosterAttendance` | Read-only M05 refs | Variance report + exceptions | `attendance.report` | Scope | Audit | M05 unread | `U-WF20` |
| WF-21 | Bulk review/approve | Manager | Queue selected | `previewBulkApprove` / `submitBulkApprove` | Partial success; notify cap | Mixed results | `attendance.bulk.approve` | Scope | Bulk audit | Partial fail report | `U-WF21` |

**WF-19 clarification:** WF-19A is an M06 workflow and **must pass**. WF-19B is **not** an M06 workflow failure when blocked; it is the sole **`BLOCKED-M07`** item. Do not report WF-19A as blocked.

---

## 6. Time, timezone and DST rules

### 6.1 Authority

- Each clinic has an IANA timezone via platform `clinic-timezone` registry.  
- **No silent UTC fallback.** Unresolved TZ → explainable error / unresolved reason (same pattern as M05 `TZ-08`).

### 6.2 Stored per event / session boundary

| Field | Rule |
|---|---|
| `timeZoneId` | Clinic IANA at write |
| `localCivil` | Local wall time intent (date+time string) |
| `occurredAtUtc` | Canonical instant |
| `offsetMinutes` | Offset at that local time |
| `fold` | `0` earlier / `1` later for fall-back repeated hour |
| `gapUnresolved` | Spring-forward missing local time → reject or require `attendance.override` |

### 6.3 Cross-midnight / multi-clinic

- Session may span two local calendar dates; reports bucket by clinic-local date.  
- Multi-clinic workers: session clinic is the clocking clinic; cross-clinic open session blocked unless `attendance.override`.  
- Device clock skew: store `deviceReportedAt` + server `receivedAt`; flag if skew > policy threshold.

### 6.4 Offline out-of-order

- Each offline event carries `clientEventId` (idempotency) + `clientSequence` + `deviceId`.  
- Sync applies in `clientSequence` order per device/session; conflicts → sync-conflict UX + `attendance.sync.resolve`.

### 6.5 Named TZ/DST tests

| ID | Scenario | Expected |
|---|---|---|
| TZ-01 | Cross-midnight Brisbane session | Local end date > start; UTC correct |
| TZ-02 | Auckland vs Brisbane same wall time | Different UTC instants |
| TZ-03 | DST spring-forward gap | Unresolved / reject with `dst-gap` |
| TZ-04 | DST fall-back fold=0 | Earlier occurrence |
| TZ-05 | DST fall-back fold=1 | Later occurrence |
| TZ-06 | Device skew beyond threshold | Warning evidence; optional block |
| TZ-07 | Offline event with stale TZ registry | Explainable failure; no silent UTC |
| TZ-08 | Invalid clinic TZ | Unresolved; no silent UTC |

---

## 7. Clocking and verification methods

### 7.1 Configurable methods (policy)

| Method | Identity | Location/context evidence | Notes |
|---|---|---|---|
| Authenticated web/mobile | Portal session / Act-as demo | Optional IP |
| Clinic kiosk | Device registration + PIN/QR assist | Clinic network/IP |
| Approved device | Device attestation id | Optional geofence |
| IP/network verification | — | Network allow-list evidence |
| Geofence verification | — | Lat/long hash or coarse region |
| QR / PIN-assisted kiosk | PIN/QR bound to person | Kiosk device id |
| Manager-entered | Manager actor (`attendance.manager.enter`) | Reason required |
| Offline capture | Device + person binding | Queued evidence |

### 7.2 Distinctions (mandatory)

- **Identity verification** ≠ **location evidence** ≠ **attendance proof of work**.  
- Geofence, IP, QR, PIN, or biometrics **alone do not prove work was performed**.  
- Biometrics (if ever proposed): require privacy impact, consent, retention schedule and **external legal review** before enablement. This plan does **not** claim regulatory compliance.

### 7.3 Evidence model

Store `VerificationEvidence` separately with sensitivity flag; reveal only with `attendance.evidence.view`. Mask in exports by default (export without that code must not leak raw evidence).

---

## 8. State-transition matrices

### 8.0 State semantics (terminal / superseding / reversible)

| State | Entity | Classification | Notes |
|---|---|---|---|
| `open` / `on_break` | Session | Active | Reversible via clock-out / break end |
| `closed` | Session | Terminal for normal path | May move to `corrected` (superseding recalculation) or `cancelled` (manager) |
| `corrected` | Session / clock event | **Superseding** (not delete) | Prior values retained; new version authoritative; not reversible to pre-correction without new correction |
| `cancelled` | Session | **Terminal** | No further clock mutations; reopen not allowed — create new session if needed |
| `voided` | Clock event / break | **Terminal superseding** | Retained for audit; excluded from totals |
| `recorded` | Clock event | Active | May be corrected/voided |
| `in_progress` / `completed` / `missed` | Break | `completed`/`missed` terminal unless voided |
| `requested` | Correction | Active | Withdraw / approve / reject |
| `approved` / `rejected` / `withdrawn` | Correction | `rejected`/`withdrawn` **terminal**; `approved` proceeds to `applied` |
| `applied` | Correction | **Terminal** for that request | Effects live on session/events |
| `open` / `explained` / `escalated` | Exception | Active | Resolve/override close path |
| `resolved` / `overridden` | Exception | **Terminal** | Reopen only via new exception (no reverse) |
| `draft` / `submitted` / `reopened` | Timesheet | Active | |
| `approved` | Timesheet | Published-capable | Reversible only via `reopened` with `attendance.reopen` |
| `rejected` | Timesheet | Terminal for that submission | Worker may generate/submit new draft |
| `pending` / `approved` / `rejected` | Approval queue item | `rejected` terminal; `approved` may `reopened` |
| `queued` / `syncing` / `applied` | Offline | `applied` terminal success | |
| `conflict` | Offline | Active until `resolved` or `discarded` |
| `resolved` / `discarded` | Offline | **Terminal** | |

Invalid transitions throw typed `InvalidLifecycleTransitionError` (or equivalent) surfaced as ValidationError UX; concurrent stale versions throw `ConcurrentConflictError`.

**Concurrency rule (all versioned entities):** caller supplies `expectedVersion`; store increments on success; mismatch → conflict; no silent overwrite.

**Idempotency rule (clock/offline/bulk/publish):** same `idempotencyKey` / `clientEventId` within retention window → return prior success result (no duplicate mutation).

### 8.1 Attendance session

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid behaviour | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| (none) | `open` | Worker | `attendance.clock.self` | No other open session for person; TZ resolved; clinic in scope; identity method OK | create v1 | `session.opened` | `attendance.event.recorded`; maybe exception M02 | Reject with validation | `clientEventId` |
| (none) | `open` | Manager | `attendance.manager.enter` | Reason required; same integrity checks | create v1 | `session.opened.manager` | same | Reject | `idempotencyKey` |
| `open` | `on_break` | Worker | `attendance.break.self` | Session open; not already on break; policy allows | expectedVersion | `break.started` | event | InvalidLifecycle | — |
| `on_break` | `open` | Worker | `attendance.break.self` | Break `in_progress` | expectedVersion | `break.ended` | event | InvalidLifecycle | — |
| `open` | `closed` | Worker | `attendance.clock.self` | Clock-out after start; TZ OK | expectedVersion | `session.closed` | event; close related M02 missed-out if any | Reject | `clientEventId` |
| `open` | `closed` | System | `(system)` | Auto-close policy only | expectedVersion | `session.closed.system` | event + M02 update | Skip if already closed (idempotent) | policy job key |
| `closed` | `corrected` | Manager | `attendance.correction.apply` | Reason; applied correction exists | expectedVersion | `session.corrected` | audit; recalc timesheet inputs | Conflict on version | correctionId |
| `open`/`on_break`/`closed` | `cancelled` | Manager | `attendance.override` | Reason required; not already cancelled | expectedVersion | `session.cancelled` | close M02 for session | Reject if terminal cancelled | — |
| `cancelled` | * | — | — | — | — | — | — | **Always invalid** (terminal) | — |
| `corrected` | `corrected` | Manager | `attendance.correction.apply` | Further correction | expectedVersion | append correction | superseding | Conflict | correctionId |

### 8.2 Clock event

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| (none) | `recorded` | Worker/device | `attendance.clock.self` | Session allows; duplicate punch rules | event immutable stamp | `clock.recorded` | `attendance.event.recorded` | Reject | `clientEventId` |
| (none) | `recorded` | Manager | `attendance.manager.enter` | Reason | stamp | `clock.recorded.manager` | event | Reject | `idempotencyKey` |
| `recorded` | `corrected` | Manager | `attendance.correction.apply` | Reason; create superseding event; retain prior | prior retained | `clock.corrected` | event | Conflict | correctionId |
| `recorded` | `voided` | Manager | `attendance.override` | Reason; never delete | mark void | `clock.voided` | exclude from totals | Reject if already voided | — |
| `corrected` / `voided` | * (except further supersede via new correction on non-voided lineage) | — | — | — | — | — | — | Invalid on voided | — |

### 8.3 Break

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| (none) | `in_progress` | Worker | `attendance.break.self` | Session `open`; no other in-progress break | create | `break.started` | event | Reject | `clientEventId` |
| `in_progress` | `completed` | Worker | `attendance.break.self` | End ≥ start; TZ OK | expectedVersion | `break.ended` | event | InvalidLifecycle | — |
| (none) | `missed` | System | `(system)` / raise path | Required break window elapsed | create | `break.missed` | exception + M02 | Dedupe key | `m06::break::{sessionId}::{breakReqId}` |
| `in_progress`/`completed`/`missed` | `voided` | Manager | `attendance.override` | Reason | mark void | `break.voided` | update M02 if needed | Reject terminal voided | — |
| `voided` | * | — | — | — | — | — | — | Always invalid | — |

### 8.4 Correction request

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| (none) | `requested` | Worker | `attendance.correction.request` | Target exists; reason; clinic scope | create v1 | `correction.requested` | M02 `m06::corr::{id}` | Reject | — |
| `requested` | `withdrawn` | Worker | `attendance.correction.request` | Same actor; still requested | expectedVersion | `correction.withdrawn` | close M02 | Invalid if not requested | — |
| `requested` | `approved` | Manager | `attendance.approve` | Version match | expectedVersion | `correction.approved` | update M02 | Conflict | — |
| `requested` | `rejected` | Manager | `attendance.approve` | Reason optional/policy | expectedVersion | `correction.rejected` | close M02 | Conflict | — |
| `approved` | `applied` | System/manager | `attendance.correction.apply` | Apply effects to events/session | expectedVersion | `correction.applied` | close M02; may emit event | Idempotent if already applied | correctionId |
| `rejected` / `withdrawn` / `applied` | * | — | — | — | — | — | — | Terminal — invalid | — |

### 8.5 Exception

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| (none) | `open` | System | `(system)` | Policy condition met | create | `exception.created` | `attendance.exception.created` + M02 | Dedupe projection key | projection key |
| (none) | `open` | Manager | `attendance.exception.raise` | Reason; clinic scope | create | `exception.created.manual` | same | Reject | — |
| `open` | `explained` | Worker | `attendance.declare` | Own exception; explanation text | expectedVersion | `exception.explained` | M02 update | Restricted if not own | — |
| `open` / `explained` | `escalated` | Manager | `attendance.exception.resolve` | — | expectedVersion | `exception.escalated` | M02 urgency update | Dedupe | — |
| `open` / `explained` / `escalated` | `resolved` | Manager | `attendance.exception.resolve` | Resolution note | expectedVersion | `exception.resolved` | `attendance.exception.resolved`; close M02 | Conflict | — |
| `open` / `explained` / `escalated` | `overridden` | Manager | `attendance.override` | Override reason required | expectedVersion | `exception.overridden` | close M02 | Conflict | — |
| `resolved` / `overridden` | * | — | — | — | — | — | — | Terminal — invalid | — |

### 8.6 Timesheet

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| (none) | `draft` | Worker/system | `attendance.timesheet.generate` (or system job with view) | Period bounds; sessions exist | create v1 | `timesheet.generated` | — | Reject if locked period policy | generate key per person/period |
| `draft` | `draft` | Worker/system | `attendance.timesheet.generate` | Regenerate while draft | expectedVersion | `timesheet.regenerated` | — | Conflict | same key |
| `draft` | `submitted` | Worker | `attendance.timesheet.submit` | Own timesheet; completeness rules | expectedVersion | `timesheet.submitted` | M02 `m06::ts::{id}` | Conflict | — |
| `submitted` | `approved` | Manager | `attendance.approve` | Version; clinic scope | expectedVersion | `timesheet.approved.record` | close M02; **then WF-19A publish** | Conflict | — |
| `submitted` | `rejected` | Manager | `attendance.approve` | Reason | expectedVersion | `timesheet.rejected` | close M02 | Conflict | — |
| `approved` | `reopened` | Manager | `attendance.reopen` | Reason; not future M07-locked flag | expectedVersion | `timesheet.reopened` | audit; do not invent M07 unlock | Conflict | — |
| `reopened` | `submitted` | Worker | `attendance.timesheet.submit` | After edits/regenerate | expectedVersion | `timesheet.submitted` | M02 recreate | Conflict | — |
| `rejected` | `draft` | Worker/system | `attendance.timesheet.generate` | New draft from rejected | new version lineage | `timesheet.generated` | — | — | new period key rules |
| `approved` (publish side-effect) | (same approved) | System | `attendance.approve` path | WF-19A | timesheet version | publish audit | `timesheet.approved` event + TimesheetRef | Idempotent republish | `publish::{timesheetId}::{version}` |

### 8.7 Approval (queue item)

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| `pending` | `approved` | Manager | `attendance.approve` (single) or `attendance.bulk.approve` | Item pending; expectedVersion | expectedVersion | `approval.approved` | close related M02; may trigger WF-19A | Conflict / partial bulk fail | bulk item key |
| `pending` | `rejected` | Manager | `attendance.approve` / `attendance.bulk.approve` | Reason per policy | expectedVersion | `approval.rejected` | close M02 | Conflict | bulk item key |
| `approved` | `reopened` | Manager | `attendance.reopen` | Reason | expectedVersion | `approval.reopened` | audit | Invalid if not approved | — |
| `rejected` | * | — | — | — | — | — | — | Terminal | — |

### 8.8 Offline synchronization

| From | To | Actor | Permission | Preconditions / validations | Version | Audit | Event / M02 | Invalid | Idempotency |
|---|---|---|---|---|---|---|---|---|---|
| (none) | `queued` | Worker/device | `attendance.clock.self` (capture) | Offline mode; device id | queue entry | `offline.queued` | — | Reject if device revoked | `clientEventId` |
| `queued` | `syncing` | System | `(system)` | Online; batch selected | — | `offline.syncing` | — | Skip if discarded | batchId |
| `syncing` | `applied` | System | `(system)` | Validations pass; order OK | apply to SoT | `offline.applied` | may emit attendance events | On fail → conflict | `clientEventId` |
| `syncing` | `conflict` | System | `(system)` | Version/order/policy clash | — | `offline.conflict` | M02 `m06::sync::{deviceId}::{batchId}` | — | — |
| `conflict` | `resolved` | Worker/manager | `attendance.sync.resolve` | Explicit resolution choice | — | `offline.resolved` | close M02 | Restricted without code | resolutionId |
| `conflict` / `queued` | `discarded` | Manager | `attendance.override` | Reason | — | `offline.discarded` | close M02 | — | — |
| `applied` / `discarded` / `resolved` | * | — | — | — | — | — | — | Terminal | — |

---

## 9. Policy and exception precedence

### 9.1 Configurable policy rules (versioned)

Early/late thresholds; grace periods; rounding; break requirements; overtime **indicators** (not pay); max session duration; missed punches; overlapping attendance; duplicate events; unrostered attendance; clinic mismatch; approved leave conflict; roster cancellation/supersession; manager overrides (`attendance.override` + reason + audit).

### 9.2 Precedence (high → low)

1. Hard safety/integrity blocks (duplicate open session, unresolved TZ, tamper flag if policy hard-block).  
2. Approved leave conflict (M04) — block or warn per policy.  
3. Roster cancelled/superseded linkage — detach or exception; **do not rewrite roster**.  
4. Verification method failure — warn/block per method policy.  
5. Early/late/break thresholds.  
6. Rounding (display/calc inputs only).  
7. Manager override (`attendance.override`, audited).

### 9.3 Certification disclaimer

Prototype policies are **not** employment-law, industrial-award, payroll or clinical-safety certification.

---

## 10. Permission and clinic-scope matrix

### 10.1 Canonical permission-code catalogue

**Only these codes are valid.** Bare `override`, bare `approve`, or undefined shorts are **prohibited** in sections, workflows, transitions and tests.

| Code | Intended actors | Allowed scope | Prohibited scope | Service enforcement | Positive test | Negative test | Cross-clinic test |
|---|---|---|---|---|---|---|---|
| `attendance.view.self` | Worker | Own attendance only | Other persons | `assertPermission` in read services | Worker reads own history | Worker denied teammate row | N/A (self) |
| `attendance.view.team` | Manager / auditor | Clinics in actor scope | Outside clinic set | `listSessions` / live board | Manager sees clinic A team | Worker without code denied board | Manager A denied clinic B |
| `attendance.clock.self` | Worker | Own clock at allowed clinic | Clocking as another person | `clockIn`/`clockOut` | Self clock-in | Missing code denied | Cross-clinic open blocked |
| `attendance.break.self` | Worker | Own breaks on own open session | Others’ breaks | `startBreak`/`endBreak` | Start/end own break | Denied without code | — |
| `attendance.declare` | Worker | Own open/explained exceptions | Others’ exceptions; resolve | `declareException` | Submit explanation | Cannot resolve with only declare | — |
| `attendance.correction.request` | Worker | Own events/sessions | Manager-apply path | `requestCorrection`/`withdrawCorrection` | Request own | Cannot apply correction | Denied other clinic target |
| `attendance.correction.apply` | Manager | Scoped clinics | Self-serve rewrite without code | `applyManagerCorrection` / apply approved | Manager corrects | Worker denied apply | Cross-clinic deny |
| `attendance.approve` | Manager | Scoped queue | Export bypass; payroll | `approve*` / `reject*` / WF-19A publish gate | Approve timesheet | Worker denied | Cross-clinic deny |
| `attendance.reopen` | Manager | Scoped approved timesheets/approvals | Silent reopen | `reopenTimesheet` | Reopen with reason | Denied without code | Cross-clinic deny |
| `attendance.override` | Director / senior admin | Scoped; reason required | Unaudited bypass | Hard-block override paths; cancel; void; discard offline | Override late block | `attendance.approve` alone insufficient | Cross-clinic deny |
| `attendance.exception.view` | Manager / worker (own via view.self path) | Scoped / own | Sensitive evidence | `listExceptions` | View open exceptions | Denied | Cross-clinic deny |
| `attendance.exception.raise` | Manager (manual); system jobs stamp | Scoped | Raising for out-of-scope clinic | `raiseException` | Manual raise | Denied | Cross-clinic deny |
| `attendance.exception.resolve` | Manager | Scoped | Override-without-reason | `resolveException`/`escalateException` | Resolve | Worker denied | Cross-clinic deny |
| `attendance.evidence.view` | Director / senior / cleared | Scoped sensitive evidence | Default export payloads | Evidence read APIs | View geofence/IP detail | Masked without code | Cross-clinic deny |
| `attendance.audit.view` | Auditor / senior | Scoped audit history | Mutate | `listAudit` | View audit | Mutate still denied | Cross-clinic deny |
| `attendance.bulk.approve` | Manager | Scoped bulk | Unlimited notify storm (cap) | `previewBulkApprove`/`submitBulkApprove` | Bulk partial success | Denied without code | Items outside scope fail individually |
| `attendance.export` | Manager / finance | Scoped export | Export bypass of clinic filter | `exportAttendance` | Scoped CSV | Attempt all-clinics denied | Cross-clinic deny |
| `attendance.report` | Manager / finance | Scoped reports | Mutate SoT | `reconcileRosterAttendance` / reports | Run reconcile | Denied | Cross-clinic deny |
| `attendance.policy.manage` | Senior admin | Org/clinic policy versions | Worker edit | `publishPolicy`/`archivePolicy` | Publish policy | Denied | — |
| `attendance.timesheet.view` | Worker (own) / manager (team) | Own or scoped | Others without team view | `getTimesheet` | View own | Denied teammate | Cross-clinic deny |
| `attendance.timesheet.generate` | Worker (own) / system / manager assist | Own/scoped period | Generating payroll | `generateTimesheet` | Generate draft | Denied | Cross-clinic deny |
| `attendance.timesheet.submit` | Worker | Own draft | Submitting others’ | `submitTimesheet` | Submit own | Denied | — |
| `attendance.manager.enter` | Manager | Scoped; reason required | Impersonation without audit | `managerEnterAttendance` | Manager-entered session | Worker denied | Cross-clinic deny |
| `attendance.sync.resolve` | Worker (own conflicts) / manager | Own device conflicts or scoped | Discard without override | `resolveOfflineConflict` | Resolve conflict | Denied | Cross-clinic deny |

**System actor:** background evaluators use `(system)` and do not grant user permission bypass in UI; they still write audit with system principal.

### 10.2 Role mapping (demo Act-as → codes)

| Role class | Typical grants |
|---|---|
| Worker | `view.self`, `clock.self`, `break.self`, `declare`, `correction.request`, `timesheet.view`, `timesheet.generate`, `timesheet.submit`, `sync.resolve` (own) |
| Clinic/Practice Manager | + `view.team`, `correction.apply`, `approve`, `reopen`, `exception.view/raise/resolve`, `bulk.approve`, `report`, `manager.enter`, `export` (optional) |
| Director / Senior Admin | + `override`, `policy.manage`, `evidence.view`, `audit.view`, `export` |
| Finance | `report`, `export`, `timesheet.view` (scoped); **no** clock/approve/override |
| Read-only auditor | `view.team`, `audit.view`, `exception.view`; **no** mutate |

### 10.3 Enforcement & named tests

- Enforce in **services**, not UI alone (`permissions.ts` + each mutating service).  
- Tests in `tests/m06-authz.test.ts` and evidence harness: positive; negative; cross-clinic; export-bypass deny; bulk partial-success; evidence masking without `attendance.evidence.view`.

---

## 11. Integration-contract matrix

| # | Provider | Consumer | Contract/Event | Direction | Owner | R/W | Version / idempotency | Stale protection | Prohibited |
|---|---|---|---|---|---|---|---|---|---|
| C01 | M05 | M06 | ShiftRef / AssignmentRef | M06 reads | M05 | Read via adapter | Ref snapshot at link time | Stale publication version → exception | M05 repo import/write |
| C02 | M04 | M06 | PersonRef / leave / eligibility | M06 reads | M04 | Read | asOf timestamp | Stale leave → re-check | M04 repo write |
| C03 | M03 | M06 | Clinic/user/role | M06 reads | Platform/M03 | Read | — | — | Bypass permissions |
| C04 | M06 | M02 | Action inbox events | M06→M02 | M02 item / M06 condition | Project | Stable projection keys | Stale-replay blocked | Direct M02 repo dual-write |
| C05 | M06 | M01 | Executive aggregates | M06→M01 | M01 | Aggregate only | — | — | Raw GPS/biometrics |
| C06 | M06 | Platform bus | `attendance.*` | Publish | M06 | Event | Idempotency keys | Deduped | — |
| **C07A** | **M06** | **Platform / future M07** | **`TimesheetRef` + `timesheet.approved`** | **Publish** | **M06** | **Write M06 SoT + event** | **`publish::{timesheetId}::{version}`** | **Stale version no-op/conflict** | **Writing `pulse.m07.*`** |
| **C07B** | **M07 (future)** | **M06 publisher** | **M07-owned intake ack** | **M07 consumes** | **M07** | **Blocked** | — | — | **M06 inventing payroll SoT** |
| C08 | Platform | M06 | clinic-timezone | Read | Platform | Read | — | Unresolved TZ | Silent UTC |

- **C07A** must be implemented and pass in Wave 5 (maps to **WF-19A**).  
- **C07B** remains **`BLOCKED-M07`** (maps to **WF-19B**). Adapter `m07-timesheet-bridge.ts` returns blocked for intake only; publication lives in M06 `timesheet-service` / `events.ts`.

---

## 12. M02 and M01 lifecycle matrices

### 12.1 M02 conditions

| Condition | Create | Dedupe key | Update | Close | Stale replay | Notify cap |
|---|---|---|---|---|---|---|
| Missed clock-in | Shift threshold | `m06::missed-in::{shiftId}::{personId}` | Escalate | Clock-in or resolve | Ignore older version | Per policy |
| Late arrival | Late clock-in | `m06::late::{sessionId}` | Severity | Resolve/override | Block reopen | Cap |
| Missed clock-out | Threshold | `m06::missed-out::{sessionId}` | Escalate | Clock-out/close | Block | Cap |
| Excessive session | Max duration | `m06::excess::{sessionId}` | Update duration | Close session | Block | Cap |
| Break exception | Missed/short break | `m06::break::{sessionId}::{breakReqId}` | Update | Resolve | Block | Cap |
| Unrostered attendance | Unrostered in | `m06::unrostered::{sessionId}` | — | Resolve/approve | Block | Cap |
| Leave conflict | M04 leave vs session | `m06::leave-clash::{sessionId}` | — | Resolve | Block | Cap |
| Correction awaiting approval | Correction requested | `m06::corr::{correctionId}` | — | Approve/reject/withdraw | Block | Cap |
| Timesheet awaiting approval | Submitted | `m06::ts::{timesheetId}` | — | Approve/reject | Block | Cap |
| Offline sync failure | Sync conflict | `m06::sync::{deviceId}::{batchId}` | Retry | Resolved/discarded | Block | Cap |

Implementation pattern: mirror `m05-inbox-sync.ts` → `dispatchActionInboxEvent` (not a no-op registry observer).

### 12.2 M01

Aggregate only: open sessions count, open exceptions, pending approvals, offline conflict count — **no** raw coordinates, biometrics, or full evidence payloads.

---

## 13. Offline, concurrency and security

| Topic | Plan |
|---|---|
| Optimistic concurrency | `version` on sessions, corrections, timesheets, policies, approval items |
| Idempotency | `clientEventId` / `idempotencyKey` on clock, offline, bulk, WF-19A publish |
| Duplicate submission | Reject or no-op same key |
| Offline ordering | Per-device sequence; conflict UX |
| Stale roster | Re-read ShiftRef; exception if superseded |
| Device identity | Registered device records; revoke support |
| Tamper indicators | Evidence hash / skew flags (prototype — not prod-grade) |
| Audit integrity | Append-only audit log in `pulse.m06.attendance.audit` |
| Retention/privacy | Evidence retention policy setting; mask exports |
| Recovery | Sync-conflict, concurrent-conflict, system-error, offline UX |

**Disclaimer:** Local prototype storage/controls are **not** production-grade security.

---

## 14. UX and accessibility requirements

### 14.1 Functional UX states (evidence IDs UX-01…UX-09)

| State | Trigger | Expected | Recovery |
|---|---|---|---|
| Loading | Bootstrap / fetch | Busy indicator | Completes |
| Empty | No sessions/events in scope | EmptyState + CTA | Clock in / seed |
| Filtered-empty | Filters exclude all | FilteredEmptyState | Clear filters |
| Restricted | Missing permission/scope | RestrictedState | Switch Act-as |
| Validation-error | Invalid clock/correction | Inline + summary | Fix fields |
| System-error | Store/adapter failure | SystemErrorState | Retry |
| Offline | `navigator.onLine` false / queue mode | OfflineState | Reconnect |
| Sync-conflict | Offline apply conflict | SyncConflictState | Resolve (`attendance.sync.resolve`) |
| Concurrent-conflict | Stale version | ConcurrentConflictState | Refresh |

Demo `?uxState=` routes may exist for development but **cannot** be sole acceptance evidence.

### 14.2 Responsive / a11y / appearance

- Widths: **1440, 1280, 1024, 768, 430, 390** — every section; zero page-level horizontal overflow.  
- Keyboard: logical order, no trap, **measurable** focus indicator, Enter/Space activation.  
- Labels, `aria-current` on nav, live regions for clock confirmations.  
- Appearance: explicit Light / Dark / Device-System via Command Centre selector (same proof rules as Wave 4).

---

## 15. Migration and seed safety

| Rule | Requirement | Test |
|---|---|---|
| Idempotent init | Re-run safe | MIG-01 |
| Non-destructive | No overwrite of non-seed rows | MIG-01 |
| Stable ids | Seed batch ids | MIG-01 |
| Insert-if-missing | Only | MIG-01 |
| Seed rollback only | Remove seed-tagged rows + flags | MIG-01 |
| Interrupted recovery | MIG-02 | MIG-02 |
| Preserve Wave 2–4 | No mutation of M04/M05/M11 stores | MIG-03 |
| No dual-write | — | MIG-03 |
| No M07 payroll records | Never write `pulse.m07.*` | MIG-03 |

Extend storage keys beyond skeleton:  
`sessions`, `breaks`, `corrections`, `approvals`, `policies`, `audit`, `evidence`, `devices`, `declarations` (+ existing events/exceptions/timesheets/offlineQueue).

---

## 16. Numeric performance targets (§ prototype)

**Environment:** warm production build, Chromium, mid laptop, local persistence, Act-as demo identities.  
**Not** production SLAs.

| Operation | Dataset | Target | Metric |
|---|---|---|---|
| Live attendance board load | ≥50 open sessions / 2 clinics | ≤2500ms | max / p95 observed |
| Clock-in/out submission | 1 | ≤300ms | per-op typical |
| Eligibility + roster lookup | warm M04/M05 refs | ≤150ms | per-op typical |
| Exception calculation | 100 sessions | ≤1000ms | p95 |
| Break calculation | 100 sessions | ≤500ms | p95 |
| Timesheet generation | 1 person × 14 days | ≤2000ms | max |
| Correction submission | 1 | ≤400ms | per-op |
| Approval | 1 | ≤500ms | per-op |
| Bulk preview | ≤200 items | ≤2000ms | max |
| Bulk submission | ≤200 items | ≤5000ms | max |
| Offline sync batch | ≤100 events | ≤3000ms | max |
| M02 projection single | 1 condition | ≤50ms | typical |
| Reports build | ≤5k rows scoped | ≤3000ms | max |
| Scoped export | ≤5k rows | ≤3000ms | max |

Fail evidence if claimed M02 projections invoke **0** writes (Wave 4 lesson).

---

## 17. Test and evidence matrix

| Area | Requirement | Critical |
|---|---|---|
| Ten sections | Browser nav + unique test ids + action | Yes |
| Workflows **WF-01…WF-18, WF-19A, WF-20, WF-21** (21) | Unit/integration/browser — **must pass** | Yes |
| **WF-19B M07 intake** | Adapter returns blocked; **no** `pulse.m07.*` | **Blocked item only** |
| Permissions + clinic scope | Named +/- / cross-clinic / export-bypass / bulk partial | Yes |
| Concurrency / stale versions | Conflict UX | Yes |
| Offline + idempotent retry | Queue + sync | Yes |
| TZ/DST + cross-midnight | TZ-01…TZ-08 | Yes |
| Roster vs attendance | WF-20 | Yes |
| Leave conflicts | M04 read | Yes |
| Policy overrides | `attendance.override` audit | Yes |
| M02 lifecycles | Create/dedupe/update/close/stale | Yes |
| M07 boundary | C07A pass; C07B `BLOCKED-M07`; no `pulse.m07.*` | Yes |
| Privacy/export | Mask evidence | Yes |
| Migration/seed/rollback | MIG-01…03 | Yes |
| UX states | Real triggers | Yes |
| A11y + widths + appearance | As §14 | Yes |
| Frozen-wave / platform regression | npm test + platform-qa | Yes |
| Lint / tsc / production build | Pass (lint warnings OK) | Yes |

### 17.1 Acceptance accounting (defined in advance)

| Bucket | What counts | Pre-declared quantity |
|---|---|---|
| **M06 workflows required to pass** | WF-01…WF-18, WF-19A, WF-20, WF-21 | **21** |
| **Separately blocked M07 intake** | WF-19B / C07B only | **1 × `BLOCKED-M07`** |
| **Inherited informational** | `BLOCKED-M10` | **Not** an M06 workflow; **not** in Wave 5 pass/fail/skip/blocked totals |
| **passed** | M06 acceptance checks that pass (includes the 21 workflows when green, plus other evidence rows) | Report count |
| **failed** | M06 checks that fail | Report count — **do not** put WF-19B or M10 here |
| **skipped** | Explicit skip only if owner-approved; default **0** | Report count |
| **blocked** | Only approved Wave 5 blocked codes in the M06 harness | **`BLOCKED-M07`** (WF-19B) — **do not double-count** as failed or as a 22nd required workflow |

**Anti double-count rules:**

1. WF-19A pass does **not** also credit WF-19B.  
2. WF-19B blocked does **not** decrement the 21 required workflow passes.  
3. `BLOCKED-M10` may be mentioned in status docs as inherited freeze context but **must not** appear in Wave 5 M06 evidence totals as pass, fail, skip or blocked.

---

## 18. Exact implementation inventory

Every proposed path is listed individually. No wildcards.

### 18.1 Files to create (execution)

| Action | Path | Purpose | Owns / contracts | Test / evidence coverage | Freeze protection |
|---|---|---|---|---|---|
| Create | `src/modules/m06-time-attendance/AttendanceWorkspace.tsx` | Ten-section workspace chrome | UI shell | `section.*` browser | M06 only |
| Create | `src/modules/m06-time-attendance/context.tsx` | Actor, section, refresh, appearance | UI context | UX / sections | M06 only |
| Create | `src/modules/m06-time-attendance/permissions.ts` | Canonical codes + `assertPermission` / scope | All §10 codes | `m06-authz.test.ts` | M06 only |
| Create | `src/modules/m06-time-attendance/types/domain.ts` | Session, event, break, exception, correction, timesheet, approval, declaration | Domain types | domain tests | M06 only |
| Create | `src/modules/m06-time-attendance/types/timezone.ts` | Fold/gap/skew types | TZ model | `m06-timezone-dst.test.ts` | M06 only |
| Create | `src/modules/m06-time-attendance/types/policy.ts` | Versioned policy rules | Policy model | policy/authz tests | M06 only |
| Create | `src/modules/m06-time-attendance/types/index.ts` | Barrel exports | — | — | M06 only |
| Create | `src/modules/m06-time-attendance/repository/local-store.ts` | Local SoT persistence + version checks | All M06 stores | migration/domain/concurrency | M06 only |
| Create | `src/modules/m06-time-attendance/services/clock-service.ts` | `clockIn`/`clockOut` | Sessions + clock events | WF-01…04,09,10,12 | M06 only |
| Create | `src/modules/m06-time-attendance/services/session-service.ts` | Session read/cancel/correct helpers | Sessions | domain + WF-15 | M06 only |
| Create | `src/modules/m06-time-attendance/services/break-service.ts` | Break start/end/missed | Breaks | WF-06…08 | M06 only |
| Create | `src/modules/m06-time-attendance/services/exception-service.ts` | Raise/declare/resolve/escalate/override | Exceptions | WF-04,05,08,10,11,18 | M06 only |
| Create | `src/modules/m06-time-attendance/services/correction-service.ts` | Request/withdraw/approve/reject/apply | Corrections | WF-14…16 | M06 only |
| Create | `src/modules/m06-time-attendance/services/approval-service.ts` | Approval queue item transitions | Approvals | WF-16,17,21 | M06 only |
| Create | `src/modules/m06-time-attendance/services/timesheet-service.ts` | Generate/submit/approve/reject/reopen + **WF-19A publish** | Timesheets + TimesheetRef publish | WF-17,19A | M06 only |
| Create | `src/modules/m06-time-attendance/services/reconcile-service.ts` | Roster vs attendance | Reports inputs | WF-20 | M06 only |
| Create | `src/modules/m06-time-attendance/services/bulk-operation-service.ts` | Bulk preview/submit | Bulk approvals | WF-21; `m06-bulk.test.ts` | M06 only |
| Create | `src/modules/m06-time-attendance/services/reporting-service.ts` | Reports + scoped export | Report/export | section.reports; privacy tests | M06 only |
| Create | `src/modules/m06-time-attendance/services/policy-service.ts` | Publish/archive policies | Policies | settings; override tests | M06 only |
| Create | `src/modules/m06-time-attendance/services/offline-sync-service.ts` | Queue/sync/resolve/discard | Offline queue | WF-13; offline tests | M06 only |
| Create | `src/modules/m06-time-attendance/services/manager-entry-service.ts` | Manager-entered attendance | Sessions/events | `attendance.manager.enter` tests | M06 only |
| Create | `src/modules/m06-time-attendance/services/clinic-time-service.ts` | Clinic IANA resolve; no silent UTC | TZ | TZ-01…08 | M06 only |
| Create | `src/modules/m06-time-attendance/services/events.ts` | Emit `attendance.*`, `timesheet.approved` | Platform events | adapters + WF-19A | M06 only |
| Create | `src/modules/m06-time-attendance/services/errors.ts` | Typed errors (lifecycle, conflict, override) | — | ux-states tests | M06 only |
| Create | `src/modules/m06-time-attendance/services/audit-helpers.ts` | Append-only audit writers | Audit log | audit.view tests | M06 only |
| Create | `src/modules/m06-time-attendance/services/index.ts` | Service barrel | — | — | M06 only |
| Create | `src/modules/m06-time-attendance/sections/LiveAttendanceSection.tsx` | Live board UI | — | `section.live` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/ClockSection.tsx` | Clock in/out UI | — | `section.clock` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/TimesheetsSection.tsx` | Timesheets UI | — | `section.timesheets` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/ExceptionsSection.tsx` | Exceptions UI | — | `section.exceptions` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/CorrectionsSection.tsx` | Corrections UI | — | `section.corrections` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/ApprovalsSection.tsx` | Approvals UI | — | `section.approvals` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/BreaksSection.tsx` | Breaks UI | — | `section.breaks` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/AttendanceHistorySection.tsx` | History UI | — | `section.history` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/ReportsSection.tsx` | Reports UI | — | `section.reports` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/SettingsSection.tsx` | Policies UI | — | `section.settings` | M06 only |
| Create | `src/modules/m06-time-attendance/sections/index.ts` | Section barrel | — | — | M06 only |
| Create | `src/modules/m06-time-attendance/components/SectionFrame.tsx` | Shared section frame | — | all sections | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/LoadingState.tsx` | UX-01 | — | `m06-ux-states.test.ts` | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/EmptyState.tsx` | UX-02 | — | ux + browser | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/FilteredEmptyState.tsx` | UX-03 | — | ux + browser | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/RestrictedState.tsx` | UX-04 | — | authz + browser | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/ValidationErrorState.tsx` | UX-05 | — | ux | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/SystemErrorState.tsx` | UX-06 | — | ux | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/OfflineState.tsx` | UX-07 | — | offline + browser | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/SyncConflictState.tsx` | UX-08 sync | — | offline conflict | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/ConcurrentConflictState.tsx` | UX-09 concurrency | — | concurrency | M06 only |
| Create | `src/modules/m06-time-attendance/components/ux/index.ts` | UX barrel | — | — | M06 only |
| Create | `src/modules/m06-time-attendance/adapters/m04-person-read.ts` | People/leave/eligibility reads | Consumes M04 refs | `m06-adapters.test.ts` | No M04 write |
| Create | `src/modules/m06-time-attendance/adapters/m05-shift-read.ts` | Shift/assignment/publication reads | Consumes M05 refs | adapters + WF-01,20 | No M05 write |
| Create | `src/modules/m06-time-attendance/adapters/m06-inbox-sync.ts` | M02 projections via action-inbox bridge | C04 | M02 lifecycle evidence | No M02 repo dual-write |
| Create | `src/modules/m06-time-attendance/adapters/m06-executive.ts` | M01 aggregates | C05 | executive projection tests | Aggregate only |
| Create | `src/modules/m06-time-attendance/adapters/m07-timesheet-bridge.ts` | **Deferred intake only** — returns `BLOCKED-M07` | C07B | WF-19B blocked evidence | Must not write `pulse.m07.*` |
| Create | `src/modules/m06-time-attendance/storage/seed-safe.ts` | Insert-if-missing seeds | Seed rows | MIG-01 | Seed-tagged only |
| Create | `src/modules/m06-time-attendance/storage/rollback-seed.ts` | Seed-owned rollback | Seed flags | MIG-01 | Seed-tagged only |
| Create | `src/modules/m06-time-attendance/storage/bootstrap.ts` | Init orchestration | Keys/migrate/seed | MIG-01/02 | Non-destructive |
| Create | `src/modules/m06-time-attendance/storage/migrate-v2.ts` | Additive key migration | New keys | MIG-01/02/03 | Additive; preserve Wave 2–4 |
| Create | `src/modules/m06-time-attendance/tests/m06-domain.test.ts` | Domain/state transitions | §8 | U-WF* unit | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-authz.test.ts` | Permission +/- / cross-clinic | §10 | authz evidence | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-timezone-dst.test.ts` | TZ-01…08 | clinic-time | TZ evidence | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-offline.test.ts` | Offline order/idempotency/conflict | offline-sync | WF-13 | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-adapters.test.ts` | M04/M05/M02/M01/M07 boundary | adapters | C01–C08 | No foreign SoT writes |
| Create | `src/modules/m06-time-attendance/tests/m06-migration.test.ts` | Seed/migrate/rollback | storage | MIG-01…03 | Preserve Wave 2–4 |
| Create | `src/modules/m06-time-attendance/tests/m06-bulk.test.ts` | Bulk partial success | bulk service | WF-21 | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-privacy.test.ts` | Evidence mask / export | reporting | privacy evidence | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-ux-states.test.ts` | Typed UX error contracts | errors + ux | UX-01…09 | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-workflows.test.ts` | WF-01…18,19A,20,21 service paths | services | 21 workflows | M06 only |
| Create | `src/modules/m06-time-attendance/tests/m06-performance.test.ts` | §16 targets | services | perf JSON | Prototype only |
| Create | `scripts/wave5-m06-acceptance-evidence.mjs` | Acceptance harness | aggregates results | completion report | Scripts only |
| Create | `scripts/wave5-m06-performance-evidence.mjs` | Perf harness (if split from acceptance) | perf | perf JSON | Scripts only |
| Create | `docs/audits/WAVE5_M06_COMPLETION_REPORT.md` | Execution completion (execution only) | status | owner review | Docs; not now |
| Create | `docs/audits/wave5-m06-acceptance-evidence.json` | Generated acceptance | — | harness | Generated; not now |
| Create | `docs/audits/wave5-m06-performance-evidence.json` | Generated perf | — | harness | Generated; not now |

### 18.2 Files to modify (execution) — freeze-safe

| Action | Path | Purpose | Owns / contracts | Test / evidence | Freeze protection |
|---|---|---|---|---|---|
| Modify | `src/modules/m06-time-attendance/TimeAttendanceModule.tsx` | Mount `AttendanceWorkspace` | Module entry | section browser | M06 only; replace landing |
| Modify | `src/modules/m06-time-attendance/index.ts` | Export workspace | — | — | M06 only |
| Modify | `src/modules/m06-time-attendance/module.config.ts` | Section ids aligned to ten sections | Module config | registry | Additive labels |
| Modify | `src/modules/m06-time-attendance/storage/keys.ts` | Add sessions/breaks/corrections/approvals/policies/audit/evidence/devices/declarations keys | Storage keys | migration tests | Additive keys only |
| Modify | `src/modules/m06-time-attendance/storage/migrations.ts` | Chain to migrate-v2 | Migration flags | MIG-* | Additive |
| Modify | `src/modules/m06-time-attendance/storage/index.ts` | Export new storage helpers | — | — | M06 only |
| Modify | `src/modules/m06-time-attendance/repository/types.ts` | Align interfaces to domain | Repo types | domain tests | Additive |
| Modify | `src/modules/m06-time-attendance/repository/index.ts` | Export local-store | — | — | M06 only |
| Modify | `src/modules/m06-time-attendance/adapters/platform.ts` | Wire shared platform helpers | Platform reads | adapters | No foreign writes |
| Modify | `src/modules/m06-time-attendance/adapters/index.ts` | Export new adapters | — | — | M06 only |
| Modify | `src/platform/module-registry/module-register.ts` | Align `time-attendance` section list/labels | Nav registry | section nav evidence | Additive for M06 entry only; do not rewrite other modules’ behaviour |
| Modify | `src/platform/navigation/legacy-routes.ts` | Map `/timeclock`, `/sync-centre` to new section ids | Legacy redirects | redirect smoke | Additive mappings |
| Modify | `package.json` | Add `test:wave5-evidence` (and perf script if needed) | npm scripts | harness | Additive scripts only |
| Modify | `src/platform/workforce/contracts/attendance-ref.ts` | Additive optional fields if required | AttendanceRef | validation tests | Backward compatible additive |
| Modify | `src/platform/workforce/contracts/timesheet-ref.ts` | Additive optional fields for approval publish | TimesheetRef / WF-19A | WF-19A payload tests | Backward compatible additive |
| Modify | `src/platform/workforce/contracts/workforce-events.ts` | Add event names only if missing | Event union | events tests | Additive |
| Modify | `src/platform/workforce/contracts/index.ts` | Re-export if needed | — | — | Additive |
| Modify | `src/platform/workforce/validation/workforce-reference-validation.ts` | Validate additive fields | Validation | contract tests | Additive |
| Modify | `src/platform/workforce/demo/workforce-demo-refs.ts` | Demo refs stay valid | Demo | smoke | Additive demo only |
| Modify | `.cursor/rules/hcdp-wave-control.mdc` | Status after execution acceptance only | Wave control | — | Status text only; not during planning correction beyond current planning-only state |

### 18.3 Prohibited unchanged (must remain unchanged in Wave 5 execution)

| Path / class | Reason |
|---|---|
| Frozen M04 runtime SoT, tests, accepted evidence baselines | Wave 2 freeze |
| Frozen M05 runtime SoT, tests, accepted evidence baselines | Wave 4 freeze |
| Frozen M11 runtime SoT, tests, accepted evidence baselines | Wave 3 freeze |
| M07 payroll SoT implementation / `pulse.m07.*` writers | Wave 6; C07B blocked |
| Portal staff/doctor dual-write paths | Prohibited dual-write |
| Unrelated leftovers (`PLATFORM_INTEGRATION_QA.md*`, dirty `wave3-m11-performance-evidence.json`) unless owner directs | Out of scope |

---

## 19. Acceptance gates and blocked items

| Gate | Result required |
|---|---|
| Ten sections evidenced | pass |
| **21 M06 workflows** (WF-01…WF-18, WF-19A, WF-20, WF-21) | **pass** |
| **WF-19B M07 intake** | **`BLOCKED-M07` only** (not failed; not required pass) |
| Inherited M10 duty bridge | **`BLOCKED-M10` informational** — outside Wave 5 M06 totals |
| Permissions/clinic/TZ/offline/M02/privacy/migration | pass |
| UX/a11y/responsive/appearance | pass |
| Regression + lint + tsc + build | pass |
| Owner acceptance | Explicit only — not this planning doc |
| Production approval | **Not** in scope |

See **§17.1** for pass/fail/skipped/blocked accounting without double-counting.

---

## 20. Assumptions, risks, deferred

**Assumptions:** Demo Act-as; local persistence; clinic TZ registry populated; M04/M05 frozen contracts available.

**Risks:** Offline reordering bugs; false confidence from geofence; notification storms on bulk approve; treating timesheet approval as pay authorization.

**Deferred:** Production persistence; full WCAG certification; biometrics; M07 intake (`BLOCKED-M07` / WF-19B); award/law certification of policies; Wave 6+.

---

## 21. GitHub documentation checkpoint (this planning amendment)

After planning documents only:

1. Verify only approved planning/status documentation changed.  
2. Commit and push to `ThoshiMedicals/HCDP`.  
3. Report branch, full hash, link, file list, leftovers.  
4. Confirm **no** Wave 5 runtime implementation created or modified.  
5. **Do not begin execution.**

---

## 22. Stop gate (owner-accepted freeze)

**Wave 5 is owner accepted and frozen at `6cfee6ca7ae2d0f58695569b9f61ffa939b97e49`.**  
**Wave 5 owner acceptance is not production approval.**  
**Wave 6 / M07 is NOT AUTHORIZED.**

After this status closure:

- Preserve frozen Waves 1A–5.
- Keep **`BLOCKED-M07`** explicitly blocked until Wave 6 implements a safe M07 receiving boundary.
- Keep **`BLOCKED-M10`** informational and outside Wave 5 totals.
- **Stop.** Wait for separate explicit Wave 6 authorization.
- Do not begin Wave 6 / M07 implementation.
- Do not write `pulse.m07.*` or create payroll records.

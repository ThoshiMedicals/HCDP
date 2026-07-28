# Wave 5 Implementation Plan — Module 6 Time & Attendance

**Date:** 28 July 2026  
**Status:** **PLANNING ONLY — Wave 5 execution NOT approved**  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Prerequisites:** Waves 1A–4 **owner accepted and frozen**  
**Wave 4 planning checkpoint:** `03a0beff267c9aaf382d161cbfec9f3d0df013e1`  
**Wave 4 accepted implementation:** `15f020800bbca40702ef08ad25f94f1d1999112f`  
**Wave 4 status closure:** `cdc0478322307bd484afcd3dcbdc517b0d3918e9`  
**Wave 4 evidence:** `docs/audits/WAVE4_M05_COMPLETION_REPORT.md`

Do **not** implement until explicit Wave 5 execution approval.  
Do **not** create/modify M06 runtime services, workspace sections, migrations beyond planning, or tests under this planning document.  
Do **not** alter frozen Waves 1A–4 runtime code, tests or evidence.  
Do **not** begin M07 (Wave 6) or any later wave.  
Do **not** convert `BLOCKED-M10` or proposed `BLOCKED-M07` into pass/skip/waive.

Paths are relative to the GitHub repository root (`ThoshiMedicals/HCDP` = `Development folder/`).

---

## 1. Exact scope and exclusions

### In scope (execution, when approved)

- Rebuild **Module 6 Time & Attendance** as the authoritative SoT for attendance sessions, clock/break events, exceptions, employee declarations, correction requests, approvals, timesheet calculation inputs, device/geofence verification evidence and attendance audit history.
- Replace M06 `ModuleLanding` / `TimeAttendanceModule` with a full ten-section workspace (M04/M05/M11 pattern).
- Link attendance to **M05** planned shifts/assignments via `ShiftRef` / `AssignmentRef` only (read/contracts — never edit M05 repositories or published roster history).
- Resolve people/employment/leave/clinic eligibility via **M04**/platform contracts only.
- Project actionable conditions to **M02** and aggregate operational summaries to **M01** via adapters.
- Provide **approved attendance / TimesheetRef outputs** for future M07 consumption without creating payroll truth.
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

### 2.4 M07 intake finding → blocked dependency

M07 exists only as a Wave 1 skeleton (`StaffPayModule` landing + storage stubs). Repository comments mention `linkApprovedTimesheet`, but **no safe M07-owned intake service/contract is implemented**.

**Planning decision:** Workflow “approved attendance handoff to M07” is **`BLOCKED-M07`** at Wave 5 execution until Wave 6 provides an M07-owned intake contract. M06 still **owns** approved timesheet records and publishes `TimesheetRef` + `timesheet.approved` events for later consumption. M06 must **not** invent a competing payroll SoT.

`BLOCKED-M10` from Wave 4 remains unchanged and out of Wave 5 M06 ownership.

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

| Concern | Owner |
|---|---|
| Planned roster periods/shifts/assignments/publications | **M05** |
| Workforce identity, employment, clinic assignment, leave, readiness | **M04** |
| Payroll preparation, payable outcomes, payslips, pay runs | **M07** (future) |
| Action inbox items | **M02** (projections from M06) |
| Executive aggregates | **M01** (ops summaries only) |

### 3.3 Hard prohibitions

1. Do not modify published roster history.  
2. Do not infer worked time from roster alone.  
3. Do not create payroll runs, payslips or payment records.  
4. Do not overwrite M04 workforce data.  
5. Do not write another module’s SoT store (`pulse.m04.*`, `pulse.m05.*`, `pulse.m07.*`, etc.).  
6. Do not use legacy dual-write.  
7. Do not import other modules’ repositories.

---

## 4. Functional sections (ten)

Registry section ids (planned):  
`live-attendance`, `clock-in-out`, `timesheets`, `exceptions`, `corrections`, `approvals`, `breaks`, `attendance-history`, `reports`, `settings`.

### 4.1 Live Attendance

| Field | Spec |
|---|---|
| Purpose | Real-time board of who is clocked in / on break / overdue clock-out by clinic |
| Actors | Managers, coordinators, directors (view); workers see self only |
| Permissions | `attendance.view.team` or `attendance.view.self` |
| Clinic scope | Actor clinic set; All-clinics only with elevated permission |
| Data | Open sessions + linked ShiftRef summary + exception badges |
| Controls | Filter clinic/role/status; open person drawer; escalate exception |
| Mutations | None direct (read-model); escalate → exception service |
| UX states | Loading, empty, filtered-empty, restricted, system-error, offline |
| Evidence | `section.live-attendance` browser + `U-WF-live` |

### 4.2 Clock In/Out

| Field | Spec |
|---|---|
| Purpose | Authenticated self-service and kiosk clocking against optional rostered shift |
| Actors | Workers (self); kiosk device identity; manager-entered via Approvals/Corrections |
| Permissions | `attendance.clock.self`; kiosk uses device + PIN/QR policy |
| Data | Session + clock events + verification evidence bundle |
| Controls | Clock in / out; select shift or “unrostered”; show verification status |
| Mutations | `startSession`, `clockIn`, `clockOut` |
| Validations | Duplicate open session; clinic TZ; device policy; leave conflict advisory/block per policy |
| UX states | Validation-error, restricted, offline (queue), sync-conflict |
| Evidence | `section.clock-in-out` |

### 4.3 Timesheets

| Field | Spec |
|---|---|
| Purpose | Period timesheet calculation inputs, review status, approved package for M07 |
| Actors | Worker (own); manager (team); finance view export with permission |
| Permissions | `attendance.timesheet.view`, `.submit`, `.approve` (approve via Approvals section) |
| Data | Timesheet header + daily lines derived from sessions/breaks/exceptions |
| Controls | Generate, submit, view variance vs roster, export scoped |
| Mutations | `generateTimesheet`, `submitTimesheet` |
| UX states | Empty, filtered-empty, restricted, validation-error |
| Evidence | `section.timesheets` |

### 4.4 Exceptions

| Field | Spec |
|---|---|
| Purpose | Policy-derived and manual exceptions (late, early, missed punch, overlap, unrostered, leave clash) |
| Actors | Managers; workers see own explanations |
| Permissions | `attendance.exception.view`, `.resolve`, `.override` |
| Controls | Filter severity; attach explanation; resolve/escalate to M02 |
| Mutations | `raiseException`, `resolveException`, `overrideException` |
| Evidence | `section.exceptions` |

### 4.5 Corrections

| Field | Spec |
|---|---|
| Purpose | Employee or manager correction requests against events/sessions |
| Actors | Workers request; managers create/apply |
| Permissions | `attendance.correction.request`, `attendance.correction.apply` |
| Controls | Propose time change; reason required; versioned target |
| Mutations | `requestCorrection`, `applyManagerCorrection` |
| Concurrency | expectedVersion on session/event |
| Evidence | `section.corrections` |

### 4.6 Approvals

| Field | Spec |
|---|---|
| Purpose | Approve/reject corrections and timesheets; reopen approved timesheets with audit |
| Actors | Managers / practice managers |
| Permissions | `attendance.approve`, `attendance.reopen`, `attendance.bulk.approve` |
| Controls | Queue, approve/reject, bulk preview/submit, reopen |
| Mutations | `approveCorrection`, `rejectCorrection`, `approveTimesheet`, `rejectTimesheet`, `reopenTimesheet`, `previewBulkApprove`, `submitBulkApprove` |
| Evidence | `section.approvals` |

### 4.7 Breaks

| Field | Spec |
|---|---|
| Purpose | Break start/end, missed break detection, break policy compliance |
| Actors | Workers (self); managers view team |
| Permissions | `attendance.break.self`, `attendance.view.team` |
| Mutations | `startBreak`, `endBreak`, `recordMissedBreak` |
| Evidence | `section.breaks` |

### 4.8 Attendance History

| Field | Spec |
|---|---|
| Purpose | Immutable-leaning history of sessions/events/corrections for a person/clinic/period |
| Actors | Self + managers with scope |
| Permissions | `attendance.history.view`, `attendance.audit.view` (sensitive evidence) |
| Controls | Date range, person, clinic; reveal location evidence only with permission |
| Mutations | None (read + export) |
| Evidence | `section.attendance-history` |

### 4.9 Reports

| Field | Spec |
|---|---|
| Purpose | Scoped operational reports and CSV export |
| Permissions | `attendance.report`, `attendance.export` |
| Controls | Build report; export; mask sensitive columns without `attendance.evidence.view` |
| Evidence | `section.reports` |

### 4.10 Settings & Policies

| Field | Spec |
|---|---|
| Purpose | Versioned attendance policies (thresholds, grace, rounding, breaks, overtime indicators, verification methods) |
| Actors | Managers with `attendance.policy.manage` |
| Mutations | `publishPolicy`, `archivePolicy` |
| Caveat | Prototype policies ≠ law/award/payroll/clinical certification |
| Evidence | `section.settings` |

---

## 5. End-to-end workflow matrix

Columns: **ID | Trigger | Actor | Preconditions | Service | Validations | State changes | Permission | Clinic scope | Audit/Event | Failure | Evidence**

| ID | Trigger | Actor | Preconditions | Service | Validations | State changes | Permission | Clinic | Audit / Event | Failure | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WF-01 | Rostered clock-in | Worker | Published assignment exists; no open session | `clockIn` | ShiftRef match; leave advisory/block; device policy | Session `open`; event `clock-in` | `attendance.clock.self` | Session clinic | Audit + `attendance.event.recorded` | Validation / restricted | `U-WF01` |
| WF-02 | Unrostered clock-in | Worker | Policy allows unrostered | `clockIn` (unrostered) | Policy flag; raise exception if required | Session open + exception maybe | `attendance.clock.self` | Selected clinic | Event + maybe exception | Policy block | `U-WF02` |
| WF-03 | Early clock-in | Worker | Before shift start − threshold | `clockIn` | Early threshold | Session open + early exception/advisory | `attendance.clock.self` | Clinic | Exception event | Override needed | `U-WF03` |
| WF-04 | Late arrival | Worker/system | Clock-in after start + grace | `clockIn` / evaluator | Late threshold | Late exception | clock.self | Clinic | Exception → M02 | — | `U-WF04` |
| WF-05 | Missed clock-in | System/job | Shift started; no clock-in by threshold | `raiseMissedClockIn` | Roster published | Exception open | system / `attendance.exception.raise` | Clinic | M02 create | Idempotent key | `U-WF05` |
| WF-06 | Break start | Worker | Open session; not already on break | `startBreak` | Break policy | Break `in-progress` | `attendance.break.self` | Clinic | Event | Validation | `U-WF06` |
| WF-07 | Break end | Worker | Break in progress | `endBreak` | Duration rules | Break `completed` | break.self | Clinic | Event | — | `U-WF07` |
| WF-08 | Missed break | System | Required break window elapsed | `recordMissedBreak` | Policy required break | Exception | system | Clinic | M02 | Dedupe | `U-WF08` |
| WF-09 | Normal clock-out | Worker | Open session | `clockOut` | End after start; TZ | Session `closed` | clock.self | Clinic | Event | — | `U-WF09` |
| WF-10 | Early departure | Worker | Clock-out before shift end − threshold | `clockOut` | Early-out threshold | Session closed + exception | clock.self | Clinic | Exception | — | `U-WF10` |
| WF-11 | Missed clock-out | System | Max duration / shift end + threshold | `raiseMissedClockOut` | Open session stale | Exception; optional auto-close policy | system | Clinic | M02 | Idempotent | `U-WF11` |
| WF-12 | Cross-midnight | Worker | Shift crosses local midnight | clockIn/Out | Clinic IANA; store folds/offsets | Session spans local dates | clock.self | Clinic | Events with TZ fields | Unresolved TZ | `U-WF12` / `TZ-*` |
| WF-13 | Offline capture → sync | Worker/device | Offline queue entries | `enqueueOfflineEvent`, `syncOfflineQueue` | Idempotency keys; order | Events applied / conflict | clock.self | Clinic | Sync audit | Sync-conflict UX | `U-WF13` |
| WF-14 | Employee correction request | Worker | Target event/session exists | `requestCorrection` | Reason; expectedVersion | Correction `requested` | `attendance.correction.request` | Clinic | Audit | Concurrent conflict | `U-WF14` |
| WF-15 | Manager correction | Manager | Permission | `applyManagerCorrection` | Reason; version | Event corrected; session recalc | `attendance.correction.apply` | Scope | Audit | Conflict | `U-WF15` |
| WF-16 | Approve/reject correction | Manager | Correction requested | `approveCorrection` / `reject` | Version | Approved/rejected | `attendance.approve` | Scope | Event | — | `U-WF16` |
| WF-17 | Reopen timesheet | Manager | Timesheet approved | `reopenTimesheet` | Reason; not exported-locked if flagged | Timesheet `reopened` | `attendance.reopen` | Scope | Audit | Block if M07 locked (future) | `U-WF17` |
| WF-18 | Exception escalation | Manager/system | Open exception | `escalateException` | — | M02 urgent update | exception.resolve | Scope | M02 update | Dedupe | `U-WF18` |
| WF-19 | Approved handoff to M07 | Manager/system | Timesheet approved | `publishTimesheetApproved` | Approved status | Emit TimesheetRef + event | `attendance.approve` | Scope | `timesheet.approved` | **`BLOCKED-M07`** intake call | `U-WF19` / `BLOCKED-M07` |
| WF-20 | Roster vs attendance reconcile | Manager | Period selected | `reconcileRosterAttendance` | Read-only M05 refs | Variance report + exceptions | `attendance.report` | Scope | Audit | M05 unread | `U-WF20` |
| WF-21 | Bulk review/approve | Manager | Queue selected | `previewBulkApprove` / `submitBulkApprove` | Partial success; cap notifications | Mixed results | `attendance.bulk.approve` | Scope | Bulk audit | Partial fail report | `U-WF21` |

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
| `gapUnresolved` | Spring-forward missing local time → reject or require manager override |

### 6.3 Cross-midnight / multi-clinic

- Session may span two local calendar dates; reports bucket by clinic-local date.  
- Multi-clinic workers: session clinic is the clocking clinic; cross-clinic open session blocked unless policy override.  
- Device clock skew: store `deviceReportedAt` + server `receivedAt`; flag if skew > policy threshold.

### 6.4 Offline out-of-order

- Each offline event carries `clientEventId` (idempotency) + `clientSequence` + `deviceId`.  
- Sync applies in `clientSequence` order per device/session; conflicts → sync-conflict UX.

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
| Manager-entered | Manager actor | Reason required |
| Offline capture | Device + person binding | Queued evidence |

### 7.2 Distinctions (mandatory)

- **Identity verification** ≠ **location evidence** ≠ **attendance proof of work**.  
- Geofence, IP, QR, PIN, or biometrics **alone do not prove work was performed**.  
- Biometrics (if ever proposed): require privacy impact, consent, retention schedule and **external legal review** before enablement. This plan does **not** claim regulatory compliance.

### 7.3 Evidence model

Store `VerificationEvidence` separately with sensitivity flag; reveal only with `attendance.evidence.view`. Mask in exports by default.

---

## 8. State-transition matrices

### 8.1 Attendance session

| From | To | Actor | Permission | Validations | Version | Audit/Event | Invalid |
|---|---|---|---|---|---|---|---|
| (none) | `open` | Worker/manager | clock.self / correction.apply | No other open session | v1 | session.opened | Reject |
| `open` | `on_break` | Worker | break.self | Break allowed | +1 | break.started | Reject |
| `on_break` | `open` | Worker | break.self | Break open | +1 | break.ended | Reject |
| `open` | `closed` | Worker/system | clock.self | Clock-out rules | +1 | session.closed | Reject |
| `closed` | `corrected` | Manager | correction.apply | Reason; version | +1 | session.corrected | Conflict |
| `*` | `cancelled` | Manager | override | Reason | +1 | session.cancelled | Reject terminal |

### 8.2 Clock event

| From | To | Actor | Permission | Notes |
|---|---|---|---|---|
| (none) | `recorded` | Worker/device/manager | clock / correction | Append-only preferred |
| `recorded` | `corrected` | Manager | correction.apply | New event supersedes; retain prior |
| `recorded` | `voided` | Manager | override | Reason; never delete |

### 8.3 Break

| From | To | Actor | Permission |
|---|---|---|---|
| (none) | `in_progress` | Worker | break.self |
| `in_progress` | `completed` | Worker | break.self |
| (none) | `missed` | System | system/policy |
| `*` | `voided` | Manager | override |

### 8.4 Correction request

| From | To | Actor | Permission |
|---|---|---|---|
| (none) | `requested` | Worker | correction.request |
| `requested` | `approved` | Manager | approve |
| `requested` | `rejected` | Manager | approve |
| `requested` | `withdrawn` | Worker | correction.request |
| `approved` | `applied` | System/manager | correction.apply |

### 8.5 Exception

| From | To | Actor | Permission |
|---|---|---|---|
| (none) | `open` | System/manager | exception.raise |
| `open` | `explained` | Worker | view.self + declare |
| `open`/`explained` | `resolved` | Manager | exception.resolve |
| `open` | `overridden` | Manager | override |
| `open` | `escalated` | Manager | exception.resolve → M02 |

### 8.6 Timesheet

| From | To | Actor | Permission |
|---|---|---|---|
| (none) | `draft` | System/worker | timesheet.view/generate |
| `draft` | `submitted` | Worker | timesheet.submit |
| `submitted` | `approved` | Manager | approve |
| `submitted` | `rejected` | Manager | approve |
| `approved` | `reopened` | Manager | reopen |
| `reopened` | `submitted` | Worker | timesheet.submit |

### 8.7 Approval (queue item)

| From | To | Actor | Permission |
|---|---|---|---|
| `pending` | `approved` | Manager | approve |
| `pending` | `rejected` | Manager | approve |
| `approved` | `reopened` | Manager | reopen |

### 8.8 Offline synchronization

| From | To | Actor | Permission |
|---|---|---|---|
| `queued` | `syncing` | Device/system | clock.self |
| `syncing` | `applied` | System | — |
| `syncing` | `conflict` | System | — |
| `conflict` | `resolved` | Worker/manager | correction / sync.resolve |
| `queued` | `discarded` | Manager | override |

Invalid transitions throw typed errors surfaced as ValidationError or ConcurrentConflict UX.

---

## 9. Policy and exception precedence

### 9.1 Configurable policy rules (versioned)

Early/late thresholds; grace periods; rounding; break requirements; overtime **indicators** (not pay); max session duration; missed punches; overlapping attendance; duplicate events; unrostered attendance; clinic mismatch; approved leave conflict; roster cancellation/supersession; manager overrides (permission + reason + audit).

### 9.2 Precedence (high → low)

1. Hard safety/integrity blocks (duplicate open session, unresolved TZ, tamper flag if policy hard-block).  
2. Approved leave conflict (M04) — block or warn per policy.  
3. Roster cancelled/superseded linkage — detach or exception; **do not rewrite roster**.  
4. Verification method failure — warn/block per method policy.  
5. Early/late/break thresholds.  
6. Rounding (display/calc inputs only).  
7. Manager override (audited).

### 9.3 Certification disclaimer

Prototype policies are **not** employment-law, industrial-award, payroll or clinical-safety certification.

---

## 10. Permission and clinic-scope matrix

### 10.1 Permission codes (planned)

`attendance.view.self`, `attendance.view.team`, `attendance.clock.self`, `attendance.break.self`, `attendance.correction.request`, `attendance.correction.apply`, `attendance.approve`, `attendance.reopen`, `attendance.override`, `attendance.exception.view`, `attendance.exception.resolve`, `attendance.evidence.view`, `attendance.audit.view`, `attendance.bulk.approve`, `attendance.export`, `attendance.report`, `attendance.policy.manage`, `attendance.timesheet.view`, `attendance.timesheet.submit`, `attendance.manager.enter`

### 10.2 Role mapping (demo Act-as → codes)

| Role class | Typical grants |
|---|---|
| Worker | view.self, clock.self, break.self, correction.request, timesheet.view/submit |
| Clinic/Practice Manager | + view.team, correction.apply, approve, reopen, exception.*, bulk.approve, report, manager.enter |
| Director / Senior Admin | + override, policy.manage, evidence.view, audit.view, export |
| Finance | report/export scoped; no clock mutations |
| Read-only auditor | view.team + audit.view (no mutate) |

### 10.3 Enforcement & tests

- Enforce in **services**, not UI alone.  
- Named tests: positive grant; negative deny; cross-clinic deny; export bypass attempt deny; bulk partial-success; evidence masking without `evidence.view`.

---

## 11. Integration-contract matrix

| # | Provider | Consumer | Contract/Event | Direction | Owner | R/W | Version / idempotency | Stale protection | Prohibited |
|---|---|---|---|---|---|---|---|---|---|
| C01 | M05 | M06 | ShiftRef / AssignmentRef | M06 reads | M05 | Read via adapter | Ref snapshot at link time | Stale publication version → exception | M05 repo import/write |
| C02 | M04 | M06 | PersonRef / leave / eligibility | M06 reads | M04 | Read | asOf timestamp | Stale leave → re-check | M04 repo write |
| C03 | M03 | M06 | Clinic/user/role | M06 reads | Platform/M03 | Read | — | — | Bypass permissions |
| C04 | M06 | M02 | Action inbox events | M06→M02 | M02 item / M06 condition | Project | Stable projection keys | Stale-replay blocked | Direct M02 repo dual-write |
| C05 | M06 | M01 | Executive aggregates | M06→M01 | M01 | Aggregate only | — | — | Raw GPS/biometrics |
| C06 | M06 | Platform bus | `attendance.*`, `timesheet.approved` | Publish | M06 | Event | Idempotency keys | Deduped | — |
| C07 | M06 | M07 (future) | TimesheetRef | Publish for intake | M06 record; M07 intake | **Blocked intake** | — | — | Writing `pulse.m07.*` |
| C08 | Platform | M06 | clinic-timezone | Read | Platform | Read | — | Unresolved TZ | Silent UTC |

**C07 status:** **`BLOCKED-M07`** until Wave 6 ships M07-owned intake. M06 still publishes refs/events.

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
| Correction awaiting approval | Correction requested | `m06::corr::{correctionId}` | — | Approve/reject | Block | Cap |
| Timesheet awaiting approval | Submitted | `m06::ts::{timesheetId}` | — | Approve/reject | Block | Cap |
| Offline sync failure | Sync conflict | `m06::sync::{deviceId}::{batchId}` | Retry | Resolved | Block | Cap |

Implementation pattern: mirror `m05-inbox-sync.ts` → `dispatchActionInboxEvent` (not a no-op registry observer).

### 12.2 M01

Aggregate only: open sessions count, open exceptions, pending approvals, offline conflict count — **no** raw coordinates, biometrics, or full evidence payloads.

---

## 13. Offline, concurrency and security

| Topic | Plan |
|---|---|
| Optimistic concurrency | `version` on sessions, corrections, timesheets, policies |
| Idempotency | `clientEventId` / `idempotencyKey` on clock, offline, bulk |
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
| Sync-conflict | Offline apply conflict | SyncConflictState | Resolve |
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
| Workflows WF-01…WF-21 | Unit/integration/browser or `BLOCKED-M07` for WF-19 intake only | Yes |
| Permissions + clinic scope | Named +/- tests | Yes |
| Concurrency / stale versions | Conflict UX | Yes |
| Offline + idempotent retry | Queue + sync | Yes |
| TZ/DST + cross-midnight | TZ-01…TZ-08 | Yes |
| Roster vs attendance | WF-20 | Yes |
| Leave conflicts | M04 read | Yes |
| Policy overrides | Audit | Yes |
| M02 lifecycles | Create/dedupe/update/close/stale | Yes |
| M07 boundary | No `pulse.m07.*`; BLOCKED-M07 intake | Yes |
| Privacy/export | Mask evidence | Yes |
| Migration/seed/rollback | MIG-01…03 | Yes |
| UX states | Real triggers | Yes |
| A11y + widths + appearance | As §14 | Yes |
| Frozen-wave / platform regression | npm test + platform-qa | Yes |
| Lint / tsc / production build | Pass (lint warnings OK) | Yes |

Report **passed / failed / skipped / blocked** separately. Only approved blocked codes: **`BLOCKED-M07`** (handoff intake), and inherited **`BLOCKED-M10`** (unchanged, not an M06 skip).

---

## 18. Exact implementation inventory

### 18.1 Files to create (execution)

| Path | Purpose |
|---|---|
| `src/modules/m06-time-attendance/AttendanceWorkspace.tsx` | Ten-section chrome |
| `src/modules/m06-time-attendance/context.tsx` | Actor, section, refresh |
| `src/modules/m06-time-attendance/permissions.ts` | Codes + assert helpers |
| `src/modules/m06-time-attendance/types/domain.ts` | Session/event/break/exception/correction/timesheet/policy |
| `src/modules/m06-time-attendance/types/timezone.ts` | Fold/gap types |
| `src/modules/m06-time-attendance/types/policy.ts` | Versioned policy rules |
| `src/modules/m06-time-attendance/repository/local-store.ts` | SoT persistence |
| `src/modules/m06-time-attendance/services/*` | clock, session, break, exception, correction, approval, timesheet, reconcile, bulk, reporting, policy, offline-sync, clinic-time, events, errors, audit-helpers |
| `src/modules/m06-time-attendance/sections/*` | Ten section components |
| `src/modules/m06-time-attendance/components/SectionFrame.tsx` + `components/ux/*` | UX states |
| `src/modules/m06-time-attendance/adapters/m04-person-read.ts` | People/leave reads |
| `src/modules/m06-time-attendance/adapters/m05-shift-read.ts` | Shift/assignment refs |
| `src/modules/m06-time-attendance/adapters/m06-inbox-sync.ts` | M02 projections |
| `src/modules/m06-time-attendance/adapters/m06-executive.ts` | M01 aggregates |
| `src/modules/m06-time-attendance/adapters/m07-timesheet-bridge.ts` | **Deferred** — returns BLOCKED-M07 |
| `src/modules/m06-time-attendance/storage/seed-safe.ts`, `rollback-seed.ts`, `bootstrap.ts`, `migrate-v2.ts` | Seed/migrate |
| `src/modules/m06-time-attendance/tests/*` | Domain, authz, timezone, offline, adapters, migration, bulk, privacy, ux, performance |
| `scripts/wave5-m06-acceptance-evidence.mjs` | Evidence harness |
| `docs/audits/WAVE5_M06_COMPLETION_REPORT.md` | Execution only |
| `docs/audits/wave5-m06-acceptance-evidence.json` | Generated |
| `docs/audits/wave5-m06-performance-evidence.json` | Generated |

### 18.2 Files to modify (execution) — freeze-safe

| Path | Why | Freeze protection |
|---|---|---|
| `TimeAttendanceModule.tsx` | Mount workspace | M06 only |
| `module.config.ts` / storage keys / migrations | Extend keys | Additive |
| `module-register.ts` sections for `time-attendance` | Align ten sections | Additive labels |
| `legacy-routes.ts` | Map to new section ids | Additive |
| `package.json` | `test:wave5-evidence` script | Additive |
| Platform contracts `attendance-ref.ts` / `timesheet-ref.ts` | Additive optional fields | Backward compatible |
| `workforce-events.ts` | Add events if needed | Additive |
| `.cursor/rules/hcdp-wave-control.mdc` | Post-acceptance status only | Status text |

### 18.3 Prohibited unchanged (must not modify in Wave 5 execution)

- Frozen M04/M05/M11 runtime SoT logic and accepted evidence JSON as historical baselines (except additive platform contracts noted above).  
- M07 payroll SoT implementation (Wave 6).  
- Creating `pulse.m07.*` records from M06.  
- Dual-write to portal staff/doctor stores.  
- Unrelated leftovers: `PLATFORM_INTEGRATION_QA.md*`, `wave3-m11-performance-evidence.json` unless owner directs.

---

## 19. Acceptance gates and blocked items

| Gate | Result required |
|---|---|
| Ten sections evidenced | pass |
| WF-01…WF-18, WF-20…WF-21 | pass |
| WF-19 M07 intake call | **`BLOCKED-M07`** allowed |
| Inherited M10 duty bridge | **`BLOCKED-M10`** remains blocked (not waived by Wave 5) |
| Permissions/clinic/TZ/offline/M02/privacy/migration | pass |
| UX/a11y/responsive/appearance | pass |
| Regression + lint + tsc + build | pass |
| Owner acceptance | Explicit only — not this planning doc |
| Production approval | **Not** in scope |

---

## 20. Assumptions, risks, deferred

**Assumptions:** Demo Act-as; local persistence; clinic TZ registry populated; M04/M05 frozen contracts available.

**Risks:** Offline reordering bugs; false confidence from geofence; notification storms on bulk approve; treating timesheet approval as pay authorization.

**Deferred:** Production persistence; full WCAG certification; biometrics; M07 intake (`BLOCKED-M07`); award/law certification of policies; Wave 6+.

---

## 21. GitHub documentation checkpoint (this planning amendment)

After planning documents only:

1. Verify only approved planning/status documentation changed.  
2. Commit and push to `ThoshiMedicals/HCDP`.  
3. Report branch, full hash, link, file list, leftovers.  
4. Confirm **no** Wave 5 runtime implementation created or modified.  
5. **Do not begin execution.**

---

## 22. Stop gate (planning)

**Wave 5 execution remains NOT APPROVED.**

After this documentation closure:

- Return this plan as the controlling Wave 5 M06 specification.  
- **Stop.** Wait for explicit Wave 5 execution approval.  
- Do not alter frozen Waves 1A–4 runtime.  
- Do not start M07 / Wave 6.  
- Do not mark Wave 5 accepted or production-ready.

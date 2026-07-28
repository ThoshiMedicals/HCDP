# Wave 4 Implementation Plan — Module 5 Roster & Shift Management

**Date:** 28 July 2026 (owner-acceptance status closure)  
**Status:** **Owner accepted and frozen** — **NOT** production-approved  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Prerequisites:** Wave 2 and Wave 3 **owner accepted and frozen** (27 July 2026)  
**Wave 3 evidence:** `Development folder/docs/audits/WAVE3_M11_COMPLETION_REPORT.md`  
**Accepted implementation checkpoint:** `15f020800bbca40702ef08ad25f94f1d1999112f`  
**Planning checkpoint:** `03a0beff267c9aaf382d161cbfec9f3d0df013e1`  
**Acceptance evidence:** `docs/audits/WAVE4_M05_COMPLETION_REPORT.md`  
**Stop checkpoint:** `docs/audits/WAVE4_CHECKPOINT_STOP_BEFORE_WAVE5.md`

Wave 4 execution was completed and **owner accepted** 28 July 2026.  
Do **not** alter frozen Wave 2, Wave 3 or Wave 4 implementation without explicit owner instruction.  
Do **not** start Wave 5 runtime implementation until explicit Wave 5 execution approval.  
Wave 5 planning document: `docs/architecture/WAVE5_M06_IMPLEMENTATION_PLAN.md`.  
**`BLOCKED-M10` remains blocked** (workflow 12) until a safe M10-owned task contract exists.

Paths below are relative to the GitHub repository root (`ThoshiMedicals/HCDP`), which is the `Development folder/` working tree unless noted as a workspace-root documentation mirror.

---

## 1. Exact scope and exclusions

### In scope (execution, when approved)

- Rebuild **Module 5 Roster & Shift Management** as the authoritative SoT for roster periods, draft/published versions, shifts, assignments, coverage, open shifts, swaps, publication/acknowledgement, roster warnings, and planning-only cost forecasts.
- Replace M05 landing/`RosterModule` with a full ten-section workspace (M03/M04/M11 pattern).
- Consume **authoritative roster eligibility** only via M04/platform (`authority: "m04-platform"`). M11 contributes **only through M04**.
- Project actionable conditions to **M02** and aggregate operational summaries to **M01** via adapters.
- Idempotent, non-destructive M05 seed/migration; preserve frozen Wave 2 and Wave 3 data; no dual-write; no M06/M07/M22 record generation.

### Explicit exclusions

- Further Wave 4 runtime changes after owner acceptance without explicit instruction (Wave 4 is **frozen**).
- M06 attendance SoT, M07 payroll SoT, M22 recruitment SoT.
- Wave 5+ workflows (execution **not** approved).
- Production DB auth / server-side persistence (deferred).
- Dual-write to portal staff/doctors or cross-module repository imports/writes.
- Treating M05 cost forecast as payroll truth.
- Owning general tasks in M05 (M10 boundary — see §22; **`BLOCKED-M10` remains blocked** until a safe M10-owned contract exists — not passed, skipped, resolved or waived).
- Silent UTC fallback when clinic IANA timezone is missing/invalid.
- Treating local prototype performance as a production SLA.
- Treating fatigue/conflict rules as legal, award or clinical-safety certification.
- Treating Wave 4 owner acceptance as production approval.

---

## 2. Source-of-truth boundaries

**M05 owns:** roster periods; draft and published roster versions; shifts and shift requirements; shift assignments; coverage calculations; open shifts; swap requests and roster-change workflows; publication and acknowledgement records; roster-specific warnings; roster cost forecasts; roster-availability declarations (period preferences only).

**M04 owns:** workforce people and engagements; clinic assignments; employment classifications; readiness and the **authoritative roster-eligibility result**.

**M11** contributes training status **only through M04** (never imported into M05 services).

| Concern | Owner | M05 may | M05 must not |
|---|---|---|---|
| Staff availability (workforce) | M04 | Read via workforce/availability contract | Own second employment-availability SoT |
| Recurring availability | M04 | Read for conflict checks | Duplicate as payroll/attendance truth |
| Unavailability | M04 | Read for conflict checks | Silently override |
| Approved leave | M04 | Consume via leave contract | Override without permission/reason/audit |
| Leave requests (workforce) | M04 | Read status | Approve workforce leave |
| Roster-availability declarations | M05 | Own roster-period preferences/declarations | Become M04 leave SoT |
| Roster requests (swap/change) | M05 | Own request lifecycle | Create M06 attendance or M07 payroll records |
| Attendance / payable hours | M06 / M07 (future) | Reference ShiftRef only later | Infer attendance or create M06/M07 records |

**Hard rule:** M05 must not create M06 attendance records, M07 payroll records, or M22 candidate records.

### Data-ownership matrix

| Data | Owner | M05 |
|---|---|---|
| Roster periods / versions / publications | M05 | Own |
| Shifts / assignments / open shifts / swaps | M05 | Own |
| Coverage / roster warnings / cost forecasts | M05 | Own |
| People / engagements / classifications / clinic assignments | M04 | Read via contract |
| Readiness / roster eligibility result | M04 | Consume via platform (`authority: "m04-platform"`) |
| Approved leave / workforce availability | M04 | Consume via contract; no silent override |
| Training contributions | M11 → M04 only | Must not import M11 repos |
| Attendance / payable hours | M06 / M07 (future) | Must not create |
| Action inbox items | M02 | Projections only |
| Executive aggregates | M01 | Aggregate ops projections only |
| Opening/closing duty tasks | M10 (if safe) | Adapter only; deferred if unsafe |

---

## 3. Planned file inventory

### 3.1 Create (proposed at execution — **not created by this amendment**)

#### Workspace, context, permissions

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/RosterWorkspace.tsx` | Section nav + `?section=` deep-link write-back |
| `src/modules/m05-roster/context.tsx` | Provider, actor, clinic scope, bootstrap |
| `src/modules/m05-roster/permissions.ts` | Permission codes + clinic-scope asserts |

#### Domain and policy types

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/types/domain.ts` | Period, shift, assignment, open-shift, swap, publication, ack, coverage, cost types |
| `src/modules/m05-roster/types/policy.ts` | Versioned conflict/fatigue/coverage/publication policy shapes |
| `src/modules/m05-roster/types/timezone.ts` | Clinic-local shift time, offset/fold, canonical instant shapes |

#### Repository / local persistence

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/repository/local-store.ts` | Typed local persistence facade over storage keys |

#### Storage bootstrap, migration, seed, rollback

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/storage/bootstrap.ts` | Client bootstrap / ensure collections |
| `src/modules/m05-roster/storage/seed-safe.ts` | Idempotent non-destructive seed |
| `src/modules/m05-roster/storage/rollback-seed.ts` | Seed-owned rollback only |
| `src/modules/m05-roster/storage/migrate-v2.ts` | Additive M05 schema migration (insert-if-absent; no Wave 2/3 wipe) |

#### Services (period, shift, assignment, eligibility, coverage, conflict, publication, acknowledgement, swap, open-shift, availability-read, cost, reporting, policy, events, bulk)

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/services/period-service.ts` | Roster period lifecycle |
| `src/modules/m05-roster/services/shift-service.ts` | Shift CRUD, split/overnight rules |
| `src/modules/m05-roster/services/assignment-service.ts` | Assign / replace / history |
| `src/modules/m05-roster/services/eligibility-service.ts` | M04/platform eligibility orchestration |
| `src/modules/m05-roster/services/coverage-service.ts` | Coverage calculation |
| `src/modules/m05-roster/services/conflict-service.ts` | Conflict/fatigue evaluation |
| `src/modules/m05-roster/services/publication-service.ts` | Preview, publish, supersede, cancel |
| `src/modules/m05-roster/services/acknowledgement-service.ts` | Ack/decline per publication version |
| `src/modules/m05-roster/services/swap-service.ts` | Swap lifecycle |
| `src/modules/m05-roster/services/open-shift-service.ts` | Open-shift lifecycle |
| `src/modules/m05-roster/services/availability-read-service.ts` | M04 leave/availability reads |
| `src/modules/m05-roster/services/cost-forecast-service.ts` | Planning-only cost forecast |
| `src/modules/m05-roster/services/reporting-service.ts` | Scoped reports/export |
| `src/modules/m05-roster/services/policy-service.ts` | Versioned roster policies |
| `src/modules/m05-roster/services/events.ts` | Workforce event emission |
| `src/modules/m05-roster/services/bulk-operation-service.ts` | Bulk preview/submit/retry |
| `src/modules/m05-roster/services/clinic-time-service.ts` | Clinic IANA TZ resolve + DST fold/gap |

#### Ten functional section files

| Exact path | Section |
|---|---|
| `src/modules/m05-roster/sections/RosterBoardSection.tsx` | Roster Board |
| `src/modules/m05-roster/sections/CoverageSection.tsx` | Coverage |
| `src/modules/m05-roster/sections/OpenShiftsSection.tsx` | Open Shifts |
| `src/modules/m05-roster/sections/AvailabilityLeaveSection.tsx` | Availability & Leave |
| `src/modules/m05-roster/sections/RequestsSection.tsx` | Requests |
| `src/modules/m05-roster/sections/ConflictsWarningsSection.tsx` | Conflicts & Warnings |
| `src/modules/m05-roster/sections/PublishedHistorySection.tsx` | Published History |
| `src/modules/m05-roster/sections/CostForecastSection.tsx` | Cost Forecast |
| `src/modules/m05-roster/sections/ReportsSection.tsx` | Reports |
| `src/modules/m05-roster/sections/SettingsSection.tsx` | Settings |
| `src/modules/m05-roster/sections/index.ts` | Barrel |

#### UX-state components

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/components/ux/LoadingState.tsx` | Loading |
| `src/modules/m05-roster/components/ux/EmptyState.tsx` | Empty |
| `src/modules/m05-roster/components/ux/FilteredEmptyState.tsx` | Filtered-empty |
| `src/modules/m05-roster/components/ux/RestrictedState.tsx` | Restricted |
| `src/modules/m05-roster/components/ux/ValidationErrorState.tsx` | Validation-error |
| `src/modules/m05-roster/components/ux/SystemErrorState.tsx` | System-error |
| `src/modules/m05-roster/components/ux/OfflineState.tsx` | Offline |
| `src/modules/m05-roster/components/ux/ConcurrentConflictState.tsx` | Concurrent-conflict |
| `src/modules/m05-roster/components/ux/index.ts` | Barrel |

#### Adapters (M02, M01, M04, M10, platform)

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/adapters/m05-inbox-sync.ts` | M02 create/update/dedupe/close/stale-replay |
| `src/modules/m05-roster/adapters/m05-executive.ts` | M01 aggregate operational projections only |
| `src/modules/m05-roster/adapters/m04-person-read.ts` | Controlled M04 person/engagement/leave reads via contracts |
| `src/modules/m05-roster/adapters/m10-duty-bridge.ts` | **Deferred unless M10 contract safe** — see §22 |
| `src/modules/m05-roster/adapters/platform-events.ts` | Thin emit/consume helpers for platform contracts |

#### Tests and Wave 4 evidence script

| Exact path | Purpose |
|---|---|
| `src/modules/m05-roster/tests/m05-domain.test.ts` | Domain + state transitions |
| `src/modules/m05-roster/tests/m05-authz.test.ts` | Permissions + clinic scope |
| `src/modules/m05-roster/tests/m05-timezone-dst.test.ts` | Clinic TZ / DST / cross-midnight |
| `src/modules/m05-roster/tests/m05-eligibility.test.ts` | Eligibility + overrides |
| `src/modules/m05-roster/tests/m05-conflict-policy.test.ts` | Fatigue/conflict policies |
| `src/modules/m05-roster/tests/m05-publication.test.ts` | Immutable publication + ack aggregation |
| `src/modules/m05-roster/tests/m05-swap-open.test.ts` | Swap + open-shift |
| `src/modules/m05-roster/tests/m05-bulk.test.ts` | Bulk safety/retry |
| `src/modules/m05-roster/tests/m05-cost-privacy.test.ts` | Cost/rate masking |
| `src/modules/m05-roster/tests/m05-migration.test.ts` | Seed/idempotency/rollback |
| `src/modules/m05-roster/tests/m05-adapters.test.ts` | M02/M01/eligibility adapters |
| `src/modules/m05-roster/tests/m05-ux-states.test.ts` | Eight UX states (functional) |
| `scripts/wave4-m05-acceptance-evidence.mjs` | Fresh evidence runner |
| `docs/audits/WAVE4_M05_COMPLETION_REPORT.md` | Completion report (execution only) |

#### Additive platform contracts, refs, registries, events

| Exact path | Purpose |
|---|---|
| `src/platform/workforce/contracts/roster-period-ref.ts` | RosterPeriodRef |
| `src/platform/workforce/contracts/roster-publication-ref.ts` | RosterPublicationRef |
| `src/platform/workforce/contracts/assignment-ref.ts` | AssignmentRef |
| `src/platform/workforce/contracts/open-shift-ref.ts` | OpenShiftRef |
| `src/platform/workforce/contracts/swap-request-ref.ts` | SwapRequestRef |
| `src/platform/workforce/events/roster-events.ts` | `roster.published`, assignment/swap/open-shift events |
| `src/platform/workforce/registries/roster-projection-registry.ts` | Optional registry for M01/M02 projection hooks |

### 3.2 Modify (existing files — proposed at execution only)

| Exact path | Why modification is required | How frozen Wave 2 / Wave 3 behaviour is protected |
|---|---|---|
| `src/modules/m05-roster/RosterModule.tsx` | Mount `RosterWorkspace` instead of landing | Additive mount only; no M04/M11 code paths touched |
| `src/modules/m05-roster/module.config.ts` | Register ten sections + flags | M05-local config; other modules unchanged |
| `src/modules/m05-roster/index.ts` | Export workspace/services as needed | Additive exports; keep existing public surface stable where possible |
| `src/modules/m05-roster/adapters/index.ts` | Export new adapters | Additive; retain Wave 3 eligibility export |
| `src/modules/m05-roster/adapters/eligibility-read.ts` | Extend orchestration for shift-window/`asOf` if needed | **Must keep** `authority: "m04-platform"`; must continue to call `getAuthoritativeWorkforceEligibility`; no M11 repo imports |
| `src/modules/m05-roster/adapters/platform.ts` | Wire event/ref helpers | Additive; no writes into M04/M11 stores |
| `src/modules/m05-roster/repository/index.ts` | Point at local-store domain collections | Preserve Wave 1 skeleton API where tests depend on it; additive collections only |
| `src/modules/m05-roster/repository/types.ts` | Expand repository interfaces | Additive types; existing ShiftRef usage retained |
| `src/modules/m05-roster/storage/index.ts` | Expose bootstrap/seed/migrate | Non-destructive; no wipe of prior keys |
| `src/modules/m05-roster/storage/keys.ts` | Add collection keys | New keys only; retain `M05_MIGRATION_ID` lineage |
| `src/modules/m05-roster/storage/migrations.ts` | Register additive migrations | Insert-if-absent; never mutate Wave 2/3 stores |
| `src/components/workspaces/ModuleWorkspace.tsx` | Full `roster` workspace entry | Switch case additive; other modules untouched |
| `src/platform/workforce/contracts/index.ts` | Export new refs | Additive exports only |
| `src/platform/workforce/contracts/shift-ref.ts` | Extend fields if required for local TZ/fold | Backward-compatible optional fields; existing validators/tests must still pass |
| `src/platform/workforce/services/index.ts` | Export any new shared helpers if placed platform-side | Additive; clinic-timezone behaviour from Wave 3 must remain |
| `src/platform/workforce/demo/workforce-demo-refs.ts` | Demo ShiftRef/period refs for M05 seed | Additive demo refs; do not overwrite existing frozen demo people/training |
| `src/platform/workforce/validation/workforce-reference-validation.ts` | Validate new refs | Additive validators; existing ShiftRef validation unchanged in semantics |
| `docs/architecture/WORKFORCE_CONTRACTS.md` | Document M05 refs/events/boundaries | Documentation only |
| `PLATFORM_STORAGE_REGISTER.md` (repo root) | Register M05 keys/migrations | Documentation only; no runtime dual-write |
| `.cursor/rules/hcdp-wave-control.mdc` | Post-execution status only | Status text only after acceptance — **not** in this planning amendment |

**Explicitly out of scope for modification under Wave 4 execution (freeze protection):**

- All `src/modules/m04-staff-doctors/**` readiness ownership logic (consume only).
- All `src/modules/m11-training/**` implementation (M11 → M04 only).
- M06/M07/M22 modules beyond contract consumers.
- Destructive changes to Wave 3 `clinic-timezone.ts` semantics (no silent UTC).

### 3.3 Storage keys (planned)

`pulse.m05.roster.{meta,periods,shifts,assignments,openShifts,swaps,publications,acknowledgements,coverage,policies,costForecasts,audit,ui}` — exact set confirmed at execution; Wave 1 empty collections retained; never overwrite existing non-seed rows.

---

## 4. Clinic timezone and DST

### Binding rules

1. All roster day-boundary, shift-local display, cross-midnight, and DST calculations **must** use the **clinic’s configured IANA timezone**.
2. **No silent UTC fallback.** If clinic timezone is missing, invalid, or unavailable, return an **explainable unresolved** result (`ok: false`, reason code, remediation) and **block** authoritative publish/assign decisions that depend on local time.
3. Browser-local timezone may be used only for incidental display hints, never as authoritative clinic time.

### Storage sufficient to preserve intent

Each shift (and any time-bounded roster entity) must store enough to reconstruct intent:

| Field | Purpose |
|---|---|
| `clinicId` | Scope + timezone lookup |
| `timeZoneId` | IANA id used at write (e.g. `Australia/Sydney`) |
| `localStart` / `localEnd` | Intended clinic-local civil times (date + time) |
| `utcStart` / `utcEnd` | Canonical instants (ISO UTC) |
| `startOffsetMinutes` / `endOffsetMinutes` | Offset applied at those instants |
| `startFold` / `endFold` | Disambiguation for repeated local hour (`0` earlier / `1` later) where applicable |
| `asOf` (on evaluations) | Deterministic recalculation input |

### Required tests (`m05-timezone-dst.test.ts` evidence IDs)

| Evidence ID | Scenario |
|---|---|
| `TZ-01` | Cross-midnight shifts (local end date after start date; UTC range correct) |
| `TZ-02` | Clinic calendar date differs from UTC date for same instant |
| `TZ-03` | DST missing local hour (spring-forward gap) → unresolved or next-valid policy with explanation |
| `TZ-04` | DST repeated local hour (fall-back) stored with fold |
| `TZ-05` | Explicit repeated-hour disambiguation (`fold` / offset choice) round-trips |
| `TZ-06` | Two clinics in different IANA timezones produce different canonical instants for same local wall time |
| `TZ-07` | Deterministic recalculation using the same `asOf` yields identical eligibility/conflict results |
| `TZ-08` | Invalid or unavailable timezone → explainable unresolved; no silent UTC |

Reuse Wave 3 platform `clinic-timezone` helpers where compatible; do not weaken “no silent UTC” semantics.

---

## 5. Twelve-workflow matrix

Controlling-plan minimum workflows, listed **separately** (not a combined “1–12: Yes” row).

| # | Workflow name | Starting state | Principal actors | Service operations | Permission / clinic-scope checks | Eligibility / concurrency checks | Resulting records / events | M02 / M01 / M10 projection | Unit / Integration / Browser evidence IDs |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Create roster period | No period / list empty | Roster coordinator, clinic manager | `period-service.create` | `roster.period.create`; clinic scope on `clinicId` | Unique open draft period rules per clinic/date range | Period `draft`; audit; optional `roster.period.created` | M01 period-count aggregate | `U-WF01` / `I-WF01` / `B-WF01` |
| 2 | Add and edit shifts | Period `draft` or `under_review` | Coordinator, clinic manager | `shift-service.create/update` | `roster.shift.edit`; clinic scope | Version check on period; TZ resolve required | Shift rows; audit | None unless coverage gap | `U-WF02` / `I-WF02` / `B-WF02` |
| 3 | Assign eligible worker | Shift `unassigned`/`draft` | Coordinator, clinic manager | `assignment-service.assign` + `eligibility-service.evaluate` | `roster.assign`; clinic scope | M04/platform eligibility; leave/overlap; optimistic version | Assignment history row; events | M02 close gap if filled | `U-WF03` / `I-WF03` / `B-WF03` |
| 4 | Display blocking/advisory eligibility reasons | Assignment attempt / picker | Coordinator, worker (own) | `eligibility-service.evaluate` | `roster.view` (+ sensitive masking) | `authority: "m04-platform"`; `asOf` | Explainable decision payload (no write required) | None | `U-WF04` / `I-WF04` / `B-WF04` |
| 5 | Check cross-clinic conflicts and fatigue | Draft board with assignments | Coordinator, clinic manager | `conflict-service.evaluate` | `roster.view` / `roster.review` | Versioned policy; multi-clinic engagement reads | Conflict/warning records | M02 on hard unresolved gaps after publish rules | `U-WF05` / `I-WF05` / `B-WF05` |
| 6 | Publish whole or selected clinic roster | Period `ready_to_publish` | Clinic manager, workforce admin | `publication-service.preview` + `publish` | `roster.publish`; clinic scope; emergency-override if warnings | Revalidate all assignments at publish `asOf`; stale draft version blocked | Immutable publication snapshot; period → `published`; prior → `superseded` if replace | M02 unacknowledged publication; M01 publish summary | `U-WF06` / `I-WF06` / `B-WF06` |
| 7 | Notify and request acknowledgement | Publication exists | System + workers | `acknowledgement-service.request/ack/decline` | `roster.acknowledge` (own); `roster.view` | Exact publication version; superseded ack rejected | Ack records; **derived** publication ack status | M02 unacknowledged update/close | `U-WF07` / `I-WF07` / `B-WF07` |
| 8 | Request/approve swap | Published assignment | Worker, recipient, manager | `swap-service.request/accept/approve/reject` | `roster.swap.request` / `roster.swap.approve`; clinic scope; no self-approve where required | Eligibility both; roster version recheck at approval | Swap record; assignment history; events | M02 swap-requiring-action lifecycle | `U-WF08` / `I-WF08` / `B-WF08` |
| 9 | Offer open shift and assign approved replacement | Shift `open` / coverage gap | Coordinator, eligible workers | `open-shift-service.offer/accept/select` | `roster.open_shift.manage` / accept; clinic scope | Eligibility filter; version-checked fill; no duplicate accept | Open-shift + assignment; events | M02 open-shift escalation close on fill | `U-WF09` / `I-WF09` / `B-WF09` |
| 10 | Urgent coverage escalation | Hard coverage gap | Coordinator, clinic manager, emergency override | `coverage-service.escalate` + open-shift/publish paths | `roster.open_shift.manage` + override as needed | Concurrent fill protection | Escalation audit; open shift / M02 item | M02 open-shift escalation create/update | `U-WF10` / `I-WF10` / `B-WF10` |
| 11 | Version published change | Period `published` (any ack derived status) | Clinic manager, workforce admin | `publication-service.supersede` / audited amendment | `roster.publish` | Stale version blocked; revalidate eligibility | New immutable publication; prior `superseded` | M02 close old / open new conditions; M01 update | `U-WF11` / `I-WF11` / `B-WF11` |
| 12 | Transfer opening/closing duties to M10 adapter | Published shift with duty flags | System / coordinator | `m10-duty-bridge` (if enabled) | Service-scoped; clinic scope | Deduped M10 task keys | M10-owned task refs only | **M10 deferred if unsafe** — see §22; no M05 task SoT | `U-WF12` / `I-WF12` / `B-WF12` or `BLOCKED-M10` |

---

## 6. Shift lifecycle

| State | Meaning |
|---|---|
| `draft` | Editable, not firm commitment |
| `unassigned` | Needs a worker |
| `assigned` | Worker assigned (draft or published) |
| `open` | Released as open shift |
| `offered` | Offered to worker(s) |
| `accepted` | Worker accepted (pending final assign if required) |
| `declined` | Worker declined |
| `cancelled` | Cancelled with reason/audit |
| `completed-reference` | Shift ended; **not** attendance truth |
| `superseded` | Replaced by later version/amendment |

| Topic | Rule |
|---|---|
| Split shifts | Allowed as linked parts with shared `splitGroupId`; each part validated |
| Overnight / cross-midnight | Allowed; store fields per §4 |
| Recurring templates | Generate draft instances; template ≠ published truth |
| Breaks | Planned break fields only — not actual attendance/pay (M06/M07) |
| Location/role changes | Draft OK; published → new version or audited amendment |
| Cancel after acknowledgement | Reason + audit + notify; close related inbox items |
| Replace assigned worker | Eligibility recheck + history row retained |
| Assignment history | Append-only; no silent overwrite |

**Hard rule:** M05 must **not** infer actual attendance or payable hours (future M06/M07).

Full transition matrix: §19.2.

---

## 7. Eligibility and override rules

Every assignment, open-shift acceptance and swap **must** call M04/platform roster-eligibility.

Decision payload must include: `authority: "m04-platform"`; person; engagement; clinic; role/capability; shift time range; evaluated `asOf`; readiness result; blocking/warning reasons; rule/version refs; remediation where available.

| Condition class | Behaviour |
|---|---|
| Hard-block (suspended person, blocking credential/training, approved leave clash) | Block assignment |
| Warning (advisory readiness, soft fatigue) | Permit with warning |
| Authorised override | Permit only with assign + override permission, reason, audit |
| Never overridable (missing person SoT, unresolved clinic TZ for authoritative calc) | Always block |

Every override requires permission + reason + audit.

---

## 8. Availability and leave precedence

Highest-wins order:

1. Emergency override (permission + reason + audit)  
2. Approved workforce leave (M04) — **no silent override**  
3. Declared unavailable (M04)  
4. Existing **published** assignments  
5. Draft assignments  
6. Open-shift applications  
7. Recurring availability (M04)  
8. Preferred / roster-availability declarations (M05)

After publication, if leave/availability changes: recalculate conflicts; warn coordinators; open/update M02 items; require reassignment or superseding publication for hard conflicts; do not silently keep invalid published assignments as conflict-free.

---

## 9. Conflict, fatigue and safety policies

Versioned, explainable M05 policies (not hard-coded UI toasts only).

Minimum rules: overlapping shifts; minimum break; max daily/weekly scheduled hours; consecutive days; overnight/cross-midnight; travel/clinic-transfer time; role/clinic requirements; readiness expiry before/during shift; availability/leave conflicts.

Each result exposes rule id/version, severity, explanation, remediation.

**Do not** represent prototype policies as industrial-award, employment-law, or clinical-safety compliance certification.

---

## 10. Concurrent editing and version protection

Local prototype: optimistic version checks (not production-grade concurrency).

Prevent: silent overwrite of another manager’s draft; publishing stale draft; accepting already-filled open shift; approving swap after roster changed; acknowledging superseded publication.

Return clear conflict result with refresh/recovery behaviour (`ConcurrentConflictState`). Do not claim production-grade concurrency while persistence remains local.

---

## 11. Publishing and acknowledgement

### Immutable publication vs acknowledgement (explicit rule)

| Concept | Rule |
|---|---|
| **Roster period lifecycle state** | Planning/publication lifecycle only: `draft` → `under_review` → `ready_to_publish` → `published` → `superseded` / `cancelled` / `archived` |
| **Publication record** | Immutable snapshot once created (`publicationVersion`, assignments copy, warning/override summary, `asOf`) |
| **Acknowledgement aggregation** | **Derived publication status** on the publication record: `acknowledgementStatus ∈ { none, partial, full }` computed from ack rows — **does not** rewrite the immutable snapshot body and **does not** invent separate period states `partially_acknowledged` / `fully_acknowledged` as mutable period lifecycle replacements for `published` |
| **Period while acks in flight** | Period remains `published` until superseded/cancelled/archived; UI may show derived ack badge from active publication |

Define: pre-publication validation; preview; warning/override summary; immutable snapshot; recipient calculation; acknowledgement deadline; acknowledged/declined/unseen; reminder/escalation; superseding publications; cancellation; audit trail.

Superseded publications remain historically accessible. Acknowledgement applies to the **exact publication version** seen by the worker.

Full period transition matrix: §19.1.

---

## 12. Swap workflow

request → proposed replacement → eligibility both workers → recipient acceptance (if required) → manager approval (if required) → reject/withdraw/expire → roster version update → notification closure.

Revalidate eligibility, availability, fatigue, and roster version at final approval. Prior check must not authorise a stale swap. Prevent self-approval where required.

Full transition matrix: §19.3.

---

## 13. Open-shift workflow

creation → audience → eligibility filter → EOI/direct accept → competing applicants → selection → withdraw/expire/escalate → assignment → closure.

Version-checked assignment; no duplicate accept; no ineligible bypass via direct service calls.

Full transition matrix: §19.4.

---

## 14. Cost forecast boundary

M05 cost forecast is **planning-only**, not payroll truth. M07 remains future payroll-preparation authority.

Define: rate snapshot/reference; ordinary/OT assumptions; allowances/on-costs; missing-rate warnings; clinic/role filters; version/`asOf`; rounding; forecast vs actual payroll labelling.

Sensitive rate/cost data needs separate permission, clinic scope, and export controls.

---

## 15. Fairness and allocation transparency

If ranking workers for open shifts, record: eligibility filters; ranking factors; manual override reason; final selection.  
Do not use protected/irrelevant personal attributes. Label as operational decision support, not autonomous employment decision-making.

---

## 16. Bulk-operation safety

For bulk shift creation, assignment, publishing, messaging: preview; validation; permission + clinic-scope; duplicate prevention; partial success; confirmation; version checking; notification-volume controls; audit; safe retry/idempotency.

Named evidence: `BULK-01` preview, `BULK-02` partial success, `BULK-03` retry idempotency, `BULK-04` cross-clinic denial, `BULK-05` notification cap.

---

## 17. Permission and clinic-scope matrix

### Roles

Worker; roster coordinator; clinic manager; workforce/HR administrator; finance viewer; auditor; emergency-override authority.

### Codes × roles

| Code / capability | Worker | Roster coordinator | Clinic manager | Workforce/HR admin | Finance viewer | Auditor | Emergency override |
|---|---|---|---|---|---|---|---|
| View (`roster.view`) | own/team scoped | clinic | clinic | org-scoped | clinic summary | all view | clinic |
| Create/edit periods & shifts (`roster.period.create`, `roster.shift.edit`) | — | Yes (clinic) | Yes | Yes | — | — | — |
| Assign (`roster.assign`) | — | Yes | Yes | Yes | — | — | — |
| Open-shift management (`roster.open_shift.manage`) | accept own EOI only | Yes | Yes | Yes | — | — | assist |
| Swap request (`roster.swap.request`) | own | Yes | Yes | Yes | — | — | — |
| Swap approve (`roster.swap.approve`) | — | limited | Yes | Yes | — | — | — |
| Review (`roster.review`) | — | Yes | Yes | Yes | — | Yes (RO) | — |
| Publish (`roster.publish`) | — | — | Yes | Yes | — | — | with publish+override |
| Acknowledge (`roster.acknowledge`) | own | — | — | — | — | — | — |
| Override (`roster.override`) | — | — | limited | Yes | — | — | **Yes** (reason+audit) |
| Cost/rate view (`roster.cost.view`) | — | — | masked/limited | Yes | Yes | Yes (RO) | — |
| Report/export (`roster.report`, `roster.export`) | own summary | clinic | clinic | Yes | cost-scoped | Yes | — |
| Settings/policy (`roster.policy.manage`) | — | — | limited | Yes | — | — | — |
| Audit/history (`roster.audit.view`) | — | limited | Yes | Yes | — | Yes | — |
| Bulk operations (`roster.bulk`) | — | Yes | Yes | Yes | — | — | — |

**Service-layer clinic scope is mandatory** for every mutation, export, and bulk operation. UI hiding is not the security boundary.

### Named permission / scope tests

| Evidence ID | Case |
|---|---|
| `PERM-POS-01` | Coordinator creates shift in scoped clinic — allow |
| `PERM-NEG-01` | Worker publish attempt — deny |
| `PERM-NEG-02` | Cross-clinic assign — deny |
| `PERM-POS-02` | Scoped bulk: in-scope succeed, out-of-scope skip (partial success) |
| `PERM-NEG-03` | Finance viewer mutation — deny |
| `PRIV-01` | Sensitive cost masked without `roster.cost.view` |
| `PRIV-02` | Export bypass prevention (no unscoped CSV via service) |
| `PERM-OV-01` | Override without reason — deny; with reason+audit — allow where authorised |

---

## 18. Section-to-service matrix

| Section | Supporting service / read model |
|---|---|
| Roster Board | period + shift + assignment + eligibility read model |
| Coverage | coverage calculation service |
| Open Shifts | open-shift workflow service |
| Availability & Leave | M04 leave/availability contract read model |
| Requests | swap / roster-change request service |
| Conflicts & Warnings | versioned conflict/fatigue policy engine |
| Published History | publication snapshot + audit read model |
| Cost Forecast | planning-only forecast service |
| Reports | scoped reporting/export service |
| Settings | versioned policy management service |

---

## 19. Expanded state-transition matrices

### 19.1 Roster period

| From | To | Actor | Required permission | Validations | Concurrency / version | Audit / event | Invalid transition behaviour |
|---|---|---|---|---|---|---|---|
| (none) | `draft` | coordinator / manager | `roster.period.create` | clinic TZ resolvable; date range | n/a | `roster.period.created` | explainable deny |
| `draft` | `under_review` | coordinator / manager | `roster.review` | optional completeness | period.version match | audit | conflict state + refresh |
| `draft` / `under_review` | `ready_to_publish` | coordinator / manager | `roster.review` | hard blocks resolved/overridden | version match | audit | validation-error payload |
| `ready_to_publish` | `published` | manager / HR admin | `roster.publish` | full revalidate at `asOf`; preview accepted | reject stale version | immutable publication + `roster.published` | concurrent-conflict |
| `published` | `superseded` | manager / HR admin | `roster.publish` | new publication created | prior version retained | supersede event | deny silent rewrite |
| `draft` / `under_review` / `ready_to_publish` | `cancelled` | coordinator / manager | `roster.period.create` or manage | reason required | version match | cancel event; close M02 | deny without reason |
| `published` / `superseded` / `cancelled` | `archived` | HR admin / auditor path | `roster.audit.view` + admin | retention policy | n/a | archive audit | deny archive of active draft |

**Acknowledgement does not move period out of `published`.** Derived `acknowledgementStatus` lives on the publication (§11).

Emergency publication with warnings: `roster.publish` + `roster.override` (emergency authority), reason, audit; warnings retained on snapshot.

### 19.2 Shift

| From | To | Actor | Required permission | Validations | Concurrency / version | Audit / event | Invalid |
|---|---|---|---|---|---|---|---|
| (none) | `draft` / `unassigned` | coordinator | `roster.shift.edit` | TZ fields; period editable | period version | shift created | deny on published immutable period without amendment |
| `draft` | `unassigned` | coordinator | `roster.shift.edit` | requirements present | version | audit | conflict |
| `unassigned` | `assigned` | coordinator | `roster.assign` | eligibility; leave; overlap | version | assignment history | hard-block / conflict |
| `unassigned` / `assigned` | `open` | coordinator | `roster.open_shift.manage` | coverage rules | version | open-shift created | deny if filled race |
| `open` | `offered` | system / coordinator | open-shift manage | audience + eligibility filter | open-shift version | offer event | — |
| `offered` | `accepted` | worker | accept permission | eligibility recheck | reject duplicate accept | accept event | concurrent-conflict if filled |
| `offered` / `accepted` | `assigned` | coordinator / auto | `roster.assign` | final eligibility | versions | assignment | deny stale |
| `*` active | `cancelled` | coordinator / manager | `roster.shift.edit` | reason | version | cancel + M02 close | deny silent |
| `assigned` (ended) | `completed-reference` | system | n/a | clock boundary via clinic TZ | n/a | reference only | **must not** create M06 |
| any | `superseded` | publication amend | publish path | link to new shift id | n/a | history retained | — |

### 19.3 Swap

| From | To | Actor | Required permission | Validations | Concurrency / version | Audit / event | Invalid |
|---|---|---|---|---|---|---|---|
| (none) | `requested` | worker | `roster.swap.request` | own assignment; published version | assignment version | swap created; M02 open | deny if superseded publication |
| `requested` | `proposed` | requester / coordinator | swap request | replacement identified | swap version | audit | — |
| `proposed` | `recipient_accepted` | recipient | swap request (own) | eligibility recipient | versions | audit | deny self where forbidden |
| `recipient_accepted` / `proposed` | `approved` | manager | `roster.swap.approve` | eligibility both; fatigue; roster version | reject stale | assignment update; M02 close | concurrent-conflict |
| `requested` / `proposed` / `recipient_accepted` | `rejected` | manager / recipient | approve or own | reason | version | M02 close | — |
| any open | `withdrawn` | requester | swap request | — | version | M02 close | — |
| any open | `expired` | system | n/a | deadline | n/a | M02 close | — |

### 19.4 Open shift

| From | To | Actor | Required permission | Validations | Concurrency / version | Audit / event | Invalid |
|---|---|---|---|---|---|---|---|
| (none) | `open` | coordinator | `roster.open_shift.manage` | shift unassigned/gap | shift version | created; M02 maybe | — |
| `open` | `offered` | coordinator / system | manage | audience | version | offered | — |
| `offered` | `eoi_received` | worker | accept/EOI | eligibility | version | EOI row | deny ineligible |
| `eoi_received` / `offered` | `selected` | coordinator | manage | selection fairness record | reject double-fill | assignment path | concurrent-conflict |
| any open | `withdrawn` / `expired` | coordinator / system | manage | reason/deadline | version | M02 update/close | — |
| `selected` | `closed` | system | n/a | assignment committed | n/a | close | — |
| `open` / `offered` | `escalated` | coordinator | manage (+ override if needed) | gap still hard | version | M02 escalation | — |

---

## 20. Integration-contract matrix

| Provider | Consumer | Contract / ref / event | Direction | Authoritative owner | Read/write | Version / idempotency | Stale-event protection | Prohibited |
|---|---|---|---|---|---|---|---|---|
| M04 / platform | M05 | `getAuthoritativeWorkforceEligibility` / workforce-eligibility | M05 reads | M04 | Read-only | `asOf` + outcome version; idempotent read | Ignore stale readiness (`stale: true` ⇒ not eligible) | M05 must not import M04 repos; must not write readiness |
| M05 | M05 UI/services | Roster eligibility adapter (`authority: "m04-platform"`) | Internal | M04 decision | Read | Same as platform | Same | Treating M11 training as final eligibility |
| M11 | M04 only | Training contribution / readiness contribution registry | M11 → M04 | M11 contributes; M04 owns combined | M05: none | M04 recalc rules | M04 stale-replay | **M11 must contribute through M04 only**; M05 must not import M11 |
| M04 | M05 | Leave / availability contracts (person/engagement scoped) | M05 reads | M04 | Read-only | effective-dated reads | Recalc on leave change events | Approve leave in M05; dual-write leave |
| M03 | M05 | Clinic / org identity + IANA timezone | M05 reads | M03 / org clinic record | Read | clinic id stable | Unresolved TZ if missing | Silent UTC |
| M05 | M02 | Action-inbox projections (coverage, unacked publish, swap, open-shift, invalidated assignment) | M05 → M02 | M02 owns inbox items | Create/update/close via adapter | Stable source/condition/version keys; idempotent upsert | Stale-replay must not reopen closed with older version | Direct M02 repository writes from UI |
| M05 | M01 | Executive summary aggregates | M05 → M01 | M01 owns display aggregates | Write aggregates only | Idempotent summary upsert | Ignore older `asOf` | Person-level sensitive dumps; owning command-centre SoT |
| M05 | platform events | `roster.published`, assignment/swap/open-shift events | emit | M05 for roster facts | Append-only events | event id + aggregate version | Consumers drop stale | Dual-write attendance/pay |
| M05 | platform refs | `ShiftRef`, `RosterPeriodRef`, `RosterPublicationRef`, `AssignmentRef`, `OpenShiftRef`, `SwapRequestRef` | publish refs | M05 | Create/update refs | contractVersion | Validators reject malformed | Other modules writing M05 refs as SoT |
| M05 | M10 | Duty task bridge (opening/closing) | M05 → M10 | **M10** owns tasks | Adapter only | Deduped task keys | Stale close protection | **M05 must not own general tasks**; if contract unsafe → **defer adapter** |
| M06 / M07 | — | — | — | future | — | — | — | M05 must not create M06/M07 records |

---

## 21. M02 lifecycle matrix

Stable key pattern: `m05::{condition}::{clinicId}::{subjectId}::{version}` (exact format fixed at execution). Notification-volume controls: dedupe, digest, cap per actor per hour, suppress duplicate opens.

| Condition | Create | Deduplicate | Update | Close / supersede | Stale-replay protection | Stable keys |
|---|---|---|---|---|---|---|
| Coverage gap | When hard gap detected post-calc/publish | Same clinic+role+window key | Severity/count/due changes | Gap filled / period superseded / cancelled | Older version cannot reopen closed newer | `source=m05`, `condition=coverage-gap`, `version` |
| Unacknowledged publication | On publish with required acks | Per publicationVersion + recipient set | Reminder/escalation fields | All required acked or publication superseded/cancelled | Ack against superseded pub ignored; stale reminder no-op | `condition=unacked-publication` |
| Swap requiring action | On swap request/propose | Per swapRequestId | State changes (awaiting recipient/manager) | Approved/rejected/withdrawn/expired | Replay of old state cannot reopen terminal swap | `condition=swap-action` |
| Open-shift escalation | On escalate / urgent gap | Per openShiftId | Escalation level | Filled/withdrawn/expired | Stale escalate after fill ignored | `condition=open-shift-escalation` |
| Published assignment invalidated by leave/readiness change | On M04 leave/readiness event affecting published assignment | Per assignmentId + invalidation reason class | Recalc explanation | Reassigned / superseded publication / override audited | Out-of-order leave events applied by `asOf`/event version only | `condition=assignment-invalidated` |

Prove in tests: create, dedupe, update, close/supersede, stale-replay for **each** row (`M02-LG-01` … `M02-LG-05` + replay variants).

---

## 22. M01 and M10 boundaries

### M01

- M01 may receive **aggregate operational projections only** (e.g. counts: open gaps, unacked publications, pending swaps, published periods).
- No person-sensitive leave reasons, rate tables, or full roster dumps into M01.
- Adapter: `adapters/m05-executive.ts`.

### M10

| Item | Plan |
|---|---|
| Proposed M10-owned artefact | Opening/closing **duty task** owned by M10 (task id, clinic, shiftRef, due local window, status) |
| Trigger | Published shift flagged requiring open/close duty; or superseding publication changing duty window |
| Deduplication | `m10::duty::{shiftId}::{dutyType}` stable key — M10 upsert |
| Update | Window/assignee/status changes via M10 API only |
| Closure | Duty completed in M10, or shift cancelled/superseded → close request from M05 adapter |

**Gate:** If a safe, available M10 task/reference contract is **not** already present at execution start, mark `adapters/m10-duty-bridge.ts` **DEFERRED**, skip creating competing M05 task SoT, and record workflow 12 evidence as `BLOCKED-M10` (not skipped silently). M05 must not own general tasks.

---

## 23. Numeric performance acceptance targets

**Measurement environment (prototype):** warm production build, Chromium, mid laptop class, local persistence, Act-as demo identities.  
**Dataset sizes:** ≥2 clinics; ≥1 roster period/clinic; ≥200 shifts; ≥150 assignments; ≥50 open shifts; ≥40 swaps; ≥500 person eligibility index reads; report export ≤5k rows scoped.

| Operation | Target | Metric type | Dataset note |
|---|---|---|---|
| Initial roster-board load | ≤ **2.5s** interactive | p95 / maximum observed prototype | 200+ shifts visible week |
| Board filtering | ≤ **300ms** apply | p95 | client filter 200+ rows |
| Eligibility lookup (single) | ≤ **100ms** | per-operation typical | M04/platform cache warm |
| Conflict recalculation (period) | ≤ **2.0s** | maximum observed | 150+ assignments |
| Coverage calculation (period/clinic day) | ≤ **500ms** | p95 | one clinic day |
| Publication preview | ≤ **2.0s** | maximum observed | selected clinic subset |
| Publication submission | ≤ **3.0s** + progress | maximum observed | immutable snapshot write |
| Open-shift acceptance | ≤ **400ms** | per-operation | version check + eligibility |
| Swap approval (final) | ≤ **500ms** | per-operation | dual eligibility revalidate |
| Bulk preview (≤500 ops) | ≤ **2.0s** | maximum observed | — |
| Bulk submission (≤500 ops) | ≤ **5.0s** + progress | maximum observed | partial-success report |
| M02 projection generation (single condition sync) | ≤ **50ms** | per-operation | no duplicate create |
| Reports / scoped export | ≤ **3.0s** interactive for ≤5k rows | maximum observed | clinic-scoped |

Do not claim production SLAs; report measured p95/max in completion evidence.

---

## 24. Migration and seed safety

| Rule | Requirement |
|---|---|
| Idempotent initialization | Re-run does not duplicate periods/shifts/assignments |
| Non-destructive | Never overwrite existing non-seed M05 records |
| Stable identifiers | Seed ids stable across runs (`seedBatchId` / `source: seed`) |
| Seeds never overwrite existing | Insert-if-absent only |
| Seed-owned rollback only | Rollback removes only seed-tagged M05 rows + seed flags |
| Repeat-run verification | Named test `MIG-01` |
| Interrupted-run recovery | Named test `MIG-02` |
| Preserve frozen Wave 2 / Wave 3 | No mutation of M04/M11 authoritative stores; regression suite green |
| No dual-write | No portal staff/doctor dual-write; no M06/M07/M22 generation |
| No M06 / M07 / M22 record generation | Explicit assert in migration tests `MIG-03` |

---

## 25. UX-state requirements

Functional components (not documentation-only screenshots). Evidence via unit/integration/browser.

| State | Trigger | Expected behaviour | Recovery action | Evidence ID |
|---|---|---|---|---|
| Loading | Bootstrap / section fetch in flight | Accessible busy indicator; no empty flash of wrong data | Completes to content or error | `UX-01` |
| Empty | No periods/shifts in scope | EmptyState with create CTA if permitted | Create period/shift | `UX-02` |
| Filtered-empty | Filters exclude all rows | FilteredEmptyState; clear-filters action | Clear/adjust filters | `UX-03` |
| Restricted | Missing permission or clinic scope | RestrictedState; no data leak | Switch Act-as / request access | `UX-04` |
| Validation-error | Invalid shift times / policy fail | Inline + summary errors; retain user input | Correct fields / override if allowed | `UX-05` |
| System-error | Unexpected storage/adapter failure | SystemErrorState; no partial silent success | Retry / reload | `UX-06` |
| Offline | Persistence/network unavailable (demo limitation) | OfflineState messaging | Reconnect / retry | `UX-07` |
| Concurrent-conflict | Stale version on mutate | ConcurrentConflictState with refresh | Reload latest; re-apply | `UX-08` |

Appearance evidence: light, dark, device/system. Widths: **1440, 1280, 1024, 768, 430, 390** with **zero** page-level horizontal overflow. Keyboard + primary-path accessibility required.

---

## 26. Test / evidence matrix

Fresh evidence required at execution. Report **passed / failed / skipped / blocked** separately. Critical checks cannot be skipped or replaced with historical Wave 2/3 evidence.

| Area | Evidence requirement | Critical? |
|---|---|---|
| All ten functional sections | Browser section load + primary action | Yes |
| All twelve workflows | `U-WFxx` / `I-WFxx` / `B-WFxx` (or `BLOCKED-M10` for #12 only if deferred) | Yes |
| Permissions and clinic scope | §17 named tests | Yes |
| Immutable publication history | No silent rewrite; supersede retains prior | Yes |
| Stale-version / concurrent-action | Publish/swap/open-shift/ack races | Yes |
| Eligibility and overrides | Hard-block / warning / override audit | Yes |
| Leave/availability precedence | §8 order | Yes |
| Fatigue/conflict policies | Versioned explainable results | Yes |
| DST and cross-midnight | `TZ-01`…`TZ-08` | Yes |
| M02 lifecycle | Five conditions × create/dedupe/update/close/stale-replay | Yes |
| Bulk safety and retry | `BULK-01`…`BULK-05` | Yes |
| Cost/rate privacy | `PRIV-01`, `PRIV-02` | Yes |
| Migrations, seed, idempotency, rollback | `MIG-01`…`MIG-03` | Yes |
| Light / dark / device modes | Appearance suite | Yes |
| All eight UX states | `UX-01`…`UX-08` | Yes |
| Keyboard + primary-path a11y | Keyboard paths recorded | Yes |
| Widths 1440, 1280, 1024, 768, 430, 390 | Zero page overflow | Yes |
| Full frozen-wave / platform regression | platform-integration-qa + W2/W3 suites | Yes |
| Lint, type-check, production build | `npm run lint`, `npx tsc --noEmit`, `npm run build` | Yes |

---

## 27. Assumptions, risks, deferred

**Assumptions:** Demo Act-as; local prototype persistence; clinic TZ registry populated for demo clinics; M04 readiness registry registered at runtime; Wave 2/3 remain frozen.

**Risks:** Stale eligibility if M04 cache not refreshed; notification storms on bulk publish; over-blocking fill; cost forecast mistaken for payroll; M10 adapter creating a second task SoT; DST edge mis-handling without fold storage.

**Deferred:** Production persistence; M06/M07; award/law/safety certification of fatigue rules; **M10 duty adapter** unless safe contract available at execution; Wave 5+.

---

## 28. GitHub documentation checkpoint (this amendment)

After amending planning documents only:

1. Verify only approved planning/status documentation changed.  
2. Commit completed documentation changes.  
3. Push to `ThoshiMedicals/HCDP`.  
4. Report branch, full commit hash, GitHub commit link, exact pushed file list, clean working tree.  
5. Confirm **no** Wave 4 implementation files created or modified.  
6. **Do not begin execution** after push.

---

## 29. Stop gate (owner-accepted freeze)

**Wave 4 is owner accepted and frozen at `15f020800bbca40702ef08ad25f94f1d1999112f`.**  
**Wave 4 owner acceptance is not production approval.**  
**Wave 5 execution is NOT APPROVED.**

After this status closure:

- Preserve frozen Waves 1A–4.
- Keep **`BLOCKED-M10`** explicitly blocked until a safe M10-owned task contract exists.
- **Stop.** Wait for explicit Wave 5 planning instructions.
- Do not begin Wave 5 implementation.

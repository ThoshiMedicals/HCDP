# Wave 4 Implementation Plan — Module 5 Roster & Shift Management

**Date:** 27 July 2026  
**Status:** **PLANNING ONLY — Wave 4 execution NOT approved**  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Prerequisites:**  
- Wave 2 **owner accepted and frozen** (M04)  
- Wave 3 **owner accepted and frozen** (M11) — 27 July 2026  

**Do not** implement this plan until the owner explicitly approves Wave 4 execution.  
**Do not** create, modify, migrate or delete Wave 4 / M05 roster workspace implementation files under this plan.  
**Do not** directly modify frozen Wave 2 or Wave 3 functionality during planning or without an approved additive contract change.

This plan is **not** production deployment approval for any wave.

---

## 1. Exact scope and exclusions

### In scope

- Rebuild **Module 5 Roster & Shift Management** as the authoritative SoT for roster periods, shifts, coverage, open shifts, swap/coverage requests, publication versions and roster settings.
- Replace M05 `ModuleLanding` with a full sectioned workspace (M04/M11 pattern).
- **Shift-first** roster planning that consumes **authoritative workforce eligibility** only via the **M04/platform** contract (`getAuthoritativeWorkforceEligibility` / `getRosterEligibility` with `authority: "m04-platform"`).
- Display blocking and advisory eligibility reasons (credentials, leave, restrictions, training contributions already folded into M04 readiness) — **never** treat a separate M11 result as final roster eligibility.
- Cross-clinic conflict detection, fatigue/advisory rules (versioned policy in M05 settings), publish whole or selected-clinic roster, acknowledgement, swap request/approve, open-shift offer/assign, urgent coverage escalation.
- Publish workforce events; project to **M02 Action Inbox** and **M01** summaries via adapters.
- Cost **forecast** estimates within M05 (indicative; not M07 payroll SoT).
- Transfer opening/closing duty hooks to **M10 adapter interface only** (no M10 workspace).
- Idempotent, non-destructive seed/migration; preserve Wave 1 scaffold and frozen Waves 2–3 data.

### Explicit exclusions

- Module 6 Time & Attendance SoT (Wave 5) — adapters/refs only.
- Module 7 Staff Pay SoT (Wave 6) — cost forecast is M05 estimate only; no payslips/pay runs.
- Module 22 Recruitment workspace.
- Module 10 Duties workspace — adapter interface only.
- Production DB auth / server-side persistence / transactions (deferred).
- Optimistic concurrency and offline conflict resolution beyond demo localStorage semantics (deferred).
- Dual-write to legacy HTML roster or portal staff/doctors.
- Importing M04/M11 repositories into M05 services (contracts/adapters/events only).
- Creating independent person profiles in M05.
- Treating M11 training status as a second eligibility source of truth.
- Changing Wave 1A auth architecture.
- Destructive migration of Wave 2/3 freeze assets.
- Weakening lint, type, permission or test controls.

---

## 2. Modules and ownership

| Module | Role in Wave 4 |
|---|---|
| **M05 Roster** | Primary build — SoT for roster periods, shifts, coverage, publication, swaps, open shifts |
| **M04 Staff & Doctors** | Person, engagement, leave, availability, restriction, credential SoT; owns **combined readiness** cache |
| **M11 Training** | Frozen — training-status contributions already feed M04; M05 reads eligibility via M04/platform only |
| **M02 Action Inbox** | Deduplicated actionable projections (coverage gaps, unacknowledged publish, swap approvals) |
| **M01 Command Centre** | Summary projection consumer |
| **M03 Organisation** | Clinic/org scope context; clinic IANA timezone source for shift day boundaries |
| **M06 Time & Attendance** | Consumes `ShiftRef` later — Wave 4 exposes contracts only |
| **M07 Staff Pay** | May consume cost-forecast refs later — no pay SoT in Wave 4 |
| **M10 Duties** | Opening/closing duty transfer via adapter interface only |

### Ownership hard rules

| Record | Owner | Consumers |
|---|---|---|
| Person / engagement / leave / restriction / credential | **M04** | M05 via refs + eligibility |
| Combined readiness / eligibility outcome | **M04** (+ platform registry) | M05 `getRosterEligibility` |
| Training status contributions | **M11** → M04 | M05 only through M04 blockers/explanations |
| Roster period / shift / publication version | **M05** | M06/M07/M01/M02 via `ShiftRef` / events |
| Timesheet / clock event | **M06** (not Wave 4) | — |
| Pay run | **M07** (not Wave 4) | — |

---

## 3. Sections (10)

| Section id | Label | Minimum functional behaviour |
|---|---|---|
| `roster-board` | Roster Board | Period selector; shift grid create/edit/assign; clinic filter; eligibility badges |
| `coverage` | Coverage | Role/clinic coverage gaps; severity; escalate |
| `open-shifts` | Open Shifts | Offer, claim/approve, assign replacement |
| `availability-leave` | Availability & Leave | Read-only projection of M04 leave/availability affecting the period (no M04 writes) |
| `requests` | Requests | Swap request → approve/reject (no self-approve); acknowledgement queue |
| `conflicts` | Conflicts & Warnings | Double-book, cross-clinic overlap, fatigue advisory, eligibility blockers |
| `published-history` | Published History | Immutable published versions; diff/summary; rollback = new superseding version only |
| `cost-forecast` | Cost Forecast | Indicative labour cost estimate for period/clinic (not payroll) |
| `reports` | Reports | Permission-scoped operational roster reports + safe exports |
| `settings` | Settings | Versioned roster/fatigue/eligibility-display policy; effective dates; publish controls; immutable prior versions |

Placeholder-only sections are **not** acceptable. If a section cannot be completed in Wave 4 execution, report it incomplete.

---

## 4. Minimum workflows (12)

1. Create roster period (clinic scope, date range, timezone from clinic IANA).
2. Add and edit shifts (role, times, capacity/count).
3. Assign eligible worker (must pass M04/platform eligibility at shift `asOf` / start).
4. Display blocking and advisory eligibility reasons (from M04 blockers + roster rules).
5. Detect cross-clinic conflicts and fatigue advisories.
6. Publish whole or selected-clinic roster (immutable version snapshot).
7. Notify and request acknowledgement.
8. Request / approve swap (no self-approve).
9. Offer open shift and assign approved replacement.
10. Urgent coverage escalation → M02.
11. Version published change (never silent overwrite of published history).
12. Transfer opening/closing duties via M10 adapter interface (stub consumer OK).

---

## 5. Contracts, adapters and events

### Platform contracts (extend only; do not break Waves 2–3)

- Existing: `ShiftRef`, `WorkforcePersonRef`, `EngagementRef`, `ReadinessRef`, `TrainingStatusRef`, readiness contribution / eligibility registries.
- Wave 4 may add (platform layer): `RosterPeriodRef`, `CoverageGapRef`, `SwapRequestRef`, `OpenShiftOfferRef`, `RosterPublicationRef`.
- Eligibility: **only** `getAuthoritativeWorkforceEligibility` / M05 `getRosterEligibility` (`authority: "m04-platform"`). Training detail refs are explanatory only.

### Boundary rules

- **No** M04 or M11 repository/service imports into M05 domain services.
- **No** M05 repository imports into M04/M11.
- Connect via platform registries, refs, adapters and workforce event bus only.
- No cross-module direct writes.

### Workforce events (minimum)

- `roster.published`
- `shift.created` / `shift.changed` / `shift.cancelled`
- Additional as needed: `shift.assigned`, `swap.requested`, `swap.decided`, `open_shift.offered`, `coverage.escalated` (register in platform event allow-list)

### M02 Action Inbox projections (find → create/update/close; stale-replay protected)

| Key pattern | Trigger |
|---|---|
| `roster::coverage-gap::${id}` | Unfilled required coverage |
| `roster::unacked-publish::${publicationId}` | Published roster awaiting acknowledgement |
| `roster::swap-approval::${requestId}` | Pending swap approval |
| `roster::open-shift::${offerId}` | Open shift needing fill (optional High) |

Lifecycle required: create, dedupe on repeat sync, update on source change, close on resolve, stale replay must not reopen newer resolved outcomes (reuse Wave 3 bridge versioning pattern).

### M01

Executive summary adapter: open coverage gaps, unpublished drafts, unacknowledged publications (clinic-scoped).

### M10

`DutiesTransferAdapter` interface: on publish/close of opening/closing shift tags, emit transfer intent — no M10 UI.

---

## 6. Permissions and clinic scope

### Proposed M05 permission codes

- `roster.view`
- `roster.manage_period`
- `roster.edit_shift`
- `roster.assign`
- `roster.publish`
- `roster.approve_swap`
- `roster.manage_open_shifts`
- `roster.escalate_coverage`
- `roster.export`
- `roster.manage_policy`
- `roster.view_sensitive_cost` (optional; mask cost forecast details)

Service-layer `assertM05Permission` / `assertM05ClinicScope` required on mutations and scoped reads/exports. UI hiding is insufficient.

Clinic scope:

- Actor with `clinicIds` may only mutate shifts/periods for intersecting clinics.
- Multi-clinic bulk assign/publish must reject or report out-of-scope records safely (partial success).
- Export must not bypass clinic scope.

---

## 7. Clinic IANA timezone

Reuse platform `clinic-timezone` (Wave 3):

- Roster period and shift day boundaries, publish “as of” clinic dates, acknowledgement deadlines use **clinic IANA**.
- Missing timezone → explainable unresolved / block publish — **no silent UTC** for authoritative roster outcomes.
- Store instants in ISO UTC; display and calendar logic in clinic TZ.

---

## 8. Interactions with frozen Waves 2 and 3

### Must preserve (no destructive change)

| Wave | Preserve |
|---|---|
| **2 M04** | People, engagements, credentials, leave, restrictions, readiness cache ownership, portal seed/migration, permissions, audit |
| **3 M11** | Training SoT, immutable completions/policy versions, contribution registry, clinic TZ utilities, M02 training projections |

### Allowed additive interactions

| Interaction | Direction | Mechanism |
|---|---|---|
| Resolve person for assignment | M05 → platform → M04 lookup registry | Existing `registerWorkforcePersonLookup` |
| Eligibility at assign/publish | M05 → `getRosterEligibility` / platform readiness | Existing Wave 3 registry; M04 remains SoT |
| Leave/availability display | M05 reads refs via platform adapters | Read-only; no M04 writes from M05 |
| Training blockers in UI | Via M04 readiness blockers (`owningModuleId: "training"`) | Explanatory only |
| Invalidate/recalc readiness | Optional event to M04 recalc registry when engagement-affecting — prefer M04 owns recalc triggers | No M11 import |
| Shift refs for future M06 | M05 publishes `ShiftRef` + events | Wave 5 consumer |

### Forbidden during Wave 4

- Rewriting M04 readiness algorithm ownership or importing M11 into M04.
- Dual-writing people or training records from M05.
- Changing M11 sections/workflows except approved platform contract additions.
- Disabling Wave 2/3 tests or relaxing their permissions.

---

## 9. UX, mobile, states, accessibility, appearance

### Layout

- Desktop: high-density roster board (sticky period/clinic chrome; keyboard operable cells/actions).
- Mobile: triage-first (coverage gaps, requests, open shifts, acknowledgements) — not a cramped full grid as the only view.
- Zero page-level horizontal overflow at **1440, 1280, 1024, 768, 430, 390**.

### Functional UX states (required)

loading, empty, filtered-empty, restricted, validation-error, system-error, offline — functional components with named evidence (same bar as Wave 3).

### Appearance

Explicit **light**, **dark**, and **device/system** modes — three separately evidenced results.

### Accessibility

Keyboard-only primary workflows; visible focus; `aria-current` on section nav; labelled errors; WCAG 2.2 AA for primary paths (full audit deferred as in Waves 2–3).

### Privacy

Mask sensitive cost/PII without clearance; service-enforced.

---

## 10. Storage, migration, seed, rollback

- Keys: `pulse.m05.roster.*` (existing prefix); extend collections: periods, shifts, publications, requests, openShifts, coverage, policies, audit, ui.
- Migrations: idempotent empty-array init; insert-if-absent seeds tagged `_seedBatchId`.
- Rollback: seed-scoped only; never wipe Wave 2/3 keys.
- Persistence: localStorage demo only — **not** production SoT.
- No dual-write to legacy roster HTML.

---

## 11. Audit

Append-only M05 audit for period create, shift mutate, assign, publish, swap decision, open-shift assign, policy publish.  
Workforce event bus for cross-module; inbox projections never become SoT.

---

## 12. Measurable performance targets

| Operation | Acceptance target |
|---|---|
| Initial `/roster` board interactive (warm) | ≤ **3.0s** |
| Board filter/clinic switch (≤2k shifts in period) | ≤ **400ms** |
| Eligibility check single assignment | ≤ **100ms** typical (cached M04 readiness) |
| Conflict scan for period (≤2k shifts) | ≤ **1.0s** |
| Publish selected clinic (≤500 shifts) | ≤ **3.0s** + progress feedback |
| Bulk open-shift notify (≤200) | ≤ **2.0s** |
| M02 single projection sync | ≤ **50ms**; no duplicate creates |
| Cost forecast recompute (≤2k shifts) | ≤ **1.5s** |

---

## 13. Test and evidence requirements

Fresh evidence at Wave 4 execution (historical Wave 2/3 evidence does not substitute):

1. Exact files created/modified.
2. Migration, seed, rollback results.
3. Functional status of all **10** sections.
4. Named evidence for all **12** workflows.
5. Role/permission matrix + clinic-scope service tests.
6. Eligibility: assign blocked when M04 readiness blocked/stale; advisory visible; M11 not used as final SoT.
7. Conflict/fatigue/double-book evidence.
8. Publish versioning + acknowledgement.
9. M02 create/update/dedupe/close/stale-replay for roster projections.
10. M01 summary adapter evidence.
11. Performance vs every numeric target.
12. Playwright: workflows, responsive overflow, light/dark/device, keyboard/a11y, seven UX states.
13. lint, type-check, production build; platform QA regression; Waves 2–3 suites still green.
14. Known defects / incomplete / deferred.
15. Proof Wave 2–3 intact and Wave 5 not started.

Critical checks cannot be skipped.

---

## 14. Planned file inventory (execution — do not create yet)

Under `Development folder/src/modules/m05-roster/` (illustrative):

- `RosterWorkspace.tsx`, `context.tsx`, `permissions.ts`
- `types/domain.ts`, `repository/local-store.ts`
- `storage/keys|migrations|bootstrap|seed-safe`
- Services: period, shift, assignment, publish, swap, open-shift, coverage, conflict, cost-forecast, policy, events, reports
- Sections × 10 + `ux-states.tsx`
- Adapters: extend `eligibility-read.ts`; add inbox sync, executive, M10 duties transfer, platform
- Tests: domain, conflicts, eligibility, clinic-scope, M02 lifecycle, performance
- Scripts: `wave4-m05-acceptance-evidence.mjs`

Platform (additive only): new refs as needed; event allow-list updates; no breaking changes to frozen contracts without explicit note.

---

## 15. Stop gate

When Wave 4 execution is approved and completed:

- M05 roster SoT and 10 sections functional.
- Eligibility via M04/platform only.
- Waves 2–3 frozen behaviour preserved.
- **Do not** build M06 attendance or M07 payroll beyond adapters.
- **Do not** mark Wave 4 owner-accepted or production-approved without owner acceptance.
- Stop and wait for owner acceptance before Wave 5.

---

## 16. Deferred (carry forward; not Wave 4 “done”)

- Production server APIs, DB persistence, transactions.
- Optimistic concurrency / offline conflict resolution.
- Full WCAG beyond primary paths.
- Live payroll costing (M07).
- Live clock/timesheet (M06).
- M11→M04 workforce-credential promotion (still deferred from Wave 3).

---

**End of planning document.**  
Awaiting **explicit Wave 4 execution approval** before any M05 workspace implementation.

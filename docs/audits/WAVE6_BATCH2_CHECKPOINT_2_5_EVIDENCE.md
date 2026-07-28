# WAVE 6 / M07 Batch 2 — Checkpoint 2.5 Evidence

**Status:** COMPLETE (implementation + tests; not committed)
**Accepted baseline:** Checkpoint 2.4 evidence (`docs/audits/WAVE6_BATCH2_CHECKPOINT_2_4_EVIDENCE.md`)
**Scope:** Ordered registry-event replay for M07 published-timesheet intake; durable tenant-scoped cursors; interruption recovery; gap/duplicate handling; bounded catch-up via CP 2.4 intake; audit; tests; this report.
**Excluded:** Automatic supersession; operational revocation/withdrawal/invalidation holds; BLOCKED-M07 clearance; Module 5 demand-based rostering; payroll calculation/UI; commit/push; working-tree cleanup.

---

## A. Exact files changed

### Created (Checkpoint 2.5)
- `src/modules/m07-staff-pay/services/published-timesheet-replay.ts`
- `src/modules/m07-staff-pay/repository/published-timesheet-replay.ts`
- `src/modules/m07-staff-pay/storage/migrate-v4.ts`
- `src/modules/m07-staff-pay/tests/m07-replay-cp25.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_5_EVIDENCE.md` (this file)

### Modified (Checkpoint 2.5 wiring)
- `src/modules/m07-staff-pay/types/domain.ts` — replay checkpoint/outcome types; `MigrationReport.v4Ran`; stream constant
- `src/modules/m07-staff-pay/storage/keys.ts` — replay checkpoint/outcome keys; `M07_MIGRATION_V4_ID`; `M07_SCHEMA_VERSION = 4`
- `src/modules/m07-staff-pay/storage/bootstrap.ts` — run v4; report `v4Ran`
- `src/modules/m07-staff-pay/storage/index.ts` — export migrate-v4
- `src/modules/m07-staff-pay/services/index.ts` — export replay
- `src/modules/m07-staff-pay/repository/index.ts` — export replay repository
- `src/modules/m07-staff-pay/tests/m07-migration.test.ts` — v4 additive/idempotent test; v3 meta stays at `3`

### Not modified
- M06 publisher / outbox behaviour
- Platform hash or registry semantics (uses existing `replayPublishedTimesheetEvents`)
- CP 2.4 snapshot business identity
- M05 rostering implementation
- M07 payroll calculation or UI
- Shared CSS / design system / prototype-parity / Premium Clinical Enterprise

---

## B. Paths vs authorised plan

| Plan | Actual | Diff |
|---|---|---|
| Replay coordinator | `services/published-timesheet-replay.ts` | Matches |
| Checkpoint/cursor domain | `types/domain.ts` | Matches |
| Checkpoint repository | `repository/published-timesheet-replay.ts` | Matches |
| Additive migration | `storage/migrate-v4.ts` | Matches |
| Audit/outcomes | outcome rows + `recordM07Audit` | Matches |
| Narrow exports | services/repository/storage indexes | Matches |
| CP 2.5 tests + evidence | `tests/m07-replay-cp25.test.ts` + this doc | Matches |
| Platform event query | Existing `replayPublishedTimesheetEvents` | **No duplicate registry reader created** |

**Mismatch resolved during design:** Absolute `lastCompleted+1` gap checks are unsafe under the platform’s **global** `eventSequence` with tenant-filtered pages (other tenants occupy intervening numbers). Gap detection is therefore **non-monotonic / duplicate-sequence within the tenant page**, not global hole fabrication. Documented in §E.

---

## C. Final replay architecture and dependency direction

```
M06 source of truth
  → M06 publisher/outbox
  → platform PublishedTimesheetRegistry
  → platform replayPublishedTimesheetEvents(scope, afterSequence)   [tenant-scoped, ascending]
  → M07 runPublishedTimesheetReplayBatch (ordering / gap / cursor)
  → CP 2.4 intakePublishedTimesheet (eligible grant/revise/restore only)
  → immutable M07 source snapshots
```

M07 does not read `pulse.m06.*`, import M06 internals, mutate the registry, or bypass CP 2.4 intake. Every batch result sets `blockedM07: true` / `workflowEvidenceCode: "BLOCKED-M07"`.

---

## D. Replay checkpoint identity and schema

**Identity key:**
`organisationId + legalEntityId + clinicScope(*) + streamPurpose + contractVersion`

- `streamPurpose` = `published-timesheet.lifecycle`
- `contractVersion` = platform `published-timesheet.v1`
- **Clinic partition:** platform stream is **not** clinic-partitioned; checkpoint identity uses clinic `*` (clinic omitted). Clinic is enforced at actor/intake validation when the caller supplies `clinicId`.

**Checkpoint fields:** id, organisationId, legalEntityId, clinicId?, streamPurpose, contractVersion, lastCompletedEventSequence, lastCompletedEventId, checkpointVersion, updatedAt, status (`active` | `blocked-gap` | `blocked-conflict` | `unavailable`), blockedReason?

**Not used as identity:** display names, caller employee ids, latest snapshot id, arbitrary timestamps, idempotencyKey.

---

## E. Authoritative ordering and gap behaviour

- Events retrieved via platform `replayPublishedTimesheetEvents` filtered by organisationId + legalEntityId, sorted ascending by `eventSequence`.
- Processed in ascending order; platform canonical ordering is re-asserted defensively.
- **Global sequence holes belonging to other tenants are not gaps** for this stream.
- **Gap / non-monotonic:** duplicate or non-increasing `eventSequence` within the tenant page relative to `lastSeenSequence` → `blocked-gap`; cursor does not advance past the failure; status remains blocked on retry.
- Out-of-order / regressing sequences without a prior durable outcome → fail closed (`blocked-gap` / conflict paths).
- Missing events are **not** fabricated; sequences are **not** inferred from timestamps.

---

## F. Checkpoint advancement rules

Advance **only after**:

1. Event resolved through registry-backed processing;
2. Tenant / legal-entity (and clinic when scoped) verified;
3. Durable outcome recorded (or idempotent prior confirmed);
4. Eligible intake snapshot resolvable when intake path used;
5. No ordering gap or integrity conflict remains.

**Never** advance merely because an event was fetched.

**Do not advance** on `unavailable` / `retryable-failure` / `conflict` (conflict may record blocked status) / `blocked-gap`.

**Lifecycle events (revoke/withdraw/invalidate):** durable `later-lifecycle-required` outcome is recorded; cursor **may** advance because acknowledgement for ordered catch-up is safe **without** applying operational holds (see §L).

---

## G. Duplicate, conflict and idempotency behaviour

| Case | Behaviour |
|---|---|
| Exact redelivery after durable outcome | Prior outcome returned; intake path is CP 2.4 idempotent; no second snapshot |
| Same event identity + conflicting contentHash | `conflict` / `EVENT_IDENTITY_CONTENT_CONFLICT`; checkpoint `blocked-conflict` |
| Already-completed sequence redelivery | Idempotent; cursor not regressed |
| Intake hash/version conflict | Mapped from CP 2.4 `conflict`; stops unsafe advancement |

---

## H. Bounded processing and continuation

- Default `batchLimit` = 25 (configurable per call; minimum 1).
- Pagination: exclusive `afterEventSequence = lastCompletedEventSequence`.
- `moreAvailable` when platform page length exceeds batch limit.
- Continuation starts after last safely completed sequence.
- Registry/publication unavailability mid-batch preserves last safe checkpoint (does not advance).

---

## I. Storage, interruption recovery and migration

**Keys:**
`pulse.m07.staffpay.publishedTimesheetReplayCheckpoints`
`pulse.m07.staffpay.publishedTimesheetReplayOutcomes`

**Migration:** `m07-staffpay-storage-v4` — additive, idempotent, insert-if-absent arrays; bumps meta to schema v4; preserves snapshots and Batch 1 data.

**Interruption:**

| Point | Recovery |
|---|---|
| Before snapshot | Retry event → CP 2.4 intake creates snapshot |
| After snapshot, before outcome/ack | Retry → CP 2.4 `duplicate-idempotent` + outcome idempotency |
| After outcome, before cursor advance | Retry → prior outcome reused; cursor advances |
| After cursor advance | Event not re-fetched |

**Qualification:** The current localStorage implementation provides deterministic best-effort recovery for the client-side architecture. It is **not** a production-grade multi-tab, multi-process or server-side transaction system.

Corrupt `lastCompletedEventSequence` → `CORRUPT_CHECKPOINT_SEQUENCE` / `blocked-conflict` (fail closed).

---

## J. Registry-query boundary

Uses only:

- `replayPublishedTimesheetEvents`
- `getPublishedTimesheetVersion` (for intake-eligible events)

Does **not** import `PUBLISHED_TIMESHEET_REGISTRY_KEYS`, enumerate/parse registry localStorage, or write registry events/versions/indexes.

---

## K. Organisation, legal-entity and clinic isolation

- `organisationId` and `legalEntityId` remain independent fields (never derived from each other).
- Cursors keyed per organisationId + legalEntityId (+ stream + contract).
- Cross-org/LE event leakage blocked; `getReplayCheckpointById` returns `null` across tenants.
- Actor LE scope enforced (`assertM07LegalEntityScope`); clinic scope enforced when provided.
- Platform query with wrong LE returns empty; guessed checkpoint ids reveal nothing.
- Batch queries are always scoped to one organisationId + legalEntityId pair.

---

## L. Lifecycle-event behaviour (no CP 2.6)

On `timesheet.approval.revoked` / `timesheet.record.withdrawn` / `timesheet.record.invalidated`:

- Outcome: `later-lifecycle-required` with reason `LIFECYCLE_EVENT_RECORDED_WITHOUT_OPERATIONAL_HOLD`
- **Does not** overwrite immutable snapshots
- **Does not** auto-select a replacement snapshot
- **Does not** mark prior snapshots payroll-approved or payroll-invalid
- **Does not** implement payroll recalculation
- Cursor may advance after durable recording for ordered continuity only

Later material `sourceVersion` creates a **new** snapshot via CP 2.4; prior versions remain.

---

## M. Audit lineage and event outcomes

Outcomes distinguished: `intaken`, `duplicate-idempotent`, `rejected-ineligible`, `unsupported`, `malformed`, `conflict`, `blocked-gap`, `unavailable`, `retryable-failure`, `terminal-failure`, `later-lifecycle-required`.

Each durable outcome writes M07 audit (`published-timesheet.replay.*`) with organisationId, eventId, sequence, type, timesheetRecordId, contentHash, snapshotId?, `blockedM07: true`.

Rejection ≠ payroll rejection. Success ≠ calculated / reviewed / approved / exported / paid / reconciled.

---

## N. New tests and results

**Suite:** `src/modules/m07-staff-pay/tests/m07-replay-cp25.test.ts`
**First run:** **10 pass / 0 fail**

Coverage: ordered replay + moreAvailable + continuation; duplicate idempotency; non-monotonic gap; event-identity conflict; interruption before cursor advance; corrupt cursor; publication unavailable; cross-org/LE; clinic mismatch; cursor isolation; lifecycle boundary without holds; architectural boundary (no `pulse.m06`, CP 2.4 intake, no registry mutation); BLOCKED-M07 remains.

---

## O. Regression results (first-run; no replace)

| Suite | First-run result | Notes |
|---|---|---|
| CP 2.5 replay | **10 / 0** | New |
| CP 2.3 boundary | **8 / 0** | |
| CP 2.4 intake (file) | **9 / 0** | Prior CP 2.4 evidence recorded 10/0; this file currently contains 9 `it` cases |
| workforce | **45 / 0** | |
| auth | **16 / 0** | |
| m04 | **16 / 0** | |
| m05 | **115 pass / 2 fail** | Performance only: bulk submission 7215ms > 5000ms; evidence-json aggregator |
| m06 | **82 pass / 1 fail** | Performance only: `perf.exception` 1194ms > 1000ms |
| m07 (full) | **78 / 0** | Includes CP 2.3 + 2.4 + 2.5 + migration v4 |

**Controlled rerun:** none performed (preserve first-run timing evidence for Checkpoint 2.7).

### Preserved prior performance qualification (do not overwrite)

**Checkpoint 2.3:** M05 115/2 perf; M06 82/1 perf.
**Checkpoint 2.4:** workforce 45/0; auth 16/0; M04 16/0; M05 117/0; M06 82/1 (`perf.break`); M07 67/0; CP 2.3 boundary 8/0; CP 2.4 intake 10/0.

---

## P. Working-tree separation

### Checkpoint 2.1 (platform)
- `src/platform/workforce/contracts/published-timesheet-*.ts`, `timesheet-approval-events.ts`
- `src/platform/workforce/services/published-timesheet-registry.ts`
- `src/platform/workforce/validation/published-timesheet-validation.ts`
- `src/platform/workforce/tests/published-timesheet-registry.test.ts`
- related contract/service/validation index exports
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_1_EVIDENCE.md`

### Checkpoint 2.2 (M06 publisher)
- `src/modules/m06-time-attendance/adapters/m06-published-timesheet-publisher.ts`
- `src/modules/m06-time-attendance/services/published-timesheet-outbox.ts`
- `src/modules/m06-time-attendance/storage/migrate-v3.ts`
- `src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts`
- related M06 index/bootstrap/keys/domain/timesheet-service wiring
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_2_EVIDENCE.md`

### Checkpoint 2.3
- `src/modules/m07-staff-pay/adapters/m06-timesheet-read.ts` (platform discovery rewrite)
- `src/modules/m07-staff-pay/tests/m07-boundary-cp23.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_3_EVIDENCE.md`

### Checkpoint 2.4
- `src/modules/m07-staff-pay/services/published-timesheet-intake.ts`
- `src/modules/m07-staff-pay/repository/published-timesheet-snapshots.ts`
- `src/modules/m07-staff-pay/storage/migrate-v3.ts`
- `src/modules/m07-staff-pay/tests/m07-intake-cp24.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_4_EVIDENCE.md`

### Checkpoint 2.5 (this checkpoint)
- Files listed in §A

### Regression-generated evidence
- `docs/audits/wave4-m05-performance-evidence.json` (modified by m05 perf run)
- `docs/audits/wave5-m06-performance-evidence.json` / workflow evidence (modified by m06 runs)

### Unrelated tracked leftovers
- `docs/audits/PLATFORM_INTEGRATION_QA.md`
- `docs/audits/platform-integration-evidence.json`
- `docs/audits/wave3-m11-performance-evidence.json`

### Unrelated untracked leftovers
- `docs/audits/PLATFORM_INTEGRATION_QA.md.bak`

**Branch:** `main` @ `a250d78` (Batch 1 baseline). **No commit. No push.**

---

## Q. Confirmations

- Replay reads only through approved platform `replayPublishedTimesheetEvents` / `getPublishedTimesheetVersion`
- No `pulse.m06.*` fallback in M07 production
- No M06 internal import in M07
- No direct M06→M07 write
- Replay uses existing CP 2.4 `intakePublishedTimesheet`
- organisationId and legalEntityId remain separate
- Replay cursors are tenant- and legal-entity-scoped
- Non-monotonic/gap conditions prevent unsafe cursor advancement
- Immutable snapshots cannot be overwritten
- No automatic supersession decision
- No operational revocation/withdrawal/invalidation hold
- No registry mutation from M07 replay
- No prohibited banking/TFN/super identifiers stored by replay
- No payroll calculation, approval, export, or payment state inferred
- **BLOCKED-M07 remains unresolved** (`blocked: true`)
- Approved Module 5 demand-based receptionist/nurse rostering requirement remains separately recorded for a later dedicated checkpoint and was **not** implemented or mixed into M07
- Performance fluctuations transparently recorded (first-run preserved; no green-chasing)
- No CSS, prototype-parity, or Premium Clinical Enterprise work
- **No commit or push**

---

**STOP.** Checkpoint 2.5 complete. Do not begin Checkpoint 2.6.

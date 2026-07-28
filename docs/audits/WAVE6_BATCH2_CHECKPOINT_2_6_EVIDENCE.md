# WAVE 6 / M07 Batch 2 — Checkpoint 2.6 Evidence

**Status:** COMPLETE (implementation + tests; not committed)
**Accepted baseline:** Checkpoint 2.5 evidence (`docs/audits/WAVE6_BATCH2_CHECKPOINT_2_5_EVIDENCE.md`)
**Scope:** M07 lifecycle projections — operational holds, snapshot eligibility, material-revision review, authorised supersession, restore acknowledgement, preparation-progress safeguards, exceptions, audit.
**Excluded:** Automatic supersession; payment; accounting reconciliation; BLOCKED-M07 clearance; Module 5 rostering; Premium Clinical Enterprise / CSS; Checkpoint 2.7; commit/push; working-tree cleanup.

---

## A. Exact files changed

### Created
- `src/modules/m07-staff-pay/services/published-timesheet-lifecycle.ts`
- `src/modules/m07-staff-pay/repository/published-timesheet-lifecycle.ts`
- `src/modules/m07-staff-pay/storage/migrate-v5.ts`
- `src/modules/m07-staff-pay/tests/m07-lifecycle-cp26.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_6_EVIDENCE.md` (this file)

### Modified
- `src/modules/m07-staff-pay/types/domain.ts` — lifecycle/eligibility/hold/supersession/prep-progress/decision/exception types; replay outcome kinds; `MigrationReport.v5Ran`
- `src/modules/m07-staff-pay/permissions.ts` — lifecycle permission codes + role-pack wiring
- `src/modules/m07-staff-pay/storage/keys.ts` — v5 keys; `M07_SCHEMA_VERSION = 5`
- `src/modules/m07-staff-pay/storage/migrate-v4.ts` — meta version literal `4` (so v5 owns schema bump)
- `src/modules/m07-staff-pay/storage/bootstrap.ts` — run v5; report `v5Ran`
- `src/modules/m07-staff-pay/storage/index.ts` — export migrate-v5
- `src/modules/m07-staff-pay/services/published-timesheet-replay.ts` — thin lifecycle hook; materiality/lineage; cursor-safety docs
- `src/modules/m07-staff-pay/services/index.ts` — export lifecycle
- `src/modules/m07-staff-pay/repository/index.ts` — export lifecycle repo
- `src/modules/m07-staff-pay/tests/m07-migration.test.ts` — v4 meta=4; v5 additive test
- `src/modules/m07-staff-pay/tests/m07-replay-cp25.test.ts` — lifecycle boundary aligned to hold application (CP 2.6)

### Not modified
- M05; M06; platform registry semantics; CP 2.4 snapshot business identity; payroll formulas; UI/CSS; prototype-parity; Premium Clinical Enterprise

---

## B. Paths vs authorised scope

| Authorised | Actual | Diff |
|---|---|---|
| `services/published-timesheet-lifecycle.ts` | Same | Matches |
| Thin hook in replay | `services/published-timesheet-replay.ts` | Matches |
| `repository/published-timesheet-lifecycle.ts` | Same | Matches |
| Types in `types/domain.ts` | Same | Matches |
| `storage/migrate-v5.ts` + keys/bootstrap/exports | Same | Matches |
| `tests/m07-lifecycle-cp26.test.ts` | Same | Matches |
| Evidence doc | This file | Matches |

**Prep-progress observation:** Batch 1 had no per-timesheet prep-progress type. CP 2.6 adds observational `preparationProgress` on the lifecycle projection (not payment/accounting), set via `observePreparationProgress` for gates/tests.

---

## C. Final lifecycle dependency direction

```
M06 → publisher/outbox → PublishedTimesheetRegistry
  → replayPublishedTimesheetEvents (CP 2.5)
  → runPublishedTimesheetReplayBatch
       ├─ revoke/withdraw/invalidate → applyLifecycleHoldEvent
       ├─ same contentHash / new sourceVersion → recordSameContentLineage (no intake)
       └─ material / first content → intakePublishedTimesheet (CP 2.4)
            └─ seedEligibility / applyMaterialRevisionAfterIntake
  → M07 lifecycle repositories (projections, eligibility, decisions, exceptions)
```

No duplicate registry reader; no `pulse.m06.*`; no registry mutation.

---

## D. Domain states and separation

| Layer | Owner | States |
|---|---|---|
| Source lifecycle | Platform (read-only) | approved / revised / restored / revoked / withdrawn / invalidated |
| Immutable snapshot history | CP 2.4 | append-only; key = org+LE+timesheetRecordId+sourceVersion |
| Snapshot eligibility | M07 CP 2.6 | eligible / pending-review / held / disqualified / superseded |
| Operational hold | M07 CP 2.6 | none / revocation-hold / withdrawal-hold / invalidation-hold / revision-review-hold |
| Supersession | M07 CP 2.6 | none / pending-authorised-selection / selected(+snapshotId) |
| Prep progress (observe) | M07 CP 2.6 | not-started / started-not-approved / approved / exported / external-status-unknown |

---

## E. Material vs non-material

- Different verified `contentHash` + new `sourceVersion` → CP 2.4 intake → `pending-review` + no auto-select.
- Lifecycle-only / same `contentHash` on a different platform `sourceVersion` → **lineage only**; no duplicate snapshot.
- Same `sourceVersion` + different hash → remains CP 2.4 hard conflict.
- Materiality never inferred from timestamps or approval wording alone.

---

## F. Lifecycle-event behaviour

| Event | Effect |
|---|---|
| Revoked | `revocation-hold`; eligible snapshots → `held`; prep blocked; snapshots preserved |
| Withdrawn | `withdrawal-hold`; same pattern |
| Invalidated | `invalidation-hold`; affected sourceVersion → `disqualified`; others held |
| Duplicate eventId | Idempotent; no duplicate holds/decisions/exceptions |

---

## G. Restore / reapproval / requalification

- Platform restore/reapproval does **not** auto-clear holds or auto-select.
- `acknowledgeRestoreClearHold` requires `payroll.lifecycle.hold.clear` + expected `projectionVersion` + reason.
- Same-version restoration reuses existing immutable snapshot (no duplicate/overwrite).
- Invalidated versions stay `disqualified` until explicit `requalifyInvalidatedSnapshot` (`payroll.lifecycle.requalify`) → `pending-review`.

---

## H. Authorised supersession

- **No automatic supersession** (including when prep not started).
- `selectSupersedingSnapshot` requires `payroll.lifecycle.supersede`, reason, expected version.
- Verifies same org/LE/timesheet; rejects held/disqualified/superseded targets; rejects cross-timesheet.
- Prior selected snapshot → `superseded` (readable historically); never deleted.
- Audit records `impliesPayrollApproval: false`.

---

## I. Preparation-progress gates

| Progress | On hold/lifecycle |
|---|---|
| not-started | Hold blocks ordinary use; material revision needs authorised selection |
| started-not-approved | Freeze + open `prep-frozen-held` exception; no silent recalc/swap |
| approved | Freeze + open `approved-blocked`; no silent un-approve |
| exported | Terminal `exported-terminal`; export artefacts untouched |
| external-status-unknown | Fail closed; investigation required |

`assertSnapshotUsableForPreparation` refuses held / disqualified / pending-review / superseded / exported / approved / external-unknown.

---

## J. Permissions and expected-state

New codes: `payroll.lifecycle.review`, `.hold.clear`, `.supersede`, `.requalify`, `.exception.resolve` (wired into payAdmin / payApprover packs).
Stale `expectedProjectionVersion` → fail closed (`STALE_PROJECTION_VERSION`).
localStorage best-effort recovery qualification retained (not multi-tab/server transactions).

---

## K. Isolation

Independent `organisationId` + `legalEntityId`; timesheet-scoped selection; clinic via snapshot/actor checks; guessed projection IDs → `null`; cross-LE throws; person identity only from publication/snapshot lineage.

---

## L. Replay hook and cursor safety

Lifecycle outcomes that are **safely recoverable before cursor advance:**
`lifecycle-hold-applied`, `lifecycle-lineage-recorded`, `lifecycle-material-pending-review`, `duplicate-idempotent`, plus existing intake outcomes.

**Do not advance** on `unavailable` / `retryable-failure` / `conflict` / `blocked-gap`.
Global `eventSequence` + tenant-filter semantics unchanged (CP 2.5 qualification preserved).

---

## M. Idempotency, storage, migration, recovery

- Event applications keyed by org+LE+eventId (insert-if-absent).
- Migration `m07-staffpay-storage-v5` additive arrays; schema meta → 5.
- Keys: projections, eligibility, decisions, exceptions, eventApplications.
- Interruptions: replaying same eventId is idempotent; snapshots never overwritten.

---

## N. Audit and prohibited data

Audited: hold applied, duplicate event, eligibility changes, material pending-review, hold-clear, supersession, requalify, exception create/resolve, stale denial, permission denial.
No TFN / bank / super / gross / net / tax / payment / reconciliation fields.
All service results: `blockedM07: true`.

---

## O. Requirement → test mapping

| Requirement | Asserted in `m07-lifecycle-cp26.test.ts` |
|---|---|
| Material new content → new snapshot, pending-review, no auto-supersession, prior unchanged | A — material content |
| Same-hash lineage; no snapshot rewrite on lifecycle revoke | A — same-hash |
| Revoke/withdraw/invalidate holds; block prep use; duplicate idempotent | B — holds |
| Restore alone does not clear; authorised clear; stale fail; requalify authority | C — restore |
| Authorised supersession; cross-timesheet denied; no payroll approval inference | D — supersession |
| Prep freeze/exceptions; exported terminal; external-unknown; no payment fields | E — prep progress |
| Org/LE independence; guessed IDs; permissions; audit | F — isolation |
| No pulse.m06; CP 2.4 intake; no registry mutation; BLOCKED-M07; no M5 mix-in | G — architecture |

CP 2.5 replay suite still covers ordering/gap/cursor (10/0).

---

## P. First-run results (no controlled rerun)

| Suite | First-run |
|---|---|
| CP 2.6 lifecycle | **8 / 0** |
| CP 2.5 replay | **10 / 0** |
| CP 2.4 intake | **9 / 0** |
| CP 2.3 boundary | **8 / 0** |
| M07 migrations (incl. v5) | **7 / 0** |
| workforce | **45 / 0** |
| auth | **16 / 0** |
| M04 | **16 / 0** |
| M05 | **115 / 2** (perf only — bulk submission) |
| M06 | **82 / 1** (perf only — `perf.exception`) |
| M07 full | **87 / 0** |

**Controlled rerun:** none.

### Preserved prior performance qualification (do not overwrite)

CP 2.3: M05 115/2; M06 82/1.
CP 2.4: workforce 45/0; auth 16/0; M04 16/0; M05 117/0; M06 82/1; M07 67/0; CP2.3 8/0; CP2.4 intake 10/0.
CP 2.5: CP2.5 10/0; CP2.3 8/0; CP2.4 9/0; workforce 45/0; auth 16/0; M04 16/0; M05 115/2; M06 82/1; M07 78/0.

---

## Q. Working-tree separation

- **CP 2.1–2.5:** as previously recorded in their evidence files
- **CP 2.6:** files in §A
- **Regression-generated:** wave4/wave5 performance evidence JSONs may update on m05/m06 runs
- **Unrelated leftovers:** `PLATFORM_INTEGRATION_QA.md`, platform/wave3 evidence JSONs, `PLATFORM_INTEGRATION_QA.md.bak`
- **Branch:** `main` @ Batch 1 baseline; **no commit; no push**

---

## R. Confirmations

- Immutable snapshots were not overwritten
- Material content intake still uses CP 2.4
- Lifecycle-only / same-hash events do not create improper snapshot rewrites
- Holds prevent ordinary preparation use
- Restore does not automatically clear holds
- Supersession always requires authorised selection
- No automatic supersession exception was implemented
- Exported artefacts are preserved (terminal exception only)
- No payment or accounting reconciliation implemented or inferred
- organisationId and legalEntityId remain independent
- Service-layer permissions and expected-state checks enforced
- No M06 internal access or direct write
- No platform registry mutation
- CP 2.5 global-eventSequence semantics unchanged
- Prohibited identifiers/financial fields not stored
- **BLOCKED-M07 remains unresolved**
- M05 demand-based rostering not mixed into M07
- Premium Clinical Enterprise redesign did not begin
- No commit or push
- Working tree was not cleaned

---

**STOP.** Checkpoint 2.6 complete. Do not begin Checkpoint 2.7.

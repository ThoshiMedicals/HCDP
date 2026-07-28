# WAVE 6 / M07 Batch 2 — Checkpoint 2.4 Evidence

**Status:** COMPLETE (implementation + tests; not committed)
**Accepted baseline:** Checkpoint 2.3 evidence
**Scope:** M07 operational intake of eligible platform publications into immutable source snapshots; identity/idempotency; isolation; audit; tests; this report.
**Excluded:** Replay cursors, supersession, revocation holds, payroll calculation, operational UI, BLOCKED-M07 clearance, commit/push.

---

## A. Exact files changed

### Created
- `src/modules/m07-staff-pay/services/published-timesheet-intake.ts`
- `src/modules/m07-staff-pay/repository/published-timesheet-snapshots.ts`
- `src/modules/m07-staff-pay/storage/migrate-v3.ts`
- `src/modules/m07-staff-pay/tests/m07-intake-cp24.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_4_EVIDENCE.md` (this file)

### Modified
- `src/modules/m07-staff-pay/types/domain.ts` — snapshot types + MigrationReport.v3Ran
- `src/modules/m07-staff-pay/storage/keys.ts` — snapshot storage keys; schema v3
- `src/modules/m07-staff-pay/storage/migrate-v2.ts` — meta version literal `2`
- `src/modules/m07-staff-pay/storage/bootstrap.ts` — run v3
- `src/modules/m07-staff-pay/storage/index.ts` — export v3
- `src/modules/m07-staff-pay/services/index.ts` — export intake
- `src/modules/m07-staff-pay/repository/index.ts` — export snapshot repo
- `src/modules/m07-staff-pay/adapters/m06-timesheet-read.ts` — blocker message clarifies snapshots ≠ clearance
- `src/modules/m07-staff-pay/tests/m07-migration.test.ts` — v3 additive/idempotent test

### Not modified
- M06 publisher/outbox
- Platform contract/hash/registry semantics
- CP 2.3 static boundary suite (still active)

---

## B. Paths vs plan

| Plan | Actual | Diff |
|---|---|---|
| Intake service | `services/published-timesheet-intake.ts` | Matches |
| Snapshot domain/schema | `types/domain.ts` (+ dedicated repo) | Types in domain; persistence in repository module |
| Snapshot repository | `repository/published-timesheet-snapshots.ts` | Matches conventions |
| Migration | `storage/migrate-v3.ts` | Additive v3 |
| Tests / evidence | `tests/m07-intake-cp24.test.ts` + this doc | Matches |

---

## C. Intake architecture

```
platform PublishedTimesheetRegistry (tenant-scoped get)
  → intakePublishedTimesheet (eligibility + hash verify via platform calculatePayrollContentHash)
  → append immutable M07 snapshot
  → derived snapshot index + current-intake index
  → M07 audit lineage
```

M07 does not mutate the registry. Discovery (CP 2.3) remains separate. `blockedM07: true` on every intake result.

---

## D. Snapshot schema and prohibited fields

**Stored:** snapshot id, registryPublicationId, organisationId, legalEntityId, clinicId?, timesheetRecordId, workforcePersonId, period bounds, attendanceSessionIds, ordinary/OT/penalty/leave/allowance inputs, sourceVersion, approvalRevision, platform contentHash, contractVersion, source event id/key/sequence, sourcePublishedAt, publisherId, publicationApprovalState (observed), intakenAt/By, intakeStatus=`imported`, `immutable: true`.

**Excluded:** TFN, bank/BSB/account, super member IDs, gross/net/tax, payment/export/payroll-approval status. Enforced via `assertNoProhibitedFields` + schema omission.

---

## E. Eligibility / rejection

**Intake only when** current registry lifecycle is `approved` | `revised` | `restored`, publication is current sourceVersion, supported contract, valid versions/event metadata, complete scope, workforce person present, platform hash matches, no prohibited fields, clinic scope OK.

**Reject:** revoked/withdrawn/invalidated (via **current** lifecycle projection), unsupported contract, hash mismatch, malformed payload, missing/mismatched org/LE, clinic mismatch, missing person/record/period/event identity.

Rejected intake creates **no** snapshot.

---

## F. Business identity

`organisationId + legalEntityId + timesheetRecordId + sourceVersion`
`idempotencyKey` is **not** part of uniqueness (traceability only).

---

## G. Idempotency / conflicts

| Case | Result |
|---|---|
| First valid intake | `imported` |
| Exact retry / same business key + same hash | `duplicate-idempotent` |
| Same sourceVersion + different hash | `conflict` (no overwrite) |
| Newer sourceVersion | new snapshot; prior remains |
| Current index | advances only to ≥ latest sourceVersion (no regression) |

---

## H. Storage / atomicity / migration

**Keys:** `publishedTimesheetSnapshots`, `publishedTimesheetSnapshotIndex`, `publishedTimesheetCurrentIntake`
**Order:** append immutable snapshot → update indexes → audit. Success only if snapshot resolvable.
**Recovery:** `rebuildPublishedTimesheetSnapshotIndexes()` from immutable history.
**Migration:** `m07-staffpay-storage-v3` additive, idempotent, insert-if-absent; preserves Batch 1 periods; legacy `intake` array remains non-authoritative empty placeholder.

**Qualification:** localStorage provides deterministic best-effort recovery for the client-side architecture — **not** a production multi-tab/multi-process transaction system.

---

## I. Registry-read boundary

Uses only `getPublishedTimesheetByRegistryId` / `getPublishedTimesheetVersion` / `getCurrentPublishedTimesheet`. No direct registry localStorage enumeration or mutation from intake.

---

## J. Isolation

Independent org + LE on every call; actor LE/clinic permission checks; cross-org/LE → `rejected`/`null`; guessed snapshot id under wrong scope → `null`. Workforce person taken from platform publication only (no name/email join).

---

## K. Audit lineage

Actions: `published-timesheet.intake.imported|idempotent|rejected|conflict` with org, LE, record, sourceVersion, approvalRevision, event id/sequence, contentHash, registryPublicationId. No banking/TFN/payment fields in audit.

---

## L. New tests

`m07-intake-cp24.test.ts` — **10 pass / 0 fail** (eligibility, fidelity, identity, isolation, recovery, boundaries).
CP 2.3 boundary suite — **8 pass / 0 fail** (still active).
Migration v3 case — pass.

---

## M. Regression results

### Preserved Checkpoint 2.3 performance qualification (historical — for CP 2.7)
- M05: 115 pass / 2 performance failures
- M06: 82 pass / 1 performance failure

**Not relabelled resolved.**

### This checkpoint first-run
| Suite | First-run |
|---|---|
| workforce | **45 / 0** |
| auth | **16 / 0** |
| m04 | **16 / 0** |
| m05 | **117 / 0** |
| m06 | **82 / 1** (`perf.break 684.32 > 500`) |
| m07 | **67 / 0** |

No controlled rerun performed. M06 performance failure remains recorded for Checkpoint 2.7. M05 green on this run does **not** erase the preserved CP 2.3 M05 performance failures.

---

## N. Working-tree separation

- **2.1:** platform published-timesheet contract/registry/hash/tests + evidence
- **2.2:** M06 publisher/outbox/migrate-v3/tests + evidence
- **2.3:** M07 discovery rewrite + boundary tests + evidence
- **2.4:** intake service, snapshot repo, migrate-v3, intake tests, this evidence
- **Regression leftovers:** PLATFORM_INTEGRATION_QA + wave evidence JSONs
- **Untracked leftover:** `PLATFORM_INTEGRATION_QA.md.bak`

---

## O. Confirmations

- [x] Intake reads only via platform registry boundary
- [x] No `pulse.m06.*` fallback
- [x] No M06 internal import in M07 intake
- [x] No direct M06→M07 write
- [x] organisationId ≠ legalEntityId (independent)
- [x] Snapshot uniqueness excludes idempotencyKey
- [x] Snapshots immutable / prior versions not overwritten
- [x] No platform registry mutation from M07
- [x] No prohibited identifiers stored
- [x] No payroll calculation/approval/export/payment inferred
- [x] Replay / supersession / revocation processing not started
- [x] BLOCKED-M07 remains unresolved (`blocked: true` on all intake results)
- [x] Performance fluctuations recorded
- [x] No CSS / prototype-parity / Premium Clinical Enterprise work
- [x] No commit or push

**STOP** — Checkpoint 2.4 evidence complete. Do not begin Checkpoint 2.5.

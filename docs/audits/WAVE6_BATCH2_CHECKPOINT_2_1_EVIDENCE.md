# WAVE 6 / M07 Batch 2 — Checkpoint 2.1 Evidence

**Status:** COMPLETE (implementation + tests; not committed)
**Baseline:** Batch 1 `a250d78dfda5db37d9b36d825cf00fe38fb88410`
**Scope:** Platform published-timesheet contract, version-preserving registry, lifecycle events, canonical hashing, migration, tests.
**Excluded:** Checkpoint 2.2+, M06 changes, M07 intake/UI, BLOCKED-M07 resolution, Premium Clinical Enterprise / CSS, commit/push.

---

## A. Exact files changed

### Created
- `src/platform/workforce/contracts/published-timesheet-contract.ts`
- `src/platform/workforce/contracts/published-timesheet-hash.ts`
- `src/platform/workforce/contracts/timesheet-approval-events.ts`
- `src/platform/workforce/services/published-timesheet-registry.ts`
- `src/platform/workforce/validation/published-timesheet-validation.ts`
- `src/platform/workforce/tests/published-timesheet-registry.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_1_EVIDENCE.md` (this file)

### Modified (additive exports / event types only)
- `src/platform/workforce/contracts/index.ts`
- `src/platform/workforce/contracts/workforce-events.ts`
- `src/platform/workforce/services/index.ts`
- `src/platform/workforce/validation/index.ts`

### Not modified
- All M06 source and operational adapters (BLOCKED-M07 remains)
- All M07 intake services / operational UI
- `timesheet-ref.ts` (existing consumer ref preserved; new published contract is separate)
- Shared CSS / design-system files

---

## B. Repository paths vs plan

| Plan expectation | Actual path | Diff |
|---|---|---|
| `src/platform/workforce/contracts/timesheet-ref.ts` | Unchanged (legacy M06 consumer ref) | **New** parallel module `published-timesheet-contract.ts` instead of overloading `timesheet-ref.ts` |
| `workforce-events.ts` | Same path; additive lifecycle event types | Extended, not replaced |
| Platform registry | `services/published-timesheet-registry.ts` | Matches platform service convention |
| Migration/bootstrap | Embedded in registry (`runPublishedTimesheetRegistryMigration`) | Uses existing `runMigrationOnce` + keys under `pulse.platform.workforce.publishedTimesheets.*` |
| Tests | `tests/published-timesheet-registry.test.ts` | Single suite covering A–F gates |
| Evidence | `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_1_EVIDENCE.md` | As authorised |

No parallel duplicate contract systems beyond the intentional separation of legacy `TimesheetRef` vs new `PublishedTimesheet*` contract.

---

## C. Final contract schema and supported version

**Supported version:** `published-timesheet.v1`
**Constant:** `PUBLISHED_TIMESHEET_CONTRACT_VERSION`
**Rule:** Explicit string version; unsupported older (`published-timesheet.v0`) and unknown newer (`published-timesheet.v99`) rejected; no silent coercion; no M06 fallback.

### Payroll content (hash boundary)
`timesheetRecordId`, `workforcePersonId`, `organisationId`, `legalEntityId`, optional `clinicId`, `periodStart`, `periodEnd`, `attendanceSessionIds`, `ordinaryHourInputs`, `overtimeHourInputs`, `penaltyHourInputs`, `leaveInputs`, `allowanceInputs`.

### Publication / lifecycle / transport (not in contentHash)
`contractVersion`, `sourceVersion`, `approvalRevision`, `approvalState`, `contentHash`, `publishedAt`, `publisherId`, `eventId`, `idempotencyKey`, `eventSequence`, `registryPublicationId`, optional `reasonCode`.

`organisationId` and `legalEntityId` are separate mandatory fields (never derived from each other).

---

## D. Canonicalization and hashing rules

Owned by `published-timesheet-hash.ts`:

1. Recursively sorted object keys.
2. Omitted optionals (`undefined`) excluded; explicit `null` preserved if present.
3. Set-like `attendanceSessionIds` sorted lexicographically.
4. Business-ordered arrays (`ordinaryHourInputs`, overtime, penalty, leave, allowance) preserve publisher order.
5. Finite numeric validation; reject `NaN` / `Infinity`.
6. Leave timestamps normalized via `Date.parse` → `toISOString()`; invalid timestamps rejected.
7. UTF-8 SHA-256 via `node:crypto` `createHash("sha256")` → lowercase hex.
8. Publisher-supplied `contentHash` is verified against platform calculation; mismatch rejected.

Lifecycle metadata (`approvalState`, `approvalRevision`, `publishedAt`, `publisherId`, `eventId`, `idempotencyKey`, `registryPublicationId`) is excluded from the hash boundary.

---

## E. Registry storage and current-index model

**Keys:**
- `pulse.platform.workforce.publishedTimesheets.versions` — append-only version rows
- `pulse.platform.workforce.publishedTimesheets.current` — derived current-state index
- `pulse.platform.workforce.publishedTimesheets.events` — append-only lifecycle events
- `pulse.platform.workforce.publishedTimesheets.meta` — storage version marker

**Uniqueness:**
- Content version: `organisationId + legalEntityId + timesheetRecordId + sourceVersion` (immutable; hash conflict if content differs)
- Event: `eventId` / `idempotencyKey`
- Later M07 snapshot business uniqueness (documented via `publishedIntakeIdentity`): **same four fields**; `idempotencyKey` is **not** part of snapshot business uniqueness

**Queries:** exact version, current content/lifecycle, org+LE+date-range, approval-state filters, ordered replay from `eventSequence`, lineage.

Tenant isolation: lookups require matching `organisationId` + `legalEntityId`; cross-org registry id guess returns `null`.

---

## F. sourceVersion / approvalRevision / eventSequence

| Concept | Behaviour |
|---|---|
| `sourceVersion` | Positive integer; monotonic per record; advances only on material payroll-content change |
| `approvalRevision` | Positive integer; advances on grant/revise/revoke/restore/withdraw/invalidate |
| `eventSequence` | Monotonic publication/event order (not timestamp-only); used for replay cursors |
| `eventId` / `idempotencyKey` | Stable unique attempt/event identity; retry dedupe; not business snapshot uniqueness |

Lifecycle-only changes (same `sourceVersion` + same `contentHash`, higher `approvalRevision`) append an event and update current index **without** overwriting or duplicating the immutable version row.

---

## G. Atomicity / concurrency approach

Storage technology: `localStorage` via platform `readJsonSafe` / `writeJsonSafe` (no multi-key transactions).

**Publication order:** (1) append version row → (2) append event → (3) advance current index.

**Protections:**
- Identical retry → idempotent success
- Same version + different hash → rejected
- Reused event id + different payload → rejected
- Lower sourceVersion / stale approvalRevision / out-of-order eventSequence → rejected
- Concurrent duplicate of same version without matching event id → deterministic `VERSION_EXISTS` / conflict

**Recovery:** `rebuildCurrentIndexFromHistory()` rebuilds current index from immutable versions + ordered events. Interrupted publication after version write does not leave a false current claim; rebuild restores derived state without deleting history.

---

## H. Migration and recovery

- Migration id: `platform-published-timesheet-registry-v1`
- Additive, idempotent, insert-if-absent, non-destructive
- Does not wipe Batch 1 / module stores
- Partial migration (flag cleared) resumes safely
- Stale current index rebuilds from history
- Duplicate identical publication is idempotent
- Conflicting duplicate version rejected
- Unsupported contract versions rejected at validation boundary

---

## I. New test list and results

Suite: `src/platform/workforce/tests/published-timesheet-registry.test.ts`
Command: `npm run test:workforce`
**Result: 45 pass / 0 fail** (includes prior workforce suites + 27 new CP 2.1 cases)

### Contract validation
- mandatory record identity / org+LE / positive sourceVersion+approvalRevision / event identity
- supported contract version; reject unsupported/unknown
- prohibited TFN/banking/super fields
- clinic membership checker
- reasonCode required on revoke lifecycle event

### Canonical hashing
- equivalent payloads identical hash (set-like session reorder)
- material change changes hash
- lifecycle metadata excluded from hash JSON
- business-ordered hour arrays preserve order
- null/omitted clinic deterministic
- reject NaN/Infinity/invalid timestamps
- reject mismatched supplied hash

### Registry / idempotency / recovery / boundaries
- append-only history + current index
- tenant isolation
- identical retry idempotent
- version/hash/event conflicts
- sourceVersion / approvalRevision regression
- lifecycle-only revoke without overwrite
- out-of-order eventSequence
- interrupted publication recovery
- stale index rebuild
- intake identity excludes idempotencyKey from business key
- ordered replay
- no M07 mutation export surface

---

## J. Regression results by suite

| Suite | Result |
|---|---|
| `test:workforce` | **45 pass / 0 fail** |
| `test:auth` | **16 pass / 0 fail** |
| `test:m04` | **16 pass / 0 fail** |
| `test:m05` | **117 pass / 0 fail** |
| `test:m06` | **64 pass / 0 fail** (includes `m07 bridge blocked` / BLOCKED-M07) |
| `test:m07` | **49 pass / 0 fail** (includes `keeps M06 bridge BLOCKED-M07 unresolved`) |

---

## K. Working-tree separation

### Checkpoint 2.1 files
- New/modified platform workforce contract, hash, events, validation, registry, tests, this evidence doc

### Regression-generated evidence (pre-existing / protected leftovers — not part of CP 2.1 staging)
- `docs/audits/PLATFORM_INTEGRATION_QA.md`
- `docs/audits/platform-integration-evidence.json`
- `docs/audits/wave3-m11-performance-evidence.json`
- `docs/audits/wave4-m05-performance-evidence.json`
- `docs/audits/wave5-m06-performance-evidence.json`
- `docs/audits/wave5-m06-workflow-evidence.json`

### Unrelated untracked leftovers
- `docs/audits/PLATFORM_INTEGRATION_QA.md.bak`

---

## L. Confirmations

- [x] `organisationId` and `legalEntityId` remain separate authoritative fields
- [x] `approvalState` (and other lifecycle/transport metadata) excluded from `contentHash`
- [x] `idempotencyKey` is not part of snapshot business uniqueness
- [x] Prior published versions are append-only and not destructively overwritten
- [x] No M06 or M07 operational implementation added in this checkpoint
- [x] `BLOCKED-M07` remains unresolved
- [x] No direct M06→M07 write introduced
- [x] Prohibited banking/TFN/super/payment fields rejected on published contract
- [x] No Premium Clinical Enterprise or CSS redesign began
- [x] No commit or push performed
- [x] Checkpoint 2.2 not started

**STOP** — Checkpoint 2.1 evidence complete.

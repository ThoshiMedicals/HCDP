# WAVE 6 / M07 Batch 2 — Checkpoint 2.2 Evidence

**Status:** COMPLETE (implementation + tests; not committed)
**Baseline accepted:** Checkpoint 2.1 evidence
**Scope:** Isolated M06 compatibility publication through Checkpoint 2.1 platform contract/registry; publisher mapping; outbox/retry; M06-focused tests; this report.
**Excluded:** Checkpoint 2.3+, M07 intake/UI, legacy scrape removal, BLOCKED-M07 clearance, M01/M02 projections, payroll calculations, commit/push, CSS / Premium Clinical Enterprise.

---

## A. Exact files changed

### Created (Checkpoint 2.2)
- `src/modules/m06-time-attendance/adapters/m06-published-timesheet-publisher.ts`
- `src/modules/m06-time-attendance/services/published-timesheet-outbox.ts`
- `src/modules/m06-time-attendance/storage/migrate-v3.ts`
- `src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_2_EVIDENCE.md` (this file)

### Modified (Checkpoint 2.2)
- `src/modules/m06-time-attendance/types/domain.ts` — additive `legalEntityId`, publication metadata, outbox types
- `src/modules/m06-time-attendance/services/timesheet-service.ts` — generate scope fields; approve/reopen outbox hooks
- `src/modules/m06-time-attendance/storage/keys.ts` — outbox keys + v3 migration id; schema version 3
- `src/modules/m06-time-attendance/storage/migrate-v2.ts` — write meta version `2` literally (v3 owns version 3)
- `src/modules/m06-time-attendance/storage/bootstrap.ts` — run v3
- `src/modules/m06-time-attendance/storage/index.ts` — export v3
- `src/modules/m06-time-attendance/adapters/index.ts` — export publisher
- `src/modules/m06-time-attendance/services/index.ts` — export outbox
- `src/modules/m06-time-attendance/tests/_helpers.ts` — run v3 in reset
- `src/modules/m06-time-attendance/tests/m06-migration.test.ts` — v3 idempotent recovery

### Unchanged by design
- `adapters/m07-timesheet-bridge.ts` (BLOCKED-M07)
- All M07 operational modules
- Platform CP 2.1 registry/hash (consumed, not rewritten)

---

## B. Paths vs plan

| Plan expectation | Actual | Diff |
|---|---|---|
| M06 publication adapter | `adapters/m06-published-timesheet-publisher.ts` | Matches narrow adapter convention |
| Approval/outbox integration | `services/timesheet-service.ts` + `services/published-timesheet-outbox.ts` | Outbox separated from WF-19A TimesheetRef publish |
| Publication metadata/migration | `storage/migrate-v3.ts` + outbox keys | Additive v3; does not replace v1/v2 |
| Tests | `tests/m06-published-timesheet.test.ts` | Dedicated CP 2.2 suite |
| Platform exports | none required beyond CP 2.1 | No second contract |

---

## C. Architecture and dependency direction

```
M06 TimesheetRecord (SoT)
  → approveTimesheet / reopenTimesheet
  → enqueueAndAttemptPlatformPublication (outbox obligation)
  → m06-published-timesheet-publisher (map only)
  → platform validate + calculate/verify contentHash
  → platform publishTimesheetVersion (PublishedTimesheetRegistry)
```

- Platform does **not** import M06 repositories/domain.
- M06 does **not** import M07.
- No circular module dependency.
- No duplicate hashing/validation in M06.
- Publication is outbound projection; M06 remains SoT.
- Approval succeeds even if platform publication fails (retryable outbox).

---

## D. Field-mapping table

| Platform field | M06 source | Req/Opt | Normalization | Missing/malformed |
|---|---|---|---|---|
| organisationId | `TimesheetRecord.organisationId` | Required for publish | trim | Outbox `failed` / eligibility reject |
| legalEntityId | `TimesheetRecord.legalEntityId` (additive; **not** derived from org) | Required for publish | trim | Outbox `failed` |
| clinicId | `TimesheetRecord.clinicId` | Required | as stored | Reject |
| timesheetRecordId | `TimesheetRecord.id` | Required | as stored | Reject |
| workforcePersonId | `TimesheetRecord.personId` | Required | as stored | Reject |
| periodStart/End | timesheet period fields | Required | civil date strings | Reject |
| attendanceSessionIds | `sessionIds` | Required array | copied; platform sorts for hash | — |
| ordinaryHourInputs | `totalMinutes` → `[{code:"ORD", hours}]` | Required | minutes/60, 3dp | Canonicalization reject if non-finite |
| overtime/penalty/leave/allowance | empty arrays (M06 has no structured approved buckets yet) | Present empty | — | — |
| sourceVersion | `publicationSourceVersion` / planned from content hash vs last ack | Required ≥1 | content-only monotonic | Reject |
| approvalRevision | `approvalRevision` / planned lifecycle counter | Required ≥1 | lifecycle monotonic | Reject |
| approvalState | mapped from intent (granted→approved, etc.) | Required | enum | Reject |
| eventId / idempotencyKey | `m06.pts::{id}::sv{N}::ar{N}::{intent}` | Required | stable for exact retry | Reject |
| eventSequence | outbox meta `nextEventSequence` | Required ≥1 | durable monotonic | Reject |
| publishedAt / publisherId | outbox snapshot / actor userId | Required | ISO / string | Reject |
| contractVersion | platform `published-timesheet.v1` | Required | platform-owned | Unsupported rejected |
| contentHash | platform `calculatePayrollContentHash` | Required | SHA-256 hex | Mismatch rejected |

**Not mapped / prohibited:** TFN, BSB/bank, super member, payment, gross/net/tax fields.

---

## E. Eligibility and rejection rules

**Publish granted/revised/restored only when** M06 state is `approved` and scope/identity/version/event fields are complete.

**Do not publish as granted:** draft, submitted, rejected, reopened.

**Operational hooks:**
- `approveTimesheet` → enqueue `granted` (may classify `revised`/`restored` from prior ack)
- `reopenTimesheet` (after prior platform ack) → enqueue `revoked` with reason
- `rejectTimesheet` → no platform publication

Publication failure leaves M06 approval intact and records a durable failed outbox item for authorised retry.

---

## F. sourceVersion / approvalRevision / eventSequence / identity

| Concept | Behaviour |
|---|---|
| M06 `version` | Optimistic concurrency only — **not** reinterpreted as platform sourceVersion |
| `publicationSourceVersion` | Advances only when content hash vs last ack changes |
| `approvalRevision` | Advances on grant/revise/revoke/restore/withdraw/invalidate |
| `eventSequence` | Durable in `publishedTimesheetOutboxMeta`; survives reload |
| `eventId`/`idempotencyKey` | Stable per timesheet+sourceVersion+approvalRevision+intent; exact retry reuses |

---

## G. Lifecycle behaviour

| Event | Operational in M06? | Behaviour |
|---|---|---|
| approval granted | Yes (`approveTimesheet`) | First publish sourceVersion=1 |
| approved content revised | Yes (reopen → change hours → re-approve) | New sourceVersion + hash; prior versions retained |
| approval revoked | Yes (`reopenTimesheet` after prior ack) | Same sourceVersion/hash; approvalRevision++; content not deleted |
| approval restored | Yes (re-approve after revoke, same content) | Classified `restored`; new approvalRevision |
| record withdrawn | **Typed compatibility only** (`publishTypedLifecycleCompatibility`) | Not operationally triggered by M06 UI |
| record invalidated | **Typed compatibility only** | Not operationally triggered by M06 UI |

Stale approvalRevision / out-of-order eventSequence rejected by platform registry.

---

## H. Failure, outbox, retry

- Approval is authoritative and is **not** rolled back on publication failure.
- Outbox statuses: `pending` → attempt → `published` | `failed`.
- `maxAttempts` default 5; no uncontrolled automatic retry loops.
- `processPublicationOutbox` / `retryPublicationOutboxItem` are explicit.
- Exact retry reuses event identity/sequence.
- Registry success then lost local ack: retry → platform idempotent → local ack restored; no duplicate version.
- Success claimed only after registry confirm + local ack write.

**Limitation:** client localStorage outbox is single-process best-effort (see §J).

---

## I. Tenant / legal-entity / clinic isolation

- `organisationId` and `legalEntityId` remain separate mandatory publish fields.
- Cross-org registry lookup by guessed `registryPublicationId` returns `null`.
- Optional `clinicMembershipCheck` rejects mismatched clinic under org/LE.
- Incorrect/missing legalEntityId fails publication eligibility without inventing success.
- Errors do not expose other tenants’ payloads.

---

## J. LocalStorage concurrency qualification

The Checkpoint 2.1 localStorage ordering and index-rebuild mechanism provides **best-effort deterministic recovery** for the current client-side architecture. It is **not** a production-grade multi-process or multi-tab transaction system.

Checkpoint 2.2 does **not** claim full transactional concurrency. Residual multi-writer risk remains for migration to a server-backed transactional store. Simulated interruption + idempotent retry are tested; true concurrent multi-tab writers are not guaranteed.

---

## K. New tests and results

Suite: `m06-published-timesheet.test.ts`
**19 pass / 0 fail**

Coverage: eligibility (A), mapping (B), versioning (C), lifecycle (D), failure/retry (E), boundaries (F).

---

## L. Regression results

| Suite | First-run result | Controlled notes |
|---|---|---|
| `test:workforce` | **45 pass / 0 fail** | — |
| `test:auth` | **16 pass / 0 fail** | — |
| `test:m04` | **16 pass / 0 fail** | — |
| `test:m05` | **115 pass / 2 fail** | Both failures in `m05-performance.test.ts` (bulk submission timing + evidence assert). Unrelated to CP 2.2. Functional M05 files re-run excluding perf: **78 pass / 0 fail** (subset of non-perf files). |
| `test:m06` | **82 pass / 1 fail** | Failure: `m06-performance.test.ts` `perf.clock 369.64 > 300`. Controlled perf-only rerun: failed again on `perf.break 834.64 > 500` (machine load flake). CP 2.2 suite alone: **19/0**. M06 functional excl. perf: **70 pass / 0 fail**. |
| `test:m07` | **49 pass / 0 fail** | Includes `keeps M06 bridge BLOCKED-M07 unresolved` |

---

## M. Working-tree separation

### Checkpoint 2.1 files (still uncommitted)
- Platform published-timesheet contract/hash/events/registry/validation/tests
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_1_EVIDENCE.md`

### Checkpoint 2.2 files
- M06 publisher, outbox, migrate-v3, timesheet hooks, CP 2.2 tests, this evidence doc

### Regression-generated evidence / leftovers (protected)
- `docs/audits/PLATFORM_INTEGRATION_QA.md`
- `docs/audits/platform-integration-evidence.json`
- `docs/audits/wave3-m11-performance-evidence.json`
- `docs/audits/wave4-m05-performance-evidence.json`
- `docs/audits/wave5-m06-performance-evidence.json`
- `docs/audits/wave5-m06-workflow-evidence.json`

### Unrelated untracked
- `docs/audits/PLATFORM_INTEGRATION_QA.md.bak`

---

## N. Confirmations

- [x] No M07 operational implementation added
- [x] M07 legacy key-scrape not removed (CP 2.3+)
- [x] BLOCKED-M07 remains unresolved (`blocked: true`)
- [x] No M06 direct `pulse.m07.*` write
- [x] organisationId and legalEntityId remain separate
- [x] approvalState excluded from contentHash (platform hash boundary)
- [x] Prior published versions remain immutable
- [x] Publication failure cannot falsely claim registry success
- [x] Prohibited identifiers rejected
- [x] No payroll calculation / export / payment status inferred
- [x] No prototype-parity count changed
- [x] No CSS / Premium Clinical Enterprise work
- [x] No commit or push

**STOP** — Checkpoint 2.2 evidence complete. Do not begin Checkpoint 2.3.

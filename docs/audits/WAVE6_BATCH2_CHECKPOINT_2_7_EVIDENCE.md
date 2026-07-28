# WAVE 6 / M07 Batch 2 — Checkpoint 2.7A Evidence

**Status:** COMPLETE (verification + evidence only; **not** Checkpoint 2.7B)
**Authorisation:** Owner Wave 6 / M07 Batch 2 Checkpoint 2.7 proposal accepted with two-stage final gate — **2.7A only**.
**Excluded:** BLOCKED-M07 clearance; Checkpoint 2.7B; production behaviour changes; M05/M06 product edits; commit/push; working-tree cleanup; Module 5 rostering; Premium Clinical Enterprise redesign.

**Final recommendation:** **RECOMMENDED FOR OWNER-AUTHORISED CLEARANCE**
(subject to owner acceptance of qualifications in §Q / §T; clearance flip is **not** performed here.)

---

## A. Exact files changed (Checkpoint 2.7A)

### Created
- `src/modules/m07-staff-pay/tests/m07-batch2-final-gate-cp27.test.ts`
- `src/modules/m07-staff-pay/tests/m07-architecture-cp27.test.ts`
- `src/modules/m07-staff-pay/tests/m07-migration-cp27.test.ts`
- `docs/audits/WAVE6_BATCH2_REQUIREMENT_TRACEABILITY.md`
- `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_7_EVIDENCE.md` (this file)

### Modified
- None of production M07/M06/platform behaviour. Test harness only (E2E fixture alignment so M06 outbox `eventSequence` stays aligned with platform registry when composing continuation publications).

### Not modified
- `getM07TimesheetIntakeBlockerStatus` / `acknowledgeApprovedTimesheetIntake` (BLOCKED-M07 remains)
- M05 / M06 product code; platform registry semantics; CP 2.4–2.6 production services
- UI/CSS; Module 5 rostering; payroll payment/calc/export/reconciliation

---

## B. Actual paths vs authorised scope

| Authorised | Actual | Diff |
|---|---|---|
| `tests/m07-batch2-final-gate-cp27.test.ts` | `src/modules/m07-staff-pay/tests/m07-batch2-final-gate-cp27.test.ts` | Matches (module-local path) |
| `tests/m07-architecture-cp27.test.ts` | same under m07 tests | Matches |
| `tests/m07-migration-cp27.test.ts` | same under m07 tests | Matches |
| `docs/audits/WAVE6_BATCH2_REQUIREMENT_TRACEABILITY.md` | Same | Matches |
| `docs/audits/WAVE6_BATCH2_CHECKPOINT_2_7_EVIDENCE.md` | Same | Matches |
| Narrow test fixtures/exports | None required beyond existing helpers | Matches |

No production behaviour files edited in 2.7A.

---

## C. Pre-edit architecture and blocker-location findings

### Dependency direction (unchanged; matches proposal)

```
M06 SoT → M06 publisher/outbox → platform PublishedTimesheetRegistry
  → replayPublishedTimesheetEvents → M07 runPublishedTimesheetReplayBatch
  → CP 2.4 intakePublishedTimesheet → immutable snapshots
  → CP 2.6 lifecycle (holds / eligibility / supersession)
```

### BLOCKED-M07 locations (verified; not only `adapters/m06-timesheet-read.ts`)

| Location | Role |
|---|---|
| `src/modules/m07-staff-pay/adapters/m06-timesheet-read.ts` → `getM07TimesheetIntakeBlockerStatus()` | **Primary M07 readiness helper** — always `{ blocked: true, workflowEvidenceCode: "BLOCKED-M07" }` |
| `src/modules/m06-time-attendance/adapters/m07-timesheet-bridge.ts` → `acknowledgeApprovedTimesheetIntake()` | **M06 bridge** — always blocked with `BLOCKED-M07` |
| Intake / replay / lifecycle service result literals | Propagate `blockedM07: true` / `workflowEvidenceCode: "BLOCKED-M07"` from the helper / types |

Discovery may reference `PUBLISHED_TIMESHEET_REGISTRY_KEYS` for **health probe only** (not a second replay reader). Confirmed in architecture suite.

### Supported M07 schema versions
`M07_SCHEMA_VERSION = 5` with migrations v1→v5 (`M07_MIGRATION_ID`, `…_V2_ID` … `…_V5_ID`). Entry: `ensureM07Bootstrapped` / `runM07StorageMigrations` + `runM07SchemaV2…V5Migration`.

### E2E publication surface
Approved path is M06 `approveTimesheet` → outbox → `publishTimesheetVersion`. Platform `publishTimesheetVersion` is also the publisher API used by M06 and may be composed for lifecycle-only restore/material **without** inventing a second registry. Continuation extras in E2E use **additional M06 approve publications** so M06 `allocateEventSequence()` stays aligned with registry sequences (direct extra publishes desync M06 meta and cause `EVENT_SEQUENCE_CONFLICT` — test fixture defect, not a product defect routed to CP 2.2).

### Pre-edit mismatch
Proposal assumed possible sole blocker at `adapters/m06-timesheet-read.ts`. **Actual:** two authoritative return sites (M07 helper + M06 bridge) plus literal propagation. No stop — documented; 2.7B proposal addresses both.

---

## D. Consolidated CP 2.1–2.6 requirement-to-test traceability

See **`docs/audits/WAVE6_BATCH2_REQUIREMENT_TRACEABILITY.md`**.

Summary: **no material orphan requirements**; static-only rows paired with behavioural suites where applicable; qualifications and deferred items explicit; BLOCKED-M07 clearance intentionally not proven in 2.7A.

---

## E. End-to-end narrative and production services composed

**Suite:** `m07-batch2-final-gate-cp27.test.ts`

| Step | Production API |
|---|---|
| Seed / clock / generate / submit / approve | M06 clock + `timesheet-service` |
| Outbox publish | `listPublicationOutbox` / M06 publisher path inside approve |
| Registry current + ordered events | `getCurrentPublishedTimesheet`, `replayPublishedTimesheetEvents` |
| M07 bootstrap | `ensureM07Bootstrapped` |
| Ordered bounded replay | `runPublishedTimesheetReplayBatch` |
| Immutable snapshots | `getPublishedTimesheetSnapshotByBusinessKey`, `listPublishedTimesheetSnapshots` |
| Hold / restore ack / supersession / prep gate | lifecycle services |
| Material revision publish | `publishTimesheetVersion` + `calculatePayrollContentHash` (same platform surface M06 publisher uses) |
| Isolation | scoped replay + actor LE deny |
| Blocker unchanged | `getM07TimesheetIntakeBlockerStatus`, `acknowledgeApprovedTimesheetIntake` |

Second case: foreign-tenant intervening global sequence proves tenant-filtered holes are not treated as tenant gaps.

---

## F. Proof that no bypass or duplicate path was introduced

- E2E imports existing M06 / platform / M07 services only; no new publisher, registry, intake, or lifecycle implementation.
- Architecture suite asserts exactly one `intakePublishedTimesheet` and one `calculatePayrollContentHash`; replay source includes platform `replayPublishedTimesheetEvents` + `intakePublishedTimesheet` and does not parse registry via `readJsonSafe`.
- Continuation events published via M06 approve (not a synthetic alternate pipeline).

---

## G. Replay ordering, interruption, outcome durability, cursor safety

| Claim | Where proven |
|---|---|
| Ordered tenant-filtered replay; moreAvailable | E2E + CP2.5 A |
| Exact retry idempotency | E2E + CP2.5 A |
| Interruption / resume without duplicate snapshots | E2E + CP2.5 B |
| Corrupt sequence fails closed (`blocked-conflict`) | E2E + CP2.5 B |
| Gaps / identity conflicts | CP2.5 A |
| Global seq + tenant holes | E2E second case |

---

## H. Snapshot immutability and materiality

| Claim | Where proven |
|---|---|
| Immutable intake after publish | E2E + CP2.4 |
| Material content → new snapshot + pending-review | E2E + CP2.6 A |
| Earlier snapshot unchanged | E2E + CP2.6 A |
| No automatic supersession | E2E + CP2.6 A/D |

---

## I. Lifecycle hold, restoration, supersession

| Claim | Where proven |
|---|---|
| M06 reopen → registry revoke → hold applied | E2E + CP2.6 B |
| Ordinary use denied while held | E2E + CP2.6 B/E |
| Restore publication alone does not clear hold | E2E + CP2.6 C |
| Authorised restore acknowledgement clears | E2E + CP2.6 C |
| Authorised supersession selects newer eligible; prior superseded but preserved | E2E + CP2.6 D |

---

## J. Isolation, permission, stale-decision evidence

| Claim | Where proven |
|---|---|
| Cross-org / cross-LE / guessed ids fail closed | E2E + CP2.3–2.6 isolation groups |
| Clinic mismatch / foreign snapshot deny | E2E + CP2.4/2.6 |
| Stale projection decisions fail closed | CP2.6 C |
| Prohibited payroll fields absent on snapshots | E2E + CP2.4 B + architecture |

---

## K. Complete supported-schema migration matrix

**Suite:** `m07-migration-cp27.test.ts` — **6 / 0**

| Starting point | Result |
|---|---|
| Empty bootstrap → v5 | pass (lifecycle collections present) |
| v1 → v5 | pass (periods preserved) |
| v2 → v5 | pass (profiles preserved) |
| v3 → v5 | pass (immutable snapshots preserved) |
| v4 → v5 | pass (replay cursors preserved; lifecycle arrays inserted if absent) |
| Repeated v5 idempotent; interrupted resume | pass (no wipe of valid rows) |
| No writes to M04/M05/M06/platform-registry keys | asserted in suite |

No unsupported invented historical shapes. No migration failure → not a clearance blocker.

---

## L. Static / architecture checks

**Suite:** `m07-architecture-cp27.test.ts` — **7 / 0**

| Check | Result |
|---|---|
| No `pulse.m06` / M06 repository|services imports in M07 production | pass |
| No registry KEYS writes; KEYS import only discovery adapter | pass |
| Single intake + single hash; replay uses platform query + CP2.4 | pass |
| M06 production no `pulse.m07` / no M07 imports | pass |
| Prohibited TFN/banking/pay/recon fields absent in snapshot/lifecycle stores | pass |
| No Module 5 demand-rostering / PCE redesign strings in M07 production | pass |
| Scan scope documented | pass |

**Directories scanned:** `src/modules/m07-staff-pay/**` and `src/modules/m06-time-attendance/**` production `.ts/.tsx`, excluding `tests/`.
**Exclusions:** comments and string/template literals stripped before pattern match (avoids doc false-fails and assertion-text evasion).
**Limitations:** does not fully model dynamic/computed property access or runtime `eval`; rename-evasive indirection is a residual risk mitigated by behavioural E2E + CP suites.

---

## M. Prohibited-data verification

- Architecture static patterns on domain/intake/lifecycle/snapshot repos.
- E2E asserts `tfn` / `grossPay` / `paymentStatus` undefined on snapshots.
- CP2.4 fidelity + CP2.1 validation reject prohibited fields on publish.

---

## N. First-run results for every 2.7A and regression suite

Recorded separately; **no rerun-until-green**. Controlled reruns: **none**.

### Checkpoint 2.7A suites (this session)

| Suite | First-run |
|---|---|
| `m07-batch2-final-gate-cp27.test.ts` | **2 / 0** |
| `m07-architecture-cp27.test.ts` | **7 / 0** |
| `m07-migration-cp27.test.ts` | **6 / 0** |

### Applicable regressions (this session)

| Suite | First-run |
|---|---|
| CP 2.3 boundary | **8 / 0** |
| CP 2.4 intake | **9 / 0** |
| CP 2.5 replay | **10 / 0** |
| CP 2.6 lifecycle | **8 / 0** |
| workforce | **45 / 0** |
| auth | **16 / 0** |
| M04 | **16 / 0** |
| M05 | **116 / 2** (performance only — see §Q) |
| M06 | **82 / 1** (performance only — `perf.exception`) |
| M07 full | **102 / 0** |

**New functional failures:** none.

---

## O. Earlier preserved results (shown separately; not replaced)

From CP 2.6 evidence (and priors):

| Era | Snapshot |
|---|---|
| CP 2.3 preserved | M05 115/2; M06 82/1 |
| CP 2.4 preserved | workforce 45/0; auth 16/0; M04 16/0; M05 117/0*; M06 82/1; M07 67/0; CP2.3 8/0; CP2.4 10/0* |
| CP 2.5 preserved | CP2.5 10/0; CP2.3 8/0; CP2.4 9/0; workforce 45/0; auth 16/0; M04 16/0; M05 115/2; M06 82/1; M07 78/0 |
| CP 2.6 preserved | CP2.6 8/0; CP2.5 10/0; CP2.4 9/0; CP2.3 8/0; workforce 45/0; auth 16/0; M04 16/0; M05 115/2; M06 82/1; M07 87/0 |

\*CP 2.4 notes historical intake count variance; current intake file has 9 cases.

**Do not declare M05/M06 timing fixed.**

---

## P. Controlled rerun

**None.** No timing-only controlled rerun was performed. First-run M05/M06 timing failures preserved as-is.

---

## Q. Defects or qualifications and owning checkpoint/module

| Item | Owner | Disposition |
|---|---|---|
| M05 bulk submission / evidence-json performance asserts | M05 | **Qualified** — pre-existing timing fluctuation; not an M07 Batch 2 functional defect. Owner decides acceptance. |
| M06 `perf.exception` timing assert | M06 | **Qualified** — same. |
| Global eventSequence + tenant-filtered replay | CP 2.1/2.5 architecture | **Accepted qualification** (proven in E2E). |
| Prep-progress observational / localStorage projectionVersion | CP 2.6 | Prior accepted qualification; unchanged. |
| BLOCKED-M07 still true | Governance / 2.7B | **By design** in 2.7A — not a defect. |

No CP 2.1–2.6 product defects discovered that require routing back for repair. E2E fixture initially used a direct platform publish for continuation that desynced M06 sequence allocation; **corrected in the 2.7A test only** (authorised harness fix).

---

## R. Working-tree separation (CP 2.1–2.7A vs leftovers)

### CP 2.1–2.6 (prior; still present)
Platform contract/registry/hash/validation + tests; M06 publisher/outbox/migrate-v3 + tests; M07 discovery/intake/replay/lifecycle/migrate-v3–v5 + CP23–26 tests; evidence docs CP 2.1–2.6.

### CP 2.7A (this checkpoint)
Three CP27 test files + traceability doc + this evidence doc.

### Unrelated / regression-touched leftovers (not cleaned)
- Modified audit/performance JSON and QA markdowns from suite runs (`wave4-m05-performance-evidence.json`, `wave5-m06-*`, `PLATFORM_INTEGRATION_QA.md`, etc.)
- `PLATFORM_INTEGRATION_QA.md.bak`
- Broader Batch 2 working tree from CP 2.1–2.6 remains dirty by owner instruction

**Working tree was not cleaned.**

---

## S. Exact current BLOCKED-M07 location and proposed minimal 2.7B change

### Current (unchanged in 2.7A)

1. **`src/modules/m07-staff-pay/adapters/m06-timesheet-read.ts`** — `getM07TimesheetIntakeBlockerStatus()` returns `blocked: true`, `workflowEvidenceCode: "BLOCKED-M07"`.
2. **`src/modules/m06-time-attendance/adapters/m07-timesheet-bridge.ts`** — `acknowledgeApprovedTimesheetIntake()` returns the same blocker shape.
3. **Consumers:** intake / replay / lifecycle result fields that currently hardcode or mirror `blockedM07: true` must **follow the helper** after clearance (narrow type/literal updates only — no semantic change to intake/replay/lifecycle rules).

### Proposed minimal Checkpoint 2.7B (NOT implemented)

1. Flip `getM07TimesheetIntakeBlockerStatus` to cleared readiness (e.g. `blocked: false` with an explicit cleared evidence code) **only after owner authorises 2.7B**.
2. Flip `acknowledgeApprovedTimesheetIntake` to the matching cleared contract (or delegate to the M07 helper) so M06 and M07 cannot disagree.
3. Replace hardcoded `blockedM07: true` / `"BLOCKED-M07"` literals in M07 intake/replay/lifecycle return assembly with values derived from the helper.
4. Narrow verification: re-run E2E + CP2.3–2.6 blocker assertions updated to expect cleared status; confirm no registry/M06 scrape regression.

**Do not pre-implement, stage, or simulate this flip in 2.7A.**

---

## T. Final recommendation

# RECOMMENDED FOR OWNER-AUTHORISED CLEARANCE

Conditions the owner should explicitly accept before authorising **Checkpoint 2.7B**:

1. Traceability matrix (`WAVE6_BATCH2_REQUIREMENT_TRACEABILITY.md`) — no material orphans.
2. E2E **2 / 0**, migration **6 / 0**, architecture **7 / 0**.
3. CP 2.3–2.6 and module regressions with **no new functional failures**.
4. Qualifications Q-M05-PERF and Q-M06-PERF (timing only; **not declared fixed**).
5. Proposed blocker locations and minimal 2.7B change in §S.

Passing tests alone do **not** constitute owner sign-off. BLOCKED-M07 remains unresolved until a later explicit 2.7B instruction.

---

## U. Confirmations

| Confirmation | Status |
|---|---|
| BLOCKED-M07 remains unchanged | **Yes** |
| No production behaviour modified in 2.7A | **Yes** |
| No immutable snapshot overwritten | **Yes** (tests only) |
| No automatic supersession added | **Yes** |
| No registry mutation or M06 internal access from M07 | **Yes** (static + behavioural) |
| No payment, calculation approval, export generation, or accounting reconciliation implemented or inferred | **Yes** |
| M05 demand-based rostering not implemented | **Yes** |
| Premium Clinical Enterprise redesign did not begin | **Yes** |
| No commit or push | **Yes** |
| Working tree not cleaned | **Yes** |
| Checkpoint 2.7B not begun | **Yes** |

---

**STOP.** Awaiting owner review. Do not clear BLOCKED-M07. Do not begin Checkpoint 2.7B until separately authorised.

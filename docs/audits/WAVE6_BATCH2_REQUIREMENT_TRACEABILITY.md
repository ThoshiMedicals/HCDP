# WAVE 6 / M07 Batch 2 — Requirement → Test Traceability (Checkpoint 2.7A)

**Purpose:** Consolidated mapping of authorised CP 2.1–2.6 requirements to owning implementation, exact tests, evidence, and status.
**Rule:** A test-file name or total count alone is not sufficient; each row names the case or labelled assertion group.
**Status vocabulary:** `proven` | `qualified` | `not proven` | `out of scope`.

**Checkpoint 2.7B update:** Global blocker row `R-BLK-01` is now **proven cleared** (`CLEARED-M07-BATCH2`). See `WAVE6_BATCH2_CHECKPOINT_2_7B_CLEARANCE_EVIDENCE.md`.

---

## Orphans, static-only, qualifications, deferred

| Class | Finding |
|---|---|
| Orphan requirements (no test) | **None material** for authorised Batch 2 CP 2.1–2.6 scope. |
| Tests with no mapped requirement | Batch 1 M07 shell/smoke and unrelated module suites are **out of scope** for Batch 2 clearance (still executed as regression). |
| Proven only by static check | CP2.3 legacy-scrape absence; CP2.7A architecture suite (no `pulse.m06`, single intake/hash, prohibited fields, no M5/PCE). Behavioural counterparts exist for discovery/intake/replay/lifecycle. |
| Accepted architectural qualifications | Global `eventSequence` with **tenant-filtered** replay (cross-tenant holes ≠ tenant gaps). Prep-progress is observational; `projectionVersion` is best-effort localStorage. |
| Deferred beyond Batch 2 | Payment, calculation approval as payroll truth, export generation, accounting reconciliation, Module 5 demand rostering, Premium Clinical Enterprise redesign, BLOCKED-M07 flip (**Checkpoint 2.7B only**). |

---

## Matrix

| ID | Source | Requirement | Production | Test file | Exact case / group | Evidence | Result | Status |
|---|---|---|---|---|---|---|---|---|
| R-2.1-01 | CP 2.1 | Contract requires org/LE separation, versions, event identity | `published-timesheet-contract.ts`, validation | `published-timesheet-registry.test.ts` | requires record identity, org/LE… | `WAVE6_BATCH2_CHECKPOINT_2_1_EVIDENCE.md` | pass | proven |
| R-2.1-02 | CP 2.1 | Supported contract version; reject unsupported | validation + registry | same | accepts supported… rejects unsupported | CP 2.1 | pass | proven |
| R-2.1-03 | CP 2.1 | Reject prohibited banking/TFN/super fields | validation | same | rejects prohibited banking/TFN/super fields | CP 2.1 | pass | proven |
| R-2.1-04 | CP 2.1 | Canonical payroll content hash; material change alters hash | `published-timesheet-hash.ts` | same | produces identical hashes…; changes hash on material… | CP 2.1 | pass | proven |
| R-2.1-05 | CP 2.1 | Hash excludes approval lifecycle metadata | hash boundary | same | does not include approval lifecycle metadata… | CP 2.1 | pass | proven |
| R-2.1-06 | CP 2.1 | Append-only versions; no overwrite; exact history | `published-timesheet-registry.ts` | same | appends versions without overwrite… | CP 2.1 | pass | proven |
| R-2.1-07 | CP 2.1 | Tenant/LE isolation on registry lookups | registry | same | enforces tenant/legal-entity isolation… | CP 2.1 | pass | proven |
| R-2.1-08 | CP 2.1 | Idempotent publish retry; hash/event conflicts fail closed | registry | same | identical retry; same version different hash; reused eventId | CP 2.1 | pass | proven |
| R-2.1-09 | CP 2.1 | Lifecycle-only revoke without content overwrite | registry | same | lifecycle-only revoke… | CP 2.1 | pass | proven |
| R-2.1-10 | CP 2.1 | Ordered event replay API; migration/recovery | registry | same | replays events…; migrates…; recovers current index… | CP 2.1 | pass | proven |
| R-2.2-01 | CP 2.2 | M06 approve → outbox → platform publish path | `published-timesheet-outbox.ts`, publisher adapter | `m06-published-timesheet.test.ts` | eligibility / mapping / grant groups | `WAVE6_BATCH2_CHECKPOINT_2_2_EVIDENCE.md` | pass | proven |
| R-2.2-02 | CP 2.2 | Independent organisationId and legalEntityId mapping | publisher mapping | same | maps required fields with independent org/LE | CP 2.2 | pass | proven |
| R-2.2-03 | CP 2.2 | sourceVersion / approvalRevision / eventSequence identity | outbox planning | same | revision / lifecycle cases | CP 2.2 | pass | proven |
| R-2.2-04 | CP 2.2 | Reopen → revoked; restore path; no pulse.m07 write | timesheet-service + outbox | same | approval-only reopen/revoke…; granted/revoke/restore… | CP 2.2 | pass | proven |
| R-2.2-05 | CP 2.2 | Failed publication durable; exact retry identity | outbox | same | failure/retry cases | CP 2.2 | pass | proven |
| R-2.2-06 | CP 2.2 | BLOCKED-M07 unresolved at M06 bridge | `m07-timesheet-bridge.ts` | `m06-adapters` / published-timesheet | no pulse.m07; BLOCKED-M07 unresolved | CP 2.2 | pass | proven |
| R-2.3-01 | CP 2.3 | No M07 `pulse.m06` scrape / M06 internal imports | M07 adapters/services | `m07-boundary-cp23.test.ts` | A — Legacy removal / static enforcement | `WAVE6_BATCH2_CHECKPOINT_2_3_EVIDENCE.md` | pass | proven |
| R-2.3-02 | CP 2.3 | Legacy M06 keys do not feed discovery | discovery adapter | same | writing legacy M06 timesheet keys… | CP 2.3 | pass | proven |
| R-2.3-03 | CP 2.3 | Empty / corrupt / unsupported → controlled empty or unavailable | `m06-timesheet-read.ts` | same | B — Controlled behaviour | CP 2.3 | pass | proven |
| R-2.3-04 | CP 2.3 | Discover publications without implying intake | discovery | same | discovers… without implying intake | CP 2.3 | pass | proven |
| R-2.3-05 | CP 2.3 | Cross-org / cross-LE / guessed ids fail closed | discovery | same | C — Tenant isolation | CP 2.3 | pass | proven |
| R-2.3-06 | CP 2.3 | Preserve Batch 1 keys; BLOCKED-M07 asserted | blocker helper | same | D — Preservation / blocker | CP 2.3 | pass | proven |
| R-2.4-01 | CP 2.4 | Eligible approved → immutable snapshot | `published-timesheet-intake.ts` | `m07-intake-cp24.test.ts` | eligible approved publication creates a snapshot | `WAVE6_BATCH2_CHECKPOINT_2_4_EVIDENCE.md` | pass | proven |
| R-2.4-02 | CP 2.4 | Revoked not intaken; incomplete/clinic mismatch reject | intake | same | revoked…; rejects incomplete scope… | CP 2.4 | pass | proven |
| R-2.4-03 | CP 2.4 | Preserve structured inputs + platform contentHash; no payroll fields | snapshots | same | B — Snapshot fidelity | CP 2.4 | pass | proven |
| R-2.4-04 | CP 2.4 | Exact retry / same version+hash idempotent; hash conflict hard | intake | same | C — Identity and idempotency | CP 2.4 | pass | proven |
| R-2.4-05 | CP 2.4 | Newer sourceVersion → new snapshot; older preserved | intake | same | newer sourceVersion creates a second snapshot… | CP 2.4 | pass | proven |
| R-2.4-06 | CP 2.4 | Cross-org/LE deny; guessed id fail closed | intake | same | D — Isolation | CP 2.4 | pass | proven |
| R-2.4-07 | CP 2.4 | Index rebuild; partial migration; Batch1 preserved | migrate-v3 + intake | same | E — Recovery | CP 2.4 | pass | proven |
| R-2.4-08 | CP 2.4 | No M06 scrape; no registry mutation; BLOCKED-M07 | intake module | same | F — Boundaries | CP 2.4 | pass | proven |
| R-2.5-01 | CP 2.5 | Ordered replay; moreAvailable; continuation | `published-timesheet-replay.ts` | `m07-replay-cp25.test.ts` | processes events in authoritative sequence… | `WAVE6_BATCH2_CHECKPOINT_2_5_EVIDENCE.md` | pass | proven |
| R-2.5-02 | CP 2.5 | Duplicate delivery idempotent | replay | same | duplicate delivery is idempotent… | CP 2.5 | pass | proven |
| R-2.5-03 | CP 2.5 | Gaps / non-monotonic stop; no unsafe cursor advance | replay | same | sequence gaps stop advancement… | CP 2.5 | pass | proven |
| R-2.5-04 | CP 2.5 | Conflicting event identity detected | replay | same | conflicting reuse of an event identity… | CP 2.5 | pass | proven |
| R-2.5-05 | CP 2.5 | Interruption before cursor advance resumes safely | replay | same | interruption before checkpoint advancement… | CP 2.5 | pass | proven |
| R-2.5-06 | CP 2.5 | Corrupt cursor / unavailable registry fail closed | replay | same | corrupt cursor data fails closed… | CP 2.5 | pass | proven |
| R-2.5-07 | CP 2.5 | Org/LE isolation; independent cursors | replay checkpoints | same | C — Isolation | CP 2.5 | pass | proven |
| R-2.5-08 | CP 2.5 | Global sequence + tenant filter (holes ≠ gaps) | platform replay + M07 | `m07-batch2-final-gate-cp27.test.ts` | global eventSequence tenant-filter… | CP 2.7A | pass | proven (qualified arch) |
| R-2.5-09 | CP 2.5 | No pulse.m06; uses CP2.4 intake; no registry mutation | replay | `m07-replay-cp25.test.ts` | E — Architectural boundaries | CP 2.5 | pass | proven |
| R-2.6-01 | CP 2.6 | Material content → new snapshot, pending-review, no auto-supersession | lifecycle + replay hook | `m07-lifecycle-cp26.test.ts` | material content creates new snapshot… | `WAVE6_BATCH2_CHECKPOINT_2_6_EVIDENCE.md` | pass | proven |
| R-2.6-02 | CP 2.6 | Same-hash lineage; no snapshot rewrite on revoke | lifecycle | same | lifecycle-only same-hash… | CP 2.6 | pass | proven |
| R-2.6-03 | CP 2.6 | Holds on revoke/withdraw/invalidate; block ordinary use | lifecycle | same | B — Holds and eligibility | CP 2.6 | pass | proven |
| R-2.6-04 | CP 2.6 | Restore alone does not clear; authorised ack clears; stale fails | lifecycle | same | C — Restore and authorised decisions | CP 2.6 | pass | proven |
| R-2.6-05 | CP 2.6 | Authorised supersession; deny cross-timesheet; prior preserved | lifecycle | same | D — Supersession | CP 2.6 | pass | proven |
| R-2.6-06 | CP 2.6 | Prep-progress gates; no payment inference | lifecycle | same | E — Preparation progress | CP 2.6 | pass | proven |
| R-2.6-07 | CP 2.6 | Isolation, permissions, audit | lifecycle | same | F — Isolation, permissions and audit | CP 2.6 | pass | proven |
| R-2.6-08 | CP 2.6 | Architecture + BLOCKED-M07 unresolved | lifecycle | same | G — Architecture and blocker | CP 2.6 | pass | proven |
| R-2.7A-01 | CP 2.7A | E2E compose M06→registry→replay→intake→lifecycle | production services only | `m07-batch2-final-gate-cp27.test.ts` | E2E: publish→replay→… | CP 2.7A evidence | pass | proven |
| R-2.7A-02 | CP 2.7A | Migration empty/v1–v4→v5; idempotent; interrupted resume | migrate-v1…v5 | `m07-migration-cp27.test.ts` | all six cases | CP 2.7A | pass | proven |
| R-2.7A-03 | CP 2.7A | Static architecture / prohibited fields / no M5/PCE | production trees | `m07-architecture-cp27.test.ts` | all seven cases | CP 2.7A | pass | proven |
| R-PAY-01 | Batch 2 exclusion | Payment / calc approval / export / reconciliation | — | — | — | — | — | out of scope |
| R-M5-01 | Batch 2 exclusion | Module 5 demand-based rostering | — | static prohibition only | architecture CP27 | CP 2.7A | pass (absence) | out of scope |
| R-PCE-01 | Batch 2 exclusion | Premium Clinical Enterprise redesign | — | static prohibition only | architecture CP27 | CP 2.7A | pass (absence) | out of scope |
| R-BLK-01 | Governance | BLOCKED-M07 clearance | helpers (cleared CP 2.7B) | `m07-blocker-clearance-cp27b.test.ts` + updated CP suites | CP 2.7B evidence | cleared | proven |

### Performance qualifications (not M07 Batch 2 functional blockers — owner decides)

| ID | Source | Note | Status |
|---|---|---|---|
| Q-M05-PERF | Prior CP evidence + CP 2.7A first-run | M05 performance timing failures only | qualified |
| Q-M06-PERF | Prior CP evidence + CP 2.7A first-run | M06 `perf.exception` timing failure only | qualified |

---

## Coverage statement

All authorised CP 2.1–2.6 functional requirements in this matrix are **proven** or **qualified** (architecture) or **out of scope**. No material orphan requirement remains. BLOCKED-M07 clearance is intentionally **not proven** in 2.7A.

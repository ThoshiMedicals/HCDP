# Phase 1 — P1A · P1B · P1C Planning Packs

**Planning only — no implementation authorised or performed.**

| Pin | Value |
| --- | --- |
| Planning branch | `cursor/p1-scope-readiness-plan` |
| Starting tip (unmodified application) | `9142ec30b3b2efea1e959ad85ce1406562cd5faa` (`cursor/baseline-quality-remediation`) |
| P0 programme-reset tip (preserved) | `b0c4c4d20de1cce7adac5d691c506122e30610a2` (`cursor/prototype-parity-programme-reset`) |
| M25 parking branch | `cursor/m25-future-planning` (do not implement) |

## Workstream split

| Workstream | Meaning | Stamp | Location |
| --- | --- | --- | --- |
| **P1B** | Prototype-parity gap inventory (83 gaps) + 8 proposed batches | `P1 — PLANNED, NOT AUTHORISED` | Files in this folder (below) |
| **P1A** | Master product-definition, design and delivery-readiness completeness | `P1A — PLANNED, NOT AUTHORISED` | [`p1a/`](./p1a/README.md) |
| **P1C** | Development-repository, architecture and production-readiness audit | `P1C — PLANNED, NOT AUTHORISED` | [`p1c/`](./p1c/README.md) |

None of these workstreams authorises implementation.

Cross-links:

- P1A ↔ P1B: [`p1a/P1A_12_P1B_RECONCILIATION.md`](./p1a/P1A_12_P1B_RECONCILIATION.md)
- P1C ↔ P1A/P1B: [`p1c/P1C_10_RECONCILIATION_P1A_P1B.md`](./p1c/P1C_10_RECONCILIATION_P1A_P1B.md)

## Owner decisions (planning)

Owner briefing: [`P1_OWNER_DECISION_BRIEFING.md`](./P1_OWNER_DECISION_BRIEFING.md) · Register: [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md).

**Closed 2026-08-11 (planning only):** OWN-P1-001 (accepted P0 `b0c4c4d20de1cce7adac5d691c506122e30610a2`; `OWN-NO-P1-YET` cleared), OWN-P1-002 (SHARED-first), OWN-P1-003 (named **P1-B1**).

**Still required before coding:** Express **P1-B1** implementation authorisation (naming ≠ auth).

**Open:** OWN-P1-004…014 (as registered); **OWN-P1-016** (ARCH-01 / DATA-01 localStorage vs SQL). 

## P1B pack index (preserved — 14 files)

| # | Document | Path |
| ---: | --- | --- |
| 1 | Executive summary | [P1_EXECUTIVE_SUMMARY.md](./P1_EXECUTIVE_SUMMARY.md) |
| 2 | Authoritative-source register | [P1_AUTHORITATIVE_SOURCE_REGISTER.md](./P1_AUTHORITATIVE_SOURCE_REGISTER.md) |
| 3 | Prototype-parity gap register | [P1_PROTOTYPE_PARITY_GAP_REGISTER.md](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md) |
| 4 | Module-by-module parity matrix | [P1_MODULE_PARITY_MATRIX.md](./P1_MODULE_PARITY_MATRIX.md) |
| 5 | Proposed execution batches | [P1_EXECUTION_BATCHES.md](./P1_EXECUTION_BATCHES.md) |
| 6 | Dependency and sequencing | [P1_DEPENDENCY_AND_SEQUENCING_PLAN.md](./P1_DEPENDENCY_AND_SEQUENCING_PLAN.md) |
| 7 | Risk and assumption register | [P1_RISK_AND_ASSUMPTION_REGISTER.md](./P1_RISK_AND_ASSUMPTION_REGISTER.md) |
| 8 | Owner-decision register | [P1_OWNER_DECISION_REGISTER.md](./P1_OWNER_DECISION_REGISTER.md) |
| 9 | Test and acceptance-evidence plan | [P1_TEST_AND_ACCEPTANCE_EVIDENCE_PLAN.md](./P1_TEST_AND_ACCEPTANCE_EVIDENCE_PLAN.md) |
| 10 | Scope exclusions | [P1_SCOPE_EXCLUSIONS.md](./P1_SCOPE_EXCLUSIONS.md) |
| 11 | Recommended first batch | [P1_RECOMMENDED_FIRST_BATCH.md](./P1_RECOMMENDED_FIRST_BATCH.md) |
| 12 | Gap → source → acceptance traceability | [P1_GAP_TRACEABILITY.md](./P1_GAP_TRACEABILITY.md) |
| — | Baseline gate evidence | [P1_BASELINE_GATE_EVIDENCE.md](./P1_BASELINE_GATE_EVIDENCE.md) |
| — | This index | [README.md](./README.md) |

## P1A pack

See [`p1a/README.md`](./p1a/README.md) — master registers, definition gaps, privacy/security/NFR baselines, 14-phase roadmap.

## P1C pack

See [`p1c/README.md`](./p1c/README.md) — repository inventory, 30-item missing-file audit, conflicts (no deletes), module spec coverage, architecture/API/data readiness, privacy/security/a11y, delivery/supply-chain, 13-stage closure plan, production scorecard (~1/5).

## Relationship to existing P0 pack

- Parent control pack: [`../README.md`](../README.md)
- Existing Programme Wave P1 prompt (SHARED shell only): [`../prompts/p1.md`](../prompts/p1.md)
- Phase 0 acceptance record: [`../phase0/PHASE0_BASELINE_ACCEPTANCE_RECORD.md`](../phase0/PHASE0_BASELINE_ACCEPTANCE_RECORD.md)
- Stop checkpoint (P1 authorised = **No**): [`../FIRST_RUN_STOP_CHECKPOINT.md`](../FIRST_RUN_STOP_CHECKPOINT.md)

## Do not

- Implement application behaviour without a named owner-authorised batch
- Begin P1-B1 from planning packs alone
- Delete/archive conflicting historical docs during planning
- Implement M25, PPA, payment execution, patient/clinical duplication, DB/deps changes
- Claim legal compliance or security/accessibility certification from documentation review
- Commit / push / merge / open a PR unless the owner expressly asks


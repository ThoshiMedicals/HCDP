# P1A — Master Product Definition, Design and Delivery-Readiness Pack

**Status stamp (every item in this pack):** `P1A — PLANNED, NOT AUTHORISED`

| Pin | Value |
| --- | --- |
| Planning branch | `cursor/p1-scope-readiness-plan` |
| Application baseline SHA | `9142ec30b3b2efea1e959ad85ce1406562cd5faa` |
| Preserved P0 programme-reset tip | `b0c4c4d20de1cce7adac5d691c506122e30610a2` |
| Decision A PNG tip | `66e6e6488b27b9098dadd8962473fedea5053614` |
| Sibling workstream | **P1B** = existing prototype-parity readiness pack (parent `../` files; retained) |
| Pack claim | Planning / readiness only — **no implementation authorised or performed** |

## Workstream split

| Workstream | Meaning | Stamp |
| --- | --- | --- |
| **P1A** | Project-definition and delivery-readiness completeness (this folder) | `P1A — PLANNED, NOT AUTHORISED` |
| **P1B** | Prototype-parity gap inventory + 8 proposed batches (parent `../` files) | `P1 — PLANNED, NOT AUTHORISED` |

Neither workstream authorises implementation. Cross-links: [P1B reconciliation](./P1A_12_P1B_RECONCILIATION.md) · [parent phase1 index](../README.md).

## Pack index (28 output types consolidated)

| # | Required output | Document |
| ---: | --- | --- |
| 1 | Executive readiness summary | [P1A_00_EXECUTIVE_READINESS_SUMMARY.md](./P1A_00_EXECUTIVE_READINESS_SUMMARY.md) |
| 2 | Existing vs required inventory | [P1A_01_EXISTING_VS_REQUIRED_INVENTORY.md](./P1A_01_EXISTING_VS_REQUIRED_INVENTORY.md) |
| 3 | Authoritative-source hierarchy | [P1A_02_AUTHORITATIVE_SOURCE_HIERARCHY.md](./P1A_02_AUTHORITATIVE_SOURCE_HIERARCHY.md) |
| 4 | Product scope / objectives / exclusions | [P1A_03_PRODUCT_SCOPE_AND_EXCLUSIONS.md](./P1A_03_PRODUCT_SCOPE_AND_EXCLUSIONS.md) |
| 5 | Master requirement trace | [P1A_04_MASTER_REQUIREMENT_TRACE.md](./P1A_04_MASTER_REQUIREMENT_TRACE.md) |
| 6–15 | Master registers 1–10 | [P1A_05_MASTER_REGISTERS_01_TO_10.md](./P1A_05_MASTER_REGISTERS_01_TO_10.md) |
| 16–25 | Master registers 11–20 | [P1A_06_MASTER_REGISTERS_11_TO_20.md](./P1A_06_MASTER_REGISTERS_11_TO_20.md) |
| 26 | Definition-completeness audit | [P1A_07_DEFINITION_COMPLETENESS_AUDIT.md](./P1A_07_DEFINITION_COMPLETENESS_AUDIT.md) |
| 27 | Workflow specs + data architecture | [P1A_08_WORKFLOW_SPECS_AND_DATA_ARCHITECTURE.md](./P1A_08_WORKFLOW_SPECS_AND_DATA_ARCHITECTURE.md) |
| 28 | Permissions + NFR + privacy/security baseline | [P1A_09_PERMISSIONS_NFR_PRIVACY_SECURITY.md](./P1A_09_PERMISSIONS_NFR_PRIVACY_SECURITY.md) |
| — | Design-system / UX upgrade / build-ready design | [P1A_10_DESIGN_SYSTEM_UX_AND_BUILD_READY.md](./P1A_10_DESIGN_SYSTEM_UX_AND_BUILD_READY.md) |
| — | Commercial / AI / test-data / delivery control | [P1A_11_COMMERCIAL_AI_TESTDATA_DELIVERY.md](./P1A_11_COMMERCIAL_AI_TESTDATA_DELIVERY.md) |
| — | P1B 83-gap + 8-batch reconciliation | [P1A_12_P1B_RECONCILIATION.md](./P1A_12_P1B_RECONCILIATION.md) |
| — | Master roadmap (14 phases) | [P1A_13_MASTER_ROADMAP_14_PHASES.md](./P1A_13_MASTER_ROADMAP_14_PHASES.md) |
| — | Validation, broken links, next owner decision | [P1A_14_VALIDATION_BROKEN_LINKS_AND_NEXT_DECISION.md](./P1A_14_VALIDATION_BROKEN_LINKS_AND_NEXT_DECISION.md) |

## Decision hold (do not invent approval)

Pending pack review — all remain **Open**:

1. Acceptance of P1 interpretation of P0  
2. SHARED-only vs full P1 B1–B8 breadth  
3. Confirmation of P1-B1 as first implementation batch  
4. Authorisation of any code development  

See [../P1_OWNER_DECISION_REGISTER.md](../P1_OWNER_DECISION_REGISTER.md).

## Do not

- Implement application behaviour from this pack  
- Approve P1-B1 or any batch by virtue of this documentation  
- Treat unlock/reopen as PPA; process payment; implement M25; duplicate clinical/patient SoR  
- Claim legal compliance or security certification from documentation review  
- Commit / push / PR / merge unless the owner expressly asks  

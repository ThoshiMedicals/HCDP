# P1A Master Requirement Trace

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Trace chain (required)

`Requirement → source → module → screen → role → workflow/business rule → data → permission → integration → design state → acceptance test → implementation evidence → owner acceptance`

## Authoritative bulk trace

| Artefact | Rows / count | Role |
| --- | ---: | --- |
| `MASTER_BRD_PROTOTYPE_PRODUCTION_TRACEABILITY.*` | 1982 | Primary cross-source trace |
| `CANONICAL_SCREEN_REGISTER.*` | 194 | Screens |
| `WORKFLOW_AND_ACTION_REGISTER.*` | 807 | Actions/workflows |
| `CURRENT_IMPLEMENTATION_REAUDIT.*` | 24 modules | Implementation axes |
| P1B `P1_GAP_TRACEABILITY.md` | 83 gaps | Parity gap → source → acceptance |

## Traceability health (reported, not manufactured)

| Link type | Observed status | Evidence |
| --- | --- | --- |
| Requirement → source | Mostly present in master trace; dispositions set | dispositionTotals; unclassifiedCount=0 |
| Source → module | Present via rowsByModule | ACCOUNTING_SUMMARY |
| Module → screen | Canonical 194; variance vs 143 explained | Accepted difference P1-GAP-055 |
| Screen/action → section | **Broken/weak:** unresolved section mappings = **298** | WAR sectionMappingTotals |
| Action → service | **Broken/weak:** atomicNoneNotImplemented = **510** | WAR |
| Action → production control | Only **28** genuine production controls | WAR |
| Design state → Decision A | Incomplete for Programme P1 | P1-GAP-002…010 |
| Acceptance test → evidence | Wave evidence exists for frozen modules; SHARED Decision A P1 incomplete | Wave audits; P1B test plan |
| Implementation evidence → owner acceptance | Wave OA ≠ production | P1-GAP-056 |
| Owner acceptance → production | Explicitly not claimed | GLOBAL axis 5 |

## Broken-link register (trace)

| BL-ID | Broken link | Impact | Related IDs | Closure stage |
| --- | --- | --- | --- | --- |
| BL-001 | 298 unresolved workflow/action section mappings | Weak Work-Step targeting | P1-GAP-014; DEF-GAP-014 | P1B-B3 SHARED subset; bulk P2+ |
| BL-002 | 510 atomic services NONE — NOT IMPLEMENTED | Cannot claim durable behaviour | P1-GAP-077 | P2+ / later rebuilds |
| BL-003 | Placeholder modules M08–M10/M12–M24 landings only | No domain trace to services | P1-GAP-033–048 | P3–P8 |
| BL-004 | M01/M02/M03 servicePaths NONE | Domain NOT-STARTED | P1-GAP-016–018 | P2 |
| BL-005 | Historic parity register contradicts re-audit | Planning mis-score risk | P1-GAP-013; CONF-P1A-003 | P1B-B3 docs hygiene |
| BL-006 | M11 register condition/sections stale | False rebuild pending signal | P1-GAP-011 | P1B-B3 |
| BL-007 | Path alias Development folder vs docs/plans | Doc navigation break | CONF-P1A-004 | Docs pointer fix |
| BL-008 | Prompt P1 vs readiness P1 naming | Scope contradiction | P1-GAP-083 | Owner OWN-P1-002 |
| BL-009 | Evidence JSON rewritten by tests | Evidence integrity | P1-GAP-076 | Process gate every batch |
| BL-010 | Toast-only / inactive controls without backend | False completion risk | P1-GAP-005/030 | P1B-B2 |

## Sample end-to-end traces (illustrative; not complete inventory)

### T-SHARED-SHELL (Programme P1 candidate)

| Step | Value | Status |
| --- | --- | --- |
| Requirement | Decision A SHARED shell / imgctrl-* | Sourced in `prompts/p1.md` |
| Source | SRC-DEC-A, SRC-DESIGN, SRC-PROMPT-P1 | Present |
| Module | SHARED | Present |
| Screen | listed screen_* IDs in p1.md | Present |
| Role | All authenticated (chrome); content gated | Partial |
| Workflow/rule | Appearance persistence only in P1 | Defined for narrow P1 |
| Data | Appearance preference key | Partial |
| Permission | Nav gating / accessClassification | Partial UI |
| Integration | N/A chrome | OK |
| Design state | Incomplete conversion | Gap |
| Acceptance test | Theme/shell/a11y tests planned | Planned |
| Evidence | Not Programme-P1 closed | Missing |
| Owner acceptance | Blocked OWN-NO-P1-YET | Open |

### T-M07-ORDINARY-PREP (frozen)

| Step | Value | Status |
| --- | --- | --- |
| Requirement | Ordinary staff-pay preparation Batches 1–6 | Wave plans + audits |
| Source | SRC-WAVE-FREEZE; WAVE6_BATCH6_* | Present |
| Module | M07 `/staffpay` | Present |
| Screen/actions | StaffPayWorkspace + WAR | Present w/ History planned honesty gap |
| Role/permission | WAVE6_M07_PERMISSIONS_MATRIX + m07-authz tests | Present (qualified) |
| Data/integration | Prep export package; no payment | Boundary OK |
| Design state | Final-design apply pending | P1-GAP-025 |
| Owner acceptance | Accepted w/ qualifications; **not** production | P1-GAP-056 |

### T-PPA (explicitly not authorised)

Planning exists (`docs/plans/WAVE6_M07_PPA_*`). Implementation evidence and owner acceptance for product PPA: **absent**. Unlock ≠ PPA.

## Rule

Every actionable requirement in P1A/P1B must have a source ID **or** be marked `UNRESOLVED-PROPOSAL` in the owner-decision register. Every proposed change must name an acceptance method (see P1B gap register + batches).

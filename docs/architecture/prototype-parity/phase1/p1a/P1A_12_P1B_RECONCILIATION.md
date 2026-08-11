# P1A ↔ P1B Reconciliation (83 gaps · 8 batches)

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Preservation statement

All existing P1B artefacts under `docs/architecture/prototype-parity/phase1/` (14 files) are **retained**. P1A adds definition/delivery-readiness completeness; it does **not** replace, discard, simplify, or approve P1B.

## Count reconciliation

| Metric | P1B claimed | P1A verified | Notes |
| --- | ---: | ---: | --- |
| Gap rows | 83 | **83** | `P1-GAP-001`…`083` inclusive |
| Heading lines `### P1-GAP-` | 68 | 68 | Series 033–048 is one heading covering 16 modules |
| Batches | 8 | **8** | P1-B1…P1-B8 |
| Runtime modules | 24 | **24** | M25 absent |

### Transparent series expansion (033–048)

| Gap | Module |
| --- | --- |
| 033 | M08 doctor-pay |
| 034 | M09 bbpip |
| 035 | M10 tasks-actions |
| 036 | M12 compliance-quality |
| 037 | M13 documents-policies |
| 038 | M14 ticket-desk |
| 039 | M15 inventory-assets |
| 040 | M16 incidents-risk |
| 041 | M17 communications |
| 042 | M18 digital-ops |
| 043 | M19 analytics |
| 044 | M20 saas |
| 045 | M21 vendor-console |
| 046 | M22 recruitment |
| 047 | M23 website-studio |
| 048 | M24 financial-forecast |

## Master mapping table (all 83)

| P1B Gap | Master IDs / registers | Batch | Note | Stamp |
| --- | --- | --- | --- | --- |
| P1-GAP-001 | DEF-GAP-001; OWN-P1-001; Reg2 | Entry | P0 gate blocker | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-002 | Reg14; DEF-GAP-013; NFR-A11Y/UX | P1-B1 | Decision A shell | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-003 | Reg14; Reg4 | P1-B1 | Shared primitives | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-004 | Reg14; NFR | P1-B1/B4 | Shell dimensions | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-005 | Reg5; DEF-GAP-009; OWN-P1-004 | P1-B2 | Inactive topbar honesty | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-006 | DEF-GAP-008; OWN-P1-005; Reg8 | P1-B2 | Clinic multi-select | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-007 | Reg5; Reg15 | P1-B2 | Non-op shell cards | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-008 | Reg14; NFR | P1-B4 | System hydrate | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-009 | NFR-A11Y; Reg14 | P1-B4 | Keyboard/focus | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-010 | Reg17; Reg14 | P1-B1/B8 | Screenshot harness | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-011 | Reg4; BL-006 | P1-B3 | M11 register stale | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-012 | Reg4; Reg16; M07 | P1-B3 | M07 history honesty | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-013 | CONF-P1A-003; Reg2 | P1-B3 | Historic register | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-014 | DEF-GAP-014; BL-001; Reg6 | P1-B3/P2 | 298 unresolved mappings | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-015 | Reg4; Reg1 | P1-B3 | Placeholder scoring | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-016 | Reg3; Reg9; P2 | P2 | M01 domain absent | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-017 | Reg3; Reg6; P2 | P2 | M02 domain absent | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-018 | Reg5; Reg8; P2 | P1-B2/P2 | M03 demo vs durable | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-019 | Reg10 | P2 | M01/M02 integrations | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-020 | Reg14 | P1-B5 | M01 design apply | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-021 | Reg14 | P1-B5 | M02 design apply | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-022 | Reg14; Wave freeze | P1-B6 | M04 design apply | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-023 | Reg14; Wave freeze | P1-B6 | M05 design apply | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-024 | Reg14; Wave freeze | P1-B6 | M06 design apply | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-025 | Reg14; Reg1 exclusions | P1-B6 | M07 design apply | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-026 | Reg14; Reg4 | P1-B6 | M11 design apply | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-027 | Reg15 | P1-B7 | State completeness | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-028 | Reg8; DEF-GAP-002 | P1-B7 | Denied/isolation UI | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-029 | Reg11; Reg17 | P1-B7 | Audit visibility honesty | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-030 | Reg16; Reg5 | P1-B2/B7 | Export/report honesty | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-031 | NFR; Reg14 | P1-B4 | Responsive residual | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-032 | DEF-GAP-009; OWN-P1-008 | P1-B2 | Demo governance | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-033 | Reg4; Future M08 | Later | M08 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-034 | Reg4; Future M09 | Later | M09 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-035 | Reg4; Future M10 | Later | M10 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-036 | Reg4; Future M12 | Later | M12 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-037 | Reg4; Future M13 | Later | M13 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-038 | Reg4; Future M14 | Later | M14 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-039 | Reg4; Future M15 | Later | M15 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-040 | Reg4; Future M16 | Later | M16 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-041 | Reg4; Future M17 | Later | M17 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-042 | Reg4; Future M18 | Later | M18 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-043 | Reg4; Future M19 | Later | M19 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-044 | Reg4; Future M20 | Later | M20 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-045 | Reg4; Future M21 | Later | M21 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-046 | Reg4; Future M22 | Later | M22 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-047 | Reg4; Future M23 | Later | M23 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-048 | Reg4; Future M24 | Later | M24 ModuleLanding-only rebuild | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-049 | Reg14; DEC-BRANDED-THEMES | P1-B1 | Theme discipline | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-050 | Reg14 | P1-B5/B6 | Density/typography | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-051 | Reg14 | P1-B1 | Detail panel width | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-052 | NFR-A11Y | P1-B4 | Reduced motion | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-053 | Reg16 | P1-B7/Later | Print parity | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-054 | Reg1 Accepted difference | N/A | Prototype dual surface | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-055 | Reg4 Accepted difference | N/A | 143 vs 194 screens | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-056 | Reg17; GLOBAL axis5 | All | OA ≠ production | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-057 | Reg1; Reg9 PROHIBITED | Exclude | Patient clinical | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-058 | Reg1; Reg9 PROHIBITED | Exclude | Patient billing | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-059 | Reg1; Reg10 | Exclude | BP duplication | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-060 | Reg1; Reg10 | Exclude | Payment execution | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-061 | Reg1; Reg6 WF-M07-PPA | Exclude/PPA | PPA product | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-062 | Reg1; M25 parked | Exclude | M25 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-063 | Reg1; Reg18 | Exclude | DB/deps/secrets | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-064 | Reg18; Reg20 | Exclude | Prod deploy/PR | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-065 | Reg17; Reg2 | Exclude | Historical P0 rewrite | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-066 | Reg14; Reg5 | P1-B2/B5 | Filter/search semantics | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-067 | Reg14 | P1-B1/B5 | Drill-down patterns | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-068 | Reg15; Reg6 | P1-B5/P2 | Alert chrome vs M02 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-069 | Reg9; Reg3 | Later | Field schema adoption | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-070 | Reg7 | Later | Business-rule engine | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-071 | Reg15; Reg16 | P1-B2 | Seed as live risk | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-072 | Reg14 Accepted difference | P1-B5 | Dash de-crowding | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-073 | Reg15 | P1-B2 | Online toggle demo | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-074 | NFR; CONF-P1A-005 | P1-B4 | Hydration observations | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-075 | Reg18 | P1-B8 | next-dev residual | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-076 | Reg17; BL-009 | P1-B8 | Evidence rewrite process | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-077 | BL-002; Reg5 | Later | 510 services NONE | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-078 | Reg5 Accepted difference | N/A | 28 production controls | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-079 | Reg1; Reg6 | P1-B3 | PPA-1 foundation wording | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-080 | Reg10; P3 | Later | BLOCKED-M10 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-081 | Reg2 L2 freeze | P1-B6 | Wave freeze risk | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-082 | Reg17 | P1-B8 | No self-approval | `P1 — PLANNED, NOT AUTHORISED` |
| P1-GAP-083 | DEF-GAP-001; OWN-P1-002 | Entry | Narrow vs broad P1 | `P1 — PLANNED, NOT AUTHORISED` |

## Batch reassessment

| Batch | Still valid? | Reassessment |
| --- | --- | --- |
| P1-B1 | **Yes — safest first** | Unlocks chrome; matches `prompts/p1.md`; avoids frozen-domain churn |
| P1-B2 | Yes after B1 | Depends on OWN-P1-004/005/008 |
| P1-B3 | Yes; can parallel after B1 entry | Prevents false readiness scoring |
| P1-B4 | Yes after B1 | Needs stable tokens |
| P1-B5 | Yes if broad P1 (OWN-P1-002=B) | Presentation only |
| P1-B6 | Yes if broad P1 | Strict freeze; regression |
| P1-B7 | Yes if broad P1 | After honesty decisions |
| P1-B8 | Yes | Closure only |

### Does P1-B1 remain safest first?

**Yes (recommendation only; not authorised).** Definition-closure required before coding: DEF-GAP-001 (scope), plus B1-relevant DEF-GAP-013 design annotations can proceed in-batch; security/privacy specialist reviews remain **pre-production**, not pre-B1 blockers, except where B1 touches personal data unexpectedly (it should not).

## Definition-closure before coding

| Before coding batch | Minimum definition closures |
| --- | --- |
| Any | OWN-P1-001/002/003; DEF-GAP-001 |
| B2 | DEF-GAP-008/009 |
| B3 | OWN-P1-006/007; CONF-P1A-003 disposition |
| B6 | Freeze rules acknowledged; no domain CR |
| Production | DEF-GAP-002/003/005/006/011/012; specialist reviews |

## Owner decisions timing vs specialist reviews

| Timing | Items |
| --- | --- |
| Before any code | OWN-P1-001…003 (and 002 breadth) |
| Before B2 | OWN-P1-004/005/008 |
| Before B3 | OWN-P1-006/007 |
| Before production | OWN-P1A-002…005; PIA/security/a11y/ops reviews |
| Deferred | OWN-P1-009…014; OWN-P1A-007; PPA; M25 |

## Classification claim check

P1B classification totals (Blocker 2, Major 14, Moderate 22, Minor 10, Accepted difference 7, Future 20, N/A 3, Duplicate/prohibited 5 = **83**) are preserved. P1A does not re-count them into a different total.

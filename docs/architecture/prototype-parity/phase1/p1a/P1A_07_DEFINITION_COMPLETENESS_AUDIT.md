# P1A Definition-Completeness Audit

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Status vocabulary

Complete and approved · Complete but unapproved · Partially defined · Conflicting · Missing · Not applicable · Deferred with justified dependency

**Rule:** Definition gaps (`DEF-GAP-*`) are distinct from implementation defects / P1B parity gaps (`P1-GAP-*`).

## Domain completeness summary

| Domain | Status |
| --- | --- |
| Product scope/exclusions | Complete but unapproved |
| Source hierarchy | Complete but unapproved |
| Functional requirements (bulk) | Partially defined |
| Modules/screens | Partially defined (stale metadata / placeholders) |
| Actions/controls | Partially defined (honesty + unresolved mappings) |
| Workflows/state transitions | Partially defined |
| Business rules | Partially defined |
| Roles/permissions/SoD | Partially defined |
| Data dictionary | Partially defined |
| Integrations/SoR | Partially defined |
| Privacy/retention | Partially defined / Missing policy artefacts |
| Security/threat | Partially defined / Missing consolidated model |
| NFRs (measurable) | Partially defined (proposed herein) |
| Design system | Complete but unapproved for Programme P1 apply |
| UX states | Partially defined |
| Reporting/KPI defs | Partially defined |
| Test/acceptance | Partially defined |
| Env/ops | Partially defined |
| Onboarding/migration | Partially defined |
| Risks/decisions | Partially defined (open decisions) |
| Clinical scope | Not applicable (excluded) |
| PPA product | Deferred with justified dependency (separate auth) |
| M25 | Deferred with justified dependency (parked) |
| Programme P1 vs P1B breadth | Conflicting until OWN-P1-002 |

## Definition gap register

### DEF-GAP-001 — Programme scope interpretation unresolved
| Field | Value |
| --- | --- |
| Modules/screens | Programme / SHARED |
| Missing/conflicting | Narrow `prompts/p1.md` vs P1B B1–B8 |
| Source evidence | P1-GAP-083; CONF-P1A-001 |
| Impact | Cannot safely authorise coding breadth |
| Risk | Scope thrash / wasted build |
| Owner input | OWN-P1-002 |
| Resolution | Owner selects A SHARED-only or B B1–B8 |
| Dependency | OWN-P1-001 |
| Blocks | design/impl/test for non-SHARED items if A |
| Acceptance | Written owner decision |
| Related P1 gaps | 001, 083 |
| Closure stage | Pre-implementation entry |

### DEF-GAP-002 — Platform-wide SoD / permission matrix incomplete
| Field | Value |
| --- | --- |
| Modules | All; stronger for M07 |
| Missing | Unified SoD across M01–M24 + SHARED |
| Evidence | M07 matrix exists; others classification-level |
| Impact | Inconsistent authz |
| Risk | Privilege gaps |
| Owner input | Approve matrix ownership |
| Resolution | Extend Reg 8; service-layer tests mandatory |
| Blocks | prod |
| Related | P1-GAP-028 |
| Closure stage | Before production; partial before P1-B7 |

### DEF-GAP-003 — Data dictionary sensitivity/retention incomplete
| Field | Value |
| --- | --- |
| Missing | Per-entity retention, lawful basis, deletion |
| Impact | Privacy readiness |
| Risk | APP11/retention failure |
| Owner input | OWN-P1A-005 + counsel |
| Blocks | prod |
| Related | DEF-GAP-011 |
| Closure stage | Pre-prod; synthetic rules earlier |

### DEF-GAP-004 — Measurable NFR set unapproved
| Field | Value |
| --- | --- |
| Missing | Owner acceptance of NFR table |
| Impact | Ambiguous exit gates |
| Resolution | Approve Reg 13 metrics |
| Blocks | prod claims; soft-blocks P1-B4/B8 |
| Related | P1-GAP-009/031/052 |

### DEF-GAP-005 — Privacy policy / PIA / NDB runbooks absent as approved artefacts
| Field | Value |
| --- | --- |
| Status | Missing |
| Owner input | OWN-P1A-005 |
| Blocks | prod |
| Note | Docs review ≠ compliance |

### DEF-GAP-006 — Security target maturity unapproved
| Field | Value |
| --- | --- |
| Conflicting/missing | E8 ML and ASVS level not owner-confirmed |
| Recommendation | E8 ML2; ASVS L2 |
| Owner input | OWN-P1A-002/003 |
| Blocks | prod security claims |

### DEF-GAP-007 — KPI/report formulas incomplete outside frozen modules
| Field | Value |
| --- | --- |
| Modules | M01 demo KPIs; placeholder modules |
| Related | P1-GAP-016/053/071 |
| Blocks | treating demo KPIs as truth |
| Closure | P2+ for durable; P1 honesty labels |

### DEF-GAP-008 — Clinic multi-select shell semantics unresolved
| Field | Value |
| --- | --- |
| Related | P1-GAP-006; OWN-P1-005 |
| Blocks | B2 design consistency |
| Closure | Owner disposition |

### DEF-GAP-009 — Inactive control disposition unresolved
| Field | Value |
| --- | --- |
| Related | P1-GAP-005/032; OWN-P1-004/008 |
| Blocks | B2 |
| Closure | Hide vs truthful non-op vs flag |

### DEF-GAP-010 — Commercial tenancy model undefined for SaaS path
| Field | Value |
| --- | --- |
| Module | M20 |
| Related | OWN-P1A-007 |
| Blocks | P8 commercial build |
| Closure | Deferred with dependency on P8 |

### DEF-GAP-011 — Consent/retention/deletion policy artefacts missing
| Field | Value |
| --- | --- |
| Blocks | prod |
| Related | Register 11 |

### DEF-GAP-012 — Consolidated threat model missing
| Field | Value |
| --- | --- |
| Blocks | prod |
| Related | Register 12 |

### DEF-GAP-013 — Build-ready design annotation coverage incomplete
| Field | Value |
| --- | --- |
| Missing | Per-screen a11y annotations / component states for all P1 surfaces |
| Related | P1-GAP-002/003/010 |
| Blocks | claiming Decision A complete |
| Closure | P1-B1/B4/B8 |

### DEF-GAP-014 — Section mapping unresolved bulk (298)
| Field | Value |
| --- | --- |
| Related | P1-GAP-014; BL-001 |
| Blocks | accurate Work-Steps |
| Closure | SHARED subset in B3; bulk P2+ |

## Counts

| Status | Approx. domains |
| --- | ---: |
| Complete but unapproved | 3 |
| Partially defined | 14 |
| Conflicting | 1 |
| Missing | 2 |
| Deferred | 2 |
| Not applicable | 1 |

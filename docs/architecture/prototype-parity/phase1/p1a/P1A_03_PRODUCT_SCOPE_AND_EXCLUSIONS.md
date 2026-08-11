# P1A Product Scope, Objectives and Exclusions (Register 1)

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Product identity

| Field | Definition |
| --- | --- |
| Product | Doctors Pulse / HCDP Connected Workforce — non-clinical medical-centre **operations** platform |
| Primary users | Owners/directors, practice/ops managers, workforce/roster/payroll-prep operators, auditors |
| In-boundary purpose | Coordinate workforce, rostering, time & attendance, staff-pay **preparation**, training, and related operational modules across clinics |
| Out-of-boundary purpose | Clinical care delivery systems; patient SoR; payment execution |

## Objectives (planned product outcomes — unapproved as delivery commitment)

1. Provide a trusted multi-clinic operational workbench with honest capability labelling.  
2. Achieve Decision A / design-contract shell parity for SHARED chrome before domain expansion.  
3. Preserve frozen accepted domain behaviour (M04–M07/M11) while closing verified presentation/hygiene gaps.  
4. Maintain strict SoR boundaries: no patient/clinical duplication; no payment execution; PPA only under separate auth.  
5. Build definition completeness (registers, permissions, privacy/security/NFR) to a build-ready level **before** claiming production readiness.

## Inclusions (authorised only when owner names batches)

- M01–M24 runtime modules as registered (`module-register.ts` — **24 modules**)  
- SHARED shell / Decision A foundation (Programme Wave P1 narrow, if authorised)  
- P1B presentation/hygiene batches B1–B8 **if** owner selects broad P1 (OWN-P1-002)  
- Later programme waves P2–P9 per roadmap (separate authorisations)  

## Hard exclusions (never smuggle via “parity”)

| Exclusion | Authority |
| --- | --- |
| Patient records, appointments/arrivals, clinical notes, diagnoses, prescriptions, referrals | OWN-PATIENT-FIREWALL; firewall |
| Patient billing / Medicare claims / clinical invoicing | Firewall |
| Best Practice / clinical-system workflow duplication | Firewall; P1-GAP-059 |
| Payment execution, bank file, STP, super, mark-as-paid, Xero production under M07 | OWN-NO-PAY-EXEC |
| PPA product implementation | OWN-PPA-SEPARATE; unlock ≠ PPA |
| M25 print fleet | Parked branch; not in M01–M24 |
| New modules beyond M01–M24 | Module register |
| Claiming production approval / legal certification from docs | GLOBAL axis 5; this pack |

## Relationship to P1B exclusions

Authoritative P1B detail remains in [`../P1_SCOPE_EXCLUSIONS.md`](../P1_SCOPE_EXCLUSIONS.md). This register **extends** it for product-definition completeness; it does not weaken exclusions.

## Anti-patterns (do not count as done)

Route exists · heading/ModuleLanding exists · demo card · inactive control · prompt file exists · prior wave owner UI acceptance alone.

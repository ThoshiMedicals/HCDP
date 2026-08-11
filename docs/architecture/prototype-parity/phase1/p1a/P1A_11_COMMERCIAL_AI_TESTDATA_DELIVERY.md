# P1A Commercial/Tenancy, AI Governance, Test-Data & Delivery Control

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## A. Commercial / tenancy readiness assessment

| Topic | Current | Readiness | Notes |
| --- | --- | --- | --- |
| Multi-clinic operations | Partial (scope controls; CC multi-clinic) | Partial | OWN-P1-005 |
| Org-as-legal-entity | M07/AUTH planning | Partial | Needed for payroll prep |
| SaaS packaging (M20) | Placeholder shell | Not ready | P8; OWN-P1A-007 |
| Billing for Pulse itself | Not in P1 scope | N/A | Do not confuse with patient billing (excluded) |
| Vendor/enterprise (M21) | Placeholder | Not ready | P8 |
| Contracts/SLAs/support | Absent as pack artefacts | Missing for prod | Pre-prod commercial pack |

**Verdict:** Commercially **not production-ready**. Tenancy model must be owner-confirmed before M20/P8 and before production claims.

---

## B. AI governance

### Findings (inspection)

No authorised product AI feature (LLM copilots, generative clinical/ops assistants, autonomous decisioning) is implemented as an accepted capability in the current M01–M24 runtime programme scope reviewed for this pack. Mentions of “llm”/similar strings in generated JSON are **not** treated as product AI features.

### Rules if AI is later proposed

| Rule | Requirement |
| --- | --- |
| Separate authorisation | Named batch + owner decision (OWN-P1A-008 confirm none / or new decision) |
| No clinical AI SoR | Must not create patient clinical records in Pulse |
| Human-in-the-loop | For any material operational decision |
| APP1 automated decisions | Privacy policy disclosures when obligations apply |
| Eval/safety | Threat + bias + data-leakage review before prod |
| Training data | Synthetic/licensed only; no real patient data |

**Do not invent AI features in P1A/P1B.**

---

## C. Test-data governance

| Rule | Statement |
| --- | --- |
| Synthetic only | Test/demo data must be synthetic or anonymised fiction |
| No real patient data | Ever — including screenshots/exports in evidence |
| No legacy prototype seed migration | Firewall rule |
| Evidence hygiene | Redact PII in audits; prefer hashes/excerpts |
| Reset controls | Demo reset must be labelled; gated per OWN-P1-008 |
| Production | Production data handling requires privacy/security runbooks (DEF-GAP-005) |

---

## D. Delivery control — gates, DoR, DoD

### Programme entry gate (before any P1 code)

- [ ] Owner accepts P0 pack / clears OWN-NO-P1-YET (OWN-P1-001)  
- [ ] Owner resolves OWN-P1-002 breadth  
- [ ] Owner names batch (recommend P1-B1) (OWN-P1-003)  
- [ ] Blocking DEF-GAPs for that batch closed or explicitly deferred with owner note  
- [ ] Tip clean; tsc/lint/test/build/validate-registers green  
- [ ] No clinical/PPA/payment/M25 scope in batch  

### Definition of Ready (DoR) — per batch

- Named gap IDs + sources + acceptance methods  
- In/out of scope file areas listed  
- Permissions/isolation impact assessed  
- Design references identified (Decision A regions if UI)  
- Rollback strategy stated  
- Owner batch name recorded  

### Definition of Done (DoD) — per batch

- Automated tests green for named suite  
- Visual QA + Work-Step QA by **separate** agents (no self-approval)  
- Register validator `failures: []`  
- Runtime modules still 24  
- Evidence committed under new `docs/audits/p1/` paths (when impl happens)  
- Test-rewritten historical JSON restored unless expressly authorised  
- Owner accepts tip before next batch  

### Exit gate — Programme P1

- P1-B8 closure evidence + stop checkpoint  
- Explicit non-start of P2 until authorised  

### Specialist reviews before production (separate from P1)

Privacy counsel / PIA · security (E8/ASVS) · accessibility audit · operational readiness · commercial/tenancy — all **after** definition+implementation maturity; not satisfied by this docs pack.

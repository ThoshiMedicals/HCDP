# P1A Master Registers 11–20

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Register 11 — Privacy / consent / retention / deletion / audit

| Topic | Current state | Target (planned) | Gap |
| --- | --- | --- | --- |
| Personal information inventory | Partial (staff/workforce entities; demo seed) | Full ROPA-style inventory | DEF-GAP-011 |
| Consent / notification | Absent as product policy artefact | APP1 privacy policy + collection notices | DEF-GAP-011 |
| Retention / deletion | Not systematically defined | Per-class retention + deletion/de-ID | DEF-GAP-011 |
| Audit | Present in frozen domain waves; uneven UI | Actor/clinic/before-after on mutates | P1-GAP-029 |
| Seed data | Firewall: do not migrate legacy prototype seed | Synthetic only | Test-data gov |
| Clinical data | Prohibited | Remain prohibited | P1-GAP-057–059 |

Detail + official source map: [P1A_09](./P1A_09_PERMISSIONS_NFR_PRIVACY_SECURITY.md).

**Qualification:** Documentation mapping ≠ legal advice or APP compliance certification.

---

## Register 12 — Security requirements and threat-control

| Control theme | Current | Planned target | Gap |
| --- | --- | --- | --- |
| AuthN | Demo Act-as / local context | Real IdP per AUTH plan | DEF-GAP-012 |
| AuthZ | Module permissions + some service checks | Service-layer on every mutate + tests | P1-GAP-028; DEF-GAP-008 |
| Clinic isolation | Partial | Enforce read/write isolation | DEF-GAP-008 |
| Secrets | `.env.local` ignored; no prod secrets in pack | Env segregation | Process |
| Threat modelling | Absent consolidated | STRIDE-lite per surface | DEF-GAP-012 |
| Essential Eight | Not assessed | **Owner-selected target: Maturity Level Two** (proposed; see OWN-P1A-E8) | Unapproved |
| OWASP ASVS | Not assessed | Proposed ASVS Level 2 for production path | Unapproved |

---

## Register 13 — Non-functional requirements

Measurable NFRs (planned — not yet owner-approved):

| ID | Category | Criterion (measurable) | Evidence method |
| --- | --- | --- | --- |
| NFR-PERF-01 | Performance | Shell interactive on reference hardware: LCP ≤ 2.5s on `/dashboard` cold local prod build @ 1280×800 | Lighthouse/CI note |
| NFR-PERF-02 | Performance | Module section switch p95 ≤ 200ms client nav (no full reload) for accepted modules | Perf tests / evidence JSON (restore side-effects) |
| NFR-A11Y-01 | Accessibility | WCAG 2.2 AA target for SHARED chrome + in-scope batch surfaces | Automated + manual a11y |
| NFR-A11Y-02 | Accessibility | Focus ring 2px; keyboard Esc closes overlays; no keyboard traps on shell | Named tests |
| NFR-SEC-01 | Security | Every mutate path has service-layer authz test | Authz test suite |
| NFR-SEC-02 | Security | No secrets in git; `.env*` ignored | git status / scanners |
| NFR-REL-01 | Reliability | `tsc`, lint 0 errors, `npm test` green, `validate-registers` failures=[] before batch exit | Gate commands |
| NFR-UX-01 | UX honesty | Zero toast-only success presented as completion on in-scope controls | GLOBAL fail condition tests |
| NFR-I18N-01 | Locale | en-AU copy defaults; dates/times clinic-local documented | Review checklist |
| NFR-SCALE-01 | Tenancy | Clinic scoping model documented; multi-clinic behaviour explicit | OWN-P1-005 |

Vague “fast/secure/accessible” alone is **rejected** as an NFR statement.

---

## Register 14 — Design system and component catalogue

SoT: `FINAL_DESIGN_SYSTEM_CONTRACT.md` + `design-system-contract.json` + Decision A PNGs.  
Catalogue + upgrade audit: [P1A_10](./P1A_10_DESIGN_SYSTEM_UX_AND_BUILD_READY.md).

---

## Register 15 — Loading / empty / error / exceptional-state catalogue

| State | Required behaviour | Current | Gap |
| --- | --- | --- | --- |
| Loading | Explicit pending UI; no blank flash mistaken for empty | Partial | P1-GAP-027 |
| Empty | Honest empty copy; no fake seed as production | Partial / demo heavy | P1-GAP-071 |
| Error | Recoverable error UI; no silent fail | Partial | P1-GAP-027 |
| Permission denied | Real denied state (not blank) | Incomplete | P1-GAP-028 |
| Exceptional / blocked | Domain blockers truthful (e.g. M07 readiness) | Stronger in M05/M06/M07 | P1-GAP-027 |
| Offline / demo online toggle | Labelled demo if retained | `pulse.v31.online` demo | P1-GAP-073 |

---

## Register 16 — Reporting / KPI / calculation definitions

| Area | Definition status | Notes |
| --- | --- | --- |
| M01 KPI strip | Demo/seed — not production truth | P1-GAP-016/071 |
| M07 payroll prep calcs | Implemented under qualifications; **not** certified | Wave6 quals |
| Export packages | Prep artefacts ≠ paid | OWN-NO-PAY-EXEC |
| Print packs | Incomplete | P1-GAP-053 |

Rule: every KPI must declare formula, source entity, refresh cadence, and “demo vs durable” flag.

---

## Register 17 — Test-scenario and acceptance-evidence register

SoT framework: `GLOBAL_ACCEPTANCE_TEST_DESIGN.md` + [`../P1_TEST_AND_ACCEPTANCE_EVIDENCE_PLAN.md`](../P1_TEST_AND_ACCEPTANCE_EVIDENCE_PLAN.md).  
Planned evidence root: `docs/audits/p1/` (when implementation authorised).  
Fail conditions: toast-only success; missing service transition; missing permission/isolation; fake seed as truth; clinical/payment breach; self-approval; historical evidence rewrite.

---

## Register 18 — Environment / deployment / operational architecture

| Env | Purpose | Status |
| --- | --- | --- |
| Local dev | Next.js localhost **3000** handoff | In use |
| CI (if/when) | tsc/lint/test/build/validate-registers | Process planned |
| Staging | Not authorised by this pack | Absent/unapproved |
| Production | Not authorised | Explicit exclusion |

Stack (from AUTH plan / app): Next.js App Router + platform foundation + portable SQL migrations; demo identity today.  
**No production deployment / PR / merge authorised by P1A/P1B.**

---

## Register 19 — Migration / configuration / clinic-onboarding plan

Extends `AUTH_PROVISIONING_MIGRATION_PLAN.md`:

| Step | Planned activity | Dependency |
| --- | --- | --- |
| 1 | Confirm org-as-legal-entity + clinic graph | Owner |
| 2 | Map external `auth_identity_id` subjects | IdP decision |
| 3 | Seed roles/permissions/memberships (synthetic) | Reg 8 |
| 4 | Configure clinic isolation + admin break-glass policy | SoD |
| 5 | Import workforce reference data (non-clinical) | M04+ |
| 6 | Validate empty/denied/audit states | Reg 15/17 |
| 7 | Go-live checklist (P9) | Separate auth |

Legacy prototype seed values must **not** be migrated.

---

## Register 20 — Risks / assumptions / dependencies / owner decisions

### Carry-forward P1B risks/assumptions

See [`../P1_RISK_AND_ASSUMPTION_REGISTER.md`](../P1_RISK_AND_ASSUMPTION_REGISTER.md) (R-01…R-15, A-01…A-10) — retained; stamp `P1 — PLANNED, NOT AUTHORISED`.

### Carry-forward P1B owner decisions

See [`../P1_OWNER_DECISION_REGISTER.md`](../P1_OWNER_DECISION_REGISTER.md) OWN-P1-001…015 — retained; **no invented approvals**.

### New P1A owner decisions (all Open; `P1A — PLANNED, NOT AUTHORISED`)

| Decision ID | Question | Recommendation | Blocks |
| --- | --- | --- | --- |
| OWN-P1A-001 | Accept P1A pack as definition-readiness baseline (still not implementation auth)? | Accept after review | Definition closure sequencing |
| OWN-P1A-002 | Confirm Essential Eight **target Maturity Level Two** for production path? | ML2 proposed | Security roadmap |
| OWN-P1A-003 | Confirm OWASP ASVS **Level 2** target for production path? | L2 proposed | Security roadmap |
| OWN-P1A-004 | Confirm WCAG **2.2 AA** as accessibility acceptance target? | AA proposed | A11y gates |
| OWN-P1A-005 | Authorise privacy counsel / PIA kickoff (docs ≠ compliance)? | Yes before prod | Prod claims |
| OWN-P1A-006 | Resolve CONF-P1A-003 historic register supersession banner? | Prefer re-audit | Planning hygiene |
| OWN-P1A-007 | Commercial tenancy model (single-tenant vs multi-tenant SaaS) for M20 path? | Defer detail to P8; record assumption | M20 |
| OWN-P1A-008 | Any AI features planned? | None found — confirm none | AI governance |

### Dependencies (summary)

P0 acceptance → definition closure for named batch → P1-B1 → B2–B8 (if broad scope) → P2 domain → … → P9 production verification → specialist reviews before production claims.

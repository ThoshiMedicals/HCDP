# P1A Permissions Model, NFRs, Privacy & Security Baseline

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## A. Permissions model (service-layer enforcement)

### Principles

1. **UI is not authority** — `PermissionGuard` / hidden buttons are insufficient.  
2. Every mutate path enforces authz in service/application layer.  
3. Clinic/tenant isolation on read and write.  
4. SoD conflicts must be structurally prevented (especially M07).  
5. Denied and empty are real UI states.  
6. Automated authz tests are mandatory acceptance evidence for domain batches.

### Current enforcement evidence (read-only inspection)

| Area | Evidence | Limitation |
| --- | --- | --- |
| M05/M06/M07 | `permissions.ts` + `*-authz.test.ts` | Module-local; not platform-complete |
| M04/M11 | `permissions.ts` present | Coverage varies |
| M01–M03 | Classification / workspace checks; durable services NONE | P2 |
| SHARED | Nav gating by accessClassification | Chrome only |
| M07 SoD | `WAVE6_M07_PERMISSIONS_MATRIX.md` | Ordinary prep; PPA separate |

### Required test call-outs (planned)

| Test class | Requirement |
| --- | --- |
| Allow | Authorised role can mutate |
| Deny | Unauthorised role receives denied (not success toast) |
| Isolation | Clinic A actor cannot read/write Clinic B restricted data |
| SoD | Export operator cannot final-approve; clinic-manager cannot view rates (M07 rules) |
| Audit | Successful mutate writes audit with actor/clinic/before-after |

### P1 implication

P1 batches that are presentation/honesty only must **not** invent new elevate paths. P1-B7 may complete denied-state UX but must not weaken service checks.

---

## B. Non-functional requirements

See Register 13 table in [P1A_06](./P1A_06_MASTER_REGISTERS_11_TO_20.md) (NFR-PERF/A11Y/SEC/REL/UX/I18N/SCALE).  
Status: **proposed / unapproved** (`P1A — PLANNED, NOT AUTHORISED`).

---

## C. Privacy & security baseline (official sources)

**Qualification (mandatory):** This mapping is a planning baseline. It is **not** legal advice, **not** an OAIC PIA completion, **not** an NDB compliance certification, **not** an ASD Essential Eight assessment, **not** an OWASP ASVS certification, and **not** a WCAG conformance claim.

| Framework | Official source | Version / note | Accessed |
| --- | --- | --- | --- |
| Australian Privacy Principles | https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines | APP guidelines; chapters updated incl. May 2026 | 2026-08-11 |
| NDB scheme | OAIC Notifiable Data Breaches resources on oaic.gov.au | Current OAIC scheme pages | 2026-08-11 |
| Essential Eight | https://www.cyber.gov.au/resources-business-and-government/essential-cybersecurity/essential-eight/essential-eight-maturity-model | Maturity Model **November 2023** | 2026-08-11 |
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | Latest stable noted **5.0.0** on project page; historical 4.0.x docs exist | 2026-08-11 |
| WCAG 2.2 | https://www.w3.org/TR/WCAG22/ | W3C Recommendation 2023-10-05; target **AA** | 2026-08-11 |

### Explicitly selected targets (proposed — need owner decisions)

| Control set | Proposed target | Decision ID | Status |
| --- | --- | --- | --- |
| Essential Eight | **Maturity Level Two** | OWN-P1A-002 | Open — not approved |
| OWASP ASVS | **Level 2** (production path) | OWN-P1A-003 | Open — not approved |
| WCAG | **2.2 AA** | OWN-P1A-004 | Open — not approved |

### APP → product control mapping (planning)

| APP theme | Product control expectation | Current |
| --- | --- | --- |
| APP1 Open & transparent | Privacy policy; automated decision disclosure when applicable (Dec 2026 obligations noted by OAIC updates) | Missing approved artefact |
| APP3/6 Collection & use | Collect only ops workforce data; purpose limitation | Partial |
| APP8 Cross-border | Document hosting/disclosure locations | Missing |
| APP11 Security | Technical + organisational measures | Partial (module authz; demo auth) |
| APP12/13 Access/correction | Staff access/correction pathways | Partial / undefined UX |
| NDB prep | Incident runbook; assessment timers; contacts | Missing approved runbook |
| PIA | Conduct before high-risk prod personal info processing | Not done |

### Essential Eight (ML2 proposed) — control themes

Application patching · OS patching · MFA · harden/admin privilege restriction · application control · macros (if applicable) · user application hardening · regular backups.  
Hosting/SaaS shared-responsibility matrix required before claiming ML2.

### OWASP ASVS L2 (proposed) themes

V2 auth · V3 session · V4 access control · V5 validation/sanitization · V7 error/logging · V8 data protection · V14 config. Map to Next.js/platform controls in a future security design pack (not implemented here).

### WCAG 2.2 AA (proposed)

Keyboard, focus visibility (incl. 2.4.11), target size 2.5.8, accessible auth 3.3.8, contrast, labels, status messages — align with design-contract focus/keyboard rules + P1-B4 tests.

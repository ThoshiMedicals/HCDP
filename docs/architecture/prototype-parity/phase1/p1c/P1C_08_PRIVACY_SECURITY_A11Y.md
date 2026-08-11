# P1C Privacy, Security & Accessibility Readiness

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Qualification

Documentation mapping and proposed targets are **not** legal advice, **not** OAIC PIA completion, **not** NDB certification, **not** ASD Essential Eight assessment, **not** OWASP ASVS certification, and **not** WCAG conformance certification.

## Privacy & information governance (OAIC primary)

| Source | URL | Accessed |
| --- | --- | --- |
| OAIC APP guidelines | https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines | 2026-08-11 |

| Topic | Status | Gap |
| --- | --- | --- |
| Personal info inventory / ROPA | Partial | DEV-GAP-024 |
| Privacy policy | Missing approved artefact | DEV-GAP-024 |
| PIA | Not conducted as approved artefact | OWN-P1A-005 |
| NDB runbook | Missing | DEV-GAP-023 |
| Retention/deletion | Partial definitions | P1A DEF-GAP-011 |
| Consent/collection notices | Missing | DEV-GAP-024 |
| Clinical data | Correctly excluded | Maintain |
| Demo seed | Must not migrate to prod | Firewall |

## Security readiness

### OWASP ASVS (exact version)

| Field | Value |
| --- | --- |
| Standard | OWASP Application Security Verification Standard |
| **Exact version** | **5.0.0** (released 2025-05-30) |
| Official project | https://owasp.org/www-project-application-security-verification-standard/ |
| Release tag | https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release |
| Access date | **2026-08-11** |
| Proposed target level | **Level 2** for production path (OWN-P1A-003 / OWN-P1C-005) — **not approved** |
| Current assessment | **Not performed** |

### Essential Eight

| Field | Value |
| --- | --- |
| Model | ASD Essential Eight Maturity Model (November 2023) |
| Official URL | https://www.cyber.gov.au/resources-business-and-government/essential-cybersecurity/essential-eight/essential-eight-maturity-model |
| Access date | **2026-08-11** |
| Proposed target | **Maturity Level Two** (owner decision OWN-P1A-002) — **not approved** |
| Current assessment | **Not performed** |

### Security control snapshot

| Control | Current | Prod need |
| --- | --- | --- |
| AuthN | Demo Act-as / local identity context | Real IdP + MFA posture |
| AuthZ | Module permissions + some authz tests | Service-layer universal |
| Secrets | `.env*` gitignored | Vault/CI secrets + `.env.example` |
| Dependency scanning | Absent automated | Dependabot/CI |
| Threat model | Missing consolidated | DEV-GAP-025 |
| Security.md / disclosure | Missing | DEV-GAP-004 |

## Accessibility & design-system

| Field | Value |
| --- | --- |
| Proposed target | **WCAG 2.2 AA** unless owner approves stronger | 
| Official | https://www.w3.org/TR/WCAG22/ |
| Access date | **2026-08-11** |
| Design SoT | Decision A + `FINAL_DESIGN_SYSTEM_CONTRACT.md` |
| Current | Partial shell a11y; Programme P1 Decision A conversion incomplete (P1-GAP-002/009) |
| Certification | **Not claimed** |

Playwright is a dependency but no root config — a11y/E2E harness incomplete (DEV-GAP-011/026).

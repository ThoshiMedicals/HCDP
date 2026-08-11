# P1C Data and Database Readiness

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Runtime vs portable SQL

| Layer | Reality | Readiness |
| --- | --- | --- |
| Runtime app data | localStorage keys per `PLATFORM_STORAGE_REGISTER.md` + module stores | Demo/wave capable; **not** multi-device prod DB |
| Portable SQL | `db/migrations/20260727094500_auth_user_provisioning.sql` (orgs/clinics/profiles/roles…) | Planned schema fragment; **not applied as live app DB in this tip** |
| ORM / connection pool / migrations runner | Not evidenced in app runtime | Missing |

**P1C does not change schemas or migrations.**

## Data readiness findings

| ID | Finding | Risk |
| --- | --- | --- |
| DATA-01 | Dual persistence story (localStorage vs SQL) unresolved for production — owner decision **OWN-P1-016** (**Open**; see `../P1_OWNER_DECISION_REGISTER.md`) | High |
| DATA-02 | Seed/demo data governance relies on firewall + honesty labelling | Med |
| DATA-03 | Field-schemas exist; platform data dictionary incomplete (P1A DEF-GAP-003) | Med |
| DATA-04 | Backup/restore of browser storage not an enterprise DR strategy | High for prod |
| DATA-05 | Clinic/tenant isolation must be enforced server-side before prod | High |
| DATA-06 | Prohibited clinical entities must remain absent from schema evolution | High |

## Production data path (planned requirements — unauthorised)

1. Choose persistence architecture (ADR).  
2. Migration runner + env-specific DBs.  
3. RLS/tenant isolation tests.  
4. Backup/PITR.  
5. Synthetic data pipelines only for non-prod.  
6. No real patient data in any env.

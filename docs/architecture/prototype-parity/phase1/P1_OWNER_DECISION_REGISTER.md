# P1 Owner-Decision Register

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`  
**Note:** Conflict register openCount remains 0 for prior DEC-* items. This register lists **P1 planning decisions** required, closed, or deferrable.  
**P1A extension:** Additional definition/delivery decisions (`OWN-P1A-*`) live in [`p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md`](./p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md#register-20--risks-assumptions-dependencies-owner-decisions) — also open / not approved.  
**P1C extension:** Repository/production-readiness decisions (`OWN-P1C-*`) live in [`p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md`](./p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md) — also open / not approved.  
**Owner-decision date (001–003, 016 opened):** `2026-08-11`

## Decisions required before any P1 implementation

| Decision ID | Question | Recommendation | Blocks | Status |
| --- | --- | --- | --- | --- |
| OWN-P1-001 | Accept corrected P0 control pack tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` (and nested pins) and clear `OWN-NO-P1-YET`? | Accept when pack review complete | All batches (entry) | **Closed (conditionally approved) — 2026-08-11** |
| OWN-P1-002 | Is Programme P1 limited to SHARED foundation (`prompts/p1.md`), or does it include B1–B8 presentation/hygiene? | Prefer SHARED-first (B1), then explicitly authorise B2–B8 as P1 continuation | Scope / 083 | **Closed (approved) — 2026-08-11** |
| OWN-P1-003 | Name the first implementation batch? | **P1-B1** | Start coding (naming only) | **Closed (approved — naming only) — 2026-08-11** |
| OWN-P1-004 | Inactive Topbar Export / MFA / New Entry: hide, truthful non-op, or defer backend to P2+? | Truthful non-op or hide in P1; backend not P1 | B2 | **Open** |
| OWN-P1-005 | Clinic multi-select: shell-wide vs Command Centre only (Accepted difference)? | Document Accepted difference OR schedule shell support in B2 | B2 / 006 | **Open** |
| OWN-P1-006 | Authorise M11 register/condition/section sync without domain change? | Yes | B3 / 011 | **Open** |
| OWN-P1-007 | Authorise M07 History/Adjustments honesty labelling (not PPA product)? | Yes — honesty only | B3 / 012 / 079 | **Open** |
| OWN-P1-008 | Demo/QA menus: retain visible, gate behind flag, or remove from portal? | Gate behind explicit QA flag | B2 / 032 | **Open** |

## Closed gate decisions (2026-08-11) — planning closure only

Closing OWN-P1-001…003 does **not** authorise **P1-B1** or any product implementation. Express named-batch authorisation remains a separate owner act.

### OWN-P1-001 — Conditionally approved / closed

```text
Decision ID: OWN-P1-001
Date: 2026-08-11
Owner: Programme owner (recorded)
Outcome: Conditionally approved — abbreviated tip b0c4c4d20… uniquely verified as
         b0c4c4d20de1cce7adac5d691c506122e30610a2
         (2026-08-11 13:00:05 +1000; subject: Correct P0 M21 section contract: drop invented Overview fallback.)
         Full SHA recorded as accepted P0 programme-reset baseline.
         OWN-NO-P1-YET cleared for programme-entry hold (planning registers).
Authorises batch(es): None
Explicitly does NOT authorise: P1-B1; B2–B8; PPA; payment; M25; production merge/deploy; any src/ implementation
Evidence pointer: git show b0c4c4d20de1cce7adac5d691c506122e30610a2;
                  phase1/P1_BASELINE_GATE_EVIDENCE.md; branch cursor/prototype-parity-programme-reset
```

### OWN-P1-002 — Approved / closed

```text
Decision ID: OWN-P1-002
Date: 2026-08-11
Owner: Programme owner (recorded)
Outcome: Approved — SHARED-first delivery sequence.
         B2–B8 each require separate explicit owner authorisation.
         No automatic progression after a preceding batch.
         Planning-decision closure only — not implementation authority.
Authorises batch(es): None
Explicitly does NOT authorise: Automatic B2–B8 progression; P1-B1 coding; PPA; payment; M25; production
Evidence pointer: prompts/p1.md; P1-GAP-083; CONF-P1A-001; this register
```

### OWN-P1-003 — Approved (naming only) / closed

```text
Decision ID: OWN-P1-003
Date: 2026-08-11
Owner: Programme owner (recorded)
Outcome: Approved — first named implementation batch is P1-B1.
         Naming ≠ authorisation. P1-B1 remains P1 — PLANNED, NOT AUTHORISED.
Authorises batch(es): None (name only)
Explicitly does NOT authorise: P1-B1 implementation; B2–B8; PPA; payment; M25; production
Evidence pointer: P1_RECOMMENDED_FIRST_BATCH.md; P1_EXECUTION_BATCHES.md
```

## Open architecture / data decision (production path)

| Decision ID | Question | Recommendation | Blocks | Status |
| --- | --- | --- | --- | --- |
| OWN-P1-016 | Current localStorage runtime vs proposed SQL-backed production data architecture (ARCH-01 / DATA-01)? | `OWNER INPUT REQUIRED — NO SAFE DEFAULT ESTABLISHED`; adopt ADR process (OWN-P1C-004) then decide in a named data batch | Production data path / S11; **not** a P1-B1 product-coding blocker | **Open** |

### OWN-P1-016 — localStorage vs SQL production architecture (OPEN)

1. **Decision ID:** OWN-P1-016  
2. **Finding cross-refs:** ARCH-01 (`p1c/P1C_05_ARCHITECTURE_AND_ADR.md`); DATA-01 (`p1c/P1C_07_DATA_DATABASE_READINESS.md`)  
3. **Status:** **Open** — created 2026-08-11; **not** decided or closed  
4. **Exact question requiring owner approval:** For production, should HCDP/MCOP continue as a browser-localStorage-backed workbench, migrate to a durable SQL-backed (or other server) data platform, or keep a dual path with an explicit, time-bound transition plan?  
5. **Current localStorage behaviour:** Runtime application data uses browser **localStorage** keys documented in `PLATFORM_STORAGE_REGISTER.md` plus module stores. This supports demo/wave operation on the verified tip but is **not** a multi-device, multi-user production database with server-side tenancy enforcement.  
6. **Unused SQL migration:** A portable SQL fragment exists at `db/migrations/20260727094500_auth_user_provisioning.sql` (orgs/clinics/profiles/roles…). On tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa` it is **not** the live application database — no evidenced ORM/connection pool/migrations runner in app runtime. Intended role today: planned schema seed for a future production data path, not active SoT.  
7. **Evidence-supported options:**  
   - **(A)** Keep localStorage as demo/wave SoT; defer production DB to a later named data wave.  
   - **(B)** Authorise a named data-architecture batch to design/migrate to SQL (or other durable store) with tenancy, backup, and rollback.  
   - **(C)** Explicit dual-path transition (localStorage for demo; SQL for production) with owner-accepted cutover criteria.  
8. **Recommended option:** No safe default established from evidence alone — `OWNER INPUT REQUIRED`. Prefer adopting ADR process (**OWN-P1C-004**) before binding a persistence ADR; then choose B or C for production claims.  
9. **Benefits / risks:**  
   - **A** — Benefits: no near-term data migration risk; Risks: cannot honestly claim production durability/DR/tenancy.  
   - **B** — Benefits: durable multi-user path; Risks: large scope, wrong early schema, migration defects.  
   - **C** — Benefits: clear demo vs prod; Risks: dual-path complexity and accidental “localStorage = prod” confusion (R-P1C-04).  
10. **System-of-record implications:** Production SoT must be explicit. Clinical/patient SoR remains Best Practice (or equivalent) — this decision is **ops-platform persistence only**, not clinical.  
11. **Organisation / clinic tenancy:** Production path requires server-side org/clinic isolation (DATA-05); localStorage alone cannot enforce multi-tenant security.  
12. **Identity, permissions, audit:** Demo Act-as identity is insufficient for prod; durable store must align with future IdP/`auth_identity_id` plans and auditable writes.  
13. **Persistence, migration, rollback:** Choosing SQL (or other) requires migration runner, env-specific DBs, backup/PITR, and rollback plan; choosing localStorage-only for prod rejects those as N/A (and blocks prod readiness).  
14. **Privacy / security:** Durable personal-information processing needs PIA path (OWN-P1A-005) and security targets (OWN-P1A-002/003 / OWN-P1C-005); localStorage increases device-loss and shared-browser risk.  
15. **Integration / reporting:** Cross-device reporting, exports, and integrations assume a durable store; localStorage blocks honest multi-clinic enterprise reporting.  
16. **Effect on P1-B1 and later batches:** Does **not** block *consideration* or *naming* of P1-B1 (shell/chrome). Does **not** block P1-B1 *execution* if later authorised (B1 is presentation/shell, not persistence ADR). **Does** block honest production data-path / S11 exit and production readiness claims until closed.  
17. **Specialist review required:** Data/architecture + security (and privacy counsel before personal-info prod claims).  
18. **Acceptance evidence required:** Owner log selecting A/B/C (or refined option); accepted persistence ADR after OWN-P1C-004; named data batch scope; non-goals (no clinical SoR; no PPA/payment smuggling).  
19. **Blocks:** Production data durability & tenancy; **not** P1-B1 consideration; **not** automatic product coding.  
20. **Timing:** Required before production data path; advisory relative to P1 shell batches.

## Decisions that can wait (post-P1 / later waves)

| Decision ID | Question | Earliest wave | Status |
| --- | --- | --- | --- |
| OWN-P1-009 | Authorise M01/M02/M03 durable domain services? | P2 | Open (deferred) |
| OWN-P1-010 | Authorise M10 unblock approach? | P3 | Open (deferred) |
| OWN-P1-011 | Authorise named PPA implementation batch? | Separate | Open (deferred) — planning exists, not auth |
| OWN-P1-012 | Authorise M08–M24 rebuild batches? | P4–P8 | Open (deferred) |
| OWN-P1-013 | Accept M25 future planning artefacts? | Outside P1 | Open on `cursor/m25-future-planning` |
| OWN-P1-014 | Production deployment / merge / PR? | After P9-style verification | Open (deferred) |
| OWN-P1-015 | Reopen branded global themes? | Not recommended | Closed unless owner reopens DEC-BRANDED-THEMES |

## Already closed (carry forward; do not re-litigate in P1)

| ID | Outcome |
| --- | --- |
| DEC-FINAL-PNGS-MISSING | Decision A canonical PNGs accepted |
| DEC-BRANDED-THEMES | Light / Dark / System only |
| OWN-PATIENT-FIREWALL | No patient/clinical SoT in Doctors Pulse |
| OWN-NO-PAY-EXEC | No payment execution in M07 ordinary prep |
| OWN-PPA-SEPARATE | PPA separately authorised; unlock ≠ PPA |

## Decision log template (for owner use)

```text
Decision ID:
Date:
Owner:
Outcome:
Authorises batch(es):
Explicitly does NOT authorise:
Evidence pointer:
```

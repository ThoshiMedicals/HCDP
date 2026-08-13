# P1 Owner-Decision Register

**Stamp:** **P1-B1** owner accepted with qualifications and **closed** (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. **P1-B2–P1-B8** remain unauthorised. Overall Programme P1 is **not** complete or production-approved.  
**Note:** Conflict register openCount remains 0 for prior DEC-* items. This register lists **P1 planning decisions** required, closed, or deferrable.  
**P1A extension:** Additional definition/delivery decisions (`OWN-P1A-*`) live in [`p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md`](./p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md#register-20--risks-assumptions-dependencies-owner-decisions) — also open / not approved.  
**P1C extension:** Repository/production-readiness decisions (`OWN-P1C-*`) live in [`p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md`](./p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md) — also open / not approved.  
**Owner-decision date (001–003, 016 opened):** `2026-08-11`  
**P1-B1 qualified acceptance date:** `2026-08-13`  
**P1-B2 shell-honesty decisions closed:** `OWN-P1-004`, `OWN-P1-005`, `OWN-P1-008`, `OWN-P1-017` — `2026-08-13` (decision closure only; **P1-B2 remains unauthorised**)

## Decisions required before any P1 implementation

| Decision ID | Question | Recommendation | Blocks | Status |
| --- | --- | --- | --- | --- |
| OWN-P1-001 | Accept corrected P0 control pack tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` (and nested pins) and clear `OWN-NO-P1-YET`? | Accept when pack review complete | All batches (entry) | **Closed (conditionally approved) — 2026-08-11** |
| OWN-P1-002 | Is Programme P1 limited to SHARED foundation (`prompts/p1.md`), or does it include B1–B8 presentation/hygiene? | Prefer SHARED-first (B1), then explicitly authorise B2–B8 as P1 continuation | Scope / 083 | **Closed (approved) — 2026-08-11** |
| OWN-P1-003 | Name the first implementation batch? | **P1-B1** | Start coding (naming only) | **Closed (approved — naming only) — 2026-08-11** |
| OWN-P1-004 | Inactive Topbar Export / MFA / New Entry: hide, truthful non-op, or defer backend to P2+? | Truthful non-op or hide in P1; backend not P1 | B2 | **Closed (approved) — 2026-08-13** |
| OWN-P1-005 | Clinic multi-select: shell-wide vs Command Centre only (Accepted difference)? | Document Accepted difference OR schedule shell support in B2 | B2 / 006 | **Closed (approved) — 2026-08-13** |
| OWN-P1-006 | Authorise M11 register/condition/section sync without domain change? | Yes | B3 / 011 | **Open** |
| OWN-P1-007 | Authorise M07 History/Adjustments honesty labelling (not PPA product)? | Yes — honesty only | B3 / 012 / 079 | **Open** |
| OWN-P1-008 | Demo/QA menus: retain visible, gate behind flag, or remove from portal? | Gate behind explicit QA flag | B2 / 032 | **Closed (approved) — 2026-08-13** |
| OWN-P1-017 | Demo identity consistency across current-user chrome? | Global Act-as identity drives current-user chrome; seed names as labelled demo data | B2 identity | **Closed (approved) — 2026-08-13** |

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

## P1-B1 qualified owner acceptance (recorded 2026-08-13)

Closing this acceptance record closes **P1-B1 only**. It does **not** authorise P1-B2–P1-B8, resolve `OWN-P1-016`, claim overall Programme P1 completion, or authorise PR / merge / deployment / production.

```text
Decision ID: P1-B1-OWNER-ACCEPT-2026-08-13
Date: 2026-08-13
Owner: Programme owner (recorded)
Outcome: Owner accepted with qualifications — P1-B1 CLOSED
         Accepted implementation tip:
         fdb2beb5b0e786e42d358efa9875b6bba52666cd
         Implementation sequence:
         fa2cc7f401fab95d1320f00897bca4438207191b
         4069ed429072138c81eeca85e14f879d4bfb6cf6
         fdb2beb5b0e786e42d358efa9875b6bba52666cd
         Accepted scope: P1-B1 shared Decision A shell foundation only
         Validation basis: verified local tests, validators, build, visual harness
         GitHub CI: none — not passed (no Actions checks on branch)
Qualifications (binding):
  - No GitHub CI pass claimed
  - Full Decision A pixel-difference deferred to controlled later batch
  - Sarah/Neil demo identity consistency remains P1-B2
  - OWN-P1-016 remains open
  - P1-B2 through P1-B8 remain separately unauthorised
  - No production approval or readiness claim
  - No PR, merge or deployment authorised
  - No automatic progression to P1-B2
  - Not overall Programme P1 or production acceptance
Authorises batch(es): Closure of P1-B1 only (qualified)
Explicitly does NOT authorise: P1-B2–P1-B8; automatic progression; PR; merge;
         deploy; production; OWN-P1-016 resolution; PPA; payment; M25;
         patient/clinical SoR; pixel-parity claim; WCAG/security certification
Evidence pointer: docs/audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md;
                  docs/audits/p1/P1_B1_VISUAL_QA_NOTES.md;
                  P1_EXECUTION_BATCHES.md; branch cursor/p1-b1-shared-shell-foundation
```

## P1-B2 shell-honesty owner decisions (recorded 2026-08-13) — decision closure only

Closing OWN-P1-004, OWN-P1-005, OWN-P1-008 and OWN-P1-017 records the owner’s honesty dispositions for a future **P1-B2**. These closures do **not** authorise P1-B2 implementation, start coding, PR, merge, deployment, or automatic progression. Gaps remain open until implemented and accepted evidence exists. Briefing: [`P1_B2_OWNER_DECISION_BRIEFING.md`](./P1_B2_OWNER_DECISION_BRIEFING.md).

### OWN-P1-004 — Approved / closed (2026-08-13)

```text
Decision ID: OWN-P1-004
Date: 2026-08-13
Owner: Programme owner (recorded)
Selected option: Option A + D
Outcome: Approved and closed — Disable unsupported Topbar Export, Enterprise MFA and any
         unsupported New Entry affordances with a truthful non-operational explanation
         during P1. Their backend capabilities remain outside P1 and are not authorised
         by P1-B2.
Qualifications / interpretation:
  - Unsupported controls must not simulate successful completion
  - No toast may imply that an unavailable backend operation succeeded
  - Controls may remain visible only when unavailable/demonstration status is clear
  - Hiding a control remains permitted where clearer than disabling it
  - Existing genuinely working New Entry behaviour must not be incorrectly disabled
    merely because another New Entry pathway is unsupported
  - No export-processing service authorised
  - No MFA infrastructure or IdP work authorised
  - No fake backend authorised
Affected gaps (disposition guidance only — gaps NOT closed): P1-GAP-005;
         honesty portion of P1-GAP-030
Authorises: Honesty disposition for Topbar unsupported controls in a future authorised P1-B2
Explicitly does NOT authorise: P1-B2 implementation; export-processing services;
         MFA infrastructure; IdP; fake backends; PR; merge; deploy; production
Evidence pointer: P1_B2_OWNER_DECISION_BRIEFING.md; P1-GAP-005; Topbar.tsx
Dependencies: Aligns with OWN-P1-008 honesty theme; after P1-B1 closed
```

### OWN-P1-005 — Approved / closed (2026-08-13)

```text
Decision ID: OWN-P1-005
Date: 2026-08-13
Owner: Programme owner (recorded)
Selected option: Option A
Outcome: Approved and closed — Accept Command Centre-only multi-clinic selection as an
         Accepted difference for Programme P1. The Topbar must truthfully direct users to
         Command Centre and must not imply that shell-wide multi-select exists.
         Shell-wide multi-clinic selection is not authorised by P1-B2.
Qualifications / interpretation:
  - Command Centre remains the authorised P1 multi-clinic selection surface
  - Topbar must not silently pretend to support multi-select
  - Presentation / workflow-boundary decision only
  - Does not resolve production tenancy or data isolation
  - OWN-P1-016 remains open
  - Shell-wide multi-select requires a separate future authorisation if desired
Affected gaps (disposition guidance only — gaps NOT closed): P1-GAP-006
Authorises: Accepted-difference disposition for clinic multi-select honesty in a future
         authorised P1-B2
Explicitly does NOT authorise: Shell-wide multi-select; P1-B2 implementation;
         OWN-P1-016 resolution; production tenancy; PR; merge; deploy
Evidence pointer: P1_B2_OWNER_DECISION_BRIEFING.md; P1-GAP-006; Topbar.tsx; CC ControlBar
Dependencies: Independent of OWN-P1-016 for consideration; production claims still need 016
```

### OWN-P1-008 — Approved / closed (2026-08-13)

```text
Decision ID: OWN-P1-008
Date: 2026-08-13
Owner: Programme owner (recorded)
Selected option: Option A
Outcome: Approved and closed — Gate demo and QA menus, simulated states, destructive demo
         resets, demo clock controls and equivalent testing tools behind an explicit
         QA/demo mode. Ordinary portal navigation must not present them as live
         operational controls.
Qualifications / interpretation:
  - QA functionality may remain available only through a clear and testable demo/QA gate
  - Demo/QA mode must be visibly labelled
  - Ordinary users must not mistake seed resets, simulated time or online/offline
    simulation for production operations
  - Does not authorise production authentication
  - Does not authorise durable demo-data services
  - The gate is not a security boundary equivalent to production authorisation
Affected gaps (disposition guidance only — gaps NOT closed): P1-GAP-032, P1-GAP-071,
         P1-GAP-073; labelling portion of P1-GAP-018
Authorises: Demo/QA gating disposition for a future authorised P1-B2
Explicitly does NOT authorise: P1-B2 implementation; production authentication;
         durable demo-data services; PR; merge; deploy; production
Evidence pointer: P1_B2_OWNER_DECISION_BRIEFING.md; P1-GAP-032; QaDemoMenu.tsx;
         OrganisationWorkspace.tsx
Dependencies: Honesty theme with OWN-P1-004; coordinates with OWN-P1-017
```

### OWN-P1-017 — Approved / closed (2026-08-13)

```text
Decision ID: OWN-P1-017
Date: 2026-08-13
Owner: Programme owner (recorded)
Title: Demo identity consistency across current-user chrome
Selected option: Option A
Outcome: Approved and closed — All visible current-user chrome, including the Sidebar,
         Command Centre greeting and equivalent shell labels, must follow the active
         global demonstration identity selected through Act as User/Role. Seed narrative
         names such as Neil or Alex may remain only as clearly identifiable demo-data
         characters or record participants. Act-as remains demonstration-only and is not
         production authentication.
Qualifications / interpretation:
  - One global demo identity controls current-user name, greeting, acting-as label,
    and equivalent visible identity chrome
  - Module-specific role simulation may remain only when visibly labelled as a local
    demo override
  - A module-local role override must not silently replace or contradict the global
    current-user display name
  - Neil, Alex and other seed names may remain as record owners, staff members or
    narrative actors where clearly part of demo data
  - Do not replace every seed-person name with the current user
  - Do not implement production authentication or an IdP
  - Preserve existing production enforcement boundaries (demo-isolation / AUTH_ENFORCEMENT)
Affected gaps (disposition guidance only — gaps NOT closed): identity portion of
         P1-GAP-018, P1-GAP-032 and P1-GAP-071; satisfies P1-B1 Sarah/Neil qualification
         guidance for a future P1-B2
Authorises: Identity-chrome consistency disposition for a future authorised P1-B2
Explicitly does NOT authorise: P1-B2 implementation; production authentication; IdP;
         SQL/durable identity store; PR; merge; deploy; production
Evidence pointer: P1_B2_OWNER_DECISION_BRIEFING.md; identity-context.tsx;
         CommandCentre.tsx; demo-isolation.ts; P1_B1_IMPLEMENTATION_EVIDENCE.md
Dependencies: Coordinates with OWN-P1-008; distinct from OWN-P1-016
```

**Remaining before a separate P1-B2 express implementation authorisation:** owner decision blockers OWN-P1-004/005/008/017 are **closed**. P1-B2 itself remains **`P1 — PLANNED, NOT AUTHORISED`** until the owner expressly authorises that named batch. OWN-P1-006/007 (B3), OWN-P1-016, and deferred P1A/P1C decisions remain as registered.

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

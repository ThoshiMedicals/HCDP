# P1 Owner-Decision Register

**Stamp:** **P1-B1**, **P1-B2**, **P1-B3**, **P1-B4** and **P1-B5** owner accepted with qualifications and **closed**. Accepted tips: P1-B1 `fdb2beb5b0e786e42d358efa9875b6bba52666cd`; P1-B2 `66f3f8d27803f5b8d24043639d21b9069f58e77a`; P1-B3 `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`P1-B3-OWNER-ACCEPT-2026-08-13`); P1-B4 `c58f2843d47b6fa875cd155d166c1f7c916d5250` (`P1-B4-OWNER-ACCEPT-2026-08-14`); P1-B5 `4306116fdf28f9d90a989d8ec78b317ad351b0d2` (`P1-B5-OWNER-ACCEPT-2026-08-17`). **P1-B6** expressly authorised and **implemented for owner review** — **acceptance pending** (NOT owner accepted). **P1-B7** and **P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`. `OWN-P1-009`, `OWN-P1-011` and `OWN-P1-016` remain **open**. Overall Programme P1 is **not** complete or production-approved.
**Note:** Conflict register openCount remains 0 for prior DEC-* items. This register lists **P1 planning decisions** required, closed, or deferrable.
**P1A extension:** Additional definition/delivery decisions (`OWN-P1A-*`) live in [`p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md`](./p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md#register-20--risks-assumptions-dependencies-owner-decisions) — also open / not approved.
**P1C extension:** Repository/production-readiness decisions (`OWN-P1C-*`) live in [`p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md`](./p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md) — also open / not approved.
**Owner-decision date (001–003, 016 opened):** `2026-08-11`
**P1-B1 qualified acceptance date:** `2026-08-13`
**P1-B2 shell-honesty decisions closed:** `OWN-P1-004`, `OWN-P1-005`, `OWN-P1-008`, `OWN-P1-017` — `2026-08-13`
**P1-B2 qualified acceptance date:** `2026-08-13` (`P1-B2-OWNER-ACCEPT-2026-08-13`)
**P1-B3 register-hygiene decisions closed:** `OWN-P1-006`, `OWN-P1-007` — `2026-08-13`
**P1-B3 qualified acceptance date:** `2026-08-13` (`P1-B3-OWNER-ACCEPT-2026-08-13`)
**P1-B4 qualified acceptance date:** `2026-08-14` (`P1-B4-OWNER-ACCEPT-2026-08-14`)
**P1-B5 qualified acceptance date:** `2026-08-17` (`P1-B5-OWNER-ACCEPT-2026-08-17`)

## Decisions required before any P1 implementation

| Decision ID | Question | Recommendation | Blocks | Status |
| --- | --- | --- | --- | --- |
| OWN-P1-001 | Accept corrected P0 control pack tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` (and nested pins) and clear `OWN-NO-P1-YET`? | Accept when pack review complete | All batches (entry) | **Closed (conditionally approved) — 2026-08-11** |
| OWN-P1-002 | Is Programme P1 limited to SHARED foundation (`prompts/p1.md`), or does it include B1–B8 presentation/hygiene? | Prefer SHARED-first (B1), then explicitly authorise B2–B8 as P1 continuation | Scope / 083 | **Closed (approved) — 2026-08-11** |
| OWN-P1-003 | Name the first implementation batch? | **P1-B1** | Start coding (naming only) | **Closed (approved — naming only) — 2026-08-11** |
| OWN-P1-004 | Inactive Topbar Export / MFA / New Entry: hide, truthful non-op, or defer backend to P2+? | Truthful non-op or hide in P1; backend not P1 | B2 | **Closed (approved) — 2026-08-13** |
| OWN-P1-005 | Clinic multi-select: shell-wide vs Command Centre only (Accepted difference)? | Document Accepted difference OR schedule shell support in B2 | B2 / 006 | **Closed (approved) — 2026-08-13** |
| OWN-P1-006 | Authorise M11 register/condition/section sync without domain change? | Yes | B3 / 011 | **Closed (approved) — 2026-08-13** |
| OWN-P1-007 | Authorise M07 History/Adjustments honesty labelling (not PPA product)? | Yes — honesty only | B3 / 012 / 079 | **Closed (approved) — 2026-08-13** |
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
    (historical B1 qualification text preserved; satisfaction noted under
     P1-B2-OWNER-ACCEPT-2026-08-13 and P1_B1_IMPLEMENTATION_EVIDENCE.md)
  - OWN-P1-016 remains open
  - P1-B2 through P1-B8 remain separately unauthorised
    (historical at B1 acceptance time; P1-B2 later closed separately —
     P1-B3–P1-B8 remain unauthorised)
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

### P1-B1 qualification satisfaction note (Sarah/Neil — recorded with P1-B2 acceptance)

The historical P1-B1 qualification “Sarah/Neil demo identity consistency remains P1-B2” is **satisfied for the accepted demo runtime** by P1-B2 at `66f3f8d27803f5b8d24043639d21b9069f58e77a` (OWN-P1-017): global demo current-user chrome (Sidebar, Command Centre greeting/menu, Action Inbox signed-in, Organisation overview) follows the active identity. This note does **not** rewrite or reopen `P1-B1-OWNER-ACCEPT-2026-08-13`. Production authentication remains outside P1-B2. Act-as chrome under production enforcement remains a later security/authentication consideration (see P1-B2 qualifications).

## P1-B2 qualified owner acceptance (recorded 2026-08-13)

Closing this acceptance record closes **P1-B2 only**. It does **not** authorise P1-B3–P1-B8, resolve `OWN-P1-016`, claim overall Programme P1 completion, or authorise PR / merge / deployment / production. It does **not** authorise automatic progression to P1-B3.

```text
Decision ID: P1-B2-OWNER-ACCEPT-2026-08-13
Date: 2026-08-13
Owner: Programme owner (recorded)
Outcome: Owner accepted with qualifications — P1-B2 CLOSED
         Accepted branch: cursor/p1-b2-shell-truthfulness
         Accepted implementation tip:
         66f3f8d27803f5b8d24043639d21b9069f58e77a
         Implementation sequence:
         d425adaad2ac8f29de893ca0dd996e147ad6febe
         66f3f8d27803f5b8d24043639d21b9069f58e77a
         Source/planning tip:
         300b250f6970ef23254df8630a5fd0145000129e
         Accepted scope: P1-B2 shell truthfulness, inactive-control disposition,
         QA/demo gating and demonstration-identity consistency only
         Validation basis: verified local tests, validators, build, visual harness
         GitHub CI: none — not passed (no Actions checks on branch)
Qualifications (binding):
  - Validation evidence is local only
  - No GitHub CI pass claimed (no GitHub Actions checks)
  - QA/demo tools and activation are forced off under production enforcement
  - Demo Act-as chrome may still render under production-enforcement builds
  - P1-B2 does not constitute production-authentication approval
  - Any production treatment of Act-as chrome remains deferred to the
    appropriate production-authentication/security batch
  - Topbar Export and Enterprise MFA remain unavailable and non-operational
  - Command Centre and Organisation exports remain browser-local demos only
  - No export-processing or reporting backend is accepted
  - Command Centre-only multi-clinic selection remains an accepted P1 difference
  - Shell-wide multi-clinic selection is not accepted or authorised
  - Full WCAG compliance is not claimed
  - Pixel-level Decision A parity remains deferred to its controlled later batch
  - Intermittent Next.js development hot-reload JSON.parse 500 responses remain
    a recorded development-environment limitation
  - OWN-P1-016 remains open
  - P1-B3 through P1-B8 remain separately unauthorised
  - Acceptance does not authorise a PR, merge, deployment or production release
  - Acceptance does not authorise automatic progression to P1-B3
  - Acceptance is not overall Programme P1 acceptance
  - P1-B1 qualifications remain unchanged unless specifically satisfied by
    accepted P1-B2 evidence (Sarah/Neil demo identity: satisfied for demo runtime)
Authorises batch(es): Closure of P1-B2 only (qualified)
Explicitly does NOT authorise: P1-B3–P1-B8; automatic progression; PR; merge;
         deploy; production; SQL; MFA/IdP; export backend; shell-wide multi-select;
         M25; PPA; payments; patient/clinical functionality; OWN-P1-016 resolution;
         WCAG/security certification; overall Programme P1 completion
Evidence pointer: docs/audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md;
                  docs/audits/p1/b2-shell-truthfulness/;
                  P1_EXECUTION_BATCHES.md; branch cursor/p1-b2-shell-truthfulness
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

**P1-B2 status:** Owner accepted with qualifications and **closed** (2026-08-13) at `66f3f8d27803f5b8d24043639d21b9069f58e77a` (`P1-B2-OWNER-ACCEPT-2026-08-13`). OWN-P1-006/007 (B3 register hygiene) are **closed 2026-08-13** as disposition only — **P1-B3 remains unauthorised**. OWN-P1-016 and deferred P1A/P1C decisions remain as registered. **P1-B3–P1-B8 remain unauthorised.**

## P1-B3 register-hygiene owner decisions (recorded 2026-08-13) — decision closure only

Closing OWN-P1-006 and OWN-P1-007 records the owner’s register/navigation honesty dispositions for a future **P1-B3**. These closures do **not** authorise P1-B3 implementation, start coding, PR, merge, deployment, or automatic progression. Gaps remain open until implemented and accepted evidence exists. Briefing: [`P1_B3_OWNER_DECISION_BRIEFING.md`](./P1_B3_OWNER_DECISION_BRIEFING.md).

### OWN-P1-006 — Approved / closed (2026-08-13)

```text
Decision ID: OWN-P1-006
Date: 2026-08-13
Owner: Programme owner (recorded)
Selected option: Option A — Synchronise
Outcome: Approved and closed — Synchronise M11 module-register metadata with the
         verified TrainingWorkspace / Wave 3 implementation reality.
         Update the registered section list to the verified runtime sections.
         Replace condition legacy-html-fallback with strong-existing (existing valid
         ImplementationCondition; label “Strong existing module”), as a metadata /
         register correction only.
Qualifications / interpretation:
  - Metadata/register correction only — not a new M11 implementation
  - Preserve the Wave 3 freeze and historical Wave 3 evidence
  - Do not claim production approval, domain expansion, or acceptance beyond
    existing Wave 3 evidence
  - Do not modify M11 application/domain behaviour under this decision alone
  - Gaps are NOT closed by this decision; implementation + acceptance evidence required
Affected gaps (disposition guidance only — gaps NOT closed): P1-GAP-011
Authorises: Register/section/condition synchronisation disposition for a future
         authorised P1-B3
Explicitly does NOT authorise: P1-B3 implementation; M11 domain changes; production;
         PR; merge; deploy; automatic progression; OWN-P1-016 resolution
Evidence pointer: P1_B3_OWNER_DECISION_BRIEFING.md; P1-GAP-011;
         module-register.ts (M11); TrainingWorkspace.tsx; Wave 3 M11 acceptance docs
Dependencies: After P1-B1/B2 closed; pairs with OWN-P1-007 before B3 authorisation
```

### OWN-P1-007 — Approved / closed (2026-08-13)

```text
Decision ID: OWN-P1-007
Date: 2026-08-13
Owner: Programme owner (recorded)
Selected option: Option A — Honesty-only labels
Outcome: Approved and closed — Authorise truthful M07 History and Adjustments
         metadata and documentation labelling only.
         History must be described as planned/non-operational where that remains
         the verified state.
         Adjustments must be described as the existing adjustment-preparation /
         foundation capability, not as an authorised or complete PPA product.
         Remove or qualify wording such as “PPA-1 foundation” where it could imply
         PPA product approval.
         Unlock/reopen is not equivalent to prior-period adjustment processing.
Qualifications / interpretation:
  - Honesty labelling only — not PPA product implementation
  - OWN-P1-011 remains open and continues to govern any future PPA product decision
  - No payment execution, M08 doctor pay, statutory/tax/award/super certification,
    or production approval is authorised
  - Preserve OWN-PPA-SEPARATE (PPA separately authorised; unlock ≠ PPA)
  - Gaps are NOT closed by this decision; implementation + acceptance evidence required
Affected gaps (disposition guidance only — gaps NOT closed): P1-GAP-012, P1-GAP-079
Authorises: History/Adjustments honesty-labelling disposition for a future
         authorised P1-B3
Explicitly does NOT authorise: P1-B3 implementation; OWN-P1-011 / PPA product;
         payment; M08; certification; PR; merge; deploy; production;
         automatic progression
Evidence pointer: P1_B3_OWNER_DECISION_BRIEFING.md; P1-GAP-012; P1-GAP-079;
         CONF-P1C-006; section-meta.ts; AdjustmentsSection.tsx; PlannedSection.tsx;
         WAVE6_M07_PPA_READINESS_AND_DESIGN.md
Dependencies: Distinct from OWN-P1-011; after P1-B1/B2 closed; pairs with OWN-P1-006
```

**P1-B3 status after these closures:** Decision blockers OWN-P1-006/007 are **closed**. Express P1-B3 implementation was authorised, remediated and **owner accepted with qualifications — CLOSED (2026-08-13)** at `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`P1-B3-OWNER-ACCEPT-2026-08-13`). Gap dispositions recorded below. **P1-B4 was later authorised, implemented and owner-accepted separately.**

## P1-B3 qualified owner acceptance (recorded 2026-08-13)

Closing this acceptance record closes **P1-B3 only**. It does **not** authorise P1-B4–P1-B8, resolve `OWN-P1-011` or `OWN-P1-016`, claim overall Programme P1 completion, or authorise PR / merge / deployment / production. It does **not** authorise automatic progression to P1-B4.

```text
Decision ID: P1-B3-OWNER-ACCEPT-2026-08-13
Date: 2026-08-13
Owner: Programme owner (recorded)
Outcome: Owner accepted with qualifications — P1-B3 CLOSED
         Accepted branch: cursor/p1-b3-register-hygiene
         Accepted implementation tip:
         2515a4ffac0fb94cbd37092e26bf372cb43898f8
         Implementation sequence:
         a80405dd79dc180c1d2b3ffa470e9db219ff3b3c
         2515a4ffac0fb94cbd37092e26bf372cb43898f8
         Source/planning tip:
         4c84263ca27f7a23e71c5304cff4249e0d132e50
         Accepted scope: P1-B3 register hygiene and payroll-history
         truthfulness only (OWN-P1-006 / OWN-P1-007)
         Validation basis: verified local tests, validators, build, visual harness
         GitHub CI: none — not passed (no Actions checks on branch)
Accepted OWN-P1-006 / M11:
  - Metadata synchronised with verified 11-section TrainingWorkspace NAV
  - Condition legacy-html-fallback → strong-existing
  - Legacy aliases records→assignments and expiry→certificates accepted
  - Related register references remapped consistently
  - Metadata/register correction only; Wave 3 frozen; not production approval;
    no new M11 domain functionality
Accepted OWN-P1-007 / M07:
  - History truthfully planned/non-operational; keyboard-reachable explanation;
    activation blocked
  - Adjustments = adjustment preparation/foundation only
  - Unlock/reopen is not PPA processing
  - No PPA product, payment, M08, certification, posting, amended-payroll or
    recalculation workflow accepted or authorised
  - OWN-P1-011 remains open
Gap disposition at acceptance:
  - P1-GAP-011 Closed — accepted M11 register synchronisation scope
  - P1-GAP-012 Partial — History honesty/nav alignment closed; residual
    operational History Future/P2+
  - P1-GAP-013 Closed — supersession banner accepted; historic body preserved;
    Wave re-audit remains preferred SoT
  - P1-GAP-014 Partial — SHARED honesty/register subset closed; bulk
    unresolved≈298 deferred to P2+
  - P1-GAP-015 Partial — ModuleLanding/placeholder honesty closed; residual
    real domain builds for placeholders remain Future
  - P1-GAP-079 Partial — Adjustments/PPA honesty boundary closed; residual
    PPA product under OWN-P1-011
Qualifications (binding):
  1. Validation is local-only; GitHub Actions and check-runs are absent
  2. No GitHub CI pass is claimed
  3. No pixel-parity claim is made
  4. No full WCAG compliance claim is made
  5. M11 strong-existing does not mean production-approved
  6. Wave 3 remains frozen; no new M11 domain expansion is accepted
  7. History remains planned/non-operational
  8. Adjustments remain preparation/foundation functionality only
  9. Unlock/reopen is not PPA processing
  10. No PPA product is accepted or authorised
  11. OWN-P1-011 remains open
  12. OWN-P1-016 remains open
  13. Bulk workflow-mapping residual remains deferred to P2+
  14. Historic parity-register Markdown hard-break trailing spaces remain a
      known pre-existing limitation
  15. Archived a80405dd… evidence is retained for traceability; remediated
      evidence at 2515a4ff… is authoritative
  16. No production approval is granted
  17. P1-B4 through P1-B8 remain unauthorised
  18. No automatic progression is permitted
  19. No PR, merge or deployment is authorised
  20. This is not overall Programme P1 acceptance
Authorises batch(es): Closure of P1-B3 only (qualified)
Explicitly does NOT authorise: P1-B4–P1-B8; automatic progression; PR; merge;
         deploy; production; SQL; PPA product; payment; M08; M25;
         OWN-P1-011 / OWN-P1-016 resolution; WCAG/security certification;
         overall Programme P1 completion; new M11 domain expansion
Evidence pointer: docs/audits/p1/P1_B3_IMPLEMENTATION_EVIDENCE.md;
                  docs/audits/p1/P1_B3_REMEDIATION_EVIDENCE.md;
                  docs/audits/p1/b3-register-hygiene/;
                  P1_EXECUTION_BATCHES.md; branch cursor/p1-b3-register-hygiene
```

## P1-B4 qualified owner acceptance (recorded 2026-08-14)

Closing this acceptance record closes **P1-B4 only**. It does **not** authorise P1-B5–P1-B8, resolve `OWN-P1-011` or `OWN-P1-016`, claim overall Programme P1 completion, or authorise PR / merge / deployment / production. It does **not** authorise automatic progression to P1-B5. It does **not** integrate Aurora.

```text
Decision ID: P1-B4-OWNER-ACCEPT-2026-08-14
Date: 2026-08-14
Owner: Programme owner (recorded)
Outcome: Owner accepted with qualifications — P1-B4 CLOSED
         Accepted branch: cursor/p1-b4-responsive-a11y-appearance
         Accepted implementation tip:
         c58f2843d47b6fa875cd155d166c1f7c916d5250
         Source tip:
         c5d919cc2921ab43949b37cad499e29a79cfa6b0
         Accepted scope: P1-B4 responsive, accessibility, reduced-motion
         and System-appearance hardening only (gaps 008/009/031/052/074)
         Validation basis: verified local tests, validators, production build,
         Chromium/Playwright production-runtime harness
         GitHub CI: none — workflows=0; check-runs=0; status-contexts=0;
         no CI pass claimed
Accepted P1-GAP-008:
  - System is the truthful default appearance state
  - Stored Light/Dark/System settle correctly
  - System+OS Light and System+OS Dark separately proven
  - OS changes update System without overriding explicit Light/Dark
  - Cross-tab appearance updates and listener cleanup accepted
  - No production or cross-browser certification implied
Accepted P1-GAP-009:
  - Shared shell keyboard/focus baselines accepted
  - Mobile nav forward/reverse focus containment accepted
  - Escape and overlay dismissal accepted
  - Exact trigger focus restoration accepted
  - Drawer/DetailPanel focus containment/restoration accepted for tested P1 scope
  - Module section navigation uses navigation + aria-current (not invalid tabs)
  - Required ARIA state and keyboard interaction evidence accepted
Accepted P1-GAP-031 (partial):
  - Responsive shell behaviour accepted for tested P1 surfaces at
    1440/1280/1024/768/430/390
  - Mobile open/closed geometry, inert, overlay and overflow evidence accepted
  - Menu/close controls objectively meet 44×44px at 390 and 430
  - Residual: module-specific responsive work outside tested P1 scope
Accepted P1-GAP-052 (partial):
  - Shared P1 reduced-motion hardening accepted
  - Normal and reduced-motion evidence accepted
  - Residual: broader platform-wide reduced-motion / full WCAG motion certification
Accepted P1-GAP-074:
  - Historical M04/M05/M07 appearance/hydration observations re-verified
  - No shared P1-B4 hydration defect remains on tested routes
  - No M04/M05/M07 domain behaviour accepted or changed
Gap disposition at acceptance:
  - P1-GAP-008 Closed — P1 System appearance/hydration scope
  - P1-GAP-009 Closed — P1 shared-shell keyboard/focus scope
  - P1-GAP-031 Partial — tested P1 shell/shared surfaces closed;
    module-specific residual retained
  - P1-GAP-052 Partial — shared P1 reduced-motion closed;
    platform-wide residual retained
  - P1-GAP-074 Closed — historical observation re-verified;
    no domain acceptance implied
Qualifications (binding):
  1. Validation is local-only
  2. GitHub workflow count is zero
  3. GitHub check-run count is zero
  4. GitHub status-context count is zero
  5. No GitHub CI pass is claimed
  6. No full WCAG compliance is claimed
  7. No pixel-parity claim is made
  8. Evidence is based primarily on Chromium/Playwright production-runtime testing
  9. Cross-browser and assistive-technology certification remains outside this acceptance
  10. Full platform-wide 200%/400% zoom certification is not claimed
  11. The 24 lint warnings remain verified parent-lineage warnings; no lint errors remain
  12. Intentional CRLF parent-lineage files can produce raw git diff --check CR-at-EOL
      output; semantic inspection found no genuine trailing whitespace defect
  13. P1-GAP-031 retains any module-specific responsive residual outside tested P1 surfaces
  14. P1-GAP-052 retains any broader platform-wide reduced-motion residual
  15. M04/M05/M07 domain behaviour is unchanged
  16. OWN-P1-011 remains open
  17. OWN-P1-016 remains open
  18. Aurora remains separately approved as a design foundation but unintegrated
  19. Aurora integration into P1 remains unauthorised
  20. P1-B5 through P1-B8 remain unauthorised
  21. No automatic progression is permitted
  22. No production approval is granted
  23. No PR, merge or deployment is authorised
  24. This is not overall Programme P1 acceptance
Authorises batch(es): Closure of P1-B4 only (qualified)
Explicitly does NOT authorise: P1-B5–P1-B8; automatic progression; PR; merge;
         deploy; production; SQL; PPA product; payment; M08; M25;
         OWN-P1-011 / OWN-P1-016 resolution; WCAG/security/AT certification;
         Aurora integration; overall Programme P1 completion
Evidence pointer: docs/audits/p1/P1_B4_IMPLEMENTATION_EVIDENCE.md;
                  docs/audits/p1/b4-responsive-a11y-appearance/;
                  P1_EXECUTION_BATCHES.md;
                  branch cursor/p1-b4-responsive-a11y-appearance
```

## P1-B5 qualified owner acceptance (recorded 2026-08-17)

Closing this acceptance record closes **P1-B5 only**. It does **not** authorise durable M01/M02 services, P1-B6–P1-B8, resolve `OWN-P1-009`, `OWN-P1-011` or `OWN-P1-016`, claim overall Programme P1 completion, or authorise PR / merge / deployment / production. It does **not** authorise automatic progression to P1-B6. It does **not** integrate Aurora.

```text
Decision ID: P1-B5-OWNER-ACCEPT-2026-08-17
Date: 2026-08-17
Owner: Programme owner (recorded)
Outcome: Owner accepted with qualifications — P1-B5 CLOSED
         Accepted branch: cursor/p1-b5-m01-m02-presentation
         Accepted implementation tip:
         4306116fdf28f9d90a989d8ec78b317ad351b0d2
         Source tip:
         ef66e3fa9aadaa3507ccf16d07aac3cbc7b5c577
         Accepted scope: M01/M02 Decision A presentation and honesty only
         (gaps 020/021/066/067/068 within accepted presentation scope)
         Validation basis: verified local tests, validators, production build,
         Chromium/Playwright production-runtime harness
         GitHub CI: none — workflows=0; check-runs=0; status-contexts=0;
         no CI pass claimed
Accepted M01 presentation scope:
  - Decision A presentation; shared PageHeader; one page-level heading
  - Local/demo-data honesty; metric/period/clinic/source attribution
  - “vs yesterday” demonstration/local qualification
  - Attention items (owner, reason, due, action); demo-qualified toasts
  - Honest operational-source navigation
  - Loading / empty / error / QA permission-unavailable presentation
  - Responsive and appearance evidence for tested P1 surfaces
  - Patient/clinical firewall preserved
  - M01 domain remains NOT-STARTED
Accepted M02 presentation scope:
  - Decision A presentation; local/demo queue and summary honesty
  - Search/filter; no-selection and selected-detail; selection semantics
  - Escape and focus restoration; filtered/view empty; loading
  - Sensitivity-restricted without summary leakage
  - Planned/unavailable Email/SMS; demo-qualified outcomes
  - Best Practice / operational source wording
  - 27 independently enumerated control classifications
  - Mobile stacked presentation; patient/clinical firewall preserved
  - M02 domain remains NOT-STARTED
Gap disposition at acceptance:
  - P1-GAP-020 Closed — accepted M01 Decision A presentation scope;
    durable M01 domain remains P2+
  - P1-GAP-021 Closed — accepted M02 Decision A presentation scope;
    durable M02 domain remains P2+
  - P1-GAP-066 Partial — M01/M02 filter/search presentation accepted;
    broader M03/module consistency residual retained
  - P1-GAP-067 Partial — M01/M02 drill-down/detail presentation accepted;
    broader cross-module and M03 consistency residual retained
  - P1-GAP-068 Partial — M01/M02 alert/notification chrome honesty accepted;
    durable M02 notifications remain P2+
Unsupported-state residuals (not accepted functionality):
  1. M01 true route-level access denial unsupported (QA permission card only)
  2. M02 true route-level access denial unsupported
  3. M02 stable true-empty inbox without reseeding unsupported
  4. Filtered/view empty is not durable true-empty inbox evidence
  5. Error evidence limited to source-verified/supported mechanism
  6. Residuals documented for later state/permission work (incl. P1-B7)
Qualifications (binding):
  1. Validation is local-only
  2. GitHub workflow count is zero
  3. GitHub check-run count is zero
  4. GitHub status-context count is zero
  5. No GitHub CI pass is claimed
  6. No full WCAG compliance is claimed
  7. No pixel-parity claim is made
  8. Evidence is primarily Chromium/Playwright production-runtime evidence
  9. M01 domain remains NOT-STARTED
  10. M02 domain remains NOT-STARTED
  11. No durable API or database service was added
  12. M01 metrics and comparisons remain local/demo presentation data
  13. M02 queue/actions remain local/demo presentation behaviour
  14. M01 route-level access-denied evidence is unsupported
  15. M02 route-level access-denied evidence is unsupported
  16. M02 stable true-empty inbox without reseeding is unsupported
  17. Filtered/view empty states are not durable true-empty inbox evidence
  18. Email/SMS remains planned and not live
  19. Durable M01–M03 services remain governed by OWN-P1-009
  20. OWN-P1-009 remains open
  21. OWN-P1-011 remains open
  22. OWN-P1-016 remains open
  23. Best Practice remains the clinical source of record
  24. No patient or clinical-record functionality is accepted
  25. P1-GAP-066 retains broader M03/cross-module residuals
  26. P1-GAP-067 retains broader M03/cross-module residuals
  27. P1-GAP-068 retains durable-notification residuals
  28. The 24 lint warnings remain verified parent-lineage warnings;
      no lint errors remain
  29. Aurora remains parked and unintegrated
  30. P1-B6 through P1-B8 remain unauthorised
  31. No automatic progression is permitted
  32. No production approval is granted
  33. No PR, merge or deployment is authorised
  34. This is not overall Programme P1 acceptance
Authorises batch(es): Closure of P1-B5 only (qualified)
Explicitly does NOT authorise: durable M01/M02 services; P1-B6–P1-B8;
         automatic progression; PR; merge; deploy; production; SQL;
         PPA product; payment; M08; M25; OWN-P1-009 / OWN-P1-011 /
         OWN-P1-016 resolution; WCAG/security/AT certification;
         Aurora integration; overall Programme P1 completion
Evidence pointer: docs/audits/p1/P1_B5_IMPLEMENTATION_EVIDENCE.md;
                  docs/audits/p1/b5-m01-m02-presentation/;
                  P1_EXECUTION_BATCHES.md;
                  branch cursor/p1-b5-m01-m02-presentation
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

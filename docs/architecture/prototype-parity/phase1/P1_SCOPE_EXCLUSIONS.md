# P1 Scope Exclusions

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`  
**Rule:** Items below are **not** recommended P1 implementation work and must not be smuggled in via “parity”.

## Hard exclusions

| Exclusion | Why | Authority |
| --- | --- | --- |
| M25 print fleet | Parked; not in M01–M24 runtime | `cursor/m25-future-planning`; gap 062 |
| PPA product implementation | Separate authorisation; unlock ≠ PPA | OWN-PPA-SEPARATE; `docs/plans/WAVE6_M07_PPA_*` |
| Payment execution / bank file / STP / super / mark-as-paid / Xero production | Product boundary | OWN-NO-PAY-EXEC |
| Patient records, appointments, arrival processing, clinical notes, prescriptions, referrals | Clinical SoT forbidden | OWN-PATIENT-FIREWALL; firewall doc |
| Patient billing / Medicare claims | Clinical/billing boundary | Firewall |
| Best Practice / clinical-system function duplication | Not Doctors Pulse SoT | Firewall; gap 059 |
| New modules beyond M01–M24 | Out of programme register | module-register |
| DB redesign | Not required for verified P1 gaps | Owner brief |
| Dependency upgrades | Unrelated to parity | Owner brief |
| Production secrets / live integrations | Env/secrets out of scope | `.env.local` ignored |
| Production deployment / PR / merge | Not authorised by this pack | Stop checkpoint |
| Unrelated visual redesign | Decision A + contract only | DEC-BRANDED-THEMES; design contract |
| Speculative features | No source ID | Firewall precedence |
| Historical P0 evidence alteration | Preserve tip `b0c4c4d20…` | Owner brief |
| Doctor pay (M08) rebuild inside P1 | Future P6 | Wave control |
| Claiming production approval | Axis 5 separate | GLOBAL acceptance design |

## Explicitly deferred (not excluded forever — just not P1 build)

| Item | Target |
| --- | --- |
| M01–M03 durable domain/workflows | Programme P2 |
| M10 connective unblock | Programme P3 |
| M12–M16 rebuilds | P4–P5 |
| M08/M09/M24 finance rebuilds | P6 (+ separate PPA) |
| M17–M19 | P7 |
| M20–M23 | P8 |
| Production verification | P9 |

## Anti-patterns (do not count as “done”)

- Route exists  
- Heading / ModuleLanding exists  
- Demo card / inactive control exists  
- Placeholder section chip exists  
- Prompt file exists (`prompts/p1.md`)  
- Owner UI acceptance of a prior wave  

## Recommended P1 inclusions (contrast)

Only verified shell/presentation/hygiene/evidence gaps with source + gap ID + acceptance method — see [batches](./P1_EXECUTION_BATCHES.md) and [recommended first batch](./P1_RECOMMENDED_FIRST_BATCH.md).

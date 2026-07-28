# Wave 6 Planning Checkpoint — Stop Before Execution

**Date:** 28 July 2026  
**Amendment:** Batches 1–4 complete — **final pre-execution readiness report ready**  
**Execution:** NOT approved · **Commit/push:** NOT authorised (approved in principle only — Q24)

## Status

| Field | Value |
|---|---|
| Planning only | **true** |
| Execution approved | **false** |
| Documentation commit in principle | **true** |
| Documentation commit authorised | **false** (await separate instruction) |
| `BLOCKED-M07` | **Unresolved** |
| CSS rewrite | **Not authorised** |
| Controlling plan | `docs/architecture/WAVE6_M07_IMPLEMENTATION_PLAN.md` |
| Parity register | `docs/architecture/HCDP_PROTOTYPE_PARITY_REGISTER.md` |

## Batch 4 decisions (binding)

19. External payroll employee id on org-scoped M07 pay profile; M04 identity read-only; audited relink; no bank/tax fields.  
20. Lock = Pay approver or Pay admin only; Export operator cannot lock; full preconditions + audit.  
21. Approve Location CONSOLIDATED into final approval + clinic readiness (no separate state).  
22. Pay admin owns export profiles; operator selects only; history retains profile version; default min-PII.  
23. Prep rules/codes in M07 Settings; M04 classification read-only; Staff-hub award UI RELOCATED.  
24. Docs commit in principle — **not yet**.

## Unresolved owner decisions

**None material to Implementation Batch 1.**

## Unrelated leftovers (exclude from future docs commit)

Tracked modified: `PLATFORM_INTEGRATION_QA.md`, `platform-integration-evidence.json`, `wave3-m11-performance-evidence.json`, `wave4-m05-performance-evidence.json`  
Untracked: `PLATFORM_INTEGRATION_QA.md.bak`

## Next

1. Owner reviews this readiness report.  
2. Separate explicit instruction → documentation-only commit/push.  
3. Separate explicit instruction → Wave 6 execution (if/when).  

Do not implement M07. Do not write `pulse.m07.*`. Do not alter frozen Waves 1A–5. Do not rewrite CSS. Do not commit/push under this instruction.

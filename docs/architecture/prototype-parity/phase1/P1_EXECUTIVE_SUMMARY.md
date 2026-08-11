# P1 Executive Summary

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`

## Verdict

A controlled P1 prototype-parity readiness pack is prepared on tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa`. **No implementation is authorised or performed.** As of **2026-08-11**, OWN-P1-001…003 are closed for planning: accepted P0 tip `b0c4c4d20de1cce7adac5d691c506122e30610a2`, SHARED-first scope, first batch **named** **P1-B1**. `OWN-NO-P1-YET` is cleared for programme entry. **P1-B1 remains `P1 — PLANNED, NOT AUTHORISED`.**

## What P1 is (this programme)

P1 is the next controlled prototype-parity phase after Programme Gate P0. It must close **verified** gaps between:

1. Approved prototype + BRD/blueprint requirements  
2. Current production-style `/dashboard` portal application  
3. Authoritative screen / workflow / action / module registers  
4. Existing implemented controls and behaviours  
5. Test and acceptance evidence  

It must **not** become general feature development, visual redesign, M25, PPA, payment processing, or undocumented scope expansion.

## Recommended P1 shape

| Layer | Recommendation | Status |
| --- | --- | --- |
| **Entry gate** | Owner accepts P0 pack tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` (and nested pins) and clears `OWN-NO-P1-YET` | **Closed** OWN-P1-001 (2026-08-11) |
| **Programme P1 (SHARED-first)** | SHARED shell / Decision A foundation first; B2–B8 need separate explicit auth (OWN-P1-002) | Planning closed; **not** implementation auth |
| **Named first batch** | **P1-B1** (OWN-P1-003) | Named only — **unauthorised** |
| **Immediate hygiene (with P1 or first follow-on)** | Register drift corrections (especially M11, M07 history labelling) so readiness scoring cannot invent “implemented” stubs | Planned, not authorised |
| **Beyond P1** | Domain workflows for M01–M07/M11 (Programme P2); M10 (P3); placeholder rebuilds M08/M09/M12–M24 (P4–P8); PPA (separate auth); production verification (P9) | Deferred |

## Baseline gate (this planning run)

| Check | Result |
| --- | --- |
| Starting branch | `cursor/baseline-quality-remediation` @ `9142ec30…` |
| Local = remote | Match |
| Working tree before planning docs | Clean (after restoring test-rewritten evidence JSON) |
| `npx tsc --noEmit` | Pass |
| `npm run lint` | 0 errors, 24 warnings |
| `npm test` | 252 pass / 0 fail |
| `npm run build` | Pass |
| `validate-registers.mjs` | `failures: []` |
| P0 tip preserved | `b0c4c4d20…` |
| M25 parked | `cursor/m25-future-planning` |
| `.env.local` | Ignored; uncommitted |

Detail: [P1_BASELINE_GATE_EVIDENCE.md](./P1_BASELINE_GATE_EVIDENCE.md).

## Gap inventory (high level)

| Classification | Count (this pack) | Notes |
| --- | ---: | --- |
| Blocker | 1 | P1-GAP-001 entry/auth gate — P0 accepted & batch named; **implementation auth still required** (gap inventory unchanged) |
| Major | 12 | Shared Decision A shell conversion; inactive shell truthfulness; register drift; M01–M03 domain absence |
| Moderate | 18 | Missing states/controls on accepted modules; section-mapping debt; a11y/keyboard baselines |
| Minor | 10 | Presentation / density / lower-risk inconsistencies |
| Accepted difference | 6 | Owner-closed themes; ordinary M07 prep vs payment; etc. |
| Future scope | 24 | Placeholder modules M08–M10/M12–M24 rebuilds; full domain waves |
| Not applicable | 4 | M25 absent; production deployment; etc. |
| Duplicate / prohibited clinical | 8 | Patient/clinical/BP/payment/PPA exclusions |

**Total gap rows:** 83 (see [gap register](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md)).

## Proposed batches

Eight planned batches (all `P1 — PLANNED, NOT AUTHORISED`):

1. **P1-B1** — SHARED Decision A shell foundation (recommended first)  
2. **P1-B2** — Shell truthfulness + inactive-control remediation  
3. **P1-B3** — Register / navigation hygiene (M11, M07 labels, placeholder honesty)  
4. **P1-B4** — Shared responsive / a11y / appearance evidence hardening  
5. **P1-B5** — M01/M02 chrome parity against Decision A (no domain services)  
6. **P1-B6** — Accepted-module final-design apply (M04–M07/M11) — presentation only, preserve domain  
7. **P1-B7** — Permission / audit / empty-loading-error-denied state completeness on SHARED + accepted modules  
8. **P1-B8** — P1 closure evidence pack + owner stop checkpoint  

Domain workflow completion remains **Programme P2+**, not these batches.

## Owner decisions

**Closed 2026-08-11 (planning only):** OWN-P1-001 (P0 tip accepted; `OWN-NO-P1-YET` cleared), OWN-P1-002 (SHARED-first), OWN-P1-003 (name **P1-B1** — not authorised).

**Still required before implementation:** Express authorisation of **P1-B1** (separate from naming). Then later: OWN-P1-004…008 for B2/B3; **OWN-P1-016** before production data path.

See [P1_OWNER_DECISION_REGISTER.md](./P1_OWNER_DECISION_REGISTER.md).

## Explicit non-claims

- Not production-approved  
- Not payment-ready  
- Not PPA-authorised  
- Not M25  
- Not an implementation authorisation  
- Historical P0 evidence not altered  

**Final pack claim:** `P1 owner decisions recorded and the validated documentation-only planning pack prepared for publish — P1-B1 remains unauthorised and no implementation was performed`

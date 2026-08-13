# P1 Executive Summary

**Stamp:** **P1-B1** owner accepted with qualifications and **closed** (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. **P1-B2–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`. Overall Programme P1 is **not** complete or production-approved.

## Verdict

A controlled P1 prototype-parity readiness pack was prepared on tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa`. As of **2026-08-11**, OWN-P1-001…003 closed for planning: accepted P0 tip `b0c4c4d20de1cce7adac5d691c506122e30610a2`, SHARED-first scope, first batch **named** **P1-B1**. `OWN-NO-P1-YET` cleared for programme entry.

As of **2026-08-13**, **P1-B1** is **owner accepted with qualifications** and **closed** at implementation tip `fdb2beb5b0e786e42d358efa9875b6bba52666cd` (local validation basis; no GitHub CI). This does **not** authorise P1-B2–P1-B8, PR/merge/deploy, production, or automatic progression. `OWN-P1-016` remains **open**.

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
| **Programme P1 (SHARED-first)** | SHARED shell / Decision A foundation first; B2–B8 need separate explicit auth (OWN-P1-002) | Planning closed; B2–B8 still **not** authorised |
| **Named first batch** | **P1-B1** (OWN-P1-003) | **Owner accepted with qualifications — CLOSED (2026-08-13)** at `fdb2beb…` |
| **Immediate hygiene (with P1 or first follow-on)** | Register drift corrections (especially M11, M07 history labelling) so readiness scoring cannot invent “implemented” stubs | Planned, **not authorised** (P1-B3) |
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
| Blocker | 1 | P1-GAP-001 entry/auth gate — P0 accepted & batch named; B1 now accepted with qualifications |
| Major | 12 | Shared Decision A shell conversion (B1 closed); inactive shell truthfulness; register drift; M01–M03 domain absence |
| Moderate | 18 | Missing states/controls on accepted modules; section-mapping debt; a11y/keyboard baselines |
| Minor | 10 | Presentation / density / lower-risk inconsistencies |
| Accepted difference | 6 | Owner-closed themes; ordinary M07 prep vs payment; etc. |
| Future scope | 24 | Placeholder modules M08–M10/M12–M24 rebuilds; full domain waves |
| Not applicable | 4 | M25 absent; production deployment; etc. |
| Duplicate / prohibited clinical | 8 | Patient/clinical/BP/payment/PPA exclusions |

**Total gap rows:** 83 (see [gap register](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md)). P1-B1 gap set disposition: 002/003/049/051 closed for B1; 004 partial; 010 partial / not closed.

## Proposed batches

Eight batches remain accounted for:

1. **P1-B1** — SHARED Decision A shell foundation — **owner accepted with qualifications — CLOSED (2026-08-13)**  
2. **P1-B2** — Shell truthfulness + inactive-control remediation — `P1 — PLANNED, NOT AUTHORISED`  
3. **P1-B3** — Register / navigation hygiene (M11, M07 labels, placeholder honesty) — unauthorised  
4. **P1-B4** — Shared responsive / a11y / appearance evidence hardening — unauthorised  
5. **P1-B5** — M01/M02 chrome parity against Decision A (no domain services) — unauthorised  
6. **P1-B6** — Accepted-module final-design apply (M04–M07/M11) — presentation only, preserve domain — unauthorised  
7. **P1-B7** — Permission / audit / empty-loading-error-denied state completeness — unauthorised  
8. **P1-B8** — P1 closure evidence pack + owner stop checkpoint — unauthorised  

Domain workflow completion remains **Programme P2+**, not these batches. **No automatic progression** from B1 acceptance.

## Owner decisions

**Closed 2026-08-11 (planning only):** OWN-P1-001 (P0 tip accepted; `OWN-NO-P1-YET` cleared), OWN-P1-002 (SHARED-first), OWN-P1-003 (name **P1-B1**).

**Closed 2026-08-13 (qualified batch acceptance):** P1-B1 at `fdb2beb5b0e786e42d358efa9875b6bba52666cd` — see `P1-B1-OWNER-ACCEPT-2026-08-13` in the owner-decision register.

**Still open / unauthorised:** OWN-P1-006…007 (B3); OWN-P1-009…015 (deferred); **OWN-P1-016** before production data path; P1-B2–P1-B8 implementation.

**Closed 2026-08-13 (decision disposition only — not batch auth):** OWN-P1-004, OWN-P1-005, OWN-P1-008, OWN-P1-017. P1-B2 remains `P1 — PLANNED, NOT AUTHORISED` pending a separate express implementation authorisation.

See [P1_OWNER_DECISION_REGISTER.md](./P1_OWNER_DECISION_REGISTER.md).

## Explicit non-claims

- Not overall Programme P1 complete  
- Not production-approved  
- Not payment-ready  
- Not PPA-authorised  
- Not M25  
- Not GitHub CI green  
- Not pixel-parity complete  
- Not automatic authorisation of B2–B8  
- Historical P0 evidence not altered  

**Current programme claim:** `P1-B1 qualified owner acceptance recorded and published — P1-B2 through P1-B8 remain unauthorised, with no merge or deployment performed`

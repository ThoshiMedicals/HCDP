# P1 Executive Summary

**Stamp:** **P1-B1** and **P1-B2** owner accepted with qualifications and **closed** (2026-08-13). Accepted tips: P1-B1 `fdb2beb5b0e786e42d358efa9875b6bba52666cd`; P1-B2 `66f3f8d27803f5b8d24043639d21b9069f58e77a`. **OWN-P1-006** / **OWN-P1-007** closed. **P1-B3** authorised and implemented — **owner acceptance pending**. **P1-B4–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`. Overall Programme P1 is **not** complete or production-approved.

## Verdict

A controlled P1 prototype-parity readiness pack was prepared on tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa`. As of **2026-08-11**, OWN-P1-001…003 closed for planning: accepted P0 tip `b0c4c4d20de1cce7adac5d691c506122e30610a2`, SHARED-first scope, first batch **named** **P1-B1**. `OWN-NO-P1-YET` cleared for programme entry.

As of **2026-08-13**, **P1-B1** is **owner accepted with qualifications** and **closed** at implementation tip `fdb2beb5b0e786e42d358efa9875b6bba52666cd`, and **P1-B2** is **owner accepted with qualifications** and **closed** at tip `66f3f8d27803f5b8d24043639d21b9069f58e77a` (local validation basis; no GitHub CI). OWN-P1-006 and OWN-P1-007 are **closed** the same day as register-hygiene dispositions only. This does **not** authorise P1-B3–P1-B8, PR/merge/deploy, production, or automatic progression. `OWN-P1-011` and `OWN-P1-016` remain **open**.

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
| **Programme P1 (SHARED-first)** | SHARED shell / Decision A foundation first; B3–B8 need separate explicit auth (OWN-P1-002) | Planning closed; B1/B2 closed with qualifications; B3–B8 still **not** authorised |
| **Named first batch** | **P1-B1** (OWN-P1-003) | **Owner accepted with qualifications — CLOSED (2026-08-13)** at `fdb2beb…` |
| **Immediate hygiene (with P1 or first follow-on)** | Register drift corrections (especially M11, M07 history labelling) so readiness scoring cannot invent “implemented” stubs | **P1-B3 implemented — owner acceptance pending** |
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
2. **P1-B2** — Shell truthfulness + inactive-control remediation — **owner accepted with qualifications — CLOSED (2026-08-13)**  
3. **P1-B3** — Register / navigation hygiene (M11, M07 labels, placeholder honesty) — **authorised & implemented; owner acceptance pending**  
4. **P1-B4** — Shared responsive / a11y / appearance evidence hardening — unauthorised  
5. **P1-B5** — M01/M02 chrome parity against Decision A (no domain services) — unauthorised  
6. **P1-B6** — Accepted-module final-design apply (M04–M07/M11) — presentation only, preserve domain — unauthorised  
7. **P1-B7** — Permission / audit / empty-loading-error-denied state completeness — unauthorised  
8. **P1-B8** — P1 closure evidence pack + owner stop checkpoint — unauthorised  

Domain workflow completion remains **Programme P2+**, not these batches. **No automatic progression** from B3 implementation.

## Owner decisions

**Closed 2026-08-11 (planning only):** OWN-P1-001 (P0 tip accepted; `OWN-NO-P1-YET` cleared), OWN-P1-002 (SHARED-first), OWN-P1-003 (name **P1-B1**).

**Closed 2026-08-13 (qualified batch acceptance):** P1-B1 at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`; P1-B2 at `66f3f8d27803f5b8d24043639d21b9069f58e77a`.

**Closed 2026-08-13 (decision disposition):** OWN-P1-004, OWN-P1-005, OWN-P1-008, OWN-P1-017 (B2 honesty); **OWN-P1-006** (Option A Synchronise), **OWN-P1-007** (Option A Honesty-only labels).

**P1-B3 (2026-08-13):** Expressly authorised and **implemented** on `cursor/p1-b3-register-hygiene` — **owner acceptance pending**. Gaps 011/012/013/014*/015/079 addressed by implementation but **not closed** until acceptance.

**Still open / unauthorised:** OWN-P1-009…015 (deferred; includes **OWN-P1-011** PPA product); **OWN-P1-016** before production data path; P1-B4–P1-B8 implementation.

See [P1_OWNER_DECISION_REGISTER.md](./P1_OWNER_DECISION_REGISTER.md).

## Explicit non-claims

- Not overall Programme P1 complete  
- Not production-approved  
- Not payment-ready  
- Not PPA-authorised  
- Not M25  
- Not GitHub CI green  
- Not pixel-parity complete  
- Not automatic authorisation of B4–B8  
- Historical P0 evidence not altered  

**Current programme claim:** `P1-B3 register hygiene and payroll-history truthfulness implemented, validated and published for owner review — owner acceptance remains pending and no later batch, merge or deployment was authorised or performed.`

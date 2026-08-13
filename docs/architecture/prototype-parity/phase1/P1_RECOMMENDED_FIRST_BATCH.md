# Recommended First Implementation Batch

**Stamp:** **P1-B1** owner accepted with qualifications and **closed** (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`  
**Recommendation (historical):** **P1-B1 — SHARED Decision A shell foundation**  
**Later batches:** P1-B2–P1-B8 remain `P1 — PLANNED, NOT AUTHORISED` — no automatic progression

## Why B1 first

1. Matches existing Programme Wave P1 definition in `prompts/p1.md` and the dependency-led roadmap.  
2. Unlocks consistent chrome for all later module presentation work (B5/B6).  
3. Addresses multi-module blockers before permission/state and lower-risk polish.  
4. Avoids domain churn on frozen waves M04–M07/M11.  
5. Keeps patient/PPA/payment/M25/M08–M24 rebuilds out.

## Entry gate (all must be true)

| # | Gate | Status (as of 2026-08-13) |
| ---: | --- | --- |
| 1 | Owner accepts P0 pack and clears `OWN-NO-P1-YET` (OWN-P1-001) | **Met** — closed OWN-P1-001; tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` |
| 2 | Owner confirms P1 scope decision OWN-P1-002 | **Met** — SHARED-first; B2–B8 separate auth |
| 3 | Owner expressly names batch **P1-B1** (OWN-P1-003) | **Met (naming)** |
| 4 | Start tip clean; `tsc` / lint / tests / build / register validator green | **Met** at implementation and acceptance evidence |
| 5 | Decision A PNGs remain installed hash-OK | **Met** |
| 6 | No M25 / PPA / payment / patient work included | **Met** — remains in force |
| 7 | Owner **expressly authorises** / accepts batch **P1-B1** | **Met with qualifications** — accepted tip `fdb2beb5b0e786e42d358efa9875b6bba52666cd` (2026-08-13) |

## In scope when authorised

| Area | Change type |
| --- | --- |
| Design tokens / CSS variables | Align to `design-system-contract.json` |
| Sidebar / topbar / section nav / page header | Contract dimensions + structure |
| Shared KPI / toolbar / detail-panel primitives | Introduce/align shared primitives |
| Appearance L/D/S | Preserve System default + persistence |
| Screenshot harness smoke | Contract viewports/regions |
| Automated theme/shell tests | Named tests from `prompts/p1.md` §9 |

**Gap IDs:** 002, 003, 004, 010 (start), 049, 051.

## Out of scope even if B1 is named / accepted

- M01–M03 durable services  
- M04–M07/M11 domain edits  
- M08–M24 rebuilds  
- PPA / payment / patient / M25  
- Topbar backend export/MFA (honesty is B2)  
- PR / merge / production approval  
- Automatic progression to P1-B2  

## Exit gate

| # | Exit | Status (2026-08-13) |
| ---: | --- | --- |
| 1 | Named automated tests green | **Met** (local) |
| 2 | Visual QA (separate agent) vs Decision A for SHARED regions | **Qualified** — local harness accepted; full pixel-diff deferred |
| 3 | Register validator still `failures: []` | **Met** (local) |
| 4 | Runtime module count unchanged (24) | **Met** |
| 5 | Docs-only evidence under `docs/audits/p1/` | **Met** |
| 6 | Owner accepts B1 tip before any B2+ start | **Met with qualifications** — B2+ remain unauthorised |

## Acceptance qualifications (binding)

| Qualification | Record |
| --- | --- |
| GitHub CI | No Actions/check status; local validation only |
| Pixel comparison | Deferred to controlled later batch |
| Demo identity consistency | Sarah/Neil remains P1-B2 |
| Data architecture | `OWN-P1-016` remains open |
| Later batches | P1-B2–P1-B8 remain unauthorised |
| Production | No production approval |
| Delivery | No PR, merge or deployment authorised |
| Progression | No automatic progression to P1-B2 |

## Rollback

Discard/unmerge B1 branch; return to pre-B1 owner-accepted tip. Do not rewrite P0 history.

## Owner action remaining

P1-B1 is closed with qualifications. **Express authorisation of P1-B2 (or any later batch) is still required** before further implementation. `OWN-P1-016` remains open.

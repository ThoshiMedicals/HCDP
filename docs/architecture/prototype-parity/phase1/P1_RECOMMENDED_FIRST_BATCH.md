# Recommended First Implementation Batch

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`  
**Recommendation:** **P1-B1 — SHARED Decision A shell foundation**

## Why B1 first

1. Matches existing Programme Wave P1 definition in `prompts/p1.md` and the dependency-led roadmap.  
2. Unlocks consistent chrome for all later module presentation work (B5/B6).  
3. Addresses multi-module blockers before permission/state and lower-risk polish.  
4. Avoids domain churn on frozen waves M04–M07/M11.  
5. Keeps patient/PPA/payment/M25/M08–M24 rebuilds out.

## Entry gate (all must be true)

| # | Gate | Status (2026-08-11) |
| ---: | --- | --- |
| 1 | Owner accepts P0 pack and clears `OWN-NO-P1-YET` (OWN-P1-001) | **Met** — closed OWN-P1-001; tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` |
| 2 | Owner confirms P1 scope decision OWN-P1-002 | **Met** — SHARED-first; B2–B8 separate auth |
| 3 | Owner expressly names batch **P1-B1** (OWN-P1-003) | **Met (naming only)** — still **not** implementation auth |
| 4 | Start tip clean; `tsc` / lint / tests / build / register validator green | Required at implementation start |
| 5 | Decision A PNGs remain installed hash-OK | Required at implementation start |
| 6 | No M25 / PPA / payment / patient work included | Remains in force |
| 7 | Owner **expressly authorises** batch **P1-B1** for implementation | **Not met** — separate act still required |

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

## Out of scope even if B1 is named

- M01–M03 durable services  
- M04–M07/M11 domain edits  
- M08–M24 rebuilds  
- PPA / payment / patient / M25  
- Topbar backend export/MFA (honesty is B2)  
- PR / merge / production approval  

## Exit gate

| # | Exit |
| ---: | --- |
| 1 | Named automated tests green |
| 2 | Visual QA (separate agent) vs Decision A for SHARED regions |
| 3 | Register validator still `failures: []` |
| 4 | Runtime module count unchanged (24) |
| 5 | Docs-only evidence added under planned `docs/audits/p1/` (when implementation happens) |
| 6 | Owner accepts B1 tip before any B2+ start |

## Rollback

Discard/unmerge B1 branch; return to pre-B1 owner-accepted tip. Do not rewrite P0 history.

## Owner action required

OWN-P1-001…003 planning outcomes are recorded (2026-08-11). **Express implementation authorisation of P1-B1 is still required.** Until then this batch remains:

`P1 — PLANNED, NOT AUTHORISED`

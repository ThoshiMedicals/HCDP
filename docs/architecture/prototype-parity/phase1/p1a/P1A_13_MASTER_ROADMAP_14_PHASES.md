# P1A Master Roadmap — 14 Phases

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Status legend

Not started · Planned not authorised · In progress · Complete (qualified) · Blocked · Deferred · Excluded

## Phase table

| Phase | Objective | Entry | Deliverables | Dependencies | Decisions | Verification | Exit | Status |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Trusted baseline & parity control (P0) | Owner programme start | Control pack, registers, Decision A install | App baseline | Accept P0 pack | validate-registers; pack pins | Owner accepts P0 | **Complete but unapproved for P1 start** (pack ready; OWN-NO-P1-YET) |
| 1 | P1A definition readiness | P0 artefacts exist | This P1A pack | P1B inventory | OWN-P1A-001 | Docs validation; link audit | Owner reviews pack | **Planned pack prepared** (`P1A — PLANNED, NOT AUTHORISED`) |
| 2 | P1B parity plan freeze | P1A/P1B reviewed | 83 gaps / 8 batches accepted as plan | Phase 1 | OWN-P1-001/002 | Cross-check counts | Plan accepted (still not code) | Planned not authorised |
| 3 | Programme P1 SHARED shell (P1-B1) | Named auth + gates | Tokens/chrome/primitives/tests | Decision A; DEF-GAP-001 | OWN-P1-003 | Theme/shell/visual QA | Owner accepts B1 tip | Planned not authorised |
| 4 | P1 honesty + hygiene (B2–B3) | B1 accepted if sequenced | Truthful controls; register sync | Owner stub decisions | OWN-P1-004…008 | Labelling + validator | Owner accepts tips | Planned not authorised |
| 5 | P1 evidence hardening (B4) + optional B5–B7 | Prior tips | A11y/responsive; optional presentation apply | Broad scope decision | OWN-P1-002=B | Width/a11y/regression | Owner accepts | Planned not authorised |
| 6 | P1 closure (B8) | In-scope B1–B7 done or truncated | Evidence pack + stop | Phases 3–5 | Stop confirmation | SHA evidence; localhost 3000 | Programme P1 stop | Planned not authorised |
| 7 | Programme P2 domain (M01–M07/M11 workflows) | P1 stop + new auth | Durable services/workflows | Producers; shell | OWN-P1-009 | Work-Steps; authz; audit | Owner wave accept (≠ prod) | Deferred |
| 8 | Programme P3 M10 unblock | P2 progress / owner | Tasks connective layer | BLOCKED-M10 plan | OWN-P1-010 | Integration tests | Owner accept | Deferred |
| 9 | Programme P4–P5 rebuilds (M13/M14 then M12/M15/M16) | Prior waves | Module rebuilds | Registers | Per-module auth | Full axes | Owner accept | Deferred |
| 10 | Programme P6 finance rebuilds (M08/M09/M24) | Prior | Finance modules | Firewall | Separate from PPA | Authz + boundary tests | Owner accept | Deferred |
| 11 | PPA (prior-period adjustment) | Explicit PPA batch auth | PPA cycle | PPA design doc | OWN-P1-011 | PPA evidence | Owner accept (≠ prod/pay) | Deferred / not authorised |
| 12 | Programme P7–P8 (comms/digital/analytics; commercial) | Prior | M17–M23 etc. | Tenancy decision | OWN-P1A-007 | Module axes | Owner accept | Deferred |
| 13 | Programme P9 production verification | Prior functional maturity | Prod verification pack | Specialist reviews | Prod go/no-go | Full gates + reviews | Production approval **or** reject | Deferred |
| 14 | M25 future (separate) | Owner opens parked branch | Print-fleet planning/impl only if authorised | Outside M01–M24 | OWN-P1-013 | Separate | Separate exit | Deferred / parked |

## Mapping to dependency-led roadmap

P0 → P1 SHARED → P2 developed modules → P3 M10 → P4 M13/M14 → P5 M12/M15/M16 → P6 finance (+ separate PPA) → P7 comms/digital/analytics → P8 commercial → P9 production verification · M25 outside.

## Explicit non-phases inside this roadmap

- Payment execution  
- Clinical/patient SoR  
- Silent Module 8 doctor-pay certification  
- Auto-start of any phase without owner naming  

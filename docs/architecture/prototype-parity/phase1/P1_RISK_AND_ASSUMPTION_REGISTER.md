# P1 Risk and Assumption Register

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`

## Risks

| ID | Risk | Likelihood | Impact | Mitigation | Linked gaps |
| --- | --- | --- | --- | --- | --- |
| R-01 | Implementing P1 before P0 acceptance | Med | High | Hard entry gate; pack stamped not authorised | 001 |
| R-02 | Scope confusion: narrow SHARED P1 vs broad readiness | High | High | Owner decision 083; executive summary naming table | 083 |
| R-03 | Treating ModuleLanding / routes as implemented | High | High | Gap 015; register hygiene B3; matrix PH column | 015, 033–048 |
| R-04 | Frozen wave domain regression during design apply | Med | High | B6 presentation-only; focused regression; freeze rules | 081, 022–026 |
| R-05 | Toast-only controls mistaken for success | High | Med | B2 truthfulness; GLOBAL fail condition | 005, 030 |
| R-06 | PPA foundation UI mistaken for authorised PPA | Med | High | Gap 079; exclusions; wave-control | 061, 079 |
| R-07 | Patient/clinical scope creep via mock copy or M08 BP wording | Med | High | Firewall; exclusions 057–059 | 057–059 |
| R-08 | Payment execution creep via export/payroll UI | Low | High | OWN-NO-PAY-EXEC; B2 honesty | 060 |
| R-09 | Evidence JSON rewritten by tests | High | Med | Restore process; B8 controls; observed this run | 076 |
| R-10 | Visual QA self-approval | Med | High | Separate Visual/Work-Step agents | 082 |
| R-11 | Screenshot flakiness (System theme hydrate) | Med | Med | B4 settle rules; theme init | 008 |
| R-12 | Stale docs contradict re-audit | Med | Med | Prefer re-audit; B3 pointer | 013 |
| R-13 | M25 accidental inclusion | Low | Med | Absent from register; parked branch | 062 |
| R-14 | Unresolved section mappings mis-wire Work-Steps | Med | Med | Limit P1 to SHARED dossiers; P2 bulk | 014 |
| R-15 | Claiming production approval after P1 | Med | High | Explicit non-claims; axis 5 separate | 056 |

## Assumptions

| ID | Assumption | If false |
| --- | --- | --- |
| A-01 | Owner will keep Programme P1 = SHARED foundation first | Re-scope batches before coding |
| A-02 | Decision A PNG set at `66e6e64…` remains canonical | Stop for design re-decision |
| A-03 | Tip `9142ec30…` remains the clean quality baseline to branch from | Re-run gates on new tip |
| A-04 | P0 tip `b0c4c4d20…` remains preserved historical control pack | Do not rewrite; re-pin if owner moves |
| A-05 | M04–M07/M11 domain remains frozen unless defect/CR | B6 cannot proceed as presentation-only |
| A-06 | Appearance modes remain Light/Dark/System only | Reopen DEC-BRANDED-THEMES |
| A-07 | M25 stays outside M01–M24 runtime | Do not invent module 25 in P1 |
| A-08 | `.env.local` stays ignored | Secrets must not enter commits |
| A-09 | Register validator remains authoritative for pack integrity | Fix validator before claiming register sync |
| A-10 | UI Batch1 is chrome remediation evidence, not Decision A P1 completion | B1 still required |

## Qualifications

1. Wave owner acceptance ≠ production readiness.  
2. M07 Batch 6 closure ≠ certification / payment readiness.  
3. UI Batch1 lane PASS ≠ Programme P1 authorised.  
4. Historical Batch1 “21 tsc / 2 lint” claims are **not** current on tip `9142ec30` (tsc pass; lint 0/24) — re-verify rather than copy forward.  
5. Nested P0 pins (`b1152d3` / `e659dfc`) ≠ programme-reset branch tip (`b0c4c4d20`).  

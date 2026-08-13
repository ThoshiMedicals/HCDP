# P1-B2 — Shell truthfulness and demo honesty — implementation evidence

**Batch:** P1-B2  
**Status:** **Owner accepted with qualifications — CLOSED (2026-08-13)**  
**Implementation branch:** `cursor/p1-b2-shell-truthfulness`  
**Source branch:** `cursor/p1-b1-shared-shell-foundation`  
**Starting source SHA:** `300b250f6970ef23254df8630a5fd0145000129e`  
**Accepted implementation tip:** `66f3f8d27803f5b8d24043639d21b9069f58e77a`  
**Implementation sequence (accepted):**  
1. `d425adaad2ac8f29de893ca0dd996e147ad6febe` — `feat(p1-b2): implement shell truthfulness and demo honesty`  
2. `66f3f8d27803f5b8d24043639d21b9069f58e77a` — `fix(p1-b2): remediate truthfulness acceptance evidence`  

**Owner acceptance:** **Owner accepted with qualifications — CLOSED (2026-08-13)** (`P1-B2-OWNER-ACCEPT-2026-08-13`)  
**Accepted scope:** P1-B2 shell truthfulness, inactive-control disposition, QA/demo gating and demonstration-identity consistency only  
**Validation basis:** verified local tests, validators, build and visual harness (local only)  
**GitHub CI:** none — branch has no GitHub Actions checks; **no CI pass claimed**  
**Authorised decisions implemented:** OWN-P1-004 (A+D), OWN-P1-005 (A), OWN-P1-008 (A), OWN-P1-017 (A)  

**Not claimed:** overall Programme P1 complete; production-approved; WCAG/security compliance; production authentication; export-processing backend; shell-wide multi-select; `OWN-P1-016` resolved; P1-B3–P1-B8 authorised; PR; merge; deploy; automatic progression

## Owner decision (2026-08-13)

P1-B2 is **owner accepted with qualifications** at tip `66f3f8d27803f5b8d24043639d21b9069f58e77a`. Within approved P1-B2 scope the batch is **closed**. This acceptance does **not** authorise P1-B3–P1-B8, a pull request, merge, deployment, production release, or automatic batch progression.

### Binding qualifications

| # | Qualification |
| ---: | --- |
| 1 | Validation evidence is local only |
| 2 | No GitHub CI pass claimed (no GitHub Actions checks) |
| 3 | QA/demo tools and activation are forced off under production enforcement |
| 4 | Demo Act-as chrome may still render under production-enforcement builds |
| 5 | P1-B2 does not constitute production-authentication approval |
| 6 | Any production treatment of Act-as chrome remains deferred to the appropriate production-authentication/security batch |
| 7 | Topbar Export and Enterprise MFA remain unavailable and non-operational |
| 8 | Command Centre and Organisation exports remain browser-local demonstrations only |
| 9 | No export-processing or reporting backend is accepted |
| 10 | Command Centre-only multi-clinic selection remains an accepted P1 difference |
| 11 | Shell-wide multi-clinic selection is not accepted or authorised |
| 12 | Full WCAG compliance is not claimed |
| 13 | Pixel-level Decision A parity remains deferred to its controlled later batch |
| 14 | Intermittent Next.js development hot-reload `JSON.parse` 500 responses remain a recorded development-environment limitation |
| 15 | `OWN-P1-016` remains open |
| 16 | P1-B3 through P1-B8 remain separately unauthorised |
| 17 | Acceptance does not authorise a PR, merge, deployment or production release |
| 18 | Acceptance does not authorise automatic progression to P1-B3 |
| 19 | Acceptance is not overall Programme P1 acceptance |
| 20 | P1-B1 qualifications remain unchanged unless specifically satisfied by accepted P1-B2 evidence |

## Gaps dispositioned at acceptance

| Gap | Disposition at `66f3f8d…` |
| --- | --- |
| P1-GAP-005 | **Owner accepted / closed** for P1-B2 truthfulness (keyboard-explainable unavailable Export/MFA; New Entry local-demo drawer) |
| P1-GAP-006 | **Owner accepted / closed** as Accepted difference (Command Centre-only multi-clinic; shell-wide not authorised) |
| P1-GAP-007 | **Owner accepted / closed** for honesty/non-operational labels only; domain enablement remains P2+ |
| P1-GAP-018 | **Partial** — labelling/identity + QA gate accepted; durable IAM remains later |
| P1-GAP-030 | **Partial** — honesty portion accepted; real reporting/export remains later |
| P1-GAP-032 | **Owner accepted / closed** for P1-B2 demo-governance (explicit QA/demo gate) |
| P1-GAP-071 | **Owner accepted** for P1-B2 demo/seed honesty; broader residuals may remain later |
| P1-GAP-073 | **Owner accepted / closed** for P1-B2 Online/Offline demo-honesty |

## Remediation history (preserved)

Accessibility and acceptance-evidence remediation at `66f3f8d…` corrected: keyboard-accessible unavailable controls; removal of DOM-fabricated multi-clinic evidence; true System-mode appearance evidence; worktree restoration of test-mutated wave JSON. Superseded artefacts remain under `docs/audits/p1/b2-shell-truthfulness/historical-superseded-dom-fabricated/`.

## P1-B1 Sarah/Neil qualification

Accepted P1-B2 evidence supports recording that global demo current-user chrome is aligned through the active identity (OWN-P1-017). The historical P1-B1 Sarah/Neil demo-honesty qualification is **satisfied for the accepted demo runtime**. Production authentication remains outside P1-B2. See `P1_OWNER_DECISION_REGISTER.md` and `P1_B1_IMPLEMENTATION_EVIDENCE.md` (qualification-satisfaction note).

## Screenshot / harness evidence

Under `docs/audits/p1/b2-shell-truthfulness/` (live shots + harness reports). Historical/superseded evidence preserved separately.

## Deferred / remains open

- `OWN-P1-016` remains **open**
- P1-B3 through P1-B8 remain **unauthorised**
- Export-processing services, MFA/IdP, SQL/migrations, PPA, payment, M25, patient/clinical SoR — out of scope
- Overall Programme P1 / production approval — **not** claimed

## Scope preservation confirmations

- P1-B1 remains accepted and closed with qualifications at `fdb2beb…`
- 83 gaps / 8 batches accounted for
- 24 runtime modules remain; M25 unimplemented
- No SQL/schema/migration; no lockfile dependency change; no secrets; no CI/CD; no PR/merge/deploy from this acceptance
- Best Practice (or equivalent) remains clinical system of record
- BOM in remediation commit subject left untouched (history not rewritten)

## GitHub CI status

**None claimed** — accepted tip has no GitHub Actions check run. Local validators/tests/build/harness only.

# P1C Production Scorecard, Hygiene, Risks & Owner Decisions

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Production-readiness scorecard

| Domain | Score (0–5) | Rationale |
| --- | ---: | --- |
| Product boundary clarity | 5 | Firewall + exclusions strong |
| Planning packs P1A/P1B | 4 | Complete unapproved |
| Engineering repo hygiene | 1 | Many DEV-GAPs |
| CI/CD | 0 | No workflows |
| AuthN/AuthZ prod-grade | 1 | Demo identity; partial authz |
| Data durability & tenancy | 1 | localStorage runtime |
| Observability/IR/DR | 0 | Missing |
| Privacy artefacts | 1 | Mapping only |
| Security assessment | 0 | ASVS/E8 not assessed |
| Accessibility evidence | 2 | Partial |
| Module completeness | 2 | Core waves strong; 16 placeholders |
| Supply chain | 1 | Lockfile only |
| **Overall prod readiness** | **1 / 5** | **Not production-ready** |

## Hygiene findings

| ID | Finding | Impact |
| --- | --- | --- |
| HYG-P1C-001 | Extremely long paths under `docs/audits/ui-batch1-…` cause Windows directory errors | Evidence tooling fragility |
| HYG-P1C-002 | Root README stale | Onboarding falsehoods |
| HYG-P1C-003 | Playwright installed without config | Dead weight / false confidence |
| HYG-P1C-004 | `.env.local` present locally (ignored) — ensure never force-added | Secret risk if mishandled |

## P1C risks (additive to P1B R-*)

| ID | Risk | L | I | Mitigation |
| --- | --- | --- | --- | --- |
| R-P1C-01 | Treating planning packs as prod approval | M | H | Scorecard; non-claims |
| R-P1C-02 | Implementing P1-B1 with silent CI/DB scope | M | H | Stage separation |
| R-P1C-03 | Stale inventory drives wrong rebuilds | H | H | Prefer re-audit |
| R-P1C-04 | localStorage mistaken for prod DB | H | H | DATA stages |
| R-P1C-05 | Clinical scope via M08 BP wording | M | H | Firewall |
| R-P1C-06 | Path-length evidence breakage | M | M | HYG-P1C-001 |

## Owner decisions (all Open; do not invent approval)

| ID | Question | Recommendation |
| --- | --- | --- |
| OWN-P1C-001 | Authorise docs hygiene batch to banner/fix README? | Yes (docs-only) after pack review |
| OWN-P1C-002 | Confirm re-audit supersedes CURRENT_PLATFORM_INVENTORY for status? | Yes |
| OWN-P1C-003 | Playwright: configure E2E harness vs remove later? | Configure for a11y/visual later; no dep change now |
| OWN-P1C-004 | Adopt ADR folder process? | Yes |
| OWN-P1C-005 | Confirm ASVS **5.0.0 Level 2** + E8 **ML2** targets? | Align with OWN-P1A-002/003 |
| OWN-P1C-006 | Authorise CI workflow introduction (engineering batch)? | Yes as separate named batch — not P1-B1 |
| OWN-P1C-007 | Production hosting target (container vs managed Next)? | Decide before S6 |

Carry-forward: OWN-P1-001…003 **closed** 2026-08-11 (planning only; P1-B1 still unauthorised). Still open: OWN-P1-004…008; **OWN-P1-016** (ARCH-01/DATA-01); OWN-P1A-001…008; OWN-P1C-001…007.

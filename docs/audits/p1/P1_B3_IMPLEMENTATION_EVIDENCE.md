# P1-B3 — Register hygiene and payroll-history truthfulness — implementation evidence

**Batch:** P1-B3
**Status:** **Owner accepted with qualifications — CLOSED (2026-08-13)**
**Implementation branch:** `cursor/p1-b3-register-hygiene`
**Source branch:** `cursor/p1-b2-shell-truthfulness`
**Starting source SHA:** `4c84263ca27f7a23e71c5304cff4249e0d132e50`
**Accepted implementation tip:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8`
**Implementation sequence (accepted):**
1. `a80405dd79dc180c1d2b3ffa470e9db219ff3b3c` — `feat(p1-b3): implement register hygiene and honest payroll labels`
2. `2515a4ffac0fb94cbd37092e26bf372cb43898f8` — `fix(p1-b3): remediate acceptance evidence and diff hygiene`

**Owner acceptance:** **Owner accepted with qualifications — CLOSED (2026-08-13)** (`P1-B3-OWNER-ACCEPT-2026-08-13`)
**Accepted scope:** P1-B3 register hygiene and payroll-history truthfulness only (OWN-P1-006 / OWN-P1-007)
**Validation basis:** verified local tests, validators, build and visual harness (local only)
**GitHub CI:** none — branch has no GitHub Actions checks; **no CI pass claimed**
**Authorised decisions implemented:** OWN-P1-006 (Option A Synchronise), OWN-P1-007 (Option A Honesty-only labels)
**Independent remediation:** see [`P1_B3_REMEDIATION_EVIDENCE.md`](./P1_B3_REMEDIATION_EVIDENCE.md) (diff hygiene, a11y hardening, strengthened harness; original `a80405dd` evidence archived). Remediated tip `2515a4ff…` is authoritative.

**Not claimed:** overall Programme P1 complete; production-approved; WCAG/security compliance; PPA product (OWN-P1-011); payment; M08; `OWN-P1-016` resolved; P1-B4–P1-B8 authorised; PR; merge; deploy; automatic progression

## Owner decision (2026-08-13)

P1-B3 is **owner accepted with qualifications** at tip `2515a4ffac0fb94cbd37092e26bf372cb43898f8`. Within approved P1-B3 scope the batch is **closed**. This acceptance does **not** authorise P1-B4–P1-B8, a pull request, merge, deployment, production release, or automatic batch progression.

### Binding qualifications

| # | Qualification |
| ---: | --- |
| 1 | Validation is local-only; GitHub Actions and check-runs are absent |
| 2 | No GitHub CI pass is claimed |
| 3 | No pixel-parity claim is made |
| 4 | No full WCAG compliance claim is made |
| 5 | M11 `strong-existing` does not mean production-approved |
| 6 | Wave 3 remains frozen; no new M11 domain expansion is accepted |
| 7 | History remains planned/non-operational |
| 8 | Adjustments remain preparation/foundation functionality only |
| 9 | Unlock/reopen is not PPA processing |
| 10 | No PPA product is accepted or authorised |
| 11 | `OWN-P1-011` remains open |
| 12 | `OWN-P1-016` remains open |
| 13 | Bulk workflow-mapping residual remains deferred to P2+ |
| 14 | Historic parity-register Markdown hard-break trailing spaces remain a known pre-existing limitation |
| 15 | The archived `a80405dd…` evidence is retained for traceability; the remediated evidence at `2515a4ff…` is authoritative |
| 16 | No production approval is granted |
| 17 | P1-B4 through P1-B8 remain unauthorised |
| 18 | No automatic progression is permitted |
| 19 | No PR, merge or deployment is authorised |
| 20 | This is not overall Programme P1 acceptance |

## Scope delivered

| Area | Behaviour |
| --- | --- |
| M11 register | Section list synchronised to verified `TrainingWorkspace` NAV (11 sections). Condition `legacy-html-fallback` → `strong-existing`. Purpose text states Wave 3 accepted/frozen and **not** production-approved; metadata correction only. |
| M07 History | Remains `planned`. PlannedSection shows **Planned — not yet available**, keyboard-reachable `aria-disabled` control with descriptions, no success toasts. |
| M07 Adjustments | Honesty-only labels: adjustment preparation/foundation; **not** authorised PPA product; unlock/reopen ≠ PPA; OWN-P1-011 remains open. No payment/M08/certification workflows added. |
| GAP-013 | Supersession banner on historic `HCDP_PROTOTYPE_PARITY_REGISTER.md` (history preserved). |
| GAP-014 SHARED | Honesty note documenting unresolved=298 residual; no bulk resolve. |
| GAP-015 | ModuleLanding honesty for placeholder / legacy-html modules. |

## Gaps dispositioned at acceptance

| Gap | Disposition at `2515a4ff…` |
| --- | --- |
| P1-GAP-011 | **Closed** — accepted P1-B3 M11 register synchronisation; not production; no new M11 domain |
| P1-GAP-012 | **Partial** — History planned/non-operational honesty accepted; **residual:** operational History Future/P2+ |
| P1-GAP-013 | **Closed** — supersession banner accepted; historic body preserved; Wave re-audit remains preferred SoT |
| P1-GAP-014 | **Partial** — SHARED honesty/register subset closed; **residual:** bulk unresolved≈298 → P2+ |
| P1-GAP-015 | **Partial** — ModuleLanding/placeholder honesty closed; **residual:** real domain builds for placeholders remain Future |
| P1-GAP-079 | **Partial** — Adjustments/PPA honesty boundary closed; **residual:** PPA product under OWN-P1-011 (open) |

## Screenshot / harness evidence

Under `docs/audits/p1/b3-register-hygiene/` (shots + harness report). Local-only. Original `a80405dd` pack archived under `archive-a80405dd/`. Remediated pack at accepted tip is authoritative.

## Deferred / remains open

- `OWN-P1-011` (PPA product) **open**
- `OWN-P1-016` **open**
- P1-B4 through P1-B8 **unauthorised**
- M25 unimplemented; 83 gaps / 8 batches / 24 modules preserved
- Payment, certification, doctor pay — out of scope
- Overall Programme P1 / production approval — **not** claimed

## Scope preservation confirmations

- P1-B1 and P1-B2 remain accepted and closed with qualifications
- 83 gaps / 8 batches accounted for
- 24 runtime modules remain; M25 unimplemented
- No SQL/schema/migration; no lockfile dependency change; no secrets; no CI/CD; no PR/merge/deploy from this acceptance
- Best Practice (or equivalent) remains clinical system of record

## GitHub CI status

**None claimed** — accepted tip has no GitHub Actions check run. Local validators/tests/build/harness only.

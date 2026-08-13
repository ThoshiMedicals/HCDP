# P1-B3 — Register hygiene and payroll-history truthfulness — implementation evidence

**Batch:** P1-B3  
**Status:** **Authorised and implemented — owner acceptance PENDING** (2026-08-13)  
**Implementation branch:** `cursor/p1-b3-register-hygiene`  
**Source branch:** `cursor/p1-b2-shell-truthfulness`  
**Starting source SHA:** `4c84263ca27f7a23e71c5304cff4249e0d132e50`  
**Implementation tip:** published as the `feat(p1-b3): implement register hygiene and honest payroll labels` commit on `cursor/p1-b3-register-hygiene` (full SHA in return report / `git rev-parse HEAD` after publish)  

**Owner acceptance:** **Pending** — this pack is published for independent owner review  
**Validation basis:** local validators, unit tests, lint, `tsc`, production build, and visual harness (local only)  
**GitHub CI:** none — branch has no GitHub Actions checks; **no CI pass claimed**  
**Authorised decisions implemented:** OWN-P1-006 (Option A Synchronise), OWN-P1-007 (Option A Honesty-only labels)  

**Not claimed:** overall Programme P1 complete; production-approved; WCAG/security compliance; PPA product (OWN-P1-011); payment; M08; `OWN-P1-016` resolved; P1-B4–P1-B8 authorised; PR; merge; deploy; automatic progression; gap closure without owner acceptance

## Scope delivered

| Area | Behaviour |
| --- | --- |
| M11 register | Section list synchronised to verified `TrainingWorkspace` NAV (11 sections). Condition `legacy-html-fallback` → `strong-existing`. Purpose text states Wave 3 accepted/frozen and **not** production-approved; metadata correction only. |
| M07 History | Remains `planned`. PlannedSection shows **Planned — not yet available**, keyboard-reachable `aria-disabled` control with descriptions, no success toasts. |
| M07 Adjustments | Honesty-only labels: adjustment preparation/foundation; **not** authorised PPA product; unlock/reopen ≠ PPA; OWN-P1-011 remains open. No payment/M08/certification workflows added. |
| GAP-013 | Supersession banner on historic `HCDP_PROTOTYPE_PARITY_REGISTER.md` (history preserved). |
| GAP-014 SHARED | Honesty note documenting unresolved=298 residual; no bulk resolve. |
| GAP-015 | ModuleLanding honesty for placeholder / legacy-html modules. |

## Gap disposition (acceptance pending — **not closed**)

| Gap | Disposition at publish |
| --- | --- |
| P1-GAP-011 | Implemented (register sync) — **acceptance pending** |
| P1-GAP-012 | Implemented (History honesty) — **acceptance pending** |
| P1-GAP-013 | Implemented (supersession banner) — **acceptance pending** |
| P1-GAP-014 | SHARED subset honesty documented; bulk residual remains — **acceptance pending** |
| P1-GAP-015 | Implemented (placeholder honesty) — **acceptance pending** |
| P1-GAP-079 | Implemented (Adjustments honesty) — **acceptance pending** |

## Screenshot / harness evidence

Under `docs/audits/p1/b3-register-hygiene/` (shots + harness report). Local-only.

## Deferred / remains open

- Owner acceptance of P1-B3 tip
- `OWN-P1-011` (PPA product) **open**
- `OWN-P1-016` **open**
- P1-B4 through P1-B8 **unauthorised**
- M25 unimplemented; 83 gaps / 8 batches / 24 modules preserved
- Payment, certification, doctor pay — out of scope

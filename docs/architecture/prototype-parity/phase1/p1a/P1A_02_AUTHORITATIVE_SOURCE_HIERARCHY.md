# P1A Authoritative-Source Hierarchy (Register 2)

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## Conflict-resolution rule (global)

When sources disagree: apply the highest authority level that is **in force** for the contested scope; record the conflict in the owner-decision register; **do not** silently pick a side in implementation. Planning docs never outrank owner directives or legal/regulatory obligations.

## Hierarchy (highest → lowest)

| Level | Authority class | Conflict rule |
| ---: | --- | --- |
| L0 | Current owner directive + permanent product-scope safeguards | Absolute for scope |
| L1 | Legal / regulatory obligations (Privacy Act / APP, NDB, applicable employment/tax law as separately advised) | Cannot be waived by prototype or code |
| L2 | Accepted/frozen domain rules, contracts, permissions, isolation, audit, wave evidence | Freeze unless defect/CR + owner review |
| L3 | BRD / business rules / blueprints for not-yet-built capability (default ADOPTED per firewall) | Yield to L0–L2 |
| L4 | UX / Decision A PNGs + design-system contract (visual/shell) | Yield to L0–L3 for behaviour |
| L5 | Canonical registers (screens/actions/traceability/re-audit) | Traceability evidence; dossiers beat stale narrative |
| L6 | Data / permission / integration contracts | Enforce at service layer when implemented |
| L7 | Accepted evidence packs + GLOBAL acceptance design | Proof; not scope expansion |
| L8 | Automated tests | Regression truth for implemented behaviour |
| L9 | Current application behaviour | Reality check; not authority to keep wrong behaviour |
| L10 | Historical / superseded docs | Informative only |

## Source catalogue

| ID | Title / location | Owner | Version / SHA | Approval status | Effective | Scope | Authority | Supersedes | Conflict rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-OWN-DIR | Owner decisions (OWN-*, DEC-*) | Product owner | Living | Mixed closed/open | Continuous | Programme | L0 | Prior conflicting owner notes | Latest dated owner record wins |
| SRC-FIREWALL | `…/SCOPE_AND_SOURCE_OF_TRUTH_FIREWALL.md` | Programme | P0 pack | Control pack pending P1 auth | P0 gen | Boundary | L0/L2 | Informal scope notes | Patient/pay/PPA absolute |
| SRC-LEGAL-APP | OAIC APP guidelines | OAIC / legal counsel | Updated May 2026 chapters | External | Access 2026-08-11 | Privacy | L1 | Older APP summaries | Counsel interprets; docs ≠ compliance |
| SRC-LEGAL-NDB | OAIC Notifiable Data Breaches scheme | OAIC / legal | Current OAIC pages | External | Access 2026-08-11 | Breach | L1 | — | Counsel interprets |
| SRC-E8 | ASD Essential Eight Maturity Model (Nov 2023) | ASD/ACSC | Nov 2023 | External | Access 2026-08-11 | Cyber | L1 (target) | Older E8 versions | Target maturity is **owner-selected** (see OWN-P1A-E8) |
| SRC-ASVS | OWASP ASVS (project; latest stable noted 5.0.0; 4.0.x still referenced historically) | OWASP | See owasp.org ASVS | External | Access 2026-08-11 | AppSec | L1 (target) | — | Select level via owner/security review |
| SRC-WCAG | W3C WCAG 2.2 Recommendation | W3C | 2023-10-05 | External | Access 2026-08-11 | A11y | L1 (target AA) | WCAG 2.0/2.1 policies may accept 2.2 | Target AA proposed; not certified |
| SRC-WAVE-FREEZE | Wave 2–6 evidence + wave-control | Owner | Frozen SHAs per wave-control | Owner-accepted (not prod) | Wave dates | M04–M07/M11 | L2 | — | No silent rewrite |
| SRC-BRD | `src/lib/extracted/brd-modules.json` + blueprints/fields | Product | Extract tip in P0 gen | Extracted | P0 gen | Capability | L3 | — | Default ADOPTED if not excluded |
| SRC-PROTO | `public/pulse-html-prototype.html` + prototype-*.json | Product | proto hash in P0 | Reference | P0 gen | Not-yet-built UX | L3/L4 | — | Not production truth |
| SRC-DEC-A | Decision A PNGs + acceptance | Owner | `66e6e6488b27b9098dadd8962473fedea5053614` | Accepted (visual) | Decision A | Chrome | L4 | Decision B quarantine | Visual SoT |
| SRC-DESIGN | `FINAL_DESIGN_SYSTEM_CONTRACT.md` + JSON | Programme | P0 gen | Contract in force for design | P0 gen | Shell/tokens | L4 | Older theme packs | Tokens/dims |
| SRC-SCR | Canonical screen register | Programme | 194 screens | Generated | P0 gen | Screens | L5 | 143 baseline estimate | Prefer canonical |
| SRC-WAR | Workflow/action register | Programme | 807 items | Generated | P0 gen | Actions | L5 | — | Dossiers authoritative for execution |
| SRC-TRACE | Master BRD↔proto↔prod | Programme | 1982 rows | Generated | P0 gen | Trace | L5 | — | Broken links reported |
| SRC-REAUDIT | Current implementation re-audit | Programme | 24 modules | Generated | P0 gen | Status axes | L5 | Historic parity register | Prefer re-audit |
| SRC-OWNREG | Conflict/owner decision register | Programme | openCount=0 prior | Generated | P0 gen | Conflicts | L0/L5 | — | Open P1 decisions in P1B/P1A |
| SRC-XMAP | Cross-module ownership map | Programme | P0 gen | Generated | P0 gen | Contracts | L6 | — | No repo imports |
| SRC-MODREG | `src/platform/module-registry/module-register.ts` | Engineering | Tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa` | Runtime | Continuous | 24 modules | L6/L9 | — | Runtime routes/conditions |
| SRC-EVID | `docs/audits/WAVE*`, UI Batch1 | Programme | Per SHA | Accepted w/ quals | Wave dates | Evidence | L7 | — | Do not rewrite history |
| SRC-GAT | `GLOBAL_ACCEPTANCE_TEST_DESIGN.md` | Programme | P0 | Control | P0 | Acceptance | L7 | — | Fail conditions binding |
| SRC-TESTS | `npm test` suite (252 at baseline) | Engineering | Tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa` | Automated | Continuous | Regression | L8 | — | Restore evidence side-effects |
| SRC-APP | `src/app/(portal)/`, shell, modules | Engineering | Tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa` | Behaviour | Continuous | Reality | L9 | — | Gaps if diverges from L2–L5 |
| SRC-HIST | `HCDP_PROTOTYPE_PARITY_REGISTER.md` etc. | Historical | Older | Superseded in parts | Past | Informative | L10 | — | Prefer SRC-REAUDIT |
| SRC-P1B | `phase1/P1_*.md` (14 files) | Planning | Uncommitted planning | `P1 — PLANNED, NOT AUTHORISED` | This branch | Parity plan | Planning only | — | Does not authorise code |
| SRC-P1A | `phase1/p1a/*` (this pack) | Planning | Uncommitted planning | `P1A — PLANNED, NOT AUTHORISED` | This branch | Definition readiness | Planning only | — | Does not authorise code |
| SRC-PROMPT-P1 | `prompts/p1.md` | Programme | P0 | Narrow SHARED P1 | P0 | Programme Wave P1 | Planning | — | Conflicts with broad P1B → OWN-P1-002 |
| SRC-PPA | `docs/plans/WAVE6_M07_PPA_*` | Planning | Separate | Not authorised | Planned | PPA only | Planning | — | Separate auth |
| SRC-M25 | `cursor/m25-future-planning` | Planning | Parked | Future | Parked | M25 | Out of P1 | — | Absent from runtime |

## Layered pin clarification (CONF-P1A-002)

| Layer | SHA | Role |
| --- | --- | --- |
| Programme-reset branch tip | `b0c4c4d20de1cce7adac5d691c506122e30610a2` | P0 control pack tip |
| Nested application baseline inside pack | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` | Phase 0 / nested pin |
| Nested evidence tip | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` | Evidence-bearing |
| Decision A | `66e6e6488b27b9098dadd8962473fedea5053614` | PNG set |
| P1 planning start tip | `9142ec30b3b2efea1e959ad85ce1406562cd5faa` | Quality-clean tip for planning |

Do not conflate layers.

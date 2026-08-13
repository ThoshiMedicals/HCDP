# P1 Owner-Decision Briefing (P1A · P1B · P1C)

**Stamp (updated 2026-08-13):** **P1-B1** owner accepted with qualifications and **closed** at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. **OWN-P1-004 / 005 / 008 / 017** closed for P1-B2 honesty disposition (2026-08-13). **P1-B2–P1-B8** remain unauthorised. P1A/P1C packs remain `PLANNED, NOT AUTHORISED`. Overall Programme P1 is **not** complete.  
**Baseline tip (planning):** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`  
**Planning branch (historical):** `cursor/p1-scope-readiness-plan`  
**Access / planning date:** 2026-08-11  
**P1-B1 acceptance date:** 2026-08-13  
**P1-B2 honesty decisions date:** 2026-08-13  

> **Update (2026-08-13):** Qualified owner acceptance of **P1-B1 only** is recorded in [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md) (`P1-B1-OWNER-ACCEPT-2026-08-13`) and [`../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md). **OWN-P1-004, OWN-P1-005, OWN-P1-008 and OWN-P1-017** are recorded closed for shell-honesty disposition — see [`P1_B2_OWNER_DECISION_BRIEFING.md`](./P1_B2_OWNER_DECISION_BRIEFING.md). This does **not** authorise P1-B2–P1-B8, PR/merge/deploy, production, or automatic progression. **OWN-P1-016** remains open. No legal, security, privacy, or accessibility certification is claimed.

**Authoritative registers (do not treat this briefing as a replacement):**

| Pack | Register |
| --- | --- |
| P1B | [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md) |
| P1A | [`p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md`](./p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md#register-20--risks-assumptions-dependencies-owner-decisions) |
| P1C | [`p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md`](./p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md) |

**Platform boundary (unchanged):** multi-organisation, multi-clinic, **non-clinical** medical-centre operations platform; **24** runtime modules (M01–M24); **M25** separate/future; **PPA** (prior-period adjustment) and **payment execution** out of scope; Best Practice (or equivalent clinical system) remains system of record for prohibited clinical functions.

**Standards position (proposals only — not achieved):** OWASP **ASVS 5.0.0** Level 2; Australian Signals Directorate **Essential Eight** Maturity Level Two; **WCAG 2.2** Level AA; OAIC privacy / **PIA** (Privacy Impact Assessment) where applicable — all require owner selection and specialist review before any compliance claim.

---

## 1. Executive summary

P1A (definition readiness), P1B (83 prototype-parity gaps / 8 batches), and P1C (repo/production audit, overall ~**1/5** production readiness) form the verified planning pack. **No product coding is authorised.**

Gate decisions **OWN-P1-001**, **OWN-P1-002**, and **OWN-P1-003** are **closed (2026-08-11)** — P0 tip accepted, SHARED-first scope, first batch **named** `P1-B1`. **P1-B1** is now **owner accepted with qualifications and closed (2026-08-13)** at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. **P1-B2–P1-B8 remain unauthorised.**

Additional open decisions cover later P1 batches (OWN-P1-004…008), definition/security/accessibility targets (OWN-P1A-*), repository/production hygiene (OWN-P1C-*), deferred waves (OWN-P1-009…014), and **OWN-P1-016** (ARCH-01 / DATA-01 — localStorage vs SQL production architecture) which remains **Open**.

---

## 2. Current planning status

| Item | Evidence |
| --- | --- |
| Branch / SHA | `cursor/p1-scope-readiness-plan` @ `9142ec30b3b2efea1e959ad85ce1406562cd5faa` (application baseline unchanged) |
| Accepted P0 tip | `b0c4c4d20de1cce7adac5d691c506122e30610a2` (OWN-P1-001, 2026-08-11) |
| P1B | Pack under `phase1/`; **83** gaps; **P1-B1** accepted/closed with qualifications (2026-08-13); **P1-B2** implemented — owner acceptance pending; **P1-B3…P1-B8** remain **not authorised** |
| P1A | 16 files under `phase1/p1a/` |
| P1C | 15 files under `phase1/p1c/`; scorecard overall **1 / 5** |
| Docs path | Docs-only under `docs/architecture/prototype-parity/`; no `src/` changes |
| Programme entry | `OWN-NO-P1-YET` **cleared** via OWN-P1-001 (planning hold); product coding still requires named-batch auth |
| OWN-P1-001…003 | **Closed** 2026-08-11 (planning only) |
| OWN-P1-016 | **Open** — ARCH-01 / DATA-01 persistence |
| P1-B1 | Named first batch (OWN-P1-003) — **unauthorised** |
| Runtime modules | 24; M25 parked on `cursor/m25-future-planning` |
| Validators | `validate-registers.mjs` expected `ok: true` on tip |

---

## 3. Immediate briefing — OWN-P1-001 / 002 / 003 (CLOSED 2026-08-11)

**Gate rule:** These three planning gates are now **closed**. Closing them does **not** start coding — the owner must still expressly authorise the named batch **P1-B1**. B2–B8 require separate explicit authorisation (OWN-P1-002).

| Decision | Plain-language choice | Owner outcome (2026-08-11) | Status |
| --- | --- | --- | --- |
| OWN-P1-001 | Accept corrected P0 control pack and clear the “no P1 yet” hold? | Conditionally approved — full SHA `b0c4c4d20de1cce7adac5d691c506122e30610a2` verified unique; `OWN-NO-P1-YET` cleared for programme entry | **Closed** |
| OWN-P1-002 | Narrow SHARED-only P1, or include B1–B8 hygiene/presentation? | SHARED-first; B2–B8 need separate explicit auth; no automatic progression; planning closure ≠ implementation auth | **Closed** |
| OWN-P1-003 | What is the first named implementation batch? | Name **P1-B1**; naming ≠ auth; P1-B1 stays planned/unauthorised | **Closed** |

### Decision card — OWN-P1-001

1. **Decision ID:** OWN-P1-001  
2. **Exact decision title:** Accept corrected P0 control pack tip `b0c4c4d20de1cce7adac5d691c506122e30610a2` (and nested pins) and clear `OWN-NO-P1-YET`?  
3. **Current status:** **Closed (conditionally approved) — 2026-08-11** 
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md` — “Decisions required before any P1 implementation”; evidence in `P1_BASELINE_GATE_EVIDENCE.md`, P1-GAP-001  
5. **Plain-language question:** Do you accept the corrected Programme Gate P0 control pack (and its pinned nested artefacts) as the baseline, and clear the hold that currently forbids starting Programme P1?  
6. **Why required:** Without P0 acceptance, every P1 batch remains blocked (`OWN-NO-P1-YET`).  
7. **Options:** (A) Accept pack + clear hold; (B) Reject / request P0 remediation first; (C) Defer decision.  
8. **Benefits:** A unlocks consideration of named batches; B prevents building on disputed baseline; C preserves freeze.  
9. **Risks:** A without review risks inheriting unexamined P0 defects; B/C delay all parity work.  
10. **Users / clinic ops:** No immediate UI change; unlocks future shell consistency work that affects daily navigation.  
11. **Privacy / security / a11y:** Acceptance is not a security certification; later OWN-P1A / P1C targets remain open.  
12. **Architecture / data / integrations:** Confirms pins; does not change localStorage/SQL dual path (ARCH-01/DATA-01).  
13. **Effect on P1-B1 and eight batches:** Blocks **all** batches until closed; required entry gate for P1-B1.  
14. **Dependencies:** None prior; prerequisite for OWN-P1-002/003 practical effect.  
15. **Specialist advice:** None mandatory for accept/reject of planning pack; engineering review of pack completeness advised.  
16. **Recommendation:** Accept when pack review complete (register recommendation).  
17. **Reason:** Preserved P0 tip and nested pins are already the planning baseline; clearing the hold is the documented programme entry.  
18. **Acceptance method:** Owner log in register template (Decision ID, Date, Owner, Outcome, Authorises / Does NOT authorise, Evidence pointer).  
19. **Deferral consequence:** P1 remains blocked; no safe coding start.  
20. **Timing:** **Required before any coding**; required before P1-B1 consideration.

### Decision card — OWN-P1-002

1. **Decision ID:** OWN-P1-002  
2. **Exact decision title:** Is Programme P1 limited to SHARED foundation (`prompts/p1.md`), or does it include B1–B8 presentation/hygiene?  
3. **Current status:** **Closed (approved) — 2026-08-11** — SHARED-first; B2–B8 separate auth; no auto-progression 
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md`; P1-GAP-083; CONF-P1A-001 / CONF-P1C-003; `P1A_12_P1B_RECONCILIATION.md`  
5. **Plain-language question:** Should Programme P1 stop after the shared shell foundation, or continue through the eight proposed presentation/hygiene batches?  
6. **Why required:** Narrow prompt vs broad readiness pack is an open conflict; implementers need a hard scope boundary.  
7. **Options:** (A) SHARED-only (effectively P1-B1 then stop); (B) SHARED-first, then explicitly authorise B2–B8 as P1 continuation; (C) Treat B1–B8 as one automatic P1 programme.  
8. **Benefits:** A matches `prompts/p1.md`; B preserves batch control; C maximises parity speed if desired.  
9. **Risks:** A leaves honesty/register gaps open longer; B requires more owner checkpoints; C risks silent scope creep and frozen-domain pressure.  
10. **Users / clinic ops:** Affects how soon inactive controls, demo menus, and module chrome honesty improve.  
11. **Privacy / security / a11y:** Breadth affects when B4 a11y evidence hardening happens — not certification itself.  
12. **Architecture / data / integrations:** Presentation/hygiene only if batches stay within stated prohibitions (no domain/PPA/payment).  
13. **Effect on batches:** Determines whether B2–B8 are in Programme P1 or later; B5–B8 especially depend on “broad” choice.  
14. **Dependencies:** Answer with OWN-P1-001; shapes OWN-P1-003 framing.  
15. **Specialist advice:** None required for scope shape.  
16. **Recommendation:** Prefer SHARED-first (B1), then explicitly authorise B2–B8 as continuation.  
17. **Reason:** Aligns prompt with readiness pack without auto-approving seven further batches.  
18. **Acceptance method:** Owner decision log stating Option A/B/C and what is *not* authorised.  
19. **Deferral consequence:** P1-GAP-083 remains; batch planning ambiguous.  
20. **Timing:** **Required before any coding** / before P1-B1 consideration (scope must be known).

### Decision card — OWN-P1-003

1. **Decision ID:** OWN-P1-003  
2. **Exact decision title:** Name the first implementation batch?  
3. **Current status:** **Closed (approved — naming only) — 2026-08-11** — named **P1-B1**; still unauthorised 
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md`; `P1_RECOMMENDED_FIRST_BATCH.md`; `P1_EXECUTION_BATCHES.md`  
5. **Plain-language question:** What is the first batch you expressly authorise for implementation planning-to-code transition (when you choose to authorise coding)?  
6. **Why required:** No batch auto-starts; coding without a named batch violates programme control.  
7. **Options:** (A) Name **P1-B1**; (B) Name a different batch; (C) Name no batch (remain planning-only).  
8. **Benefits:** A is dependency-led and domain-safe; B only if owner has a documented reason; C keeps freeze.  
9. **Risks:** Naming without 001/002 invites premature code; naming B2+ first skips shell foundation.  
10. **Users / clinic ops:** B1 targets shared chrome (sidebar/topbar/tokens), not clinical workflows.  
11. **Privacy / security / a11y:** B1 includes appearance/shell test hooks; not ASVS/E8/WCAG certification.  
12. **Architecture / data / integrations:** Shell/tokens/primitives only; no DB/CI/payment.  
13. **Effect on batches:** Names start gate; other seven remain unauthorised until separately named.  
14. **Dependencies:** OWN-P1-001 and OWN-P1-002 should be closed first.  
15. **Specialist advice:** None.  
16. **Recommendation:** Name **P1-B1** when ready to authorise product implementation.  
17. **Reason:** Documented safest first product batch; unlocks later chrome apply.  
18. **Acceptance method:** Owner log: “Authorises batch(es): P1-B1” and “Does NOT authorise: B2–B8 / PPA / payment / M25 / prod” as applicable.  
19. **Deferral consequence:** No lawful start under programme rules.  
20. **Timing:** **Required before any coding**; required before P1-B1 authorisation.

**Explicit:** P1-B1 remains **`P1 — PLANNED, NOT AUTHORISED`**. Closing OWN-P1-003 names the batch only; it does **not** authorise implementation.

---

## 4. Complete decision cards — every unresolved OWN-P1A-*

### OWN-P1A-001 — Accept P1A pack as definition-readiness baseline

1. **Decision ID:** OWN-P1A-001  
2. **Title:** Accept P1A pack as definition-readiness baseline (still not implementation auth)?  
3. **Status:** Open (`P1A — PLANNED, NOT AUTHORISED`)  
4. **Source:** `P1A_06` Register 20; roadmap phase 1 in `P1A_13`  
5. **Question:** Do you accept the P1A pack as the definition/delivery-readiness baseline for sequencing (not as permission to code)?  
6. **Why required:** Definition closure sequencing and DEF-GAP handling need a recognised baseline.  
7. **Options:** (A) Accept after review; (B) Request P1A remediation; (C) Defer.  
8. **Benefits:** A stabilises planning hierarchy; B improves pack quality; C keeps ambiguity.  
9. **Risks:** A mistaken for implementation auth; B/C delay definition closure.  
10. **Users / ops:** Indirect — better specs before UI change.  
11. **Privacy / security / a11y:** Pack includes proposed targets still needing separate OWN-P1A-002…005.  
12. **Architecture / data:** Cites hierarchy; does not pick persistence ADR.  
13. **Batches:** Does not authorise P1-B1; supports orderly entry after 001–003.  
14. **Dependencies:** Review alongside P1B/P1C; distinct from OWN-P1-001 (P0 tip).  
15. **Specialist advice:** Optional product/architecture review.  
16. **Recommendation:** Accept after review.  
17. **Reason:** Pack is reconciled with P1B; acceptance ≠ code auth (explicit in register).  
18. **Acceptance method:** Owner log + optional pack tip note.  
19. **Deferral:** Definition closure sequencing remains soft.  
20. **Timing:** Before definition closure / strongly before coding; not a substitute for OWN-P1-003.

### OWN-P1A-002 — Essential Eight Maturity Level Two target

1. **Decision ID:** OWN-P1A-002  
2. **Title:** Confirm Essential Eight **target Maturity Level Two** for production path?  
3. **Status:** Open — not approved  
4. **Source:** `P1A_06` Reg 20; `P1A_09` proposed targets; `P1C_08`  
5. **Question:** Is Maturity Level Two (ML2) the security-control *target* for the production path (assessment still required)?  
6. **Why required:** Hosting/shared-responsibility and roadmap need an owner-selected target level.  
7. **Options:** (A) Confirm ML2 target; (B) Select different maturity target; (C) Defer target selection.  
8. **Benefits:** A enables mapping/evidence plans; B may fit risk appetite; C avoids premature commitment.  
9. **Risks:** Treating target as achieved maturity; wrong level under/over-scopes controls.  
10. **Users / ops:** Later MFA/patching/backup expectations may affect staff login and admin practice.  
11. **Privacy / security / a11y:** Core security target decision — **proposal only until assessed**.  
12. **Architecture / data:** Influences IdP, backup, hardening — not P1-B1 shell tokens.  
13. **Batches:** Not required for P1-B1; aligns with P1C S9 / OWN-P1C-005.  
14. **Dependencies:** Answer together with OWN-P1A-003 and OWN-P1C-005.  
15. **Specialist advice:** Cybersecurity specialist / assessor before any ML2 claim.  
16. **Recommendation:** ML2 proposed as planning target (not certified).  
17. **Reason:** Consistent across P1A/P1C planning; ASD E8 model is the cited framework.  
18. **Acceptance method:** Owner log stating “target only — not assessed/certified”.  
19. **Deferral:** Security roadmap and prod go/no-go lack an agreed target.  
20. **Timing:** **Required before production** (target selection); advisory for early P1 coding.

### OWN-P1A-003 — OWASP ASVS Level 2 target

1. **Decision ID:** OWN-P1A-003  
2. **Title:** Confirm OWASP ASVS **Level 2** target for production path?  
3. **Status:** Open — not approved  
4. **Source:** `P1A_06` / `P1A_09`; ASVS **5.0.0** noted as latest stable in planning  
5. **Question:** Is ASVS Level 2 the application-security verification *target* for production?  
6. **Why required:** Threat-model and verification planning need a level.  
7. **Options:** (A) Confirm L2; (B) Other level; (C) Defer.  
8. **Benefits:** A enables V-category mapping; B/C as risk appetite dictates.  
9. **Risks:** Self-certification claims; scope mismatch with demo auth reality.  
10. **Users / ops:** Indirect until auth/session hardening lands.  
11. **Privacy / security / a11y:** Primary app-sec target — proposal only.  
12. **Architecture / data:** Affects authZ, logging, config — not shell chrome batch.  
13. **Batches:** Not P1-B1; couples with OWN-P1C-005 / S9.  
14. **Dependencies:** Answer with OWN-P1A-002 and OWN-P1C-005.  
15. **Specialist advice:** Application security review before claims.  
16. **Recommendation:** L2 proposed for production path.  
17. **Reason:** Register/P1C alignment; ASVS 5.0.0 cited as current stable baseline version.  
18. **Acceptance method:** Owner log — target only.  
19. **Deferral:** Security design pack lacks agreed verification level.  
20. **Timing:** **Required before production**; advisory for P1 product batches.

### OWN-P1A-004 — WCAG 2.2 AA accessibility target

1. **Decision ID:** OWN-P1A-004  
2. **Title:** Confirm WCAG **2.2 AA** as accessibility acceptance target?  
3. **Status:** Open — not approved  
4. **Source:** `P1A_06` / `P1A_09`; P1-B4; P1C S10  
5. **Question:** Is WCAG 2.2 Level AA the measurable accessibility acceptance target?  
6. **Why required:** B4 evidence harness and production a11y gates need a target.  
7. **Options:** (A) Confirm 2.2 AA; (B) Other level/version; (C) Defer.  
8. **Benefits:** A matches design-contract planning; enables evidence pack.  
9. **Risks:** Claiming AA without evidence; under-scoping keyboard/focus work.  
10. **Users / ops:** Affects keyboard and assistive-tech usability of shell/modules.  
11. **Privacy / security / a11y:** Direct a11y target — proposal until evidenced.  
12. **Architecture / data:** UI/evidence only.  
13. **Batches:** Informs P1-B4 acceptance; not a P1-B1 blocker.  
14. **Dependencies:** Relates to Decision A chrome; independent of E8/ASVS levels.  
15. **Specialist advice:** Accessibility review for AA evidence pack.  
16. **Recommendation:** AA proposed.  
17. **Reason:** Consistent P1A/P1C planning and W3C WCAG 2.2 Recommendation citation.  
18. **Acceptance method:** Owner log — target; evidence still required.  
19. **Deferral:** B4/S10 exit criteria remain soft.  
20. **Timing:** Before P1-B4 acceptance / **required before production** a11y claims.

### OWN-P1A-005 — Privacy counsel / PIA kickoff

1. **Decision ID:** OWN-P1A-005  
2. **Title:** Authorise privacy counsel / PIA kickoff (docs ≠ compliance)?  
3. **Status:** Open  
4. **Source:** `P1A_06`; `P1A_09` APP/PIA mapping; P1C S9; DEF-GAP privacy  
5. **Question:** May the programme engage privacy counsel and start a PIA process (documentation kickoff, not a compliance certificate)?  
6. **Why required:** Production personal-information processing needs qualified privacy path; planning docs are not a PIA.  
7. **Options:** (A) Authorise kickoff; (B) Defer until nearer production; (C) Decline / alternate approach.  
8. **Benefits:** A starts lawful assessment pathway; B delays cost; C only if different counsel model chosen.  
9. **Risks:** Mistaking kickoff for completed PIA; processing high-risk data without review.  
10. **Users / ops:** May later change consent notices, retention, access/correction UX.  
11. **Privacy / security / a11y:** Direct privacy governance decision.  
12. **Architecture / data:** Influences data minimisation and hosting disclosure — not P1-B1.  
13. **Batches:** Outside P1-B1…B8 product scope; blocks honest production claims.  
14. **Dependencies:** Complements OWN-P1A-002/003; P1C DEV-GAP-024.  
15. **Specialist advice:** **Privacy counsel / PIA practitioner — required** before production personal-info claims.  
16. **Recommendation:** Yes before production claims.  
17. **Reason:** OAIC PIA expectation mapped in P1A; docs alone insufficient.  
18. **Acceptance method:** Owner log authorising engagement scope (kickoff only).  
19. **Deferral:** Production privacy claims remain unsupported.  
20. **Timing:** **Required before production**; not required before P1-B1.

### OWN-P1A-006 — Historic register supersession banner (CONF-P1A-003)

1. **Decision ID:** OWN-P1A-006  
2. **Title:** Resolve CONF-P1A-003 historic register supersession banner?  
3. **Status:** Open  
4. **Source:** `P1A_06`; conflicts in P1A/P1C document-control docs  
5. **Question:** Should historic inventory/register docs receive a clear “prefer re-audit / superseded for status” banner treatment?  
6. **Why required:** Stale inventories can drive wrong rebuilds (R-P1C-03).  
7. **Options:** (A) Prefer re-audit + banners (no deletes); (B) Leave as-is; (C) Broader doc rewrite batch.  
8. **Benefits:** A reduces false status; preserves history; C is larger.  
9. **Risks:** Silent deletion (prohibited); banners without OWN-P1C-002 alignment.  
10. **Users / ops:** None direct.  
11. **Privacy / security / a11y:** Hygiene only.  
12. **Architecture / data:** Document control only.  
13. **Batches:** Docs hygiene — pair with OWN-P1C-001/002; not P1-B1 product code.  
14. **Dependencies:** Answer with OWN-P1C-002.  
15. **Specialist advice:** None.  
16. **Recommendation:** Prefer re-audit.  
17. **Reason:** P1C conflict register and closure stage S1.  
18. **Acceptance method:** Owner log + authorised docs-only batch when ready.  
19. **Deferral:** Onboarding/planning confusion persists.  
20. **Timing:** Before docs hygiene batch; advisory relative to product coding.

### OWN-P1A-007 — Commercial tenancy model (M20)

1. **Decision ID:** OWN-P1A-007  
2. **Title:** Commercial tenancy model (single-tenant vs multi-tenant SaaS) for M20 path?  
3. **Status:** Open  
4. **Source:** `P1A_06`; commercial notes in `P1A_11`; roadmap P8  
5. **Question:** For the future M20 commercial/SaaS path, is the working assumption single-tenant, multi-tenant, or undecided until P8?  
6. **Why required:** Packaging and isolation design diverge sharply by tenancy model.  
7. **Options:** (A) Defer detail to P8 and record assumption; (B) Decide single-tenant now; (C) Decide multi-tenant SaaS now.  
8. **Benefits:** A avoids premature commercial lock-in; B/C unlock earlier platform design.  
9. **Risks:** Early lock-in wrong; deferral may force rework later.  
10. **Users / ops:** Affects future multi-organisation packaging, not current wave modules.  
11. **Privacy / security / a11y:** Tenancy choice drives isolation/security boundaries later.  
12. **Architecture / data:** Major for future data plane — **not** resolved by P1-B1.  
13. **Batches:** Outside P1-B1…B8; M20 placeholder remains.  
14. **Dependencies:** Related to ARCH-01/DATA-01 production persistence eventually.  
15. **Specialist advice:** Commercial + security architecture when choosing B/C.  
16. **Recommendation:** Defer detail to P8; record assumption.  
17. **Reason:** Register recommendation; M20 not in P1 product batches.  
18. **Acceptance method:** Owner log of assumption vs decision.  
19. **Deferral:** Acceptable if explicitly recorded as deferred.  
20. **Timing:** **Deferred** / before M20 / P8; not before P1-B1.

### OWN-P1A-008 — AI features planned?

1. **Decision ID:** OWN-P1A-008  
2. **Title:** Any AI features planned?  
3. **Status:** Open  
4. **Source:** `P1A_06`; `P1A_11` AI governance note  
5. **Question:** Are any AI/ML product features in scope for near-term delivery, or confirm none?  
6. **Why required:** AI triggers extra governance, disclosure, and testing obligations.  
7. **Options:** (A) Confirm none planned; (B) Identify named AI features + governance batch; (C) Defer statement.  
8. **Benefits:** A keeps scope clean; B forces governance early; C risks silent AI adds.  
9. **Risks:** Undeclared AI in UI copy/helpers; governance debt.  
10. **Users / ops:** If AI added later, staff workflows and trust labelling change.  
11. **Privacy / security / a11y:** AI may invoke APP automated-decision disclosures.  
12. **Architecture / data:** Model hosting/vendors if B.  
13. **Batches:** None of P1-B1…B8 assume AI.  
14. **Dependencies:** None for P1 gate.  
15. **Specialist advice:** If B — privacy/security AI governance.  
16. **Recommendation:** None found — confirm none.  
17. **Reason:** Planning search found no authorised AI feature programme.  
18. **Acceptance method:** Owner confirmation in log.  
19. **Deferral:** Ambiguous AI governance posture.  
20. **Timing:** Advisory now; required before any AI implementation; not a P1-B1 blocker.

---

## 5. Complete decision cards — OWN-P1C-001…007

### OWN-P1C-001 — Docs hygiene batch (README / banners)

1. **Decision ID:** OWN-P1C-001  
2. **Title:** Authorise docs hygiene batch to banner/fix README?  
3. **Status:** Open (`P1C — PLANNED, NOT AUTHORISED`)  
4. **Source:** `P1C_12`; CONF-P1C-001; stages S1–S2  
5. **Question:** May a **docs-only** batch add supersession banners and fix stale root README claims?  
6. **Why required:** Root README currently misstates platform status (~20 modules / “no backend…” narrative).  
7. **Options:** (A) Yes after pack review (docs-only); (B) Broader rewrite; (C) Defer.  
8. **Benefits:** A reduces onboarding falsehoods without touching `src/`.  
9. **Risks:** Scope creep into code/CI; deleting history (forbidden).  
10. **Users / ops:** Improves operator/engineering onboarding accuracy.  
11. **Privacy / security / a11y:** Indirect (accurate security posture statements).  
12. **Architecture / data:** Documentation only.  
13. **Batches:** Separate from P1-B1; must not fold into shell work silently.  
14. **Dependencies:** Pair with OWN-P1C-002/004; after pack review.  
15. **Specialist advice:** None.  
16. **Recommendation:** Yes (docs-only) after pack review.  
17. **Reason:** Scorecard/hygiene findings HYG-P1C-002; S1–S2 plan.  
18. **Acceptance method:** Owner names a docs-only batch in decision log.  
19. **Deferral:** Stale README continues to mislead.  
20. **Timing:** Before docs hygiene implementation; **not** a substitute for OWN-P1-001…003; can precede product coding as docs-only if expressly authorised.

### OWN-P1C-002 — Re-audit supersedes CURRENT_PLATFORM_INVENTORY for status

1. **Decision ID:** OWN-P1C-002  
2. **Title:** Confirm re-audit supersedes CURRENT_PLATFORM_INVENTORY for status?  
3. **Status:** Open  
4. **Source:** `P1C_12`; CONF-P1C-002; S1  
5. **Question:** For *current status*, should `CURRENT_IMPLEMENTATION_REAUDIT.*` preferred over older `CURRENT_PLATFORM_INVENTORY.md`?  
6. **Why required:** Conflicting inventories (iframe/~48 routes vs Next workspaces/24 modules).  
7. **Options:** (A) Yes — prefer re-audit for status; keep historic inventory; (B) Prefer inventory; (C) Merge rewrite.  
8. **Benefits:** A matches observed runtime; preserves history.  
9. **Risks:** Wrong preference drives incorrect rebuild scope.  
10. **Users / ops:** None direct.  
11. **Privacy / security / a11y:** Hygiene.  
12. **Architecture / data:** SoT for status statements.  
13. **Batches:** Docs/planning; aligns OWN-P1A-006.  
14. **Dependencies:** Answer with OWN-P1A-006 / OWN-P1C-001.  
15. **Specialist advice:** None.  
16. **Recommendation:** Yes.  
17. **Reason:** P1C conflict analysis and runtime evidence.  
18. **Acceptance method:** Owner log + banner text approval.  
19. **Deferral:** Status contradictions remain.  
20. **Timing:** Before docs hygiene batch; advisory for product coding.

### OWN-P1C-003 — Playwright configure vs remove later

1. **Decision ID:** OWN-P1C-003  
2. **Title:** Playwright: configure E2E harness vs remove later?  
3. **Status:** Open  
4. **Source:** `P1C_12`; CONF-P1C-008; HYG-P1C-003; S4  
5. **Question:** Should Playwright stay as a future a11y/visual harness (configure later) or be removed in a later cleanup?  
6. **Why required:** Dependency present without evidenced harness → false confidence.  
7. **Options:** (A) Configure later for a11y/visual; no dep change now; (B) Remove later; (C) Configure now (would be a named eng batch — not this briefing’s implementation).  
8. **Benefits:** A reuses installed tool for B4/S10; B reduces dead weight.  
9. **Risks:** Leaving unconfigured implies E2E exists; removing may hinder a11y evidence.  
10. **Users / ops:** None direct.  
11. **Privacy / security / a11y:** Affects future a11y evidence tooling.  
12. **Architecture / data:** Test tooling only.  
13. **Batches:** Not P1-B1; relates to B4/S4/S10.  
14. **Dependencies:** OWN-P1A-004 for AA target usefulness.  
15. **Specialist advice:** None for direction; QA eng for harness design.  
16. **Recommendation:** Configure for a11y/visual later; **no dependency change now**.  
17. **Reason:** Register recommendation; avoids silent dep churn in planning.  
18. **Acceptance method:** Owner log; implement only in named batch later.  
19. **Deferral:** False E2E confidence persists.  
20. **Timing:** Before S4 closure / before relying on Playwright evidence; not before P1-B1 coding gate.

### OWN-P1C-004 — Adopt ADR folder process

1. **Decision ID:** OWN-P1C-004  
2. **Title:** Adopt ADR folder process?  
3. **Status:** Open  
4. **Source:** `P1C_12`; `P1C_05` ADR posture; ARCH-02  
5. **Question:** Should Architecture Decision Records (ADRs — short decision memos in a standard folder) be adopted so drafts are not treated as binding until accepted?  
6. **Why required:** Decisions are embedded across wave docs; production path needs traceable ADRs (esp. persistence).  
7. **Options:** (A) Adopt ADR process; (B) Keep status quo; (C) Alternate decision log.  
8. **Benefits:** A improves traceability for ARCH-01/DATA-01 later.  
9. **Risks:** Process overhead; inventing binding ADRs without owner accept.  
10. **Users / ops:** None direct.  
11. **Privacy / security / a11y:** Indirect governance quality.  
12. **Architecture / data:** Enables future persistence ADR.  
13. **Batches:** Docs/process; S1; not P1-B1 product scope.  
14. **Dependencies:** Useful before OWN-P1C-007 / data path decisions.  
15. **Specialist advice:** None.  
16. **Recommendation:** Yes.  
17. **Reason:** P1C architecture finding ARCH-02; proposed ADR titles remain draft-only.  
18. **Acceptance method:** Owner log adopting process + folder location when authorised.  
19. **Deferral:** Binding-vs-draft ambiguity continues.  
20. **Timing:** Before treating architecture drafts as binding; before production data ADR; not a P1-B1 product blocker.

### OWN-P1C-005 — Confirm ASVS 5.0.0 L2 + E8 ML2 targets

1. **Decision ID:** OWN-P1C-005  
2. **Title:** Confirm ASVS **5.0.0 Level 2** + E8 **ML2** targets?  
3. **Status:** Open  
4. **Source:** `P1C_12`; `P1C_08`  
5. **Question:** Do you confirm the combined production-path targets: ASVS 5.0.0 Level 2 and Essential Eight ML2?  
6. **Why required:** P1C security closure stage needs explicit confirmation aligned to P1A.  
7. **Options:** (A) Confirm both as targets; (B) Confirm with qualifications; (C) Defer / diverge from P1A.  
8. **Benefits:** A aligns packs; B records nuance; C must state alternate.  
9. **Risks:** Conflict with OWN-P1A-002/003 if answered differently; certification misunderstanding.  
10. **Users / ops:** Indirect.  
11. **Privacy / security / a11y:** Security target confirmation — **not assessment**.  
12. **Architecture / data:** Roadmap only.  
13. **Batches:** Not P1-B1.  
14. **Dependencies:** **Must align with OWN-P1A-002/003** — answer together.  
15. **Specialist advice:** Same as P1A security specialists before claims.  
16. **Recommendation:** Align with OWN-P1A-002/003 (targets only).  
17. **Reason:** Explicit register recommendation; avoids dual conflicting targets.  
18. **Acceptance method:** Single owner log covering P1A-002/003 + P1C-005.  
19. **Deferral:** S9 cannot close.  
20. **Timing:** **Required before production**; answer-together with OWN-P1A-002/003.

### OWN-P1C-006 — Authorise CI workflow introduction

1. **Decision ID:** OWN-P1C-006  
2. **Title:** Authorise CI workflow introduction (engineering batch)?  
3. **Status:** Open  
4. **Source:** `P1C_12`; S5; CI score 0/5  
5. **Question:** May a **separate named engineering batch** introduce CI workflows (not folded into P1-B1)?  
6. **Why required:** No CI workflows today; supply-chain/PR quality gates missing.  
7. **Options:** (A) Yes as separate named batch — not P1-B1; (B) Defer CI; (C) Combine with product batch (not recommended).  
8. **Benefits:** A improves merge safety; separates eng readiness from shell work.  
9. **Risks:** Silent CI scope inside P1-B1; secret leakage if misconfigured.  
10. **Users / ops:** None direct.  
11. **Privacy / security / a11y:** Supply-chain security benefit if done well.  
12. **Architecture / data:** Pipeline only; no schema change implied.  
13. **Batches:** Explicitly **not P1-B1**; S5 engineering-readiness.  
14. **Dependencies:** Prefer after docs/test standards (S2–S4); independent of OWN-P1-003 product naming.  
15. **Specialist advice:** Optional DevOps review.  
16. **Recommendation:** Yes as separate named batch — not P1-B1.  
17. **Reason:** P1C stage separation rule; scorecard CI = 0.  
18. **Acceptance method:** Owner names distinct eng batch in log.  
19. **Deferral:** PRs lack automated gates.  
20. **Timing:** Before relying on CI for production path; **not** required before considering P1-B1, but must not be smuggled into P1-B1.

### OWN-P1C-007 — Production hosting target

1. **Decision ID:** OWN-P1C-007  
2. **Title:** Production hosting target (container vs managed Next)?  
3. **Status:** Open  
4. **Source:** `P1C_12`; S6  
5. **Question:** For production packaging, prefer containerised deploy, managed Next hosting, or another named platform?  
6. **Why required:** Dockerfile/compose vs platform-native design diverges at S6.  
7. **Options:** (A) Container path; (B) Managed Next (or named PaaS); (C) Defer until after S5.  
8. **Benefits:** Clear deploy design; avoids building both.  
9. **Risks:** Early lock-in; deferral blocks S6 exit.  
10. **Users / ops:** Affects uptime/ops model later, not current demo use.  
11. **Privacy / security / a11y:** Hosting location affects APP8 / shared responsibility with E8.  
12. **Architecture / data:** Deploy topology; interacts with future persistence.  
13. **Batches:** Not P1-B1…B8 product chrome.  
14. **Dependencies:** After/with ADR process; before S6; relate to tenancy later.  
15. **Specialist advice:** Cloud/ops architect.  
16. **Recommendation:** `OWNER INPUT REQUIRED — NO SAFE DEFAULT ESTABLISHED` (register says decide before S6; no evidenced preferred host).  
17. **Reason:** No production hosting acceptance evidence in packs; choosing silently would invent architecture.  
18. **Acceptance method:** Owner log naming platform class + non-goals.  
19. **Deferral:** S6 packaging design stalls.  
20. **Timing:** **Required before production** / before S6; not before P1-B1.

---

## 6. Additional unresolved owner decisions (P1B carry-forward)

### 6.1 Required for complete P1 batch briefing (still Open)

#### OWN-P1-004 — Inactive Topbar Export / MFA / New Entry

1. **ID:** OWN-P1-004  
2. **Title:** Inactive Topbar Export / MFA / New Entry: hide, truthful non-op, or defer backend to P2+?  
3. **Status:** Open  
4. **Source:** `P1_OWNER_DECISION_REGISTER.md`; P1-GAP-005; batch P1-B2  
5. **Question:** For inactive top-bar actions, hide them, show as truthful non-operational, or build backends now?  
6. **Why required:** Avoids fake success UX and scope creep into export/MFA backends.  
7. **Options:** (A) Truthful non-op; (B) Hide in P1; (C) Backend in P2+ (not P1).  
8. **Benefits:** A/B keep honesty; C defers real capability correctly.  
9. **Risks:** Backend-in-P1 expands scope; hiding may reduce discoverability.  
10. **Users / ops:** Staff see honest controls vs missing affordances.  
11. **Privacy / security / a11y:** MFA labelling must not imply completed security control.  
12. **Architecture / data:** No backend in P1 per recommendation.  
13. **Batches:** Blocks clear P1-B2 disposition.  
14. **Dependencies:** After B1 preferred; with OWN-P1-008 for demo honesty theme.  
15. **Specialist advice:** None for hide vs label.  
16. **Recommendation:** Truthful non-op **or** hide in P1; backend not P1.  
17. **Reason:** Register + B2 prohibitions.  
18. **Acceptance method:** Owner log selecting A/B and excluding backend.  
19. **Deferral:** B2 cannot cleanly exit.  
20. **Timing:** **Required before affected batch (P1-B2)**.

#### OWN-P1-005 — Clinic multi-select scope

1. **ID:** OWN-P1-005  
2. **Title:** Clinic multi-select: shell-wide vs Command Centre only (Accepted difference)?  
3. **Status:** Open  
4. **Source:** Register; P1-GAP-006; NFR-SCALE-01  
5. **Question:** Is Command Centre-only multi-clinic selection an accepted difference, or must shell-wide support be scheduled (B2)?  
6. **Why required:** Multi-clinic ops expectation vs current shell behaviour.  
7. **Options:** (A) Document Accepted difference; (B) Schedule shell support in B2; (C) Defer to later wave.  
8. **Benefits:** A stops false defect scoring; B improves parity.  
9. **Risks:** Accepting difference that clinics reject; B expands B2.  
10. **Users / ops:** Directly affects multi-clinic filtering habits.  
11. **Privacy / security / a11y:** Clinic isolation UX — server enforcement still future (DATA-05).  
12. **Architecture / data:** Scope-control behaviour; not SQL migration.  
13. **Batches:** B2 / gap 006.  
14. **Dependencies:** None on 001–003 beyond programme start.  
15. **Specialist advice:** None.  
16. **Recommendation:** Document Accepted difference **or** schedule shell support in B2 (owner product choice).  
17. **Reason:** Both options supported; **no single safe default** beyond “decide explicitly”. If forced to pick implementation posture without clinic ops input: `OWNER INPUT REQUIRED — NO SAFE DEFAULT ESTABLISHED` for A vs B.  
18. **Acceptance method:** Owner log: Accepted difference **or** B2 scope inclusion.  
19. **Deferral:** Gap 006 remains contested.  
20. **Timing:** **Required before P1-B2** (for that gap’s disposition).

#### OWN-P1-006 — M11 register/condition/section sync

1. **ID:** OWN-P1-006  
2. **Title:** Authorise M11 register/condition/section sync without domain change?  
3. **Status:** Open  
4. **Source:** Register; P1-GAP-011; B3  
5. **Question:** May M11 register metadata be synced to TrainingWorkspace reality without changing training domain behaviour?  
6. **Why required:** Stale registers invent “implemented” conditions/sections.  
7. **Options:** (A) Yes — register sync only; (B) No / defer; (C) Broader M11 domain work (out of B3).  
8. **Benefits:** A restores scoring honesty.  
9. **Risks:** Accidental domain edits if scope poorly controlled.  
10. **Users / ops:** Nav/section lists become truthful.  
11. **Privacy / security / a11y:** Honesty only.  
12. **Architecture / data:** Metadata/`module-register` — preserve domain.  
13. **Batches:** B3 / 011.  
14. **Dependencies:** After B1 if sequenced; with OWN-P1-007 for B3.  
15. **Specialist advice:** None.  
16. **Recommendation:** Yes.  
17. **Reason:** Register recommendation; B3 objective.  
18. **Acceptance method:** Owner log — register sync only, no domain change.  
19. **Deferral:** False readiness scoring continues.  
20. **Timing:** **Required before P1-B3** for gap 011.

#### OWN-P1-007 — M07 History/Adjustments honesty labelling (not PPA)

1. **ID:** OWN-P1-007  
2. **Title:** Authorise M07 History/Adjustments honesty labelling (not PPA product)?  
3. **Status:** Open  
4. **Source:** Register; P1-GAP-012 / 079; CONF-P1C-006; OWN-PPA-SEPARATE carry-forward  
5. **Question:** May M07 History/Adjustments UI copy be corrected for honesty without authorising PPA product work?  
6. **Why required:** “PPA foundation” wording risks implying authorised prior-period adjustment.  
7. **Options:** (A) Yes — honesty labelling only; (B) Defer; (C) Authorise PPA (separate — OWN-P1-011).  
8. **Benefits:** A protects PPA boundary; C is out of ordinary prep.  
9. **Risks:** Labelling mistaken for PPA auth; leaving wording misleads auditors.  
10. **Users / ops:** Payroll prep users see clearer non-PPA labels.  
11. **Privacy / security / a11y:** Governance honesty.  
12. **Architecture / data:** No PPA cycle, payment, or unlock-as-PPA.  
13. **Batches:** B3; must not become PPA batch.  
14. **Dependencies:** Distinct from OWN-P1-011; respects OWN-PPA-SEPARATE.  
15. **Specialist advice:** None for labelling; payroll SME if copy disputed.  
16. **Recommendation:** Yes — honesty only.  
17. **Reason:** Register + wave-control PPA separation.  
18. **Acceptance method:** Owner log explicitly “NOT PPA authorisation”.  
19. **Deferral:** Wording risk remains.  
20. **Timing:** **Required before P1-B3** for those gaps.

#### OWN-P1-008 — Demo/QA menus visibility

1. **ID:** OWN-P1-008  
2. **Title:** Demo/QA menus: retain visible, gate behind flag, or remove from portal?  
3. **Status:** Open  
4. **Source:** Register; P1-GAP-032; B2  
5. **Question:** Should demo/QA menus stay visible, sit behind an explicit QA flag, or be removed from the portal?  
6. **Why required:** Demo reset/governance surfaces must not look like production controls.  
7. **Options:** (A) Gate behind explicit QA flag; (B) Retain visible; (C) Remove from portal.  
8. **Benefits:** A balances QA need vs prod honesty; C maximises prod cleanliness.  
9. **Risks:** Visible demos in prod-like envs; removal slows QA.  
10. **Users / ops:** Prevents accidental demo resets in real use.  
11. **Privacy / security / a11y:** Reduces accidental data-reset risk.  
12. **Architecture / data:** Flag/config only in B2 intent.  
13. **Batches:** B2 / 032.  
14. **Dependencies:** With OWN-P1-004 honesty theme.  
15. **Specialist advice:** None.  
16. **Recommendation:** Gate behind explicit QA flag.  
17. **Reason:** Register recommendation.  
18. **Acceptance method:** Owner log selecting A/B/C.  
19. **Deferral:** Demo governance gap remains.  
20. **Timing:** **Required before P1-B2**.

### 6.2 Deferred open decisions (OWN-P1-009…014) and theme carry-forward

| ID | Question (plain) | Earliest | Timing class | Recommendation (evidence) |
| --- | --- | --- | --- | --- |
| OWN-P1-009 | Authorise M01/M02/M03 durable domain services? | P2 | Deferred | Not P1 — domain wave later |
| OWN-P1-010 | Authorise M10 unblock approach? | P3 | Deferred | Outside P1 batches |
| OWN-P1-011 | Authorise named PPA implementation batch? | Separate | Deferred | Planning exists; **not** auth; unlock ≠ PPA |
| OWN-P1-012 | Authorise M08–M24 rebuild batches? | P4–P8 | Deferred | Placeholders remain |
| OWN-P1-013 | Accept M25 future planning artefacts? | Outside P1 | Deferred | Parked branch only |
| OWN-P1-014 | Production deployment / merge / PR? | After P9-style verification | Before production | Do not merge/deploy from planning packs alone |
| OWN-P1-015 | Reopen branded global themes? | — | Closed unless owner reopens `DEC-BRANDED-THEMES` | Not recommended to reopen |

Each deferred ID remains **Open (deferred)** except OWN-P1-015’s carry-forward closed posture — **this briefing does not reopen or close it**.

### 6.3 OWN-P1-016 — ARCH-01 / DATA-01 (OPEN — created 2026-08-11)

| Field | Content |
| --- | --- |
| Decision ID | **OWN-P1-016** (next free `OWN-P1-*` after OWN-P1-015) |
| Finding IDs | **ARCH-01** (`P1C_05`), **DATA-01** (`P1C_07`) |
| Issue | Runtime app data uses browser **localStorage** (keys per `PLATFORM_STORAGE_REGISTER.md`); a portable SQL migration exists but is **not** the live application database on this tip. Production persistence, tenancy enforcement, and migration approach are unresolved. |
| Status | **Open** — assigned OWN-ID; **not** decided or closed |
| Risk | High — localStorage mistaken for production DB (R-P1C-04); blocks honest S11 data-platform exit |
| Relation to batches | **Not** solved by P1-B1, docs hygiene, or CI batches; **does not** block P1-B1 consideration/naming |
| Recommendation | `OWNER INPUT REQUIRED — NO SAFE DEFAULT ESTABLISHED`; adopt ADR process (OWN-P1C-004) then owner-authorise a persistence ADR in a named data batch |
| Timing | **Required before production** data path |
| Full entry | See [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md) — OWN-P1-016 |

---

## 7. Decision-dependency and sequencing table

| Order | Decisions | Notes |
| ---: | --- | --- |
| 1 | OWN-P1-001 → OWN-P1-002 → OWN-P1-003 | **Closed 2026-08-11** (planning); P1-B1 still needs separate implementation auth |
| 2 | OWN-P1A-001 | Definition baseline; parallel/soon after pack review |
| 3 | OWN-P1C-001 + OWN-P1C-002 + OWN-P1A-006 (+ OWN-P1C-004) | Docs/SoT hygiene cluster — answer together |
| 4 | OWN-P1-004 + OWN-P1-005 + OWN-P1-008 | Before P1-B2 |
| 5 | OWN-P1-006 + OWN-P1-007 | Before P1-B3; 007 ≠ OWN-P1-011 |
| 6 | OWN-P1A-004 (+ OWN-P1C-003) | Before B4/S10 evidence reliance |
| 7 | OWN-P1A-002 + OWN-P1A-003 + OWN-P1C-005 | **Answer together** — security targets |
| 8 | OWN-P1A-005 | PIA kickoff before prod claims |
| 9 | OWN-P1C-006 | Separate eng batch; never silent in P1-B1 |
| 10 | OWN-P1C-007 + **OWN-P1-016** (ARCH-01/DATA-01) (+ ADR) | Before S6/S11 / production data path |
| 11 | OWN-P1A-007 / OWN-P1A-008 | Commercial/AI — deferred or confirm-none |
| 12 | OWN-P1-009…014 | Later waves / PPA / M25 / prod merge |

**Conflicts to report (not silently resolved):**

1. **CONF-P1A-001 / P1-GAP-083:** `prompts/p1.md` SHARED-only vs P1B B1–B8 breadth → **OWN-P1-002**.  
2. **CONF-P1C-002:** Inventory vs re-audit → **OWN-P1C-002**.  
3. **ARCH-01 / DATA-01:** localStorage vs SQL — tracked as **OWN-P1-016** (**Open**).  
4. **OWN-P1-007 vs OWN-P1-011:** honesty labelling must not be read as PPA authorisation.  
5. **OWN-P1C-005 vs OWN-P1A-002/003:** must not diverge.

---

## 8. Decisions required before coding

| ID | Status | Why still matters |
| --- | --- | --- |
| OWN-P1-001 | **Closed** 2026-08-11 | Cleared `OWN-NO-P1-YET` for programme entry |
| OWN-P1-002 | **Closed** 2026-08-11 | Bound SHARED-first; no auto B2–B8 |
| OWN-P1-003 | **Closed** 2026-08-11 (naming only) | Named **P1-B1** — still **not** authorised |

Until the named batch is **expressly authorised for implementation**, **no product coding** under P1 rules. Planning closure of 001–003 is **not** that authorisation.

Docs-only hygiene (OWN-P1C-001 etc.) may be authorised separately but is **not** automatic and is **not** P1-B1.

---

## 9. Decisions permitted to wait until later batches

| ID | Wait until |
| --- | --- |
| OWN-P1-004, 005, 008 | Before / at P1-B2 |
| OWN-P1-006, 007 | Before / at P1-B3 |
| OWN-P1A-004, OWN-P1C-003 | Before B4 / a11y harness reliance |
| OWN-P1-002 continuation authorisations | Before each of B2–B8 if SHARED-first model chosen |
| OWN-P1C-006 | Named eng batch (S5), not folded into B1 |
| OWN-P1A-006, OWN-P1C-001/002/004 | Docs hygiene stages S1–S2 |

---

## 10. Decisions required before production

| ID / finding | Why |
| --- | --- |
| OWN-P1A-002, OWN-P1A-003, OWN-P1C-005 | Security targets selected (still need assessment) |
| OWN-P1A-004 | Accessibility target for evidence pack |
| OWN-P1A-005 | Privacy counsel / PIA kickoff path |
| OWN-P1C-007 | Hosting target |
| **OWN-P1-016** / ARCH-01 / DATA-01 (+ persistence ADR) | Production data durability & tenancy |
| OWN-P1-014 | Explicit production deployment / merge / PR authority |
| OWN-P1-011 | Only if PPA product is ever claimed (separate) |

Production readiness today remains ~**1/5** per P1C scorecard — planning acceptance ≠ production approval.

---

## 11. Contradictions or missing source evidence

| Item | Status |
| --- | --- |
| Narrow vs broad P1 | **Closed** — OWN-P1-002 (SHARED-first) |
| Inventory vs re-audit | Open — OWN-P1C-002 |
| localStorage vs SQL production path | **OWN-P1-016 Open** (ARCH-01/DATA-01) |
| Hosting platform preference | OWN-P1C-007 — no evidenced default |
| Clinic multi-select A vs B | OWN-P1-005 — product choice; no single safe default without owner ops preference |
| PPA UI wording vs PPA auth | Managed by separating OWN-P1-007 vs OWN-P1-011 |
| `openOwnerDecisions: 0` in register validator | Refers to prior DEC-* conflict pack metric — **does not** mean OWN-P1* are closed |

---

## 12. Blank owner-response table

| Decision ID | Selected option | Owner wording or qualification | Decision date | Evidence reference | Status |
| --- | --- | --- | --- | --- | --- |
| OWN-P1-001 | Conditionally approve P0 tip `b0c4c4d20de1cce7adac5d691c506122e30610a2`; clear `OWN-NO-P1-YET` | Unique SHA verified; no implementation auth | 2026-08-11 | `P1_OWNER_DECISION_REGISTER.md` | **Closed** |
| OWN-P1-002 | SHARED-first; B2–B8 separate auth; no auto-progression | Planning closure only | 2026-08-11 | `P1_OWNER_DECISION_REGISTER.md` | **Closed** |
| OWN-P1-003 | Name first batch **P1-B1** | Naming ≠ auth; P1-B1 unauthorised | 2026-08-11 | `P1_OWNER_DECISION_REGISTER.md` | **Closed** |
| OWN-P1A-001 |  |  |  |  | Open |
| OWN-P1A-002 |  |  |  |  | Open |
| OWN-P1A-003 |  |  |  |  | Open |
| OWN-P1A-004 |  |  |  |  | Open |
| OWN-P1A-005 |  |  |  |  | Open |
| OWN-P1A-006 |  |  |  |  | Open |
| OWN-P1A-007 |  |  |  |  | Open |
| OWN-P1A-008 |  |  |  |  | Open |
| OWN-P1C-001 |  |  |  |  | Open |
| OWN-P1C-002 |  |  |  |  | Open |
| OWN-P1C-003 |  |  |  |  | Open |
| OWN-P1C-004 |  |  |  |  | Open |
| OWN-P1C-005 |  |  |  |  | Open |
| OWN-P1C-006 |  |  |  |  | Open |
| OWN-P1C-007 |  |  |  |  | Open |
| OWN-P1-004 |  |  |  |  | Open |
| OWN-P1-005 |  |  |  |  | Open |
| OWN-P1-006 |  |  |  |  | Open |
| OWN-P1-007 |  |  |  |  | Open |
| OWN-P1-008 |  |  |  |  | Open |
| OWN-P1-009 |  |  |  |  | Open (deferred) |
| OWN-P1-010 |  |  |  |  | Open (deferred) |
| OWN-P1-011 |  |  |  |  | Open (deferred) |
| OWN-P1-012 |  |  |  |  | Open (deferred) |
| OWN-P1-013 |  |  |  |  | Open (deferred) |
| OWN-P1-014 |  |  |  |  | Open (deferred) |
| OWN-P1-016 (ARCH-01 / DATA-01) |  |  |  | `P1_OWNER_DECISION_REGISTER.md` | **Open** |

---

## 13. Recommended immediate next action

1. Gate decisions OWN-P1-001…003 are recorded closed (2026-08-11) — planning only.  
2. Owner may *consider* expressly authorising **P1-B1** as a **separate** authorisation act (still required before coding).  
3. In parallel (optional), owner may authorise a **docs-only** hygiene batch (OWN-P1C-001/002) — still not product implementation.  
4. Resolve **OWN-P1-016** (localStorage vs SQL) before any production data-path claims.  
5. Do **not** start P1-B1, CI, DB, deps, PPA, payment, M25, or production merge from planning packs alone.

---

*End of briefing. Authoritative outcomes for OWN-P1-001…003 and open OWN-P1-016 live in `P1_OWNER_DECISION_REGISTER.md`. P1-B1 remains unauthorised.*

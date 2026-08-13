# P1-B2 Owner-Decision Briefing — Shell truthfulness / inactive controls / demo honesty

**Document type:** Owner-decision briefing only (analysis + recommendations)  
**Status stamp:** `P1 — PLANNED, NOT AUTHORISED` for **P1-B2**  
**Branch:** `cursor/p1-b1-shared-shell-foundation`  
**Documentation tip (this publish):** *see commit after publish*  
**Accepted P1-B1 implementation tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`  
**Briefing date:** 2026-08-13  

> **This briefing does not approve, select, close or implement any owner decision.**  
> **Completing or publishing this briefing does not authorise P1-B2.**  
> Recommendations below are Cursor evidence-based suggestions only — the owner must choose.

**Authoritative registers (do not treat this briefing as a replacement):**

| Pack | Register |
| --- | --- |
| P1B decisions | [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md) |
| P1B batches | [`P1_EXECUTION_BATCHES.md`](./P1_EXECUTION_BATCHES.md) |
| P1B gaps | [`P1_PROTOTYPE_PARITY_GAP_REGISTER.md`](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md) |
| P1-B1 acceptance | [`../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md) |
| P1A decisions | [`p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md`](./p1a/P1A_06_MASTER_REGISTERS_11_TO_20.md#register-20--risks-assumptions-dependencies-owner-decisions) |
| P1C decisions | [`p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md`](./p1c/P1C_12_PRODUCTION_SCORECARD_AND_DECISIONS.md) |

**Platform boundary (unchanged):** multi-organisation, multi-clinic, **non-clinical** medical-centre operations platform; **24** runtime modules (M01–M24); **M25** separate/future; **PPA** and **payment execution** out of scope; Best Practice (or equivalent) remains clinical system of record.

---

## 1. Executive summary

P1-B1 (shared Decision A shell foundation) is **owner accepted with qualifications and closed** (2026-08-13) at tip `fdb2beb5b0e786e42d358efa9875b6bba52666cd`. The next proposed batch is **P1-B2 — shell truthfulness / inactive-control disposition / demo honesty**. P1-B2 remains **`P1 — PLANNED, NOT AUTHORISED`**.

Before the owner can safely authorise P1-B2, three open register decisions must be answered:

| ID | Topic |
| --- | --- |
| **OWN-P1-004** | What to do with inactive Topbar Export / MFA / New Entry controls |
| **OWN-P1-005** | Whether clinic multi-select is Command Centre–only (accepted difference) or shell-wide |
| **OWN-P1-008** | Whether demo/QA menus stay visible, are gated, or are removed |

A **P1-B1 acceptance qualification** also requires P1-B2 to address **demo identity consistency** (Sidebar “Sarah Mitchell” vs Command Centre greeting “Neil”, plus Action Inbox “Alex Chen” / local role overrides). No existing `OWN-P1-###` ID fully covers that choice. Under the controlled sequential numbering, the next ID is **OWN-P1-017** — proposed here for owner response; **not** added to the register by this briefing and **not** closed.

**All three of OWN-P1-004, OWN-P1-005 and OWN-P1-008 should close before P1-B2 authorisation.** OWN-P1-017 (if adopted) should also close before P1-B2 authorisation if the Sarah/Neil qualification is in scope for B2 exit. Other decisions (OWN-P1-006/007 → B3; OWN-P1-016 → production data path; OWN-P1A-*; OWN-P1C-*) may remain deferred for P1-B2.

P1-B2 must stay limited to **truthfulness, inactive-control disposition and demo honesty**. It must **not** implement fake backends, production authentication, SQL/durable architecture, export-processing services, MFA infrastructure, patient/clinical scope, PPA, payments, M25, or later-batch presentation work.

---

## 2. Recommendation summary (not owner selections)

| Decision | Plain-language choice | Recommended answer | Why | What it unlocks | Risk if deferred |
| --- | --- | --- | --- | --- | --- |
| OWN-P1-004 | Hide, truthfully disable, keep as labelled demo, or build backends later? | **Disable with truthful explanation** in P1; **backend outside P1** | Honest UX without inventing Export/MFA capability; avoids toast-as-success | Clear P1-B2 Topbar disposition (GAP-005/030) | Fake operational confidence; B2 cannot exit cleanly |
| OWN-P1-005 | Multi-clinic select shell-wide, CC-only accepted difference, or defer? | **Command Centre only as Accepted difference** for P1 | Matches current Topbar toast behaviour; shell-wide multi-select is feature work beyond B2 honesty | Honest GAP-006 disposition without expanding B2 | Contested gap; ops confusion continues |
| OWN-P1-008 | Demo/QA menus visible, gated, or removed? | **Gate behind explicit QA/demo mode** | Balances QA need with production honesty; reduces accidental resets | Clear GAP-032/071/073 governance | Demo tools look live; seed mistaken for truth |
| OWN-P1-017 *(proposed)* | How should visible “you are” identity labels behave? | **One global demo identity drives all “current user” labels**; seed character names may remain as labelled demo data | Fixes Sarah/Neil contradiction without inventing production auth | Satisfies P1-B1 identity qualification | Users think they are authenticated as Neil while Act-as shows Sarah |

**Must close before P1-B2 authorisation:** OWN-P1-004, OWN-P1-005, OWN-P1-008 (and OWN-P1-017 if the owner adopts that ID for the identity qualification).  
**May remain deferred for P1-B2:** OWN-P1-006/007 (B3), OWN-P1-009…015, OWN-P1-016, OWN-P1A-*, OWN-P1C-* (except as honesty context).  
**Recommendations are not owner selections.** Completing this briefing **does not** authorise P1-B2.

---

## 3. Verified current status

| Item | Evidence |
| --- | --- |
| Branch | `cursor/p1-b1-shared-shell-foundation` |
| Accepted P1-B1 tip | `fdb2beb5b0e786e42d358efa9875b6bba52666cd` |
| P1-B1 status | Owner accepted with qualifications — **CLOSED** (2026-08-13) |
| P1-B2 status | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B3–P1-B8 | Unauthorised |
| Gap inventory | **83** gaps accounted for |
| Batch inventory | **8** batches accounted for |
| Runtime modules | **24** (M01–M24); M25 not implemented |
| `OWN-P1-016` | **Open** — does **not** block P1-B2 consideration |
| Automatic progression | **Prohibited** (OWN-P1-002; P1-B1 acceptance qualifications) |
| PR / merge / deploy | None authorised by this briefing |
| GitHub CI | Still absent on this branch (P1-B1 qualification) |

### P1-B1 qualifications that affect P1-B2

From `P1-B1-OWNER-ACCEPT-2026-08-13` / implementation evidence:

- Sarah/Neil demo identity consistency remains **P1-B2**  
- `OWN-P1-016` remains open  
- P1-B2–P1-B8 remain separately unauthorised  
- No automatic progression to P1-B2  
- No production / overall Programme P1 acceptance  
- Pixel-diff deferred (later batch — not a P1-B2 truthfulness blocker)

### P1-B2 gap set (authoritative)

| Gap ID | Topic | Owner clarification |
| --- | --- | --- |
| P1-GAP-005 | Inactive Topbar Export / MFA / New Entry | **Yes** → OWN-P1-004 |
| P1-GAP-006 | Clinic multi-select CC-only vs shell-wide | **Yes** → OWN-P1-005 |
| P1-GAP-007 | Dashboard non-operational shell cards | No — preserve truthful non-op labels |
| P1-GAP-018* | M03 demo controls labelling (not durable services) | **Yes** — which controls disable vs label |
| P1-GAP-030* | Reports/export/print honesty | No — follows OWN-P1-004 honesty |
| P1-GAP-032 | Demo/reset control governance | **Yes** → OWN-P1-008 |
| P1-GAP-071 | Prototype-only / seed copy visible as live | **Yes** — cleanup vs retain for QA |
| P1-GAP-073 | Online toggle demo (`pulse.v31.online`) | Honesty labelling |

\*Partial — honesty/labels only in P1-B2; durable domain remains P2+.

---

## 4. Immediate decision table

| Decision ID | Plain question | Status | Blocks P1-B2 auth? | Recommended posture |
| --- | --- | --- | --- | --- |
| OWN-P1-004 | Inactive Topbar Export / MFA / New Entry? | **Open** | **Yes** | Disable + truthful explanation; backend outside P1 |
| OWN-P1-005 | Clinic multi-select scope? | **Open** | **Yes** | Accepted difference: Command Centre only |
| OWN-P1-008 | Demo/QA menus visibility? | **Open** | **Yes** | Gate behind explicit QA/demo mode |
| OWN-P1-017 *(proposed)* | Demo identity consistency (Sarah/Neil/Alex)? | **Not yet on register** | **Yes if adopted for B2 exit** | Global Act-as identity drives “current user” chrome; seed names labelled as demo data |

---

## 5. Complete card — OWN-P1-004

1. **Decision ID:** OWN-P1-004  
2. **Exact title / question:** Inactive Topbar Export / MFA / New Entry: hide them; disable them with truthful explanation; retain them only as clearly labelled demonstration controls; or defer backend capability outside P1?  
3. **Current status:** **Open**  
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md` (row OWN-P1-004); `P1_PROTOTYPE_PARITY_GAP_REGISTER.md` § P1-GAP-005; `P1_EXECUTION_BATCHES.md` § P1-B2; code `src/components/shell/Topbar.tsx` (Export / Enterprise MFA toast stubs; New Entry opens create drawer). Related honesty: P1-GAP-030.  
5. **Plain-language owner question:** When staff see Export, Enterprise MFA, or New Entry in the top bar, should those controls be hidden, shown as clearly not working yet, kept only as labelled demos, or left until a later wave builds real backends?  
6. **Why required:** Users may believe export, MFA, or new-entry already work. Toast-only “success-like” messaging is a GLOBAL fail condition. P1 must not invent backends.  
7. **Evidence-supported options:**  
   - **(A)** Disable with truthful explanation (visible, non-activating or clearly non-operational; no fake success).  
   - **(B)** Hide in ordinary P1 chrome.  
   - **(C)** Retain only as clearly labelled demonstration controls.  
   - **(D)** Defer backend capability outside P1 (may combine with A, B, or C for the interim UX).  
8. **Benefits:**  
   - **A** — Honest and discoverable; teaches future capability without lying.  
   - **B** — Lowest false-confidence risk; simplest ordinary UX.  
   - **C** — Keeps demo affordances for training if strongly labelled.  
   - **D** — Prevents scope creep into export/MFA infrastructure.  
9. **Risks / disadvantages:**  
   - **A** — Still visible; must be unmistakably non-operational.  
   - **B** — Reduced discoverability of future features.  
   - **C** — Highest misuse risk if labelling is weak.  
   - **D alone** — Does not fix current false confidence.  
10. **Users / clinic operations:** Executives/managers stop thinking portal Export or MFA is live; New Entry behaviour must remain honest (create drawer vs claimed enterprise entry).  
11. **Privacy / security / accessibility:** MFA must not imply a completed security control; disabled controls need accessible names/state (`aria-disabled` / status text), not silent dead buttons.  
12. **Architecture / data / integrations:** No reporting backend, no IdP MFA, no SQL — presentation honesty only.  
13. **Effect on P1-B2 and later batches:** Unlocks GAP-005 / honesty portion of GAP-030; does not authorise B7 full report packs or real MFA.  
14. **Dependencies:** Align with OWN-P1-008 honesty theme; after P1-B1 (already closed).  
15. **Specialist review:** None required to choose A vs B; security SME only if MFA copy is disputed.  
16. **Cursor recommended answer:** **(A) + (D)** — disable with truthful explanation now; backend outside P1. Hide **(B)** is an acceptable alternate if the owner prefers minimal chrome.  
17. **Reason:** Register recommendation (“truthful non-op or hide”); B2 prohibits fake backends; Topbar already uses toast stubs that must not read as success.  
18. **Acceptance wording the owner can select:**  
    `OWN-P1-004: Option A+D — Disable Topbar Export / Enterprise MFA / unsupported New Entry affordances with truthful non-operational explanation in P1; do NOT authorise export-processing, MFA infrastructure, or fake backends in P1-B2.`  
    Alternate: `OWN-P1-004: Option B+D — Hide those controls in ordinary P1 chrome; backend remains outside P1.`  
19. **Consequence of deferral:** P1-B2 cannot cleanly exit GAP-005; false operational confidence continues.  
20. **Blocks:**  
    - P1-B2 consideration: **No**  
    - P1-B2 authorisation: **Yes** (for GAP-005 disposition)  
    - P1-B2 implementation: **Yes** until decided  
    - Later batches: Honesty debt carries  
    - Production only: Also blocks honest production UX claims  

---

## 6. Complete card — OWN-P1-005

1. **Decision ID:** OWN-P1-005  
2. **Exact title / question:** Clinic multi-select: shell-wide; Command Centre only as an Accepted difference; or deferred to a later batch?  
3. **Current status:** **Open**  
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md`; P1-GAP-006; Topbar `onClinicChange` toast for `"multiple"` in `Topbar.tsx`; Command Centre ControlBar multi-clinic controls.  
5. **Plain-language owner question:** Should choosing several clinics at once work everywhere in the top bar, or is it enough that it works in Command Centre for now (with that called an accepted difference)?  
6. **Why required:** Topbar multi-select currently redirects users via toast to Command Centre. Without an explicit choice, GAP-006 remains contested and ops expectations stay unclear.  
7. **Evidence-supported options:**  
   - **(A)** Document **Accepted difference** — Command Centre only.  
   - **(B)** Schedule **shell-wide** multi-select support (would expand beyond pure honesty into feature behaviour).  
   - **(C)** Defer the product choice to a later named batch (keep interim truthful toast).  
8. **Benefits:**  
   - **A** — Matches current code; keeps P1-B2 inside truthfulness; stops false defect scoring.  
   - **B** — Better long-term parity for multi-clinic managers.  
   - **C** — Buys time if ops preference is unknown.  
9. **Risks / disadvantages:**  
   - **A** — Clinics may reject CC-only as insufficient.  
   - **B** — Expands P1-B2 beyond authorised honesty scope; clinic-isolation UX still lacks server enforcement (DATA-05 / OWN-P1-016).  
   - **C** — Leaves GAP-006 open; repeated confusion.  
10. **Users / clinic operations:** Multi-clinic executives learn where scope is set; risk of wrong clinic data views if shell and CC disagree silently.  
11. **Privacy / security / accessibility:** Clinic scope UX honesty matters; durable tenancy enforcement is **not** solved by this decision (OWN-P1-016 / DATA-05 remain separate).  
12. **Architecture / data / integrations:** Scope-control presentation only — not SQL migration.  
13. **Effect on P1-B2 and later batches:** **A** or **C** fit B2 honesty; **B** should be a separately scoped authorisation if chosen, not smuggled into B2.  
14. **Dependencies:** None on open B3 decisions; independent of OWN-P1-016 for *consideration*, but production claims still need OWN-P1-016 later.  
15. **Specialist review:** Clinic operations preference (owner/ops) — no single engineering-safe default between A and B without that input for *product preference*; for *P1-B2 batch fit*, A is the evidence-supported honesty posture.  
16. **Cursor recommended answer:** **(A) Accepted difference — Command Centre only** for P1-B2; optionally schedule shell-wide later under a separate authorisation.  
17. **Reason:** Current Topbar already tells users to use CC; shell-wide multi-select is feature work, not inactive-control honesty; keeps B2 inside approved change categories.  
18. **Acceptance wording:**  
    `OWN-P1-005: Option A — Accept Command Centre–only multi-clinic selection as an Accepted difference for Programme P1; Topbar must remain truthful (no silent fake multi-select). Shell-wide multi-select is NOT authorised by P1-B2.`  
19. **Consequence of deferral:** GAP-006 remains contested; B2 exit ambiguous.  
20. **Blocks:**  
    - Consideration: **No**  
    - Authorisation: **Yes** (for GAP-006 disposition)  
    - Implementation: **Yes** until decided  
    - Later batches: May schedule shell-wide later  
    - Production only: Also affects honest multi-clinic UX claims  

---

## 7. Complete card — OWN-P1-008

1. **Decision ID:** OWN-P1-008  
2. **Exact title / question:** Demo and QA controls: visible in the ordinary portal; gated behind an explicit QA/demo mode; or removed from ordinary user navigation?  
3. **Current status:** **Open**  
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md`; P1-GAP-032 (`QaDemoMenu`, M03 demo, `UxStateDemo`); related P1-GAP-071 / P1-GAP-073; code `QaDemoMenu.tsx`, `OrganisationWorkspace.tsx` demo actors/reset/clock, Topbar online toggle (`pulse.v31.online`).  
5. **Plain-language owner question:** Should training/QA tools (simulate states, reset demo data, advance demo clock, online/offline demo toggle) stay in the normal portal, sit behind a clear QA switch, or be removed from ordinary navigation?  
6. **Why required:** Demo resets and simulated states can be mistaken for live production controls; GLOBAL fail condition forbids treating fake seed as production truth.  
7. **Evidence-supported options:**  
   - **(A)** Gate behind an **explicit QA/demo mode** (register recommendation).  
   - **(B)** Retain visible in ordinary portal (must be strongly labelled).  
   - **(C)** Remove from ordinary user navigation.  
8. **Benefits:**  
   - **A** — QA retained; ordinary users protected.  
   - **B** — Fastest demo/training access.  
   - **C** — Cleanest production-like surface.  
9. **Risks / disadvantages:**  
   - **A** — Needs a clear, testable gate; misconfigured flag could expose tools.  
   - **B** — Accidental resets / role confusion / training-as-live risk.  
   - **C** — Slows QA unless alternate harness exists.  
10. **Users / clinic operations:** Prevents accidental demo data reset during real use; clearer training story.  
11. **Privacy / security / accessibility:** Reduces accidental mutation of demo personal-information seeds; QA mode must be announced to assistive tech; not a substitute for production auth (see `demo-isolation.ts`).  
12. **Architecture / data / integrations:** Flag/config presentation only in B2 intent — not durable IAM.  
13. **Effect on P1-B2 and later batches:** Unlocks GAP-032; informs GAP-071/073 labelling; supports M03 honesty portion of GAP-018 without enabling durable services (OWN-P1-009 remains deferred).  
14. **Dependencies:** Honesty theme with OWN-P1-004; coordinates with proposed OWN-P1-017 for Act-as labelling.  
15. **Specialist review:** None required for A vs C; privacy counsel only before production claims (OWN-P1A-005).  
16. **Cursor recommended answer:** **(A) Gate behind explicit QA/demo mode.**  
17. **Reason:** Matches register recommendation; balances QA need with production honesty.  
18. **Acceptance wording:**  
    `OWN-P1-008: Option A — Demo/QA menus and destructive demo resets must be gated behind an explicit QA/demo mode for P1-B2; ordinary portal navigation must not present them as live operational controls. This does NOT authorise production authentication or durable demo-data services.`  
19. **Consequence of deferral:** Demo governance gap remains; seed may be mistaken for live data.  
20. **Blocks:**  
    - Consideration: **No**  
    - Authorisation: **Yes** (for GAP-032 disposition)  
    - Implementation: **Yes** until decided  
    - Later batches: Honesty debt carries into B5/B7  
    - Production only: Also blocks honest production UX claims  

---

## 8. Other decisions affecting P1-B2

### 8.1 Proposed OWN-P1-017 — Demo identity consistency (Sarah / Neil / Alex)

1. **Decision ID:** **OWN-P1-017** *(proposed next sequential ID — not yet recorded on the owner-decision register; this briefing identifies the need only)*  
2. **Title:** Should one global demonstration identity control all visible “current user” labels, and how may seed character names remain?  
3. **Status:** **Needed / not yet on register**  
4. **Source:** P1-B1 acceptance qualification; `identity-context.tsx` (default **Sarah Mitchell**); `CommandCentre.tsx` greeting hardcodes **Neil**; Action Inbox seeds / overrides reference **Alex Chen**; `DEMO_ACT_AS_NOTICE` in `demo-isolation.ts`. Gaps: P1-GAP-018 (act-as honesty), P1-GAP-032/071 (demo surfaces), P1-B2 honesty objective.  
5. **Plain-language question:** When the sidebar says you are Sarah, should the Command Centre greeting also say Sarah — and how should story characters like Neil or Alex appear so nobody thinks they are the signed-in production user?  
6. **Why required:** P1-B1 explicitly deferred this contradiction to P1-B2; mixed identities undermine demo honesty and training.  
7. **Options:**  
   - **(A)** One global demo identity (`identity-context` Act-as) controls **all** “you are / greeting / acting-as” chrome labels.  
   - **(B)** Allow module-local identity simulation to diverge if each surface is explicitly labelled.  
   - **(C)** Freeze a single named demo persona in copy (e.g. always Neil) and disable Act-as in ordinary portal (conflicts with existing platform Act-as design).  
8. **Benefits / risks:** **A** removes contradiction; **B** preserves module experiments but raises confusion risk; **C** fights existing Act-as architecture.  
9–12. **Users / privacy / architecture:** Demo Act-as is **not** production authentication (`AUTH_ENFORCEMENT=production` blocks Act-as). Seed “Neil”/“Alex Chen” as *record owners* may remain as fictional demo data if not presented as the signed-in user. No SQL/IdP work in B2.  
13. **Batches:** P1-B2 honesty exit for the P1-B1 qualification.  
14. **Dependencies:** OWN-P1-008 (demo mode); distinct from OWN-P1-016 (persistence).  
15. **Specialist review:** None for chrome consistency; IdP/security only for later production auth.  
16. **Recommended answer:** **(A)** — global Act-as identity drives current-user chrome; seed character names may remain inside demo datasets with clear demo labelling; module-specific **role simulation** may remain only if it cannot silently override the global display name without a visible “local override (demo)” label.  
17. **Reason:** Evidence shows Sidebar uses `identity.displayName` while Command Centre hardcodes Neil; Action Inbox has separate seed/override paths. Truthful remediation is alignment + labelling, not inventing auth.  
18. **Acceptance wording (if owner adopts ID):**  
    `OWN-P1-017: Option A — All visible current-user chrome (sidebar, Command Centre greeting, equivalent shells) must follow the active demonstration identity from Act as User/Role; seed narrative names may remain as labelled demo data only; Act-as remains demonstration-only, not production authentication. Register this decision as OWN-P1-017 when recorded.`  
19. **Deferral:** P1-B1 qualification remains unmet; B2 honesty incomplete.  
20. **Blocks:** B2 authorisation/exit **if** owner includes the P1-B1 identity qualification in B2 scope (recommended). Does **not** block production-data OWN-P1-016.

### 8.2 P1-GAP-007 — Dashboard non-operational cards (no new OWN ID)

- **Status:** Owner clarification **No**  
- **Guidance when B2 is authorised:** Keep truthful “Non-operational” labels; do **not** re-enable as toast-success. Domain enablement is P2+ (OWN-P1-009 deferred).  
- **Blocks B2 auth?** No separate decision — follow existing UI Batch1 honesty.

### 8.3 P1-GAP-018 — M03 demo controls (labelling only)

- **Owner clarification:** **Yes** — which controls disable vs demo-label in P1.  
- **Relation:** Largely governed by **OWN-P1-008** + proposed **OWN-P1-017**; durable services remain OWN-P1-009 / P2.  
- **Recommendation:** In P1-B2, label or gate M03 Act-as / demo clock / reset under the OWN-P1-008 choice; do not implement durable IAM audit services.

### 8.4 P1-GAP-071 — Seed copy cleanup vs retain for QA

- **Owner clarification:** **Yes**  
- **Recommendation:** Decide with OWN-P1-008 — if QA mode is gated, seed titles may remain inside QA mode; ordinary portal must not present prototype-only packs as live.  
- If the owner needs a separate formal ID beyond 008, use the next free sequential ID after 017 when recording — **do not invent additional IDs in this briefing**.

### 8.5 P1-GAP-073 — Online toggle

- Honesty labelling required in B2 regardless of OWN-P1-008 detail (already toast-labelled as demo in places). Prefer visibility only inside QA mode if OWN-P1-008 = A.

### 8.6 Deferred — not required to close for P1-B2 authorisation

| ID | Why deferred for B2 |
| --- | --- |
| OWN-P1-006 / 007 | P1-B3 register/M07 honesty |
| OWN-P1-009…015 | Later waves / production / PPA / M25 |
| OWN-P1-016 | Production data path — **not** a P1-B2 product-coding blocker |
| OWN-P1A-001…008 | Definition/security/a11y targets — not B2 chrome honesty blockers |
| OWN-P1C-001…007 | Docs hygiene / CI / hosting — not B2 truthfulness blockers |

---

## 9. Sarah / Neil identity-consistency analysis

| Question | Evidence-based answer |
| --- | --- |
| Which gap/decision controls this? | P1-B1 acceptance qualification → P1-B2 honesty; gaps **018 / 032 / 071**; **proposed OWN-P1-017**; related **OWN-P1-008** |
| Authoritative identity/context source | Platform **`identity-context`** Act as User/Role (`DEMO_IDENTITIES`; default Sarah Mitchell). Explicitly **demo only** (`DEMO_ACT_AS_NOTICE`; blocked when `AUTH_ENFORCEMENT=production`). |
| Where Neil appears | Command Centre greeting hardcodes “Neil”; many CC mock/action paths use “Neil” / “Neil Udukala” as seed actors |
| Where Alex Chen appears | Action Inbox mock seed owners / local role-override messaging |
| Remediation options | Align chrome to Act-as; or label every divergent surface; or freeze one persona (not recommended) |
| Recommended truthful behaviour | **Global demo identity controls all current-user chrome labels**; seed people remain as labelled demo dataset characters |
| One global demo identity for all visible identity labels? | **Yes** for “you are / greeting / acting as” chrome |
| Module-specific role simulation may remain? | **Yes**, only with explicit “local override (demo)” labelling and without silently contradicting the global display name |
| Required labelling | Retain/strengthen demonstration notices; never imply production authentication |
| Tests / evidence required | Assert sidebar name == CC greeting name for active Act-as identity; assert demo notice visible; assert no toast-as-success; browser shots of Act-as change propagating; Action Inbox override labelled if retained |

**Do not implement the correction in this task.**

---

## 10. Decision dependencies

```text
P1-B1 closed (qualified)
        │
        ▼
 OWN-P1-004 ──┐
 OWN-P1-005 ──┼──► required before P1-B2 authorisation
 OWN-P1-008 ──┘
        │
 OWN-P1-017 (proposed) ──► required before B2 exit if identity qualification in scope
        │
        ▼
 Express P1-B2 authorisation (separate owner act — NOT this briefing)
        │
        ▼
 P1-B2 implementation (still unauthorised)
        │
        ▼
 Later: OWN-P1-006/007 → B3; OWN-P1-016 → production data; etc.
```

OWN-P1-004 and OWN-P1-008 share an honesty theme but are separately decidable.  
OWN-P1-005 is independent product-scope choice.  
OWN-P1-017 depends on keeping Act-as as the demo identity source (OWN-P1-008 gating does not remove Act-as; it governs QA menus).

---

## 11. Proposed P1-B2 scope card (not authorised)

| Field | Proposed value |
| --- | --- |
| **Objective** | Remove or truthfully label inactive/stub shell controls and demo surfaces so ordinary users cannot mistake demo/stub behaviour for live capability |
| **Status** | `P1 — PLANNED, NOT AUTHORISED` |
| **Included gaps** | 005, 006, 007, 018* (labels), 030* (honesty), 032, 071, 073 (+ identity qualification via proposed OWN-P1-017) |
| **Owner decisions required** | OWN-P1-004, OWN-P1-005, OWN-P1-008; record OWN-P1-017 if adopted |
| **Allowed change categories** | Copy; visibility; disablement; demo/QA badges; gating flags; identity-label alignment; non-operational status text — **no fake backends** |
| **Prohibited changes** | Fake backends; production authentication; SQL / durable data architecture; export-processing services; MFA infrastructure; patient/clinical SoR; PPA; payments; M25; B3–B8 register/presentation rebuilds; PR/merge/deploy |
| **Affected shell controls / demo surfaces** | Topbar Export / MFA / New Entry / Online toggle; Topbar clinic multi-select honesty; DashboardShellControls non-operational cards; QaDemoMenu; M03 demo actors/clock/reset; CC greeting vs Act-as; Action Inbox local override labelling; seed-copy honesty |
| **Affected files (evidence-supported examples)** | `Topbar.tsx`; `DashboardShellControls.tsx`; `QaDemoMenu.tsx` / `ControlBar.tsx`; `CommandCentre.tsx`; `OrganisationWorkspace.tsx`; `identity-context.tsx` / `demo-isolation.ts`; Action Inbox override copy — exact edit set only when B2 is authorised |
| **Role scenarios** | Executive, operational, manager, restricted, auditor — each must see honest inactive/demo labelling |
| **Org / clinic-context scenarios** | All / group / single clinic; multiple-clinic path remains truthful per OWN-P1-005 |
| **Responsive / a11y** | Preserve P1-B1 shell a11y; disabled controls named/stateful; no reliance on colour-only warnings |
| **Truthfulness requirements** | No toast-as-success for stubs; demo/QA clearly labelled or gated; identity chrome consistent |
| **Tests required** | Inactive-control labelling; no toast-as-success assertions; demo badge/gate visibility; identity chrome consistency if OWN-P1-017 adopted |
| **Browser evidence required** | Local screenshots of Topbar dispositions, QA gate, Act-as→greeting alignment; widths at least 390/768/1280; Light/Dark/System as practical — **local only unless CI later authorised** |
| **Entry criteria** | P1-B1 closed; OWN-P1-004/005/008 closed; validators green; clean tip; express B2 authorisation |
| **Exit criteria** | Named honesty tests green; owner accepts B2 tip; gaps 005/006/032 dispositioned per decisions; identity qualification addressed if in scope; B3–B8 still unauthorised |
| **Rollback** | Discard/unmerge B2 branch; return to last owner-accepted tip (`fdb2beb…` or later accepted tip) |
| **Owner acceptance method** | Written decision log + tip SHA evidence under `docs/audits/p1/` (new paths; do not rewrite P0/B1 history) |
| **Later-batch exclusions** | B3 register sync; B4 a11y matrices; B5/B6 presentation parity; B7 full state matrices; B8 programme exit; OWN-P1-016 data path |

---

## 12. Risks and contradictions

| Item | Note |
| --- | --- |
| Sarah vs Neil vs Alex | Confirmed code contradiction / seed divergence — P1-B1 qualified deferral |
| OWN-P1-005 A vs B | Product preference; B2-fit recommendation is A, but ops may still prefer later shell-wide work |
| GAP-018 owner clarification | Partially overlaps OWN-P1-008/017 — avoid double-building durable M03 services |
| New Entry control | Opens create drawer (not purely toast) — disposition must be precise under OWN-P1-004 |
| Online toggle | Demo continuity messaging already partly honest — still in B2 honesty set |
| OWN-P1-016 open | Must not be “solved” by B2 labelling |
| No GitHub CI | Local evidence only if B2 later authorised (same limitation as B1) |
| Missing register row for identity | Proposed OWN-P1-017 — owner must confirm ID when recording |

---

## 13. Specialist advice required

| Topic | Needed now for B2 decisions? |
| --- | --- |
| Clinic operations preference (multi-select) | Helpful for OWN-P1-005 if owner rejects Accepted difference |
| Security / IdP | **Not** required to choose B2 honesty options; required before production auth claims |
| Privacy counsel / PIA | **Not** required for B2 labelling; required before production personal-info claims (OWN-P1A-005) |
| Accessibility specialist | Not required to choose decisions; validate disabled-control naming during implementation |
| Payroll / PPA SME | **Not** in B2 scope |

---

## 14. Blank owner-response table

| Decision ID | Selected option | Owner wording / qualification | Decision date | Evidence reference | Status |
| --- | --- | --- | --- | --- | --- |
| OWN-P1-004 |  |  |  |  | Open |
| OWN-P1-005 |  |  |  |  | Open |
| OWN-P1-008 |  |  |  |  | Open |
| OWN-P1-017 *(if adopted)* |  |  |  |  | Needed / not on register |
| P1-B2 authorisation |  |  |  |  | **Not authorised** |

---

## 15. Recommended next action

1. Owner completes the response table for **OWN-P1-004**, **OWN-P1-005**, and **OWN-P1-008**.  
2. Owner confirms whether to **adopt OWN-P1-017** for demo identity consistency and records it on the owner-decision register in a later docs-only act.  
3. Only after those decisions are recorded, the owner may issue a **separate express authorisation** naming **P1-B2**.  
4. Until then: **no P1-B2 implementation, no PR, no merge, no deployment, no automatic progression.**

**Claim for this publish:** `P1-B2 owner-decision briefing prepared and published — no owner decision approved and P1-B2 remains unauthorised`

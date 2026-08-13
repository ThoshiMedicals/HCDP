# P1-B3 Owner-Decision Briefing — Register and navigation hygiene

**Document type:** Owner-decision briefing + recorded owner outcomes for OWN-P1-006 / OWN-P1-007  
**Status stamp:** `P1 — PLANNED, NOT AUTHORISED` for **P1-B3** (unchanged — decision closure ≠ batch authorisation)  
**Branch:** `cursor/p1-b2-shell-truthfulness`  
**Briefing tip (original):** `96d402f89406c07d0abadde8d427a06f0e57b83b`  
**Accepted P1-B1 tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`  
**Accepted P1-B2 tip:** `66f3f8d27803f5b8d24043639d21b9069f58e77a`  
**Briefing date:** 2026-08-13  
**Owner-decision recording date:** 2026-08-13  

> **OWN-P1-006 and OWN-P1-007 are APPROVED / CLOSED (2026-08-13)** — disposition only.  
> **P1-B3 remains unauthorised.** Decision closure ≠ batch authorisation.  
> A separate express owner act is still required before any P1-B3 implementation.  
> No automatic progression from P1-B1 or P1-B2. Gaps are **not** closed by decision recording alone.

**Authoritative registers (this briefing does not replace them):**

| Pack | Register |
| --- | --- |
| P1B decisions | [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md) |
| P1B batches | [`P1_EXECUTION_BATCHES.md`](./P1_EXECUTION_BATCHES.md) |
| P1B gaps | [`P1_PROTOTYPE_PARITY_GAP_REGISTER.md`](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md) |
| Traceability | [`P1_GAP_TRACEABILITY.md`](./P1_GAP_TRACEABILITY.md) |
| P1-B1 / P1-B2 acceptance | [`../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md), [`../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md) |
| PPA readiness (planning only) | [`../../plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md`](../../plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md) |
| P1A / P1C | [`p1a/`](./p1a/README.md), [`p1c/`](./p1c/README.md) |

**Platform boundary (unchanged):** multi-organisation, multi-clinic, **non-clinical** medical-centre operations platform; **24** runtime modules (M01–M24); **M25** separate/future; **PPA** and **payment execution** out of scope for P1-B3; Best Practice (or equivalent) remains clinical system of record.

---

## 1. Executive summary

P1-B1 and P1-B2 are **owner accepted with qualifications and closed** (2026-08-13). The next proposed batch is **P1-B3 — register and navigation hygiene**: align metadata, badges, section lists and labels with verified reality **without changing domain behaviour**.

P1-B3 remains **`P1 — PLANNED, NOT AUTHORISED`**.

Two owner decisions that previously blocked B3 consideration are now **closed** (disposition only). **Express P1-B3 implementation authorisation is still required** before any register/nav code work:

| ID | Question (plain) | Status |
| --- | --- | --- |
| **OWN-P1-006** | May we update the Training (M11) register so sections and status match the live Training workspace, without changing Training behaviour? | **Closed (approved) — Option A Synchronise — 2026-08-13** |
| **OWN-P1-007** | May we make Staff Pay (M07) History / Adjustments wording honest so it does not look like authorised prior-period adjustment (PPA) product? | **Closed (approved) — Option A Honesty-only labels — 2026-08-13** |

**Verified facts that make these decisions necessary:**

- M11 register still lists **three** sections and badge **“Rebuild pending (legacy HTML reference only)”**, while the live Training workspace has **eleven** interactive sections and Wave 3 is owner-accepted and frozen (not production-approved).
- M07 History is marked **Planned** and shows a non-operational planned screen.
- M07 Adjustments UI and notes use **“PPA-1 foundation”** / **“Prior-period adjustments”** wording while programme control still treats **PPA as planned only / not authorised** as a product batch, and **unlock/reopen ≠ PPA**.

P1-B3 must stay limited to **register/navigation/badge/label honesty**. It must **not** change M11 or M07 domain workflows, rewrite Wave 3 / Wave 6 evidence, implement PPA, process payment, touch M08 doctor pay, add/remove modules, or begin P1-B4–P1-B8.

---

## 2. Verified current status

| Item | Evidence |
| --- | --- |
| Branch | `cursor/p1-b2-shell-truthfulness` |
| Briefing tip (original) | `96d402f89406c07d0abadde8d427a06f0e57b83b` |
| P1-B1 | Owner accepted with qualifications — **CLOSED** at `fdb2beb…` |
| P1-B2 | Owner accepted with qualifications — **CLOSED** at `66f3f8d…` |
| P1-B3 | `P1 — PLANNED, NOT AUTHORISED` |
| P1-B4–P1-B8 | Unauthorised |
| Gap inventory | **83** gaps accounted for |
| Batch inventory | **8** batches accounted for |
| Runtime modules | **24** (M01–M24); M25 unimplemented |
| `OWN-P1-006` / `OWN-P1-007` | **Closed (approved) — 2026-08-13** (disposition only; gaps remain open) |
| `OWN-P1-011` | **Open** — continues to govern any future PPA product decision |
| `OWN-P1-016` | **Open** — does **not** block P1-B3 consideration (production data path) |
| Automatic progression | **Prohibited** |
| PR / merge / deploy | None authorised by this briefing |
| GitHub CI on accepted P1 tips | **None** — local validation only (qualification pattern continues) |

### P1-B1 / P1-B2 qualifications affecting register honesty

- Local-only validation; no GitHub CI claim.
- No production approval; no overall Programme P1 claim.
- Export / MFA / reporting backends remain non-operational or local-demo only (B2).
- `OWN-P1-016` remains open.
- Historical evidence must not be rewritten; frozen Wave 3 (M11) and Wave 6 Batches 1–6 (M07 ordinary prep) domain behaviour must not change under B3.

---

## 3. Recommendation summary → recorded owner selections

| Decision | Plain-language choice | Recommended answer (briefing) | Owner selection (2026-08-13) | What it unlocks | Still blocked |
| --- | --- | --- | --- | --- | --- |
| OWN-P1-006 | Update Training register to match the live Training screens, leave it wrong, or wait? | **Synchronise** metadata to verified runtime | **Option A — Synchronise** — **APPROVED / CLOSED** | Disposition for GAP-011 under a later authorised B3 | P1-B3 implementation until express batch auth; gaps not auto-closed |
| OWN-P1-007 | Fix Staff Pay History/Adjustments wording now, hide controls, keep current wording with a note, or wait for a PPA product decision? | **Honesty-only labels** | **Option A — Honesty-only labels** — **APPROVED / CLOSED** | Disposition for GAP-012 / GAP-079 under a later authorised B3 | OWN-P1-011 / PPA product; P1-B3 implementation until express batch auth |

**Decision blockers for B3 consideration:** OWN-P1-006, OWN-P1-007 — **closed 2026-08-13**.  
**May remain deferred for P1-B3:** OWN-P1-016; OWN-P1-011 (named PPA implementation batch); OWN-P1A-*/OWN-P1C-* except as parallel docs hygiene noted below; P1-B4–P1-B8.  
**Decision closure ≠ batch authorisation.** P1-B3 remains unauthorised until a separate express owner act authorises that named batch.

---

## 4. Complete decision card — OWN-P1-006

1. **Decision ID:** OWN-P1-006  
2. **Title / question:** Authorise M11 register, condition and section synchronisation without changing M11 domain behaviour?  
3. **Current status:** **Closed (approved) — 2026-08-13** — **Option A — Synchronise**  
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md`; gap `P1-GAP-011`; batch `P1_EXECUTION_BATCHES.md` § P1-B3; code `src/platform/module-registry/module-register.ts` (M11) vs `src/modules/m11-training/TrainingWorkspace.tsx`.  
5. **Plain-language owner question:** May the Training module’s official register be updated so the listed screens and status badge match what Training actually shows today, **without changing how Training works**?  
6. **Why required:** The register currently understates and mislabels Training. That creates false readiness / rebuild scores and blocks honest P1-B3 hygiene (GAP-011).  
7. **Evidence-supported options (historical):**  
   - **A — Synchronise metadata to verified runtime** (sections + condition/badge using existing vocabulary; no domain edits). ← **SELECTED**  
   - **B — Document an Accepted difference**  
   - **C — Defer**  
8–15. (Analysis unchanged from original briefing — see historical recommendation context above.)  
16. **Cursor recommendation (historical):** **Option A**.  
17. **Owner outcome:** Option A approved and closed — synchronise M11 module-register section list to verified TrainingWorkspace runtime sections; replace `legacy-html-fallback` with **`strong-existing`** (existing valid `ImplementationCondition`); metadata/register correction only; Wave 3 freeze preserved; no production/domain/new-implementation claims; no M11 application code in the decision-recording task.  
18. **Recorded owner wording:**  
    `OWN-P1-006: Option A — Synchronise. Authorise M11 module-register section list and condition/badge synchronisation to verified TrainingWorkspace / Wave 3 reality. Replace legacy-html-fallback with strong-existing. Metadata/register correction only. No M11 domain behaviour change. Not production approval. Wave 3 freeze and historical evidence remain preserved. Gaps NOT closed by this decision. Does NOT authorise P1-B3 implementation.`  
19. **Consequence if B3 remains unauthorised:** Disposition is recorded; GAP-011 stays open until an authorised B3 implements and accepts the sync.  
20. **Blocks after closure:**  
    - P1-B3 consideration: **No** (decisions closed)  
    - P1-B3 authorisation: Still requires **separate express owner act**  
    - P1-B3 implementation: Still **unauthorised** until that act  
    - Gap auto-closure: **Forbidden** — gaps need implementation + acceptance evidence  
    - Production only: **No** (this is planning honesty, not production auth)

### M11 current-state vs proposed sync (metadata only)

| Aspect | Current register | Verified runtime | Proposed B3 treatment (if A authorised later) |
| --- | --- | --- | --- |
| Route | `/training` | `/training` | Keep |
| Sections | `records`, `expiry`, `catalogue` (3) | `overview`, `catalogue`, `assignments`, `sessions`, `assessments`, `competencies`, `certificates`, `exemptions`, `evidence`, `reports`, `settings` (11) | Replace section list to match TrainingWorkspace labels/IDs |
| Condition | `legacy-html-fallback` | Full interactive Wave 3 workspace | Replace with existing vocabulary that is **not** legacy-HTML (recommended candidate: `strong-existing`, with purpose text noting Wave 3 owner-accepted / **not** production-approved). Do **not** invent a new enum without register process. |
| Badge via `conditionLabel` | “Rebuild pending (legacy HTML reference only)” | Misleading | Follow chosen condition’s existing label |
| Domain behaviour | — | Unchanged under B3 | **No change** |
| Historical Wave 3 evidence | Owner accepted and frozen | Preserve | **No rewrite** |

**Files that could be affected if later authorised (illustrative):** `src/platform/module-registry/module-register.ts`; focused register/nav tests; possibly doc pointers. **Not:** Training section components, services, Wave 3 audit packs content.

**Tests / evidence if later authorised:** register validator green; assertion that M11 section IDs/labels match TrainingWorkspace NAV; screenshot or nav list evidence; rollback = revert metadata commit.

---

## 5. Complete decision card — OWN-P1-007

1. **Decision ID:** OWN-P1-007  
2. **Title / question:** Authorise M07 History and Adjustments honesty labelling without creating PPA functionality?  
3. **Current status:** **Closed (approved) — 2026-08-13** — **Option A — Honesty-only labels**  
4. **Authoritative source:** `P1_OWNER_DECISION_REGISTER.md`; gaps `P1-GAP-012`, `P1-GAP-079`; `CONF-P1C-006`; OWN-PPA-SEPARATE / PPA readiness docs; code `section-meta.ts`, `PlannedSection.tsx`, `AdjustmentsSection.tsx`; Wave 6 Batches 1–6 closure qualifications.  
5. **Plain-language owner question:** May Staff Pay wording for History and Adjustments be made clearly honest so people do **not** think prior-period adjustment (PPA) is an authorised live product—**without** approving PPA, payment, or payroll certification?  
6. **Why required:** History is planned/non-operational but sits inside a module often described as functionally complete. Adjustments UI prominently says “PPA-1 foundation” / “Prior-period adjustments” while programme control still says PPA is separately planned and not authorised as a product batch.  
7. **Evidence-supported options (historical):**  
   - **A — Honesty-only labels** ← **SELECTED**  
   - **B — Hide or disable**  
   - **C — Retain current labels** with qualification banner only  
   - **D — Defer terminology** to OWN-P1-011  
8–15. (Analysis unchanged from original briefing.)  
16. **Cursor recommendation (historical):** **Option A**.  
17. **Owner outcome:** Option A approved and closed — truthful M07 History/Adjustments metadata and documentation labelling only; History = planned/non-operational where verified; Adjustments = existing adjustment-preparation/foundation capability, **not** authorised/complete PPA product; remove or qualify “PPA-1 foundation” where it implies PPA product approval; unlock/reopen ≠ PPA; OWN-P1-011 remains open; no payment/M08/certification/PPA-product/production approval.  
18. **Recorded owner wording:**  
    `OWN-P1-007: Option A — Honesty-only labels. Authorise M07 History and Adjustments honesty labelling only. History remains clearly planned/non-operational. Adjustments must not be presented as authorised prior-period adjustment (PPA) product or payment. Unlock/reopen is not PPA. This does NOT authorise OWN-P1-011, PPA implementation, payment execution, doctor pay, or certification. Gaps NOT closed by this decision. Does NOT authorise P1-B3 implementation.`  
19. **Consequence if B3 remains unauthorised:** Disposition is recorded; GAP-012/079 stay open until an authorised B3 implements and accepts honesty labelling.  
20. **Blocks after closure:**  
    - P1-B3 consideration: **No** (decisions closed)  
    - P1-B3 authorisation: Still requires **separate express owner act**  
    - P1-B3 implementation: Still **unauthorised** until that act  
    - Gap auto-closure: **Forbidden**  
    - Later batch: OWN-P1-011 remains separate for real PPA product  
    - Production only: Labelling is not production auth; production payroll claims remain out of scope

### M07 History / Adjustments / PPA terminology table

| Concept | What it is today | What users might wrongly believe | Honest B3 posture (if A authorised later) |
| --- | --- | --- | --- |
| Ordinary staff-pay preparation | Batches 1–6 closed within approved scope (qualified; not production-approved) | “Payroll is certified / paid” | Keep ordinary prep; do not claim payment or certification |
| History / Reports | `batch1: "planned"`; PlannedSection (“Planned — not operational in Batch 1”) | “History works because Staff Pay is complete” | Keep **Planned / not operational** honesty visible |
| Controlled unlock / reopen | Batch 6 capability; **not** PPA | “Unlock is a prior-period adjustment” | Preserve explicit **unlock ≠ PPA** |
| Adjustment preparation UI | Adjustments section `available` with PPA-1 foundation copy and “Prior-period adjustments” heading | “PPA product is authorised and live” | Honesty labels: not authorised PPA product; not payment; foundation/demo-prep wording only if retained |
| Prior-period adjustment (PPA) | Programme: planned only; OWN-P1-011 open; readiness/design **not** implementation authority | “PPA-1 foundation means PPA is approved” | PPA remains separately unauthorised |
| Payment execution | Out of M07 / P1-B3 scope | Export prep = paid | Forbidden claim |

**Prohibited interpretations under any B3 honesty path:** PPA authorised; unlock = PPA; export = paid; STP/super/award/tax certification; doctor pay inside M07; rewriting Batch 6 acceptance evidence.

**Files that could be affected if later authorised (illustrative):** `section-meta.ts` notes; Adjustments/PlannedSection user-visible copy; M07 shell tests that assert current PPA-1 strings; doc pointers. **Not:** payment services, PPA product expansion, migrations, historical Wave 6 audit rewrite.

---

## 6. Complete analysis of every P1-B3 gap

| Gap ID | Current wording (authoritative) | Current status | Factual repository condition | B3 treatment contemplated | Owner decision dependency | Behaviour change allowed? | Later residual | Acceptance evidence | Closure rule |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **P1-GAP-011** | M11 register condition/sections stale vs TrainingWorkspace | `P1 — PLANNED, NOT AUTHORISED` | Register: 3 sections + `legacy-html-fallback`; runtime: 11 sections; Wave 3 OA/frozen | Sync `module-register` sections/condition/badge to verified runtime | **OWN-P1-006** | **No** domain change | Production approval; deeper Training product claims | Register validator; nav section assertions; evidence note | Register matches TrainingWorkspace; legacy-HTML badge gone; Wave 3 evidence untouched |
| **P1-GAP-012** | M07 History/Reports PlannedSection vs “functionally complete” narrative | `P1 — PLANNED, NOT AUTHORISED` | History planned + PlannedSection; module condition `partially-implemented` | Honesty labels/register text so History is not treated as done | **OWN-P1-007** | **No** History feature build | Operational history product (future) | UI label + register/section-meta honesty tests | History clearly planned/non-operational; no “complete history” claim |
| **P1-GAP-013** | Historic parity register still calls some accepted modules stubs | `P1 — PLANNED, NOT AUTHORISED` | `HCDP_PROTOTYPE_PARITY_REGISTER.md` conflicts with re-audit for e.g. M07 | Supersession banner / pointer to re-audit (docs) | None for B3 product code; parallel **OWN-P1A-006** / P1C docs hygiene | **No** app behaviour | Full historic archive cleanup | Doc cross-link / banner | Historic register cannot be read as current SoT without supersession notice |
| **P1-GAP-014** | 298 unresolved workflow section mappings | `P1 — PLANNED, NOT AUTHORISED` | ACCOUNTING_SUMMARY unresolved=298 | **SHARED subset only** — honesty/count notes for in-scope SHARED dossiers; not bulk resolve | None | **No** domain wiring of 298 items | Bulk P2+ mapping resolution | Mapping counts for in-scope SHARED IDs | SHARED subset documented; bulk residual explicit |
| **P1-GAP-015** | Placeholder modules must not be scored as implemented | `P1 — PLANNED, NOT AUTHORISED` | M08–M10, M12–M24 ModuleLanding / placeholder conditions | Badge/register honesty: Placeholder / not implemented; no false FC | None | **No** module rebuilds | Full module builds in later waves | Landing-only / conditionLabel assertions | Placeholders remain `placeholder` (or equivalent); no “implemented” over-claim |
| **P1-GAP-079** | M07 Adjustments “PPA-1 foundation” wording risk | `P1 — PLANNED, NOT AUTHORISED` | Live PPA-1 / prior-period copy in Adjustments + section-meta | Honesty labelling; must not treat as authorised PPA | **OWN-P1-007** (≠ OWN-P1-011) | **No** PPA product auth / payment | Named PPA batch (OWN-P1-011) | Copy tests; CONF-P1C-006 disposition | Users cannot reasonably read Adjustments as authorised PPA/payment product |

**No gap is closed by this briefing or by OWN-P1-006 / OWN-P1-007 decision recording.** Gaps 011/012/013/014/015/079 remain open until implemented and accepted under an authorised P1-B3.

---

## 7. Register, navigation and badge truthfulness rules (proposed for a future authorised P1-B3)

Reuse existing `ImplementationCondition` / `conditionLabel` vocabulary in `module-register.ts`:

| Condition | Existing label |
| --- | --- |
| `complete-interactive-rebuild` | Complete interactive rebuild |
| `strong-existing` | Strong existing module |
| `partially-implemented` | Partially implemented |
| `placeholder` | Placeholder |
| `legacy-html-fallback` | Rebuild pending (legacy HTML reference only) |
| `missing` | Missing |

**Proposed rules:**

1. Metadata must describe **verified** behaviour, not intended future capability.  
2. “Implemented” / “complete” wording must not mean merely routed, mocked, or visually present.  
3. “Accepted” (Wave / batch acceptance) must name **scope and qualifications** and is not production approval.  
4. “Partial” / `partially-implemented` must be consistent with named missing portions (e.g. M07 History planned).  
5. “Demo” / “local-only” must be visible where material (inherits P1-B2 honesty pattern).  
6. Inactive or planned features must not receive live/complete badges (M07 History = Planned).  
7. PPA planning documents and “PPA-1 foundation” UI must **not** create a PPA-implemented / authorised-product badge.  
8. Current routes must not be removed merely to simplify registers.  
9. Historical accepted evidence must not be rewritten.  
10. Frozen M07/M11 domain behaviour must not change under B3.  
11. No module may be added or removed (24 remain; M25 stays future).  
12. No false production-readiness, WCAG, security or payroll-certification claim.

Do **not** invent parallel badge taxonomies when the existing condition enum + section `batch1` (`available` \| `planned`) already cover the need.

---

## 8. Additional owner decisions discovered

**OWN-P1-006 and OWN-P1-007 fully cover the P1-B3 product-coding gate** for the included gap set.

Related items that should **not** be merged into B3 product decisions:

| Item | Why it is not a new B3 decision ID |
| --- | --- |
| **OWN-P1-011** | Named PPA **implementation** batch — separate; must stay distinct from OWN-P1-007 honesty labelling |
| **OWN-P1A-006** / CONF-P1A-003 | Historic register supersession (supports GAP-013 docs) — already exists in P1A; optional parallel docs hygiene, not a new OWN-P1-* |
| **OWN-P1-016** | Production data path — open; does not block B3 metadata honesty |
| **CONF-P1C-006** | Already mapped to OWN-P1-007 |

**No new sequential OWN-P1-* ID is proposed or added to the register by this briefing.**

---

## 9. Decision dependencies and sequencing

```text
P1-B1 CLOSED (qualified)
P1-B2 CLOSED (qualified)
        │
        ├─ OWN-P1-006 CLOSED (Option A Synchronise) ──┐
        │                                              ├─► decision blockers cleared
        └─ OWN-P1-007 CLOSED (Option A Honesty-only) ──┘
                                │
                     express named P1-B3 authorisation (separate owner act — STILL REQUIRED)
                                │
                     P1-B3 implementation (still UNAUTHORISED now)
                                │
                     owner acceptance of B3 tip (future)
                                │
                     STOP — no automatic P1-B4

Deferred in parallel / later:
  OWN-P1-011 (PPA product — OPEN) · OWN-P1-016 (SQL/data — OPEN) · P1-B4…B8 · M25 · payments
```

---

## 10. Proposed P1-B3 scope card (not authorised)

| Field | Value |
| --- | --- |
| Objective | Register and navigation hygiene — align metadata, badges, section lists and labels with verified reality without changing domain behaviour |
| Included gaps | 011, 012, 013, 014* (SHARED subset), 015, 079 |
| Owner decisions required | **OWN-P1-006**, **OWN-P1-007** — **both CLOSED (approved) 2026-08-13**; batch still needs express auth |
| Permitted change categories | `module-register` metadata; navigation labels/section lists; implementation-status badges; truthful status copy; document pointers / supersession banners; M07 History/Adjustments honesty labels; focused tests and evidence |
| Prohibited | Domain workflow changes; repository/service behaviour changes; DB/migrations; M11 durable-domain edits beyond register sync; PPA implementation; payment processing; M08 doctor pay; historical evidence rewriting; module add/remove; P1-B4–P1-B8 work; PR/merge/deploy |
| Likely affected files (illustrative) | `module-register.ts`; M07 `section-meta.ts` / PlannedSection / Adjustments visible copy; docs pointers; focused tests |
| M11 boundary | Metadata sync only; Wave 3 freeze preserved; no Training service/UI behaviour change |
| M07 / PPA boundary | Honesty labels only; unlock ≠ PPA; OWN-P1-011 remains separate; no payment/STP/super/certification |
| Navigation / badge boundary | Existing condition vocabulary; Planned vs available honesty |
| Role / clinic scenarios | Planner/auditor reading badges; payroll-prep user reading History/Adjustments; Training user nav list matches register |
| A11y / responsive | No new a11y programme claim; do not regress readable honesty text; residual a11y remains P1-B4 |
| Tests required | Register validator; M11 section-list assertions; M07 honesty string tests; placeholder condition checks |
| Browser / screenshot evidence | Representative Training nav; Staff Pay History planned; Adjustments honesty (not success-as-PPA) |
| Entry criteria | P1-B1/B2 closed; OWN-P1-006/007 closed; validators green; **express P1-B3 authorisation**; clean tip |
| Exit criteria | Named honesty/register tests green; owner accepts B3 tip with qualifications |
| Rollback | Revert B3 metadata/label commit(s) |
| Owner acceptance method | Qualified acceptance record (same pattern as B1/B2) — future |
| Later-batch exclusions | B4 a11y matrices; B5/B6 presentation; B7 report packs; B8 programme exit; OWN-P1-016; OWN-P1-011 PPA product |

\*Partial — SHARED subset only.

---

## 11. Contradictions and missing evidence

| Item | Note |
| --- | --- |
| M11 register vs TrainingWorkspace | Clear contradiction — primary OWN-P1-006 driver |
| Historic parity register vs re-audit | GAP-013 / CONF-P1A-003 — docs supersession |
| M07 “functionally complete” narrative vs History planned | GAP-012 honesty |
| PPA readiness text vs live Adjustments `available` + PPA-1 UI | Planning snapshot can lag code; B3 must not treat either as PPA product authorisation |
| GitHub CI | Still absent on P1 branches — local evidence only |
| Exact condition enum for M11 after sync | **Owner selected:** replace `legacy-html-fallback` with **`strong-existing`** (existing valid condition); Wave 3 / not-production purpose text required under B3 implementation |

---

## 12. Specialist review requirements

| Topic | Needed? |
| --- | --- |
| Training/HR section naming confirmation | Optional (OWN-P1-006 now closed) |
| Payroll/ops wording for History vs Adjustments vs PPA | Optional at implementation (OWN-P1-007 now closed) |
| Legal/payroll certification | **Not** required for B3 labelling — and **must not** be claimed |
| Security/IdP | Not required for B3 metadata/labels |
| Accessibility certification | Not claimed; B4 remains separate |

---

## 13. Owner-response table (recorded 2026-08-13)

| Decision ID | Selected option | Owner wording or qualification | Decision date | Evidence reference | Status |
| --- | --- | --- | --- | --- | --- |
| OWN-P1-006 | **A — Synchronise** | Synchronise M11 module-register sections to verified TrainingWorkspace; replace `legacy-html-fallback` with `strong-existing`; metadata/register correction only; Wave 3 freeze preserved; no production/domain/new-implementation claims; gaps not auto-closed; does **not** authorise P1-B3 implementation | 2026-08-13 | `P1_OWNER_DECISION_REGISTER.md`; this briefing; P1-GAP-011 | **Closed (approved)** |
| OWN-P1-007 | **A — Honesty-only labels** | Truthful M07 History/Adjustments labels only; History planned/non-operational; Adjustments = adjustment-prep/foundation not authorised PPA product; qualify/remove “PPA-1 foundation” implication; unlock ≠ PPA; OWN-P1-011 remains open; no payment/M08/certification/PPA product/production; gaps not auto-closed; does **not** authorise P1-B3 implementation | 2026-08-13 | `P1_OWNER_DECISION_REGISTER.md`; this briefing; P1-GAP-012; P1-GAP-079 | **Closed (approved)** |

---

## 14. Recommended next action

1. ~~Owner records OWN-P1-006 and OWN-P1-007~~ — **done 2026-08-13** (this recording act).  
2. Owner may issue a **separate express P1-B3 implementation authorisation** if desired.  
3. Until that express authorisation occurs, **P1-B3 remains unauthorised** — no register/nav application-code changes, no PR/merge/deploy, no automatic progression to P1-B4, no gap auto-closure.

---

*End of briefing. OWN-P1-006 and OWN-P1-007 are approved and closed as disposition only. P1-B3 remains `P1 — PLANNED, NOT AUTHORISED` pending separate express implementation authorisation.*

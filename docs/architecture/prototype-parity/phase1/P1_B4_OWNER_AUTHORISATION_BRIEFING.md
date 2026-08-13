# P1-B4 Owner-Authorisation / Readiness Briefing — Responsive / a11y / appearance evidence

**Document type:** Owner-authorisation readiness briefing (implementation boundary + evidence matrix)  
**Batch:** P1-B4 — Responsive / a11y / appearance evidence  
**Status stamp:** `P1 — PLANNED, NOT AUTHORISED`  
**Branch (authoritative):** `cursor/p1-b3-register-hygiene`  
**Briefing tip:** published on the same branch after P1-B3 acceptance (`6938cbd409dffdacc42d10beca8036f5667f4ebc` source; this docs commit follows)  
**Accepted P1-B1 tip:** `fdb2beb5b0e786e42d358efa9875b6bba52666cd`  
**Accepted P1-B2 tip:** `66f3f8d27803f5b8d24043639d21b9069f58e77a`  
**Accepted P1-B3 tip:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`P1-B3-OWNER-ACCEPT-2026-08-13`)  
**Briefing date:** 2026-08-13  

> **P1-B4 remains `P1 — PLANNED, NOT AUTHORISED`.**  
> This briefing does **not** authorise implementation, close gaps, create/close owner decisions, open a PR, merge, deploy, or begin P1-B5.  
> A separate express named-batch owner act is still required before any P1-B4 coding.  
> The parallel `cursor/aurora-design-foundation` stream is **out of scope** for this briefing and must not be inspected, merged, or depended upon.

**Authoritative sources (this briefing does not replace them):**

| Pack | Source |
| --- | --- |
| Design contract | [`../design-system-contract.json`](../design-system-contract.json) |
| Gap register | [`P1_PROTOTYPE_PARITY_GAP_REGISTER.md`](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md) |
| Execution batches | [`P1_EXECUTION_BATCHES.md`](./P1_EXECUTION_BATCHES.md) |
| Owner decisions | [`P1_OWNER_DECISION_REGISTER.md`](./P1_OWNER_DECISION_REGISTER.md) |
| Gap traceability | [`P1_GAP_TRACEABILITY.md`](./P1_GAP_TRACEABILITY.md) |
| Test/evidence plan | [`P1_TEST_AND_ACCEPTANCE_EVIDENCE_PLAN.md`](./P1_TEST_AND_ACCEPTANCE_EVIDENCE_PLAN.md) |
| P1-B1 / B2 / B3 acceptance | [`../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md), [`../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B2_IMPLEMENTATION_EVIDENCE.md), [`../../audits/p1/P1_B3_IMPLEMENTATION_EVIDENCE.md`](../../audits/p1/P1_B3_IMPLEMENTATION_EVIDENCE.md) |

**Platform boundary (unchanged):** multi-organisation, multi-clinic, **non-clinical** medical-centre operations platform; **24** runtime modules (M01–M24); **M25** unimplemented; **PPA** and **payment execution** out of scope; Best Practice (or equivalent) remains clinical system of record.

---

## 1. Executive summary

P1-B1, P1-B2 and P1-B3 are **owner accepted with qualifications and closed** (2026-08-13). The next proposed batch is **P1-B4 — Responsive / a11y / appearance evidence**: harden and **evidence** the already-accepted Decision A shell for System appearance hydration, keyboard/focus baselines, responsive tablet/mobile residuals, `prefers-reduced-motion`, and historical hydration re-checks.

P1-B4 must **validate and correct defects in the currently accepted shell**, not redesign the product and not integrate parallel Aurora design work.

| Item | Status |
| --- | --- |
| P1-B4 | `P1 — PLANNED, NOT AUTHORISED` |
| New owner-decision blocker for B4 gaps | **None found** (verified) |
| Express named-batch authorisation | **Still required** before coding |
| Gaps 008 / 009 / 031 / 052 / 074 | Remain open / not closed by this briefing |
| `OWN-P1-011` / `OWN-P1-016` | Remain **open** (do not block B4 consideration) |
| Aurora parallel branch | **Not an input**; do not touch or integrate |

---

## 2. Owner-decision analysis (verified)

### 2.1 Gap register owner-clarification fields

| Gap | Topic | Owner clarification (register) | Verified |
| --- | --- | --- | --- |
| P1-GAP-008 | System appearance hydrate settle | **No** | Confirmed in gap register |
| P1-GAP-009 | Keyboard / focus baselines for shell chrome | **No** | Confirmed |
| P1-GAP-031 | Responsive tablet/mobile residual | **No** | Confirmed |
| P1-GAP-052 | Prefers-reduced-motion coverage uneven | **No** (short-form gap; no clarification demanded) | Confirmed |
| P1-GAP-074 | Hydration observations (historical M04/M05/M07) | **No** (observation / re-verify) | Confirmed |

### 2.2 Owner-decision register cross-check

- No open `OWN-P1-*` decision is registered as a **blocker for P1-B4 product choice** on appearance modes, focus behaviour, breakpoints, or reduced-motion policy.
- Appearance modes remain owner-closed by Decision A / design contract: **Light / Dark / System only** (no Executive Blue / Medical Emerald global themes).
- `OWN-P1-016` (localStorage vs SQL) remains **open** and does **not** block P1-B4 consideration (shell/evidence batch, not production data path).
- `OWN-P1-011` (PPA product) remains **open** and is **out of scope** for P1-B4.
- P1A a11y/NFR items (e.g. production WCAG claims) may inform **later** production readiness; they are **not** a P1-B4 implementation-choice blocker. P1-B4 must follow the **accepted design-system contract** without claiming full WCAG certification.

### 2.3 Conclusion

- **No new owner decision ID is required** for P1-B4 readiness.
- **No unresolved owner-choice blocker** was found for the named B4 gaps.
- **P1-B4 still requires separate express named-batch implementation authorisation.**
- Technical details must follow the accepted design contract and **must not silently introduce a visual redesign.**
- If future work discovers a genuine unresolved product choice (for example, a contract conflict that cannot be resolved by defect correction alone), document it for owner review **without** inventing or closing a decision ID in that implementation batch until expressly authorised.

---

## 3. Exact P1-B4 implementation boundary (recommendation — not authorisation)

### 3.1 Intent

Harden and **evidence** existing accepted behaviour. Correct presentation/interaction defects **only** where required to satisfy named responsive, accessibility, appearance, or hydration evidence. Do **not** expand domain behaviour.

### 3.2 Permitted scope (when expressly authorised)

| Area | Permitted work |
| --- | --- |
| System appearance init / hydration | Ensure `theme-init-script` + appearance store settle Light / Dark / System consistently; prevent material false Light↔Dark flash in acceptance captures where technically feasible |
| Appearance controls | Keep Light / Dark / System contract behaviour; evidence preference + resolved theme separately for System+OS Light and System+OS Dark |
| Shell keyboard navigation | Tab / Shift+Tab through shell chrome; Enter / Space activation for operable controls |
| Visible focus | Contract focus-ring retained; never remove outline without replacement |
| Focus order | Logical order across Sidebar, Topbar, module section nav, page header, primary content, drawer/detail |
| Escape behaviour | Escape dismisses drawer/menu/modal overlays |
| Focus trap / restoration | Contain focus while overlays open; restore focus to triggering control on close |
| Responsive shell | Overflow/clipping corrections for SHARED shell + named P1 reference surfaces at required widths |
| Tablet / mobile | Sidebar open/closed geometry; overlays; ≥~44px mobile menu targets where shell controls apply; usable section navigation; drawer/detail geometry |
| `prefers-reduced-motion` | Honour `reduce`; remove unnecessary transition/animation; keep drawer/menu/nav understandable without motion; no pulsing/continuous warning animation as sole cue |
| Historical hydration (074) | Re-verify historical M04/M05/M07 hydration observations on shared chrome / theme path **without** expanding those modules’ domain scope |

### 3.3 Components and surfaces in scope (review / defect-fix as needed)

**Shared shell / chrome (primary):**

- `src/components/shell/Sidebar.tsx`
- `src/components/shell/Topbar.tsx`
- `src/components/shell/ModuleSectionNav.tsx`
- `src/components/shell/PageHeader.tsx`
- `src/components/shell/DetailPanel.tsx`
- `src/components/shell/PrimaryToolbar.tsx` (as used by P1 surfaces)
- `src/components/shell/theme-init-script.ts`
- Appearance helpers / store (`src/lib/command-centre/storage.ts` and related consumers)
- `src/components/ui/Drawer.tsx`
- Menus / popovers used by shell chrome (Command Centre control bar appearance selector and shell menus as applicable)

**P1 reference / honesty surfaces (shared-chrome evidence; no domain expansion):**

- `/dashboard` (Command Centre)
- `/action-inbox`
- P1-B2 honesty surfaces (unavailable Export/MFA explanations; QA/demo gating chrome)
- P1-B3 shared-chrome touchpoints: M07 History / Adjustments section chrome; M11 Training section navigation **only as consumers of shared shell** — do not alter M11/M07 domain SoT, permissions, or frozen Wave behaviour

### 3.4 Explicit exclusions

P1-B4 must **not**:

- Perform a broad visual redesign or Decision A restyle beyond defect correction
- Adopt, inspect, merge, cherry-pick, rebase from, or depend on `cursor/aurora-design-foundation`
- Introduce new navigation architecture
- Perform module-specific design migrations (that is later-batch / Aurora-review territory)
- Change business/domain workflows
- Implement PPA or payment functionality
- Implement M08 / doctor pay
- Implement patient or clinical record functionality
- Change permission models
- Add dependencies or change lockfiles
- Introduce SQL, schema, or migrations
- Change environment, secrets, or CI/CD configuration
- Automatically progress to P1-B5
- Open a PR, merge, or deploy from B4 readiness or implementation without separate owner acts
- Claim full WCAG compliance or pixel parity unless independently proven in that batch’s evidence
- Close gaps without owner acceptance of an authorised implementation tip

P1-B4 **may** correct presentation or interaction defects only where required to satisfy its named responsive, accessibility, appearance, or hydration evidence.

---

## 4. Objective acceptance matrix (proposed)

### 4.1 Widths (required)

| Width | Class |
| ---: | --- |
| 1440 | Desktop |
| 1280 | Desktop |
| 1024 | Desktop / narrow |
| 768 | Tablet |
| 430 | Large mobile |
| 390 | Mobile |

(Contract may list additional viewports for advisory capture; the six widths above are **blocking** for P1-B4 exit.)

### 4.2 Appearances (required — four distinct states)

| Case | Appearance preference | OS `colorScheme` | Must not be substituted by |
| --- | --- | --- | --- |
| Light | `light` | light | — |
| Dark | `dark` | dark | — |
| System + OS Light | `system` | light | A lone “System” screenshot |
| System + OS Dark | `system` | dark | A lone “System” screenshot |

**Do not** treat a single System screenshot as dual-OS evidence. Assert both `data-appearance` / preference and resolved `theme-dark` / `colorScheme`.

### 4.3 Responsive checks (blocking)

- No horizontal page overflow (`scrollWidth ≤ clientWidth + 1px` tolerance)
- No clipped navigation or topbar controls
- Sidebar visible geometry when open
- Sidebar fully off-screen / inert when closed (mobile)
- Correct overlays (mobile nav overlay behaviour)
- Mobile menu target approximately **44px** minimum for primary shell menu controls
- Usable section navigation at every required width
- Drawer / detail-panel geometry within accepted bands / usable layout
- Content remains usable at every required width

### 4.4 Keyboard / focus checks (blocking)

- Tab and Shift+Tab traverse shell chrome
- Visible focus (contract ring)
- Logical focus order
- Enter and Space activate operable controls
- Escape dismisses overlays
- Focus containment where required (open drawer/menu/modal)
- Focus restoration to the triggering control
- `aria-expanded` / `aria-controls` where applicable
- Accessible names / descriptions present
- No disabled/unavailable action falsely reporting success
- No status conveyed by colour alone

### 4.5 Motion checks (blocking)

- `prefers-reduced-motion: reduce` respected
- No unnecessary transition/animation under reduce
- Drawer/menu/navigation remain understandable without motion
- No pulsing or continuous warning animation as the sole status cue

### 4.6 Hydration / appearance settle checks (blocking)

- Initial stored Light
- Initial stored Dark
- Initial System + OS Light
- Initial System + OS Dark
- Server/client settling documented
- No material false-theme flash in captured acceptance evidence
- No hydration errors/warnings attributable to the P1 surfaces under test
- Re-check historical M04/M05/M07 observations **without** expanding domain scope (GAP-074)

### 4.7 Advisory (not automatic pass/fail of B4 alone)

- Additional contract viewports beyond the six required widths
- Pixel-diff vs Decision A PNGs (remains controlled later / GAP-010 residual)
- Full WCAG 2.2 AA programme claim
- GitHub Actions (currently absent — local validation expected unless CI is separately authorised)

---

## 5. Evidence quality requirements (proposed)

### 5.1 Locations

| Artefact | Path |
| --- | --- |
| Implementation evidence | `docs/audits/p1/P1_B4_IMPLEMENTATION_EVIDENCE.md` |
| Evidence pack | `docs/audits/p1/b4-responsive-a11y-appearance/` |
| Screenshots | `docs/audits/p1/b4-responsive-a11y-appearance/shots/` |

### 5.2 Required future implementation evidence properties

- Assertions that **fail** if required shell regions are missing
- Wait-for-ready behaviour (no capture of loading placeholders as success)
- Separate loading evidence where applicable
- Objective geometry and overflow measurements (not eyeball-only)
- Appearance preference **and** resolved-theme assertions
- Keyboard event and focus-return assertions
- Relevant ARIA assertions
- Reduced-motion assertions
- Screenshot manifest (name → width → appearance → OS scheme → purpose)
- Clear separation of **local validation** from GitHub CI (no CI pass claimed if checks absent)
- Preservation/archive of superseded evidence when regenerated

### 5.3 Non-claims

- Do **not** claim full WCAG compliance from P1-B4 unless independently proven.
- Do **not** claim pixel parity with Decision A PNGs unless that work is expressly in-scope and evidenced.
- Do **not** claim production approval or overall Programme P1 completion.

---

## 6. Relationship to the Aurora parallel work

Recorded explicitly:

1. Aurora work on `cursor/aurora-design-foundation` is an **isolated design-review stream**.
2. It is **not** an input or dependency for P1-B4.
3. P1-B4 must validate the **currently accepted shell** on the authoritative P1 branch.
4. **No Aurora code** may enter this branch without a separate owner review, compatibility assessment, and **express integration authorisation**.
5. Any future overlap must be resolved **after** both streams stop at their review checkpoints — not by silent merge during P1-B4.
6. This readiness briefing was prepared **without** inspecting, merging, cherry-picking, rebasing from, modifying, or depending on the Aurora branch.

---

## 7. Risks and recommendations

### 7.1 Likely weaknesses / risks

| Risk | Class | Notes |
| --- | --- | --- |
| Screenshot flakiness / theme settle race | **Blocking** if evidence cannot prove no material false flash | Prefer reload-after-preference; assert theme before capture |
| Hydration timing (SSR vs client) | **Blocking** for GAP-008/074 | Capture initial + settled; document method |
| Hot-reload vs production-build differences | **Blocking** advisory elevated | Prefer production `next build` + `next start` evidence for acceptance pack; record if only `next dev` used |
| Browser `emulateMedia` / Playwright OS scheme limits | **Advisory → Blocking** if System cases not distinct | Must prove System+OS Light ≠ System+OS Dark |
| Focus/keyboard incomplete coverage | **Blocking** for GAP-009 | Named tests per chrome region; Escape + restore required |
| Responsive edge cases at 1024/768 | **Blocking** for GAP-031 | Overflow + clipped chrome asserts |
| Test suites rewriting wave evidence JSON | **Advisory / process** | Restore unrelated evidence to HEAD; do not commit |
| Over-claiming WCAG / pixel parity | **Blocking** if claimed without proof | Keep qualifications |
| Aurora leakage | **Blocking** control risk | Do not touch Aurora branch |

### 7.2 Recommended implementation approach (recommendation only)

1. Owner expressly authorises named batch **P1-B4** on a clean tip of the authoritative P1 branch.  
2. Add focused shell tests + browser harness for the matrix in §4.  
3. Fix only defects required to make blocking checks pass.  
4. Prefer production-server evidence for final owner screenshots; record environment.  
5. Publish evidence pack under §5 paths; archive superseded shots if regenerating.  
6. Stop for owner acceptance — **no automatic P1-B5**.

This section is a **recommendation**, not implementation and not owner acceptance.

### 7.3 Blocking vs advisory summary

| Blocking for authorised P1-B4 exit | Advisory |
| --- | --- |
| Six widths × overflow/geometry | Extra contract viewports |
| Four appearance states distinct | Pixel-diff PNG parity |
| Keyboard/focus/Escape/restore + ARIA | Full WCAG certification |
| Reduced-motion honouring | Performance profiling beyond hydration notes |
| Hydration settle without material false flash | GitHub CI (absent today) |
| GAP-074 re-verify without domain expansion | Aurora comparison |

---

## 8. Included gaps (unchanged status)

| Gap | Batch | Status after this briefing |
| --- | --- | --- |
| P1-GAP-008 | P1-B4 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-009 | P1-B4 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-031 | P1-B4 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-052 | P1-B4 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |
| P1-GAP-074 | P1-B4 | Still `P1 — PLANNED, NOT AUTHORISED` — **not closed** |

---

## 9. Control preservation

- P1-B1 / P1-B2 / P1-B3 remain accepted/closed with qualifications  
- **83** gaps / **8** batches / **24** runtime modules preserved  
- M25 unimplemented  
- `OWN-P1-011` open; `OWN-P1-016` open  
- P1-B4 through P1-B8 **unauthorised**  
- No application-code, test, script, PR, merge, or deployment change from this briefing alone  

---

## 10. Owner next act (not performed by this briefing)

To proceed, the owner must **expressly authorise** named batch **P1-B4** implementation on a stated tip/branch. Until then:

- No P1-B4 coding  
- No gap closure  
- No PR / merge / deploy  
- No automatic progression to P1-B5  
- No Aurora integration  

**Current programme claim for this docs tip:**  
`P1-B4 responsive, accessibility and appearance authorisation-readiness briefing prepared and published — P1-B4 remains unauthorised and the parallel Aurora design stream was not touched or integrated.`

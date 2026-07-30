# HCDP UI Batch 1 — Qualification Completion Plan

**Document:** `docs/plans/HCDP_UI_BATCH1_QUALIFICATION_COMPLETION_PLAN.md`  
**Lane:** Planning and evidence-review only (no production repair in this run)  
**Date:** 30 July 2026  
**Planning branch:** `cursor/ui-batch1-qualification-plan`  
**Planning base:** `a4350c942aa2ce6987c62e9c348354900dfab712` (independent-QA report commit)  
**Worktree:** `C:\Users\ETB Sri Lanka\Desktop\HCDP\.worktrees\ui-batch1-qualification-plan`

---

## 1. Executive verdict

| Item | Verdict |
|---|---|
| Browser-crypto remediation | **Owner ACCEPTS** — PASS at `a1efd472ea086d98e82b6ca60da8b9071b1808e2` on `cursor/browser-crypto-remediation` (matches independent QA §8.1) |
| UI Batch 1 | **QUALIFIED / NOT YET OWNER ACCEPTED** — tokens, shared primitives, M07 Overview GAP-PAR-003, and PPA-1 presentation polish landed; register gaps remain (primarily UI-DASH-03 / GAP-PAR-008 class decorative dashboard chrome, and appearance-verification completeness) |
| Candidates merged to `main`? | **No** — `a1efd47`, `834cf22`, `a4350c9` are **not** ancestors of `origin/main` (`0afe878…`) |
| UI Batch 2 | **Unauthorised** until Group A Batch 1 qualifications are completed & independently verified, **or** owner explicitly defers remaining items with documented justification |
| This planning lane | Creates **this plan only**; does **not** repair findings, create the corrective branch, or merge |

**Recommended next implementation action (not performed here):** one narrow corrective batch `cursor/ui-batch1-qualification-completion` based exactly on `a1efd472ea086d98e82b6ca60da8b9071b1808e2`, closing **Group A** finding IDs listed in §5, then independent re-verification before owner acceptance.

---

## 2. Evidence and lineage reviewed

### 2.1 Authoritative inputs (read completely)

| # | Source | Ref | Inspection method |
|---|---|---|---|
| 1 | Owner UI Decision Register | `a4d9d3b2dc321ff16f6a42795e8e5bdbc996630b` · `docs/specifications/HCDP_OWNER_UI_DECISION_REGISTER.md` | `git show` (not on candidate tree) |
| 2 | Independent verification report | `a4350c942aa2ce6987c62e9c348354900dfab712` · `docs/audits/BROWSER_CRYPTO_AND_UI_BATCH1_INDEPENDENT_VERIFICATION.md` | Full read on planning tree |
| 3 | UI Batch 1 candidate | `cursor/completed-ui-reconciliation` @ `834cf22a63efc36423533586d56e8913d8bedd8b` | Diff `c8c9995..834cf22` + selective `git show` |
| 4 | Crypto candidate | `cursor/browser-crypto-remediation` @ `a1efd472ea086d98e82b6ca60da8b9071b1808e2` | Diff `834cf22..a1efd47` + selective `git show` |
| 5 | Prior crypto evidence | `docs/audits/browser-crypto-remediation/` | Read-only listing + report JSON peek |
| 6 | Independent QA screenshots / machine report | `docs/audits/browser-crypto-ui-batch1-independent-qa/` | Present on planning base |

### 2.2 Verified ancestry

```text
c8c99950eaad6a2440a9fb91744d37a7d5dfdacc   (PPA-1 security/concurrency)
  └── 834cf22a63efc36423533586d56e8913d8bedd8b   (UI Batch 1)
        └── a1efd472ea086d98e82b6ca60da8b9071b1808e2   (browser-crypto remediation)
              └── a4350c942aa2ce6987c62e9c348354900dfab712   (independent QA report only)
```

| Check | Result |
|---|---|
| `c8c9995` → `834cf22` ancestor | **True** |
| `834cf22` → `a1efd47` ancestor | **True** |
| `a1efd47` → `a4350c9` ancestor | **True** |
| `a1efd47` on `origin/main` | **False** |
| Independent-QA delta `a1efd47..a4350c9` | **Only** report + `docs/audits/browser-crypto-ui-batch1-independent-qa/*` (evidence-only; no production code) |

### 2.3 UI Batch 1 production file inventory (`c8c9995..834cf22`)

| Path | Role |
|---|---|
| `src/styles/tokens.css` | Premium Clinical token intent wiring (UI-TOK-01) |
| `src/app/globals.css` | Typography scale / reduced-motion |
| `src/components/shell/PageHeader.tsx` | Shared header; removed mock-refresh toast |
| `src/components/ui/{Badge,Button,EmptyState,Panel,Table,Tabs}.tsx` | Shared primitives |
| `src/modules/m07-staff-pay/StaffPayWorkspace.tsx` | M07 shell presentation + focus ring |
| `src/modules/m07-staff-pay/sections/OverviewSection.tsx` | GAP-PAR-003 / UI-M07-05 copy correction |
| `src/modules/m07-staff-pay/sections/AdjustmentsSection.tsx` | PPA-1 presentation token/type classes |
| `src/modules/m07-staff-pay/tests/m07-shell.test.ts` | Updated |
| `src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts` | Added |

### 2.4 Owner decisions already made (recorded)

| # | Decision | Status |
|---|---|---|
| OD-1 | Accept browser-crypto remediation `a1efd47` | **PASS / ACCEPT** |
| OD-2 | UI Batch 1 recorded QUALIFIED / NOT YET OWNER ACCEPTED | Recorded |
| OD-3 | Crypto + UI Batch 1 candidates remain unmerged | Confirmed vs `origin/main` |
| OD-4 | UI Batch 2 remains unauthorised until Batch 1 qualified requirements completed & independently verified **or** explicitly deferred by owner with documented justification | Binding for this plan |

### 2.5 Source precedence (applied)

1. Wave-control and explicit owner-authorised scope  
2. `HCDP_OWNER_UI_DECISION_REGISTER.md` @ `a4d9d3b`  
3. Written plans for completed in-scope functionality  
4. Screen/action matrices  
5. Prototype as visual/interaction reference only  
6. Audits/gap reports as evidence (including independent verification @ `a4350c9`)

---

## 3. Full qualification-finding register

Severity key: **C** Critical · **Maj** Major · **Min** Minor · **Obs** Observation · **Pass** Passed requirement · **Blk** Blocked/unverified.

Classification key:

1. Defect introduced by UI Batch 1  
2. Pre-existing exposed by verification  
3. Accepted-register requirement not implemented  
4. Partially implemented requirement  
5. Broader UI Batch 2 enhancement  
6. Outside authorised UI scope  
7. Business-functionality request that must remain excluded  

| Finding ID | QA severity | Register requirement ID | Route/component | Evidence | Root cause | Required correction | Authorised lane | Verification method | Owner decision needed |
|---|---|---|---|---|---|---|---|---|---|
| F-PASS-CRYPTO-01 | Pass | (infra; not UI register) | ModuleWorkspace → M06/M07 barrels | QA §3 #1–3; no `node:crypto` in client static | Barrel re-exports removed | None | Crypto (ACCEPTED) | Re-run crypto suites on tip | No |
| F-PASS-CRYPTO-02 | Pass | (infra) | `published-timesheet-hash` / `sha256-hex-utf8` | QA §4 exact vector `7c14854a…ee83` | Pure sync SHA-256 | None | Crypto (ACCEPTED) | Known-vector parity | No |
| F-PASS-CRYPTO-03 | Pass | (infra) | M06/M07/PPA/Batch5–6/workforce suites | QA §5 all green | Scope-limited remediation | None | Crypto (ACCEPTED) | Named regression suites | No |
| F-PASS-ROUTE-01 | Pass | UI-SHELL-06; route matrix | `/action-inbox`, `/settings`, `/staff-doctors`, `/roster`, `/time-attendance`, `/staffpay`, overview, adjustments | QA §6.1 focused recheck **200**; cryptoConsoleCount=0 | N/A | None | — | Browser crawl | No |
| F-PASS-M07-05 | Pass | UI-M07-05 / GAP-PAR-003 | `OverviewSection.tsx` | Pre `c8c9995` stale “unavailable”; tip `a1efd47` truthful Batch 6 + PPA-1 bounds | Batch 1 copy fix | None (already corrected) | — | String assert + browser | No |
| F-PASS-UI-TOK | Pass (partial→Pass for Batch 1 token land) | UI-TOK-01; UI-APPEAR-02 | `tokens.css` | `--pce-canvas` `#fbfbfa`, `--accent-champagne` `#c5a880`, `body.theme-dark` PCE equivalents | Batch 1 wiring | No further token invent for Batch 1 unless Group A a11y contrast fail | Group A only if contrast fail found | Token review + contrast | Only if residual contrast fail |
| F-PASS-FAKE-HEADER | Pass | UI-FAKE-01 | `PageHeader.tsx` | Batch 1 test: no `pushToast` / mock refresh; Action Inbox link | Batch 1 removal | None | — | Source + UI assert | No |
| F-PASS-PPA1 | Pass | UI-PPA1-01…02; UI-M07-01 | `/staffpay?section=adjustments` | QA §6.1/6.5; Adjustments available; truthful load/empty; non-certified / unlock≠PPA copy retained | PPA-1 lineage + Batch 1 presentation classes | None for capability; Group A only if misleading state found in re-verify | — | UI/integration + screenshots | No |
| F-PASS-A11Y-SMOKE | Pass (smoke) | UI-A11Y-01,06 | Shell + `/staffpay` | QA §6.4 landmarks; Tab focus outline 2px | Existing + Batch 1 focus-ring | Close residual gaps only on materially changed components (Group A) | Group A residual | Keyboard probe | See OD-MIN-* |
| F-PASS-RESP | Pass (with flake) | UI-RESP-01 | Width matrix routes | QA §6.3 `overflowX: false` except roster@1024 timeout flake | N/A | No overflow defect to fix; harden flake separately if CI gate | Group A optional flake harden | 1440…390 matrix | See F-MIN-03 |
| F-PASS-ALIAS | Pass | UI-SHELL-05,06 | Legacy aliases | QA §5 307 redirects preserved | Existing routing | None | — | HTTP redirect checks | No |
| F-MAJ-01 | Major | UI-DASH-03; UI-FAKE-01; GAP-PAR-008 class; UI-DASH-02 boundary | `/dashboard` · `DashboardWorkspace.tsx` (`DashboardShellStrip` toast-only verbs); Command Centre still dense prototype chrome | QA §7 Major #1; §2.2; `pushToast(… demo only)` on sign-in / outage / intervention controls | Register truthfulness debt **not** closed by Batch 1 file set (dashboard not in Batch 1 diff; PageHeader only partially addressed GAP-PAR-008 class) | **Narrow:** remove or disable decorative/toast-only demo chrome verbs that claim actionable outcomes without service-backed mutation; label remaining demo strips as non-operational **or** remove them. **Do not** redesign Command Centre / invent metrics (that is Group B) | **Group A** (truthfulness on completed dashboard chrome) | Control→service audit + screenshots light/dark 1440/390 | **Yes — confirm narrow chrome removal vs defer** (OD-A1) |
| F-MAJ-02 | Major | Outside UI register (build gate) | `published-timesheet-outbox.ts:235` | QA §5/§7 Major #2; pre-existing; **not** in crypto/UI Batch 1 diffs | Pre-existing TypeScript union typing | Separate defect/CR — **not** UI Batch 1 presentation | **Outside UI / Group C for this plan** (infra CR) | `tsc` / `next build --webpack` | **Yes — whether build-gate blocks UI acceptance** (OD-A2); default: **does not block UI Batch 1 owner acceptance** if crypto+UI gates pass |
| F-MIN-01 | Minor | — (CI flake) | `/dashboard` first crawl | QA §6.1/§7 Minor #1: first **500**, warm **200**; also in prior crypto evidence | Transient compile/race in worktree browser gate | Optional: stabilize warm-up / retry in QA harness only; **not** a product UI defect | Observation / harness; not Group A product code unless proven regression | Browser gate with warm retry | **Yes — defer harness-only?** (OD-MIN-01) Default: **defer** (not Batch 1 product scope) |
| F-MIN-02 | Minor | UI-M03-01 (canonical `/settings`) | Literal `/organisation-access` | QA §6.1 **404**; `/settings` **200** | Naming mismatch; not a production route | None in product. Update QA matrix labels only if needed | Outside product / Obs | Confirm `/settings` labelled Organisation & Access | **Yes — accept as non-defect?** (OD-MIN-02) Default: **accept / no code** |
| F-MIN-03 | Minor | UI-RESP-01 (flake) | `/roster` @ 1024 | QA §6.3 networkidle timeout; not overflow | Playwright wait flake | Optional harness wait strategy; no overflow correction required | Harness / Obs | Re-run width cell | **Yes — defer?** (OD-MIN-03) Default: **defer** |
| F-MIN-04 | Minor | UI-APPEAR-01…03 | Appearance selector vs Playwright `colorScheme` | QA §6.4/§7 Minor #4; `body.theme-dark` exists in tokens but OS `colorScheme` alone does not fully switch Premium Clinical path | Verification method gap + need in-app preference exercise | Group A: verify (and fix if broken) **in-app** light/dark/system on Batch 1 surfaces via existing appearance selector; add tests/screenshots that toggle `theme-dark` / stored preference — **not** OS-only | **Group A** (appearance consistency verification + fix-if-broken) | In-app appearance matrix §13 | **Yes if “verification-only pass” vs code change** (OD-MIN-04) Default: **must re-verify via in-app path**; code only if fail |
| F-MIN-05 | Minor | UI-RESP-03 / polish | `/dashboard` mobile labels | QA §6.3 mobile truncation of dense location labels | Pre-existing density | Truncation that blocks task completion → Group A fix; cosmetic-only truncation → defer or Batch 2 | **Group A if task-blocking**; else defer | 390/430 task paths | **Yes — cosmetic defer?** (OD-MIN-05) Default: **defer cosmetic**; fix if primary action clipped |
| F-OBS-01 | Observation | — | Worktree tooling | QA §2.3/§7 Obs #1 Turbopack+junction fail; webpack compile OK | Windows worktree `node_modules` junction | Document; use webpack/dev patterns for evidence | Outside UI product | N/A | No |
| F-OBS-02 | Observation | — | Console hydration noise | QA §6.2 first crawl noise; focused recheck quiet; not crypto | SSR vs client theme/chrome timing | Do not treat as crypto; investigate only if Group A surfaces regress | Outside unless regresses Group A | Focused console recheck | No (unless regress) |
| F-OBS-03 | Observation | — | Auth server `node:crypto` | QA §7 Obs #3 | Expected server-only | None | Outside | Static bundle `rg` | No |
| F-BLK-BUILD | Blocked (prod typecheck) | — | Full `next build` typecheck | QA §5 | F-MAJ-02 | Track under OD-A2; not UI presentation batch | Outside UI | Separate CR | OD-A2 |
| F-DEFER-B01 | Observation→Batch 2 | UI-DASH-01 polish beyond truthfulness; full Premium Clinical Command Centre redesign | `/dashboard` Command Centre density | QA §2.2 “does not by itself satisfy full register redesign” | Batch 1 intentionally narrow | Full dashboard redesign / IA / shell restructure | **Group B** | Future Batch 2 | Owner Batch 2 auth later |
| F-DEFER-B02 | Observation→Batch 2 | UI-MOD-01 full visual reconciliation | M01–M06 module landings beyond shared primitives | Batch 1 did not restyle module bodies | Narrow Batch 1 scope | Module landing redesigns | **Group B** | Future Batch 2 | Later |
| F-EXCL-01 | Excluded | UI-PPA1-05; wave-control | PPA lines/pickers/calc/approval/recon/export/payment | Register §2/§10 | Scope | Do not implement | **Group C** | Control inventory | No |

### 3.1 Finding totals

| Bucket | Count | IDs |
|---|---:|---|
| Critical defects | **0** | — |
| Major | **2** | F-MAJ-01, F-MAJ-02 |
| Minor | **5** | F-MIN-01…05 |
| Observation | **3** | F-OBS-01…03 |
| Passed (crypto/UI/route) | **11** | F-PASS-* |
| Blocked/unverified (build gate) | **1** | F-BLK-BUILD (alias of F-MAJ-02 impact) |
| Deferred Batch 2 markers | **2** | F-DEFER-B01, F-DEFER-B02 |
| Explicit exclusions called out | **1+** | F-EXCL-01 (+ §7) |

### 3.2 Classification summary

| Classification | Finding IDs |
|---|---|
| 1 Defect introduced by UI Batch 1 | **None verified** |
| 2 Pre-existing exposed by verification | F-MAJ-02, F-MIN-01, F-MIN-03, F-MIN-05, F-OBS-01, F-OBS-02 |
| 3 Accepted-register requirement not implemented | F-MAJ-01 (UI-DASH-03 / GAP-PAR-008 class remaining) |
| 4 Partially implemented requirement | F-MIN-04 (appearance verification path); F-PASS-UI-TOK / F-PASS-A11Y-SMOKE (landed but re-verify) |
| 5 Broader UI Batch 2 enhancement | F-DEFER-B01, F-DEFER-B02 |
| 6 Outside authorised UI scope | F-MAJ-02 / F-BLK-BUILD, F-OBS-01, F-OBS-03, F-MIN-02 (non-route) |
| 7 Business-functionality excluded | F-EXCL-01 |

---

## 4. Register requirement traceability

| Register ID | Independent QA outcome | Group | Batch 1 completion action |
|---|---|---|---|
| UI-TOK-01 | Tokens landed; dark PCE block present | A (re-verify) | Confirm contrast on changed surfaces; no new palette invent |
| UI-SHELL-01…06 | Shell/nav OK; aliases OK; `/prototype` not in defect list | A re-verify / Pass | No IA change; screenshot shell 1440/390 |
| UI-DASH-01 | Workspace real; dense chrome remains | B for redesign | Keep workspace; no ModuleLanding swap |
| UI-DASH-02 | No new fake metrics observed in Batch 1 diff | A/B boundary | Do not invent metrics in corrective batch |
| UI-DASH-03 | **Open** (F-MAJ-01) | **A** | Narrow remove/disable toast-only decorative verbs |
| UI-MOD-01…05 | Shared primitives only; module bodies largely untouched | B for full polish | No frozen-behaviour change |
| UI-M07-01…04 | Disclaimer / non-payment posture retained in evidence | Pass / protect | Do not weaken copy |
| UI-M07-05 | **Closed** on tip (F-PASS-M07-05) | Pass | Regression string test must remain green |
| UI-PPA1-01…05 | Available; presentation polished; no PPA-2 creep observed | Pass / protect | Presentation-only if any state copy fix |
| UI-RESP-01…03 | Largely Pass; flakes/truncation minor | A if defect; else defer | Overflow regression mandatory |
| UI-A11Y-01…06 | Smoke Pass on crawled surfaces | A on changed comps | Focus/labels/roles/reduced-motion checks |
| UI-APPEAR-01…03 | Method gap (F-MIN-04); tokens support `theme-dark` | **A** | In-app appearance matrix |
| UI-STATE-01…05 | Adjustments truthful states observed | Pass / protect | State matrix on M07 + Adjustments |
| UI-FAKE-01…05 | PageHeader fixed; dashboard strip still toast-demo | **A** for remaining chrome on dashboard strip | Control audit |
| UI-M01-01 / UI-M02-01 / UI-M03-01 / UI-M04-01 / UI-M05-01 / UI-M06-01 | Not fully restyled | **B** | Do not expand into module redesigns |

---

## 5. Group A completion scope

**Goal:** Close verified gaps required for **unqualified UI Batch 1 owner acceptance** against the register, without Batch 2 redesign and without domain changes.

### 5.1 Exact finding IDs to close (product)

| ID | Must-close? | Notes |
|---|---|---|
| **F-MAJ-01** | **Yes** (default) | UI-DASH-03 / GAP-PAR-008 class — narrow dashboard chrome truthfulness |
| **F-MIN-04** | **Yes** (verification; code if fail) | In-app appearance path for Premium Clinical tokens |
| F-MIN-05 | Conditional | Only if 390/430 primary tasks clipped |
| F-PASS-* | Protect | No regressions (Overview copy, tokens, PageHeader, PPA-1, routes, a11y smoke, overflow) |

### 5.2 Explicitly not in Group A product closure

| ID | Disposition |
|---|---|
| F-MAJ-02 / F-BLK-BUILD | Separate infra CR (OD-A2) |
| F-MIN-01, F-MIN-03 | Harness/flake; defer by default |
| F-MIN-02 | Non-route naming; no product change |
| F-OBS-* | Document only |
| F-DEFER-B* | UI Batch 2 |
| F-EXCL-01 | Excluded forever for this lane |

### 5.3 Register requirement IDs in scope

`UI-DASH-03`, `UI-FAKE-01`, `UI-FAKE-02` (as applied to dashboard chrome strip), `UI-APPEAR-01`, `UI-APPEAR-02`, `UI-APPEAR-03`, `UI-A11Y-01…06` (changed surfaces), `UI-RESP-01…03` (regression), `UI-TOK-01` (no regress), `UI-M07-05` (no regress), `UI-PPA1-01…04` (presentation protect), `UI-M07-01…03` (copy protect).

### 5.4 Exact routes and components

| Route | Components / files (inspect or modify) |
|---|---|
| `/dashboard` | `src/components/workspaces/DashboardWorkspace.tsx` (`DashboardShellStrip`, demo toast actions); **do not** redesign `command-centre/*` beyond removing/disabling non-functional chrome verbs that fail UI-FAKE-01 / UI-DASH-03 |
| Shared shell | `src/components/shell/PageHeader.tsx` (protect Batch 1 fix); shell nav (screenshot only unless defect) |
| Appearance | `src/lib/portal-context.tsx` + appearance helpers it imports; `src/styles/tokens.css` `body.theme-dark` (fix only if in-app toggle fails to apply PCE tokens) |
| `/staffpay`, `?section=overview`, `?section=adjustments` | `StaffPayWorkspace.tsx`, `OverviewSection.tsx`, `AdjustmentsSection.tsx` — **regression only** unless presentation defect found |
| Shared UI | `Badge`, `Button`, `EmptyState`, `Panel`, `Table`, `Tabs` — regression / a11y only |

### 5.5 Proposed files to inspect or modify

**Likely modify (Group A):**

1. `src/components/workspaces/DashboardWorkspace.tsx` — remove or disable toast-only demo actions in `DashboardShellStrip` (and any sibling chrome that falsifies success).  
2. Tests: extend `m07-ui-batch1-presentation.test.ts` **or** add focused `ui-batch1-qualification-*.test.ts` for dashboard chrome audit + appearance class application.  
3. Only if F-MIN-04 fails: appearance apply path / token mapping files touched by selector (minimal).

**Inspect-only (unless defect):** `tokens.css`, `globals.css`, M07 sections, shared primitives, `CommandCentre.tsx` (inventory of toast success verbs — **Command Centre demo mutators are pre-existing local-demo behaviour**; full cleanup is Group B unless owner expands OD-A1 to include CC toast-success verbs).

**OD-A1 scope clarification (owner):**

| Option | Scope |
|---|---|
| **A1-NARROW (recommended default)** | Only `DashboardShellStrip` (and equivalent header chrome) toast-only buttons without navigation/service |  
| **A1-EXTENDED** | Also inventory `CommandCentre.tsx` local-demo `pushToast(… success)` verbs and remove/relabel under UI-FAKE-01 — still **no** CC visual redesign |

### 5.6 Required visual/interaction result

- Dashboard chrome no longer presents **actionable** controls that only toast “demo only” as if they were live operational actions.  
- Remaining demo/QA affordances (if any) must be explicitly labelled non-operational and must **not** emit success toasts that imply backend completion.  
- M07 Overview continues to state Batch 6 export/recon/lock availability without claiming payment/certification.  
- Adjustments continues PPA-1 foundation presentation; unlock ≠ PPA.  
- Shared PageHeader retains Action Inbox link; no mock-refresh toast.

### 5.7 A11y acceptance criteria

- `:focus-visible` visible on remaining interactive controls on touched surfaces (UI-A11Y-01).  
- Labels retained on forms (UI-A11Y-02).  
- Status/errors not colour-only (UI-A11Y-03).  
- `prefers-reduced-motion` honoured (UI-A11Y-04).  
- Keyboard reaches primary actions on `/dashboard` (after chrome change), `/staffpay`, Adjustments (UI-A11Y-05).  
- `nav`/`main` landmarks present (UI-A11Y-06).

### 5.8 Responsive acceptance criteria

- Widths **1440, 1280, 1024, 768, 430, 390**: `overflowX === false` on Group A routes.  
- Mobile: open module, switch M07 section, open Adjustments create path still completable (UI-RESP-03).  
- No new clipping of primary actions introduced by chrome removal.

### 5.9 Light/dark/device-mode acceptance criteria

- Exercise **in-app** Light / Dark / System via existing appearance selector (not OS `colorScheme` alone).  
- Confirm `body.theme-dark` (or equivalent) applies PCE canvas/ink/champagne/status tokens on `/dashboard`, `/staffpay`, Adjustments.  
- Appearance change must not reset M07 section/workspace state unexpectedly (UI-APPEAR-03).

### 5.10 Tests to add/update

| Test | Purpose |
|---|---|
| Keep `m07-ui-batch1-presentation.test.ts` | Tokens, Tabs a11y roles, PageHeader no toast, typography |
| Keep `m07-shell.test.ts` | M07 shell regressions |
| Add dashboard chrome audit test | Assert removed/disabled toast-only demo action patterns (string/source or RTL) |
| Add appearance apply test | Setting dark preference applies `theme-dark` (or documented class) |
| Keep Overview string assert | GAP-PAR-003 must not regress |
| Keep/extend PPA-1 UI tests | No behaviour change; presentation safe |

### 5.11 Real-browser scenarios

1. Cold + warm load `/dashboard` — 200; no `node:crypto` console.  
2. Inventory dashboard chrome controls — none toast-only fake success.  
3. Toggle appearance Light→Dark→System on `/dashboard` and `/staffpay`.  
4. `/staffpay?section=overview` — Overview copy truthful.  
5. `/staffpay?section=adjustments` — register/create/cancel draft paths still real; empty/loading/denied truthful.  
6. Keyboard Tab through primary controls on dashboard + staffpay.  
7. Width matrix including 390 hamburger nav task completion.

### 5.12 Screenshot evidence required

Minimum set (new qualification-completion evidence folder; do **not** overwrite prior QA evidence):

- `dashboard-{1440,390}-{light,dark}.png`  
- `shell-nav-{1440,390}.png`  
- `staffpay-overview-{1440,390}-{light,dark}.png`  
- `staffpay-adjustments-{1440,390}-{light,dark}.png`  
- `action-inbox-1440.png`, `settings-1440.png` (regression spot checks)

### 5.13 Regression suites required

- `m07-ui-batch1-presentation` + `m07-shell`  
- `npm run test:m07` (or owner-agreed focused subset including PPA-1 UI + Batch 5/6 if M07 files touched only presentation — prefer full `test:m07` if time allows)  
- `browser-crypto-remediation` + published-timesheet registry (crypto tip must stay green)  
- Alias redirect smoke  
- Independent browser crawl (same route list as QA §6.1)

### 5.14 Explicit non-goals

- UI Batch 2 redesign; shell IA restructure; module landing redesigns  
- PPA-2 lines/pickers/calcs/approval/recon/export/payment  
- Auth/Postgres; M08; Xero/STP/super/bank files  
- Fixing `published-timesheet-outbox` typecheck inside UI batch (unless OD-A2 expands — **not recommended**)  
- Merging to `main`  
- Rewriting accepted Batch 1–6 evidence  
- Amending independent QA report branch contents beyond citing it

### 5.15 Stop conditions

Stop the corrective implementation lane when:

1. F-MAJ-01 closed under agreed OD-A1 scope;  
2. F-MIN-04 in-app appearance matrix Pass (or code fixed);  
3. All F-PASS-* protected regressions green;  
4. Screenshots + browser matrix captured;  
5. Independent re-verification Pass or QUALIFIED-with-only-deferred-minors per owner list;  

**Or** stop and escalate if owner expands scope into Group B/C.

### 5.16 Estimated execution batches

| Batch | Name | Depends on | Contents |
|---|---|---|---|
| **QC-1 (preferred single batch)** | `cursor/ui-batch1-qualification-completion` from `a1efd47` | OD-A1 decision | F-MAJ-01 narrow chrome + F-MIN-04 verify/fix + tests + screenshots |
| QC-2 (only if needed) | Follow-up flake/harness | QC-1 accepted | F-MIN-01/03 harness only — **optional**; not required for UI acceptance under defaults |

**Preference:** **ONE** narrow corrective batch (QC-1). Do not split unless OD-A1-EXTENDED proves large enough to isolate Command Centre toast inventory from strip chrome.

---

## 6. Group B deferred scope

Unauthorised until Batch 1 owner acceptance (or explicit deferral of remaining Group A items).

| Item | Register / notes |
|---|---|
| Full dashboard / Command Centre Premium Clinical redesign | UI-DASH-01 polish beyond truthfulness; F-DEFER-B01 |
| Shell restructuring / IA changes | Beyond UI-SHELL visual polish |
| Module landing redesigns (M01–M06 bodies, M11, etc.) | UI-MOD-01 depth; F-DEFER-B02 |
| Workflow presentation expansion | Prototype-driven depth |
| Wider visual reconciliation vs prototype | Prototype reference only; not override |
| Broad Command Centre demo-data architecture replacement | Not truthfulness-only chrome |

---

## 7. Group C exclusions

| Exclusion | Why |
|---|---|
| PPA lines / deltas / code-list pickers | PPA-2+ |
| PPA calculation / approval / reconciliation / export / payment UI | Out of PPA-1 |
| Provider returns; Xero production; STP; super; bank files; mark-as-paid | Wave-control |
| M08 doctor pay | Wave-control |
| M09/M15 depth; Wave 1A Auth; Postgres | Separate programmes |
| Prototype fake data as production | Truthfulness |
| Incomplete prototype-only capability | Never treat as implemented |
| `published-timesheet-outbox` typecheck (F-MAJ-02) | Outside UI presentation lane (separate CR) |
| Treating unlock/reopen as PPA | Wave-control |

---

## 8. Route-by-route status

| Route | Status |
|---|---|
| `/dashboard` | **Correction required in Batch 1 completion** (F-MAJ-01 chrome truthfulness); full redesign → Batch 2 |
| Shared shell / nav | **Passed** (re-verify screenshots); polish-only defects → A if introduced |
| `/action-inbox` | **Passed** (Batch 1 shared primitives only; deeper redesign → B) |
| `/settings` (Organisation & Access) | **Passed** |
| `/organisation-access` | **Not applicable** as production route (404 expected); use `/settings` |
| `/staff-doctors` | **Passed** (frozen polish-only; redesign → B) |
| `/roster` (completed M05) | **Passed** (flake F-MIN-03 deferred by default) |
| `/time-attendance` (completed M06) | **Passed** |
| `/staffpay` | **Passed** (protect presentation) |
| `/staffpay?section=overview` | **Passed** (GAP-PAR-003 closed; regress-protect) |
| Each other completed M07 section (approval, export, recon, lock, etc.) | **Passed** for Batch 1 presentation scope — **no behaviour change**; deeper visual redesign → B |
| `/staffpay?section=adjustments` | **Passed** (PPA-1 presentation); capability expansion → **Excluded** |
| `/staffpay?section=history` | **Excluded / planned stub** (UI-M07-04) — do not fake |
| `/doctorpay`, `/bbpip`, inventory depth, etc. | **Excluded** / landing-only honesty |
| Crypto-affected module loads via shell | **Passed** (owner ACCEPTED) |

---

## 9. Proposed file ownership

| Area | Owner files | Batch |
|---|---|---|
| Dashboard chrome truthfulness | `DashboardWorkspace.tsx` (+ optional CC inventory if OD-A1-EXTENDED) | QC-1 |
| Appearance verify/fix | `portal-context` appearance helpers; `tokens.css` only if broken | QC-1 |
| M07 protect | `OverviewSection.tsx`, `AdjustmentsSection.tsx`, `StaffPayWorkspace.tsx` | QC-1 regression |
| Shared primitives protect | `PageHeader`, `Tabs`, `Table`, … | QC-1 regression |
| Evidence | New folder under `docs/audits/` for qualification-completion screenshots (name at implementation time) | QC-1 |
| Plans | **This file only** on planning branch | This lane |
| Independent QA report | Read-only on `cursor/browser-crypto-ui-batch1-independent-qa` | Untouched |
| Register | Read-only on `cursor/hcdp-owner-ui-decision-register` @ `a4d9d3b` | Untouched |

---

## 10. Test plan

| Layer | Command / focus | Gate |
|---|---|---|
| Unit/presentation | `npx tsx --test src/modules/m07-staff-pay/tests/m07-ui-batch1-presentation.test.ts` + new qualification tests | Must Pass |
| M07 shell | `m07-shell.test.ts` | Must Pass |
| Crypto protect | `browser-crypto-remediation.test.ts` + published-timesheet registry | Must Pass |
| M07 regression | `npm run test:m07` (preferred) | Must Pass before owner accept |
| PPA-1 UI | `m07-ppa1-ui.test.tsx` (+ integration if Adjustments touched) | Must Pass |
| Browser | Independent crawl script pattern from QA (routes §6.1) | Must Pass focused crypto+UI console gates |
| Typecheck | Record `tsc` pre-existing failures; **do not** treat F-MAJ-02 as UI fail unless OD-A2 says so | Informational |

---

## 11. Browser and screenshot matrix

| Route | 1440 | 390 | Light | Dark (in-app) | Notes |
|---|---|---|---|---|---|
| `/dashboard` | Y | Y | Y | Y | Pre/post F-MAJ-01 |
| Shell/nav | Y | Y | Y | optional | Hamburger at 390 |
| `/action-inbox` | Y | spot | spot | — | Regression |
| `/settings` | Y | spot | spot | — | Not `/organisation-access` |
| `/staff-doctors` | spot | spot | — | — | Regression |
| `/roster` | spot | spot | — | — | Ignore networkidle flake |
| `/time-attendance` | spot | spot | — | — | Regression |
| `/staffpay` overview | Y | Y | Y | Y | Copy + tokens |
| `/staffpay` adjustments | Y | Y | Y | Y | PPA-1 states |

Also capture machine-readable validation JSON for the completion evidence folder.

---

## 12. Accessibility matrix

| Check | Surfaces | Pass criteria |
|---|---|---|
| Focus-visible | Dashboard (post-change), StaffPay, Adjustments, shared Tabs | Visible 2px ring |
| Labels | M07 create period; Adjustments create/cancel | `htmlFor` / aria |
| Status roles | Overview foundation chip; Adjustments status; errors | `role="status"` / `alert` |
| Reduced motion | Global | No essential info only in motion |
| Keyboard | Primary CTAs | Reachable without hover-only |
| Landmarks | All crawled | `nav` + `main` |

---

## 13. Appearance-mode matrix

| Mode | How to apply | Routes | Pass criteria |
|---|---|---|---|
| Light | In-app selector | dashboard, staffpay, adjustments | PCE light canvas `#FBFBFA` family visible; champagne restrained |
| Dark | In-app selector → `body.theme-dark` | same | Dark PCE tokens applied; text AA; status not colour-only |
| System | In-app system + OS toggle spot check | dashboard | Follows system without wiping M07 section state |
| OS `colorScheme` only | QA note | — | **Insufficient alone** (F-MIN-04); must not be sole evidence |

---

## 14. Regression plan

1. Re-run crypto vector + barrel/static absence checks on implementation tip.  
2. Re-run M07 + PPA-1 UI suites.  
3. Re-run Batch 1 presentation tests.  
4. Browser route matrix + overflow matrix.  
5. Confirm Overview string still matches UI-M07-05 intent.  
6. Confirm no Group C controls appeared.  
7. Do **not** mutate Wave 5 evidence JSON; discard test side-effects.

---

## 15. Risk and boundary controls

| Risk | Control |
|---|---|
| Scope creep into Command Centre redesign | OD-A1 default NARROW; Group B stop |
| Domain/payroll behaviour change | Presentation-only diffs; full `test:m07` |
| Crypto tip regression | Base exactly `a1efd47`; run crypto suites |
| Overwriting QA evidence | New evidence folder; leave `browser-crypto-ui-batch1-independent-qa/` intact |
| Accidental main merge | No merge authority in QC-1 |
| Misclassifying missing business capability as UI defect | Group C table mandatory in PR description |
| Treating unlock as PPA | Copy audit on Adjustments |

---

## 16. Owner decisions required

| ID | Question | Default if silent | Blocks QC-1 start? |
|---|---|---|---|
| **OD-A1** | F-MAJ-01 scope: NARROW (`DashboardShellStrip` only) vs EXTENDED (+ Command Centre toast-success inventory)? | **NARROW** | Prefer decide before coding |
| **OD-A2** | Does F-MAJ-02 outbox typecheck block UI Batch 1 owner acceptance? | **No** — separate CR | No |
| **OD-MIN-01** | Defer dashboard first-load 500 flake (harness)? | **Defer** | No |
| **OD-MIN-02** | Accept `/organisation-access` 404 as non-defect? | **Accept** | No |
| **OD-MIN-03** | Defer roster networkidle flake? | **Defer** | No |
| **OD-MIN-04** | Require in-app appearance evidence (not OS-only)? | **Yes — required** | Yes for acceptance gate |
| **OD-MIN-05** | Defer cosmetic mobile label truncation if tasks complete? | **Defer cosmetic** | No unless task-blocking |
| **OD-DEFER** | Any Group A item explicitly deferred with justification to allow Batch 1 accept without fix? | None by default (F-MAJ-01 must close) | If used, document per finding |
| Register U-01…U-05 | Font / champagne density / main merge timing / etc. | Register defaults stand | No for QC-1 |

**May Minor findings be deferred?**  
**Yes — only with explicit owner decision per finding** (defaults above). **Major F-MAJ-01 may not be silently deferred**; use OD-DEFER with written justification if owner chooses waiver.

---

## 17. Recommended implementation base and branch

| Item | Recommendation |
|---|---|
| Future implementation base | **`a1efd472ea086d98e82b6ca60da8b9071b1808e2`** (`cursor/browser-crypto-remediation`) |
| Future corrective branch name | **`cursor/ui-batch1-qualification-completion`** — **do not create in this planning run** |
| Planning branch (this doc) | `cursor/ui-batch1-qualification-plan` @ from `a4350c9` |
| Branches remain untouched | `cursor/completed-ui-reconciliation`, `cursor/browser-crypto-remediation`, `cursor/browser-crypto-ui-batch1-independent-qa`, `cursor/hcdp-owner-ui-decision-register`, `main`, all PPA implementation branches |
| Register availability | Read-only via `git show a4d9d3b:docs/specifications/HCDP_OWNER_UI_DECISION_REGISTER.md` — **do not merge** register branch to implement |
| QA report availability | Read-only on independent-QA branch / planning base — **evidence-only; do not merge for code** |
| Corrective PR base | Open from crypto tip; cite this plan + QA report SHAs; no main merge without separate owner process |

---

## 18. Owner-acceptance gate (UI Batch 1)

Owner may accept UI Batch 1 when **all** minima hold:

1. **Crypto** remains ACCEPTED at `a1efd47` (or linear successor that preserves crypto gates).  
2. **F-MAJ-01** closed under OD-A1 (or explicitly deferred via OD-DEFER with justification).  
3. **F-MIN-04** in-app appearance matrix Pass.  
4. **F-PASS-M07-05** Overview copy still truthful (GAP-PAR-003).  
5. **PPA-1** presentation still truthful; no Group C controls added.  
6. **Responsive** overflow Pass on required widths for in-scope routes.  
7. **A11y** criteria §5.7 Pass on touched surfaces.  
8. **Regression suites** §5.13 green.  
9. **Screenshot + browser evidence** for completion batch filed (new folder; prior QA preserved).  
10. **Independent re-verification** §19 Pass (or QUALIFIED only for owner-deferred Minors).  
11. **UI Batch 2** still not started unless separately authorised.  
12. **No claim** of production approval, certification, or payment readiness.

Deferred Minors (per OD-MIN-*) must be listed on the acceptance record.

---

## 19. Independent re-verification gate

After QC-1 lands (on its own branch; unmerged):

| Check | Requirement |
|---|---|
| Ancestry | Corrective tip ancestors include `a1efd47` |
| Diff scope | Presentation/truthfulness only; no domain/payroll/crypto algorithm drift |
| Crypto vector | Exact match preserved |
| Finding closure | F-MAJ-01, F-MIN-04 evidenced closed |
| Browser | Routes 200; no `node:crypto` overlay; overflow matrix |
| Appearance | In-app light/dark screenshots |
| Report | New independent verification note (docs-only branch) recommended before owner accept |
| Merge | Still owner-gated; QA branch remains evidence-only |

---

## 20. Stop checkpoint

| Item | Status |
|---|---|
| Planning base | `a4350c942aa2ce6987c62e9c348354900dfab712` |
| Lineage verified | `c8c9995 → 834cf22 → a1efd47 → a4350c9` |
| Candidates on main | **No** |
| Plan file | **This document only** |
| Production code changed | **No** (planning lane) |
| Findings repaired | **No** |
| Corrective branch created | **No** |
| UI Batch 2 started | **No** |
| Merges | **None** |
| Next authorised step | Owner confirms OD-A1/OD-A2/OD-MIN-* → implement QC-1 on new branch from `a1efd47` |

---

*End of plan.*

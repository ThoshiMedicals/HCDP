# HCDP Parallel Agent Operating Plan

**Document type:** Parallel-development control / repository readiness
**Created:** 30 July 2026
**Pinned baseline HEAD:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`
**Expected prompt baseline (superseded):** `79e6b10dc247fd0593e4fbc71565c237abba865a`
**Branch for this readiness pack:** `agent/parallel-controller-readiness-20260730`
**Status:** Documentation only -- does **not** authorise PPA, M08, payment, or any new module feature

**Companion documents:**

- `docs/plans/HCDP_PARALLEL_AGENT_FILE_OWNERSHIP_MATRIX.md`
- `docs/templates/HCDP_CURSOR_AGENT_COMPLETION_REPORT.md`
- `docs/templates/HCDP_PARALLEL_PR_CHECKLIST.md`

**Controlling sources (read-only for agents unless expressly authorised):**

- `.cursor/rules/hcdp-wave-control.mdc`
- `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`
- `docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md`
- `docs/plans/WAVE6_M07_PPA_IMPLEMENTATION_PLAN.md` (planning only -- not implementation authority)
- `docs/audits/WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md` (Batch 6 owner acceptance)
- `package.json`

---

## 0. Baseline difference note

At prompt preparation the expected `main` tip was `79e6b10dc247fd0593e4fbc71565c237abba865a` (`docs(wave): update wave-control rule for Batch 6 closure and PPA`).

After mandatory `git fetch` / `pull --ff-only`, repository `main` / `origin/main` was:

| Field | Value |
|---|---|
| Actual HEAD | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Ahead/behind vs `origin/main` | `0/0` |
| Working tree | Clean |
| Delta since expected | One commit: `0afe878` -- `docs(m07): add PPA prior-period adjustment implementation plan` adding `docs/plans/WAVE6_M07_PPA_IMPLEMENTATION_PLAN.md` |

**Rule:** All parallel agents pin to the **newer** verified `main` tip (`0afe878...`) unless the Parallel Development Controller re-pins after a later owner-accepted merge.

---

## 1. Purpose

Enable safe Cursor multi-agent / multi-worktree development on ThoshiMedicals/HCDP without:

- colliding edits,
- silent `main` mutation,
- frozen-wave regression,
- unauthorised PPA / payment / M08 work,
- false production-approval claims.

This pack is **repository readiness and operating protocol only**.

---

## 2. One-authorised-batch-at-a-time rule

1. The owner (or Parallel Development Controller acting on explicit owner instruction) names **exactly one** authorised batch or defect/CR scope.
2. No agent may start a second authorised batch until:
   - evidence for the current batch is complete,
   - independent QA has run (or is explicitly waived by owner with recorded reason),
   - owner acceptance (or reject/rework) is recorded,
   - merge to `main` (if any) is complete and the new pinned baseline is published.
3. Planning documents (PPA readiness, PPA implementation plan, this pack) are **not** batch authorisation.
4. Parallel agents may split **within** one authorised batch only when the File Ownership Matrix assigns non-overlapping paths and an Integration Agent owns hotspots.

**Current authorised product scope:** none for new M07/PPA/M08 features. Ordinary M07 Batches 1-6 are closed. PPA remains planning-only.

---

## 3. Pinned-baseline rule

Before any agent starts work:

1. `git fetch origin`
2. Confirm Controller-published pin equals `origin/main` (or the named accepted commit).
3. Create agent branch/worktree **from that pin only**.
4. Record pin SHA in the agent prompt, completion report, and PR body.
5. If `origin/main` moved, **stop**, notify Controller, do not rebase/merge silently onto a newer tip without a re-pin decision.

**Current pin:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`

---

## 4. Branch and worktree naming

| Role | Branch pattern | Worktree folder pattern |
|---|---|---|
| Controller / readiness | `agent/parallel-controller-<topic>-YYYYMMDD` | optional `../hcdp-wt-controller-<topic>` |
| Feature / batch slice | `agent/<batch-id>/<slice>-YYYYMMDD` | `../hcdp-wt-<batch-id>-<slice>` |
| Integration | `agent/<batch-id>/integration-YYYYMMDD` | `../hcdp-wt-<batch-id>-integration` |
| Independent QA | `agent/<batch-id>/qa-YYYYMMDD` | `../hcdp-wt-<batch-id>-qa` (read-mostly) |
| Hotfix / defect | `agent/hotfix/<id>-YYYYMMDD` | `../hcdp-wt-hotfix-<id>` |

Rules:

- Never commit on `main`.
- Never push `--force` to `main` / `master`.
- Prefer one worktree per agent; do not share a dirty worktree across agents.
- Branch names must encode batch id when a batch is authorised (e.g. `agent/ppa-1/foundation-ui-20260730` only after PPA-1 is expressly authorised).

---

## 5. No direct main changes

| Allowed on `main` | Forbidden on `main` |
|---|---|
| Fast-forward merges via reviewed PR after owner acceptance | Direct commits |
| Controller re-pin announcements after merge | Force-push |
| Documentation merges that owner expressly routes to `main` | Agent "quick fixes" |

Agents:

1. Branch from pin.
2. Push feature branch only.
3. Open PR to `main`.
4. Do **not** merge unless the owner/Controller expressly instructs merge after gates pass.

---

## 6. Integration-agent-only hotspot files

Only the **Integration Agent** (or Controller on a dedicated integration branch) may edit the following hotspots. Feature agents must stop and request Integration ownership if their slice requires a change here.

See matrix for full list. Critical hotspots:

| Path | Reason |
|---|---|
| `package.json` / `package-lock.json` | Scripts, deps, test gates |
| `tsconfig.json` / `next.config.*` / `eslint.config.*` / `postcss.config.*` | Tooling shared by all modules |
| `src/app/**` | Route shell -- thin wiring only |
| `src/platform/module-registry/**` | 24-module register |
| `src/platform/context/**` | Shared clinic/identity |
| `src/platform/contracts/**` | Cross-module platform contracts |
| `src/platform/workforce/**` | Shared workforce contracts/events |
| `src/platform/navigation/**` | Legacy redirects / shell nav |
| `src/platform/storage/**` | Shared storage helpers |
| `src/components/shell/**` | Application chrome |
| `src/lib/modules.ts` / `src/lib/portal-context.tsx` | Compatibility shims |
| `.cursor/rules/hcdp-wave-control.mdc` | Wave-control -- **Controller + owner only**; never by feature agents |
| Accepted `docs/audits/WAVE*_*.md` evidence for closed waves/batches | Immutable history |

Feature agents may **read** hotspots; they may add module-local adapters that *consume* platform contracts without editing the contract files unless Integration owns a coordinated change.

---

## 7. File ownership and collision protocol

1. Before coding, each agent claims paths from `docs/plans/HCDP_PARALLEL_AGENT_FILE_OWNERSHIP_MATRIX.md`.
2. Overlap => re-slice or serialize; do not "hope merge works".
3. If two agents touch the same file:
   - stop both,
   - Integration Agent owns the merge on the integration branch,
   - losers rebase onto integration after Integration commits.
4. Docs under `docs/audits/` for a **new** batch are owned by the Evidence Agent for that batch only; closed Batch 1-6 / Wave 1A-5 evidence is **read-only**.
5. Collision severity:
   - **Hard stop:** any hotspot, permissions matrices already accepted, frozen module SoT, storage key migrations that rewrite history.
   - **Soft:** parallel new test files with distinct names -- Integration merges last.

---

## 8. Dependency and merge order

Default merge order for an authorised batch with parallel slices:

```text
1. Domain/types + storage keys (additive only)
2. Services / repository (module-local)
3. Adapters (module-local; consume frozen platform contracts)
4. UI sections/components
5. Tests for slices 1-4
6. Integration branch: hotspots + cross-slice wiring
7. Evidence docs (new batch only)
8. Independent QA branch review / verification commits (docs only unless defect CR)
9. Owner acceptance
10. Merge integration (or single PR) to main -> Controller re-pins
```

Do not merge UI before domain contracts it depends on. Do not merge export/payment-adjacent work before approval/lock gates for that batch. Do not start dependent batch N+1 before owner acceptance of batch N.

**Frozen dependency rule:** M04/M05/M06/M11 remain frozen. M07 may consume published contracts (`TimesheetRef`, readiness, person refs) via adapters only -- no cross-module repository imports.

---

## 9. Scoped and full test gates

Use scripts from `package.json`:

| Gate | When | Command |
|---|---|---|
| Scoped module | Feature slice in one module | matching `npm run test:m04` / `test:m05` / `test:m06` / `test:m07` / `test:m11` / `test:workforce` / `test:auth` |
| Focused file | During TDD | `npx tsx --test path/to/*.test.ts` (record exact paths) |
| Full family | Integration PR / pre-owner | `npm test` |
| Lint | Integration / QA | `npm run lint` |
| Build | Integration / QA / owner gate | `npm run build` |
| Platform QA | When shell/integration touched | `npm run test:platform-qa` |
| Wave evidence scripts | Only if authorised regression | `npm run test:wave2-evidence` ... `test:wave5-evidence` |

Rules:

- Green scoped tests are **not** sufficient for merge when hotspots or cross-module contracts changed -- run full `npm test` + build.
- Do not claim "full repo healthy" if known pre-existing TS/M06 outbox debt remains; record as qualification (Batch 6 precedent).
- New batch evidence must cite exact commands and pass counts.

---

## 10. Browser / responsive / permission / storage evidence gates

Per controlling plan section 1 and wave completion requirements, every owner-facing batch PR must include evidence of:

| Gate | Minimum |
|---|---|
| Browser workflow | Primary authorised journeys exercised in real UI (Playwright scripts under `scripts/` or manual recorded steps) |
| Responsive | Widths **1440, 1280, 1024, 768, 430, 390**; no horizontal page overflow (`overflow-x = 0`) on touched surfaces |
| Permission | Role/SoD matrix for new or changed actions; deny paths verified |
| Storage | Keys under correct `pulse.mXX.*` prefix; repository-mediated writes; no component direct `localStorage` writes; migrations idempotent and **non-rewriting** of accepted history |
| Regression | Frozen waves/modules smoke as specified by Controller for that batch |

Absence of these gates => PR checklist fails => no owner acceptance.

---

## 11. Independent QA rule

1. The agent that implemented a slice **must not** be the sole QA signer for that slice.
2. Independent QA uses a separate branch/worktree from the pin or from the integration tip.
3. QA may add **evidence/doc** commits and failing reproduction tests; production fixes return to the owning feature/Integration agent unless owner authorises QA hotfix.
4. QA records results in the completion report template and PR checklist.
5. "Build passed" alone is never completion.

---

## 12. Owner acceptance stop gate

After Integration + Independent QA:

1. Produce completion report (`docs/templates/HCDP_CURSOR_AGENT_COMPLETION_REPORT.md`).
2. Attach PR checklist (`docs/templates/HCDP_PARALLEL_PR_CHECKLIST.md`).
3. **Stop.** Do not start the next batch.
4. Wait for explicit owner accept / accept-with-qualifications / reject.
5. Only then merge (if instructed) and Controllers re-pin.

Owner acceptance of a batch is **not** production approval, certification, payment readiness, or statutory/monetary correctness unless the owner separately states that (Batch 6 precedent).

---

## 13. Frozen-wave protections

| Scope | State | Agent duty |
|---|---|---|
| Waves 1A-5 (M04/M05/M06/M11 + auth/foundation) | Owner accepted and frozen | No edits without documented defect/CR, impact analysis, focused regression, owner review |
| Wave 6 M07 Batches 1-6 | Owner accepted and closed (3-4, 6 with qualifications) | Do not alter ordinary prep behaviour without defect/CR + owner review; do not rewrite accepted evidence |
| `BLOCKED-M07` | Cleared by Batch 2 | Do not re-introduce as active M07 intake blocker |
| `BLOCKED-M10` | Remains blocked | Informational; outside M07 totals |
| Platform Baseline V1 / M01-M03 shell contracts | Protected | Integration-only; preserve register, clinic/identity, inbox/summary projections |

M06 publishes `TimesheetRef` / `timesheet.approved`. M06 must not write `pulse.m07.*` except via authorised M07 intake contracts.

---

## 14. PPA planning-only status

- **PPA = Prior-Period Adjustment** (post-lock / post-export correction cycle).
- Authoritative readiness/design: `docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md`.
- Implementation plan exists: `docs/plans/WAVE6_M07_PPA_IMPLEMENTATION_PLAN.md` -- **still not implementation authority**.
- Controlled unlock/reopen != PPA.
- **Do not implement PPA** until the owner expressly authorises a named PPA implementation batch (e.g. PPA-1).

---

## 15. Explicit exclusions

Parallel agents must **not**:

- Implement PPA / prior-period adjustment lifecycle code
- Begin Module 8 (doctor pay) or calculate doctor pay inside M07
- Process payment execution, net-pay disbursement, mark-as-paid
- Generate bank files, STP, or superannuation processing
- Implement payment-provider return processing
- Implement named Xero production integration under M07/PPA scope
- Treat export packages as paid
- Claim award/tax/super/employment-law certification
- Claim production approval or deployment readiness
- Edit `.cursor/rules/hcdp-wave-control.mdc` without Controller + owner
- Edit accepted Batch 1-6 / Wave 1A-5 evidence to rewrite history
- Import another module's `repository/` across boundaries
- Commit directly to `main` or merge without instruction

---

## 16. Agent role catalogue

| Role | Responsibility |
|---|---|
| Parallel Development Controller | Pin baseline; authorise path claims; own wave-control edits; publish merge order; stop/re-pin |
| Feature Agent(s) | Owned non-hotspot paths for one authorised batch slice |
| Integration Agent | Hotspots; cross-slice merge; full test/build gates |
| Evidence Agent | New batch audit/docs only |
| Independent QA Agent | Separate verification; checklist; no sole self-accept |

---

## 17. Required agent start checklist

```text
[ ] Read hcdp-wave-control.mdc
[ ] Confirm pinned baseline SHA
[ ] Confirm named authorised batch (or stop if none)
[ ] Confirm exclusions (PPA/payment/M08/...)
[ ] Claim paths from ownership matrix
[ ] Create named branch/worktree from pin
[ ] No commits on main
[ ] Record pin + branch in completion report draft
```

---

## 18. Stop checkpoint (this readiness task)

1. Parallel operating plan + ownership matrix + templates created.
2. No production source changed.
3. No accepted evidence rewritten.
4. Wave-control rule not edited.
5. No PPA/M08/payment implementation begun.
6. Branch pushed; **not** merged to `main`.
7. Await owner instruction before any parallel feature batch.

---

*End of operating plan.*

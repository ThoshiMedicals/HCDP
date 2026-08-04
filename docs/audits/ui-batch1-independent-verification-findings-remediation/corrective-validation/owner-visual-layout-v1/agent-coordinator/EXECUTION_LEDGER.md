# Owner Visual Layout v1 — Multi-Agent Execution Ledger

**Coordinator role:** Integration Agent (this session)  
**Phase 1 start (UTC):** recorded in `phase1-start.utc`  
**Input branch tip (required):** `f837bdd08e1db30e68c63cfb2542e3120bc40d00`  
**Last application source SHA (prior phase):** `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742`  
**origin/main:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Failed candidate:** `ee9731e38e7d20d6d825e6c243503f4aea9564c3`  
**IV evidence tip:** `51fbfa980b9c834184a384ddcf956340397bf205`  
**Branch:** `cursor/ui-batch1-owner-colour-readability-verification-fixes`  
**Primary worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes`  
**PR status:** none (`gh pr list` → `[]`)  
**Owner server:** PID `55040` PPID `55026` port `3000` (preserve until final handoff)  
**Pre-flight routes on :3000:** dashboard/action-inbox/settings/staffpay → 200  

## Port allocation (non-overlapping; do not use 3000/3480/3481)

| Port | Agent | Purpose |
| ---- | ----- | ------- |
| 3000 | Owner | Preserve; final handoff only |
| 3480 | Prior prod matrix | Do not compete |
| 3481 | Prior next-dev | Do not compete |
| 3490 | Visual QA | Baseline + final visual inspection server |
| 3491 | Work-Step QA | Baseline + final workflow server |
| 3492 | Implementation | Focused developer validation only |
| 3493 | Regression Auditor | Sequential regression / build validation |

## Agent roster

### 1. COORDINATOR / INTEGRATION

- **Task:** Verify refs; ledger; assign isolation; consolidate; control commits/push; no self-IV claim
- **Input SHA:** `f837bdd08e1db30e68c63cfb2542e3120bc40d00`
- **Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes`
- **Permitted writes:** `docs/audits/.../owner-visual-layout-v1/agent-coordinator/**` + evidence consolidation only after QA pass; final git commit/push control
- **Port:** n/a (uses owner :3000 read-only for health)
- **Status:** IN PROGRESS (Phase 1)

### 2. VISUAL QA AGENT

- **Task:** Inspect committed screenshots + rendered screens; file VQA-*; close only own visual findings
- **Input SHA (baseline):** `f837bdd08e1db30e68c63cfb2542e3120bc40d00` (app tree = `e6e2f90` for src)
- **Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes` (read-only on `src/`); evidence write to `agent-visual-qa/`
- **Permitted writes:** `.../owner-visual-layout-v1/agent-visual-qa/**` only
- **Port:** 3490
- **Status:** ASSIGNED Phase 2

### 3. WORK-STEP / FUNCTIONAL QA AGENT

- **Task:** Inventory controls; execute workflows; file WQA-*; close only own functional findings
- **Input SHA (baseline):** `f837bdd08e1db30e68c63cfb2542e3120bc40d00`
- **Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes` (read-only on `src/`); evidence write to `agent-workstep-qa/`
- **Permitted writes:** `.../owner-visual-layout-v1/agent-workstep-qa/**` only
- **Port:** 3491
- **Status:** ASSIGNED Phase 2

### 4. IMPLEMENTATION AGENT

- **Task:** Trace components; propose correction map (Phase 2 read-only); then apply authorised fixes only after Coordinator authorisation
- **Input SHA:** `f837bdd08e1db30e68c63cfb2542e3120bc40d00`
- **Worktree:** `/tmp/hcdp-fix/ui-batch1-vf-fixes` (sole writer of application source after Phase 3 auth)
- **Permitted writes (Phase 2):** `.../owner-visual-layout-v1/agent-implementation/**` only  
- **Permitted writes (Phase 3):** `src/**`, `scripts/**` (validator/tests), authorised test files under `src/components/workspaces/tests/**`
- **Port:** 3492
- **Status:** ASSIGNED Phase 2 (no source edits until authorised)

### 5. REGRESSION AND EVIDENCE AUDITOR

- **Task:** Freeze SHA check; sequential full regression/build suite; evidence completeness audit
- **Input SHA:** final frozen application source SHA (TBD after Phase 3)
- **Worktree:** dedicated checkout at frozen SHA (TBD)
- **Permitted writes:** `.../owner-visual-layout-v1/agent-regression/**` only
- **Port:** 3493
- **Status:** PENDING Phase 4

## File ownership (prevent overlapping writes)

| Path glob | Owner |
| --------- | ----- |
| `src/**`, authorised tests, `scripts/ui-batch1-*.mjs` | Implementation Agent only (Phase 3+) |
| `agent-visual-qa/**` | Visual QA |
| `agent-workstep-qa/**` | Work-Step QA |
| `agent-regression/**` | Regression Auditor |
| `agent-coordinator/**`, consolidated report updates | Coordinator |
| Historical evidence under other corrective-validation dirs | READ-ONLY — do not overwrite |

## Isolation rules

- Do not compete on `.next` of the same worktree for concurrent builds.
- Owner :3000 must remain up until final handoff.
- Source change after QA begins invalidates prior final QA.
- Commits after tested app SHA = evidence/docs only.
- Coordinator must not declare its own implementation independently verified.
- No agent may close findings it did not raise (except Coordinator consolidates status).

## Phase gate log

| Phase | Gate | Status |
| ----- | ---- | ------ |
| 1 Pre-flight | Refs match; clean tree except new evidence dir; :3000 healthy; ledger created | PASS (this file) |
| 2 Baseline | VQA + WQA + Impl maps reconciled | PENDING |
| 3 Implementation | Authorised fixes committed; source freeze | PENDING |
| 4 Final QA | VQA + WQA + Regression on frozen SHA | PENDING |
| 5 Evidence | Docs-only commits; push; :3000 handoff | PENDING |

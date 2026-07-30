# HCDP Test and CI Readiness Audit — 2026-07-30

**Document type:** Audit only (documentation)  
**Auditor role:** Test and CI Readiness Auditor  
**Branch:** `agent/test-ci-readiness-audit-20260730`  
**Baseline pin (origin/main):** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Baseline message:** `docs(m07): add PPA prior-period adjustment implementation plan`  
**Audit date:** 30 July 2026  
**Scope:** Map exact pre-integration checks for future parallel agents. **No** production-code repair. **No** CI workflow files added or changed on this branch.

**Companion (this pack):** `docs/plans/HCDP_PARALLEL_AGENT_TEST_MATRIX.md`  
**Related control pack (sibling branch, not yet on `origin/main` at audit pin):** `agent/parallel-controller-readiness-20260730` @ `92a2438` — operating plan, ownership matrix, PR checklist, completion-report template.

---

## 1. Executive verdict

| Area | Verdict |
|---|---|
| Unit/integration family scripts | Present and mostly green on pin; **M05/M11 performance assertions are environment-sensitive** |
| Wave 2–5 Playwright evidence scripts | Present; require live app + Playwright; **not** wired into CI |
| Wave 6 / M07 evidence | Checkpoint docs + `npm run test:m07` only — **no** `test:wave6-evidence` npm script |
| GitHub Actions / other CI | **Absent** (no `.github/workflows` in repo) |
| `npm run build` | **Fails** on known Batch 6 qualification (M06 outbox TS error) |
| `npx tsc --noEmit` | **14 errors** — matches Batch 6 recorded debt |
| `npm run lint` | **Fails** (1 error + 24 warnings) on current eslint-config-next rules |
| Path-filtered CI opportunity | High — safe if full regression retained on Integration / owner gates |

**Do not treat this audit as production approval, payroll certification, or authorisation to implement PPA / M08 / payment.**

---

## 2. Baseline and freeze context

From `.cursor/rules/hcdp-wave-control.mdc` and Batch 6 owner acceptance:

| Wave / batch | State | Relevance to CI |
|---|---|---|
| Waves 1A–5 (auth, M04, M11, M05, M06) | Owner accepted and frozen | Scoped + frozen-wave regression required on touch |
| Wave 6 M07 Batches 1–6 | Owner accepted and closed (3–4, 6 with qualifications) | `test:m07` is the ordinary-prep gate; do not rewrite accepted evidence |
| Batch 6 accepted technical target | `ce1f4af68917c9988efff327d521d94b8289f2fc` | Full M07 **221** pass recorded |
| Batch 6 owner-acceptance evidence commit | `ad54aed94b0c798d3f26fe66bf811d6e3b083151` | Qualifications retained |
| PPA | Planning only | No PPA test suite authorised |
| `BLOCKED-M10` | Remains blocked | Informational; not a fail of M05 totals |
| `BLOCKED-M07` | Cleared (`CLEARED-M07-BATCH2`) | Must stay cleared in M06/M07 boundary tests |

### Batch 6 retained qualifications (CI must not “fix away”)

1. Export-profile impact via authoritative export-batch references  
2. Live export-profile protection is mutation-side (not profile-version pinning)  
3. Download may occur before optional period lock  
4. Locked-source audit + M02 controls are non-transactional  
5. Unlock idempotency nuance vs approval-stale reassertion  
6. Open-period profile creation / LE seed behaviour qualified  
7. **Fourteen pre-existing TypeScript errors** (unrelated debt)  
8. **M06 `published-timesheet-outbox.ts:235` build failure** (unrelated debt)

Source: `docs/audits/WAVE6_BATCH6_CHECKPOINT_6_5_6_6_EVIDENCE.md`.

---

## 3. npm scripts inventory (`package.json`)

| Script | Command | Category | CI recommendation |
|---|---|---|---|
| `dev` | `next dev --webpack` | Local only | Never required for merge |
| `build` | `next build` | Production build | **Advisory until TS/outbox debt fixed** (currently red) |
| `start` | `next start` | Runtime for evidence | Required before Playwright evidence scripts |
| `lint` | `eslint .` | Static analysis | **Advisory until lint debt stabilised** (currently red) |
| `test:workforce` | `tsx --test src/platform/workforce/tests/**/*.test.ts` | Unit | Required scoped when workforce touched |
| `test:auth` | `tsx --test src/platform/auth/tests/**/*.test.ts` | Unit | Required scoped when auth touched |
| `test:m04` | `tsx --test src/modules/m04-staff-doctors/tests/**/*.test.ts` | Unit | Required scoped when M04 touched |
| `test:m11` | `tsx --test src/modules/m11-training/tests/**/*.test.ts` | Unit (+ perf) | Required scoped; **perf subset advisory** |
| `test:m05` | `tsx --test src/modules/m05-roster/tests/**/*.test.ts` | Unit (+ perf) | Required scoped; **perf subset advisory** |
| `test:m06` | `tsx --test src/modules/m06-time-attendance/tests/**/*.test.ts` | Unit | Required scoped when M06 touched |
| `test:m07` | `tsx --test src/modules/m07-staff-pay/tests/**/*.test.ts` | Unit | Required scoped when M07 touched |
| `test` | Chains workforce → auth → m04 → m11 → m05 → m06 → m07 | Full family | Required Integration / pre-owner; see flaky note |
| `test:platform-qa` | `node scripts/platform-integration-qa.mjs` | HTTP harness | Required when shell/routes/platform touched; needs running server |
| `test:wave2-evidence` | `node scripts/wave2-m04-acceptance-evidence.mjs` | Playwright | Owner-acceptance / authorised frozen regression only |
| `test:wave3-evidence` | `node scripts/wave3-m11-acceptance-evidence.mjs` | Playwright | Same |
| `test:wave4-evidence` | `node scripts/wave4-m05-acceptance-evidence.mjs` | Playwright | Same (`SKIP_BROWSER=1` records skip, never pass) |
| `test:wave5-evidence` | `node scripts/wave5-m06-acceptance-evidence.mjs` | Playwright | Same (`SKIP_BROWSER=1` supported) |

### Scripts present on disk but **not** in `package.json`

| Path | Purpose | Gap |
|---|---|---|
| `scripts/wave2-m04-browser-evidence.mjs` | Extra M04 browser matrix | No npm alias |
| `scripts/wave5-m06-performance-evidence.mjs` | M06 perf evidence | No npm alias (also covered inside `test:m06` perf test) |
| `scripts/platform-integration-browser-qa.mjs` | Interactive browser QA notes | Prerequisite for some platform-qa notes path; no npm alias |
| `scripts/m1-*.mjs` | Module 1 / Command Centre probes | Outside workforce parallel programme unless named |
| Wave 6 Playwright runner | — | **Missing** — Batch 6 relied on unit tests + checkpoint docs (+ limited shell a11y JSON) |

---

## 4. Unit / domain suite map

| Suite | Path | Files | Audit run (pin `0afe878`) | Historical accepted evidence |
|---|---|---:|---|---|
| workforce | `src/platform/workforce/tests/` | 4 | **45 pass / 0 fail** | Batch 3 regression recorded 45 |
| auth | `src/platform/auth/tests/` | 1 | **16 pass / 0 fail** | Wave 1A / Wave 2 |
| m04 | `src/modules/m04-staff-doctors/tests/` | 1 | **16 pass / 0 fail** | Wave 2 |
| m11 | `src/modules/m11-training/tests/` | 3 | **35 pass / 2 fail** | Wave 3 / Batch 3: 37/0 |
| m05 | `src/modules/m05-roster/tests/` | 13 | **115 pass / 2 fail** | Wave 4: 117 functional; Batch 3: 117/0 |
| m06 | `src/modules/m06-time-attendance/tests/` | 12 | **83 pass / 0 fail** | Wave 5 reported 64/64 at freeze; suite grew to 83 |
| m07 | `src/modules/m07-staff-pay/tests/` | 25 | **221 pass / 0 fail** | Batch 6 accepted **221** |

### Failure detail (this audit machine — environment-sensitive)

| Suite | Failing tests | Classification |
|---|---|---|
| m11 | `readiness one ≤100ms and batch 200 ≤3s` (measured ~3672ms > 3000ms); cascading `writes evidence json` | **Flaky / machine-load performance** — must remain **advisory** in CI until isolated or budgeted |
| m05 | `bulk preview/submission ≤500 ops` (submission ~5944ms > 5000ms); cascading evidence write | Same |

Functional suites outside `*-performance.test.ts` were green in this audit for m05/m11 when those perf cases are excluded conceptually; agents must record which subset they ran.

---

## 5. Platform integration QA

| Item | Detail |
|---|---|
| Script | `npm run test:platform-qa` → `scripts/platform-integration-qa.mjs` |
| Browser companion | `scripts/platform-integration-browser-qa.mjs` (Playwright; writes notes JSON) |
| Last committed report | `docs/audits/PLATFORM_INTEGRATION_QA.md` — **152 pass / 0 fail** @ commit `03a0bef` (Wave 2 era stamp; Wave 5 completion also cites 152/152) |
| Runtime needs | App at `QA_BASE` / `http://localhost:3000` |
| Path quirk | Harness resolves evidence output to **parent of repo root** (`path.resolve(ROOT, "..")/docs/audits/...`). In the standard clone (`Development folder` = git root), this writes **outside** the git repo unless paths are corrected in a future authorised Integration change. |
| Redirect expectations | Script expects Wave 5 M06 section ids (`clock`); older committed MD rows still show pre-Wave-5 aliases in places — treat committed MD as historical unless re-run |

**Required when:** `src/app/**`, shell, navigation, legacy redirects, or platform register routes change.  
**Not sufficient alone** for module domain acceptance.

---

## 6. Playwright / browser / responsive / theme

| Capability | Status |
|---|---|
| `playwright` dependency | Present (`^1.49.0`) |
| `playwright.config.*` | **Absent** |
| Dedicated `e2e/` suite | **Absent** |
| Responsive widths | Scripts enforce **1440, 1280, 1024, 768, 430, 390** |
| Theme / appearance | Wave 4/5 scripts assert light / dark / system + `theme-dark` persistence |
| Overflow gate | Page-level horizontal overflow must be ~0 on touched surfaces |
| CI automation | **None** — local / agent-run only |

M07 shell responsive/a11y smoke is partially covered in unit tests (`m07-shell.test.ts`) and `docs/audits/wave6-m07-batch1-shell-a11y-evidence.json`. Full Wave-style Playwright matrix for M07 Batches 2–6 is **not** packaged as an npm script.

---

## 7. Evidence scripts by wave

| Wave | npm script | Runner(s) | Artifacts under `docs/audits/` | Owner-acceptance use |
|---|---|---|---|---|
| 2 M04 | `test:wave2-evidence` | `wave2-m04-acceptance-evidence.mjs` (+ optional `wave2-m04-browser-evidence.mjs`) | `wave2-m04-*-evidence.json`, completion/checkpoint MD | Yes — frozen regression only with Controller/owner authority |
| 3 M11 | `test:wave3-evidence` | `wave3-m11-acceptance-evidence.mjs` | `wave3-m11-*-evidence.json` | Same |
| 4 M05 | `test:wave4-evidence` | `wave4-m05-acceptance-evidence.mjs` | `wave4-m05-*-evidence.json` | Same; `SKIP_BROWSER=1` ≠ pass |
| 5 M06 | `test:wave5-evidence` | `wave5-m06-acceptance-evidence.mjs` (+ `wave5-m06-performance-evidence.mjs`) | `wave5-m06-*-evidence.json` | Same |
| 6 M07 | **None** | Unit suites + checkpoint MD (`WAVE6_BATCH*_*.md`) | Batch checkpoint / traceability MD; batch1 shell JSON | New M07 batches need **new** evidence docs only — do not rewrite Batch 1–6 |

---

## 8. Build, lint, TypeScript — current pin evidence

Commands run on audit branch from pin `0afe878` (30 July 2026):

| Gate | Result | Notes |
|---|---|---|
| `npm run test:workforce` | PASS 45/45 | |
| `npm run test:auth` | PASS 16/16 | Console invitation logs expected |
| `npm run test:m04` | PASS 16/16 | |
| `npm run test:m11` | FAIL 35/37 | Perf budget overrun |
| `npm run test:m05` | FAIL 115/117 | Perf budget overrun |
| `npm run test:m06` | PASS 83/83 | |
| `npm run test:m07` | PASS 221/221 | Matches Batch 6 accepted count |
| `npx tsc --noEmit` | FAIL **14** errors | Matches Batch 6 qualification count |
| `npm run build` | FAIL | First hard stop: `published-timesheet-outbox.ts:235` (`code`/`message` on `PublishFromOutboxResult`) |
| `npm run lint` | FAIL | **1 error**, **24 warnings** (see below) |

### TypeScript error inventory (14)

- Production: `m06 .../published-timesheet-outbox.ts:235` (×2 properties)  
- Tests: `m06-published-timesheet.test.ts` (unused `@ts-expect-error`, `timesheetId` props)  
- Tests: `m07-batch2-final-gate-cp27.test.ts` (`latestApprovalRevision`)  
- Tests: `published-timesheet-registry.test.ts` (unused directive + content typing + `never`)

### Lint (advisory)

- **Error:** `src/modules/m07-staff-pay/context.tsx` — `react-hooks/set-state-in-effect` (bootstrap `setState` in `useEffect`)  
- **Warnings:** multiple `react-hooks/exhaustive-deps` (notably M06 sections) + other hooks warnings (24 total)  
- First lint attempt also hit a transient `ENOENT` on a missing `.tmp-fix-mojibake.js` (not present on disk) — treat as **environment flake** if CI globs temp files; recommend ignoring `.tmp*` in eslint config in a future Integration PR.

**Classification:** lint + build + full `tsc` are **advisory merge blockers** until owner authorises a dedicated stabilisation / debt-clearance batch. Do **not** silently “fix” inside unrelated feature branches.

---

## 9. Missing branch-level checks (gaps)

| Gap | Risk | Proposed handling |
|---|---|---|
| No `.github/workflows` | Agents can merge with no automated gate | Add proposed workflows (examples in matrix doc) after owner decisions |
| `npm test` includes flaky perf | Full-family job false-fails | Split perf jobs; keep functional required |
| No Wave 6 browser npm script | UI regressions on Staff Pay shell under-tested in automation | Future authorised Evidence agent adds `test:wave6-evidence` **without** rewriting Batch 1–6 docs |
| Platform QA writes outside git root | Evidence lost / wrong tree | Integration fix of output paths (authorised) |
| No path filters | Every agent pays full cost or skips checks | Path-filtered required jobs + Integration full suite |
| No `git diff --check` automation | Whitespace/conflict markers | Add to PR checklist job |
| Build red on main tip | Cannot use “build must pass” as hard gate yet | Keep advisory; record against Batch 6 quals |
| No CI Playwright browsers install | Even if workflows added, evidence scripts need chromium | Separate optional workflow with browser cache |

---

## 10. Classification legend (for all agents)

| Class | Meaning |
|---|---|
| **Current passing evidence** | Green on this audit pin **or** recorded in owner-accepted wave/batch docs |
| **Known failures / debt** | Documented red items; do not “fix” out of scope |
| **Required scoped checks** | Must run before Integration accepts a feature slice |
| **Required integration checks** | Must run before owner-acceptance request |
| **Required owner-acceptance evidence** | Browser/responsive/permission/storage + completion report + PR checklist |
| **Advisory until stabilised** | Report results; may not block merge unless owner hardens the gate |

---

## 11. Opportunities for path-filtered CI (without weakening full regression)

Recommended pattern:

1. **PR path filters** run only the scoped `test:*` jobs matching changed trees.  
2. **Integration branch / `main` protection** always runs full functional family (perf excluded or advisory).  
3. **Hotspot paths** (`src/app/**`, `src/platform/**`, `package.json`, shell) force `test:platform-qa` + full functional `npm test` (minus advisory perf) + lint/build **as advisory annotations**.  
4. **Frozen-wave paths** (`m04`/`m05`/`m06`/`m11`) require scoped suite + Controller-specified regression evidence — never “docs-only” if `src/**` changed.  
5. **Evidence Playwright** remains manual/scheduled or `workflow_dispatch` until flake budget is known.

Exact YAML examples and owner decision list: `docs/plans/HCDP_PARALLEL_AGENT_TEST_MATRIX.md`.

---

## 12. Explicit non-actions of this audit

- No production code changes  
- No eslintignore / outbox / TS debt fixes  
- No `.github/workflows` added  
- No merge to `main`  
- No PPA / M08 / payment work  

---

## 13. Stop

Audit complete for pin `0afe878`. Parallel agents must follow `docs/plans/HCDP_PARALLEL_AGENT_TEST_MATRIX.md` before Integration and before owner acceptance.


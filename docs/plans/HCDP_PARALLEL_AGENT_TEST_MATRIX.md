# HCDP Parallel Agent Test Matrix

**Document type:** Operating plan — exact pre-integration checks  
**Created:** 30 July 2026  
**Audit source:** `docs/audits/HCDP_TEST_AND_CI_READINESS_AUDIT_20260730.md`  
**Pinned baseline:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` (`origin/main`)  
**Status:** Documentation only — does **not** authorise feature work, PPA, M08, payment, or CI merge without owner decisions below  

**Related (sibling readiness pack, may land separately):**  
`agent/parallel-controller-readiness-20260730` — operating plan, file ownership matrix, PR checklist, completion-report template.

---

## How to use

1. Identify agent role + paths touched.  
2. Run **Required scoped** commands; paste pass/fail counts into the completion report.  
3. Before asking Integration to absorb the branch: satisfy **Integration checks**.  
4. Before owner acceptance: satisfy **Owner-acceptance evidence**.  
5. Treat **Advisory** results as recorded qualifications — do not claim “full repo healthy” while Batch 6 build/TS debt remains.

---

## Legend

| Tag | Meaning |
|---|---|
| R-SCOPED | Required before Integration accepts the slice |
| R-INT | Required on Integration branch / pre-owner gate |
| R-OWNER | Required for owner-acceptance evidence pack |
| ADV | Advisory until stabilised — report, do not silently ignore |
| DEBT | Known pre-existing failure — cite Batch 6 / this audit; do not “fix” out of scope |
| N/A | Not applicable for that agent role |

---

## 0. Universal preflight (every agent)

```text
git fetch origin
git rev-parse HEAD   # must equal Controller pin (currently 0afe878… unless re-pinned)
git status -sb       # clean relative to claimed scope
git diff --check
```

Record pin SHA in prompt, completion report, and PR body.

---

## 1. Matrix by agent role

### 1.1 Feature Agent — single module slice

| If you touch… | R-SCOPED | Also when contracts/hotspots touched |
|---|---|---|
| `src/platform/workforce/**` | `npm run test:workforce` | Escalate to Integration + R-INT |
| `src/platform/auth/**` | `npm run test:auth` | Frozen Wave 1A — defect/CR + owner review first |
| `src/modules/m04-staff-doctors/**` | `npm run test:m04` | Frozen — defect/CR path only |
| `src/modules/m11-training/**` | `npm run test:m11` | Frozen; **perf fails = ADV/DEBT** |
| `src/modules/m05-roster/**` | `npm run test:m05` | Frozen; **perf fails = ADV/DEBT**; `BLOCKED-M10` informational |
| `src/modules/m06-time-attendance/**` | `npm run test:m06` | Frozen; preserve no `pulse.m07` writes except authorised intake |
| `src/modules/m07-staff-pay/**` | `npm run test:m07` | Ordinary prep closed — only authorised batch/defect/CR |
| Docs-only under `docs/audits/` **new** batch files | No unit suite | Do not rewrite `WAVE2_*`…`WAVE6_BATCH1-6_*` |

**Feature Agent must not claim merge-ready** without Integration running R-INT when any of these changed: `src/app/**`, `src/platform/**` (shared), `package.json`, shell, permissions catalogues, cross-module adapters.

Focused TDD allowed: `npx tsx --test path/to/file.test.ts` — still run full scoped suite before handoff.

### 1.2 Integration Agent

| Gate | Tag | Command / action |
|---|---|---|
| Full functional family | R-INT | See §2 “Functional full suite” (prefer over raw `npm test` until perf split exists) |
| Raw `npm test` | ADV | Includes m05/m11 perf — expect possible false fail on loaded machines |
| Lint | ADV / DEBT | `npm run lint` — currently 1 error / 24 warnings |
| Build | ADV / DEBT | `npm run build` — fails M06 outbox; cite Batch 6 quals |
| `tsc --noEmit` | ADV / DEBT | Expect **14** errors until debt batch |
| Platform QA | R-INT if shell/routes/platform touched | `npm run test:platform-qa` (server up) |
| Path ownership | R-INT | Hotspots only per ownership matrix |
| Diff hygiene | R-INT | `git diff --check`; no secrets |

### 1.3 Evidence Agent

| Gate | Tag | Notes |
|---|---|---|
| New batch evidence only | R-OWNER | New files under `docs/audits/` — never rewrite accepted Wave/Batch history |
| Module unit suite for batch | R-OWNER | Matching `test:mXX` with recorded counts |
| Browser / responsive / theme | R-OWNER | Playwright scripts or recorded manual protocol; widths 1440…390; overflow-x≈0 |
| Wave 2–5 scripts | R-OWNER only if Controller orders frozen regression | `npm run test:waveN-evidence` with `BASE_URL` / running app |
| Wave 6 browser script | Gap | No npm script yet — use unit + checkpoint template until authorised script lands |

### 1.4 Independent QA Agent

| Gate | Tag | Notes |
|---|---|---|
| Re-run R-SCOPED for changed modules | R-INT | Separate worktree/branch from implementer |
| Re-run R-INT subset | R-INT | Especially `test:m07` / full functional family for M07 batches |
| Lint / build | ADV | Record against known debt; do not require green build until owner hardens gate |
| Browser spot-check | R-OWNER | Confirm Evidence pack is reproducible |
| Production fixes | N/A | Return to Feature/Integration unless owner authorises hotfix |

### 1.5 Parallel Development Controller

| Gate | Tag | Notes |
|---|---|---|
| Publish pin | R-OWNER | After each accepted merge |
| Specify frozen-wave regression set | R-OWNER | Which wave evidence scripts (if any) |
| Approve CI policy changes | R-OWNER | Owner decisions in §5 |

### 1.6 Planning / docs-only agent

| Gate | Tag | Notes |
|---|---|---|
| Unit/build | N/A | Unless `src/**` accidentally touched |
| `git diff --check` | R-SCOPED | |
| Confirm no `src/**` | R-SCOPED | Docs-only PRs must not modify production code |

---

## 2. Command recipes

### 2.1 Functional full suite (recommended Integration gate)

Until `package.json` gains a perf-excluding script (owner-authorised Integration change), run:

```bash
npm run test:workforce
npm run test:auth
npm run test:m04
npm run test:m06
npm run test:m07
```

Then for M11/M05 either:

- **Strict (current npm):** `npm run test:m11` and `npm run test:m05` — may fail on perf; classify as ADV if only `*-performance.test.ts` fails, **or**
- **Functional-focused (record exact paths):**

```bash
npx tsx --test src/modules/m11-training/tests/m11-domain.test.ts src/modules/m11-training/tests/m11-closure-gate.test.ts
npx tsx --test src/modules/m05-roster/tests/m05-*.test.ts
# exclude: m05-performance.test.ts / m11-performance.test.ts from required gate
```

**Owner decision required** before CI treats raw `npm test` as a hard required check (§5 D1).

### 2.2 Owner-acceptance evidence (minimum)

| Gate | Minimum |
|---|---|
| Browser workflow | Primary authorised journeys in real UI |
| Responsive | 1440, 1280, 1024, 768, 430, 390; no page horizontal overflow on touched surfaces |
| Permission / SoD | New/changed actions; deny paths |
| Storage | Correct `pulse.mXX.*`; repository-mediated; migrations additive |
| Frozen regression | As Controller specifies for the batch |
| Completion report | Template from readiness pack / `docs/templates/` when present on pin |
| PR checklist | Same |

Absence ⇒ no owner acceptance.

### 2.3 Wave evidence runners (env)

```bash
# Terminal A
npm run build   # may fail today — use npm run dev if build blocked by known debt
npm run start   # or: npm run dev

# Terminal B
set BASE_URL=http://localhost:3000   # PowerShell: $env:BASE_URL="http://localhost:3000"
npm run test:wave2-evidence
npm run test:wave3-evidence
npm run test:wave4-evidence
npm run test:wave5-evidence
```

Notes:

- `SKIP_BROWSER=1` on wave4/wave5 **skips** browser section (recorded skip ≠ pass).  
- Platform browser QA: `node scripts/platform-integration-browser-qa.mjs` then `npm run test:platform-qa`.  
- Evidence output path quirk: platform harness may write **outside** git root — verify artifact location.

---

## 3. Path → required suite (quick map)

| Path prefix | R-SCOPED suite | Forces R-INT extras |
|---|---|---|
| `src/platform/workforce/` | `test:workforce` | Full functional family if contracts change |
| `src/platform/auth/` | `test:auth` | + owner defect/CR |
| `src/platform/**` (other) | Integration judgment | `test:platform-qa` + full functional |
| `src/app/**`, `src/components/shell/**` | — | `test:platform-qa` + full functional |
| `src/modules/m04-*/` | `test:m04` | Frozen process |
| `src/modules/m11-*/` | `test:m11` | Frozen; perf ADV |
| `src/modules/m05-*/` | `test:m05` | Frozen; perf ADV |
| `src/modules/m06-*/` | `test:m06` | Frozen; build debt if touching outbox |
| `src/modules/m07-*/` | `test:m07` | Closed ordinary prep; authorised batch only |
| `scripts/platform-integration*.mjs` | — | `test:platform-qa` + browser companion |
| `scripts/wave*-*.mjs` | — | Matching wave evidence; soft INT/QA ownership |
| `package.json` / lockfile / eslint / tsconfig / next.config | — | Full functional + lint/build ADV |
| `docs/audits/WAVE6_BATCH[1-6]_*.md` | — | **Do not edit** (frozen accepted evidence) |
| `docs/plans/WAVE6_M07_PPA_*.md` | — | Planning only; no implementation tests |

---

## 4. Current status snapshot (pin `0afe878`, audit 2026-07-30)

| Check | Status | Class |
|---|---|---|
| `test:workforce` 45/45 | Pass | Current passing |
| `test:auth` 16/16 | Pass | Current passing |
| `test:m04` 16/16 | Pass | Current passing |
| `test:m06` 83/83 | Pass | Current passing |
| `test:m07` 221/221 | Pass | Current passing (matches Batch 6) |
| `test:m11` 35/37 | Fail (perf) | Known flaky / ADV |
| `test:m05` 115/117 | Fail (perf) | Known flaky / ADV |
| Platform QA committed 152/152 | Historical pass | Re-run when shell touched |
| `tsc` 14 errors | Fail | DEBT (Batch 6 qual) |
| `build` M06 outbox:235 | Fail | DEBT (Batch 6 qual) |
| `lint` 1 error / 24 warnings | Fail | DEBT / ADV |
| GitHub Actions | Absent | Gap — proposed only |
| Wave 6 Playwright npm script | Absent | Gap |

---

## 5. Required owner decisions (before enabling hard CI)

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Is raw `npm test` a hard PR gate? | Hard / Functional-only / Advisory | **Functional-only** until perf budgets isolated |
| D2 | Is `npm run build` a hard PR gate while 14 TS + outbox debt remain? | Hard / Advisory / Block-until-fixed | **Advisory** (honour Batch 6 quals) until debt batch |
| D3 | Is `npm run lint` a hard PR gate with current 1 error? | Hard / Advisory / Debt-clearance batch first | **Advisory** or authorise lint-stabilisation batch |
| D4 | Should CI install Playwright and run wave evidence on every PR? | Always / nightly / `workflow_dispatch` / never | **`workflow_dispatch` + owner-acceptance only** |
| D5 | May Integration add `.github/workflows` from the examples below? | Yes / Yes-with-edits / No | Await explicit Yes |
| D6 | Path-filtered CI allowed? | Yes / No | **Yes**, provided Integration/`main` still runs full functional family |
| D7 | Authorise `test:wave6-evidence` script creation? | Yes (named batch) / No | Only with Evidence scope; no history rewrite |

---

## 6. Proposed workflow YAML (examples only — **not** added on this audit branch)

> **Do not merge these files without owner decisions D1–D6.**  
> Place under `.github/workflows/` only in an authorised Integration PR.

### 6.1 Path-filtered unit checks (required scoped)

```yaml
# PROPOSED — docs/plans example only. Not installed by audit branch.
name: hcdp-scoped-unit

on:
  pull_request:
    paths:
      - "src/platform/workforce/**"
      - "src/platform/auth/**"
      - "src/modules/m04-staff-doctors/**"
      - "src/modules/m11-training/**"
      - "src/modules/m05-roster/**"
      - "src/modules/m06-time-attendance/**"
      - "src/modules/m07-staff-pay/**"
      - "package.json"
      - "package-lock.json"

jobs:
  detect:
    runs-on: ubuntu-latest
    outputs:
      workforce: ${{ steps.filter.outputs.workforce }}
      auth: ${{ steps.filter.outputs.auth }}
      m04: ${{ steps.filter.outputs.m04 }}
      m11: ${{ steps.filter.outputs.m11 }}
      m05: ${{ steps.filter.outputs.m05 }}
      m06: ${{ steps.filter.outputs.m06 }}
      m07: ${{ steps.filter.outputs.m07 }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            workforce: ['src/platform/workforce/**']
            auth: ['src/platform/auth/**']
            m04: ['src/modules/m04-staff-doctors/**']
            m11: ['src/modules/m11-training/**']
            m05: ['src/modules/m05-roster/**']
            m06: ['src/modules/m06-time-attendance/**']
            m07: ['src/modules/m07-staff-pay/**']

  test-workforce:
    needs: detect
    if: needs.detect.outputs.workforce == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run test:workforce

  test-auth:
    needs: detect
    if: needs.detect.outputs.auth == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run test:auth

  test-m04:
    needs: detect
    if: needs.detect.outputs.m04 == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run test:m04

  test-m06:
    needs: detect
    if: needs.detect.outputs.m06 == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run test:m06

  test-m07:
    needs: detect
    if: needs.detect.outputs.m07 == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run test:m07

  # ADV until D1: m05/m11 jobs should exclude performance files or continue-on-error
  test-m05-functional:
    needs: detect
    if: needs.detect.outputs.m05 == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npx tsx --test "src/modules/m05-roster/tests/m05-adapters.test.ts" "src/modules/m05-roster/tests/m05-authz.test.ts" "src/modules/m05-roster/tests/m05-bulk.test.ts" "src/modules/m05-roster/tests/m05-conflict-policy.test.ts" "src/modules/m05-roster/tests/m05-cost-privacy.test.ts" "src/modules/m05-roster/tests/m05-domain.test.ts" "src/modules/m05-roster/tests/m05-eligibility.test.ts" "src/modules/m05-roster/tests/m05-migration.test.ts" "src/modules/m05-roster/tests/m05-publication.test.ts" "src/modules/m05-roster/tests/m05-swap-open.test.ts" "src/modules/m05-roster/tests/m05-timezone-dst.test.ts" "src/modules/m05-roster/tests/m05-ux-states.test.ts"

  test-m11-functional:
    needs: detect
    if: needs.detect.outputs.m11 == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npx tsx --test "src/modules/m11-training/tests/m11-domain.test.ts" "src/modules/m11-training/tests/m11-closure-gate.test.ts"
```

### 6.2 Integration / main full functional + advisory quality

```yaml
# PROPOSED — docs/plans example only. Not installed by audit branch.
name: hcdp-integration-gates

on:
  pull_request:
    paths:
      - "src/app/**"
      - "src/components/**"
      - "src/platform/**"
      - "src/lib/**"
      - "package.json"
      - "package-lock.json"
      - "eslint.config.*"
      - "tsconfig.json"
      - "next.config.*"
  workflow_dispatch:

jobs:
  functional-family:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run test:workforce
      - run: npm run test:auth
      - run: npm run test:m04
      - run: npm run test:m06
      - run: npm run test:m07
      - run: npx tsx --test "src/modules/m11-training/tests/m11-domain.test.ts" "src/modules/m11-training/tests/m11-closure-gate.test.ts"
      - name: M05 functional (exclude performance)
        run: npx tsx --test "src/modules/m05-roster/tests/m05-adapters.test.ts" "src/modules/m05-roster/tests/m05-authz.test.ts" "src/modules/m05-roster/tests/m05-bulk.test.ts" "src/modules/m05-roster/tests/m05-conflict-policy.test.ts" "src/modules/m05-roster/tests/m05-cost-privacy.test.ts" "src/modules/m05-roster/tests/m05-domain.test.ts" "src/modules/m05-roster/tests/m05-eligibility.test.ts" "src/modules/m05-roster/tests/m05-migration.test.ts" "src/modules/m05-roster/tests/m05-publication.test.ts" "src/modules/m05-roster/tests/m05-swap-open.test.ts" "src/modules/m05-roster/tests/m05-timezone-dst.test.ts" "src/modules/m05-roster/tests/m05-ux-states.test.ts"

  advisory-quality:
    runs-on: ubuntu-latest
    continue-on-error: true   # D2/D3: flip to false only after debt clearance
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build

  advisory-perf:
    runs-on: ubuntu-latest
    continue-on-error: true   # D1
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npx tsx --test "src/modules/m05-roster/tests/m05-performance.test.ts"
      - run: npx tsx --test "src/modules/m11-training/tests/m11-performance.test.ts"
```

### 6.3 Manual wave evidence (owner-acceptance)

```yaml
# PROPOSED — docs/plans example only. Not installed by audit branch.
name: hcdp-wave-evidence

on:
  workflow_dispatch:
    inputs:
      wave:
        description: "wave2 | wave3 | wave4 | wave5"
        required: true
        type: string

jobs:
  evidence:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: npm }
      - run: npm ci
      - run: npx playwright install chromium
      # build may fail (D2); prefer next start from prior artifact or `next dev` long-running service job
      - run: npm run dev &
      - run: npx wait-on http://localhost:3000
      - run: npm run test:${{ inputs.wave }}-evidence
        env:
          BASE_URL: http://localhost:3000
```

---

## 7. What each future parallel agent must run (one-page cheat sheet)

| Before… | Minimum commands |
|---|---|
| Handing Feature → Integration | Matching `npm run test:<scope>` + `git diff --check` |
| Opening Integration PR | Functional full family (§2.1) + hotspot `test:platform-qa` if needed + record ADV lint/build/tsc |
| Independent QA sign-off | Re-run scoped + Integration functional family; verify evidence reproducibility |
| Owner acceptance request | §2.2 evidence gates + completion report + PR checklist; stop for owner decision |
| Merge to `main` | Explicit owner/Controller instruction only |

---

## 8. Non-claims

- Not production deployment approval  
- Not certification of award/tax/super/employment law  
- Not payment / bank / STP / super / Xero readiness  
- Not authorisation to implement PPA or Module 8  
- Not installation of CI workflows (examples only)

---

*End of parallel agent test matrix.*

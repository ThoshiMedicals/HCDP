# P1C Delivery, Operations & Software Supply-Chain

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Delivery & operations

| Capability | Status | Notes |
| --- | --- | --- |
| Local dev | Adequate | `npm run dev` → localhost:3000 |
| Production build | Adequate locally | `npm run build` used in baseline gates |
| CI on PR | **Missing** | No `.github/workflows` |
| CD / deploy | **Missing / not authorised** | No Dockerfile/Vercel config in repo root |
| Environments (dev/stage/prod) | Undefined | — |
| Observability (logs/metrics/traces) | Missing consolidated | — |
| On-call / IR | Missing | DEV-GAP-023 |
| Backup/DR | Missing for prod data path | DATA-04 |
| Feature flags | Partial demo flags | Honesty required |
| Release management | Missing | DEV-GAP-027 |

### Delivery gates (reuse P1A/P1B)

Entry: owner auth + clean tip + validators.  
DoD: tests + separate Visual/Work-Step QA + evidence + no historical rewrite.  
Prod: Stage 13 + specialist reviews — **not** satisfied by P1C docs.

## Software supply-chain controls

**Constraint:** This audit does **not** install, update, or remove dependencies.

| Control | Status |
| --- | --- |
| Lockfile | Present (`package-lock.json`) |
| Minimal runtime deps | next/react/react-dom only — positive |
| Dev tooling | eslint, tailwind, typescript, tsx, playwright |
| Automated dependency PRs | Absent |
| SBOM generation | Absent |
| License compliance review | Absent |
| Pinning / engines | Node engines field absent |
| Malicious package monitoring | Absent |
| CI npm audit gate | Absent |

### Supply-chain recommendations (planned, unauthorised)

1. Add CI: `npm ci`, `tsc`, lint, test, build, `validate-registers`.  
2. Enable Dependabot/Renovate (owner).  
3. Generate SBOM on release.  
4. Decide Playwright: configure harness or remove in a later authorised deps batch — **not now**.  
5. Pin Node via `engines` + `.nvmrc`.

# P1C Missing Development-File Audit (30 Items)

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Adequacy classes

| Class | Meaning |
| --- | --- |
| Adequate | Present, current enough for stage, used |
| Partial | Present but incomplete/stale/unused |
| Missing | Absent |
| N/A | Not required yet given exclusions / stage |
| Conflict | Present but contradicts authoritative SoT |

**Rule:** Inspect content/usage — do not assume satisfaction from filename alone.

## Thirty-item audit

| # | Item | Path expected | Observed | Adequacy | Evidence / usage | Gap ID | Closure stage |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Root README (accurate) | `README.md` | Present but stale (20 modules; “No backend/auth”) | **Conflict / Partial** | Contradicts M04–M07/M11 + 24-module register | DEV-GAP-001 | S2 |
| 2 | LICENSE | `LICENSE` | Absent | Missing | — | DEV-GAP-002 | S2 |
| 3 | CONTRIBUTING | `CONTRIBUTING.md` | Absent | Missing | — | DEV-GAP-003 | S2 |
| 4 | SECURITY policy | `SECURITY.md` | Absent | Missing | — | DEV-GAP-004 | S3 |
| 5 | CODE_OF_CONDUCT | `CODE_OF_CONDUCT.md` | Absent | Missing | N/A until public collab | DEV-GAP-005 | S2 |
| 6 | CHANGELOG | `CHANGELOG.md` | Absent | Missing | Wave evidence substitutes partially | DEV-GAP-006 | S4 |
| 7 | Env example (no secrets) | `.env.example` | Absent; `.env.local` ignored | Missing | Secrets not committed | DEV-GAP-007 | S3 |
| 8 | Node version pin | `.nvmrc` / `engines` | Absent both | Missing | Tooling uses local node22 helper | DEV-GAP-008 | S2 |
| 9 | ESLint | `eslint.config.mjs` | Present; `npm run lint` used | Adequate | Baseline lint 0 errors historically | — | — |
| 10 | Prettier / format standard | `.prettierrc*` | Absent | Missing | No enforced formatter config | DEV-GAP-009 | S2 |
| 11 | TypeScript config | `tsconfig.json` | Present | Adequate | `tsc --noEmit` used in gates | — | — |
| 12 | Unit/integration test runner config | vitest/jest config | Absent; uses `tsx --test` scripts | **Partial** | Adequate mechanism; undocumented standard | DEV-GAP-010 | S4 |
| 13 | E2E config | `playwright.config.*` | Absent; playwright dep present | **Partial** | Dep unused as configured harness | DEV-GAP-011 | S4 |
| 14 | CI workflows | `.github/workflows` | Absent | Missing | No automated PR gates | DEV-GAP-012 | S5 |
| 15 | Dependabot/Renovate | `.github/dependabot.yml` | Absent | Missing | Manual deps only | DEV-GAP-013 | S5 |
| 16 | CODEOWNERS | `CODEOWNERS` | Absent | Missing | — | DEV-GAP-014 | S5 |
| 17 | PR / issue templates | `.github/*TEMPLATE*` | Absent | Missing | — | DEV-GAP-015 | S5 |
| 18 | Dockerfile | `Dockerfile` | Absent | Missing | No container path | DEV-GAP-016 | S6 |
| 19 | Compose / local multi-service | `docker-compose.yml` | Absent | Missing | — | DEV-GAP-017 | S6 |
| 20 | OpenAPI / API contract | `openapi*` / swagger | Absent | Missing | No HTTP API catalogue | DEV-GAP-018 | S7 |
| 21 | ADR folder | `docs/adr/` | Absent | Missing | Decisions scattered in wave docs | DEV-GAP-019 | S1 |
| 22 | Architecture overview (current) | `ARCHITECTURE.md` or equivalent | Partial via `HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md` + P1A | **Partial** | Root ARCHITECTURE.md absent; plan exists | DEV-GAP-020 | S1 |
| 23 | SBOM / license inventory | SBOM files | Absent | Missing | No CycloneDX/SPDX artefact | DEV-GAP-021 | S5 |
| 24 | Secrets scanning policy | docs/CI secret scan | Absent | Missing | `.gitignore` helps only | DEV-GAP-022 | S3 |
| 25 | Runbooks (ops/IR/DR) | `docs/ops/` | Absent consolidated | Missing | — | DEV-GAP-023 | S8 |
| 26 | Privacy policy / PIA artefact | approved privacy pack | Absent approved | Missing | P1A mapped baseline only | DEV-GAP-024 | S9 |
| 27 | Threat model pack | consolidated | Absent | Missing | P1A DEF-GAP-012 | DEV-GAP-025 | S9 |
| 28 | Accessibility evidence pack | WCAG AA evidence | Partial shell notes | **Partial** | Design contract + some wave a11y; not AA cert | DEV-GAP-026 | S10 |
| 29 | Release / versioning process | RELEASE.md / tags policy | Absent | Missing | — | DEV-GAP-027 | S4 |
| 30 | Current platform inventory (accurate) | `CURRENT_PLATFORM_INVENTORY.md` | Present **stale** | **Conflict** | Prefer `CURRENT_IMPLEMENTATION_REAUDIT.*` | DEV-GAP-028 | S1 |

## Summary counts

| Adequacy | Count |
| --- | ---: |
| Adequate | 2 |
| Partial | 5 |
| Missing | 20 |
| Conflict | 2 (items 1 & 30; counted in Partial/Conflict rows above) |
| N/A noted | 1 (CoC timing) |

> Table lists 30 discrete items; Conflict items are still counted in the 30.

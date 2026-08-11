# P1C Repository Inventory

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Inventory rules

- Controlled inventory of material repository areas  
- No secrets recorded (values from `.env.local` not transcribed)  
- Stamps planning only  

## Root / control plane

| Path | Type | Purpose | Owner (inferred) | Sensitivity | Prod relevance | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `package.json` | config | Next 16.2.10 / React 19 app; scripts | Eng | Low | High | 3 runtime deps; private 0.1.0 |
| `package-lock.json` | lock | npm lock | Eng | Low | High | Present (npm) |
| `tsconfig.json` | config | TS | Eng | Low | High | Present |
| `next.config.ts` | config | Next | Eng | Low | High | Minimal |
| `eslint.config.mjs` | config | ESLint flat | Eng | Low | Med | Present |
| `postcss.config.mjs` | config | Tailwind postcss | Eng | Low | Med | Present |
| `.gitignore` | config | Ignores `node_modules`, `.next`, `.env*` | Eng | Low | High | `.env.local` ignored (verified) |
| `.env.local` | secret file | Local env | Eng | **Secret** | High | Present on disk; **ignored**; not inventoried |
| `README.md` | docs | Getting started | Eng | Low | High | **Stale** vs current app (CONF-P1C-001) |
| `CURRENT_PLATFORM_INVENTORY.md` | docs | Historical inventory 24 Jul 2026 | Planning | Low | Med | **Stale/conflict** vs re-audit (CONF-P1C-002) |
| `PLATFORM_INTEGRATION_PLAN.md` | docs | Integration spine | Planning | Low | Med | Retain |
| `PLATFORM_STORAGE_REGISTER.md` | docs | localStorage keys | Eng/Planning | Med | High | Authoritative for client storage |
| `.cursor/` | tooling | Cursor rules | Programme | Low | Low | Wave-control rules |
| `.next/` | build | Next build cache | Generated | Low | N/A | Local artefact |
| `node_modules/` | deps | Installed packages | Generated | Low | N/A | Not source SoT |

## Application

| Path | Type | Purpose | Notes |
| --- | --- | --- | --- |
| `src/app/(portal)/` | routes | Production-style portal | `/dashboard` family |
| `src/app/prototype/` | routes | Prototype reference | Dual surface accepted difference |
| `src/components/shell/` | UI | Shared chrome | P1-B1 candidate |
| `src/components/workspaces/` | UI | M01–M03 hosts | Domain NOT-STARTED |
| `src/modules/m01-*…m24-*` | modules | 24 module packages | File-count depth varies widely |
| `src/platform/` | platform | Auth, workforce, permissions, module-registry | Core |
| `src/lib/extracted/` | data | BRD/blueprint/seed JSON | Extracted |
| `public/pulse-html-prototype.html` | prototype | HTML SoT for not-yet-built | Large |

### Module package file counts (observed)

| Module | Files | Signal |
| --- | ---: | --- |
| M01–M03 | 4–5 | Thin packages + workspaces elsewhere |
| M04 | 40 | Domain depth |
| M05 | 82 | Domain depth |
| M06 | 84 | Domain depth |
| M07 | 123 | Domain depth |
| M11 | 51 | Domain depth |
| M08–M10, M12–M21, M23–M24 | 3 | Placeholder shell |
| M22 | 10 | Slightly thicker placeholder/seed |

## Data / DB

| Path | Type | Purpose | Notes |
| --- | --- | --- | --- |
| `db/migrations/20260727094500_auth_user_provisioning.sql` | SQL | Portable auth/org/clinic/profile schema | **Not evidenced as live runtime DB** |
| Runtime persistence | localStorage | Per `PLATFORM_STORAGE_REGISTER.md` | Demo/local |

## Docs / evidence / scripts

| Path | Type | Purpose | Notes |
| --- | --- | --- | --- |
| `docs/architecture/` | docs | Architecture, wave plans, parity | Authoritative planning |
| `docs/architecture/prototype-parity/` | docs | P0 registers + phase0/1 packs | Includes uncommitted P1A/P1B/P1C |
| `docs/plans/` | docs | PPA planning | Not authorised |
| `docs/audits/` | evidence | Wave + UI Batch1 evidence | Some **path-too-long** Windows issues (HYG-P1C-001) |
| `scripts/` | tooling | ~50 scripts; parity validators; evidence | Eng |

## Explicitly absent (top-level)

LICENSE · CONTRIBUTING.md · SECURITY.md · CODE_OF_CONDUCT.md · CHANGELOG.md · AGENTS.md · ARCHITECTURE.md · `.env.example` · `.nvmrc`/`.node-version` · Dockerfile · docker-compose · `.github/workflows` · Dependabot · CODEOWNERS · OpenAPI/Swagger · `docs/adr/` · Prettier config · dedicated Vitest/Jest/Playwright config files · SBOM artefacts  

## Runtime stack (observed)

| Item | Value |
| --- | --- |
| Framework | Next.js **16.2.10** App Router |
| UI | React **19**, Tailwind **4** |
| Tests | Node test runner via `tsx --test` (workforce/auth/M04–M07/M11) |
| Playwright | Present as **devDependency** (^1.49.0); no root `playwright.config.*` found |
| Package manager | npm (`package-lock.json`) |
| Modules runtime | **24** (`module-register.ts` / re-audit) |

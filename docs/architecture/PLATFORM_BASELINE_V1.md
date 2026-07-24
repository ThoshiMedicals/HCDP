# Platform Baseline V1

**Status:** Signed off  
**Signed:** 24 July 2026  
**QA evidence:** `docs/audits/PLATFORM_INTEGRATION_QA.md`, `docs/audits/platform-integration-evidence.json`  
**Commit at sign-off:** `71c16ef` (working tree includes post-commit integration repairs)  
**Build:** `npm run build` — passed (Next.js 16.2.10 / Turbopack; no failing warnings)

## Register and shared versions

| Artifact | Version / location |
|---|---|
| Approved 24-module register | `src/platform/module-registry/module-register.ts` — Platform Modules Register v1 (24 modules) |
| Shared clinic context | `pulse.platform.context.clinics` **v1** (`src/platform/context/clinic-context.tsx`) |
| Shared identity context | `pulse.platform.context.identity` **v1** (`src/platform/context/identity-context.tsx`) |
| Shared contracts | Platform contracts pack **v1** — source-record, action-inbox events, notifications, audit, executive summary (`src/platform/contracts/`) |
| Storage register | `PLATFORM_STORAGE_REGISTER.md` **v1** |
| Route map | `src/platform/navigation/legacy-routes.ts` **v1** (+ module main routes in register) |

## Modules protected from regression

- **Module 1** — Executive Command Centre (`/dashboard`) — complete interactive rebuild
- **Module 2** — Action Inbox & Notifications (`/action-inbox`) — complete interactive rebuild
- **Module 3** — Organisation & Access (`/settings`) — complete interactive rebuild

Do not redesign these modules in later stages without an explicit change request. Integration adapters may continue to sync projections and contexts.

## Modules ready for detailed development

None released for detailed rebuild in this baseline. The navigation spine, contexts, contracts, and landings are ready so Modules **4–24** can be developed module-by-module next.

## Modules still Rebuild Pending

Modules **4–24** remain Rebuild Pending (landing / partial only). Enterprise Extensions (21–24) are role-gated in the sidebar.

| # | Module | Route |
|---|---|---|
| 4 | Staff & Doctors | `/staff-doctors` |
| 5 | Roster & Shifts | `/roster` |
| 6 | Time & Attendance | `/time-attendance` |
| 7 | Staff Pay | `/staffpay` |
| 8 | Doctor Pay | `/doctorpay` |
| 9 | BBPIP | `/bbpip` |
| 10 | Tasks & Actions | `/tasks-actions` |
| 11 | Training | `/training` |
| 12 | Compliance & Quality | `/compliance-quality` |
| 13 | Documents & Policies | `/documents-policies` |
| 14 | Ticketing Desk | `/ticket-desk` |
| 15 | Inventory & Assets | `/inventory-assets` |
| 16 | Incidents & Risk | `/incidents-risk` |
| 17 | Communications | `/communications` |
| 18 | Digital Operations | `/digital-ops` |
| 19 | Clinic Analytics | `/analytics` |
| 20 | Commercial SaaS | `/saas` |
| 21 | Vendor Console | `/vendor-console` |
| 22 | Recruitment | `/recruitment` |
| 23 | Website Studio | `/website-studio` |
| 24 | Financial Forecast | `/financial-forecast` |

## Known limitations

- Modules 4–24 are intentionally not fully rebuilt; landings show purpose, sections, and Rebuild pending.
- Module 1–3 UI still primarily lives under `src/components/workspaces/*` with platform adapters; gradual migration to `src/modules/m0x-*` is allowed without behaviour redesign.
- Organisation overview still contains a static demo subtitle “Acting as Sarah Mitchell…” (pre-existing Module 3 copy); live identity is shown in the sidebar user block and Act as User control.
- Prototype HTML remains at `/prototype-reference` and `public/pulse-html-prototype.html` for Development / QA only — not a default module route.
- On this Windows host, Playwright/automation must use `http://localhost:3000` (IPv6 `::1`); `http://127.0.0.1:3000` can serve HTML without full client hydration.
- Accessibility coverage in this stage used keyboard/label/`aria-*` spot checks rather than a full axe-core audit.

## Defects repaired during QA (before sign-off)

1. **Enterprise Extensions visibility** ignored `identity.enterpriseExtensionsVisible` — fixed in `src/components/shell/Sidebar.tsx` via `identitySeesEnterprise`.
2. **Damaged clinic JSON** now forces rewrite of `pulse.platform.context.clinics` on hydrate — `src/platform/context/clinic-context.tsx`.

## Sign-off statement

Critical and major interactive QA items for the Platform Integration Spine and 24-Module Navigation Consolidation have passed (152/152). Baseline V1 is signed. Detailed development of Modules 4–24 must not begin until a later stage is explicitly authorised.

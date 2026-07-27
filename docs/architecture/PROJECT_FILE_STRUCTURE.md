# Project File Structure

**Product:** Medical Centre Operations Platform  
**Date:** 24 July 2026  
**Architecture style:** Feature-first modules + shared platform spine

---

## 1. Final folder tree (application source)

```
Development folder/
├── docs/
│   ├── architecture/          # Structure, ADRs, integration plans
│   ├── audits/                # Inventory / audit outputs
│   └── specifications/        # Product / module specs
├── public/
│   ├── pulse-html-prototype.html
│   └── legacy/                # QA pointers to prototype assets
└── src/
    ├── app/                   # Thin Next.js route entry points only
    │   ├── (portal)/
    │   │   ├── layout.tsx
    │   │   ├── [module]/page.tsx
    │   │   └── organisation/page.tsx
    │   ├── prototype-reference/
    │   └── prototype/
    ├── platform/              # Shared platform spine (not feature logic)
    │   ├── module-registry/
    │   ├── context/           # Clinic + identity providers
    │   ├── contracts/         # Source-record, inbox, notification, audit, exec summary
    │   ├── workforce/         # Workforce family contracts, events, projection services (Wave 1+)
    │   ├── services/          # Implementations of contracts (bridge, publish, summary)
    │   ├── navigation/        # Legacy redirects, search, favs migration
    │   ├── permissions/       # Shell / enterprise visibility helpers
    │   ├── storage/           # Versioned keys + migration helpers
    │   ├── demo/              # Demonstration identity catalogue
    │   ├── status/            # Shared priorities / sensitivity / statuses
    │   └── validation/
    ├── modules/               # One folder per approved module
    │   ├── m01-command-centre/
    │   ├── m02-action-inbox/
    │   ├── m03-organisation-access/
    │   ├── m04-staff-doctors/
    │   ├── … 
    │   └── m24-financial-forecast/
    ├── components/
    │   ├── ui/                # Primitives (Button, Badge, Modal, …)
    │   ├── shell/             # Sidebar, Topbar, PageHeader, …
    │   ├── shared/            # Cross-module visual building blocks
    │   ├── workspaces/        # Temporary home for M1–3 UIs (gradual migrate)
    │   └── forms/
    ├── legacy/                # HTML-era references / future extract relocation
    └── lib/                   # Compatibility + existing M1–3 libs (temporary)
        ├── command-centre/    # Module 1 lib (retained)
        ├── action-inbox/      # Module 2 lib (retained)
        ├── organisation/      # Module 3 lib (retained)
        ├── platform/          # Thin re-export shims → @/platform
        ├── modules.ts         # Compatibility catalogue over platform registry
        └── portal-context.tsx # Shell toasts / sidebar only — not module records
```

---

## 2. Purpose of every top-level folder

| Folder | Purpose |
|---|---|
| `src/app` | Route wiring only. Import module entry components. No business workflows. |
| `src/platform` | Shared integration spine: registry, contexts, contracts, services, nav, permissions, storage. |
| `src/modules` | Feature modules 1–24. Own UI, storage, adapters, validation. |
| `src/components/ui` | Design-system primitives. |
| `src/components/shell` | Application chrome (sidebar, topbar). |
| `src/components/shared` | Reusable cross-module visuals (source link, sensitivity badge, states, guards). |
| `src/components/workspaces` | **Temporary** location of completed M1–3 UIs until gradual move into `src/modules/m0x`. |
| `src/lib` | Existing module libs + compatibility shims. Do not add new platform-wide logic here. |
| `src/legacy` | Prototype / extracted reference material — no new features. |
| `public/legacy` | Static QA pointers for the HTML prototype. |
| `docs/architecture` | Structure and architecture records. |
| `docs/audits` | Inventories and audit reports. |
| `docs/specifications` | Specs and blueprints references. |

---

## 3. Standard module folder pattern

```
mXX-module-name/
  index.ts                 # Public exports
  ModuleNameModule.tsx     # Route entry component
  module.config.ts         # MODULE_ID, route, storage prefix, register lookup
  types.ts                 # When needed
  sections/                # Internal section screens
  components/
  forms/
  modals/
  repository/              # Persistence API for this module
  services/                # Module-local domain services
  adapters/                # Bridge to platform contracts / other modules
  data/                    # Seeds (demo only)
  storage/                 # Keys + read/write helpers (never in components)
  hooks/
  validation/
  tests/
```

**Rule:** Do not create empty folders. Add directories when the module needs them.

**Modules 1–3 today:** `module.config.ts`, entry re-export of existing workspace, and `adapters/` only. Full tree fills in during gradual migration.

---

## 4. Cross-module import rules

### Allowed

```
module A (adapter)
  → @/platform/contracts + @/platform/services
    → destination module repository (owned by destination only)
```

Example: Organisation (M3) adapter → `dispatchActionInboxEvent` (platform service) → Module 2 repository.

### Forbidden

- Module A importing Module B’s `repository/` or `storage/` directly
- Components writing `localStorage` directly
- Putting new records into `portal-context` `records` / `actions`
- Growing `src/lib/platform` with new logic (use `src/platform`)

### Shell may import

- `@/platform/module-registry`
- `@/platform/context`
- `@/platform/navigation`
- `@/platform/permissions`
- Module entry components only through the thin workspace router

---

## 5. Storage ownership rules

| Prefix | Owner |
|---|---|
| `pulse.platform.*` | Platform spine |
| `pulse.cc.*` / `pulse.cc.m1.*` | Module 1 |
| `pulse.m2.inbox.*` | Module 2 |
| `pulse.org.m3.*` | Module 3 |
| `pulse.m04.*` … `pulse.m24.*` | Modules 4–24 |

- All reads/writes go through module `repository/` or `storage/` services (or platform storage helpers for shared keys).
- Components call hooks/services — never `localStorage` directly.
- Cross-module projections are **not** duplicated business records.

---

## 6. Legacy-code rules

- HTML prototype stays available for Development / QA (`/prototype-reference`).
- Do not ship HTML iframe as the default product experience.
- Do not add new features under `src/legacy` or `public/legacy`.
- Extracted schemas may remain in `src/lib/extracted` until a safe relocate into `src/legacy/extracted`.

---

## 7. Naming conventions

| Item | Convention | Example |
|---|---|---|
| Module folder | `mNN-kebab-name` | `m10-tasks-actions` |
| Module entry | `PascalCase` + `Module` | `TasksActionsModule.tsx` |
| Platform module id | kebab-case | `tasks-actions` |
| Storage prefix | `pulse.mNN.` | `pulse.m10.` |
| Adapters | verb / domain | `org-inbox-sync.ts`, `platform.ts` |
| Contracts | noun | `source-record.ts` |
| Import alias | `@/platform/...`, `@/modules/...` | `@/platform/contracts` |

---

## 8. Examples

### Module 1 — Executive Command Centre

- **Retained UI:** `src/components/workspaces/command-centre/*`, `DashboardWorkspace.tsx`
- **Retained lib:** `src/lib/command-centre/*`
- **New:** `src/modules/m01-command-centre/` — entry re-export + `adapters/platform.ts` (clinic sync, executive inbox summary types)
- **Platform use:** clinic context write-through; inbox projection summary via platform service

### Module 2 — Action Inbox

- **Retained UI/lib:** `components/workspaces/action-inbox/*`, `lib/action-inbox/*`
- **New:** `src/modules/m02-action-inbox/` entry + adapters exposing platform bridge (not for other modules to dig into M2 repos)
- **Platform use:** identity context; source-record open; badge remains Module 2 owned

### Module 3 — Organisation & Access

- **Retained UI/lib:** `OrganisationWorkspace`, `lib/organisation/*`
- **New:** `src/modules/m03-organisation-access/adapters/org-inbox-sync.ts`
- **Platform use:** emits Action Inbox events through platform service; identity sync for demo actor

### Module 10 — Tasks, Checklists, Meetings & Actions

- **New:** `src/modules/m10-tasks-actions/` with `module.config.ts`, `TasksActionsModule.tsx` (landing)
- **Temporary partials:** still rendered via workspace router from existing `TasksWorkspace` / checklists until full rebuild
- **Storage (future):** `pulse.m10.*` — not portal `records`

---

## 9. Route rule reminder

`src/app/(portal)/[module]/page.tsx` must stay thin:

1. Legacy redirect resolution  
2. `getModule` / notFound  
3. Render `ModuleWorkspace` / module entry  

No seeds, no repository calls, no workflow logic in `page.tsx`.

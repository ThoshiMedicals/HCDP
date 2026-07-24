# Platform Storage Register

**Stage:** Platform Integration Spine  
**Date:** 24 July 2026

## Shared platform keys (`pulse.platform.*`)

| Key | Owner | Purpose | Version | Migration source | Reset behaviour | Shared / module-specific |
|---|---|---|---|---|---|---|
| `pulse.platform.context.clinics` | Platform | Clinic scope (all / group / single / multiple), selected IDs, label | 1 | `pulse.activeLocation`, `pulse.cc.selectedClinics` | Re-migrate from legacy on delete | Shared |
| `pulse.platform.context.identity` | Platform | Active demonstration user id | 1 | `pulse.v27.executiveRole` (+ M2 role/sensitivity write-through) | Re-seed Senior Administrator | Shared |
| `pulse.platform.migrations` | Platform | Idempotent migration flags map | n/a | — | Safe to clear (migrations re-run) | Shared |
| `pulse.platform.sourceLinks` | Platform / M2 bridge | Maps source-record keys → inbox action projection ids | 1 | Created by Module 3 demo bridge | Clear only with inbox reset coordination | Shared |

## Compatibility keys (retained — not deleted this stage)

| Key | Owner | Purpose | Notes |
|---|---|---|---|
| `pulse.activeLocation` | Portal / M1 adapter | Single active location | Written by shared clinic context |
| `pulse.cc.selectedClinics` | Module 1 | Multi-clinic selection | Written by shared clinic context + CC UI |
| `pulse.v27.executiveRole` | Shell legacy | Exec role string | Written by identity adapter |
| `pulse.m2.inbox.demoRole` | Module 2 | manager \| staff | Written by identity adapter |
| `pulse.m2.inbox.canSeeSensitive` | Module 2 | Sensitivity flag | Written by identity adapter |
| `pulse.v33.navPrefs` | Shell | Favourites / recents | Migrated to approved module IDs (`nav-prefs-module-ids` v1) |
| `pulse.v32.navCollapsed` | Shell | Sidebar group collapse | Enterprise group defaults collapsed |

## Module-owned keys (unchanged ownership)

### Module 1 — `pulse.cc.*` / `pulse.cc.m1.*`
Appearance, layouts, notes, period, health overrides, demo day, templates, executive actions, audit — **not migrated destructively**.

### Module 2 — `pulse.m2.inbox.*`
Actions, notifications, settings, drafts, templates, saved views, delegations, audit, UI, demo flags — **receives** projections from platform bridge; business source remains Module 3+.

### Module 3 — `pulse.org.m3.state`
Full organisation state — **system of record** for access requests/reviews/alerts; inbox holds projections only.

## Migration IDs

| Migration id | Version | Effect |
|---|---|---|
| `clinic-context` | 1 | Seed `pulse.platform.context.clinics` from legacy location keys |
| `identity-context` | 1 | Seed identity from executive role |
| `nav-prefs-module-ids` | 1 | Map htmlIds → approved module IDs in nav prefs |
| `org-m3-inbox-bridge` | 1 | Create three controlled M3→M2 projections once |

All migrations are idempotent and tolerate invalid JSON.

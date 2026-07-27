# Platform Storage Register

**Stage:** Platform Integration Spine + Wave 2 M04  
**Date:** 27 July 2026

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

## Workforce family keys (Wave 2 — M04 canonical)

| Key | Owner | Purpose | Version | Migration id | Notes |
|---|---|---|---|---|---|
| `pulse.m04.workforce.meta` | M04 | Meta / init | 1 | `m04-workforce-storage-v1` | Module-specific |
| `pulse.m04.workforce.people` | M04 | Person SoT | 1 | `m04-workforce-portal-seed-v1` | Migrated from HTML seed; legacyId retained |
| `pulse.m04.workforce.engagements` | M04 | Effective-dated engagements | 1 | — | |
| `pulse.m04.workforce.credentials` | M04 | Credentials | 1 | — | |
| `pulse.m04.workforce.leave` | M04 | Leave | 1 | — | |
| `pulse.m04.workforce.availability` | M04 | Availability | 1 | — | |
| `pulse.m04.workforce.restrictions` | M04 | Restrictions (sensitivity) | 1 | — | |
| `pulse.m04.workforce.onboarding` | M04 | Onboarding | 1 | — | |
| `pulse.m04.workforce.offboarding` | M04 | Offboarding | 1 | — | |
| `pulse.m04.workforce.readiness` | M04 | Derived readiness cache | 1 | — | Not manually editable |
| `pulse.m05.roster.*` | M05 | Skeleton only | 1 | `m05-roster-storage-v1` | Landing only |
| `pulse.m06.attendance.*` | M06 | Skeleton only | 1 | `m06-attendance-storage-v1` | Landing only |
| `pulse.m07.staffpay.*` | M07 | Skeleton only | 1 | `m07-staffpay-storage-v1` | Landing only |
| `pulse.m11.training.*` | M11 | Skeleton only | 1 | `m11-training-storage-v1` | Landing only |
| `pulse.m22.recruitment.*` | M22 | Skeleton only | 1 | `m22-recruitment-storage-v1` | Landing only |

After M04 cutover: **do not dual-write** portal `records.staff/doctors`. Legacy seed JSON remains for rollback/compatibility; portal bag is read-only compatibility. Do not delete legacy data in Wave 2.

## Migration IDs

| Migration id | Version | Effect |
|---|---|---|
| `clinic-context` | 1 | Seed `pulse.platform.context.clinics` from legacy location keys |
| `identity-context` | 1 | Seed identity from executive role |
| `nav-prefs-module-ids` | 1 | Map htmlIds → approved module IDs in nav prefs |
| `org-m3-inbox-bridge` | 1 | Create three controlled M3→M2 projections once |
| `m04-workforce-storage-v1` | 1 | Initialise empty M04 workforce collections |
| `m04-workforce-portal-seed-v1` | 1 | Idempotent people seed from HTML staff/doctors; no dual-write to portal |
| `m05-roster-storage-v1` | 1 | Initialise empty M05 roster collections |
| `m06-attendance-storage-v1` | 1 | Initialise empty M06 attendance collections |
| `m07-staffpay-storage-v1` | 1 | Initialise empty M07 staff-pay collections |
| `m11-training-storage-v1` | 1 | Initialise empty M11 training collections |
| `m22-recruitment-storage-v1` | 1 | Initialise empty M22 recruitment collections |

All migrations are idempotent and tolerate invalid JSON.

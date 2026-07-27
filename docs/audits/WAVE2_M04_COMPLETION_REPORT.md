# Wave 2 Completion Report — M04 Staff & Doctor Management

**Date:** 27 July 2026  
**Codebase:** `Development folder/`  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Amended execution plan:** Wave 1 Expansion + Wave 2 (M04 Core)  
**Verdict:** Wave 2 **owner accepted and frozen** (27 July 2026). Not production deployment approval. Wave 3 execution **not** approved.

Wave control: Wave 1A + Wave 1 expansion covered by Wave 2 owner acceptance → Wave 2 frozen → stop before Wave 3 execution.

---

## 1. Wave 1A evidence gate

All nine gate conditions **PASS** (auth tests 16/16). Documented in `docs/audits/AUTH_IDENTITY_CURRENT_STATE.md`, migration `db/migrations/20260727094500_auth_user_provisioning.sql`, APIs under `src/app/api/auth/**`. No Supabase. Base roles `user|manager|admin` only.

Wave control: Wave 1A + Wave 1 expansion covered by Wave 2 owner acceptance → Wave 2 owner accepted and frozen → Wave 3 execution not approved.

---

## 2. Files created / updated (Wave 1 expansion + Wave 2)

### Created (primary)

| Path | Purpose |
|---|---|
| `src/platform/workforce/services/identity-workforce-resolver.ts` | Profile → `WorkforcePersonRef` without M04 repo import |
| `src/modules/m04-staff-doctors/StaffDoctorsWorkspace.tsx` | 12-section workspace + URL deep-link sync |
| `src/modules/m04-staff-doctors/context.tsx` | Provider, migration seed, counts |
| `src/modules/m04-staff-doctors/permissions.ts` | Permission codes + clinic scope |
| `src/modules/m04-staff-doctors/types/domain.ts` | Domain types |
| `src/modules/m04-staff-doctors/storage/keys.ts` | `pulse.m04.workforce.*` |
| `src/modules/m04-staff-doctors/storage/migrate-from-portal.ts` | Portal seed migration |
| `src/modules/m04-staff-doctors/storage/migrations.ts` | Skeleton migration |
| `src/modules/m04-staff-doctors/repository/local-store.ts` | Persistence |
| `src/modules/m04-staff-doctors/services/*.ts` | Person, engagement, credential, leave, readiness, lifecycle, events |
| `src/modules/m04-staff-doctors/adapters/m04-inbox-sync.ts` | M02 projections |
| `src/modules/m04-staff-doctors/adapters/m04-executive.ts` | M01 counts |
| `src/modules/m04-staff-doctors/sections/*.tsx` | Section UIs |
| `src/modules/m04-staff-doctors/tests/m04-domain.test.ts` | Domain/authz/adapter tests |
| `src/components/workspaces/command-centre/WorkforceProjectionSummary.tsx` | M01 live projection card |
| `scripts/wave2-m04-browser-evidence.mjs` | Playwright evidence runner |
| `docs/audits/wave2-m04-browser-evidence.json` | Browser/responsive results |
| `docs/audits/WAVE2_M04_COMPLETION_REPORT.md` | This report |

### Updated (primary)

| Path | Change |
|---|---|
| `src/components/workspaces/ModuleWorkspace.tsx` | Full M04 entry; not `hasPartial` |
| `src/modules/m04-staff-doctors/StaffDoctorsModule.tsx` | Mounts workspace |
| `src/platform/module-registry/module-register.ts` | 12 sections |
| `src/platform/navigation/legacy-routes.ts` | staff/doctors/hr-docs → M04 |
| `src/components/workspaces/command-centre/CommandCentre.tsx` | Renders `WorkforceProjectionSummary` |
| `PLATFORM_STORAGE_REGISTER.md` (+ Development folder copy) | M04 keys + `m04-workforce-portal-seed-v1` |
| `docs/architecture/WORKFORCE_CONTRACTS.md` | Linkage + Wave 2 notes |
| `.cursor/rules/hcdp-wave-control.mdc` | Wave 2 owner accepted and frozen; Wave 3 execution not approved |

---

## 3. Storage migrations

| Migration id | Effect |
|---|---|
| `m04-workforce-storage-v1` | Empty M04 collections |
| `m04-workforce-portal-seed-v1` | Idempotent people seed from HTML staff/doctors |

### Migration counts

| Metric | Value |
|---|---|
| Source staff | 100 |
| Source doctors | 48 |
| Source total | 148 |
| Migrated | 148 |
| Duplicates | 0 |
| Rejected | 0 |
| Warnings | 0 |
| Dual-write to portal | **None** |
| Legacy deleted | **No** |

Rollback: clear `pulse.m04.workforce.*` + migration flag; legacy JSON untouched (documented in `migrate-from-portal.ts`).

Canonical keys: `pulse.m04.workforce.{meta,people,engagements,credentials,leave,availability,restrictions,onboarding,offboarding,readiness}`.

---

## 4. Routes and legacy aliases

| Route | Result |
|---|---|
| `/staff-doctors` | Full workspace |
| `/staff-doctors?section=*` | Deep-link; nav writes URL |
| `/staff` | → people |
| `/doctors` | → doctor-profiles |
| `/hr-docs` | → credentials |

---

## 5. Domain workflows (1–12)

1. Add staff — People / Staff Profiles  
2. Add doctor — People / Doctor Profiles  
3. Duplicate-person check — `duplicatePersonCheck` / createPerson  
4. Effective-dated engagement — Engagements + overlap guard  
5. Credential add/verify — Credentials  
6. Readiness + blockers — Overview / readiness service  
7. Leave request/approve — Leave & Availability (no self-approval)  
8. Availability — Leave & Availability (invalidates readiness)  
9. Restriction + sensitivity masking — Restrictions  
10. Onboarding start/complete — Onboarding  
11. Offboarding + transfer — Offboarding + M02 incomplete sync  
12. Suspend / reinstate — person service  

---

## 6. Permissions

Codes: `workforce.view`, `workforce.create`, `workforce.edit`, `workforce.assign_clinic`, `workforce.manage_engagement`, `credential.verify`, `leave.approve`, `restriction.view_sensitive`, `restriction.manage`, `onboarding.manage`, `offboarding.manage`, `workforce.suspend`, `workforce.reinstate`, `workforce.export`.

Enforced in services via `assertM04Permission` + optional `assertM04ClinicScope`. Sensitive fields masked in service output without `restriction.view_sensitive`. Demo Act-as mapped separately; not production bypass.

---

## 7. M01 / M02 adapter evidence

| Adapter | Evidence |
|---|---|
| M02 | `m04::credential-expired::${id}`, `m04::offboarding-incomplete::${id}`; find-then-update; tests pass |
| M01 | `getWorkforceCounts(clinicId?)` + `WorkforceProjectionSummary` on Command Centre overview |

---

## 8. Automated tests

| Suite | Pass | Fail | Blocked |
|---|---|---|---|
| `test:workforce` | 18 | 0 | 0 |
| `test:auth` | 16 | 0 | 0 |
| `test:m04` | 15 | 0 | 0 |
| **Total** | **49** | **0** | **0** |

`npm run build` — success (Next.js 16.2.10).

---

## 9. Browser / responsive / accessibility

Source: `docs/audits/wave2-m04-browser-evidence.json` (Playwright Chromium, `http://localhost:3001`).

| Summary | Count |
|---|---|
| Total checks | 25 |
| Pass | 25 |
| Fail | 0 |
| Blocked | 0 |

Includes: workspace load, 12 section deep-links, nav URL write-back, legacy `/staff` `/doctors` `/hr-docs`, M01 workforce card, responsive widths **1440 / 1280 / 1024 / 768 / 430 / 390** (no page-level horizontal overflow), section nav `aria-label` + `aria-current`.

Accessibility findings: labelled section nav; active section announced via `aria-current="page"`; loading Suspense status text. Full WCAG audit not claimed.

Defects found/repaired during evidence: Playwright Credentials button strict-mode collision — scoped to section nav.

---

## 10. Unresolved risks / limitations

- Live Postgres not required for Wave 2 localStorage SoT; auth SQL remains portable until `DATABASE_URL`.
- M01 staffing panel still uses historical CC demo staffing snapshots; new M04 card is the authoritative people/readiness projection.
- Dark/light appearance follows shell theme; not separately matrix-tested beyond responsive widths.
- Modules 5/6/7/11/22 remain landings — intentional.

---

## 11. Prohibited work confirmation (at Wave 2 delivery)

- M05, M06, M07, M11, M22 workspaces: **not developed in Wave 2**  
- Wave 3 execution: **not approved** (planning only until owner says otherwise)  
- Legacy workforce data: **not deleted**  
- Dual-write portal + M04: **not implemented**  
- Auth architecture replacement: **not done**  

**Owner acceptance:** 27 July 2026 — Wave 2 **owner accepted and frozen**.  
**Next:** Wave 3 plan only until explicit Wave 3 execution approval.

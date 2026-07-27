# Workforce Family — Current-State Audit (Wave 0)

**Audit date:** 27 July 2026  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md` (v1.0)  
**Platform baseline:** `docs/architecture/PLATFORM_BASELINE_V1.md` — signed off  
**Codebase root:** `Development folder/`  
**Wave scope:** Inventory only. No module feature development.

---

## 1. Verdict

Modules **M04, M05, M06, M07, M11 and M22** exist as thin Next.js module shells under `Development folder/src/modules/`.

| Module | Register condition | Runtime behaviour today |
|---|---|---|
| **M04** Staff & Doctors | `partially-implemented` | Landing + staff/doctor directory partials (portal session records) |
| **M05** Roster | `legacy-html-fallback` | Landing only (section chips decorative) |
| **M06** Time & Attendance | `legacy-html-fallback` | Landing only |
| **M07** Staff Pay | `legacy-html-fallback` | Landing only |
| **M11** Training | `legacy-html-fallback` | Landing only |
| **M22** Recruitment | `legacy-html-fallback` | Landing only |

**Not present yet:**

- `src/platform/workforce/**`
- Module `repository/`, `storage/`, `adapters/`, `types/`, `sections/` folders under workforce modules
- Live `pulse.m04.*` … `pulse.m22.*` repository writes
- Cross-module workforce contracts or event bus

**Protected baseline intact:** `src/platform/**`, 24-module register, clinic/identity contexts, M01–M03 workspaces, legacy route redirects, Action Inbox / executive summary contracts.

---

## 2. Module file inventory

Each workforce module currently has exactly three files:

| Module | Folder | Files |
|---|---|---|
| M04 | `src/modules/m04-staff-doctors/` | `module.config.ts`, `StaffDoctorsModule.tsx`, `index.ts` |
| M05 | `src/modules/m05-roster/` | `module.config.ts`, `RosterModule.tsx`, `index.ts` |
| M06 | `src/modules/m06-time-attendance/` | `module.config.ts`, `TimeAttendanceModule.tsx`, `index.ts` |
| M07 | `src/modules/m07-staff-pay/` | `module.config.ts`, `StaffPayModule.tsx`, `index.ts` |
| M11 | `src/modules/m11-training/` | `module.config.ts`, `TrainingModule.tsx`, `index.ts` |
| M22 | `src/modules/m22-recruitment/` | `module.config.ts`, `RecruitmentModule.tsx`, `index.ts` |

### Module config constants

| Module | `MODULE_ID` | `MODULE_ROUTE` | `STORAGE_PREFIX` (declared only) |
|---|---|---|---|
| M04 | `staff-doctors` | `/staff-doctors` | `pulse.m04.` |
| M05 | `roster` | `/roster` | `pulse.m05.` |
| M06 | `time-attendance` | `/time-attendance` | `pulse.m06.` |
| M07 | `staff-pay` | `/staffpay` | `pulse.m07.` |
| M11 | `training` | `/training` | `pulse.m11.` |
| M22 | `recruitment` | `/recruitment` | `pulse.m22.` |

All six set `canCreateInboxEvents: false`, `contributesExecutiveSummary: false`, `forceNext: true` in the platform register.

### Composition note (M04)

`StaffDoctorsModule` returns `ModuleLanding` only. In practice `ModuleWorkspace` detects `hasPartial` for `staff-doctors` and renders `ModuleLanding` + `PartialBody` itself, **bypassing** the module entry for the partial path. This double-path ownership must be resolved in a later wave without breaking the current landing + directory experience.

---

## 3. Routes and legacy aliases

### Router layers

| Layer | Path |
|---|---|
| Dynamic page | `src/app/(portal)/[module]/page.tsx` |
| Workspace switch | `src/components/workspaces/ModuleWorkspace.tsx` |
| Register | `src/platform/module-registry/module-register.ts` |
| Legacy redirects | `src/platform/navigation/legacy-routes.ts` |
| Compat re-export | `src/lib/platform/legacy-routes.ts` |
| Catalogue | `src/lib/modules.ts` |

### Approved main routes → what loads

| Route | platformId | Component behaviour |
|---|---|---|
| `/staff-doctors` | `staff-doctors` | `ModuleLanding` + `StaffDirectoryWorkspace` / `DoctorsDirectoryWorkspace` |
| `/roster` | `roster` | `RosterModule` → `ModuleLanding` |
| `/time-attendance` | `time-attendance` | `TimeAttendanceModule` → `ModuleLanding` |
| `/staffpay` | `staff-pay` | `StaffPayModule` → `ModuleLanding` |
| `/training` | `training` | `TrainingModule` → `ModuleLanding` |
| `/recruitment` | `recruitment` | `RecruitmentModule` → `ModuleLanding` |

### Register-defined sections (chips today; only M04 partials change body)

**M04** `/staff-doctors?section=`:

| Section id | Label | Body today |
|---|---|---|
| `staff` | Staff | `StaffDirectoryWorkspace` |
| `doctors` | Doctors | `DoctorsDirectoryWorkspace` |
| `staff-profiles` | Staff Profiles | `StaffDirectoryWorkspace` (no distinct UI) |
| `doctor-profiles` | Doctor Profiles | `DoctorsDirectoryWorkspace` |
| `employment` | Employment | `StaffDirectoryWorkspace` (no distinct UI) |
| `credentials` | Credentials | `StaffDirectoryWorkspace` (no distinct UI) |
| `hr-documents` | HR Documents | `StaffDirectoryWorkspace` (no distinct UI) |
| `availability` | Availability | `StaffDirectoryWorkspace` (no distinct UI) |
| `offboarding` | Offboarding | `StaffDirectoryWorkspace` (no distinct UI) |

**M05** `/roster?section=`: `roster-grid` | `shift-swaps` | `publish` — landing chips only  
**M06** `/time-attendance?section=`: `attendance` | `clock-events` | `timesheets` | `exceptions` | `offline-reconciliation` — landing chips only  
**M07** `/staffpay?section=`: `pay-prep` | `exceptions` | `exports` — landing chips only  
**M11** `/training?section=`: `records` | `expiry` | `catalogue` — landing chips only  
**M22** `/recruitment?section=`: `vacancies` | `candidates` | `onboarding` — landing chips only  

### Legacy workforce redirects

| Incoming slug | Redirect target | Default section |
|---|---|---|
| `/staff` | `/staff-doctors` | `staff` |
| `/doctors` | `/staff-doctors` | `doctors` |
| `/hr-docs` | `/staff-doctors` | `hr-documents` |
| `/timeclock` | `/time-attendance` | `attendance` |
| `/sync-centre` | `/time-attendance` | `offline-reconciliation` |

Main routes already approved (no redirect): `/staff-doctors`, `/roster`, `/time-attendance`, `/staffpay`, `/training`, `/recruitment`.

Preserved query keys on redirect: `recordId`, `recordType`, `id`, `tab`, `category`, `clinicId`, `q`, `view`, plus optional `section` override.

### Related shell links (non-module)

- Dashboard shortcut to `/roster`
- Default nav favorites include `"roster"` (`nav-prefs` / sidebar migration)

---

## 4. Reusable components, forms, schemas and demo data

### UI used by M04 partials

| Asset | Path |
|---|---|
| Staff / doctor directories | `src/components/workspaces/HtmlSeedWorkspaces.tsx` |
| Module landing shell | `src/components/workspaces/ModuleLanding.tsx` |
| Create / staff wizard | `src/components/forms/CreateFormProvider.tsx` |
| Shared UI | `src/components/ui/` (`Metric`, `Panel`, `Table`, `Badge`, `Button`, `Tabs`) |
| Portal session bag | `src/lib/portal-context.tsx` |

### Field schemas (HTML extract — create forms)

Source: `src/lib/extracted/field-schemas.json` via `src/lib/forms/schemas.ts`

| Schema key | Workforce relevance |
|---|---|
| `staff` | M04 staff create |
| `doctors` | M04 doctor create |
| `hrDocs` | M04 HR documents (schema only; no section UI) |
| `training` | M11 create schema (unused by landing) |
| `roster` | M05 create schema (unused by landing) |
| `timeclock` | M06 create schema (unused by landing) |
| `staffpay` | M07 create schema (unused by landing) |
| `leave` | Leave form extract (future M04) |
| `shiftswap` | Shift swap extract (future M05) |
| `awardRules` | Award rules extract (future M07) |

**Absent:** `recruitment`, `syncCentre` create schemas.

Staff wizard: `src/lib/extracted/staff-wizard.json` (+ `.js.txt`). Doctors use schema create via `openCreate("doctors")`.

### Demo / seed data

| Asset | Path | Notes |
|---|---|---|
| Staff seed | `src/lib/extracted/staff.json` | **100** records (`staff_seed_NNN`) |
| Doctors seed | `src/lib/extracted/doctors.json` | **48** records |
| Re-exports | `src/lib/extracted/index.ts`, `src/lib/mock/data.ts` | `HTML_STAFF`, `HTML_DOCTORS` |
| M02 assignee names | `src/lib/action-inbox/mock-data.ts` → `STAFF_DIRECTORY` | Name list only |
| KPIs | Dashboard `activeStaff` / `activeDoctors` / `rosteredSessions` | Derived from seed lengths |

### Staff seed shape (representative fields)

`id`, `createdAt`, `updatedAt`, `name`, `role`, `sourceDesignation`, `employmentType`, `email`, `contactNo`, `locations[]`, `maxWeeklyHours`, `payRate`, `cprExpiry`, `immunisationStatus`, `bankReady`, `status`

These are flat directory records — not effective-dated engagements, credentials, or readiness models.

---

## 5. Storage and persistence today

### Declared module prefixes (no repository implementation)

`pulse.m04.` · `pulse.m05.` · `pulse.m06.` · `pulse.m07.` · `pulse.m11.` · `pulse.m22.`

Planned (architecture plan, not implemented):

```text
pulse.m04.workforce.*
pulse.m05.roster.*
pulse.m06.attendance.*
pulse.m07.staffpay.*
pulse.m11.training.*
pulse.m22.recruitment.*
```

### Actual persistence affecting workforce UX

| Key / pattern | Owner | Workforce relevance |
|---|---|---|
| Portal `records` (React state) | `portal-context.tsx` | Staff/doctor create is **in-memory only** for the session |
| `pulse.activeLocation` | Portal / clinic | Directory clinic filter |
| `pulse.lastModule` | Portal | Last visited module |
| `pulse.platform.context.clinics` | Platform | Shared clinic scope |
| `pulse.platform.context.identity` | Platform | Act-as identity |
| `pulse.platform.migrations` | Platform | Migration flags |
| `pulse.platform.sourceLinks` | Platform | Inbox source links |
| `pulse.v33.navPrefs` | Shell | Favorites default includes `"roster"` |
| `pulse.cc.*` / `pulse.cc.m1.*` | M01 | Staffing/finance **seed UI state** — not M04–M07 SoT |
| `pulse.m2.inbox.*` | M02 | WWCC / roster-approval **demo actions** |
| `pulse.org.m3.state` | M03 | Users with `trainingComplete`; permission `export.sensitive.payroll` |

`PLATFORM_STORAGE_REGISTER.md` documents platform + M01–M03 keys only. **No M04–M22 keys registered yet.**

---

## 6. Generic portal records still used by workforce partials

`INITIAL_RECORDS` in `portal-context.tsx` includes:

- `staff` ← `HTML_STAFF` (100)
- `doctors` ← `HTML_DOCTORS` (48)
- `checklists`, `accreditation` (non-workforce)

M04 partials read/write `records.staff` / `records.doctors` through `CreateFormProvider` → `setRecords`.

Generic `HtmlModuleFallback` can list any `records[htmlId]` created via schema — **not wired** into M05/M06/M07/M11/M22 landings.

Workforce modules do **not** publish Action Inbox events (`canCreateInboxEvents: false`).

---

## 7. Module 1–3 workforce expectations (must not regress)

### M01 — Command Centre

Paths: `src/components/workspaces/command-centre/*`, `src/lib/command-centre/*`

Must preserve:

- **Staffing & Roster** panel (`panel: "staffing"`) with `StaffingSnapshot` fields: `rostered`, `present`, `absent`, `late`, `unfilled`, `overtimeRisk`, `onLeave`, `agencyLocum`, `doctorCoverage`, gaps, cover recommendations
- Clinic health `staffingStatus`: `"Covered" | "Gap" | "Critical gap"`
- Search intent “staffing gaps for tomorrow” → staffing panel
- Finance rollup field `staffPay`
- Compliance demo narratives (CPR / privacy training / credential expiry)
- Storage isolation under `pulse.cc.*` / `pulse.cc.m1.*`
- Default layout card `"staffing"` — “Staffing & Roster”
- Rule: cover recommendations only — staff are not moved between clinics from this dashboard

### M02 — Action Inbox

Must preserve:

- Seed **WWCC expired** action (`sourceRecord: HR-DOC-WWCC-441`, related staff `STF-882`) — roster eligibility narrative
- Seed **roster publish Week 30** multi-step approval — overtime / payroll estimate narrative
- Credential-exception template patterns
- `STAFF_DIRECTORY` assignee name list
- Notification badge / `pulse.m2.inbox.changed`
- Rule: inbox holds **projections only**; must not become workforce source of truth

### M03 — Organisation & Access

Must preserve:

- User profiles with `trainingComplete: boolean`
- `createdVia` including `"Existing staff record"`
- Exception permission `export.sensitive.payroll`
- Storage `pulse.org.m3.state`
- Related-module link to `staff-doctors`
- M03 → M02 projection bridge behaviour

---

## 8. Protected platform baseline checklist

| Check | Status |
|---|---|
| `src/platform/**` present | Yes |
| 24-module register | Yes — `module-register.ts` modules 1–24 |
| Clinic context | Yes — `clinic-context.tsx` |
| Identity context | Yes — `identity-context.tsx` |
| Legacy routes v1 | Yes — `legacy-routes.ts` |
| Shared contracts (source-record, inbox, notifications, audit, executive summary) | Yes |
| `src/platform/workforce/**` | **No** (Wave 1 target) |
| Global notification badge | Present (M02-driven) |
| Signed-off responsive behaviour | Baseline QA evidence under `docs/audits/` |

---

## 9. Plan section vs register section gap (inventory only)

Target sections from the controlling plan are richer than today’s register chips. This is recorded for migration planning; **register changes are out of Wave 0 scope**.

| Module | Register sections today | Plan Wave sections (target) |
|---|---|---|
| M04 | 9 chips (staff/doctors/profiles/employment/credentials/hr-docs/availability/offboarding) | Overview, People Directory, Staff/Doctor Profiles, Engagements, Credentials, Leave & Availability, Restrictions, Onboarding, Offboarding, Reports, Settings |
| M05 | 3 chips | Roster Board, Coverage, Open Shifts, Availability & Leave, Requests, Conflicts, Published History, Cost Forecast, Reports, Settings |
| M06 | 5 chips | Live Attendance, My Clock, Clock Events, Exceptions, Timesheets, Offline Reconciliation, Approval History, Reports, Settings |
| M07 | 3 chips | Pay Run Overview, People Review, Exceptions, Variances, Adjustments, Approval, Export, Reconciliation, History, Reports, Settings |
| M11 | 3 chips | Overview, Catalogue, My Learning, Assignments, Sessions, Assessments, Competencies, Certificates, Exemptions, Reports, Settings |
| M22 | 3 chips | Overview, Requisitions, Vacancies, Pipeline, Profiles, Interviews, References, Offers, Talent Pool, Promotion, Reports, Settings |

---

## 10. Related existing documentation

| Doc | Path |
|---|---|
| Controlling workforce plan | `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md` |
| Platform baseline V1 | `docs/architecture/PLATFORM_BASELINE_V1.md` |
| Project file structure | `docs/architecture/PROJECT_FILE_STRUCTURE.md` |
| Platform integration QA | `docs/audits/PLATFORM_INTEGRATION_QA.md` |
| Storage register | `PLATFORM_STORAGE_REGISTER.md` (repo root + Development folder) |

Wave 0 companion deliverable: `docs/architecture/WORKFORCE_FAMILY_DATA_MAP.md`.

---

## 11. Critical blockers for later waves (not repaired in Wave 0)

No **critical audit blockers** requiring code repair were found. Observed gaps are expected for Wave 1+:

1. No workforce contracts / event bus.
2. No module repositories or durable `pulse.m04.*`…`pulse.m22.*` storage.
3. Staff/doctor data is session-only portal state.
4. M05–M07/M11/M22 are landings only.
5. Register sections under-represent the plan’s target IA.
6. M04 module entry vs `ModuleWorkspace` partial ownership is duplicated.

---

## 12. Wave 0 stop confirmation

This audit completes the current-state inventory required by Wave 0.  
**No workforce module features were developed.**  
**Wave 1 was not started.**

# Wave 3 Implementation Plan — Module 11 Training & Learning

**Date:** 27 July 2026 (amended; execution clarifications applied)  
**Status:** **Owner accepted and frozen** (27 July 2026) — **not** production deployment-approved  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Prerequisite:** Wave 2 **owner accepted and frozen** (27 July 2026)  
**Acceptance evidence:** `Development folder/docs/audits/WAVE3_M11_COMPLETION_REPORT.md`

### Binding execution clarifications (27 July 2026)

1. M11 supplies versioned training-status contributions + explanations to M04; M04 owns combined readiness cache; M05 consumes M04/platform readiness only.
2. No M11 repository/service imports into M04 readiness — platform contracts/adapters/events only.
3. M11 owns learning certificates/qualifications as training outcomes; M04 owns workforce credentials on person/engagement.
4. All 11 sections must be functional (Sessions, Reports, Settings included).
5. Readiness/events: deterministic, idempotent, traceable, recalc on change, stale-event protected.
6. UX states must be functional components, not screenshots-only.
7. Clinic due/grace/overdue/expiry use clinic IANA timezone (no silent UTC proxy).

---

## 1. Exact scope and exclusions

### In scope

- Rebuild **Module 11 Training & Learning** as the authoritative SoT for learning catalogue, assignments, completions, assessments, competency evidence, qualifications-as-training-outcomes, exemptions and **versioned readiness policy inputs**.
- Replace M11 `ModuleLanding` with a full sectioned workspace (M03/M04 pattern).
- Drive **M04 readiness** through explainable, versioned policy evaluation (not a single hard-coded “training complete” flag).
- Publish workforce events; project to **M02 Action Inbox** and **M01** summaries via adapters.
- Provide a read-only **eligibility / readiness contract** for future M05 — no M05 workspace.
- Idempotent, non-destructive seed/migration; preserve Wave 1 scaffold and frozen Wave 2 data.

### Explicit exclusions

- Module 5 / 6 / 7 / 22 workspaces and payroll/roster/attendance SoT.
- Wave 4+ workflows.
- Production DB auth / server-side persistence (deferred).
- Replacing Wave 2 M04 person SoT or dual-writing portal staff/doctors.
- Destructive deletion of legacy training HTML seed or Wave 2 freeze assets.
- Changing Wave 1A auth architecture.
- Treating course completion as automatic verified competency without a versioned policy rule.

---

## 1A. Domain distinctions (mandatory)

These concepts are **separate domain types**. They must not be collapsed into one “trained” boolean.

| Concept | Definition | Owning store | May alone satisfy readiness? |
|---|---|---|---|
| **Learning content** | Catalogue item / curriculum material / session content descriptor | M11 catalogue | No — content is not evidence of person status |
| **Course completion** | Record that a person completed a specific course **version** (with evidence metadata) | M11 completions / assignments | **Only if** a versioned policy rule explicitly maps that completion → requirement satisfaction |
| **Assessment result** | Scored or pass/fail outcome of an assessment attempt | M11 assessments | Only if policy rule requires/allows it for that requirement |
| **Verified competency** | Attested practical/observed competence against a competency definition | M11 competencies | Only if policy rule requires competency (not mere completion) |
| **Qualification** | Formal training qualification outcome issued/recognised by M11 (distinct from licence) | M11 certificates/qualifications collection | Per policy (often advisory or blocking by requirement type) |
| **Workforce credential** | Licence/registration/credential held on the **person** (e.g. AHPRA) | **M04** credentials | M04 owns; M11 must not duplicate as a person credential |
| **Compliance / readiness outcome** | Derived evaluation result for a person at a point in time | **M04** readiness cache fed by policy | Derived only — never manually set to Ready |

**Hard rule:** Course completion **must not** automatically establish verified competency unless a **versioned policy rule** explicitly permits that mapping (rule id + version recorded on the readiness explanation).

---

## 2. Modules and workflows included

### Module roles

| Module | Role in Wave 3 |
|---|---|
| **M11 Training** | Primary build — SoT for learning, assignments, completions, assessments, competency evidence, exemptions |
| M04 Staff & Doctors | People/engagements SoT; consumes readiness **policy evaluation** inputs from M11 |
| M02 Action Inbox | Deduplicated actionable projections |
| M01 Command Centre | Summary projection consumer |
| M03 Organisation | Clinic/org scope context only |
| M05 Roster | Read-only eligibility/readiness **contract** only |
| M12 Compliance | Controlled compliance **references** only; no M12 ownership of training SoT |

### Sections

| Section id | Label |
|---|---|
| `overview` | Overview |
| `catalogue` | Catalogue |
| `my-learning` | My Learning |
| `assignments` | Assignments |
| `sessions` | Sessions |
| `assessments` | Assessments |
| `competencies` | Competencies |
| `certificates` | Certificates & Expiry |
| `exemptions` | Exemptions |
| `reports` | Reports |
| `settings` | Settings (incl. readiness policy versions) |

Legacy aliases: `records` → assignments/certificates; `expiry` → certificates; `catalogue` → catalogue.

### Ten minimum workflows

| # | Workflow |
|---|---|
| 1 | Create versioned training requirement / course version |
| 2 | Create role/clinic assignment rule |
| 3 | Assign training automatically (rule) and manually |
| 4 | Complete training with evidence (external learning / upload) |
| 5 | Record assessment and reassessment |
| 6 | Record observed competency + assessor attestation |
| 7 | Verify certificate / qualification |
| 8 | Request/approve time-limited exemption (with audit) |
| 9 | Trigger retraining after role/engagement change |
| 10 | Recalculate M04 readiness via versioned policy (explainable) |

---

## 2A. Versioning and recurrence

### Course and requirement versioning

- Every catalogue **course** has immutable **versions** (`version`, `effectiveFrom`, optional `effectiveTo`, `supersedesVersionId`).
- Every **requirement** (what readiness evaluates) binds to one or more allowed course/competency/assessment evidence types **by rule version**.
- Publishing a new course version never mutates prior version rows (append-only).

### Active assignments when a version changes

| Policy option (configurable per requirement rule) | Behaviour |
|---|---|
| **Grandfather** | In-progress assignments on old version remain valid until due/complete; new assigns use new version |
| **Reassign** | Open assignments closed as `superseded`; new assignment created on new version with audit link |
| **Dual-run** | Old version remains acceptable until cutover date; after cutover only new version satisfies |

Default for safety-critical requirements: **reassign** open incomplete assignments; completed history on old version retained immutably.

### Recurring training

- Requirement defines `recurrence` (e.g. every N months from completion or fixed calendar).
- Completion creates next cycle due date; prior completions remain immutable history.
- States for assignment/requirement satisfaction: `due`, `grace`, `overdue`, `expired`, `superseded`, `revoked`, plus `assigned` / `in_progress` / `completed` / `exempt`.

### Clinic timezone

- All due/grace/expiry comparisons use the **clinic’s configured timezone** (from clinic context / org clinic record), not browser-local alone.
- Store timestamps in ISO UTC; display and day-boundary logic in clinic TZ.
- Policy evaluation `asOf` parameter is timezone-aware.

---

## 2B. Readiness policy (M04)

M04 readiness **must** be derived through **versioned, explainable policy rules** owned/configured in M11 settings (evaluation executed so M04 never trusts a single hard-coded training-complete flag).

Each readiness (or requirement) result **must** identify:

| Field | Meaning |
|---|---|
| `requirementId` / label | What was evaluated |
| `evidenceUsed` | Completion / assessment / competency / exemption / qualification refs |
| `ruleId` + `ruleVersion` | Applicable policy |
| `resultingStatus` | satisfied / blocked / advisory / unknown / exempt |
| `effectiveDate` | When this evaluation applies |
| `blockingReason` | Human-readable blocker if not satisfied |
| `remediationAction` | Next step (assign, complete, assess, renew, request exemption) |

Missing/stale inputs ⇒ **not Ready**. Manual Ready is forbidden.

---

## 2C. Exemptions

Lifecycle: **request → approval authority → evidence → effective period → expiry → review → revocation**, with full **audit history**.

| Field | Required |
|---|---|
| Requester, subject person, requirement | Yes |
| Justification + evidence refs | Yes |
| Approver (not self) | Yes — `training.exemption.approve` |
| `effectiveFrom` / `effectiveTo` | Yes |
| Review date (optional) | Per type |
| Status | requested / approved / rejected / expired / revoked |

### Does exemption satisfy readiness / roster eligibility?

| Exemption type (examples) | M04 readiness | M05 eligibility contract |
|---|---|---|
| Temporary operational (short grace) | May satisfy as `exempt` per rule version | Usually **advisory allow** with flag — never silent |
| Medical / protected | May satisfy readiness if rule allows; details **masked** from managers | Roster: typically **block or restricted** unless rule says otherwise |
| Role-transition bridge | Satisfies readiness only inside effective window | Eligibility only inside window |
| Permanent waiver | **Disallowed** by default; if ever allowed, explicit rule + dual approval | Explicit rule required |

Every exemption used as evidence appears in readiness explanation with rule/version.

---

## 2D. Evidence and competency

- **External learning:** provider name, external id, completion date, optional transcript ref.
- **Uploaded evidence:** file metadata (no silent binary overwrite); verify / reject workflow.
- **Practical assessment** + **manager/assessor attestation** (assessor id, timestamp, statement).
- **Immutable completion history:** corrections create **audited superseding records** (`supersedesId`, reason, actor); never silent in-place edits of completed outcomes.

---

## 3. Planned file inventory

### Create (`Development folder/src/modules/m11-training/`)

| Path | Purpose |
|---|---|
| `TrainingWorkspace.tsx` | Section nav + `?section=` deep-link write-back |
| `context.tsx` | Provider, actor, bootstrap |
| `permissions.ts` | Codes + clinic scope asserts |
| `types/domain.ts` | All domain types + policy/explanation shapes |
| `types/policy.ts` | Versioned readiness policy rules |
| `repository/local-store.ts` | Storage persistence |
| `services/catalogue-service.ts` | Courses / versions |
| `services/assignment-service.ts` | Rules, assign, complete, recurrence |
| `services/assessment-service.ts` | Assessment / reassessment |
| `services/competency-service.ts` | Observed competency + attestation |
| `services/certificate-service.ts` | Qualification/certificate verify |
| `services/exemption-service.ts` | Exemption lifecycle |
| `services/evidence-service.ts` | Upload/external evidence verify/reject |
| `services/policy-service.ts` | Evaluate explainable readiness contributions |
| `services/readiness-bridge.ts` | Package policy results / `TrainingStatusRef` for M04 |
| `services/bulk-assignment-service.ts` | Preview + submit bulk with safety |
| `services/events.ts` | Workforce events |
| `adapters/m11-inbox-sync.ts` | M02 dedupe projections |
| `adapters/m11-executive.ts` | M01 counts |
| `adapters/eligibility-projection.ts` | M05 read-only contract |
| `adapters/compliance-refs.ts` | Controlled refs for M12 |
| `sections/OverviewSection.tsx` | … |
| `sections/CatalogueSection.tsx` | … |
| `sections/MyLearningSection.tsx` | … |
| `sections/AssignmentsSection.tsx` | … |
| `sections/SessionsSection.tsx` | … |
| `sections/AssessmentsSection.tsx` | … |
| `sections/CompetenciesSection.tsx` | … |
| `sections/CertificatesSection.tsx` | … |
| `sections/ExemptionsSection.tsx` | … |
| `sections/ReportsSection.tsx` | … |
| `sections/SettingsSection.tsx` | Policy versions UI |
| `sections/index.ts` | Barrel |
| `storage/bootstrap.ts` | Client bootstrap |
| `storage/seed-safe.ts` | Idempotent non-destructive seed |
| `storage/migrate-from-legacy.ts` | Legacy extract → M11 (optional) |
| `tests/m11-domain.test.ts` | Domain/policy/versioning |
| `tests/m11-authz.test.ts` | Permissions + clinic |
| `tests/m11-migration.test.ts` | Seed/idempotency/rollback |
| `tests/m11-adapters.test.ts` | Inbox/eligibility/readiness bridge |

Also at execution: `Development folder/scripts/wave3-m11-acceptance-evidence.mjs`.

### Modify

| Path | Change |
|---|---|
| `TrainingModule.tsx` | Mount workspace |
| `module-register.ts` | 11 sections; inbox + exec flags; condition |
| `ModuleWorkspace.tsx` | Full `training` entry |
| `legacy-routes.ts` | Canonical section aliases |
| `PLATFORM_STORAGE_REGISTER.md` | Expand keys + seed migration ids |
| `m04/.../readiness-service.ts` | Consume policy explanations / M11 bridge |
| `WORKFORCE_CONTRACTS.md` | Domain distinctions + policy bridge |
| `.cursor/rules/hcdp-wave-control.mdc` | Post-execution status only |

### Storage keys (expand beyond Wave 1 skeleton)

`pulse.m11.training.{meta,catalogue,assignments,assessments,competencies,certificates,exemptions,completions,evidence,policies,audit,ui}` — exact set confirmed at execution; Wave 1 empty collections retained.

---

## 4. Data-ownership matrix

| Data | Owner | Consumers | Notes |
|---|---|---|---|
| Workforce people / engagements | **M04** | M11 (personId only) | No M11 person SoT |
| Workforce credentials (licence etc.) | **M04** | Readiness policy may reference | Not duplicated in M11 |
| Learning catalogue & versions | **M11** | — | |
| Assignments / completions | **M11** | M04 policy, M02 | Immutable history |
| Assessments | **M11** | Policy | Sensitive detail masked |
| Competency evidence | **M11** | Policy | |
| Exemptions | **M11** | M04 policy, M05 eligibility | |
| Readiness outcome cache | **M04** | M01, M05 contract | Derived + explainable |
| Action inbox items | **M02** | — | Projections only |
| Compliance accreditation SoT | **M12** | May ref M11 controlled refs | No write into M11 |

**No cross-module repository imports or direct writes.**

---

## 5. Integration-contract matrix

| From → To | Contract | Direction |
|---|---|---|
| M11 → M04 | Policy evaluation inputs / `TrainingStatusRef` + explanation objects | Events + bridge service; M04 recalculates |
| M11 → M02 | Overdue / expired cert / exemption ending projections | Adapter; dedupe keys; update/close |
| M11 → M01 | Training summary counts | Read-only adapter |
| M11 → M05 | `getTrainingEligibilityForPerson(personId, clinicId, asOf)` | Read-only; no M05 UI |
| M11 → M12 | Controlled compliance references (ids, status, deep-link) | Read-only refs |
| M04 → M11 | `engagement.changed` / `worker.status.changed` | Retraining triggers |
| M03 → M11 | Clinic/identity context | Shared platform context only |

---

## 6. Permission matrix

| Code | Learner | Manager | HR/Training admin | Assessor | Auditor |
|---|---|---|---|---|---|
| `training.view` | own | clinic | all scoped | scoped | all view |
| `training.manage_catalogue` | — | — | Yes | — | — |
| `training.assign` | — | clinic | Yes | — | — |
| `training.complete` | own | limited | Yes | — | — |
| `training.assess` | — | — | Yes | Yes | — |
| `training.competency.record` | — | attest* | Yes | Yes | — |
| `training.certificate.verify` | — | — | Yes | — | — |
| `training.exemption.request` | own | clinic | Yes | — | — |
| `training.exemption.approve` | — | — | Yes | — | — |
| `training.evidence.verify` | — | — | Yes | Yes | — |
| `training.export` | — | summary | Yes | — | Yes |
| `training.view_sensitive_evidence` | — | — | Yes | Yes | Yes |

\*Manager attestation only where policy allows; **no** unnecessary assessment score or sensitive evidence detail in manager views.

All codes + clinic scope enforced in **services**. UI visibility is not the security boundary. No self-approval of exemptions.

---

## 7. Bulk-operation safety

Bulk assign / remind / complete **must** include:

1. Eligibility pre-check (person active, clinic scope, duplicate prevention).  
2. Preview of intended creates/skips/errors.  
3. Explicit confirmation.  
4. Partial-success reporting (succeeded / skipped / failed counts + ids).  
5. Audit evidence for the batch.  
6. Notification-volume controls (cap / digest / suppress duplicates).

---

## 8. Privacy and access

| Role | Sees | Must not see (by default) |
|---|---|---|
| Learner | Own assignments, due dates, own evidence status | Others’ assessments |
| Manager | Compliance status, overdue, clinic rollups | Full assessment narratives, sensitive medical exemption detail |
| HR/Training admin | Catalogue, rules, exemptions, bulk | — (within clinic/org scope) |
| Assessor | Assessment/competency tasks assigned | Unrelated HR exemptions |
| Auditor | Read-only wide view + audit trail | Mutate |

---

## 9. Seed and migration safety

| Rule | Requirement |
|---|---|
| Idempotent | Re-run does not duplicate |
| Non-destructive | **Never overwrite** existing M11 records |
| Seed ownership | Tag seed rows (`seedBatchId` / `source: seed`) |
| Rollback | Remove **only** seed-owned M11 records + seed/migration flags |
| Preserve | Wave 1 scaffold keys/migrations; **all frozen Wave 2** M04/auth/workforce data |
| Legacy | No dual-write; no destructive delete of legacy HTML/JSON |

Migrations: retain `m11-training-storage-v1`; add `m11-training-portal-seed-v1` (safe); `m11-training-policy-v1` for default policy pack (insert-if-absent).

---

## 10. Measurable performance targets

| Operation | Acceptance target |
|---|---|
| Initial role dashboard (`/training` overview) | ≤ **2.5s** interactive (warm build, mid laptop) |
| Catalogue search/filter (500+ items) | ≤ **300ms** filter apply; no full-page freeze |
| Assignment-list paging (page size 50, ≥5k rows) | ≤ **400ms** page change |
| Bulk-assignment preview (≤500 candidates) | ≤ **2s** |
| Bulk-assignment submission (≤500) | ≤ **5s** + progress feedback |
| M04 readiness recalculation (one person) | ≤ **100ms** typical |
| M04 readiness batch (≤200 persons) | ≤ **3s** |
| M02 projection generation (single condition sync) | ≤ **50ms**; no duplicate creates |

---

## 11. UX states, a11y, appearance, responsive

States: loading, empty, filtered-empty, restricted, validation-error, system-error, offline (documented demo limitation).

Appearance: light, dark, device.  
Widths: **1440, 1280, 1024, 768, 430, 390** — **zero** page-level horizontal overflow.  
A11y: keyboard-only paths, visible focus, labelled errors, `aria-current` on nav; WCAG 2.2 AA for primary flows.

---

## 12. Audit events and Action Inbox

- Append-only M11 audit + workforce event bus.  
- Inbox keys e.g. `m11::training-overdue::${id}`, `m11::certificate-expired::${id}`, `m11::exemption-expiring::${id}`.  
- Find-then-update/close; never duplicate on replay.

---

## 13. Acceptance evidence requirements

Must produce **fresh** dated evidence (historical Wave 2 evidence must not replace Wave 3 critical tests). Report **passed / failed / skipped / blocked** separately. Critical acceptance tests must not be skipped.

Required:

- Named tests for **all ten workflows**  
- Service-layer permission + clinic-scope tests  
- Versioning, recurrence, exemption, readiness-policy explanation tests  
- Migration / idempotency / rollback (seed-only) tests  
- Role-specific browser tests (learner, manager, HR admin, assessor, auditor)  
- Keyboard + accessibility evidence  
- Light / dark / device appearance  
- All designed states  
- Widths 1440–390; zero horizontal overflow  
- Full platform regression (`platform-integration-qa` + interactive notes)  
- `npm run lint`, `npx tsc --noEmit`, `npm run build`  
- Unit suites: workforce + auth + m04 + **m11** (no removal of prior suites)

---

## 14. Dependencies, risks, assumptions, deferred

**Dependencies:** Frozen Wave 2 M04; workforce contracts; clinic/identity contexts.  
**Risks:** Seed gaps → unknown readiness; over-blocking M05 eligibility; policy misconfiguration.  
**Assumptions:** Demo Act-as for perms; localStorage persistence in Wave 3.  
**Deferred:** Production DB auth; full LMS/SCORM; M05 UI; M12 accreditation SoT.

---

## 15. Stop gate

After Wave 3 **execution** (when approved):

1. M11 workspace complete; ten workflows evidenced.  
2. M04 readiness uses versioned policy explanations from M11.  
3. M02/M01/M05-contract/M12-refs integrations evidenced.  
4. Seed/migration safety proven; Wave 2 freeze intact.  
5. Full test/evidence matrix green with explicit counts.  
6. Completion report filed; **Wave 4 not started**.

**Stop.** Do not begin Wave 4.

### Execution gate (current)

**Wave 3 execution remains NOT APPROVED.** This document is planning only.

---

## Appendix A — Ten-workflow acceptance matrix

| # | Workflow | Unit | Service authz | Browser | Notes |
|---|---|---|---|---|---|
| 1 | Versioned requirement/course | Y | catalogue | Y | Version immutable |
| 2 | Assignment rule | Y | assign | Y | Role/clinic |
| 3 | Auto + manual assign | Y | assign + clinic | Y | Dedupe |
| 4 | Complete + evidence | Y | complete / evidence | Y | No silent edit |
| 5 | Assessment / reassessment | Y | assess | Y | Supersede on correction |
| 6 | Observed competency | Y | competency | Y | Attestation |
| 7 | Verify certificate/qualification | Y | certificate.verify | Y | |
| 8 | Exemption lifecycle | Y | exemption.* | Y | No self-approve |
| 9 | Retrain on engagement change | Y | event-driven | Y | M04 event |
| 10 | Policy readiness recalc | Y | bridge | Y | Explainable fields |

---

## Appendix B — Test / evidence matrix

| Evidence pack | Required | Counts reported |
|---|---|---|
| `test:m11` (+ authz/migration/adapters) | Pass | pass/fail/skip/blocked |
| `test:workforce` / `test:auth` / `test:m04` | Pass (regression) | same |
| Platform QA harness + interactive | Fresh rerun | same |
| Wave 3 Playwright acceptance | Ten workflows + roles + states + widths | same |
| lint / tsc / build | Pass | exit codes |

---

*End of amended Wave 3 planning document.*

# Wave 7 / M22 — Current-State Audit

**Document type:** Readiness discovery / current-state inventory only  
**Created:** 30 July 2026  
**Branch:** `agent/m22-readiness-discovery-20260730`  
**Baseline HEAD:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` (`origin/main`)  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Status:** **NOT owner-approved for implementation** — Wave 7 execution is not authorised  

**Non-claims:** This audit does not authorise Wave 7 / M22 implementation. It does not change production code, shared contracts, frozen evidence, or wave-control. It does not start Wave 8. It does not claim production readiness, certification, or live recruitment operations.

---

## A. Baseline verification

| Check | Result |
|---|---|
| Discovery branch | `agent/m22-readiness-discovery-20260730` |
| Pin | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| `origin/main` at discovery start | Identical |
| Scope of this commit | Discovery documents only |
| Wave 6 M07 Batches 1–6 | Owner accepted / closed (ordinary prep); PPA planned only |
| Waves 1A–5 | Owner accepted and frozen |
| Wave 7 / M22 | **Discovery only** |

---

## B. Verdict

M22 Recruitment exists as a **Wave 1 skeleton + ModuleLanding shell**. There is **no** candidate SoT runtime, **no** promotion journey, **no** M22 permissions catalogue, **no** M02/M01 projections from recruitment, and **no** AuthAdmin invite path from promotion.

Shared workforce contracts already define `CandidateRef`, `candidate.promoted`, storage prefix `pulse.m22.recruitment.*`, and a demo candidate fixture. M04 already owns people (including duplicate-person checks) and Auth already owns invite + `workforcePersonId` linking. Wave 7 must **compose** those frozen boundaries — not duplicate them.

| Capability | Current state |
|---|---|
| Candidate source of truth until promotion | **Absent** (empty storage skeleton only) |
| Requisition / vacancy / pipeline / offer workflows | **Absent** (landing chips only) |
| Promote → one M04 person | **Interface stub only**; no implementation |
| Idempotent `candidate.promoted` producer | **Event type defined**; no M22 producer |
| AuthAdminAdapter invitation after promotion | **Exists (server-only)**; M22 does not call it |
| Clinic / organisation scope on M22 records | **Contract fields present**; no M22 enforcement |
| Documents / credentials / consent | **Not implemented** in M22; M04 owns credentials post-hire |
| M02 action projections | Register `canCreateInboxEvents: false` |
| M01 vacancy / recruitment summaries | Register `contributesExecutiveSummary: false` |
| Direct M04 repository import from M22 | **Correctly forbidden in stubs**; still must stay forbidden |

---

## C. Architecture intent (authoritative)

From `HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`:

- **M22** is candidate and recruitment SoT **until approved promotion to M04**.
- After promotion, the person exists **once** in M04; other modules store refs only.
- Required event: `candidate.promoted` (idempotent).
- Wave 7 objective: controlled recruitment and one-way promotion into M04 without duplicate people.
- Stop condition: M22 complete with one tested candidate-to-workforce journey; then stop (Wave 8 is separate).

From `WORKFORCE_CONTRACTS.md` / Wave 1A–1 freeze:

- Communication path: `source module → module adapter → platform workforce service → destination projection`.
- Never import another module’s `repository/`.
- Auth identity id ≠ workforce person id; one profile → at most one M04 person when linked.
- `CandidateRef.promotedPersonId` records the post-promotion link without creating a second person store.

---

## D. Inventory — M22 module tree

| Path | Role | Runtime maturity |
|---|---|---|
| `src/modules/m22-recruitment/RecruitmentModule.tsx` | Entry — `ModuleLanding` only | Landing stub |
| `src/modules/m22-recruitment/module.config.ts` | `MODULE_ID=recruitment`, route `/recruitment`, `STORAGE_PREFIX=pulse.m22.` | Config only |
| `src/modules/m22-recruitment/index.ts` | Barrel exports | Skeleton |
| `src/modules/m22-recruitment/storage/keys.ts` | `pulse.m22.recruitment.*` keys + version 1 | Keys defined; empty collections |
| `src/modules/m22-recruitment/storage/migrations.ts` | `m22-recruitment-storage-v1` seeds empty arrays | Idempotent skeleton |
| `src/modules/m22-recruitment/repository/types.ts` | `M22RecruitmentRepository` + `promoteToWorkforce` signature | Interface only |
| `src/modules/m22-recruitment/repository/index.ts` | Re-exports types | No local-store |
| `src/modules/m22-recruitment/adapters/platform.ts` | Adapter type re-exports + migration runner hook | Stub; no M04/M02 writes |
| `src/modules/m22-recruitment/adapters/index.ts` | Barrel | Stub |

**Missing today (expected for Wave 7):** domain types, local-store, services (requisition/vacancy/candidate/interview/offer/promotion), permissions, sections/workspace UI, inbox/executive adapters, tests, evidence packs.

---

## E. Storage keys (defined, unused operationally)

Prefix: `pulse.m22.recruitment.`

| Key constant | Storage key | Seeded value |
|---|---|---|
| `meta` | `pulse.m22.recruitment.meta` | `{ version: 1, initializedAt }` once |
| `requisitions` | `…requisitions` | `[]` |
| `vacancies` | `…vacancies` | `[]` |
| `candidates` | `…candidates` | `[]` |
| `offers` | `…offers` | `[]` |
| `promotions` | `…promotions` | `[]` |

Migration id: `m22-recruitment-storage-v1`. Migrations must remain additive and must not rewrite accepted frozen-wave history.

---

## F. Shared contracts already available (frozen Wave 1 — do not rewrite)

| Asset | Path | Relevance |
|---|---|---|
| `CandidateRef` | `src/platform/workforce/contracts/candidate-ref.ts` | Pre-promotion ref; `promotedPersonId` |
| `createCandidateRef` | same | Factory with `/recruitment` route defaults |
| `candidate.promoted` | `src/platform/workforce/contracts/workforce-events.ts` | Required promotion event |
| Event envelope + idempotency | same | `eventId` / `idempotencyKey` / source version |
| `WorkforcePersonRef` | `src/platform/workforce/contracts/workforce-person-ref.ts` | Post-promotion person ref |
| Adapter interfaces | `src/platform/workforce/adapters/types.ts` | M02 / notify / audit / M01 slices |
| Demo candidate | `src/platform/workforce/demo/workforce-demo-refs.ts` | `cand_demo_001` / Jordan Lee / `promotedPersonId: null` |
| Contract tests | `src/platform/workforce/tests/workforce-contracts.test.ts` | Includes candidate ref |

**Discovery rule:** Wave 7 implementation may **consume** these contracts. Additive envelope fields require Integration ownership and owner review. Do not change frozen event semantics without CR.

---

## G. Register, navigation, IA gap

From `src/platform/module-registry/module-register.ts` (`recruitment`):

| Field | Current |
|---|---|
| Sections | `vacancies`, `candidates`, `onboarding` only |
| `canCreateInboxEvents` | `false` |
| `contributesExecutiveSummary` | `false` |
| `condition` | `legacy-html-fallback` |
| `forceNext` | `true` |
| Related modules | `staff-doctors` |
| Roles (register) | Enterprise + HR Manager / Clinic Manager / Practice Manager |

Architecture Wave 7 target sections (not yet registered): Overview, Requisitions, Vacancies, Candidate Pipeline, Candidate Profiles, Interviews & Assessments, References & Checks, Offers, Talent Pool, Promotion to Workforce, Reports, Settings.

Legacy landing chips historically noted: `vacancies` | `candidates` | `onboarding` (`WORKFORCE_FAMILY_CURRENT_STATE.md` — historical snapshot; M04/M05/M06/M07/M11 have since advanced; **M22 has not**).

App routing: no dedicated `src/app/**/recruitment` tree found; module is mounted via platform workspace / module registry patterns (same family as other forceNext modules).

---

## H. Promotion boundary — current vs required

### H.1 Interface intent (already documented in code)

`M22RecruitmentRepository.promoteToWorkforce`:

- Must be **idempotent**.
- Must call M04 via **adapter/contracts** — never edit M04 repo directly.
- Returns `{ candidate: CandidateRef; person: WorkforcePersonRef }`.

### H.2 M04 person creation (frozen Wave 2 — consumer boundary)

| Asset | Path | Notes |
|---|---|---|
| `createPerson` | `src/modules/m04-staff-doctors/services/person-service.ts` | Permission `workforce.create`; clinic scope; **name+email duplicate check** |
| `duplicatePersonCheck` | same | Soft-archived excluded |
| `toWorkforcePersonRef` | same | Safe ref for other modules |
| Engagement / credential / onboarding | M04 services / sections | Post-promotion SoT lives here |
| M04 inbox / executive adapters | `adapters/m04-inbox-sync.ts`, `m04-executive.ts` | Pattern for M22 adapters |

**Gap:** There is **no** M04-facing **promotion intake adapter** today that M22 can call without importing M04 repositories. Wave 7 must add an authorised write path (platform/M04 adapter) owned carefully so M22 never imports `m04-staff-doctors/repository/**`.

### H.3 Auth invite / identity link (frozen Wave 1A)

| Asset | Path | Notes |
|---|---|---|
| `AuthAdminAdapter` | `src/platform/auth/services/auth-admin-adapter.ts` | Server-only; `createInvitedIdentity` accepts optional `workforcePersonId` |
| Invitation APIs | `src/app/api/auth/invitations/**` | Permission `users.invite` |
| `relinkWorkforcePerson` | `src/platform/auth/services/workforce-link-service.ts` | Audited; one active profile per person |
| Identity separation | `docs/architecture/WORKFORCE_CONTRACTS.md`, auth contracts | Login ≠ person; suspend/archive login must not delete M04 person |

**Gap:** Promotion may create an M04 person **without** immediately inviting login. Owner must decide whether invite is mandatory on promote, optional, or a separate step. Browser M22 code must not call AuthAdminAdapter directly.

---

## I. M02 / M01 projection boundaries (current)

| Surface | Pattern to mirror | M22 today |
|---|---|---|
| M02 Action Inbox | Module adapter → `dispatchActionInboxEvent` / workforce action-inbox adapter | Disabled in register |
| M01 Executive | Module executive adapter → summary slice | Disabled in register |
| Architecture tests | M02 stage actions; M01 vacancy summary | Not implemented |

Frozen-wave evidence confirms M04/M05/M06/M07 project via adapters only. M22 must follow the same path when enabled.

---

## J. Documents, credentials, consent (current)

| Concern | Owner today | M22 today |
|---|---|---|
| Workforce credentials (WWCC, AHPRA, etc.) | **M04** credential SoT | None |
| Training / competency | **M11** (frozen) via M04 readiness | None |
| Recruitment-only notes / scorecards / references | Intended **M22** (architecture) | None |
| Offer versions / expiry | Intended **M22** | None |
| Consent / privacy for candidates | Required by Wave 7 tests; **not designed in code** | Open owner decision |
| Document transfer on promote | Architecture test: “Document/credential transfer rules” | Open — must not dual-own credentials in M22 after promote |

---

## K. Frozen-wave evidence relevant to candidate promotion

| Wave / asset | Relevance to M22 |
|---|---|
| Wave 1 / `WORKFORCE_CONTRACTS.md` | CandidateRef, events, storage prefixes, adapter path |
| Wave 1A auth audits / `AUTH_IDENTITY_CURRENT_STATE.md` | AuthAdminAdapter, invite, identity ≠ person |
| Wave 2 `WAVE2_M04_COMPLETION_REPORT.md` | M04 people SoT; M22 not developed; duplicate-person rules |
| Wave 2 `WAVE2_CHECKPOINT_STOP_BEFORE_WAVE3.md` | M22 landing + storage skeleton only |
| Wave 3 M11 completion | Explicitly excludes “M11-to-M04 workforce-credential promotion” — different from M22 hire promotion; do not conflate |
| Wave 4 M05 completion | Confirms no M22 recruitment records created |
| Wave 5 M06 freeze | Timesheet/attendance SoT; no M22 coupling required for hire |
| Wave 6 M07 Batches 1–6 | Payroll prep closed; M22 must not write `pulse.m07.*`; post-hire pay readiness is later journey (Wave 8) |
| `WORKFORCE_FAMILY_CURRENT_STATE.md` | Historical M22 landing inventory (pre–later-wave advances) |
| `WORKFORCE_FAMILY_DATA_MAP.md` | Candidate owned by M22 until promotion |

**Do not edit** accepted evidence files as part of discovery or future Wave 7 batches unless an evidence agent is authorised to add **new** Wave 7 evidence only.

---

## L. Demo / legacy surfaces

| Surface | Finding |
|---|---|
| `DEMO_CANDIDATE` | Present; not promoted |
| Portal HTML / `primaryHtmlId: recruitment` | Legacy fallback classification; Next forceNext landing is authoritative shell |
| Portal `records.*` staff/doctors | Must **not** become a second post-promotion person store |
| Generic portal schemas | Not wired as M22 SoT |

---

## M. Risks and readiness gaps (ranked)

1. **No M04 promotion intake adapter** — highest integration risk; without it agents will be tempted to import M04 repositories.
2. **Register IA under-represents Wave 7 sections** — registry + workspace must expand under Integration ownership.
3. **Auth invite sequencing undecided** — person-without-login vs invite-on-promote.
4. **Credential/document transfer rules undecided** — risk of duplicate credential stores.
5. **Permissions catalogue missing** — recruitment privacy / COI / offer access not modelled.
6. **Idempotency of promote** — must key on candidate id + source version and persist promotion ledger (`promotions` key exists empty).
7. **Parallel collision** with PPA planning / control docs / shared contracts if Wave 7 starts without lane ownership.
8. **Wave 8 journey bleed** — end-to-end onboarding→roster→pay must not be pulled into Wave 7 scope.

---

## N. Companion discovery outputs

| Document | Purpose |
|---|---|
| `docs/architecture/WAVE7_M22_INTEGRATION_BOUNDARY_MAP.md` | Read/write/forbid map |
| `docs/plans/WAVE7_M22_IMPLEMENTATION_PLAN_DRAFT.md` | Named batches, checkpoints, owner decisions |
| `docs/plans/WAVE7_M22_PARALLEL_LANE_AND_FILE_OWNERSHIP_DRAFT.md` | Safe parallel lanes + exact file ownership |

---

## O. Stop

Discovery inventory complete. **Do not implement M22** until the owner expressly authorises a named Wave 7 implementation batch against an accepted plan.

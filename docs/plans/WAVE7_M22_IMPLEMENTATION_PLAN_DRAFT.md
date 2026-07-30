# Wave 7 Implementation Plan Draft — Module 22 Recruitment & Talent Acquisition

**Date:** 30 July 2026  
**Status:** **DISCOVERY DRAFT ONLY — Wave 7 execution NOT approved**  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Baseline HEAD:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` (`origin/main`)  
**Discovery companions:**  
- `docs/audits/WAVE7_M22_CURRENT_STATE_AUDIT.md`  
- `docs/architecture/WAVE7_M22_INTEGRATION_BOUNDARY_MAP.md`  
- `docs/plans/WAVE7_M22_PARALLEL_LANE_AND_FILE_OWNERSHIP_DRAFT.md`  

```json
{
  "planningOnly": true,
  "discoveryOnly": true,
  "executionApproved": false,
  "ownerAccepted": false,
  "waveFrozen": false,
  "productionApproved": false,
  "implementsM22": false,
  "startsWave8": false
}
```

**Non-claims:** This draft does not authorise M22 implementation, shared-contract edits, frozen-evidence edits, PPA implementation, Module 8, payment execution, or production approval.

Paths are relative to the GitHub repository root (`ThoshiMedicals/HCDP`).

---

## 1. Exact scope and exclusions

### In scope (when owner later authorises execution)

- Rebuild **Module 22** as authoritative SoT for requisitions, vacancies, candidates, interviews, references/checks (recruitment-phase), offers, talent pool, and **one-way promotion** into M04.
- Replace `RecruitmentModule` landing with architecture Wave 7 sections.
- Persist under `pulse.m22.recruitment.*` with additive migrations.
- Publish idempotent `candidate.promoted`.
- Create **one** M04 person via adapter/contracts (no duplicate person stores; no M04 repository imports from M22).
- Optionally invite login via server `AuthAdminAdapter` boundary with `workforcePersonId`.
- Project stage/offer/promote actions to **M02** and vacancy summaries to **M01** via adapters.
- Enforce organisation/clinic scope and service-layer permissions.
- Preserve recruitment-only notes under recruitment permissions.
- Evidence packs and stop checkpoints per named batch.

### Explicit exclusions

- Wave 7 **execution** until named owner authorisation.
- Changing frozen Waves 1A–5 runtime/tests/evidence without defect/CR + owner review.
- Altering accepted M07 Batches 1–6 ordinary prep behaviour without CR.
- Implementing M07 PPA.
- Wave 8 end-to-end family journeys (roster/attendance/pay after hire) beyond the minimum promote→onboarding action handoff.
- Doctor pay (M08), bank/STP/super/payment execution.
- Direct cross-module repository imports/writes.
- Browser-side AuthAdminAdapter usage.
- Claiming award/employment-law certification or production approval.
- Rewriting shared workforce event enums without Integration + owner CR (consume `candidate.promoted` as already defined).

---

## 2. Repository dependency audit (as of discovery pin)

### 2.1 Existing M22 skeleton (reuse / extend)

| Path | Finding |
|---|---|
| `src/modules/m22-recruitment/RecruitmentModule.tsx` | Landing — replace with workspace on execution |
| `src/modules/m22-recruitment/module.config.ts` | `recruitment` / `/recruitment` / `pulse.m22.` |
| `src/modules/m22-recruitment/storage/keys.ts` | Keys for meta, requisitions, vacancies, candidates, offers, promotions |
| `src/modules/m22-recruitment/storage/migrations.ts` | `m22-recruitment-storage-v1` empty seed |
| `src/modules/m22-recruitment/repository/types.ts` | `promoteToWorkforce` contract comment already correct |
| `src/modules/m22-recruitment/adapters/platform.ts` | Stub adapters / migration hook |
| Registry `recruitment` | 3 sections; inbox/summary flags false |

### 2.2 Frozen contracts / services M22 may consume

| Asset | Use |
|---|---|
| `CandidateRef` / `createCandidateRef` | Candidate projections and links |
| `WorkforceEventEnvelope` + `candidate.promoted` | Promotion publish |
| `WorkforcePersonRef` | Post-promote ref |
| Workforce adapter interfaces | M02 / M01 / notify / audit |
| `publishWorkforceEvent` / `resolveWorkforceLink` | Platform bus |
| M04 `duplicatePersonCheck` **via adapter** (not repo import) | Pre-promote guard |
| `AuthAdminAdapter` (server) | Invite after person exists |
| `relinkWorkforcePerson` | Edge repair only; not normal promote path |

### 2.3 Exact files likely to change (execution foreshadow)

See also parallel-lane draft. Primary clusters:

**M22 feature (majority):**  
`src/modules/m22-recruitment/**` (domain, storage extensions, services, permissions, sections, workspace, adapters, tests)

**Integration hotspots (narrow, sequenced):**  
- `src/platform/module-registry/module-register.ts` (sections + flags)  
- New M04 promotion-intake adapter under `src/modules/m04-staff-doctors/adapters/` **or** platform write-port (owner/Integration decision)  
- Possibly thin `src/app/api/**` promote/invite orchestration  
- `docs/architecture/WORKFORCE_CONTRACTS.md` (documentation only if payload clarified; avoid breaking contract code)  
- New evidence under `docs/audits/WAVE7_*` only  

**Frozen / do not touch without CR:**  
M05/M06/M07/M11 domain, accepted Wave 2–6 evidence JSON/MD, wave-control rule (unless owner updates wave status after acceptance).

---

## 3. Candidate SoT until promotion

1. M22 stores candidates under `pulse.m22.recruitment.candidates` with organisation/clinic scope, stage, vacancy link, versions.
2. External modules reference candidates only via `CandidateRef`.
3. No M04 person id until promote succeeds (`promotedPersonId` null).
4. Authorised intake only (no anonymous dual-write from portal HTML as SoT).
5. Privacy: recruitment permissions gate PII, scorecards, and notes.

---

## 4. Promotion to one M04 person (no duplicate stores)

1. Pre-check duplicates (name+email and owner-approved alternate keys).
2. Idempotent ledger in `promotions`.
3. M04 intake creates person once; returns ref.
4. Candidate updated with `promotedPersonId`; remains historical SoT for recruitment artefacts.
5. Engagement creation: either same intake transaction or explicit follow-up batch — **owner decision Q5**.
6. Never create portal staff/doctor rows as the live person.

---

## 5. Idempotent `candidate.promoted`

| Requirement | Draft rule |
|---|---|
| Dedupe key | `m22::candidate.promoted::{candidateId}` (plus person id once known) |
| Ledger | Persist success before or atomically with event publish |
| Replay | Second promote returns same person; does not create second M04 row |
| Bus | Prefer `eventId === idempotencyKey` |
| Failure | Partial failure (person created, event not published) recoverable by republish without new person |

---

## 6. AuthAdminAdapter / invitation

| Mode | Behaviour |
|---|---|
| A — Promote only | Person + engagement/onboarding actions; invite later via Users admin |
| B — Promote + optional invite | UI checkbox; server invite with `workforcePersonId` |
| C — Promote requires invite | Hard dependency; compensate on invite failure |

**Draft recommendation:** **B** (safest operationally). Owner must choose (Q3).

---

## 7. Clinic / organisation scope

Service-layer checks on create/update/stage/offer/promote. Clinic-scoped actors cannot read/write out-of-scope candidates. Cross-organisation promotion forbidden.

---

## 8. Documents, credentials, consent

Batch-level rules in boundary map. Minimum Wave 7: store recruitment docs in M22; define explicit credential transfer command for items that become M04 credentials; keep consent flags on candidate; test that post-promote credential edits happen in M04 only.

---

## 9. M02 / M01

| Batch focus | Deliverable |
|---|---|
| Early | Adapter stubs + register flags remain false until wired |
| Mid | Stage/offer actions → M02 with source links |
| Late | Vacancy summary slice → M01; enable register flags with tests |

---

## 10. Proposed named batches and stop checkpoints

> Names are **draft**. Owner may rename/split before authorising execution.

### Batch 0 — Owner decisions gate (docs only)

- Resolve Q1–Q12 below.  
- **Stop:** No code until decisions recorded and execution authorised.

### Batch 1 — Foundation & IA shell

- Domain types; local-store; permissions skeleton; workspace shell; register section expansion.  
- Additive storage migration if new keys needed (interviews, scorecards, docs meta).  
- **Stop checkpoint 1.1:** Landing replaced; empty sections mount; migrations idempotent; no promote yet.  
- **Stop checkpoint 1.2:** Permission denials evidenced; clinic scope on list/get.

### Batch 2 — Requisition → Vacancy → Candidate intake

- CRUD + stage moves with owner/due date.  
- Authorised intake path.  
- **Stop:** Pipeline demo journey without offer/promote; M02 optional deferred.

### Batch 3 — Interviews, references/checks, offers

- Scorecards, COI, offer version/expiry, acceptance, pre-employment checklist.  
- **Stop:** Offer-accepted candidate ready for promote gate tests (still no M04 write).

### Batch 4 — Promotion intake boundary (Integration + M22)

- M04 promotion-intake adapter (no repo import from M22).  
- Duplicate check; promotions ledger; `candidate.promoted`; `promotedPersonId`.  
- **Stop checkpoint 4.1:** Idempotent promote unit tests green.  
- **Stop checkpoint 4.2:** No duplicate person on replay; evidence pack.

### Batch 5 — Auth invite option + onboarding actions

- Server invite path with `workforcePersonId` per Q3.  
- Onboarding actions via M02 and/or M04 onboarding publisher.  
- **Stop:** One tested candidate→person→(optional) invite journey.

### Batch 6 — M02/M01 projections, privacy, reports, hardening

- Enable inbox/summary flags; reports; a11y/responsive; performance smoke.  
- Document/credential transfer tests.  
- **Stop:** Wave 7 completion report; **do not start Wave 8**.

---

## 11. Owner decisions required

| ID | Decision needed | Draft recommendation |
|---|---|---|
| Q1 | Promote-ready gate (which checklist is mandatory)? | Offer accepted + pre-employment complete + duplicate check clear |
| Q2 | Duplicate match policy (block vs link-existing)? | **Block** by default; explicit “link existing person” is separate audited action |
| Q3 | Invite on promote: none / optional / required? | **Optional (B)** |
| Q4 | Create engagement in same promote transaction? | **Yes** — minimal primary engagement from vacancy clinic/org |
| Q5 | Doctor vs staff `personKind` from vacancy? | Vacancy declares kind; doctor vacancies still create M04 doctor person (not M08 pay) |
| Q6 | Credential transfer: copy vs reference vs manual re-entry? | Explicit transfer of verified items only; unverified stay M22 |
| Q7 | Recruitment note visibility after promote? | Remain M22-permissioned; not auto-copied to M04 notes |
| Q8 | Talent pool vs closed-candidate retention period? | Soft-retain; no hard delete; archive status |
| Q9 | Who holds `recruitment.promote` vs `workforce.create`? | Distinct M22 permission; intake adapter uses system/service actor rules owner-approved |
| Q10 | M04 intake adapter location (M04 adapters vs platform port)? | **M04 adapters** + thin platform façade if needed; M22 calls façade only |
| Q11 | Minimum `candidate.promoted` payload fields? | Per boundary map §6 |
| Q12 | Wave 7 UI design: reuse Premium Clinical Enterprise tokens only vs visual CR? | Tokens/patterns only; no global CSS rewrite |

---

## 12. Tests (from architecture — map to batches)

| Test theme | Batch |
|---|---|
| Candidate privacy and role access | 1–2, 6 |
| Conflict-of-interest handling | 3 |
| Offer version and expiry | 3 |
| Promotion idempotency | 4 |
| No duplicate M04 person | 4 |
| Document/credential transfer rules | 5–6 |
| M02 stage actions and M01 vacancy summary | 6 |
| Responsive/accessibility/build | 1 shell + 6 hardening |

---

## 13. Evidence expectations (when executing)

New files only, e.g.:

- `docs/audits/WAVE7_BATCH{n}_*`  
- Requirement traceability per batch  
- Completion report at Wave 7 stop  

Do not mutate `WAVE2_*`…`WAVE6_*` accepted packs.

---

## 14. Relationship to later waves

| Wave | Boundary |
|---|---|
| Wave 7 | Recruitment + one promote journey + onboarding actions |
| Wave 8 | Family journeys including post-hire roster/attendance/pay |
| PPA | Unrelated M07 prior-period adjustment — stay out |
| M08 | Doctor pay — stay out |

---

## 15. Stop

This document is a **discovery draft**. Await owner decisions (Batch 0) and explicit Wave 7 execution authorisation before any production code change.

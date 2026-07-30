# Wave 7 / M22 — Integration & Boundary Map

**Document type:** Architecture / integration boundary (discovery draft)  
**Created:** 30 July 2026  
**Baseline HEAD:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Parent audit:** `docs/audits/WAVE7_M22_CURRENT_STATE_AUDIT.md`  
**Parent plan draft:** `docs/plans/WAVE7_M22_IMPLEMENTATION_PLAN_DRAFT.md`  
**Status:** **NOT implementation authority**  

Architecture rule: `source module → module adapter → platform contract/service → destination projection`.  
**Never** import another module’s `repository/`.  
**Never** create a second person store after promotion.

---

## 1. What M22 owns (candidate SoT until promotion)

| Asset | Storage / home | Notes |
|---|---|---|
| Requisitions | `pulse.m22.recruitment.requisitions` | Create/approve lifecycle |
| Vacancies | `…vacancies` | Publish/close; clinic + organisation scope |
| Candidates | `…candidates` | Pipeline stage, owners, due dates |
| Interviews / scorecards / assessments | Extend M22 keys additively | Independent scorecards; COI handling |
| References & checks (recruitment-phase) | M22 | Not M04 credentials until transfer rules apply |
| Offers | `…offers` | Version + expiry |
| Talent pool | M22 | Pre-promotion only |
| Recruitment-only notes | M22 | Recruitment permissions; not general workforce notes |
| Promotion ledger | `…promotions` | Idempotency + audit of promote attempts/results |
| Meta / migration | `…meta` | Additive versions only |

Until promotion, **Candidate** is the person-shaped SoT. After successful promotion, operational workforce identity is **M04 Person**; candidate retains historical recruitment record with `promotedPersonId`.

---

## 2. What M22 may read

| Source | Mechanism | Purpose |
|---|---|---|
| M04 | `WorkforcePersonRef` + authorised **read** adapters / published refs | Duplicate-person check before promote; never write via M04 repo import |
| Platform clinic / org context | Platform context + M03 identity consumption | Scope enforcement |
| Platform workforce event bus | `publishWorkforceEvent` / resolve links | Emit `candidate.promoted`; resolve deep links |
| Auth (safe status only, where needed) | Server APIs / safe DTOs — not AuthAdmin from browser | Know whether invite already exists for email |
| Demo refs | `WORKFORCE_DEMO_REFS.candidate` | Controlled demos only |

---

## 3. What M22 may write (via adapters only)

| Destination | Mechanism | Payload / effect |
|---|---|---|
| M04 person + initial engagement (as owner-decided) | **New** M04 promotion-intake adapter / platform write port | Create **one** person; return `WorkforcePersonRef` |
| M04 onboarding actions | M04 lifecycle via adapter **or** M22→M02 projection that M04 also consumes | Architecture: “create onboarding actions” |
| Platform event bus | `candidate.promoted` (+ optionally follow-on `engagement.created` if M04 publishes it) | Idempotent |
| M02 Action Inbox | `WorkforceActionInboxAdapter` / inbox bridge | Stage actions, offer approvals, promote blockers |
| M01 Executive | `WorkforceExecutiveSummaryAdapter` | Vacancy / pipeline summary counts |
| Notifications / audit | Workforce notification + audit adapters | Offer sent, promote completed |
| Auth invite | **Server route** calling `AuthAdminAdapter.createInvitedIdentity` with `workforcePersonId` | Optional per owner decision; never from client adapter blindly |

---

## 4. What M22 must never own or rewrite

| Forbidden | Reason |
|---|---|
| Second durable person/doctor/staff profile store after promote | Architecture §2.2 |
| Direct import/write of `src/modules/m04-staff-doctors/repository/**` | Cross-module repository ban |
| Direct import/write of M05/M06/M07/M11 repositories | Frozen modules; wrong SoT |
| Writing `pulse.m07.*` / payroll prep | M07 closed ordinary scope; Wave 8+ journeys only |
| Claiming M04 credential SoT inside M22 after transfer | Credentials owned by M04 |
| Browser use of `AuthAdminAdapter` | Server-only privileged adapter |
| Treating unlock/reopen of other modules as “promotion” | Category error |
| Doctor pay (M08) / payment execution | Out of Wave 7 |
| Editing frozen Waves 1A–6 evidence or accepted runtime without CR | Wave control |
| Dual-write portal `records.staff` / `records.doctors` as live SoT | Legacy transition rules |

---

## 5. Promotion sequence (target boundary)

```text
1. Candidate reaches owner-defined promote-ready state
   (offer accepted + pre-employment complete + checks recorded — exact gate = owner decision)
2. Duplicate-person check against M04 (read adapter)
   - If match: block / merge decision (owner policy) — do not silent-create
3. Idempotency lookup in M22 promotions ledger
   - If prior success for candidateId: return existing CandidateRef + WorkforcePersonRef
4. Call M04 promotion intake (adapter) → create Person (+ engagement if in-batch)
5. Persist candidate.promotedPersonId; write promotions ledger; bump sourceVersion
6. Publish candidate.promoted (eventId === idempotencyKey preferred)
7. Project M02 onboarding / remaining actions; refresh M01 counts
8. Optionally request server invite with workforcePersonId
9. Preserve recruitment-only notes under M22 permissions
```

**One-way:** promotion does not delete candidate history. It does not allow M22 to remain SoT for the workforce person.

---

## 6. `candidate.promoted` event contract (consume as defined)

Envelope fields already required by workforce events:

- `eventId`, `eventType: "candidate.promoted"`, `sourceVersion`, `occurredAt`
- `activeIdentityId`, clinic/organisation scope
- `source` (`SourceRecordRef` to candidate)
- `idempotencyKey` (stable; prefer equality with `eventId`)
- `payload` — **owner/integration must define minimum payload** (recommended draft below; additive only)

**Recommended payload (draft — owner confirmation required):**

| Field | Purpose |
|---|---|
| `candidateId` | Source candidate |
| `personId` | New or existing M04 person id |
| `vacancyId` | Optional context |
| `organisationId` / `clinicIds` | Scope |
| `engagementId` | If created in same transaction |
| `invitationId` | If invite created |
| `promotionId` | M22 ledger id |

Consumers (future): M02 projections, M01 summaries, audit, optionally M04 onboarding listeners. M05/M06/M07 must **not** auto-create operational records from this event in Wave 7.

---

## 7. AuthAdminAdapter / invitation boundary

```text
M22 UI / service (browser)
  → POST authorised API (e.g. existing /api/auth/invitations or M22 promote API that serverside-invites)
    → AuthAdminAdapter.createInvitedIdentity({ workforcePersonId })
      → invitation + profile with nullable/linked workforcePersonId
```

| Rule | Detail |
|---|---|
| Separation | `authIdentityId` ≠ `workforcePersonId` ≠ `profileId` |
| Link | At most one active profile per person (`relinkWorkforcePerson`) |
| Permission | `users.invite` (auth) separate from recruitment promote permission |
| Failure mode | Person created + invite failed must be recoverable without duplicate person |
| Login removal | Must not delete M04 person (frozen Wave 1A behaviour) |

---

## 8. Clinic / organisation scope

| Rule | Detail |
|---|---|
| Organisation | Every requisition/vacancy/candidate/offer/promotion carries `organisationId` |
| Clinic | Vacancy and candidate scoped; actors with `clinicIds` cannot promote outside scope |
| Cross-org | Forbidden to promote into another organisation’s M04 person space |
| M04 alignment | Created person `organisationId` + `clinicIds` must match promotion scope |
| Filters | Clinic is subordinate filter under organisation (same family pattern as M07 Q8, without inventing a pay entity) |

---

## 9. Documents, credentials, consent boundaries

| Artefact class | Pre-promote owner | On promote | Post-promote owner |
|---|---|---|---|
| CV / application docs | M22 | Retain in M22; optional copy metadata | M22 historical |
| Recruitment scorecards / COI notes | M22 | Stay in M22 | M22 |
| Pre-employment check evidence | M22 (phase) | Transfer **rule** → M04 credential or checklist item | M04 if workforce credential; else M22 archive |
| Regulatory credentials | Should not be “live” M04 credentials until verified transfer | Explicit transfer command | **M04** |
| Consent / privacy flags | M22 candidate record | Persist; do not strip on promote | M22 + audit |
| Offer PDFs | M22 | Retain versions | M22 |

**Hard rule:** After promotion, do not keep a parallel editable “staff credential” store in M22 that can diverge from M04.

---

## 10. M02 action projections

| Trigger examples | Projection intent |
|---|---|
| Stage SLA overdue | Action with source link to candidate |
| Offer approval required | Action to approver |
| Pre-employment incomplete | Blocking action before promote |
| Promote succeeded | Onboarding actions (or hand to M04 onboarding publisher) |
| Conflict of interest declared | Restricted review action |

Path: M22 adapter → platform action-inbox bridge → M02 storage. Source links must open exact M22 records (`CandidateRef.route` / section).

Enable `canCreateInboxEvents: true` only when adapter + tests exist.

---

## 11. M01 summaries

| Slice examples | Notes |
|---|---|
| Open vacancies count | Clinic-filtered |
| Candidates in offer / pre-employment | Not a second people count |
| Promotions this period | Optional |

Must not replace M04 workforce ready/blocked counts. Enable `contributesExecutiveSummary: true` only with executive adapter + tests.

---

## 12. Migration and legacy preservation

| Rule | Detail |
|---|---|
| Additive migrations | Extend `m22-recruitment-storage-v*` via `runMigrationOnce` |
| Empty v1 skeleton | Preserve; do not delete keys |
| Portal HTML recruitment | Keep legacy route compatibility; Next workspace is forceNext SoT UI |
| Demo candidate | May seed controlled demo under labelled `demo-seed`; not live hire data |
| Frozen modules | No rewrite of accepted M04–M07/M11 history |
| Dual-write ban | Do not write portal staff/doctor session records as promotion side effect |

---

## 13. Data-source labelling (recommended)

| Label | Meaning |
|---|---|
| `demo-seed` | Controlled demo candidate/vacancy |
| `authorised-intake` | Candidate created via authorised M22 intake |
| `promotion-ledger` | Idempotent promote record |
| `m04-person-ref` | Post-promote link only |
| `recruitment-only` | Notes/docs not transferred |

---

## 14. Stop / non-claims

This map does not authorise implementation. It does not change shared contracts. Wave 8 end-to-end journeys remain out of Wave 7.

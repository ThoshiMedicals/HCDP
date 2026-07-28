# WAVE 6 / M07 Batch 3 — Checkpoints 3.3–3.4 Evidence

**Status:** COMPLETE  
**Authorisation:** Owner Wave 6 / M07 Batch 3 execution.

---

## Checkpoint 3.3 — People Review UI, permissions, rate redaction

### Implemented
- `sections/PeopleReviewSection.tsx` — People Review workspace (loading/empty/denied/blocked/redacted/success affordances; responsive table layout; deep-link section `people`).
- `services/people-review-read-model.ts` — assembles M04 identity hints, mapping status, calc readiness/blockers, ordinary/OT summary, leave summary; redacts rates and external ids without `payroll.rate.view` / `payroll.externalId.view`.
- `services/profile-service.ts` — external payroll employee id link/relink requires reason; audit action `profile.externalId.relink`.
- Service-layer permission checks on view/calculate/profile/exception paths (not UI-only).
- Clinic-manager role lacks rate view → redacted service responses.

### Tests
- redacts rates for clinic managers and requires reason for external id
- marks people and leave sections available
- mutation matrix accepts `profile.externalId.relink`
- existing `m07-authz` / shell responsive + a11y cases remain green

### Evidence result
**PASS**

---

## Checkpoint 3.4 — M04 approved leave preparation and Leave UI

### Implemented
- `adapters/m04-leave-read.ts` — reads `pulse.m04.workforce.leave` via platform storage (+ test inject); **no** M04 repository/service imports; never writes M04.
- `services/leave-prep-service.ts` — generates non-certified leave prep lines; stores M04 source record id + version; rejects doctors, unmapped leave; opens `leave-mapping-missing` / unsupported leave exceptions.
- Storage: dedicated `pulse.m07.staffpay.leavePrepLines` (`M07_STORAGE_KEYS.leavePrepLines`); schema **v6** (`migrate-v6.ts`).
- `sections/LeavePrepSection.tsx` — dedicated Leave section; Allowances banner **“Planned for Batch 4”** (no allowance actions).
- Nav label may remain “Leave & Allowances” with Batch 4 note in `section-meta.ts`.

### Tests
- creates leave prep lines from approved M04 leave and ignores snapshot leaveInputs
- opens leave-mapping-missing when mapping absent
- migration asserts `leavePrepLines` array after bootstrap

### Evidence result
**PASS** — leave originates only from approved M04 reads; M06 leaveInputs not used as SoT.

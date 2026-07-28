# Wave 6 — M07 Permissions Matrix

**Status:** PLANNING ONLY  
**Parent plan:** `docs/architecture/WAVE6_M07_IMPLEMENTATION_PLAN.md`  
**Owner Batch 1–2:** org-as-legal-entity; SoD; Pay approver final approve; Export operator post-approval only; clinic-manager no rates; no unlock/doctor override

---

## Canonical permission codes (planned)

| Code | Description |
|---|---|
| `payroll.view` | View non-sensitive pay-run / readiness summaries |
| `payroll.rate.view` | View rates, rate history, monetary values, sensitive profile fields |
| `payroll.period.create` | Create draft pay periods (organisation id required) |
| `payroll.period.edit` | Edit open period metadata / clinic tags |
| `payroll.period.lock` | Lock period — **Pay approver or Pay admin only** (Q20) |
| `payroll.export.profile.edit` | Create/version/activate/retire export profiles — **Pay admin** (Q22) |
| `payroll.entity.settings` | Edit organisation-keyed cadence and SoD defaults (not org master data) |
| `payroll.intake.run` | Event intake processing + missed-event refresh |
| `payroll.profile.edit` | Create/edit pay profiles |
| `payroll.rules.edit` | Edit non-certified rule-table versions (effective-dated, audited) |
| `payroll.calculate` | Run calculation / recalculation (open periods only) |
| `payroll.exception.view` | View exceptions |
| `payroll.exception.resolve` | Resolve exceptions |
| `payroll.exception.waive` | Waive **waivable** blockers — **Pay approver or Pay admin only** (Q15) |
| `payroll.externalId.view` | View external payroll employee id |
| `payroll.externalId.edit` | Set/rotate external payroll employee id (audited) |
| `payroll.codes.edit` | Edit non-certified allowance/deduction code list (Q18) |
| `payroll.adjust` | Adjustments / prior-period adjustments |
| `payroll.review.submit` | Submit period for approval |
| `payroll.approve` | **Final** approve/reject export-ready (Pay approver) |
| `payroll.export.create` | Generate CSV+JSON **after** valid approval |
| `payroll.export.reconcile` | Record external results |
| `payroll.audit.view` | View audit history |
| `payroll.report.view` | View reports (redacted without rate.view) |
| `payroll.settings.edit` | Module settings |
| `payroll.bulk` | Bulk operations |
| `payroll.override` | Narrow override with reason (not doctor-pay override in Wave 6) |

**Not in Wave 6:** `payroll.period.unlock`, doctor/M08 inclusion override codes.

---

## Role → permission map (Q9 + Q12 — decided)

| Working role | Grants | Explicit denials |
|---|---|---|
| Pay clerk | view, rate.view, intake.run, profile.edit, calculate, exception.view/resolve, adjust, review.submit, report.view, externalId.view | `payroll.approve`; **`payroll.exception.waive`** |
| Pay reviewer | view, exception.view, report.view | approve, waive, export.create |
| Pay approver | view, rate.view, **approve**, exception.view, **waive**, **period.lock**, audit.view | — |
| Export operator | view, **export.create**, **export.reconcile**, report.view, audit.view, externalId.view | approve; waive; **period.lock**; profile edit |
| Pay admin | period.*, entity.settings, profile.edit, rules.edit, codes.edit, **export.profile.edit**, settings.edit, **period.lock**, adjust, waive, audit.view, bulk, externalId.* | Bypass non-waivable / cross-entity |
| Clinic manager | view, exception.view, report.view | **rate.view**; waive; approve |

---

## Separation of duties + export gate (Q5 + Q12)

| Rule | Enforcement |
|---|---|
| SoD default on per organisation | `separationOfDuties: true` |
| Sole calculate/submit actor ≠ sole final approver | `payroll.approve` / bulk → `separation-of-duties` |
| Export operator cannot self-approve | No `payroll.approve` (or SoD deny) |
| Export create requires valid approval | Missing/stale/revoked/wrong-entity → fail; no package |
| Delegation | Resolve to real user before SoD / role checks |

---

## Rate redaction (Q9)

| Actor without `payroll.rate.view` | Service/DTO must omit |
|---|---|
| Clinic manager (default) | rates, rate history, monetary totals, sensitive profile fields |
| Any other actor lacking code | same |

May still receive: identity, clinic, approved hours, readiness, non-rate missing-input flags, permitted approval progress.  
**UI-only hiding is insufficient.**

---

## Legal-entity / clinic scope (Q1 + Q8)

| Check | Rule |
|---|---|
| `assertM07Permission` | Code required |
| `assertM07LegalEntityScope` | Target organisation id ∈ actor entities |
| `assertM07ClinicScope` | Clinics ⊆ actor clinics when scoped |
| Org existence | Resolve organisation; fail if missing |
| Engagement org | Engagement.organisationId must match period |
| Cross-org package | Always denied |

---

## Waiver matrix (Q15)

| Class | Examples | Who | Notes |
|---|---|---|---|
| Waivable | Selected missing-rate / leave-mapping gaps | Pay approver or Pay admin | Reason + full audit + recalc/reapproval if result changes |
| Non-waivable | Cross-entity; doctor/M08; stale approval; duplicate intake | Nobody in Wave 6 | Hard deny |

Clerk/preparer waive attempts → `permission-denied` / `separation-of-duties`.

---

## Prohibited fields (Q13)

Services must reject persistence of TFN, bank account, BSB, super member number, banking credentials, payment instructions. External payroll employee id is the only banking-adjacent identifier allowed (gated).

---

## M03 boundary

- M03 does not own M07 catalogue.
- M07 does not rewrite organisation master data.
- Demo mapper maps Act-as → M07 codes at execution.

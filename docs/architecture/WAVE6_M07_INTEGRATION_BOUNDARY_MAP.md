# Wave 6 — M07 Integration & Boundary Map

**Status:** PLANNING ONLY  
**Parent plan:** `docs/architecture/WAVE6_M07_IMPLEMENTATION_PLAN.md`  
**Owner Batch 1–2:** org id as legalEntityId; doctor/M08 exclude; leave read; rate redaction; Pay approver / Export operator split

Architecture rule: `source module → module adapter → platform contract/service → destination projection`.  
**Never** import another module’s `repository/`.  
**Never** create a second organisation or workforce SoT.

---

## 1. What M07 can read

| Source | Mechanism | Purpose |
|---|---|---|
| M06 | `TimesheetRef`, `timesheet.approved`; snapshots without M06 repo import | Intake + missed-event refresh |
| M04 | `WorkforcePersonRef`, `EngagementRef`, approved leave, organisation id | Person, engagement org membership, leave lines, doctor/personKind |
| M05 | Published shift/assignment refs via read adapter | Variances only |
| M03 / platform | Actor identity, clinicIds, organisation scope | Authz |
| Platform | Timezone helpers; action-inbox bridge | Dates; M02 projections |

## 2. What M07 owns

| Asset | Notes |
|---|---|
| Organisation-keyed prep settings | Cadence, SoD — keyed to existing org id; not org master |
| Pay periods / intake / profiles / rules / codes / exportProfiles | `pulse.m07.staffpay.*` |
| External payroll employee id | On M07 pay profile only (Q19) |
| Calculations retaining `ruleVersion` + `exportProfileVersion` | Immutable after lock/export |
| Separate leave preparation lines | Reference M04 leave id+version |
| Approvals / exports CSV+JSON / reconciliations / audit | One org per package |

## 3. What M07 must never own or rewrite

| Forbidden | Reason |
|---|---|
| Organisation master data | Q8 |
| TFN / BSB / bank / super member / banking credentials / payment instructions | Q13 |
| M04/M05/M06/M08 SoT writes | Frozen boundaries |
| Multiple concurrent ordinary open periods | Q14 |
| Ordinary unlock | Q6 |
| Auto-lock | Q17 |
| Cross-organisation packages | Q1/Q8 |

## 3A. Prior-period adjustment coexistence (Q14)

PPA cycles may run alongside at most one open ordinary period only when linked to a **locked** source and **cannot** re-intake duplicate ordinary timesheets.

---

## 4. Organisation validation (Q8)

On period create, intake, calculate, approve, export:

1. Organisation exists.  
2. Engagement belongs to that organisation.  
3. Period has exactly one `legalEntityId` (= organisation id).  
4. Different organisations cannot share a period or export.  
5. Clinic tags are subordinate filters only.

---

## 5. Doctor / M08 boundary (Q7)

| Input | M07 behaviour |
|---|---|
| `personKind=doctor` | Exclude/quarantine; no staff-pay lines |
| M08-owned engagement | Same |
| Dual staff+doctor risk | Same |
| Override | **Not in Wave 6** (future: permission + justification + audit + duplicate-pay protection) |

---

## 6. Leave / classification / rules boundary (Q11 + Q23)

| May | Must not |
|---|---|
| Read approved M04 leave | Rewrite leave |
| Read M04 classification via adapter | Edit M04 classification from M07 |
| Map classification → M07 non-certified rule in Settings | Edit prep rules from M04 Staff hub |
| Create separate leave prep lines | Assume paid/loading/award |
| Block on missing map | Silently export unmapped codes |

Prototype Staff-hub award-rule editing → **RELOCATED/CONSOLIDATED** to M07 Settings.

---

## 7. Intake boundary (BLOCKED-M07)

**Current:** M06 bridge always `BLOCKED-M07`; no `pulse.m07.*` writes.  
**Planned:** M07 event consumer + refresh; M06 publish-only. Unresolved until evidenced.

---

## 8. Export / approval / lock boundary (Q12 + Q20–Q22)

```text
Pay clerk: calculate + submit
Pay approver: final approve (all clinics’ readiness) → export-ready
Export operator: select profile + createExportPackage (cannot edit profile; cannot Lock)
Pay approver/admin: Lock after recon accepted (Export operator denied)
```

Clinic readiness participates in final approval (Q21). No location-approved state.

---

## 9. Data-source labelling

| Attribute | Meaning |
|---|---|
| `demo-seed` | Controlled demo |
| `timesheet-ref` | Approved M06 publish |
| `leave-prep` | Approved M04 leave prep line (non-certified) |
| `rule-table` | Non-certified M07 rule version |
| `prior-period-adjustment` | Post-lock correction |
| `external-result` | External payroll response |

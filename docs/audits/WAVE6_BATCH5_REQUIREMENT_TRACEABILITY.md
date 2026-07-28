# Wave 6 / M07 Batch 5 — Requirement Traceability

**Status:** Implementation evidence (not independent owner acceptance)  
**Commit baseline parent:** `db96703123cc4759c04ed5f6ad9c930012ab38ea` (Batch 4 accepted)  
**Batch 5 implementation:** `3f982aaa144e88484f15f28899451f365c277d34`  
**Scope:** OD-1 Option A — readiness, review submission, management approval only  
**Remediation:** employment fail-closed, profile/mapping invalidation, dedicated SoD (post-audit)

## Decisions applied

| ID | Decision |
|---|---|
| OD-1 | Approval/readiness only — no export/recon/lock |
| OD-2 | Withdraw by original submitter or Pay Admin |
| OD-3 | Empty `clinicIds` = eligible clinics for period via M04+M06 population (not all historical profiles) |

## Traceability

| Req | CP | Requirement | Implementation | Test | Status |
|---|---|---|---|---|---|
| R-5.1-01 | 5.1 | Eligible population resolver | `eligible-population-service.ts` | CP5.1 + remediation | proven |
| R-5.1-01a | 5.1 | Fail-closed employment/clinic; visible blockers | same + `populationBlockers` | remediation | proven |
| R-5.1-01b | 5.1 | Demo soft-defaults only via `m07-demo-seed-v1` | `m04-person-read.ts` marker | remediation | proven |
| R-5.1-02 | 5.1 | Person/clinic/period readiness | `readiness-service.ts` | CP5.1 | proven |
| R-5.2-01 | 5.2 | Submit → `in-review` | `approval-service.ts` | CP5.2 | proven |
| R-5.3-01 | 5.3 | Management approve → `export-ready` | same | CP5.2–5.3 | proven |
| R-5.3-02 | 5.3 | Reject/withdraw → `open` + reason | same | CP5.2–5.3 | proven |
| R-5.3-03 | 5.3 | SoD vs submitter/preparers/deduction/exception actors | `sod-policy.ts` | CP5.2–5.3 + remediation SoD | proven |
| R-5.3-03a | 5.3 | Material-actor provenance fail-closed | `assertMaterialActorProvenance` | remediation | proven |
| R-5.4-01 | 5.4 | Source manifest + checksum | `source-manifest-service.ts` | CP5.2–5.4 | proven |
| R-5.4-02 | 5.4 | Invalidation on prep source change | `approval-invalidation.ts` | CP5.4 | proven |
| R-5.4-02a | 5.4 | Profile/classification material invalidation | `profile-service` / `rule-service` | remediation | proven |
| R-5.5-01 | 5.5 | M02 bridge lifecycle | `m02-inbox-publish.ts` | CP5.5 + remediation idempotency | proven |
| R-5.5-02 | 5.5 | Approval UI | `ApprovalSection.tsx` | CP5.5 + shell | proven |
| R-5.6-01 | 5.6 | Schema v8 approvals ensure | `migrate-v8.ts` | CP5.6 | proven |
| R-TERM | all | Not certification / payment | UI + audit + types | CP5.2 | proven |
| R-EXCL | excl | Export/recon/lock/PPA/payment | — | architecture scan | out of scope |

## Explicit non-claims

- Not payroll certification or payment authority
- Not export package generation
- Not independent owner acceptance
- Not production-ready payroll
- Not Batch 6

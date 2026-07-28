# Wave 6 / M07 Batch 5 — Checkpoint 5.4–5.6 Evidence

**Status:** Implementation evidence (not owner acceptance)  
**Remediation:** profile/classification invalidation coverage corrected after acceptance audit

## CP5.4 — Manifest pinning and invalidation

- Manifest covers tenant/LE/period version, clinics, eligible people, calc batch+snapshot versions, profiles/maps, deduction inputs, leave prep refs, exceptions/waivers, readiness, checksum
- Canonical ordered hash via `canonical-checksum.ts`
- Approve fails closed on checksum/period-version mismatch
- Material prep changes (calc, deduction, exception, leave) call `invalidateApprovalIfSourcesChanged` → approved/submitted becomes `stale`, period leaves `export-ready` → `open`
- **Remediation — profile/classification (was incomplete at first Batch 5 close):**
  - `profile-service` create/update/archive call `invalidateApprovalsForProfileMutation` when material
  - Materiality: personId, clinicId, classificationRef, preparation rule refs, allowance/deduction codes, leave/overtime refs, effectiveFrom/To, status — **not** ordinaryHourlyRate / externalPayrollEmployeeId alone
  - `rule-service` create/retire/replace classification mapping call `invalidateApprovalsForLegalEntity`
  - M04 employment-context bridge: `notifyM04EmploymentContextChanged` (M07 does not write M04)
  - Idempotent stale replay; M02 review-required projection updated without duplicate fork
- Status name is **stale** (not revoked)

## CP5.5 — M02 and UI

- `syncPeriodApprovalToInbox` via platform bridge only (submitted / approved close / rejected remediation / withdrawn / stale review-required)
- Deterministic key `staff-pay::pay-period-approval::{logicalKey}`
- `ApprovalSection.tsx` service-backed states; `data-m07-shell="batch5-approval"`
- Overview / People Review show approval context; export/recon/lock remain planned

## CP5.6 — Migration, architecture, exclusions

- `M07_SCHEMA_VERSION = 8` / `m07-staffpay-storage-v8`
- Additive ensure of `pulse.m07.staffpay.approvals`; malformed rows skipped on read
- Architecture tests: no M04/M05/M06 writes; no M02 repository import; no export/lock/payment symbols
- Tests: `m07-batch5-cp51-56.test.ts`, `m07-batch5-remediation.test.ts`

## Validation (remediation gate)

| Suite | Result |
|---|---|
| `test:m07` | 169 pass / 0 fail |
| Batch 5 + remediation focused | 40 pass |
| `test:workforce` | 45 pass |
| `test:auth` | 16 pass |
| `test:m04` | 16 pass |
| M02 lifecycle (m05-adapters) + M07 architecture/isolation | pass |
| ESLint (changed files) | clean |
| `tsc --noEmit` vs parent | 14 / 14 (no new errors) |

**Correction note:** Earlier Batch 5 evidence overstated “complete invalidation coverage” and “complete SoD proof.” Those claims are established only after this remediation and named tests.

**Do not claim independent owner acceptance.**

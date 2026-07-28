# Wave 6 / M07 Batch 5 — Checkpoint 5.4–5.6 Evidence

**Status:** Implementation evidence (not owner acceptance)  
**Final remediation:** materialProfileRevision pin consistency (post re-audit qualification)

## CP5.4 — Manifest pinning and invalidation

- Manifest covers tenant/LE/period version, clinics, eligible people, calc batch+snapshot versions, profiles/maps, deduction inputs, leave prep refs, exceptions/waivers, readiness, checksum
- Canonical ordered hash via `canonical-checksum.ts`
- Approve fails closed on checksum/period-version mismatch
- Management approve re-pins `periodVersion` to the anticipated `export-ready` bump (same pattern as submit → `in-review`) so an unchanged approved package remains reproducible via `verifyManifestAgainstCurrent`
- Material prep changes (calc, deduction, exception, leave) call `invalidateApprovalIfSourcesChanged` → approved/submitted becomes `stale`, period leaves `export-ready` → `open`
- **Profile materiality model (final):**
  - `PayProfile.version` — general audit/revision; increments on every mutation including rate and external payroll ID
  - `PayProfile.materialProfileRevision` — Batch 5 approval-integrity revision; increments only on material fields
  - Manifest pins **`materialProfileRevision`** (not general `version`)
  - Material fields: personId, legalEntityId, clinicId, classificationRef, preparation rule refs, allowance/deduction codes, leave/overtime refs, effectiveFrom/To, status
  - Non-material: `ordinaryHourlyRate`, `externalPayrollEmployeeId` — may bump `version` without changing `materialProfileRevision` and without staling; approved/`export-ready` remains checksum-reproducible
  - Prior residual contradiction (rate/external-ID bumping pinned `profileVersion`) is **resolved** by separating these counters
- Profile create/update/archive and classification map create/retire/replace invalidate when material
- M04 employment-context bridge: `notifyM04EmploymentContextChanged` (future integration; M07 does not write M04)
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
- Legacy profiles without `materialProfileRevision` normalize to `version` on read/write
- Architecture tests: no M04/M05/M06 writes; no M02 repository import; no export/lock/payment symbols
- Tests: `m07-batch5-cp51-56.test.ts`, `m07-batch5-remediation.test.ts`, `m07-batch5-material-revision.test.ts`

## Validation (final remediation gate)

| Suite | Result |
|---|---|
| `test:m07` | 178 pass / 0 fail |
| Batch 5 focused (CP + remediation + material revision) | 49 pass |
| `test:workforce` | 45 pass |
| `test:auth` | 16 pass |
| `test:m04` | 16 pass |

**Do not claim independent owner acceptance or Batch 6 readiness.**

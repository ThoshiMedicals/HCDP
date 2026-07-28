# Wave 6 / M07 Batch 5 — Checkpoint 5.4–5.6 Evidence

**Status:** Implementation evidence (not owner acceptance)

## CP5.4 — Manifest pinning and invalidation

- Manifest covers tenant/LE/period version, clinics, eligible people, calc batch+snapshot versions, profiles/maps, deduction inputs, leave prep refs, exceptions/waivers, readiness, checksum
- Canonical ordered hash via `canonical-checksum.ts`
- Approve fails closed on checksum/period-version mismatch
- Material changes (calc, deduction, exception, leave) call `invalidateApprovalIfSourcesChanged` → approved becomes `stale`, period leaves `export-ready` → `open`
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
- Tests: `m07-batch5-cp51-56.test.ts`

## Validation (implementation gate)

| Suite | Result |
|---|---|
| `test:m07` | 148 pass / 0 fail |
| `test:workforce` | 45 pass |
| `test:auth` | 16 pass |
| `test:m04` | 16 pass |

Batch 5 production-path ESLint (new services/UI): clean. Root `context.tsx` setState-in-effect and root tsc debt remain **pre-existing** (unchanged by Batch 5).

**Do not claim independent owner acceptance.**

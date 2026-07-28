# Wave 6 / M07 Batch 5 — Checkpoint 5.1–5.3 Evidence

**Status:** Implementation evidence (not owner acceptance)

## CP5.1 — Eligible population and readiness

- `services/eligible-population-service.ts` — deterministic resolver aligning LE/period, M04 employment/clinic windows, M06 eligible snapshots; doctors excluded; fail-closed on missing clinic/ambiguous org
- `services/readiness-service.ts` — person requires completed calc from eligible snapshot, mapping, no open blockers, valid waivers only; clinics/period roll up; variances never block
- Empty `period.clinicIds` discovers clinics from eligible members (OD-3)

**PASS** with wording: management preparation readiness only.

## CP5.2 — Submit for review

- `submitPeriodForReview` requires `payroll.review.submit`, readiness `ready`, builds immutable source manifest + checksum, period → `in-review`
- Idempotent when checksum unchanged; supersedes prior submitted on change
- Blocks incomplete/blocked periods

## CP5.3 — Management approve / reject / withdraw

- Approve: `payroll.approve` + SoD (`assertManagementApproveSeparation`) + manifest verify → `export-ready`
- UI/audit: “Ready for non-certified export preparation — not certified or payment-ready.”
- Reject / withdraw: mandatory reason → period `open`; withdraw = submitter or Pay Admin
- Types: `managementApprovalOnly: true`, `certified: false`, `paymentReady: false`

**PASS** — management approval of non-certified prep dataset only.

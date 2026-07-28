# Wave 6 / M07 Batch 5 — Checkpoint 5.1–5.3 Evidence

**Status:** Implementation evidence (not owner acceptance)  
**Remediation:** employment fail-closed + dedicated SoD proofs (post-acceptance-audit)

## CP5.1 — Eligible population and readiness

- `services/eligible-population-service.ts` — deterministic resolver aligning LE/period, M04 employment/clinic windows, M06 eligible snapshots; doctors excluded
- **Fail-closed (remediation):** missing employment status, missing/ambiguous employment dates, missing/ambiguous clinic assignment, or missing organisation produce explicit `populationBlockers` (person / field / LE / period / clinic). Person remains visible; not silently omitted; submission blocked
- Soft employment/clinic defaults apply **only** when `demoDataMarker === "m07-demo-seed-v1"` (explicit demo seed). Ordinary persisted records never enter that path
- `services/readiness-service.ts` — person requires completed calc from eligible snapshot, mapping, no open blockers, valid waivers only; clinics/period roll up; variances never block; population blockers surface as blocked people
- Empty `period.clinicIds` discovers clinics from eligible members (OD-3)

**PASS** with wording: management preparation readiness only.

## CP5.2 — Submit for review

- `submitPeriodForReview` requires `payroll.review.submit`, readiness `ready`, builds immutable source manifest + checksum, period → `in-review`
- Idempotent when checksum unchanged; supersedes prior submitted on change
- Blocks incomplete/blocked periods (including population blockers)

## CP5.3 — Management approve / reject / withdraw

- Approve: `payroll.approve` + SoD (`assertManagementApproveSeparation`) + material-actor provenance fail-closed + manifest verify → `export-ready`
- Approve re-pins manifest `periodVersion` to the post-`export-ready` period revision so unchanged approved packages remain `verifyManifestAgainstCurrent`-reproducible
- SoD material actors derived from **pinned manifest** (submitter, calculator, deduction creator, exception creator/resolver/waiver). Dedicated proofs: `m07-batch5-remediation.test.ts`
- Profile pin uses **`materialProfileRevision`** (not general `version`); rate/external-ID proofs: `m07-batch5-material-revision.test.ts`
- UI/audit: “Ready for non-certified export preparation — not certified or payment-ready.”
- Reject / withdraw: mandatory reason → period `open`; withdraw = submitter or Pay Admin
- Types: `managementApprovalOnly: true`, `certified: false`, `paymentReady: false`

**PASS** — management approval of non-certified prep dataset only.  
**Do not claim independent owner acceptance.**

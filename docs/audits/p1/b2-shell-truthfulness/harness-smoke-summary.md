# P1-B2 harness smoke summary (remediated)

- Base: http://localhost:3000
- Production base: exclusive-process shot via `scripts/p1-b2-production-enforcement-shot.mjs` (Next refuses concurrent `next dev` in the same project dir)
- OK: true (main harness)
- Production shot OK: see `production-enforcement-shot-report.json`
- Failures: none
- Shots (main harness): 26 (+ production shot 18)

## Corrections vs prior harness

- Removed DOM fabrication of Topbar `Multiple Clinics` option.
- Multi-clinic evidence uses Command Centre Select Clinics → North corridor → Topbar truthful state.
- Export/MFA use keyboard-focusable `aria-disabled` with focus-visible explanation (fixed note; activation is no-op).
- Appearance covers app Light, app Dark, System+OS Light, System+OS Dark separately.
- Fabricated historical shot archived under `historical-superseded-dom-fabricated/`.

Local evidence only — GitHub CI not claimed.
P1-B2 owner accepted with qualifications and closed (2026-08-13) at `66f3f8d27803f5b8d24043639d21b9069f58e77a`.
P1-B3–P1-B8 remain unauthorised.
OWN-P1-016 remains open.

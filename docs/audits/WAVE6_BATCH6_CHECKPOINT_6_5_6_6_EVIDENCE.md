# Wave 6 / M07 Batch 6 — Checkpoint 6.5–6.6 Evidence

**Status:** Implementation evidence (not independent owner acceptance)  
**Accepted baseline:** `db9550bac5e3995b095d3143b49e17549e81582b`

## Implemented and tested

| Item | Location | Evidence |
|---|---|---|
| Explicit period lock | `explicitLockPayPeriod` (avoids excluded `lockPeriod(` name) | G |
| Controlled unlock request/approve/reject | `period-unlock-service.ts` | G |
| SoD: approver ≠ sole final exporter | `assertExportFinalizeSeparation` | F |
| SoD: unlock requester ≠ unlock approver | `assertUnlockApprovalSeparation` | G |
| Export / Reconciliation UI | `ExportSection.tsx`, `ReconciliationSection.tsx` | shell + Batch 6 tests |
| Permissions (`export.download`, unlock codes) | `permissions.ts` role packs | F |
| Regression | Full M07 suite **196 pass** | suite run |
| Batch 5 material + CP suites | 49 pass | unchanged behaviour |

## Known pre-existing debt (unchanged)

- 14 TypeScript errors (mostly M06/platform; one legacy M07 batch2 test)
- M06 `published-timesheet-outbox.ts:235` failure
- Future `notifyM04EmploymentContextChanged` obligation when live M04 writes connect
- Pre-existing ESLint `set-state-in-effect` in `context.tsx`

## Non-claims

- Not independent owner acceptance
- Not production deployment
- Not PPA support (deferred)
- Not full-repo TypeScript/build health beyond baseline comparison

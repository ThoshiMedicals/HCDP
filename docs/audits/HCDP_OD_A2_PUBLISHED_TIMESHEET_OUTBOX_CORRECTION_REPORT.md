# HCDP — OD-A2 Published-Timesheet Outbox Narrow Correction Report

**Document:** `docs/audits/HCDP_OD_A2_PUBLISHED_TIMESHEET_OUTBOX_CORRECTION_REPORT.md`  
**Lane:** Narrow infrastructure correction only  
**Date:** 30 July 2026  
**Branch:** `cursor/od-a2-published-timesheet-outbox-correction`  
**Base:** `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc`  
**PPA prerequisite verification:** `acff2972eea8db4b9859de18dc31e5df427b6cb6` / `docs/audits/HCDP_PPA_PREREQUISITE_INDEPENDENT_VERIFICATION.md`

---

## 1. Executive result

| Item | Result |
|---|---|
| OD-A2 corrected | **Yes** |
| Runtime semantics preserved | **Yes** |
| Hash vector exact | **Yes** — `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| Outbox TypeScript errors | **0** (pre-change: 2 on line 235) |
| Full typecheck clean | **No** — 21 pre-existing unrelated errors remain |
| Production build | Fails solely on pre-remediation `node:crypto` (expected sequencing deferral) |
| UI Batch 1 integrated | **No** |
| Merged / UI Batch 2 | **No** |

---

## 2. Exact base and ancestry

```text
0afe878 → 995ee86 → 2ad5f4d → 739e42a → c8c9995   ← correction branch base
```

Branch created from exactly `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` (pushed; not from main, verification, UI, or crypto tips).

---

## 3. Reproduced pre-change error

```text
src/modules/m06-time-attendance/services/published-timesheet-outbox.ts(235,26): error TS2339:
  Property 'code' does not exist on type 'PublishFromOutboxResult'.
src/modules/m06-time-attendance/services/published-timesheet-outbox.ts(235,42): error TS2339:
  Property 'message' does not exist on type 'PublishFromOutboxResult'.
```

Matches accepted OD-A2 classification. Identical on `origin/main` and `c8c9995` before this lane. **No stop.**

---

## 4. Root cause

`PublishFromOutboxResult` is a discriminated union:

```ts
| { status: "published" | "idempotent"; result: PublishTimesheetResult; contentHash: string }
| { status: "rejected"; code: string; message: string }
```

`processPublicationOutboxItem` used:

```ts
if (result.status === "published" || result.status === "idempotent") { /* success */ }
// else: result.code / result.message
```

TypeScript does **not** narrow the complementary branch when the success arm’s discriminant is itself a **union of literals** checked with `||`. The else branch therefore remained typed as the full `PublishFromOutboxResult`, so `code`/`message` were unproven.

**Cause class:** missing discriminated-union narrowing (incomplete boolean OR on the success-arm status union) — not incorrect return type, not optional fields, not a runtime bug.

---

## 5. Result-union inventory

| Variant | Discriminant | `code` | `message` | `result` / `contentHash` |
|---|---|---|---|---|
| Success published | `status: "published"` | no | no | yes |
| Success idempotent | `status: "idempotent"` | no | no | yes |
| Failure rejected | `status: "rejected"` | yes | yes | no |

Constructors (publisher): eligibility reject; registry error catch; generic `PLATFORM_ERROR`; success from `publishTimesheetVersion`.  
Sole consumer of `code`/`message` in outbox processing: `processPublicationOutboxItem` failure path (this fix).

---

## 6. Exact correction

Invert control flow to narrow on the **failure** discriminant first:

```ts
if (result.status === "rejected") {
  // use result.code + result.message — proven
  ...
  return { item: failed, outcome: "failed" };
}
// result is published | idempotent — use result.result / contentHash
```

No public contract change. No `any`, assertions, `@ts-ignore`, optional broadening, fabricated fallbacks, or semantic change.

---

## 7. Changed-file inventory

| File | Why required |
|---|---|
| `src/modules/m06-time-attendance/services/published-timesheet-outbox.ts` | OD-A2 narrowing fix |
| `src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts` | Focused regression coverage |
| `docs/audits/HCDP_OD_A2_PUBLISHED_TIMESHEET_OUTBOX_CORRECTION_REPORT.md` | This report |
| `docs/audits/od-a2-published-timesheet-outbox-correction/*` | New evidence only |

No UI, PPA, crypto, hash, config, or unrelated changes. Diff vs `c8c9995` is only the above.

---

## 8. Runtime-semantic preservation

| Behaviour | Preserved |
|---|---|
| Success → published + ack | Yes |
| Idempotent re-process | Yes |
| Rejected → `failed` + `lastError` = `` `${code}: ${message}` `` | Yes |
| Retry identity (eventId/sequence) | Yes |
| Attempt counters / maxAttempts exhaustion | Yes |
| Approval not rolled back on publication failure | Yes (unchanged) |
| Persisted outbox record format | Yes |
| Audit-after-write (outbox has no audit redesign) | Untouched |

---

## 9. Focused regression coverage

`npx tsx --test src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts` → **8/8 pass**

Covers: success; idempotent-not-failed; eligibility reject code/message; clinic membership reject; retry identity; exhausted terminal skip; union arm shape; source uses `rejected` discriminant.

---

## 10–12. Published-timesheet / hash / PPA–M07 regression

| Suite | Command | Totals |
|---|---|---|
| OD-A2 focused | see above | **8/8** |
| M06 published outbox/create/verify | `npx tsx --test …/m06-published-timesheet.test.ts` | **19/19** |
| Registry create/verify | `npx tsx --test …/published-timesheet-registry.test.ts` | **27/27** |
| PPA-1 (core/ui/integration/security/atomicity) | five `m07-ppa1-*.test.*` | **46/46** |
| Arch / boundary / authz | three files | **28/28** |
| Batch 5 | three files | **49/49** |
| Batch 6 (period/lock) | five files | **43/43** |
| Full M06 | `npm run test:m06` | **91/91** (includes OD-A2 suite) |
| Full M07 | `npm run test:m07` | **246/246** |
| Workforce / contracts | `npm run test:workforce` | **45/45** |
| Hash vector | `calculatePayrollContentHash` + node sha256 of canonical | **EXACT** `7c14854a…ee83` |

Legacy aliases / shell: covered inside full M07 shell suite (green). Browser/server boundary: no barrel/hash changes in this lane; workforce green.

---

## 13. Protected-scope audit

Diff touches only M06 outbox service + new outbox tests + new docs evidence. **No** changes to payroll calc, PPA, locks, UI, crypto, permissions, Auth, Postgres, M08, wave-control, or accepted prior evidence files.

---

## 14. Typecheck result

| Check | Result |
|---|---|
| Pre-change OD-A2 outbox errors | 2 |
| Post-change OD-A2 outbox errors | **0** |
| `npx tsc --noEmit` exit | 2 |
| Remaining errors | **21** pre-existing (tests/registry typing noise; hook-security `NODE_ENV` readonly; etc.) — **not introduced by this lane** |

Full typecheck is **not** clean; OD-A2 portion is **resolved**.

---

## 15. Production-build result and crypto sequencing deferral

| Check | Result |
|---|---|
| `npx next build --webpack` | exit **1** |
| Failure | `UnhandledSchemeError: node:crypto` via `published-timesheet-hash.ts` → M06 adapters barrel → `ModuleWorkspace` |
| OD-A2 type error in build | **Not present** (fails earlier on crypto) |
| New/changed build failure | **No** — identical pre-remediation crypto failure as at `c8c9995` |
| Later `a1efd47` applicability | **Remains applicable**; not imported in this lane |

**Expected sequencing deferral:** production webpack green depends on later accepted browser-crypto remediation, not on OD-A2.

---

## 16. Findings by severity

| Severity | Finding |
|---|---|
| Resolved | OD-A2 incomplete narrowing |
| Deferred (expected) | `node:crypto` webpack failure until crypto remediation stack |
| Known pre-existing | 21 remaining `tsc` errors unrelated to outbox |
| None Critical | — |

---

## 17. Residual risks

- Independent QA should re-verify narrowing on the correction tip.  
- Full production-build green still requires crypto remediation sequencing.  
- Remaining pre-existing TS test typing debt is outside this lane.

---

## 18. Independent-verification requirements

Re-run: OD-A2 focused suite; `m06-published-timesheet.test.ts`; hash vector; `tsc` confirming zero outbox:235 errors; confirm build still only crypto-deferred; confirm diff scope.

---

## 19–20. Confirmations

- UI Batch 1 **not** integrated.  
- Nothing merged to main.  
- UI Batch 2 **not** started.  
- Multi-key atomicity / audit-after-write redesign **not** addressed.  
- Browser-crypto **not** cherry-picked.

---

## Verdicts

| # | Dimension | Verdict |
|---|---|---|
| 1 | OD-A2 root-cause resolution | **PASS** |
| 2 | Type safety | **PASS** (OD-A2); full-repo tsc remains QUALIFIED by pre-existing debt |
| 3 | Runtime-behaviour preservation | **PASS** |
| 4 | Retry and terminal-failure preservation | **PASS** |
| 5 | Audit-semantics preservation | **PASS** (untouched) |
| 6 | Published-timesheet compatibility | **PASS** |
| 7 | Hash compatibility | **PASS** |
| 8 | PPA regression | **PASS** |
| 9 | M06 regression | **PASS** |
| 10 | M07 regression | **PASS** |
| 11 | Protected-scope compliance | **PASS** |
| 12 | Suitability for independent verification | **PASS** |

---

*End of OD-A2 correction report.*

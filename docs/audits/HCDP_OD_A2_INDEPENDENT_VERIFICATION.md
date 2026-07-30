# HCDP — OD-A2 Independent Verification

**Lane:** Independent verification only (no production/code changes)  
**Date:** 30 July 2026  
**Verification branch:** `cursor/od-a2-independent-verification`  
**Correction branch:** `cursor/od-a2-published-timesheet-outbox-correction`  
**Correction commit:** `6d633ce1da75a4450d1c1fe186c0d3d502bc6a87`  
**Parent / authorised base:** `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc`  
**Expected hash:** `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83`

---

## 1. Executive verdict

**PASS — recommend owner acceptance of the OD-A2 correction as independently verified.**

Ancestry is exact (single commit on base `c8c9995`). The correction minimally reverses control flow so `PublishFromOutboxResult` is narrowed by `status === "rejected"` before `code`/`message` access. OD-A2 type errors are **0**. Runtime, retry, terminal, audit, contract and hash behaviour are preserved. All required regression suites pass. Full-repo typecheck retains exactly **21** pre-existing unrelated errors. Production build fails only on the known pre-remediation `node:crypto` issue; accepted browser-crypto commit `a1efd47` remains a separate sequencing item for UI Batch 1 controlled integration and was **not** applied here.

---

## 2. Verified base, parent and ancestry

| Check | Result |
|---|---|
| `git fetch origin` | Done |
| Correction on origin | `origin/cursor/od-a2-published-timesheet-outbox-correction` = `6d633ce1` |
| Parent of `6d633ce1` | Exact `c8c99950eaad6a2440a9fb91744d37a7d5dfdacc` |
| Commits `c8c9995..6d633ce1` | **1** (correction only) |
| Unapproved intervening commits | **None** |
| Working tree at verification start | Clean |
| Verification branch created from | Exact `6d633ce1` |

**Ancestry integrity: PASS**

---

## 3. Independent root-cause conclusion

`PublishFromOutboxResult` is a discriminated union:

```ts
| { status: "published" | "idempotent"; result: PublishTimesheetResult; contentHash: string }
| { status: "rejected"; code: string; message: string }
```

Only the `rejected` variant carries `code` and `message`. Pre-correction control flow checked `status === "published" || status === "idempotent"` first; TypeScript does **not** narrow the complementary branch for a success-arm status union (`"published" | "idempotent"`), so `result.code` / `result.message` on the else path remained unproven (`TS2339` at outbox:235).

Root cause is incomplete discriminant narrowing — not a runtime logic defect. Correct fix: test `status === "rejected"` first (or equivalent explicit narrowing) before accessing failure fields.

**Root-cause resolution: PASS**

---

## 4. Correction review

Verified independently against `c8c9995...6d633ce1`:

1. Complete union and discriminant (`status`) — confirmed in `m06-published-timesheet-publisher.ts`.
2. Variants: success (`published` | `idempotent` + `result` + `contentHash`) vs failure (`rejected` + `code` + `message`).
3. Only rejected arm has `code`/`message` — confirmed by type and runtime union test.
4. `status === "rejected"` correctly narrows before `` `${result.code}: ${result.message}` ``.
5. Success path still upserts `published`, acknowledges timesheet, returns `published`/`idempotent`.
6. Retryable rejection still writes `failed` + `lastError`, increments `attemptCount`, preserves event identity on authorised retry.
7. Terminal exhaustion still returns `skipped_exhausted` without treating as success.
8. Attempt counting / scheduling / `processPublicationOutbox` batch filter unchanged outside the narrowed branch order.
9. Outbox service has no audit writes; no audit-ordering change. Timesheet acknowledgement after successful publish retained.
10. Persisted outbox fields (`status`, `lastError`, `attemptCount`, identity keys) unchanged in shape.
11. Public contracts / publisher return type unchanged.
12. No `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, or fabricated fallback in the production correction.
13. New suite exercises runtime success/reject/retry/exhaustion/union shape; one source-text guard supplements, does not replace, runtime proofs.

**Correction review: PASS (minimal, type-correct, semantics-preserving)**

---

## 5. Complete changed-file classification

Diff audited: `c8c9995...6d633ce1` (5 files).

| File | Classification |
|---|---|
| `src/modules/m06-time-attendance/services/published-timesheet-outbox.ts` | **Required production correction** |
| `src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts` | **Focused regression test** |
| `docs/audits/HCDP_OD_A2_PUBLISHED_TIMESHEET_OUTBOX_CORRECTION_REPORT.md` | **Report** (correction lane; not modified by this verification) |
| `docs/audits/od-a2-published-timesheet-outbox-correction/hash-vector-result.json` | **Evidence** (correction lane) |
| `docs/audits/od-a2-published-timesheet-outbox-correction/independent-test-matrix.json` | **Evidence** (correction lane) |

No unrelated production, UI, PPA, crypto, configuration, package, generated, or protected-scope changes.

**Diff audit: PASS**

---

## 6. Runtime-semantics assessment

Branch reorder only. Observable outcomes unchanged:

| Outcome | Behaviour |
|---|---|
| Published | Outbox `published`, ack written, no `lastError` |
| Idempotent re-process | Early return / `idempotent`; not failed |
| Rejected | Outbox `failed`, `lastError` = `` `${code}: ${message}` `` |
| Expected runtime effect of correction | **None** |

**Runtime preservation: PASS**

---

## 7. Retry and terminal behaviour

| Behaviour | Result |
|---|---|
| Retry after fixable eligibility failure | Identity (`eventId`/`eventSequence`) preserved; attemptCount increments; can publish |
| Exhausted `attemptCount >= maxAttempts` | `skipped_exhausted`; prior `lastError` retained; no success ack |
| Approval not rolled back on publication failure | Unchanged (covered by published-timesheet suite) |

**Retry preservation: PASS**  
**Terminal-failure preservation: PASS**

---

## 8. Audit-semantics assessment

`published-timesheet-outbox.ts` contains no audit writers. Correction does not alter audit-after-write ordering elsewhere. Success path still acknowledges after durable outbox upsert of the published item.

**Audit preservation: PASS**

---

## 9. Published-timesheet and hash compatibility

| Gate | Result |
|---|---|
| Canonicalisation | Unchanged (hash module not in diff) |
| Stored hash format | 64-char lowercase hex SHA-256 |
| Published-timesheet identity | Unchanged |
| Exact hash vector | **EXACT** `7c14854a626ff6fa8c042174ef933e59ccb90bff104631011e2f003d29f6ee83` |
| M06–M07 contracts | Unchanged (arch/boundary green) |
| PPA scope | Unchanged (PPA-1 green; unlock ≠ PPA preserved) |
| Permissions / context / clinic / LE | Unchanged |
| Period / lock | Unchanged (Batch 6 green) |
| Legacy routes | Covered inside M07 shell/full suite |
| Audit semantics | Unchanged |

**Published-timesheet compatibility: PASS**  
**Hash compatibility: PASS**

---

## 10. Test commands and totals

| Suite | Command | Pass | Fail | Skip | Exit |
|---|---|---:|---:|---:|---:|
| OD-A2 focused | `npx tsx --test src/modules/m06-time-attendance/tests/m06-od-a2-outbox-narrowing.test.ts` | 8 | 0 | 0 | 0 |
| M06 published-timesheet | `npx tsx --test src/modules/m06-time-attendance/tests/m06-published-timesheet.test.ts` | 19 | 0 | 0 | 0 |
| Registry create/verify | `npx tsx --test src/platform/workforce/tests/published-timesheet-registry.test.ts` | 27 | 0 | 0 | 0 |
| Exact hash vector | `npx tsx -e` (`calculatePayrollContentHash` + `node:crypto` sha256 of canonical `ts_vector_1`) | exact | — | — | 0 |
| PPA-1 | five `m07-ppa1-*.test.*` | 46 | 0 | 0 | 0 |
| Arch / boundary / authz | `m07-architecture-cp27` + `m07-boundary-cp23` + `m07-authz` | 28 | 0 | 0 | 0 |
| Batch 5 | three `m07-batch5-*.test.*` | 49 | 0 | 0 | 0 |
| Batch 6 | five `m07-batch6-*.test.*` | 43 | 0 | 0 | 0 |
| Full M06 | `npm run test:m06` | 91 | 0 | 0 | 0 |
| Full M07 | `npm run test:m07` | 246 | 0 | 0 | 0 |
| Workforce / context | `npm run test:workforce` | 45 | 0 | 0 | 0 |

No tests, configuration, or compiler options were altered to manufacture a pass.

---

## 11. Typecheck comparison

Commands: `npx tsc --noEmit` on detached `c8c9995` (before) and on `6d633ce1` (after).

| Measure | Before (`c8c9995`) | After (`6d633ce1`) |
|---|---:|---:|
| OD-A2 outbox `code`/`message` errors | **2** (`published-timesheet-outbox.ts:235`) | **0** |
| Full-repo `error TS` count | **23** | **21** |
| New unrelated errors | — | **0** |

Remaining 21 errors are identical pre-existing debt (M06 published-timesheet test typing, M07 batch2 index field, PPA-1 hook-security `NODE_ENV`/cast noise, registry test `@ts-expect-error` / content overrides). None reference the outbox service.

**Type safety for OD-A2: PASS**

---

## 12. Build classification

| Check | Result |
|---|---|
| Command | `npx next build --webpack` |
| Exit | **1** |
| Sole relevant cause | `UnhandledSchemeError: node:crypto` via `published-timesheet-hash.ts` → `m06-published-timesheet-publisher.ts` → adapters barrel → `ModuleWorkspace.tsx` |
| OD-A2 type error in build | Not reached / not present |
| New or changed build failure | **No** — matches known pre-remediation crypto deferral at base |
| `a1efd472ea086d98e82b6ca60da8b9071b1808e2` | Exists; **not** ancestor of this tip; remains applicable for later UI Batch 1 controlled integration |
| Applied in this lane | **No** |

**Build classification: expected crypto sequencing deferral (not an OD-A2 blocker)**

---

## 13. Protected-scope audit

| Scope | Touched by correction? |
|---|---|
| Frozen Waves 1A–5 accepted history rewrite | No |
| PPA implementation / unlock-as-PPA | No |
| Payment / bank / STP / super / mark-as-paid | No |
| Browser-crypto remediation | No |
| UI Batch 1 / Batch 2 | No |
| Main / merge / controlled-integration branch | No |
| Cross-module repository imports | No |
| Accepted Batch 1–6 ordinary prep behaviour | No (M06 outbox type narrowing only) |
| Correction report / correction evidence | Not modified by this verification |

**Protected-scope compliance: PASS**

Governance inspected: `.cursor/rules/hcdp-wave-control.mdc` (workspace + parent). No `AGENTS.md` present in repository.

---

## 14. Findings and residual risks

| Severity | Finding |
|---|---|
| Resolved (verified) | OD-A2 incomplete narrowing |
| Deferred (expected) | Production webpack `node:crypto` until crypto remediation sequencing |
| Known pre-existing | 21 remaining full-repo `tsc` errors unrelated to OD-A2 |
| Residual | Independent tip remains suitable as integration base only after separate crypto sequencing for browser build green |
| None Critical | — |

---

## 15. Suitability as base for controlled integration

Suitable as the **OD-A2-corrected base** for a later **UI Batch 1 controlled integration** that separately sequences accepted browser-crypto commit `a1efd47`.

Not itself the controlled-integration branch. UI Batch 1 not integrated. UI Batch 2 not started. Main not updated. Nothing merged.

**Suitability for UI Batch 1 controlled integration: PASS (as verified OD-A2 base; crypto remains separate)**

---

## Required verdicts

| # | Gate | Verdict |
|---|---|---|
| 1 | Ancestry integrity | **PASS** |
| 2 | Root-cause resolution | **PASS** |
| 3 | Type safety for OD-A2 | **PASS** |
| 4 | Runtime preservation | **PASS** |
| 5 | Retry preservation | **PASS** |
| 6 | Terminal-failure preservation | **PASS** |
| 7 | Audit preservation | **PASS** |
| 8 | Published-timesheet compatibility | **PASS** |
| 9 | Hash compatibility | **PASS** |
| 10 | PPA regression | **PASS** |
| 11 | M06 regression | **PASS** |
| 12 | M07 regression | **PASS** |
| 13 | Protected-scope compliance | **PASS** |
| 14 | Independent-verification acceptance | **PASS** |
| 15 | Suitability for UI Batch 1 controlled integration | **PASS** |

---

## Owner-acceptance recommendation

**Recommend owner acceptance** of correction `6d633ce1` as independently verified:

- ancestry exact;
- correction minimal;
- OD-A2 errors zero;
- no new type or build failure;
- runtime / retry / terminal / audit preserved;
- hash exact;
- regression suites pass;
- no protected-scope violation;
- browser-crypto remains a clearly separate sequencing item.

---

## Verification artefacts

| Artefact | Path |
|---|---|
| This report | `docs/audits/HCDP_OD_A2_INDEPENDENT_VERIFICATION.md` |
| Hash vector evidence | `docs/audits/od-a2-independent-verification/hash-vector-result.json` |
| Test matrix evidence | `docs/audits/od-a2-independent-verification/independent-test-matrix.json` |

Correction report/evidence intentionally **not** modified.

---

## Confirmations

- No production code changed in this verification lane.
- Correction commit `6d633ce1` not amended.
- Nothing merged; `main` not updated.
- UI Batch 1 not integrated; controlled-integration branch not created.
- UI Batch 2 not started.

*End of OD-A2 independent verification report.*

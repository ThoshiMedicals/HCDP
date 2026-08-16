# P1-B5 — M01/M02 Decision A presentation — implementation evidence

**Batch:** P1-B5
**Status:** **Owner accepted with qualifications — CLOSED (2026-08-17)**
**Stamp:** `P1-B5-OWNER-ACCEPT-2026-08-17`
**Implementation branch:** `cursor/p1-b5-m01-m02-presentation`
**Accepted implementation tip:** `4306116fdf28f9d90a989d8ec78b317ad351b0d2`
**Pre-remediation tip (archived evidence):** `3fcd5e38d8dcb0555b5727541c223c8d1a44841d`
**Authorised source tip:** `ef66e3fa9aadaa3507ccf16d07aac3cbc7b5c577`
**Authorisation:** Express named-batch owner authorisation for M01/M02 Decision A presentation and honesty only
**Owner acceptance:** **Owner accepted with qualifications — CLOSED (2026-08-17)** (`P1-B5-OWNER-ACCEPT-2026-08-17`)
**Accepted scope:** M01/M02 Decision A presentation and honesty at accepted tip only
**Validation basis:** verified local tests, validators, production build, Chromium/Playwright production-runtime harness (local only)
**GitHub CI:** none — workflows=0; check-runs=0; status-contexts=0; **no CI pass claimed**
**Historical evidence archive:** `docs/audits/p1/b5-m01-m02-presentation/historical-superseded-3fcd5e38/`

> Acceptance closes **P1-B5 only**. It does **not** authorise durable M01/M02 services, P1-B6–P1-B8, PR, merge, deployment, production, Aurora integration, or automatic progression.
> Do **not** claim full WCAG compliance, pixel parity, GitHub CI, production approval, or Programme P1 completion.
> M01 and M02 domain remain **NOT-STARTED**.
> Aurora (`cursor/aurora-design-foundation`) remained **isolated and unintegrated**.
> `OWN-P1-009`, `OWN-P1-011` and `OWN-P1-016` remain **open**.
> Inventory unchanged: **83** gaps / **8** batches / **24** modules; **M25** unimplemented.

## Owner decision (2026-08-17)

P1-B5 is **owner accepted with qualifications** at tip `4306116fdf28f9d90a989d8ec78b317ad351b0d2`. Within approved P1-B5 presentation scope the batch is **closed**. This acceptance does **not** authorise durable M01/M02 services, P1-B6 or any later batch, a pull request, merge, deployment, production release, Aurora integration, or automatic batch progression.

### Accepted M01 scope

- Decision A presentation applied to M01
- Shared `PageHeader` with one correct page-level heading
- Visible and accessible local/demo-data honesty
- Metric, period, clinic-scope and source attribution
- Demonstration/local qualification of comparisons such as “vs yesterday”
- Attention items exposing owner, reason, due state and available action
- Demo-qualified action outcomes and toasts
- Honest operational-source-system navigation
- Loading, empty, error and QA permission-unavailable presentation
- Responsive and appearance evidence for tested P1 surfaces
- Patient/clinical firewall preservation

M01 domain remains **NOT-STARTED**. No durable executive scoring, analytics, aggregation, export, communications or operational service is accepted.

### Accepted M02 scope

- Decision A presentation applied to M02
- Honest local/demo queue and summary presentation
- Search and filter presentation
- No-selection and selected-detail states
- Correct selection/current-state semantics
- Detail Escape and focus restoration
- Filtered-empty and view-empty states
- Loading state
- Sensitivity-restricted presentation without summary leakage
- Planned/unavailable Email/SMS treatment
- Local/demo-qualified action outcomes and toasts
- Best Practice/operational source-system wording
- Control-classification register containing **27** independently enumerated classifications
- Responsive mobile stacked presentation
- Patient/clinical firewall preservation

M02 domain remains **NOT-STARTED**. No durable inbox aggregation, notification delivery, email, SMS, approval orchestration or backend service is accepted.

### Gap disposition at acceptance

| Gap | Disposition |
| --- | --- |
| P1-GAP-020 | **Closed** for accepted M01 Decision A presentation scope; durable M01 domain remains P2+ |
| P1-GAP-021 | **Closed** for accepted M02 Decision A presentation scope; durable M02 domain remains P2+ |
| P1-GAP-066 | **Partial** — M01/M02 filter/search presentation semantics accepted; broader M03/module consistency residual preserved |
| P1-GAP-067 | **Partial** — M01/M02 drill-down/detail presentation accepted; broader cross-module and M03 consistency residual preserved |
| P1-GAP-068 | **Partial** — M01/M02 alert/notification chrome honesty accepted; durable M02 notifications remain P2+ |

Total inventory remains **83** gaps. Durable domain requirements are **not** marked closed.

### Unsupported-state residuals (not accepted functionality)

1. M01 true route-level access denial is unsupported; only the QA permission-unavailable card state is evidenced.
2. M02 true route-level access denial is unsupported.
3. M02 stable true-empty inbox without automatic reseeding is unsupported.
4. Filtered-empty and view-empty evidence must not be described as a truly empty persisted inbox.
5. Error evidence is limited to the source-verified/supported mechanism described in the authoritative evidence.
6. These residuals must not block presentation-only P1-B5 closure, but remain truthfully documented for later state/permission work, including P1-B7 where applicable.

### Binding qualifications

1. Validation is local-only.
2. GitHub workflow count is zero.
3. GitHub check-run count is zero.
4. GitHub status-context count is zero.
5. No GitHub CI pass is claimed.
6. No full WCAG compliance is claimed.
7. No pixel-parity claim is made.
8. Evidence is primarily Chromium/Playwright production-runtime evidence.
9. M01 domain remains `NOT-STARTED`.
10. M02 domain remains `NOT-STARTED`.
11. No durable API or database service was added.
12. M01 metrics and comparisons remain local/demo presentation data.
13. M02 queue/actions remain local/demo presentation behaviour.
14. M01 route-level access-denied evidence is unsupported.
15. M02 route-level access-denied evidence is unsupported.
16. M02 stable true-empty inbox without reseeding is unsupported.
17. Filtered/view empty states are not durable true-empty inbox evidence.
18. Email/SMS remains planned and not live.
19. Durable M01–M03 services remain governed by `OWN-P1-009`.
20. `OWN-P1-009` remains open.
21. `OWN-P1-011` remains open.
22. `OWN-P1-016` remains open.
23. Best Practice remains the clinical source of record.
24. No patient or clinical-record functionality is accepted.
25. `P1-GAP-066` retains broader M03/cross-module residuals.
26. `P1-GAP-067` retains broader M03/cross-module residuals.
27. `P1-GAP-068` retains durable-notification residuals.
28. The 24 lint warnings remain verified parent-lineage warnings; no lint errors remain.
29. Aurora remains parked and unintegrated.
30. P1-B6 through P1-B8 remain unauthorised.
31. No automatic progression is permitted.
32. No production approval is granted.
33. No PR, merge or deployment is authorised.
34. This is not overall Programme P1 acceptance.

---

## Remediation history (pre-acceptance)

Independent remediation at tip `4306116…` corrected presentation honesty and evidence ambiguity after pre-remediation tip `3fcd5e38…`.

| ID | Defect | Correction |
| --- | --- | --- |
| D1 | Dual title hierarchy / Live projection claims | PageHeader remains sole h1; Priority Summary demoted to h2; projection subtitles say local/demo |
| D2 | Unqualified M01 success toasts | Bulk/create toasts demo-qualified |
| D6 | `aria-current` on expand wrapper | `aria-current`/`data-selected` on reviewing interactive row; reviewId match |
| D7 | Ambiguous “or” evidence filenames | Archived; replaced with exact-state captures |
| D8 | Incomplete 14-control manifest | Expanded independent enumeration (27 classifications + unsupported states) |
| D9 | “Open clinical source system” CTA | Renamed to operational source; Best Practice SoR note |
| D10 | Email/SMS implied live | Settings + create delivery labelled planned/not live |
| D12 | Access-denied claimed via sensitivity | Route access denied documented **unsupported**; sensitivity-restricted evidenced separately |
| D4 | Summary leakage under restricted sensitivity | Summary cards filter sensitive when restricted |
| D5 | Empty kind ignores view | `emptyKind` inbox/filtered/view |

## Supported / unsupported state matrix

| State | M01 | M02 |
| --- | --- | --- |
| Ready | Supported | Supported (`m02-ready-queue`) |
| No selection | n/a | Supported |
| Selected detail | Supported (Full Action) | Supported (`m02-selected-detail`) |
| Loading | QA card-state | Natural flash when capturable; else source-verified |
| Empty | QA card-state | View/filtered empty supported; true empty inbox **unsupported stably** (reseed) |
| Error | QA card-state | Source-verified (no force hook) |
| Access denied (route) | Unsupported (QA permission card only) | **Unsupported** |
| Sensitivity restricted | n/a | Supported |
| Planned Email/SMS | n/a | Supported (unavailable honesty) |

## Control-classification totals

Independent enumeration: **27** classifications
By class: operational-local-demo **19**, presentation-only **5**, planned-unavailable **1**, deferred-durable **1**, outside-p1-b5 **1**
Unsupported documented: route access denied; true empty inbox without reseed.

## Validation totals (at accepted implementation tip)

| Metric | Value |
| --- | --- |
| Register validator | `failures: []` |
| `tsc --noEmit` | Pass |
| Lint | 0 errors / **24** warnings (parent-lineage) |
| Full suite | **582 pass / 0 fail** |
| `test:p1-b1` … `b5` | 21 / 22 / 13 / 19 / **18** pass |
| Production build | Pass |
| Harness | **438 pass / 0 fail**; **29** shots |
| Assertion groups | regions 144, overflow 49, appearance 48, theme 48, m01States 33, m02States 34, focus 3, controls 5, firewall 48, domain 4, matrix 10, required 12 |
| GitHub workflows/check-runs/statuses | **0 / 0 / 0** (local-only) |
| Owner acceptance | **Owner accepted with qualifications — CLOSED (2026-08-17)** (`P1-B5-OWNER-ACCEPT-2026-08-17`) |

## Final claim

P1-B5 qualified owner acceptance recorded and published — durable M01/M02 services remain deferred, P1-B6 through P1-B8 remain unauthorised, Aurora remains unintegrated, and no merge or deployment was performed.

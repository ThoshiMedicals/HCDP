# P1-B6 Frozen-Module Baseline Provenance and Deterministic Equivalence Gate

**Document type:** Baseline provenance + domain-equivalence control record  
**Batch:** P1-B6 — Accepted-module final-design apply (presentation only)  
**Status stamp:** `P1 — IMPLEMENTED FOR OWNER REVIEW (acceptance pending)` — expressly authorised; **NOT** owner accepted  
**Machine-readable companion:** [`P1_B6_FROZEN_BASELINES.json`](./P1_B6_FROZEN_BASELINES.json)  
**Authorisation briefing:** [`P1_B6_OWNER_AUTHORISATION_BRIEFING.md`](./P1_B6_OWNER_AUTHORISATION_BRIEFING.md)  
**Implementation branch:** `cursor/p1-b6-accepted-modules-presentation`  
**Immutable pre-implementation comparison baseline:** `f17756d80f039954c3be9f341436d0ba426d27b1`  
**Domain equivalence evidence:** [`../../audits/p1/b6-accepted-modules-presentation/domain-equivalence.json`](../../audits/p1/b6-accepted-modules-presentation/domain-equivalence.json) — **PASS**  
**Record date:** 2026-08-17 (provenance); status refreshed for implementation-for-review  

> This record established frozen baselines and the equivalence gate.  
> It does **not** fabricate historical accepted SHAs.  
> It does **not** grant owner acceptance, close gaps, or authorise PR/merge/deploy.  
> Aurora remains parked and unintegrated; Decision A binding.  
> `OWN-P1-009` / `OWN-P1-011` / `OWN-P1-016` remain open.

---

## 1. Purpose

Establish:

1. Historical provenance of frozen M04 / M05 / M06 / M07 / M11 baselines (truthfully).  
2. An immutable **current comparison baseline** at tip `f17756d80f039954c3be9f341436d0ba426d27b1`.  
3. A deterministic, machine-readable protected-domain inventory with cryptographic file hashes.  
4. A mandatory domain-equivalence procedure for expressly authorised P1-B6 implementation (now applied; acceptance pending).

---

## 2. Provenance classification scheme

| Class | Meaning |
| --- | --- |
| `verified-owner-accepted` | Owner acceptance is explicitly recorded **and** an authoritative accepted implementation SHA is pinned in wave-control and/or acceptance evidence |
| `verified-wave-closure` | Owner acceptance / freeze is explicitly recorded in wave acceptance reports, but **no** authoritative accepted implementation SHA is pinned |
| `probable-but-not-authoritative` | A recoverable commit is a plausible implementation tip (e.g. bundled delivery) but must **not** be treated as an accepted SHA pin |
| `not-recoverable-from-repository` | No honest accepted SHA can be recovered without fabrication |

---

## 3. Historical reconciliation

### 3.1 M04 `/staff-doctors` — Wave 2

| Field | Finding |
| --- | --- |
| Owner acceptance | Explicitly recorded — `docs/audits/WAVE2_ACCEPTANCE_REPORT.md` (**GRANTED** 27 July 2026); `WAVE2_M04_COMPLETION_REPORT.md` — owner accepted and frozen |
| Authoritative accepted SHA | **`null`** — not pinned in `.cursor/rules/hcdp-wave-control.mdc` or Wave 2 acceptance records |
| Provenance confidence | **`verified-wave-closure`** |
| Probable (non-authoritative) tip | `5886bf3a26e856c6008b4b3ce47de096e289ea95` — *Add workforce Waves 2–3 and auth provisioning foundations* (2026-07-27). Bundle introduced M04 implementation **and** acceptance evidence in one commit. Class: **`probable-but-not-authoritative`** |
| Verdict | Missing Wave 2 SHA formally recorded as **not recoverable as an authoritative accepted pin**. Do **not** invent one. |

### 3.2 M05 `/roster` — Wave 4

| Field | Finding |
| --- | --- |
| Accepted implementation SHA | **`15f020800bbca40702ef08ad25f94f1d1999112f`** — **verified** |
| Date / subject | 2026-07-28 — *Fix Wave 4 M02 projection performance evidence path* |
| Acceptance documentation | `cdc0478322307bd484afcd3dcbdc517b0d3918e9` — *Record Wave 4 owner acceptance and freeze status* (docs; marks M05 accepted at `15f0208`) |
| Provenance confidence | **`verified-owner-accepted`** |
| Relationship to tip | Ancestor of `f17756d80f039954c3be9f341436d0ba426d27b1` |

### 3.3 M06 `/time-attendance` — Wave 5

| Role | Full SHA | Date | Subject | Kind |
| --- | --- | --- | --- | --- |
| **Accepted runtime / implementation tip** | `6cfee6ca7ae2d0f58695569b9f61ffa939b97e49` | 2026-07-28 | *Correct Wave 5 History and Reports browser evidence predicates* | Implementation/evidence correction — pinned as Accepted Wave 5 runtime; `acceptedCommit` in `wave5-m06-acceptance-evidence.json` |
| **Acceptance freeze checkpoint** | `39f892e81f5aa76f6690d6af8c82273def5a6e0f` | 2026-07-28 | *Record Wave 5 owner acceptance and freeze checkpoint* | **Documentation-only** — records freeze at `6cfee6ca…`; does not replace the runtime tip |

**Distinct roles:** `6cfee6ca…` = accepted runtime baseline; `39f892e8…` = owner-acceptance documentation tip. Provenance confidence: **`verified-owner-accepted`**.

### 3.4 M07 `/staffpay` — Wave 6 Batch 6 + P1-B3 honesty

| Role | Full SHA | Date | Subject | Kind |
| --- | --- | --- | --- | --- |
| Batch 6 accepted technical target | `ce1f4af68917c9988efff327d521d94b8289f2fc` | 2026-07-29 | *fix(m07): fourth remediation for strict calendar effective dates* | Implementation/remediation — wave-control Batch 6 technical target |
| Batch 6 owner-acceptance evidence | `ad54aed94b0c798d3f26fe66bf811d6e3b083151` | 2026-07-29 | *docs(m07): record Wave 6 Batch 6 owner acceptance with qualifications* | **Documentation-only** |
| P1-B3 honesty / register hygiene | `2515a4ffac0fb94cbd37092e26bf372cb43898f8` | 2026-08-13 | *fix(p1-b3): remediate acceptance evidence and diff hygiene* | Owner-accepted honesty baseline (Adjustments preparation-only; History planned; unlock ≠ PPA) — **not** a Wave 6 recalculation tip |

Provenance confidence for Batch 6 technical target: **`verified-owner-accepted`**. All three SHAs are ancestors of the comparison baseline.

### 3.5 M11 `/training` — Wave 3 + P1-B3 register sync

| Field | Finding |
| --- | --- |
| Owner acceptance | Explicitly recorded — `WAVE3_M11_COMPLETION_REPORT.md` — owner accepted and frozen (27 July 2026) |
| Authoritative Wave 3 SHA | **`null`** — not pinned in wave-control |
| Provenance confidence (Wave 3) | **`verified-wave-closure`** |
| Probable (non-authoritative) tip | `5886bf3a26e856c6008b4b3ce47de096e289ea95` — same bundle as M04; **`probable-but-not-authoritative`** |
| P1-B3 register sync | `2515a4ffac0fb94cbd37092e26bf372cb43898f8` — **`verified-owner-accepted`** for register/section sync only (`records → assignments`, `expiry → certificates`, `strong-existing`) |
| Verdict | Missing Wave 3 SHA formally recorded as **not recoverable as an authoritative accepted pin**. Do **not** invent one. |

---

## 4. Current comparison baseline (immutable)

Regardless of historical SHA recovery:

| Field | Value |
| --- | --- |
| SHA | `f17756d80f039954c3be9f341436d0ba426d27b1` |
| Role | **P1-B6 pre-implementation comparison baseline** |
| Subject | `docs(p1-b6): prepare owner authorisation briefing` |
| Is it a historical accepted SHA? | **No** — it is the immutable tip against which future presentation-only diffs and regenerated hashes are compared |

---

## 5. Full baseline table

| Module | Route | Historical wave/batch | Historical accepted SHA | Provenance | Current comparison SHA | Regression suites |
| --- | --- | --- | --- | --- | --- | --- |
| M04 | `/staff-doctors` | Wave 2 frozen 27 Jul 2026 | `null` (not recoverable as pin) | `verified-wave-closure` | `f17756d80f039954c3be9f341436d0ba426d27b1` | `test:m04`, `test:wave2-evidence` |
| M05 | `/roster` | Wave 4 frozen 28 Jul 2026 | `15f020800bbca40702ef08ad25f94f1d1999112f` | `verified-owner-accepted` | same | `test:m05`, `test:wave4-evidence` |
| M06 | `/time-attendance` | Wave 5 frozen | `6cfee6ca7ae2d0f58695569b9f61ffa939b97e49` (+ checkpoint `39f892e8…`) | `verified-owner-accepted` | same | `test:m06`, `test:wave5-evidence` |
| M07 | `/staffpay` | Wave 6 Batches 1–6 + P1-B3 honesty | `ce1f4af68917c9988efff327d521d94b8289f2fc` (+ evidence `ad54aed9…`, honesty `2515a4ff…`) | `verified-owner-accepted` | same | `test:m07`, `test:p1-b3` |
| M11 | `/training` | Wave 3 frozen 27 Jul 2026 + P1-B3 sync | `null` Wave 3 pin; honesty/sync `2515a4ff…` | `verified-wave-closure` (+ P1-B3 verified) | same | `test:m11`, `test:wave3-evidence`, `test:p1-b3` |

---

## 6. Manifest inventory counts (at `f17756d…`)

From [`P1_B6_FROZEN_BASELINES.json`](./P1_B6_FROZEN_BASELINES.json):

| Metric | Count |
| --- | ---: |
| Modules inventoried | 5 |
| Protected domain files (hashed) | 233 |
| Presentation files permitted to change | 82 |
| Permission codes inventoried | 105 |
| Storage keys inventoried | 95 |

Protected directories (hashed): `services/`, `repository/`, `storage/`, `adapters/`, `types/`, plus module-root domain files such as `permissions.ts`.  
Presentation directories (permitted to change under authorised B6): `sections/`, `components/`.

Screenshots, build outputs, and test-mutated evidence JSON are **not** hashed as domain proof.

---

## 7. Domain-equivalence procedure (mandatory for future P1-B6)

1. Use [`P1_B6_FROZEN_BASELINES.json`](./P1_B6_FROZEN_BASELINES.json) at tip `f17756d80f039954c3be9f341436d0ba426d27b1` as the baseline.  
2. Implement **presentation-only** changes only after **express** P1-B6 authorisation.  
3. Regenerate the manifest deterministically with the same protected-vs-presentation classification rules.  
4. Compare `fileHashes`, `protectedAggregateSha256`, and inventories (permissions, storage keys, sections/tabs, events).  
5. Allow differences only in `presentationFilesPermittedToChange`.  
6. Explain every changed protected hash.  
7. **Fail publication** if any unauthorised difference occurs in:

   - Domain behaviour  
   - Permissions  
   - State transitions  
   - Storage  
   - Events/audit  
   - Calculations  
   - Export outputs  
   - Control outcomes  
   - M07 PPA / payment / M08 boundaries  
   - M11 sections or aliases (`records → assignments`, `expiry → certificates`)

**Test-mutated evidence:** restore with `git checkout HEAD --` on any rewritten `docs/audits/wave*-*evidence.json` (and similar) before committing.

**P1-GAP-081:** cannot close merely because tests pass — equivalence report + unchanged protected hashes are required.

---

## 8. Module-specific protection summary

| Module | Must preserve |
| --- | --- |
| M04 | Workforce-person links; employment/engagement; qualifications; permissions; audit; persistence/profile actions |
| M05 | Roster/shift rules; conflict/coverage; costs; publish; permissions; audit/events; accessible non-drag alternatives |
| M06 | Time calculations; clocking; exceptions; approvals; audit/events; TimesheetRef downstream boundary |
| M07 | Payroll-prep calculations; exceptions; Adjustments preparation + **accepted P1-B3 honesty wording**; History planned; exports; unlock≠PPA; no PPA/payment/M08 |
| M11 | Domain models; assignments; certificates; progress; permissions; audit/events; 11-section nav; alias mappings; `strong-existing` qualification |

---

## 9. Remaining limitations

1. M04 and M11 lack authoritative historical accepted SHA pins (truthfully documented; not fabricated).  
2. Probable tip `5886bf3a…` is bundled implementation+evidence — not an accepted pin.  
3. Permission/event inventories are source-extracted heuristics; protected **file hashes** are the primary drift detector.  
4. No GitHub CI — validation remains local-only when workflows/check-runs/statuses are zero.  
5. P1-B6 is expressly authorised and **implemented for owner review** — **acceptance pending**; this record remains the baseline/equivalence control (not owner acceptance).  
6. Aurora remains parked; Decision A remains the binding visual contract.

---

## 10. Readiness conclusion

**`EXPRESS P1-B6 AUTHORISATION GRANTED — IMPLEMENTED FOR OWNER REVIEW (acceptance pending)`**

Missing historical M04/M11 SHA pins do **not** block the equivalence gate because:

- Their absence is truthfully documented.  
- The current comparison baseline `f17756d80f039954c3be9f341436d0ba426d27b1` is immutable.  
- Accepted behaviour remains supported by wave acceptance evidence packs and required regression suites.  
- The machine-readable manifest objectively detected **zero** protected-domain drift (see domain-equivalence.json **PASS**).

P1-B6 status: **`P1 — IMPLEMENTED FOR OWNER REVIEW (acceptance pending)`**. Owner acceptance remains **pending**. P1-B7 and P1-B8 remain `P1 — PLANNED, NOT AUTHORISED`.

---

## 11. Control preservation

Preserve: P1-B1–P1-B5 accepted/closed; P1-B6 expressly authorised and implemented for owner review (acceptance pending); P1-B7–P1-B8 `P1 — PLANNED, NOT AUTHORISED`; 83 gaps; 8 batches; 24 modules; M25 unimplemented; `OWN-P1-009` / `OWN-P1-011` / `OWN-P1-016` open; Aurora parked; Decision A binding; no PPA/payment/M08; no overall Programme P1 acceptance; gaps 022–026/050/081 addressed but **not closed**; no PR/merge/deploy.

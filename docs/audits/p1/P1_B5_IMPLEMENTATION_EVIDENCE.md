# P1-B5 — M01/M02 Decision A presentation parity — implementation evidence

**Batch:** P1-B5  
**Status:** Expressly authorised and **implemented for owner review** — **owner acceptance remains pending**  
**Stamp:** `P1-B5 — IMPLEMENTED FOR OWNER REVIEW (acceptance pending)`  
**Implementation branch:** `cursor/p1-b5-m01-m02-presentation`  
**Authorised source tip:** `ef66e3fa9aadaa3507ccf16d07aac3cbc7b5c577` (`cursor/p1-b4-responsive-a11y-appearance`)  
**Authorisation:** Express named-batch owner authorisation for gaps 020 / 021 / 066 / 067 / 068-chrome only  
**Briefing:** [`../architecture/prototype-parity/phase1/P1_B5_OWNER_AUTHORISATION_BRIEFING.md`](../../architecture/prototype-parity/phase1/P1_B5_OWNER_AUTHORISATION_BRIEFING.md)

> Owner acceptance is **not** granted by this publication.  
> M01/M02 **domain remains NOT-STARTED**. Durable services remain **P2+** (`OWN-P1-009`).  
> Aurora remains **parked and unintegrated**.  
> P1-B6 through P1-B8 remain **`P1 — PLANNED, NOT AUTHORISED`**.  
> `OWN-P1-009`, `OWN-P1-011` and `OWN-P1-016` remain **open**.  
> Inventory unchanged: **83** gaps / **8** batches / **24** modules; **M25** unimplemented.  
> Gaps 020/021/066/067/068 remain **addressed but not closed**.

---

## 1. Scope delivered

| Gap | Topic | Disposition (pre-acceptance) |
| --- | --- | --- |
| P1-GAP-020 | M01 Decision A chrome | **Addressed for owner review** — acceptance pending |
| P1-GAP-021 | M02 Decision A chrome | **Addressed for owner review** — acceptance pending |
| P1-GAP-066 | Shared filter/search semantics (M01/M02 portion) | **Addressed for owner review** — acceptance pending |
| P1-GAP-067 | Drill-down / detail patterns (M01/M02 portion) | **Addressed for owner review** — acceptance pending |
| P1-GAP-068 | Alert/notification chrome honesty (M01/M02) | **Addressed for owner review** — domain notifications remain P2+ |

P1-B1–P1-B4 remain owner accepted with qualifications and closed.

---

## 2. Presentation changes (summary)

### M01
- Shared `PageHeader` enabled for Command Centre (Decision A module title region).
- Priority summary: demonstration/local comparison attribution for “vs yesterday” deltas; harness testids.
- Attention list: Owner / Due / Reason (fallback) / Action fields with testids.
- Clinic income/FTE/room guesses labelled “Demonstration estimate — not live operational metric”.
- Demo banner and root `data-testid` retained/strengthened.

### M02
- `demoSuccess()` qualifies operational success toasts as local demo (not live backend).
- Duplicate in-page H1 demoted; shared PageHeader remains primary title.
- Summary cards attributed as demonstration/local totals.
- List/detail selection (`aria-current` / `data-selected`) and review panel testids.
- Clinical source-system wording softened (no patient-record management claim).
- Control classification manifest published.

---

## 3. Evidence location

| Artefact | Path |
| --- | --- |
| Harness report | `docs/audits/p1/b5-m01-m02-presentation/harness-report.json` |
| Screenshot manifest | `docs/audits/p1/b5-m01-m02-presentation/screenshot-manifest.json` |
| Control classification | `docs/audits/p1/b5-m01-m02-presentation/control-classification.json` |
| Shots | `docs/audits/p1/b5-m01-m02-presentation/shots/` |

**Authoritative runtime:** production (`next build` + `next start`).

---

## 4. Matrices

| Dimension | Cases |
| --- | --- |
| Width | 1440, 1280, 1024, 768, 430, 390 |
| Appearance | Light, Dark, System+OS Light, System+OS Dark |
| M01 | Ready, demo/local honesty, priority attribution, attention fields, mobile |
| M02 | Ready, summary honesty, list/detail, Escape, mobile stacked |
| Exclusions | Patient/clinical firewall, domain NOT-STARTED, Aurora unintegrated, B6–B8 unauthorised |

### Totals (filled after validation)

| Metric | Value |
| --- | --- |
| `test:p1-b5` | **17 pass / 0 fail** |
| `test:p1-b1` … `test:p1-b4` | 21 / 22 / 13 / 19 pass (0 fail) |
| Full suite (`npm test`) | **252 pass / 0 fail** |
| Lint | **0 errors / 24 warnings** (parent lineage) |
| `tsc --noEmit` | Pass |
| Production build | Pass |
| Register validator | `failures: []` |
| Harness assertions | **469 pass / 0 fail** |
| Screenshots | **27** |
| GitHub workflows / check-runs / statuses (tip basis) | **0 / 0 / 0** (local validation only) |
| Owner acceptance | **Pending** |

---

## 5. Limitations (explicit)

- Owner acceptance **pending**
- Not durable domain completion
- Not full WCAG / pixel parity / GitHub CI / production approval
- Aurora not integrated
- Gaps not closed until owner acceptance
- `OWN-P1-009` / `OWN-P1-011` / `OWN-P1-016` remain open
- P1-B6–P1-B8 unauthorised

---

## 6. Final claim (implementation publish)

P1-B5 M01/M02 Decision A presentation parity implemented, validated and published for owner review — owner acceptance remains pending, durable M01/M02 services remain deferred, Aurora remains unintegrated, and no later batch, merge or deployment was authorised or performed.

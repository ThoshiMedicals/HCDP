# Programme Gate P0 — Prototype Parity Control Pack

**Claim (only):** Programme Gate P0 provenance and semantic control pack corrected and ready for owner acceptance review.

| Pin | SHA |
| --- | --- |
| Branch | `cursor/prototype-parity-programme-reset` |
| Accepted application baseline | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` |
| Evidence-bearing tip | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` |
| Decision A PNG tip | `66e6e6488b27b9098dadd8962473fedea5053614` |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |

## Status

- Decision A canonical PNGs: **installed** (9/9 `INSTALLED_HASH_OK`)  
- Control pack generation: deterministic extract → build → validate  
- **P1-B1:** owner accepted with qualifications and closed (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`  
- **P1-B2–P1-B8 / PPA / M08–M24 / production:** **not authorised**  
- PR / merge: **none**

## P1 readiness pack

Owner-review planning artefacts for the next prototype-parity phase live under [`phase1/`](./phase1/README.md):

- **P1B** prototype-parity plan (83 gaps, 8 batches) — **P1-B1** owner accepted with qualifications and closed (2026-08-13) at `fdb2beb5b0e786e42d358efa9875b6bba52666cd`; **P1-B2–P1-B8** remain `P1 — PLANNED, NOT AUTHORISED`
- **P1A** master product-definition / delivery-readiness pack — stamp `P1A — PLANNED, NOT AUTHORISED` — [`phase1/p1a/`](./phase1/p1a/README.md)
- **P1C** development-repository / architecture / production-readiness audit — stamp `P1C — PLANNED, NOT AUTHORISED` — [`phase1/p1c/`](./phase1/p1c/README.md)

P1-B1 acceptance does **not** authorise later batches, PR/merge/deploy, or production. Evidence: [`../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md`](../audits/p1/P1_B1_IMPLEMENTATION_EVIDENCE.md).

## Regenerate

```bash
node scripts/prototype-parity/run-parity-pack.mjs
```

Second generation must produce zero diff.

## Key outputs

- Master traceability JSON/CSV/MD  
- Canonical screen register (194)  
- Workflow/action register  
- Implementation re-audit M01–M24  
- Conflict/owner decision register (open=0)  
- Final design system contract + Decision A manifest  
- 27 self-contained implementation prompt packs  

Generated: `deterministic:baseline-b1152d36d3f4:decisionA-66e6e6488b27:proto-8843dbb315a6`

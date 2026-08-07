# Programme Gate P0 — Prototype Parity Control Pack

**Claim (only):** Programme Gate P0 semantic control pack corrected and ready for owner acceptance review.

| Pin | SHA |
| --- | --- |
| Branch | `cursor/prototype-parity-programme-reset` |
| Accepted application baseline | `b1152d36d3f47c15277f85b3e990f5e1c94bddcb` |
| Evidence-bearing tip | `e659dfc42a711d37a3e73b3ba7049190ca531e4a` |
| Decision A PNG tip | `66e6e6488b27b9098dadd8962473fedea5053614` |
| Programme tip at generation | `3a5505921bf645f0be90c2663c7d581fdeb18daf` |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |

## Status

- Decision A canonical PNGs: **installed** (9/9 `INSTALLED_HASH_OK`)  
- Control pack generation: deterministic extract → build → validate  
- P1 / PPA / M08–M24 implementation: **not authorised**  
- PR / merge: **none**

## Regenerate

```bash
node scripts/prototype-parity/run-parity-pack.mjs
```

Second generation must produce zero diff.

## Key outputs

- Master traceability JSON/CSV/MD  
- Canonical screen register (186)  
- Workflow/action register  
- Implementation re-audit M01–M24  
- Conflict/owner decision register (open=0)  
- Final design system contract + Decision A manifest  
- 27 self-contained implementation prompt packs  

Generated: `deterministic:baseline-b1152d36d3f4:decisionA-66e6e6488b27:proto-8843dbb315a6`

# Abort allowlist — prod-matrix-v3 RSC proof (D6)

**Status:** Evidence pointer only. Historical evidence files under `corrective-validation/prod-matrix-v3/` are **not** rewritten or deleted.  
**Phase:** 3 — narrow ERR_ABORTED allowlist in validator; preserve prior proof.

---

## Claim preserved

Prior corrective validation (`prod-matrix-v3`) recorded **6446** allowlisted environmental events, all classified as `environmental-nav-abort`.

## Evidence pointers (do not mutate)

| Artifact | Path |
| -------- | ---- |
| Summary count | `corrective-validation/prod-matrix-v3/summary.json` → `allowlistedEnvironmentalEventCount: 6446`, `eventsByClass["environmental-nav-abort"]: 6446` |
| Event sample corpus | `corrective-validation/prod-matrix-v3/allowlisted-environmental-events.json` |

## Recomputed proof (read-only check)

Against `allowlisted-environmental-events.json`:

- `class === "environmental-nav-abort"`: **6446 / 6446**
- URL contains `_rsc=`: **6446 / 6446**
- Without `_rsc=`: **0**
- `resourceType === "fetch"`: **6446 / 6446** (coincidental with RSC payloads; not an independent allowlist basis)
- Host/origin: same-origin `127.0.0.1` matrix base
- Failure text: `net::ERR_ABORTED`

Therefore narrowing the runtime allowlist to:

```text
same-origin AND net::ERR_ABORTED AND (_rsc= in URL OR verified Next prefetch headers)
```

**preserves** the historical 6446-event proof set. Removing bare `resourceType() === "fetch"` and bare `/_next/` as sufficient disjuncts does not reclassify those prior events.

## Phase 3 validator change

`scripts/ui-batch1-iv-findings-remediation-validate.mjs` `onRequestFailed` now requires the RSC/prefetch signature above. Classification rationale text written by the script documents the narrowed rule and points here.

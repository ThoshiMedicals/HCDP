# Corrective validation index (evidence contradiction)

Earlier raw evidence under  
`docs/audits/ui-batch1-independent-verification-findings-remediation/`  
was **not overwritten**. This subdirectory holds the corrective re-run.

## SHA provenance

See `sha-provenance.json`.

| Role | SHA |
| --- | --- |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Failed candidate | `ee9731e38e7d20d6d825e6c243503f4aea9564c3` |
| IV evidence tip | `51fbfa980b9c834184a384ddcf956340397bf205` |
| Required start tip | `575fc32ec8d74d0a984cff5c9522349f95439325` |
| Application source SHA tested (final) | `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742` |

`1ca3ba1` → `575fc32` is docs/report tip-pin only (no `src/` changes).

## Validator correction

`scripts/ui-batch1-iv-findings-remediation-validate.mjs`

Fail when any of: nav ≥400, unallowlisted HTTP ≥400, app page/console error, hydration (incl. React #418), horizontal overflow, typography/contrast/dark hard-gates, unallowlisted requestfailed.  
Narrow allowlist only: HMR websocket/status, DevTools install hints, same-origin RSC/prefetch `net::ERR_ABORTED`.  
Full raw events saved (no consoleBag.slice(0,100)).

## Runs (do not overwrite)

| Path | Mode | Result |
| --- | --- | --- |
| `prod-matrix/` | production @3480 (pre-app-fix classifier baseline) | 338 fail (hydration #418; no 500/403/JSON) |
| `prod-matrix-v2/` | production @3480 after classifier | 232 fail (hydration only; no 500/403/JSON) |
| `prod-matrix-v3/` | production @3480 after app hydration fixes @ `e6e2f90` | **338 / fail 0** |
| `dev-focused/` | next-dev @3481 pre-fix | 20 fail (hydration) |
| `dev-focused-v2/` | next-dev @3481 post-fix | **20 / fail 0** (HMR allowlisted separately) |
| `clean-server-starts/` | clean/warm @3482 pre-fix | no 500/403/JSON; hydration present |
| `clean-server-starts-v2/` | clean/warm @3482 post-fix | **all nav 200; zero 500/403/JSON; eventCount 0** |

## Adjudication of prior bag (500 / JSON / 403)

Prior truncated `console-bag.json` (100 entries) contained Dark@1440 samples with no route/URL:

- `Failed to load resource: … 500`
- `SyntaxError: Unexpected end of JSON input`
- `Failed to load resource: … 403`

Corrective attribution runs (production matrix, dark-1440 focused, three clean starts, three warm first requests) **did not reproduce** 500/403/JSON with route+resource.

Residual observation during this session: owner `next-dev` on :3000 briefly logged `SyntaxError: Unexpected end of JSON input` with `GET /dashboard 500` during compile/HMR, then recovered to 200. This supports classifying the prior bag entries as **transient next-dev compile/HMR noise**, not stable application route failures. Production mode showed **zero** such events.

**Residual risk:** `next-dev --webpack` can emit transient 500/JSON under concurrent compile; use production-mode matrix for runtime fail adjudication.

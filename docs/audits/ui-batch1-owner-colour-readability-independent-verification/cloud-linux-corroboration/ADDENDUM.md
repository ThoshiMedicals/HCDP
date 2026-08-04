# Cloud Linux corroboration addendum

This folder records an independent Linux/cloud verification pass that raced onto the same branch tip after `c27570d` (Windows verification report) was already pushed.

It does **not** overwrite the primary report at `docs/audits/HCDP_UI_BATCH1_OWNER_COLOUR_READABILITY_INDEPENDENT_VERIFICATION_REPORT.md`.

## Environment

- Linux 6.12.94+ / Node v22.14.0 / npm 10.9.7 / Chrome 148 / Playwright 1.49.0 (system Chrome channel)
- Candidate port 3465; baseline port 3466
- Owner port 3000 / PID 17288: **ABSENT** throughout (not restarted)

## Agreements with primary FAIL report

- Protected-scope presentation-only: PASS
- Focused token contrasts: primary ~14.6/14.8, muted 5.07/7.43, on-action 10.97/6.63, control border 3.84/3.10
- Typography: nav group labels at 12px (`--type-meta`) FAIL the ≥13px navigation gate
- Favourite-star contrast near/under 3:1 on active row
- Exact hash `7c14854a…6ee83` PASS
- tsc 21 / lint 2e+24w exact baseline match PASS
- Both builds PASS (after non-app env node_modules materialisation)
- M05 idle: **117/117** PASS (no retries)
- `/staff-pay` and `/m07`: intentionally unsupported 404 on candidate and `f3333b6`
- Automated module/PPA/OD-A2/crypto suites green

## Adjudication differences (same method on Linux)

| Topic | Primary report (c27570d) | This Linux pass |
| --- | --- | --- |
| Overall | FAIL | QUALIFIED (see verdicts.json) |
| Appearance persistence | FAIL | QUALIFIED — identical failure on `f3333b6` baseline |
| Hydration | FAIL (candidate-only) | PASS — no signatures on candidate or baseline |
| Cold Adjustments | QUALIFIED (warm 500 once) | PASS on clean-server HTTP×3 all 200 |
| Gate 20 readiness | FAIL | QUALIFIED |

Owner should treat the **stricter primary FAIL** as the conservative branch tip verdict unless/until hydration and appearance are re-run on a single agreed environment.

Local orphan commit preserving full Linux evidence tree: `eafd57e1a7bc33d10147afadffe1cea153d5a188`.

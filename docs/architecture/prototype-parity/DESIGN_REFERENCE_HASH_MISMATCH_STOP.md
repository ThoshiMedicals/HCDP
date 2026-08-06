# Design Reference Hash Mismatch — STOP

**Upload commit:** `b5feab7d71790aac75049b361817fa92eeb1a87d`  
**Generated:** 2026-08-06T22:25:41Z

## Result

| Check | Result |
| --- | --- |
| Nine files present on branch | YES (source filenames) |
| Dimensions 1672×941 | PASS (9/9) |
| SHA-256 match owner prompt table | **FAIL (0/9)** |
| Normalised names installed | NO (deferred) |

## Observed SHA-256 (candidates if owner authorises)

| Module | Normalised target | Observed SHA-256 |
| --- | --- | --- |
| M01 | `m01-command-centre-final.png` | `f600b734705bcc203a25cfbd1002f117b3949b3f78ddc84915e5d1497d6cd236` |
| M02 | `m02-action-inbox-final.png` | `9557ea9a432fd665a086e9a8d0621b8949a8c572dbbb3a811ce89ef03d74327f` |
| M04 | `m04-staff-doctors-final.png` | `146bd7c08d3fbc0f118c828d6dbd8a2b44e4ac0c4633f65af578b6a8cf492bc8` |
| M05 | `m05-weekly-roster-final.png` | `121786a1a07fd08d9a5e9e46e7652d50085a8e378c4650785af4debe81654d06` |
| M06 | `m06-time-attendance-final.png` | `86518204545f3e10a2ad37f5ca5bb4c7110d4632d3552d7ef6a9232ddd4f3a16` |
| M10 | `m10-checklists-final.png` | `1c2507878f42cfdc9792d85c93f2d185031ca55d7531fb83bd84eac095dc9ab4` |
| M11 | `m11-training-final.png` | `cf380fe1c7221275b8c9de158a8e6a9108ea2b54b649ac9c520b605eac2a349e` |
| M12 | `m12-compliance-quality-final.png` | `4ecb8eef079d30c796e5cb1b53b8b01595788e6f48fa81bb708a451b38e7c2a8` |
| M15 | `m15-inventory-assets-final.png` | `0ec5fbceac81554ef3edc38a92b4d29f7356b5c5ce4e91948e2faf863c3a61c6` |

## Owner decision required

**A.** Authorise these nine observed hashes as the new canonical final-design baselines (then agent will rename to normalised names, update registers, and clear DEC-FINAL-PNGS-MISSING).

**B.** Re-upload the exact originals whose SHA-256 match the programme prompt table.

Do not regenerate or redraw. Do not begin Programme Wave P1 on mismatched unverified baselines.


## Owner decision recorded

**Decision B** — do not accept observed hashes as canonical.

Actions taken after decision:
- Mismatched files moved out of `docs/design-references/final/` into `docs/design-references/mismatch-quarantine-b5feab7/`.
- Canonical `final/` awaits exact originals with programme-prompt SHA-256 and normalised `m0*-…-final.png` names.
- Evidence commit `a22f9a1` remains in branch history.
- Exact hash-matching originals were **not** found on the VM after decision B; re-upload required.

Updated: 2026-08-06T22:30:58Z

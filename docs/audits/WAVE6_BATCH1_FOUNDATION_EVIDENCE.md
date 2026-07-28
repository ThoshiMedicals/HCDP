# Wave 6 / M07 — Batch 1 Remediation Evidence (Final)

**Status:** Remediation complete locally — **not committed / not pushed**  
**Planning baseline:** `a4d756bbb25a874ffd7419abc74cf2595a21a129`  
**Scope:** Batch 1 remediation + evidence only (no Batch 2)

## Entity settings control fix

| Before | After |
|---|---|
| `ensureEntityPaySettings` could persist defaults under `payroll.view` during period create | Removed |
| — | `readEntityPaySettings` — view only; returns stored **or ephemeral** defaults; **never writes** |
| — | `upsertEntityPaySettings` — requires `payroll.entity.settings`; audited |
| — | `seedEntityPaySettingsIfAbsent` / `bootstrapDefaultEntityPaySettings` — system bootstrap insert-if-absent |
| Period create auto-wrote settings | Period create uses `getEntitySettings ?? deriveEntityPaySettingsDefaults` — **no persist** |

## Test totals

| Suite | Pass | Fail | Skip | Blocked |
|---|---:|---:|---:|---:|
| `test:m07` | **49** | 0 | 0 | 0 |
| `test:workforce` | 18 | 0 | 0 | 0 |
| `test:auth` | 16 | 0 | 0 | 0 |
| `test:m04` | 16 | 0 | 0 | 0 |
| `test:m11` | 37 | 0 | 0 | 0 |
| `test:m05` | 117 | 0 | 0 | 0 |
| `test:m06` | 64 | 0 | 0 | 0 |
| **Combined** | **317** | **0** | **0** | **0** (`BLOCKED-M07` unresolved) |

New suites: `m07-entity-settings.test.ts` (9), `m07-mutation-matrix.test.ts` (8); shell a11y assertions expanded.

## Shell evidence

- Playwright fixture evidence: `docs/audits/wave6-m07-batch1-shell-a11y-evidence.json`
- Generator: `src/modules/m07-staff-pay/tests/m07-shell-responsive-a11y-evidence.mjs`
- Viewports 1440/1280/1024/768/430/390: **overflowXPx = 0** all; navigation usable

## Parity

No parity-register implementation count increases.

## Safety

- No read permission persistence
- No prohibited identifiers
- No M06→`pulse.m07.*` writes
- `BLOCKED-M07` unresolved
- No Batch 2 workflows
- No doctor-pay / CSS redesign

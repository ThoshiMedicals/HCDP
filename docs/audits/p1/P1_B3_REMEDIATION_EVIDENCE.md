# P1-B3 — Independent remediation evidence (diff hygiene, a11y, acceptance evidence)

**Batch:** P1-B3  
**Status:** Remediated evidence pack — **owner accepted with qualifications — CLOSED (2026-08-13)** at tip `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`P1-B3-OWNER-ACCEPT-2026-08-13`)  
**Branch:** `cursor/p1-b3-register-hygiene`  
**Starting tip reviewed:** `a80405dd79dc180c1d2b3ffa470e9db219ff3b3c`  
**Parent of feat:** `4c84263ca27f7a23e71c5304cff4249e0d132e50`  
**Remediation / accepted tip:** `2515a4ffac0fb94cbd37092e26bf372cb43898f8` (`fix(p1-b3): remediate acceptance evidence and diff hygiene`)

**Not claimed:** production approval; WCAG/pixel parity; P1-B4–P1-B8; PR/merge/deploy; OWN-P1-011/016 closure; overall Programme P1

## Diff-hygiene findings (confirmed)

| File class | Apparent rewrite cause | Remediation |
| --- | --- | --- |
| `module-register.ts`, M07 TSX, `domain.ts`, tests, historic parity MD | LF→CRLF mechanical churn (+ small semantic edits) | Restored LF; retained only P1-B3 semantic edits |
| `workflow-action-register.json` | Full re-serialise: escaped `\u2014` → literal `—` across ~all items; only **3** items semantic | Restored parent bytes; surgically patched 3 nav-ctrl items; non-remapped regions **byte-identical** to parent |
| BOM | None introduced | Confirmed no UTF-8 BOM on remediated text files |

### JSON semantic remaps retained (required for register sync)

Regeneration of the whole file was **not** required. Targeted surgical edits only:

1. `nav-ctrl-training-records` — sectionId `records` → `assignments` (+ labels/targets/mapping reason/confidence)
2. `nav-ctrl-training-expiry` — sectionId `expiry` → `certificates` (+ labels/targets/mapping reason)
3. `nav-ctrl-training-catalogue` — visible label `Learning Catalogue` → `Course Catalogue`

All other JSON records: byte-equivalent to parent after remediation.

## Confirmed defects corrected

1. **Diff hygiene** — mechanical EOL/escape churn obscured review (fixed as above).
2. **Evidence weakness** — harness lacked System+OS Light/Dark distinctness, full width matrix, alias deep-link shots, overflow assertions, activation-block checks; mobile History/Adjustments shots were not distinctly gated (identical byte size risk).
3. **History activation hardening** — PlannedSection now also blocks Space/Enter on `keyup` (in addition to `keydown`/`click`) so synthesised activation cannot imply an operational History workflow.

## Evidence archive

Original `a80405dd` shots/report preserved under `docs/audits/p1/b3-register-hygiene/archive-a80405dd/`.

## Control preservation

83 gaps / 8 batches / 24 modules; M25 unimplemented; P1-B1/B2/B3 closed with qualifications; OWN-P1-011 and OWN-P1-016 open; P1-B4–P1-B8 unauthorised; no production approval.

# P1C Document Control and Duplication

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Policy for this audit

- **Do NOT delete, rename, or archive** conflicting documents in this planning run.  
- Record conflict IDs; recommend owner disposition later.  
- Prefer authoritative registers from P0/P1A hierarchy.

## Authoritative vs historical

| Prefer (authoritative) | Treat cautiously |
| --- | --- |
| `CURRENT_IMPLEMENTATION_REAUDIT.*` | `CURRENT_PLATFORM_INVENTORY.md` (24 Jul 2026) |
| `CANONICAL_SCREEN_REGISTER.*` / WAR / master trace | `HCDP_PROTOTYPE_PARITY_REGISTER.md` |
| `FINAL_DESIGN_SYSTEM_CONTRACT.md` + Decision A | Older theme packs |
| P1A/P1B phase1 packs | Root README phase narrative |
| `docs/plans/WAVE6_M07_PPA_*` | Any wording implying PPA authorised |
| Wave freeze evidence | UI Batch1 residual tooling debt claims vs tip `9142ec30b3b2efea1e959ad85ce1406562cd5faa` |

## Conflict register (P1C)

| Conflict ID | Sources | Nature | Recommended disposition (not executed) | Owner decision |
| --- | --- | --- | --- | --- |
| CONF-P1C-001 | Root `README.md` vs re-audit / module-register | README claims ~20 module routes and “No backend, auth, payroll engines” | Add superseded banner; rewrite README in authorised docs batch | OWN-P1C-001 |
| CONF-P1C-002 | `CURRENT_PLATFORM_INVENTORY.md` vs `CURRENT_IMPLEMENTATION_REAUDIT.*` | Inventory describes HTML iframe defaults / ~48 routes; re-audit shows Next workspaces + 24 modules | Banner: prefer re-audit; keep historical | OWN-P1C-002 |
| CONF-P1C-003 | Carry-forward CONF-P1A-001 | Narrow `prompts/p1.md` vs P1B B1–B8 | Owner OWN-P1-002 | Open |
| CONF-P1C-004 | Carry-forward CONF-P1A-003 | Historic parity register stub claims | Prefer re-audit | Open |
| CONF-P1C-005 | Carry-forward CONF-P1A-002 | Layered P0 pins vs programme-reset tip | Document layers | Open |
| CONF-P1C-006 | M07 “PPA-1 foundation” UI vs OWN-PPA-SEPARATE | Wording risk | Honesty labelling (P1-B3) — not PPA auth | OWN-P1-007 |
| CONF-P1C-007 | Path alias Development folder vs `docs/plans` | Broken links in some historical refs | Prefer worktree paths | Docs hygiene |
| CONF-P1C-008 | Playwright dependency vs missing config/harness | Implies E2E capability not evidenced | Decide keep/configure/remove **later** (no dep change now) | OWN-P1C-003 |

## Duplication notes (reuse, don’t fork)

| Topic | Existing SoT | P1C action |
| --- | --- | --- |
| Screens/actions | Canonical JSON registers | Pointer only |
| Gaps/batches | P1B | Reconcile, don’t renumber |
| Definition gaps | P1A DEF-GAP | Cross-link DEV-GAP |
| Permissions M07 | WAVE6 matrix | Extend platform view only |
| Storage keys | PLATFORM_STORAGE_REGISTER | Reuse |

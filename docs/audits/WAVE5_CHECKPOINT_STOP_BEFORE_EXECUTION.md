# Wave 5 Planning Checkpoint — Stop Before Execution

**Date:** 28 July 2026  
**Historical note:** This document records the **planning** stop before Wave 5 execution.  
Execution completed and Wave 5 is now **owner accepted and frozen** — see `docs/audits/WAVE5_CHECKPOINT_STOP_BEFORE_WAVE6.md`.

## Status (historical planning)

**Wave 5 (M06 Time & Attendance): PLANNING ONLY — execution NOT approved** *(superseded 28 July 2026 by owner acceptance)*.

Controlling plan: `docs/architecture/WAVE5_M06_IMPLEMENTATION_PLAN.md`  
Prior planning commit reviewed: `bfd83c268c9fe4bc07dd528265bfdb8c92e065a7`  
This document accompanies the planning-document **correction** (exact inventory, full transition matrices, canonical permissions, WF-19A/B split, acceptance accounting).

## Current freeze (superseding)

| Field | Value |
|---|---|
| Wave 5 status | Owner accepted and frozen |
| `acceptedCommit` | `6cfee6ca7ae2d0f58695569b9f61ffa939b97e49` |
| `acceptedDate` | 2026-07-28 |
| `productionApproved` | false |
| Freeze checkpoint | `docs/audits/WAVE5_CHECKPOINT_STOP_BEFORE_WAVE6.md` |

## Preserved Wave 4 freeze

| Field | Value |
|---|---|
| Wave 4 status | Owner accepted and frozen |
| Planning checkpoint | `03a0beff267c9aaf382d161cbfec9f3d0df013e1` |
| Accepted implementation | `15f020800bbca40702ef08ad25f94f1d1999112f` |
| Status closure | `cdc0478322307bd484afcd3dcbdc517b0d3918e9` |
| `BLOCKED-M10` | Remains blocked (informational; **outside** Wave 5 M06 totals) |

## Planning correction highlights

- §18 lists every proposed file individually (no wildcards).
- §8 transition matrices are fully explicit (permission, version, audit, event/M02, invalid, idempotency) with terminal/superseding/reversible semantics.
- §10.1 is the sole canonical permission catalogue (including `attendance.override`, `attendance.exception.raise`, `attendance.declare`, `attendance.sync.resolve`, `attendance.timesheet.generate`, `attendance.manager.enter`, evidence/audit codes).
- **WF-19A** (M06 `TimesheetRef` + `timesheet.approved` publication) must pass; **WF-19B** (M07 intake) remains **`BLOCKED-M07`**.
- Acceptance accounting: **21** M06 workflows must pass; **1** blocked intake item (`BLOCKED-M07`); `BLOCKED-M10` not counted in Wave 5 M06 totals.

## Next

**Wave 6 (M07) is NOT authorized.**

See `docs/audits/WAVE5_CHECKPOINT_STOP_BEFORE_WAVE6.md`.

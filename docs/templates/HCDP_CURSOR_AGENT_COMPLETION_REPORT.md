# HCDP Cursor Agent Completion Report

**Template version:** 1.0
**Use:** Copy to `docs/audits/<WAVE_OR_BATCH>_COMPLETION_REPORT.md` (or attach in PR) at end of an authorised slice/batch.
**Do not** treat a green build as completion.
**Do not** claim production approval unless the owner explicitly states it.

---

## 1. Identity

| Field | Value |
|---|---|
| Agent role | Feature / Integration / Evidence / QA / Controller |
| Agent / chat name | |
| Authorised batch id | _(none unless owner named one)_ |
| Slice name | |
| Pinned baseline SHA | |
| Branch | |
| Worktree path | |
| PR URL | |
| Date (local) | |

---

## 2. Scope confirmation

| Check | Yes/No | Notes |
|---|---|---|
| Worked only on the named authorised batch | | |
| Did not start the next batch | | |
| Did not implement PPA (unless batch is named PPA-*) | | |
| Did not implement payment / net-pay / bank / STP / super | | |
| Did not implement provider-return processing | | |
| Did not implement Xero production integration | | |
| Did not begin Module 8 / doctor pay | | |
| Did not edit wave-control without Controller+owner | | |
| Did not rewrite accepted Wave/Batch evidence | | |
| No direct commits to `main` | | |

---

## 3. Files

### Created

| Path | Purpose |
|---|---|
| | |

### Updated

| Path | Purpose |
|---|---|
| | |

### Intentionally not changed (hotspots / frozen)

| Path | Reason |
|---|---|
| | |

---

## 4. Ownership claims

| Claimed path pattern | Collision notes |
|---|---|
| | |

Integration hotspot edits (if any) â€” list and justify:

-

---

## 5. Data / contracts / storage

| Item | Detail |
|---|---|
| Contracts added/changed | |
| Storage keys (`pulse.mXX.*`) | |
| Migrations | Additive only? Y/N â€” describe |
| Cross-module repository imports | Must be **none** |

---

## 6. Workflows implemented

1.
2.

---

## 7. Cross-module integrations

| Boundary | Direction | Contract | Notes |
|---|---|---|---|
| | | | |

---

## 8. Tests performed

| Gate | Command | Pass | Fail | Skip/Block | Notes |
|---|---|---|---|---|---|
| Scoped | | | | | |
| Full `npm test` | | | | | |
| Lint | `npm run lint` | | | | |
| Build | `npm run build` | | | | |
| Platform QA | `npm run test:platform-qa` | | | | |
| Other | | | | | |

Known pre-existing qualifications retained (e.g. Batch 6 TS debt / M06 outbox):

-

---

## 9. Evidence gates

| Gate | Result | Evidence location |
|---|---|---|
| Browser workflows | Pass/Fail/Blocked | |
| Responsive (1440/1280/1024/768/430/390, overflow-x=0) | | |
| Permissions / SoD | | |
| Storage / migrations | | |
| Frozen-wave regression | | |

---

## 10. Defects

| ID | Severity | Found in | Status | Notes |
|---|---|---|---|---|
| | | | | |

---

## 11. Qualifications and non-claims

- Not production deployment approval: **confirmed**
- Not statutory/monetary certification: **confirmed**
- Export â‰  paid: **confirmed** (if export touched)
- Unlock â‰  PPA: **confirmed** (if unlock touched)
- Other qualifications:

---

## 12. Independent QA

| Field | Value |
|---|---|
| QA agent (must differ from implementer) | |
| QA branch | |
| QA result | Accept / Rework / Block |
| QA notes | |

---

## 13. Stop checkpoint

- [ ] Completion report filled
- [ ] PR checklist attached (`docs/templates/HCDP_PARALLEL_PR_CHECKLIST.md`)
- [ ] Next batch **not** started
- [ ] Awaiting owner acceptance

**Owner decision (fill later):** Accept / Accept with qualifications / Reject

**Owner decision SHA / date:**

---

*End of completion report template.*

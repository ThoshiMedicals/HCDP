# Wave 6 — M07 Workflow Catalogue

**Status:** PLANNING ONLY — not execution evidence  
**Module:** M07 Staff Pay & Payroll Preparation  
**Parent plan:** `docs/architecture/WAVE6_M07_IMPLEMENTATION_PLAN.md`  
**Owner Batch 1–3:** org isolation; M07 intake; SoD; doctor exclude; rate redaction; rules/leave; Pay approver; forbid bank/tax ids; one open period; waive matrix; min-PII export; explicit lock; code list; prototype parity gate

Independent workflow IDs for future execution evidence.

---

## Required workflows (planned)

| ID | Name | Expected business outcome |
|---|---|---|
| WF-01 | Create pay period | Org exists; one open ordinary period max; clinic tags; cadence dates |
| WF-02 | Event intake | Approved TimesheetRefs linked for period org |
| WF-03 | Duplicate / replayed event | No duplicate links/lines |
| WF-04 | Missed-event refresh | Links missed pubs; M06 unchanged |
| WF-05 | Superseding timesheet version | Newer sourceVersion supersedes; recalc flagged |
| WF-06 | Organisation validation | Org exists; engagement belongs; cross-org denied |
| WF-07 | Clinic filter subordinate | Within org only |
| WF-08 | Configurable cadence | Default fortnightly; weekly/monthly |
| WF-09 | Doctor / M08 exclusion | No pay lines; non-waivable |
| WF-10 | Second open period denial | `overlapping-open-period` |
| WF-11 | Prohibited identifier rejection | TFN/BSB/bank/super/credentials/payment instructions rejected |
| WF-12 | External payroll employee id | Sensitive id allowed; permission + audit |
| WF-13 | Missing rate / classification blockers | Block export-ready |
| WF-14 | Calculate ordinary + OT | Retain `ruleVersion`; non-certified labels |
| WF-15 | Rule governance | Permission, version, effective dates, audit |
| WF-16 | No silent locked/exported recalc | Rule change leaves locked results intact |
| WF-17 | Approved leave prep lines | Separate; leave id+version; non-certified |
| WF-18 | Unmapped/unapproved leave | Exception; never silent payable |
| WF-19 | Allowance/deduction codes | Versioned non-certified list |
| WF-20 | Unknown code blocking | Blocking exception; no silent export |
| WF-21 | Variance review | M05 read; no source rewrite |
| WF-22 | Exception resolve | Profile fix → recalc → close |
| WF-23 | Waiver SoD | Clerk cannot waive; approver/admin only; full audit |
| WF-24 | Non-waivable set | Cross-entity, doctor/M08, stale approval, duplicate intake |
| WF-25 | SoD final approve denial | Calculator/submitter cannot sole approve (single/bulk/delegated) |
| WF-26 | Pay approver final approval | Role owns final approve |
| WF-27 | Export operator restriction | Post export-ready only; no self-approve |
| WF-28 | Min-PII default export | Default fields only; names off; no bank/tax ids |
| WF-29 | Sensitive rate export gate | Requires profile + rate.view + permission + audit + marking |
| WF-30 | Export approval gate | Fail missing/stale/revoked/cross-entity approval |
| WF-31 | Explicit post-recon lock | Pay approver/admin only; Export operator denied; recon+approval+non-waivable clear; confirm+audit |
| WF-32 | Exported-unlocked restrictions | No uncontrolled recalc/re-intake/approval replace/source mutate |
| WF-33 | Prior-period adjustment coexistence | Linked to locked source; no ordinary re-intake |
| WF-35 | External payroll employee id on M07 profile | Org-scoped; unique when required; clinic managers redacted; relink audited; M04 unchanged |
| WF-36 | Clinic readiness gates final approval | Incomplete clinic readiness blocks when applicable; excluded clinics audited |
| WF-37 | Export profile admin vs operator | Admin versions profiles; operator selects only; history retains profile version |
| WF-38 | M04 classification → M07 rule map | Read-only M04; missing map blocks; rules in M07 Settings only |
| WF-34 | Parity non-placeholder rule | Mount/legacy HTML ≠ evidenced complete |

---

## Explicit non-workflows

| Code | Meaning |
|---|---|
| OUT-BANK | Bank payment / disbursement / Process Final Pay |
| OUT-STP / OUT-ATO | Statutory lodging |
| OUT-M08 | Doctor pay |
| OUT-CERT | Award/tax/super certification |
| OUT-UNLOCK | Ordinary/break-glass unlock |
| OUT-VENDOR | Named Xero adapter (deferred) |
| OUT-DOC-OVERRIDE | Doctor/M08 override |
| OUT-MULTI-OPEN | Concurrent ordinary open periods |

---

## BLOCKED-M07

M06 bridge remains **`BLOCKED-M07`** until M07 intake evidenced. M06 must not write `pulse.m07.*`.

---

## Evidence naming

One test per WF-ID; sidecar detail; no suite-green-only credit; no evidence for unimplemented behaviour during planning.

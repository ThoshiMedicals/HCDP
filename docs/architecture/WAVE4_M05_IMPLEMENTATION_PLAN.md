# Wave 4 Implementation Plan — Module 5 Roster & Shift Management

**Date:** 27 July 2026 (amended)  
**Status:** **PLANNING ONLY — Wave 4 execution NOT approved**  
**Controlling plan:** `docs/architecture/HCDP_CONNECTED_WORKFORCE_ARCHITECTURE_AND_CURSOR_PLAN.md`  
**Prerequisites:** Wave 2 and Wave 3 **owner accepted and frozen** (27 July 2026)  
**Wave 3 evidence:** `Development folder/docs/audits/WAVE3_M11_COMPLETION_REPORT.md`

Do **not** implement until explicit Wave 4 execution approval.  
Do **not** create/modify M05 implementation, migration, seed, test, workspace, or runtime registration files under this amendment.  
Do **not** alter frozen Wave 2 or Wave 3 implementation.  
Do **not** start Wave 5.

---

## Binding requirements

### 1. Source-of-truth boundaries

**M05 owns:** roster periods; draft and published roster versions; shifts and shift requirements; shift assignments; coverage calculations; open shifts; swap requests and roster-change workflows; publication and acknowledgement records; roster-specific warnings; roster cost forecasts.

**M04 owns:** workforce people and engagements; clinic assignments; employment classifications; readiness and the **authoritative roster-eligibility result**.

**M11** contributes training status **only through M04**.

| Concern | Owner | M05 may | M05 must not |
|---|---|---|---|
| Staff availability (workforce) | M04 | Read via workforce/availability contract | Own second employment-availability SoT |
| Recurring availability | M04 | Read for conflict checks | Duplicate as payroll/attendance truth |
| Unavailability | M04 | Read for conflict checks | Silently override |
| Approved leave | M04 | Consume via leave contract | Override without permission/reason/audit |
| Leave requests (workforce) | M04 | Read status | Approve workforce leave |
| Roster-availability declarations | M05 | Own roster-period preferences/declarations | Become M04 leave SoT |
| Roster requests (swap/change) | M05 | Own request lifecycle | Create M06 attendance or M07 payroll records |

**Hard rule:** M05 must not create M06 attendance records or M07 payroll records.

---

## 2. Roster-period lifecycle

| State | Meaning |
|---|---|
| `draft` | Editable working copy |
| `under_review` | Locked for coordinator/manager review |
| `ready_to_publish` | Validation passed; awaiting publish |
| `published` | Immutable snapshot released to workers |
| `partially_acknowledged` | Some recipients acknowledged |
| `fully_acknowledged` | All required recipients acknowledged |
| `superseded` | Replaced by newer publication version |
| `cancelled` | Withdrawn with audit |
| `archived` | Retained historically; not active |

| From | To | Who | Notes |
|---|---|---|---|
| draft | under_review | coordinator / clinic manager | Optional review gate |
| draft / under_review | ready_to_publish | coordinator / clinic manager | After validation |
| ready_to_publish | published | clinic manager / workforce admin | Creates immutable snapshot |
| published | partially_acknowledged | system | First ack |
| partially_acknowledged | fully_acknowledged | system | All required acks |
| published / partially / fully | superseded | clinic manager / admin | New version published |
| draft / under_review / ready | cancelled | coordinator / manager | Reason required |
| any terminal | archived | workforce admin / auditor path | Retention |

**Before publish:** hard-block conflicts resolved or overridden (permission + reason + audit); every assignment revalidated against M04/platform at publish `asOf`; capacity/role/clinic/leave/overlap checks complete; preview + warning/override summary presented.

**Emergency publication with warnings:** allowed only with `roster.publish` + emergency-override authority; reason + audit; warnings retained on snapshot.

**After published change:** new publication version or audited amendment; prior version remains readable as `superseded`. No silent rewrite of published history.

---

## 6. Shift lifecycle

| State | Meaning |
|---|---|
| `draft` | Editable, not firm commitment |
| `unassigned` | Needs a worker |
| `assigned` | Worker assigned (draft or published) |
| `open` | Released as open shift |
| `offered` | Offered to worker(s) |
| `accepted` | Worker accepted (pending final assign if required) |
| `declined` | Worker declined |
| `cancelled` | Cancelled with reason/audit |
| `completed-reference` | Shift ended; **not** attendance truth |
| `superseded` | Replaced by later version/amendment |

| Topic | Rule |
|---|---|
| Split shifts | Allowed as linked parts with shared `splitGroupId`; each part validated |
| Overnight / cross-midnight | Allowed; store UTC start/end + clinic-local start/end + timezone id |
| Recurring templates | Generate draft instances; template ≠ published truth |
| Breaks | Planned break fields only — not actual attendance/pay (M06/M07) |
| Location/role changes | Draft OK; published → new version or audited amendment |
| Cancel after acknowledgement | Reason + audit + notify; close related inbox items |
| Replace assigned worker | Eligibility recheck + history row retained |
| Assignment history | Append-only; no silent overwrite |

**Hard rule:** M05 must **not** infer actual attendance or payable hours (future M06/M07).

---

## 7. Eligibility and override rules

Every assignment, open-shift acceptance and swap **must** call M04/platform roster-eligibility.

Decision payload must include: `authority: "m04-platform"`; person; engagement; clinic; role/capability; shift time range; evaluated `asOf`; readiness result; blocking/warning reasons; rule/version refs; remediation where available.

| Condition class | Behaviour |
|---|---|
| Hard-block (suspended person, blocking credential/training, approved leave clash) | Block assignment |
| Warning (advisory readiness, soft fatigue) | Permit with warning |
| Authorised override | Permit only with assign + override permission, reason, audit |
| Never overridable (missing person SoT, unresolved clinic TZ for authoritative calc) | Always block |

Every override requires permission + reason + audit.

---

## 8. Availability and leave precedence

Recommended highest-wins order:

1. Emergency override (permission + reason + audit)  
2. Approved workforce leave (M04) — **no silent override**  
3. Declared unavailable (M04)  
4. Existing **published** assignments  
5. Draft assignments  
6. Open-shift applications  
7. Recurring availability (M04)  
8. Preferred / roster-availability declarations (M05)

After publication, if leave/availability changes: recalculate conflicts; warn coordinators; open/update M02 items; require reassignment or superseding publication for hard conflicts; do not silently keep invalid published assignments as conflict-free.

M05 may own roster-availability declarations and roster requests. Approved workforce leave is consumed through leave contract and must not become a second payroll/attendance SoT. M05 must not create M06 attendance or M07 payroll records.

---

## 9. Conflict, fatigue and safety policies

Versioned, explainable M05 policies (not hard-coded UI toasts only).

Minimum rules: overlapping shifts; minimum break; max daily/weekly scheduled hours; consecutive days; overnight/cross-midnight; travel/clinic-transfer time; role/clinic requirements; readiness expiry before/during shift; availability/leave conflicts.

Each result exposes rule id/version, severity, explanation, remediation.

**Do not** represent prototype policies as industrial-award, employment-law, or clinical-safety compliance certification.

---

## 10. Concurrent editing and version protection

Local prototype: optimistic version checks (not production-grade concurrency).

Prevent: silent overwrite of another manager’s draft; publishing stale draft; accepting already-filled open shift; approving swap after roster changed; acknowledging superseded publication.

Return clear conflict result with refresh/recovery behaviour. Do not claim production-grade concurrency while persistence remains local.

---

## 11. Publishing and acknowledgement

Define: pre-publication validation; preview; warning/override summary; immutable snapshot; recipient calculation; acknowledgement deadline; acknowledged/declined/unseen; reminder/escalation; superseding publications; cancellation; audit trail.

Superseded publications remain historically accessible. Acknowledgement applies to the **exact publication version** seen by the worker.

---

## 12. Swap workflow

request → proposed replacement → eligibility both workers → recipient acceptance (if required) → manager approval (if required) → reject/withdraw/expire → roster version update → notification closure.

Revalidate eligibility, availability, fatigue, and roster version at final approval. Prior check must not authorise a stale swap. Prevent self-approval where required.

---

## 13. Open-shift workflow

creation → audience → eligibility filter → EOI/direct accept → competing applicants → selection → withdraw/expire/escalate → assignment → closure.

Version-checked assignment; no duplicate accept; no ineligible bypass via direct service calls.

---

## 14. Cost forecast boundary

M05 cost forecast is **planning-only**, not payroll truth. M07 remains future payroll-preparation authority.

Define: rate snapshot/reference; ordinary/OT assumptions; allowances/on-costs; missing-rate warnings; clinic/role filters; version/`asOf`; rounding; forecast vs actual payroll labelling.

Sensitive rate/cost data needs separate permission, clinic scope, and export controls.

---

## 15. Fairness and allocation transparency

If ranking workers for open shifts, record: eligibility filters; ranking factors; manual override reason; final selection.  
Do not use protected/irrelevant personal attributes. Label as operational decision support, not autonomous employment decision-making.

---

## 16. Bulk-operation safety

For bulk shift creation, assignment, publishing, messaging: preview; validation; permission + clinic-scope; duplicate prevention; partial success; confirmation; version checking; notification-volume controls; audit; safe retry/idempotency.

---

## 17. Role and privacy model

Roles: worker; roster coordinator; clinic manager; workforce/HR administrator; finance viewer; auditor; emergency override authority.

Workers see only appropriate personal/team roster information. Restrict sensitive readiness explanations, leave reasons, cost/rate data, exports, cross-clinic information — all service-enforced.

---

## 18. Section-to-service matrix

| Section | Supporting service / read model |
|---|---|
| Roster Board | period + shift + assignment + eligibility read model |
| Coverage | coverage calculation service |
| Open Shifts | open-shift workflow service |
| Availability & Leave | M04 leave/availability contract read model |
| Requests | swap / roster-change request service |
| Conflicts & Warnings | versioned conflict/fatigue policy engine |
| Published History | publication snapshot + audit read model |
| Cost Forecast | planning-only forecast service |
| Reports | scoped reporting/export service |
| Settings | versioned policy management service |

---

## 19. State-transition matrices (summary)

### Roster period

`draft` → `under_review` → `ready_to_publish` → `published` → `partially_acknowledged` → `fully_acknowledged` → `superseded` / `cancelled` / `archived`

Emergency publish with warnings: only with publish + emergency-override permission, reason, audit. Published versions immutable; corrections = new version or audited amendment.

### Shift

`draft` → `unassigned` → `assigned` / `open` → `offered` → `accepted`|`declined` → assigned or cancelled → `completed-reference` / `superseded`

Split / overnight / cross-midnight allowed with UTC + clinic-local + timezone id stored. M05 must **not** infer actual attendance or payable hours.

### Swap

request → proposed replacement → eligibility both → recipient accept (if required) → manager approve (if required) → reject/withdraw/expire → roster version update → notification closure. Revalidate at final approval.

### Open shift

creation → audience → eligibility filter → EOI/accept → competing applicants → selection → withdraw/expire/escalate → assignment → closure. Version-checked; no duplicate accept; no ineligible bypass.

---

## 20. Acceptance / evidence matrices (required at execution)

- Exact planned file inventory (above)
- Section-to-service matrix (above)
- Twelve-workflow acceptance matrix (fresh pass/fail at execution)
- Permission and clinic-scope matrix
- Data-ownership matrix (above)
- Integration-contract matrix (above)
- State-transition matrices: roster, shift, swap, open shift
- M02 lifecycle matrix
- Performance matrix
- Test/evidence matrix

Require fresh evidence for: all 10 sections; all 12 workflows; permissions/clinic scope; publication immutability; concurrency/stale-version protection; eligibility/overrides; leave/availability precedence; conflict/fatigue rules; DST and cross-midnight; M02 lifecycle; bulk safety; cost-data privacy; migrations/idempotency/rollback; light/dark/device; all listed UX states including concurrent-conflict; keyboard + primary-path a11y; widths 1440–390; zero page overflow; full platform regression; lint; type-check; production build.

Report passed / failed / skipped / blocked separately.

---

## Appendix A — Data-ownership matrix

| Data | Owner | M05 |
|---|---|---|
| Roster periods / versions | M05 | Own |
| Shifts / assignments / open shifts / swaps | M05 | Own |
| Coverage / roster warnings / cost forecasts | M05 | Own |
| People / engagements / classifications / clinic assignments | M04 | Read via contract |
| Readiness / roster eligibility result | M04 | Consume via platform |
| Approved leave / workforce availability | M04 | Consume via contract; no silent override |
| Roster-availability declarations / roster requests | M05 | Own |
| Attendance / payable hours | M06 / M07 (future) | Must not create |

## Appendix B — Availability / leave precedence (recommended)

1. Emergency override (permission + reason + audit)  
2. Approved workforce leave (M04) — no silent override  
3. Declared unavailable (M04)  
4. Existing **published** assignments  
5. Draft assignments  
6. Open-shift applications  
7. Recurring availability (M04)  
8. Preferred / roster-availability declarations (M05)

## Appendix C — Section-to-service matrix

| Section | Supporting service / read model |
|---|---|
| Roster Board | period + shift + assignment + eligibility read model |
| Coverage | coverage calculation service |
| Open Shifts | open-shift workflow service |
| Availability & Leave | M04 leave/availability contract read model |
| Requests | swap / roster-change request service |
| Conflicts & Warnings | versioned conflict/fatigue policy engine |
| Published History | publication snapshot + audit read model |
| Cost Forecast | planning-only forecast service |
| Reports | scoped reporting/export service |
| Settings | versioned policy management service |

## Appendix D — Assumptions, risks, deferred

**Assumptions:** Demo Act-as; local prototype persistence; clinic TZ registry populated for demo clinics; M04 readiness registry registered at runtime.  
**Risks:** Stale eligibility if M04 cache not refreshed; notification storms on bulk publish; over-blocking fill; cost forecast mistaken for payroll; M10 adapter creating a second task SoT.  
**Deferred:** Production persistence; M06/M07; award/law/safety certification of fatigue rules; defer M10 adapter if boundary cannot be safely defined.

---

## 21. Stop gate (planning)

After amending this plan, return:
- amended section summary;
- exact planned file inventory;
- all requested matrices;
- assumptions, risks and deferred items.

**Stop.** Do not execute Wave 4. Do not alter frozen Wave 2 or Wave 3 implementation. Do not start Wave 5.

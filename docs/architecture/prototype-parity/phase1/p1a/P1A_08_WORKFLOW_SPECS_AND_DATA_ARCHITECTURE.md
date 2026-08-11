# P1A Workflow Specs and Data Architecture

**Stamp:** `P1A — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Documentation and planning only. Does **not** authorise implementation, approve P1-B1, claim legal compliance, or claim security certification.

## A. Material workflow specifications

Lifecycle fields used below: ID · name · objective · actors · trigger · preconditions · states · transitions · permissions · data touched · integrations · audit · errors · acceptance · wave · status.

### WF-M07-PREP — Ordinary staff-pay preparation (frozen accepted path)

| Field | Value |
| --- | --- |
| ID | WF-M07-PREP (aggregates Wave6 ordinary prep) |
| Objective | Produce reconciled export-ready payroll **preparation** package for a period |
| Actors | Pay admin, pay approver, export operator (SoD) |
| Trigger | Period create / intake / calculate / review |
| Preconditions | Org/clinic context; profiles; open period |
| States | Draft → In calculation → Exceptions → Ready for review → Approved → Export prepared → Locked |
| Transitions | Per WAVE6 workflow catalogue; lock/unlock controlled; **unlock ≠ PPA** |
| Permissions | `payroll.*` codes in M07 matrix |
| Data | Pay period, profiles, calcs, exceptions, export package metadata |
| Integrations | External payroll SoR via export artefacts only |
| Audit | Required on mutating steps (wave evidence) |
| Errors | Exception blockers; permission denied; locked period |
| Acceptance | Wave6 Batch6 evidence (qualified; not production/payment) |
| Wave | Closed ordinary prep |
| Status | Implemented (qualified) — presentation-only changes if P1-B6 |

### WF-M07-PPA — Prior-period adjustment (planned only)

| Field | Value |
| --- | --- |
| ID | WF-M07-PPA |
| Objective | Controlled post-lock/post-export correction cycle |
| Status | **Planned only — not authorised** |
| Source | `docs/plans/WAVE6_M07_PPA_READINESS_AND_DESIGN.md` |
| Note | Distinct from unlock/reopen |

### WF-M05-ROSTER / WF-M06-ATTENDANCE / WF-M04-WORKFORCE / WF-M11-TRAINING

Durable workflows exist under frozen waves. P1 must not alter domain transitions. Spec SoT remains wave catalogues + WAR dossiers + module tests. P1-B6 = presentation only.

### WF-M01 / WF-M02 / WF-M03 — Durable domain workflows

| Field | Value |
| --- | --- |
| Examples | Morning Executive Review; Triage/Resolve Action; SLA Escalation; Approval Delegation; Act-as / demo clock (M03) |
| IDs | See `prompts/p1.md` workflow dossiers (`bpflow_*`, `brdflow_*`) |
| Service/persistence/audit | NONE — NOT IMPLEMENTED (target P2) |
| P1 allowance | Chrome/honesty only — not durable completion |
| Status | Definition partial; implementation deferred P2 |

### WF-SHARED-APPEARANCE

| Field | Value |
| --- | --- |
| Objective | Persist Light/Dark/System appearance |
| States | System (default) / Light / Dark |
| Data | `pulse.cc.appearance` (or current theme key) |
| P1 relevance | In scope for P1-B1/B4 |
| Acceptance | Theme tests + settle rules |

### Placeholder module workflows (M08–M10/M12–M24)

No durable workflow specs authorised for implementation in P1. Future waves only. Honesty labelling may appear in P1-B3.

---

## B. Data architecture (planning)

### Principles

1. Non-clinical operations data only.  
2. Clinic/tenant isolation on read and write.  
3. SoR boundaries explicit; no forbidden clinical import.  
4. Synthetic test data only; no real patient data ever.  
5. Mutating domain data requires audit (actor, clinic, before/after, reason where required).

### Sensitivity classes

| Class | Examples | Retention (planned) |
| --- | --- | --- |
| PUBLIC | Marketing site content (M23) | Product-defined |
| INTERNAL | Operational configs, non-PII flags | Product-defined |
| STAFF-PII | Staff names, contact, employment identifiers | Counsel + HR policy |
| SENSITIVE-HR | Rates, disciplinary, access reviews | Strict; need-to-know |
| FINANCIAL-PREP | Pay-run prep amounts, export packages | Finance policy; ≠ paid |
| PROHIBITED-CLINICAL | Patient clinical records, diagnoses, prescriptions, appointments as SoR | **Must not store** |

### Core entity groups (non-exhaustive)

| Group | Entities (examples) | SoR | Tenancy |
| --- | --- | --- | --- |
| Identity | auth_identity_id, profile, session context | External IdP / demo | User |
| Org/clinic | organisation, clinic, memberships | Pulse ops | Org/clinic |
| Access | roles, permissions, delegations, access reviews | Pulse ops | Org |
| Workforce | staff/doctor employment records (ops) | Pulse M04 | Clinic/org |
| Roster | shifts, assignments | Pulse M05 | Clinic |
| Attendance | timesheets, approvals, TimesheetRef publish | Pulse M06 | Clinic |
| Staff pay prep | periods, calcs, exceptions, export packages | Pulse M07 prep | Org/clinic |
| Training | courses, assignments, completions | Pulse M11 | Org/clinic |
| Prohibited | patient clinical entities | External clinical | N/A — excluded |

### Persistence reality (current tip)

- Demo/local platform context and module local persistence patterns exist.  
- Portable SQL under migrations planned via AUTH plan; not a P1 implementation task.  
- Do not redesign DB under P1 parity.

### Clinical duplication flag

Any story that requires storing appointments, clinical notes, diagnoses, prescriptions, referrals, patient invoices, or BP patient records as Doctors Pulse SoR is **out of bounds** and must be rejected or redesigned as external reference only.

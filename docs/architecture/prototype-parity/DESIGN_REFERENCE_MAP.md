# Design Reference Map

## Image installation status

**All nine installed with matching SHA-256:** False

| Module | Route | Normalised file | Status |
| --- | --- | --- | --- |
| M01 | `/dashboard` | `m01-command-centre-final.png` | MISSING |
| M02 | `/action-inbox` | `m02-action-inbox-final.png` | MISSING |
| M04 | `/staff-doctors` | `m04-staff-doctors-final.png` | MISSING |
| M05 | `/roster` | `m05-weekly-roster-final.png` | MISSING |
| M06 | `/time-attendance` | `m06-time-attendance-final.png` | MISSING |
| M10 | `/tasks-actions` | `m10-checklists-final.png` | MISSING |
| M11 | `/training` | `m11-training-final.png` | MISSING |
| M12 | `/compliance-quality` | `m12-compliance-quality-final.png` | MISSING |
| M15 | `/inventory-assets` | `m15-inventory-assets-final.png` | MISSING |

Manifest: `docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json`

## Design-system derivation (pages without a supplied image)

| Pattern source | Used for |
| --- | --- |
| M01 dashboard | Executive, analytics, financial overview |
| M02 master-detail queue | Approvals, exceptions, tickets, incidents, documents, admin queues |
| M04 people master-detail | Recruitment, users, doctor-pay people review |
| M05 board/matrix | Rosters, schedules, Kanban, time-based planning |
| M06 live-operations | Attendance, monitoring, service status, reconciliation |
| M10 template/run/detail | Recurring operational workflows |
| M11 learning/progress | Programmes, acknowledgements, evidence |
| M12 governance/audit | Compliance, risk, findings, CAPA, policy review |
| M15 inventory/asset | Stock, equipment, rooms, printers, suppliers, work orders |

Derived pages must reuse shared tokens, density, shell, table, detail-panel and responsive rules.

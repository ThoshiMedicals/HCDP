# Cross-Module Ownership and Connection Map

One authoritative owner per business record. Use contracts, events, projections and source links — **no** cross-module repository imports.

| Module | Owns |
| --- | --- |
| M01 | Read-only executive summaries with source-completeness and drill-downs |
| M02 | Receives action/approval/exception/notification projections |
| M03 | Organisation, tenant, clinic, user and access scope |
| M04 | Workforce person, engagement, credential, restriction, readiness |
| M05 | Rosters, shifts, coverage, publication |
| M06 | Attendance, timesheets, approved publication to M07 |
| M07 | Staff pay preparation only (not execution); PPA separately authorised |
| M08 | Doctor pay calculation/payslip/dispute records (no bank execution) |
| M09 | BBPIP forecasting and outcome reconciliation (aggregate) |
| M10 | Tasks, checklist templates/occurrences, handovers, meeting actions |
| M11 | Learning, assignment, competency, certificate, exemption |
| M12 | Compliance, accreditation, audit finding, CAPA verification |
| M13 | Controlled operational documents and policy versions |
| M14 | Tickets and work orders |
| M15 | Stock, supplier, purchase, supplier invoice, equipment, rooms, printers, assets |
| M16 | Operational incident, complaint classification, risk, continuity |
| M17 | Governed outbound communications and delivery status |
| M18 | Digital monitoring, privileged access, secrets, security operations |
| M19 | Metric definitions, data-quality cases, change governance |
| M20 | Tenant-facing commercial plans/workspaces |
| M21 | Vendor-level provisioning and portfolio operations |
| M22 | Recruitment until controlled promotion into M04 |
| M23 | Tenant website/SEO/public form routing |
| M24 | Forecasts, immutable baselines, actual-vs-forecast review |

## Mandatory relationships

- M03 owns organisation/tenant/clinic/user/access
- M06 publishes approved timesheets to M07
- M07 owns staff pay preparation only; M08 owns doctor pay records separately
- M10 owns tasks/checklists/handovers/meetings and projects to M02/M01
- M22 promotes into M04 under controlled transition
- M02 is the single cross-module action/approval/exception/notification queue
- M01 is read-only executive summary with source-completeness labels and drill-downs
- M01/M02 cross-module integration remains **IN-DEVELOPMENT** until producer modules exist

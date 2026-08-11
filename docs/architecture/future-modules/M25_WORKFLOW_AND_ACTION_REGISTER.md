# M25 — Workflow and action register (future planning)

**Status:** every item `FUTURE — NOT IMPLEMENTED`  
**Totals:** 12 navigation controls + 19 command/read actions + 13 workflows = **44** planned items  
**False production-control rule:** none of these may be counted as production controls, mapped to placeholder shells, or marked FUNCTIONALLY-COMPLETE.

Common dossier defaults (all items):

| Field | Value |
| --- | --- |
| permission | Role matrix per M25 BRD; enforce service-side auth on mutate |
| servicePath / serviceMethod / repositoryPath | `FUTURE — NOT IMPLEMENTED` |
| componentHandler | `FUTURE — NOT IMPLEMENTED` |
| auditResult / persistenceProof / m01m02Projection | `FUTURE — NOT IMPLEMENTED` (nav/read: NOT APPLICABLE where non-mutating) |
| automatedTest / acceptanceTest | `FUTURE — NOT IMPLEMENTED` |
| evidencePath | `NONE — NOT YET AUTHORISED` |
| targetWave | `FUTURE-M25` (unscheduled until owner names a batch) |
| sectionMappingConfidence | proven for nav-section IDs from planned register; unresolved where brief does not bind a screen |

## A. Navigation controls (12)

| id | label | sectionId | classification |
| --- | --- | --- | --- |
| `m25-nav-print-command-centre` | Navigate Print Command Centre | `print-command-centre` | navigation |
| `m25-nav-device-fleet` | Navigate Device Fleet | `device-fleet` | navigation |
| `m25-nav-live-monitoring` | Navigate Live Monitoring | `live-monitoring` | navigation |
| `m25-nav-usage-analytics` | Navigate Usage Analytics | `usage-analytics` | navigation |
| `m25-nav-cost-and-tco` | Navigate Cost and TCO | `cost-and-tco` | navigation |
| `m25-nav-consumables` | Navigate Consumables | `consumables` | navigation |
| `m25-nav-maintenance-lifecycle` | Navigate Maintenance and Lifecycle | `maintenance-lifecycle` | navigation |
| `m25-nav-privacy-secure-print` | Navigate Privacy and Secure Print | `privacy-secure-print` | navigation |
| `m25-nav-optimisation` | Navigate Optimisation | `optimisation` | navigation |
| `m25-nav-sustainability` | Navigate Sustainability | `sustainability` | navigation |
| `m25-nav-reports` | Navigate Reports | `reports` | navigation |
| `m25-nav-settings-integrations` | Navigate Settings and Integrations | `settings-integrations` | navigation |

## B. Screen actions (19)

| id | label | sectionId | classification | notes |
| --- | --- | --- | --- | --- |
| `m25-act-cc-filter` | Apply clinic/date filters on Command Centre | `print-command-centre` | read-filter | |
| `m25-act-cc-drilldown` | Drill down from Command Centre KPI | `print-command-centre` | navigation | |
| `m25-act-fleet-register` | Register printer device | `device-fleet` | command-mutation | audit required |
| `m25-act-fleet-edit` | Edit printer device | `device-fleet` | command-mutation | audit required |
| `m25-act-fleet-relocate` | Relocate printer device | `device-fleet` | command-mutation | audit required |
| `m25-act-fleet-retire` | Retire printer device | `device-fleet` | command-mutation | audit required |
| `m25-act-fleet-csv-import` | CSV import device fleet | `device-fleet` | command-mutation | audit required |
| `m25-act-monitor-refresh` | Manual telemetry refresh (throttled) | `live-monitoring` | command-mutation | permission + throttle |
| `m25-act-usage-filter` | Filter usage analytics | `usage-analytics` | read-filter | |
| `m25-act-cost-recalculate` | Recalculate cost/TCO with versioned assumptions | `cost-and-tco` | command-mutation | preserve calc version |
| `m25-act-cost-scenario` | Run cost scenario comparison | `cost-and-tco` | command-mutation | |
| `m25-act-consumable-reorder` | Start approved replenishment workflow | `consumables` | command-mutation | M15 SoR for stock |
| `m25-act-maint-create-wo` | Create/link M14 maintenance work order | `maintenance-lifecycle` | command-mutation | contract only |
| `m25-act-privacy-investigate` | Open secure-print exception investigation | `privacy-secure-print` | command-mutation | no payload storage |
| `m25-act-opt-approve` | Approve optimisation recommendation | `optimisation` | command-mutation | no auto policy change |
| `m25-act-opt-measure` | Record recommendation realised outcome | `optimisation` | command-mutation | |
| `m25-act-report-export-csv` | Export report CSV | `reports` | command-mutation | audited |
| `m25-act-report-pdf` | Generate print/PDF-ready report | `reports` | command-mutation | audited |
| `m25-act-settings-save` | Save settings/integration config | `settings-integrations` | command-mutation | privileged |

## C. End-to-end workflows (13)

| id | title | primary section | steps (summary) |
| --- | --- | --- | --- |
| `m25-wf-register-printer` | Register a printer | `device-fleet` | capture identity → validate clinic/location → set capabilities → link asset/supplier → activate → audit |
| `m25-wf-network-discovery` | Authorised network discovery | `settings-integrations` | privilege check → allowlist ranges → discover → review candidates → accept/reject → audit |
| `m25-wf-telemetry-poll` | Telemetry polling and failure handling | `live-monitoring` | schedule → SNMPv3 poll → store observation → delta/reset flags → failure escalate → audit |
| `m25-wf-low-consumable` | Low-consumable alert and replenishment | `consumables` | detect low → M02 event → replenishment draft → M15 stock action → confirm → audit |
| `m25-wf-offline-escalation` | Printer offline escalation | `live-monitoring` | detect offline → threshold → M02 event → optional M14/M16 → restore → close |
| `m25-wf-maintenance-wo` | Maintenance work-order creation | `maintenance-lifecycle` | fault → create/link M14 WO → track status → close in M14 → reflect in M25 |
| `m25-wf-counter-reset` | Counter reset or device replacement | `live-monitoring` | detect anomaly → quarantine deltas → confirm replacement/reset → reopen baseline → audit |
| `m25-wf-cost-reconcile` | Cost calculation and reconciliation | `cost-and-tco` | load assumptions → calculate → label actual/calc/est → reconcile vs budget → version lock |
| `m25-wf-secure-exception` | Secure-print exception investigation | `privacy-secure-print` | alert → assign → investigate (no content) → remediate → retain per policy → audit |
| `m25-wf-opt-review` | Optimisation recommendation review and approval | `optimisation` | generate explainable rec → owner review → approve/reject → no auto enforce |
| `m25-wf-opt-outcome` | Recommendation outcome measurement | `optimisation` | baseline → implement manually → measure realised saving → close |
| `m25-wf-device-retire` | Device retirement | `device-fleet` | eligibility → data wipe checklist → retire → asset update (M15) → audit |
| `m25-wf-report-gen` | Report generation | `reports` | select report → period/clinic scope → generate → export CSV/PDF → audit access |

## D. Accounting (planning)

| Metric | Count |
| --- | ---: |
| Screens | 12 |
| Navigation controls | 12 |
| Non-nav actions | 19 |
| Workflows | 13 |
| **Action+workflow items** | **44** |
| Production controls (claimed) | **0** |
| Placeholder-shell mapped controls | **0** |

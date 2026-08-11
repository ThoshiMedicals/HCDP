# M25 — Requirement traceability (future planning)

**Status:** all IDs `FUTURE — NOT IMPLEMENTED`  
**Source:** owner-approved M25 brief (post-P0 acceptance `b0c4c4d`)

## Module / route

| ID | Capability |
| --- | --- |
| `m25-req-mod-001` | Module identity Print Fleet, Cost, Security & Sustainability Management |
| `m25-req-route-001` | Primary route `/print-fleet` |
| `m25-req-bound-001` | Clinical boundary — no patient records, print contents, or clinical workflow data |

## Screens (section contracts)

| ID | Section |
| --- | --- |
| `m25-req-sec-print-command-centre` | Print Command Centre |
| `m25-req-sec-device-fleet` | Device Fleet |
| `m25-req-sec-live-monitoring` | Live Monitoring |
| `m25-req-sec-usage-analytics` | Usage Analytics |
| `m25-req-sec-cost-and-tco` | Cost and TCO |
| `m25-req-sec-consumables` | Consumables |
| `m25-req-sec-maintenance-lifecycle` | Maintenance and Lifecycle |
| `m25-req-sec-privacy-secure-print` | Privacy and Secure Print |
| `m25-req-sec-optimisation` | Optimisation and Recommendations |
| `m25-req-sec-sustainability` | Sustainability |
| `m25-req-sec-reports` | Reports |
| `m25-req-sec-settings-integrations` | Settings and Integrations |

## Command Centre KPIs

| ID | Display |
| --- | --- |
| `m25-req-cc-001` | Printers online / offline / warning / critical |
| `m25-req-cc-002` | Pages this month |
| `m25-req-cc-003` | Monthly print cost |
| `m25-req-cc-004` | Colour percentage |
| `m25-req-cc-005` | Duplex percentage |
| `m25-req-cc-006` | Unreleased or expired secure jobs |
| `m25-req-cc-007` | Low-consumable alerts |
| `m25-req-cc-008` | Devices approaching warranty end |
| `m25-req-cc-009` | Open maintenance work orders |
| `m25-req-cc-010` | Estimated avoidable cost |
| `m25-req-cc-011` | Estimated environmental measures |
| `m25-req-cc-012` | Clinic and date filters |
| `m25-req-cc-013` | Drill-downs into relevant M25 screens |

## Security / telemetry / privacy

| ID | Capability |
| --- | --- |
| `m25-req-secarch-001` | No browser direct poll of clinic-private IPs |
| `m25-req-secarch-002` | Clinic-side connector / private-network service |
| `m25-req-secarch-003` | SNMPv3 default; legacy v1/v2c exception only |
| `m25-req-secarch-004` | Encrypted credentials; never expose in UI/logs/reports |
| `m25-req-secarch-005` | Authorised subnet ranges + rate limits/timeouts/allowlists |
| `m25-req-secarch-006` | Privileged auditable subnet discovery |
| `m25-req-secarch-007` | Separate telemetry vs print-job metadata |
| `m25-req-secarch-008` | No print payloads or patient information |
| `m25-req-telem-001` | RFC 3805 Printer MIB v2 baseline |
| `m25-req-telem-002` | Dynamic table index / consumable discovery |
| `m25-req-telem-003` | Vendor capability maps + unsupported metric recording |
| `m25-req-telem-004` | Observation store fields (raw, ts, device, source, quality, delta, reset) |
| `m25-req-priv-001` | APP + state/territory health-privacy default context |
| `m25-req-priv-002` | SNMP ≠ privacy compliance proof |
| `m25-req-priv-003` | No document content storage |
| `m25-req-priv-004` | Document names only if privacy/security/retention approved |

## Analytics / cost / sustainability boundaries

| ID | Capability |
| --- | --- |
| `m25-req-analytics-001` | No SNMP user/document-type/abandoned-job identity claims |
| `m25-req-analytics-002` | User/doc/unreleased analytics only via approved print-mgmt integration |
| `m25-req-analytics-003` | No patient names / contents / unrestricted filenames |
| `m25-req-cost-001` | Label actual vs calculated vs estimated |
| `m25-req-cost-002` | Preserve assumptions and calculation versions |
| `m25-req-sust-001` | Environmental conversions labelled estimates with methodology |

## Reports

| ID | Report |
| --- | --- |
| `m25-req-rep-001` | Print Cost Assessment Report |
| `m25-req-rep-002` | Fleet Health Report |
| `m25-req-rep-003` | Device TCO Comparison |
| `m25-req-rep-004` | Consumables Forecast |
| `m25-req-rep-005` | Secure Print and Privacy Report |
| `m25-req-rep-006` | Waste and Sustainability Report |
| `m25-req-rep-007` | Optimisation Opportunity Register |
| `m25-req-rep-008` | Clinic and period comparisons |
| `m25-req-rep-009` | Permission-controlled CSV export (audited) |
| `m25-req-rep-010` | Print/PDF-ready generation (audited) |

## Optimisation recommendation attributes

| ID | Attribute |
| --- | --- |
| `m25-req-opt-001` | Evidence |
| `m25-req-opt-002` | Assumptions |
| `m25-req-opt-003` | Estimated saving |
| `m25-req-opt-004` | Implementation impact |
| `m25-req-opt-005` | Confidence |
| `m25-req-opt-006` | Responsible owner |
| `m25-req-opt-007` | Approval status |
| `m25-req-opt-008` | Realised outcome |
| `m25-req-opt-009` | No automatic printer policy change or device retirement |

## Integrations / M01 / M02

| ID | Capability |
| --- | --- |
| `m25-req-int-m01` | M01 executive print KPI projections |
| `m25-req-int-m02` | M02 actionable print events |
| `m25-req-int-m03` | M03 org/location/user/permission consumption |
| `m25-req-int-m12` | M12 privacy/compliance evidence |
| `m25-req-int-m13` | M13 policies/assessment reports |
| `m25-req-int-m14` | M14 work-order create/link/status |
| `m25-req-int-m15` | M15 asset/supplier/consumable/cost SoR |
| `m25-req-int-m16` | M16 incidents/risks |
| `m25-req-int-m18` | M18 connector/credentials/network monitoring |
| `m25-req-int-m19` | M19 trends/data-quality |
| `m25-req-m01-kpi-001` … `008` | M01 dashboard indicators (see integrations doc) |
| `m25-req-m02-evt-*` | M02 event types (see integrations doc) |

## Workflow requirement IDs

| ID | Workflow |
| --- | --- |
| `m25-req-wf-register-printer` | Register a printer |
| `m25-req-wf-network-discovery` | Authorised network discovery |
| `m25-req-wf-telemetry-poll` | Telemetry polling and failure handling |
| `m25-req-wf-low-consumable` | Low-consumable alert and replenishment |
| `m25-req-wf-offline-escalation` | Printer offline escalation |
| `m25-req-wf-maintenance-wo` | Maintenance work-order creation |
| `m25-req-wf-counter-reset` | Counter reset or device replacement |
| `m25-req-wf-cost-reconcile` | Cost calculation and reconciliation |
| `m25-req-wf-secure-exception` | Secure-print exception investigation |
| `m25-req-wf-opt-review` | Optimisation recommendation review and approval |
| `m25-req-wf-opt-outcome` | Recommendation outcome measurement |
| `m25-req-wf-device-retire` | Device retirement |
| `m25-req-wf-report-gen` | Report generation |

**Requirement ID total (enumerated rows above, excluding ranges):** 90+ traceable IDs including section, KPI, security, report, opt, integration, and workflow families.

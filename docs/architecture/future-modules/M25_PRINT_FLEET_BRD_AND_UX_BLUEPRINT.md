# M25 — Print Fleet, Cost, Security & Sustainability Management

**Module:** M25  
**Status:** `FUTURE — NOT IMPLEMENTED`  
**Document class:** Future-development business requirements + UX blueprint  
**Planning tip basis:** Programme Gate P0 accepted at `b0c4c4d`  
**Clinical boundary:** MCOP must **not** store patient records, printed-document contents, or clinical workflow data.

## 1. Identity

| Field | Value |
| --- | --- |
| Number | 25 |
| Id (planned) | `print-fleet` |
| Display name | Print Fleet, Cost, Security & Sustainability Management |
| Short name | Print Fleet |
| Primary route (planned) | `/print-fleet` |
| Family (planned) | Assets / Digital Operations adjacent |
| Tier (planned) | core |
| Access (planned) | operational + finance + compliance (role matrix below) |
| Condition (planned) | `missing` until implementation batch — **not** wired in runtime register today |

### Primary users

Practice Owner, Executive, Practice Manager, IT Administrator, Finance Officer, Compliance Manager, and authorised Location Manager.

## 2. Business purpose

Provide one enterprise workspace for monitoring printer assets, operating costs, consumables, maintenance, print security, waste reduction, and sustainability across all medical-centre locations.

M25 **supplements** existing asset, supplier, security, compliance, analytics, and work-order modules. It must **not** duplicate their systems of record:

| Concern | System of record | M25 role |
| --- | --- | --- |
| Inventory / stock / suppliers / asset register | M15 | Consume / project relevant records |
| Work-order execution | M14 | Create or link WOs; display status |
| Org / locations / users / permissions | M03 | Consume |
| Privacy / compliance evidence | M12 | Project evidence; do not replace |
| Policies / assessment documents | M13 | Link approved policies/reports |
| Incidents / risk | M16 | Raise / link print-related items |
| Connector / credential / network security | M18 | Connector health & credential custody |
| Enterprise analytics / DQ | M19 | Trends & data-quality reporting |
| Executive KPIs | M01 | Publish summaries only |
| Actionable events | M02 | Publish inbox events only |

## 3. UX blueprint — screens (complete)

Every screen status: `FUTURE — NOT IMPLEMENTED`. Deep-link pattern (planned): `/print-fleet?section=<sectionId>`.

| # | Section ID | Screen | Purpose |
| ---: | --- | --- | --- |
| 1 | `print-command-centre` | Print Command Centre | Fleet health, cost, secure-job, consumable, warranty, WO, avoidable-cost, and environmental summary KPIs with clinic/date filters and drill-downs |
| 2 | `device-fleet` | Device Fleet | Authorised device register, edit, relocate, retire, CSV import; audited mutations |
| 3 | `live-monitoring` | Live Monitoring | Connectivity, uptime, counters, consumable levels, poll status, anomalies, throttled manual refresh |
| 4 | `usage-analytics` | Usage Analytics | Volume/cost trends by clinic/device/department/approved role aggregate; no SNMP user/document claims |
| 5 | `cost-and-tco` | Cost and TCO | Consumable, paper, service, lease, electricity, cost/page, TCO, budget, avoidable cost, scenarios; label actual/calculated/estimated |
| 6 | `consumables` | Consumables | Catalogue, yield, stock, reorder, forecast; replenishment workflow; M15 ownership of inventory |
| 7 | `maintenance-lifecycle` | Maintenance and Lifecycle | Faults, downtime, warranty, contracts, EOL, repair-vs-replace; M14 WO link |
| 8 | `privacy-secure-print` | Privacy and Secure Print | Secure-release adoption, open-tray exceptions, expired jobs, privacy-risk workflow; APP + health-privacy context |
| 9 | `optimisation` | Optimisation and Recommendations | Explainable owner-reviewable recommendations; no auto policy/retirement |
| 10 | `sustainability` | Sustainability | Paper, avoided pages, duplex, energy, waste, emissions/tree-equivalents as **estimates** with methodology |
| 11 | `reports` | Reports | Named assessment reports; permission-controlled CSV/PDF; audited exports |
| 12 | `settings-integrations` | Settings and Integrations | Connector, SNMPv3, allowlists, schedules, integrations, retention, privacy, costs, roles |

### 3.1 Print Command Centre — display requirements

`m25-req-cc-001` … display: printers online/offline/warning/critical; pages this month; monthly print cost; colour %; duplex %; unreleased/expired secure jobs; low-consumable alerts; warranty-approaching devices; open maintenance WOs; estimated avoidable cost; estimated environmental measures; clinic and date filters; drill-downs into relevant M25 screens.

### 3.2 Device Fleet — fields and actions

Device name; manufacturer/model; serial; asset ID; IP/hostname (access-controlled); clinic/department/location; type/capabilities; mono/colour; duplex; connection method; print server/integration; purchase/lease/install dates; warranty/contract expiry; supplier/service provider; operational status; last successful poll; lifecycle state.

Actions: authorised register, edit, relocate, retire, CSV import — all mutations audited (`m25-req-fleet-mut-*`).

### 3.3 Live Monitoring

Connectivity; uptime; lifetime impression counter; interval volume deltas; consumable levels by colour; paper/device alerts where available; last/next poll; repeated poll failures; counter-reset or replacement anomalies; manual refresh with throttling and permission control.

### 3.4 Usage Analytics — boundaries

Include volume by clinic, device, department, approved role aggregate; mono vs colour; simplex vs duplex; paper-size distribution where available; D/W/M/Y trends; peak periods; cost per clinic/cost centre; baselines/targets.

**Do not claim** SNMP can identify users, document types, or abandoned jobs.  
User-level, document-category, or unreleased-job analytics **only** via approved print-server / print-management integration with data minimisation, retention limits, and RBAC.  
**Do not ingest** patient names, document contents, or unrestricted document filenames.

### 3.5 Cost and TCO

Consumable purchase price and rated yield; actual-yield overrides; paper cost; service/maintenance; lease/depreciation; estimated electricity; cost/mono page; cost/colour page; device/clinic/fleet TCO; actual vs budget; avoidable-cost estimate; scenario comparison.  
Distinguish **actual / calculated / estimated**; preserve assumptions and calculation versions.

### 3.6–3.12

Consumables, Maintenance, Privacy/Secure Print, Optimisation, Sustainability, Reports, and Settings — as specified in the approved owner brief (full field lists retained in `M25_REQUIREMENT_TRACEABILITY.md`).

## 4. Security architecture (planning)

- Do **not** poll clinic-private IPs from the browser.
- Use a controlled clinic-side connector or approved private-network service.
- Default **SNMPv3** auth+encryption; legacy v1/v2c only via explicit approved exception.
- Encrypt stored credentials; never expose community strings/SNMP credentials in UI, logs, or reports.
- Discovery only across explicitly authorised IP ranges; rate limits, timeouts, allowlists.
- Automatic subnet discovery = privileged, auditable operation.
- Separate device telemetry from print-job metadata.
- Do not capture print payloads or patient information.

## 5. Standard telemetry (planning)

Baseline: RFC 3805 Printer MIB v2 + applicable system/host-resource MIBs.  
Do not assume a fixed table index for every printer — discover indices and consumable descriptions dynamically; maintain vendor capability maps; record unsupported metrics explicitly.

Store per observation: raw counter; timestamp; device identity; data source; quality/status; calculated interval delta; reset/rollover flag.

## 6. Privacy / compliance context

Default Australian context: Australian Privacy Principles and applicable state/territory health-privacy requirements.  
SNMP polling does **not** prove privacy compliance.  
Do not store document content. Avoid collecting document names unless approved through privacy, security, and retention review.

## 7. Source classification

| Class | Meaning |
| --- | --- |
| SOURCE-BACKED | Restated from owner-approved M25 brief (this programme message) |
| APPROVED-DESIGN | Explicit design decision recorded in this pack |
| IMPLEMENTATION-ASSUMPTION | Requires owner decision before build |

See `M25_OWNER_DECISIONS_REQUIRED.md`.

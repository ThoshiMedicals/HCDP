# M25 — Canonical screen register (future planning)

**Status:** every row `FUTURE — NOT IMPLEMENTED`  
**Route (planned):** `/print-fleet`  
**Design reference:** derived-from-design-contract + M15/M18 adjacency (no Decision A PNG for M25)  
**Do not** map these IDs to placeholder ModuleLanding headings as production controls.

| screenId | sectionId | sectionLabel | deepLink (planned) | visibleActionIds (planned) | evidence |
| --- | --- | --- | --- | --- | --- |
| `m25-screen-print-command-centre` | `print-command-centre` | Print Command Centre | `/print-fleet?section=print-command-centre` | `m25-nav-print-command-centre`, `m25-act-cc-filter`, `m25-act-cc-drilldown` | NONE — NOT YET AUTHORISED |
| `m25-screen-device-fleet` | `device-fleet` | Device Fleet | `/print-fleet?section=device-fleet` | `m25-nav-device-fleet`, `m25-act-fleet-register`, `m25-act-fleet-edit`, `m25-act-fleet-relocate`, `m25-act-fleet-retire`, `m25-act-fleet-csv-import` | NONE — NOT YET AUTHORISED |
| `m25-screen-live-monitoring` | `live-monitoring` | Live Monitoring | `/print-fleet?section=live-monitoring` | `m25-nav-live-monitoring`, `m25-act-monitor-refresh` | NONE — NOT YET AUTHORISED |
| `m25-screen-usage-analytics` | `usage-analytics` | Usage Analytics | `/print-fleet?section=usage-analytics` | `m25-nav-usage-analytics`, `m25-act-usage-filter` | NONE — NOT YET AUTHORISED |
| `m25-screen-cost-and-tco` | `cost-and-tco` | Cost and TCO | `/print-fleet?section=cost-and-tco` | `m25-nav-cost-and-tco`, `m25-act-cost-recalculate`, `m25-act-cost-scenario` | NONE — NOT YET AUTHORISED |
| `m25-screen-consumables` | `consumables` | Consumables | `/print-fleet?section=consumables` | `m25-nav-consumables`, `m25-act-consumable-reorder` | NONE — NOT YET AUTHORISED |
| `m25-screen-maintenance-lifecycle` | `maintenance-lifecycle` | Maintenance and Lifecycle | `/print-fleet?section=maintenance-lifecycle` | `m25-nav-maintenance-lifecycle`, `m25-act-maint-create-wo` | NONE — NOT YET AUTHORISED |
| `m25-screen-privacy-secure-print` | `privacy-secure-print` | Privacy and Secure Print | `/print-fleet?section=privacy-secure-print` | `m25-nav-privacy-secure-print`, `m25-act-privacy-investigate` | NONE — NOT YET AUTHORISED |
| `m25-screen-optimisation` | `optimisation` | Optimisation | `/print-fleet?section=optimisation` | `m25-nav-optimisation`, `m25-act-opt-approve`, `m25-act-opt-measure` | NONE — NOT YET AUTHORISED |
| `m25-screen-sustainability` | `sustainability` | Sustainability | `/print-fleet?section=sustainability` | `m25-nav-sustainability` | NONE — NOT YET AUTHORISED |
| `m25-screen-reports` | `reports` | Reports | `/print-fleet?section=reports` | `m25-nav-reports`, `m25-act-report-export-csv`, `m25-act-report-pdf` | NONE — NOT YET AUTHORISED |
| `m25-screen-settings-integrations` | `settings-integrations` | Settings and Integrations | `/print-fleet?section=settings-integrations` | `m25-nav-settings-integrations`, `m25-act-settings-save` | NONE — NOT YET AUTHORISED |

**Screen total:** 12  
**UI / domain / integration / evidence status (all):** `FUTURE — NOT IMPLEMENTED`

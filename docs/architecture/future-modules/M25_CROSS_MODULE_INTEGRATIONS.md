# M25 — Cross-module integration map (future planning)

**Status:** `FUTURE — NOT IMPLEMENTED`  
**Rule:** contracts/events only — no cross-module repository imports.

| Peer | Direction | Contract intent | M25 must not |
| --- | --- | --- | --- |
| **M01** Executive Command Centre | M25 → M01 | Publish executive print KPIs and critical exceptions (fleet availability, monthly cost, avoidable cost, low consumables, privacy exceptions, open printer WOs, colour/duplex trends, sustainability progress) | Own executive UI |
| **M02** Action Inbox | M25 → M02 | Publish actionable events: low toner, offline devices, privacy exceptions, approvals | Replace inbox SoR |
| **M03** Organisation & Access | M03 → M25 | Clinics, departments, users, roles, permissions | Duplicate org model |
| **M12** Compliance & Quality | M25 ↔ M12 | Privacy/policy/compliance evidence projections | Replace compliance SoR |
| **M13** Documents & Policies | M25 ↔ M13 | Approved print policies and assessment report artefacts | Own controlled-document SoR |
| **M14** Ticketing / Work Orders | M25 → M14 → M25 | Create/link maintenance WOs; display status | Execute WO lifecycle |
| **M15** Inventory & Assets | M15 ↔ M25 | Asset, supplier, consumable, cost, procurement records — M15 owns inventory | Duplicate stock SoR |
| **M16** Incidents & Risk | M25 → M16 | Print-related incidents and risks | Replace incident SoR |
| **M18** Digital Operations | M18 ↔ M25 | Connector health, credentials, network security, monitoring | Store SNMP secrets in UI/logs |
| **M19** Analytics | M25 → M19 | Enterprise trends and data-quality reporting for print metrics | Claim ungoverned metric truth |

## M01 future dashboard hooks (planning)

Add M25 summary indicators to the **future** M01 Executive Command Centre design:

1. Fleet availability  
2. Monthly print cost  
3. Estimated avoidable cost  
4. Low-consumable count  
5. Privacy/security exceptions  
6. Open printer work orders  
7. Colour and duplex trends  
8. Sustainability progress  

Requirement IDs: `m25-req-m01-kpi-001` … `m25-req-m01-kpi-008`.

## M02 future inbox hooks (planning)

Add M25 actionable event types to the **future** M02 Action Inbox design (non-exhaustive):

- `print.device.offline`  
- `print.consumable.low`  
- `print.privacy.exception`  
- `print.discovery.review-required`  
- `print.recommendation.approval-required`  
- `print.wo.linked`  

Requirement IDs: `m25-req-m02-evt-*`.

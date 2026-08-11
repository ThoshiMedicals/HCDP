# M01 / M02 — Future dashboard and inbox definitions for M25

**Status:** `FUTURE — NOT IMPLEMENTED`  
**Does not** alter accepted M01/M02 runtime behaviour or Wave evidence.

## Future M01 Executive Command Centre — M25 summary strip

| Indicator | Requirement ID | Source module | Notes |
| --- | --- | --- | --- |
| Fleet availability | `m25-req-m01-kpi-001` | M25 | Online vs total managed devices |
| Monthly print cost | `m25-req-m01-kpi-002` | M25 | Label actual/calculated/estimated |
| Estimated avoidable cost | `m25-req-m01-kpi-003` | M25 | Estimate with methodology link |
| Low-consumable count | `m25-req-m01-kpi-004` | M25 | Devices/stock below threshold |
| Privacy/security exceptions | `m25-req-m01-kpi-005` | M25 | Open secure-print / open-tray exceptions |
| Open printer work orders | `m25-req-m01-kpi-006` | M25←M14 status | Display only; M14 executes |
| Colour and duplex trends | `m25-req-m01-kpi-007` | M25 | Trend vs baseline |
| Sustainability progress | `m25-req-m01-kpi-008` | M25 | Estimate metrics vs target |

Drill-down targets: corresponding M25 section deep-links (`/print-fleet?section=…`).

## Future M02 Action Inbox — M25 event types

| Event type | Trigger examples | Requirement family |
| --- | --- | --- |
| `print.device.offline` | Offline beyond threshold | `m25-req-m02-evt-offline` |
| `print.consumable.low` | Device or stock low | `m25-req-m02-evt-consumable` |
| `print.privacy.exception` | Open-tray / expired secure job policy breach | `m25-req-m02-evt-privacy` |
| `print.discovery.review-required` | Authorised discovery candidates | `m25-req-m02-evt-discovery` |
| `print.recommendation.approval-required` | Optimisation rec awaiting owner | `m25-req-m02-evt-opt` |
| `print.wo.linked` | M25-created M14 WO needs attention | `m25-req-m02-evt-wo` |

Projection path (planned): M25 services → `pulse` action-inbox contracts — same producer pattern as other modules; **not implemented**.

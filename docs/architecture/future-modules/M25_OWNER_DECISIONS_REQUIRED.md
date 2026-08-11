# M25 — Security and privacy boundaries + owner decisions required

**Status:** planning only — `FUTURE — NOT IMPLEMENTED`

## Security boundaries (must hold in any future build)

1. No browser-origin SNMP/network scans against clinic private IPs.  
2. Clinic-side connector or approved private-network service only.  
3. SNMPv3 default; v1/v2c only with explicit exception record.  
4. Credentials encrypted at rest; never rendered in UI, logs, exports, or reports.  
5. Discovery limited to authorised ranges; rate-limited; allowlisted; auditable.  
6. Telemetry store separate from any print-job metadata store.  
7. No print payloads, patient identifiers, or clinical document contents in M25.

## Privacy boundaries

1. APP + applicable state/territory health-privacy as default Australian context.  
2. SNMP availability/telemetry ≠ privacy compliance evidence.  
3. Document names collected only after privacy/security/retention approval.  
4. User/document/unreleased-job analytics only via approved print-management integration with minimisation and RBAC.

## SoR boundaries

| Data | Owner module |
| --- | --- |
| Stock / procurement / asset master | M15 |
| Work-order execution | M14 |
| Org structure / users / roles | M03 |
| Controlled policies | M13 |
| Compliance evidence packs | M12 |
| Incidents | M16 |
| Connector credentials / network security ops | M18 |

## Owner decisions still required (IMPLEMENTATION-ASSUMPTION)

| ID | Decision |
| --- | --- |
| `m25-dec-001` | Name and schedule the M25 implementation batch / programme wave |
| `m25-dec-002` | Apply planned entry to runtime `module-register.ts` (expands live nav to 25) |
| `m25-dec-003` | Whether to add M25 to `pulse-html-prototype.html` MODULE_BLUEPRINTS / BRD_V2 |
| `m25-dec-004` | Clinic-side connector product choice and hosting model |
| `m25-dec-005` | Approved print-server / Universal Print / PaperCut (or equivalent) vendors |
| `m25-dec-006` | IconName addition vs reuse (`box` placeholder) |
| `m25-dec-007` | Retention periods for telemetry, secure-job metadata, and investigation notes |
| `m25-dec-008` | Whether Location Manager is a first-class role in M03 or a scoped permission |
| `m25-dec-009` | Environmental conversion factors and citation sources |
| `m25-dec-010` | Whether M25 contributes to Decision A visual pack (new PNG) or derived-only UI |
| `m25-dec-011` | Legacy SNMP v1/v2c exception approval authority and expiry |
| `m25-dec-012` | Data residency / tenancy rules for connector-buffered observations |

# Cursor Prompt — FUTURE-M25: Print Fleet, Cost, Security & Sustainability Management

## 1. Authority and predecessor acceptance gate

- **Not authorised until** the owner expressly names an M25 implementation batch.
- **Planning basis tip:** Programme Gate P0 owner-accepted `b0c4c4d20de1cce7adac5d691c506122e30610a2`
- **Planning pack SoT:** `docs/architecture/future-modules/*M25*`
- This prompt is **future-planning only**. It does **not** authorise application code, schema, SNMP, connectors, dependencies, localhost work, P1, PPA, PR, or merge.

## 2. Branch / start-ref rules (when implementation is later authorised)

1. Start from the owner-accepted predecessor programme tip named in the batch order.  
2. Create `cursor/prototype-parity-*` (or owner-named) feature branch.  
3. Apply runtime module-register entry from `M25_MODULE_REGISTER_ENTRY.md` only when the batch says so.  
4. No merge to main unless owner asks.

## 3. Exact in-scope screens and requirement IDs

- **Module:** M25  
- **Primary route(s):** `/print-fleet`  
- **Status:** `FUTURE — NOT IMPLEMENTED`  
- **Valid section IDs (complete):** `print-command-centre`, `device-fleet`, `live-monitoring`, `usage-analytics`, `cost-and-tco`, `consumables`, `maintenance-lifecycle`, `privacy-secure-print`, `optimisation`, `sustainability`, `reports`, `settings-integrations`  
- **Screen IDs (complete):** see `M25_SCREEN_REGISTER.md` (12 screens)  
- **Requirement IDs (complete):** see `M25_REQUIREMENT_TRACEABILITY.md`

## 4. Exact actions and workflows

- **Action + workflow totals:** 44 planned items (12 nav + 19 actions + 13 workflows) — `M25_WORKFLOW_AND_ACTION_REGISTER.md`  
- Every dossier field for services/handlers/repos/tests/evidence: `FUTURE — NOT IMPLEMENTED`  
- **Production controls claimed:** 0  
- Do not map requirements onto placeholder ModuleLanding headings as production evidence.

## 5. Domain ownership and integration contracts

- Owner: Print fleet cost, security, sustainability operations (non-clinical)  
- Cross-module map: `M25_CROSS_MODULE_INTEGRATIONS.md`  
- M15 owns inventory; M14 owns WO execution; M18 owns connector credential custody  
- M01/M02 projections planned but **IN-DEVELOPMENT** until producers exist

## 6. Permissions and clinic/tenant isolation

- Roles: Practice Owner, Executive, Practice Manager, IT Administrator, Finance Officer, Compliance Manager, authorised Location Manager  
- Clinic/tenant isolation on read and write; IP/hostname fields access-controlled  
- Privilege for discovery and credential management

## 7. Persistence and audit requirements

- All device mutations, discovery, exports, recommendation approvals, and settings changes: durable persist + reload proof + audit (actor/clinic/before-after) when implemented  
- Navigation/read: domain audit NOT APPLICABLE  
- Telemetry observations: raw + timestamp + device + source + quality + delta + reset/rollover

## 8. Implementation batches (module-specific — planning outline only)

1. Runtime register + route shell + permissions (still no SNMP)  
2. Device fleet CRUD + CSV import + audit  
3. Clinic-side connector + SNMPv3 polling + observation store  
4. Command Centre + live monitoring + offline/consumable M02 events  
5. Cost/TCO versioning + consumables (M15 projection) + maintenance (M14 link)  
6. Privacy/secure-print workflows (no content storage)  
7. Optimisation recommendations (approve-only; no auto enforce)  
8. Sustainability estimates + reports/exports (audited)  
9. Settings/integrations + M01 KPI projections + evidence pack

## 9. Automated tests (when implemented)

- Permission/isolation negatives for mutate paths  
- No credential leakage in UI/logs/exports  
- Observation delta/reset handling  
- M14/M15 contract boundaries (no repo imports)  
- Recommendation approval does not mutate printer policies automatically  
- Export/report audit events  
- All marked `FUTURE — NOT IMPLEMENTED` until batch authorises tests

## 10. Visual QA

- Derived-from-design-system unless owner authorises a Decision A PNG for M25  
- Do not invent Overview section; use Valid section IDs above only

## 11. Explicit prohibitions

- No patient/clinical content storage  
- No browser SNMP  
- No automatic policy change or device retirement from recommendations  
- No claiming SNMP identifies users/documents/abandoned jobs  
- No P1/PPA/M08 implementation under this prompt  
- No false production-control evidence

## 12. Stop checkpoint

Planning documentation complete. **STOP** until owner names an M25 implementation batch.

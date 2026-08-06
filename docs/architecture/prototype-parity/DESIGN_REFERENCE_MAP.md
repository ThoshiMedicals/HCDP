# Design Reference Map

## Image installation status

**Owner revised decision A:** accept `b5feab7` observed SHA-256 as canonical baselines.

**All nine installed with recorded SHA-256:** True  
**Dimensions 1672×941:** 9/9

| Module | Route | Canonical file | Dimensions | Canonical SHA-256 | Status |
| --- | --- | --- | --- | --- | --- |
| M01 | `/dashboard` | `m01-command-centre-final.png` | 1672x941 | `f600b734705bcc203a25cfbd1002f117b3949b3f78ddc84915e5d1497d6cd236` | INSTALLED_HASH_OK |
| M02 | `/action-inbox` | `m02-action-inbox-final.png` | 1672x941 | `9557ea9a432fd665a086e9a8d0621b8949a8c572dbbb3a811ce89ef03d74327f` | INSTALLED_HASH_OK |
| M04 | `/staff-doctors` | `m04-staff-doctors-final.png` | 1672x941 | `146bd7c08d3fbc0f118c828d6dbd8a2b44e4ac0c4633f65af578b6a8cf492bc8` | INSTALLED_HASH_OK |
| M05 | `/roster` | `m05-weekly-roster-final.png` | 1672x941 | `121786a1a07fd08d9a5e9e46e7652d50085a8e378c4650785af4debe81654d06` | INSTALLED_HASH_OK |
| M06 | `/time-attendance` | `m06-time-attendance-final.png` | 1672x941 | `86518204545f3e10a2ad37f5ca5bb4c7110d4632d3552d7ef6a9232ddd4f3a16` | INSTALLED_HASH_OK |
| M10 | `/tasks-actions` | `m10-checklists-final.png` | 1672x941 | `1c2507878f42cfdc9792d85c93f2d185031ca55d7531fb83bd84eac095dc9ab4` | INSTALLED_HASH_OK |
| M11 | `/training` | `m11-training-final.png` | 1672x941 | `cf380fe1c7221275b8c9de158a8e6a9108ea2b54b649ac9c520b605eac2a349e` | INSTALLED_HASH_OK |
| M12 | `/compliance-quality` | `m12-compliance-quality-final.png` | 1672x941 | `4ecb8eef079d30c796e5cb1b53b8b01595788e6f48fa81bb708a451b38e7c2a8` | INSTALLED_HASH_OK |
| M15 | `/inventory-assets` | `m15-inventory-assets-final.png` | 1672x941 | `0ec5fbceac81554ef3edc38a92b4d29f7356b5c5ce4e91948e2faf863c3a61c6` | INSTALLED_HASH_OK |

Manifest: `docs/design-references/final/DESIGN_REFERENCE_MANIFEST.json`  
Mismatch evidence (preserved): `DESIGN_REFERENCE_HASH_MISMATCH_STOP.md` @ `a22f9a1`  
Historical quarantine copies: `docs/design-references/mismatch-quarantine-b5feab7/`

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

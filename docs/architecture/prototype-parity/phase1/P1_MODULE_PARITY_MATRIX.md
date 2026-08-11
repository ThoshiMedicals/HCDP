# P1 Module-by-Module Parity Matrix

**Stamp:** `P1 — PLANNED, NOT AUTHORISED`  
**Axes:** UI · Domain · Integration · Evidence · Production (independent; GLOBAL design)  
**Legend:** FC = FUNCTIONALLY-COMPLETE · ID = IN-DEVELOPMENT · PO = PROTOTYPE-ONLY · NS = NOT-STARTED · OA = OWNER-ACCEPTED · BL = BLOCKED · PH = placeholder shell

## Summary matrix

| Module | Route | UI | Domain | Integration | Evidence | Prod | Shell | P1 recommended? | Primary gap IDs | Later wave |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SHARED | chrome | Partial | N/A | N/A | Partial | NS | Active | **Yes — core** | 002–010, 049–052 | P1 |
| M01 | `/dashboard` | FC | NS | ID | OA | NS | Interactive | Presentation only | 016, 019–020, 071–072 | P2 |
| M02 | `/action-inbox` | FC | NS | ID | OA | NS | Interactive | Presentation only | 017, 019, 021, 068 | P2 |
| M03 | `/settings` | FC | NS | ID | OA | NS | Interactive | Honesty labels | 018, 005–007, 032 | P2 |
| M04 | `/staff-doctors` | FC | FC | FC | OA | NS | Domain | Design apply only | 022, 027–031 | P2 |
| M05 | `/roster` | FC | FC | FC | OA | NS | Domain | Design apply only | 023, 027–031 | P2 |
| M06 | `/time-attendance` | FC | FC | FC | OA | NS | Domain | Design apply only | 024, 027–031 | P2 |
| M07 | `/staffpay` | FC | FC | FC | OA | NS | Domain | Design apply + honesty | 012, 025, 027–030, 079, 061 | P2 / P6-PPA |
| M08 | `/doctorpay` | PO | NS | NS | NS | NS | PH | Honesty only | 033, 059 | P6 |
| M09 | `/bbpip` | PO | NS | NS | NS | NS | PH | Honesty only | 034 | P6 |
| M10 | `/tasks-actions` | ID* | ID* | BL | NS | NS | PH | Honesty only | 035, 080 | P3 |
| M11 | `/training` | FC | FC | FC | OA | NS | Domain | Register sync + design | 011, 026–031 | P2 |
| M12 | `/compliance-quality` | ID* | ID* | NS | NS | NS | PH | Honesty only | 036 | P5 |
| M13 | `/documents-policies` | PO | NS | NS | NS | NS | PH | Honesty only | 037 | P4 |
| M14 | `/ticket-desk` | PO | NS | NS | NS | NS | PH | Honesty only | 038 | P4 |
| M15 | `/inventory-assets` | PO | NS | NS | NS | NS | PH | Honesty only | 039 | P5 |
| M16 | `/incidents-risk` | ID* | ID* | NS | NS | NS | PH | Honesty only | 040 | P5 |
| M17 | `/communications` | PO | NS | NS | NS | NS | PH | Honesty only | 041 | P7 |
| M18 | `/digital-ops` | PO | NS | NS | NS | NS | PH | Honesty only | 042 | P7 |
| M19 | `/analytics` | PO | NS | NS | NS | NS | PH | Honesty only | 043 | P7 |
| M20 | `/saas` | PO | NS | NS | NS | NS | PH | Honesty only | 044 | P8 |
| M21 | `/vendor-console` | PO | NS | NS | NS | NS | PH | Honesty only | 045 | P8 |
| M22 | `/recruitment` | PO | NS | NS | NS | NS | PH | Honesty only | 046 | P8 |
| M23 | `/website-studio` | PO | NS | NS | NS | NS | PH | Honesty only | 047 | P8 |
| M24 | `/financial-forecast` | PO | NS | NS | NS | NS | PH | Honesty only | 048 | P6 |
| M25 | — | — | — | — | — | — | Absent | **Out of scope** | 062 | Parked |

\*ID with placeholderShell=true means partial/seed panels or labels — **not** a complete module. Do not treat as implemented.

## 20-dimension heat map (P1 surfaces)

| Dimension | SHARED | M01–M03 | M04–M07/M11 | M08–M10/M12–M24 |
| --- | --- | --- | --- | --- |
| 1 Screens/routes | Partial parity | Routes exist; domain thin | Routes+sections strong | Landing routes only |
| 2 Tabs/sections | Section nav shared | Present | Present | Chips only |
| 3 Data states | N/A / demo | Seed/demo heavy | Domain data | None |
| 4 Actions | Mixed real/stub | Many UI; few durable | Domain actions | None |
| 5 Forms | Appearance prefs | Partial | Domain forms | None |
| 6 Filters/search | Nav search | Module filters vary | Domain filters | None |
| 7 Drill-downs | Drawer primitive | Present | Present | None |
| 8 Roles/permissions | Nav gating | Classification | Enforced in domain | Badge only |
| 9 Alerts | Toasts/demo | M02 UI | Domain exceptions | None |
| 10 Empty/load/error/denied | Partial | Partial | Partial→good (M05/06/11) | N/A |
| 11 Audit | N/A chrome | Absent durable | Present in waves | None |
| 12 Reports/export/print | Stub export | Demo packs | Module reports vary | None |
| 13 Responsive | Partial | Partial | Partial | Landing only |
| 14 Appearance L/D/S | Implemented+persist | Uses shared | Uses shared | Uses shared |
| 15 A11y/keyboard | Partial | Partial | Partial | Minimal |
| 16 Demo/reset | Present | Heavy | UxStateDemo some | None |
| 17 Business rules | N/A | Thin | Wave rules (qualified) | None |
| 18 Prototype-only | Dual surface OK | Seed titles | Frozen quals | Entire module |
| 19 Material dash diffs | Batch1 changes | De-crowded M01 | Design pending | N/A |
| 20 Patient/clinical | Firewall | Mock ops titles only | Workforce only | M08 BP wording risk |

## Counts for P1 planning

| Bucket | Modules / areas |
| --- | --- |
| Recommended P1 implementation touch | SHARED, honesty on M03/Topbar/demo, register hygiene M07/M11, presentation on M01/M02 + accepted modules |
| Deferred domain build | M01–M03 services; M10; M08/M09/M12–M24 |
| Excluded | M25, PPA product, payment, patient/clinical/BP records |

Cross-links: [gap register](./P1_PROTOTYPE_PARITY_GAP_REGISTER.md) · [batches](./P1_EXECUTION_BATCHES.md) · [exclusions](./P1_SCOPE_EXCLUSIONS.md)

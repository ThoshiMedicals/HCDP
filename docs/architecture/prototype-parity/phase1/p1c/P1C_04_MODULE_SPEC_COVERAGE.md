# P1C Module Specification Coverage M01–M24

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Method

Coverage scored against: BRD/blueprint extracts, canonical registers, re-audit, wave evidence, module package depth. **No invented BRDs** for modules lacking sources — mark Missing/Partial and point to extraction gaps.

### Coverage legend

| Score | Meaning |
| --- | --- |
| Strong | Spec + domain evidence + tests |
| Adequate | Spec sufficient for current stage |
| Partial | Spec/registers exist; domain thin or placeholder |
| Minimal | Landing/register only |
| Missing | No trustworthy module-specific BRD/spec beyond placeholders |

## Coverage matrix

| Module | UI/Domain (re-audit) | Spec sources | Spec coverage | Attention |
| --- | --- | --- | --- | --- |
| M01 | UI FC / Domain NS | BRD + blueprint + screens | Partial (domain specs for P2) | P2 |
| M02 | UI FC / Domain NS | BRD + blueprint + workflows | Partial | P2 |
| M03 | UI FC / Domain NS | BRD + org workspace + AUTH plan | Partial | P2 |
| M04 | FC/FC/FC | Wave2 evidence + module docs | Strong (qualified ≠ prod) | Freeze |
| M05 | FC/FC/FC | Wave4 evidence | Strong (qualified) | Freeze |
| M06 | FC/FC/FC | Wave5 evidence | Strong (qualified) | Freeze |
| M07 | FC/FC/FC | Wave6 catalogues/matrices/evidence | Strong ordinary prep; PPA separate | Freeze + honesty |
| M08 | PO/NS/NS PH | Blueprint/BRD extract; **no full rebuild spec pack** | Minimal — **attention** | P6; BP boundary |
| M09 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P6 |
| M10 | ID/ID/BLOCKED PH | Blueprint; blocked integration | Partial/blocked — **attention** | P3 |
| M11 | FC/FC/FC | Wave3 evidence; register stale | Strong domain; register Partial | P1-B3 hygiene |
| M12 | ID/ID/NS PH | Blueprint extract | Minimal — **attention** | P5 |
| M13 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P4 |
| M14 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P4 |
| M15 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P5 |
| M16 | ID/ID/NS PH | Blueprint extract | Minimal — **attention** | P5 |
| M17 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P7 |
| M18 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P7 |
| M19 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P7 |
| M20 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P8 tenancy |
| M21 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P8 |
| M22 | PO/NS/NS PH | Blueprint extract; slightly more files | Minimal — **attention** | P8 |
| M23 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P8 |
| M24 | PO/NS/NS PH | Blueprint extract | Minimal — **attention** | P6 |
| M25 | Absent | Parked branch | N/A future | Out of runtime |

## Attention list M08–M24 (no invented BRDs)

For each placeholder module, **required before rebuild authorisation**:

1. Owner-named wave/batch  
2. Adopted BRD/blueprint rows from master trace (disposition ADOPTED*)  
3. Screen/action IDs with section resolution plan  
4. Integration/SoR boundary note (especially M08 vs Best Practice — operational aggregates only)  
5. Permission/SoD draft  
6. Acceptance evidence plan  
7. Explicit exclusion of clinical/patient and payment execution where relevant  

Until then, treat ModuleLanding as **not implemented** (P1-GAP-015/033–048).

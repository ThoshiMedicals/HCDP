# Wave 7 / M22 — Parallel Lane & File Ownership Draft

**Document type:** Parallel-development ownership draft for future Wave 7  
**Created:** 30 July 2026  
**Baseline HEAD:** `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76`  
**Companions:**  
- `docs/audits/WAVE7_M22_CURRENT_STATE_AUDIT.md`  
- `docs/architecture/WAVE7_M22_INTEGRATION_BOUNDARY_MAP.md`  
- `docs/plans/WAVE7_M22_IMPLEMENTATION_PLAN_DRAFT.md`  
- (repo control pack, if present) `docs/plans/HCDP_PARALLEL_AGENT_OPERATING_PLAN.md`  
- (repo control pack, if present) `docs/plans/HCDP_PARALLEL_AGENT_FILE_OWNERSHIP_MATRIX.md`  

**Status:** Draft only — **does not authorise** parallel feature execution. Discovery commit owns Wave 7 planning docs listed below.

---

## 1. Purpose

Define **safe future parallel lanes** so Wave 7 M22 work does not collide with:

- Frozen Waves 1A–5  
- Closed M07 Batches 1–6 ordinary prep  
- M07 PPA planning/implementation (separate authorisation)  
- Shared workforce contracts / auth spine  
- Other module feature agents  

---

## 2. Lane summary

| Lane ID | Role | May run parallel with | Must serialise behind |
|---|---|---|---|
| `W7-PLAN` | Planning/docs only (this discovery) | Other planning docs on disjoint paths | — |
| `W7-FEAT-M22` | M22 module-local feature | Disjoint module lanes (e.g. future non-overlapping) | Batch 4 needs `W7-INT-PROMOTE` |
| `W7-INT-PROMOTE` | M04 promotion intake adapter + register flags + API | Not with other INT hotspots on same files | Owner Batch 0 decisions |
| `W7-INT-AUTH` | Server invite orchestration for promote | After person id exists | `W7-INT-PROMOTE` success path |
| `W7-EVID` | New `docs/audits/WAVE7_*` only | Feature lanes (read-only on code) | Batch stop checkpoints |
| `W7-QA` | Independent verification | After batch claim complete | — |
| `EXCL-PPA` | M07 PPA | **Parallel OK** if paths disjoint | Never share M22 files |
| `FROZEN` | Waves 1A–6 accepted runtime/evidence | Read-only | Defect/CR only |

**Hard rule:** Only one writer per Hard-collision path at a time.

---

## 3. Ownership legend

| Code | Meaning |
|---|---|
| `FEAT-M22` | M22 feature agent |
| `INT` | Integration agent |
| `EVID` | Evidence agent |
| `QA` | Independent QA |
| `CTRL` | Wave/controller + wave-control rule |
| `FROZEN` | Read-only without CR |
| `PLAN` | Planning docs |
| `EXCL` | Out of Wave 7 scope |

---

## 4. File ownership matrix (Wave 7 foreshadow)

### 4.1 Discovery / planning (this branch)

| Path | Owner | Collision | Notes |
|---|---|---|---|
| `docs/audits/WAVE7_M22_CURRENT_STATE_AUDIT.md` | `PLAN` / discovery | Soft | Created by discovery |
| `docs/architecture/WAVE7_M22_INTEGRATION_BOUNDARY_MAP.md` | `PLAN` | Soft | |
| `docs/plans/WAVE7_M22_IMPLEMENTATION_PLAN_DRAFT.md` | `PLAN` | Soft | |
| `docs/plans/WAVE7_M22_PARALLEL_LANE_AND_FILE_OWNERSHIP_DRAFT.md` | `PLAN` | Soft | This file |

### 4.2 M22 feature lane (`FEAT-M22`)

| Path | Owner | Collision | Notes |
|---|---|---|---|
| `src/modules/m22-recruitment/RecruitmentModule.tsx` | `FEAT-M22` | Soft | Replace landing |
| `src/modules/m22-recruitment/module.config.ts` | `FEAT-M22` | Soft | |
| `src/modules/m22-recruitment/index.ts` | `FEAT-M22` | Soft | |
| `src/modules/m22-recruitment/storage/**` | `FEAT-M22` | Soft | Additive migrations only |
| `src/modules/m22-recruitment/repository/**` | `FEAT-M22` | Soft | Implement interfaces; no M04 repo imports |
| `src/modules/m22-recruitment/adapters/**` | `FEAT-M22` | Soft | M22-side adapters; call INT façades |
| `src/modules/m22-recruitment/services/**` | `FEAT-M22` | Soft | **New** |
| `src/modules/m22-recruitment/types/**` | `FEAT-M22` | Soft | **New** |
| `src/modules/m22-recruitment/permissions.ts` | `FEAT-M22` | Soft | **New** |
| `src/modules/m22-recruitment/sections/**` | `FEAT-M22` | Soft | **New** |
| `src/modules/m22-recruitment/*Workspace*.tsx` | `FEAT-M22` | Soft | **New** |
| `src/modules/m22-recruitment/tests/**` | `FEAT-M22` | Soft | **New** |
| `src/modules/m22-recruitment/context.tsx` | `FEAT-M22` | Soft | **New** if needed |

### 4.3 Integration hotspots (`INT`) — serialise

| Path | Owner | Collision | Notes |
|---|---|---|---|
| `src/platform/module-registry/module-register.ts` | `INT` | Hard | Section IA + inbox/summary flags |
| `src/platform/workforce/contracts/**` | `INT` / `FROZEN` | Hard | Prefer **no** change; additive only with CR |
| `src/platform/workforce/adapters/**` | `INT` | Hard | Shared adapter types |
| `src/platform/workforce/services/**` | `INT` | Hard | Event bus |
| `src/platform/workforce/demo/workforce-demo-refs.ts` | `INT` / `FEAT-M22` | Soft | Demo candidate updates |
| `src/modules/m04-staff-doctors/adapters/**` | `INT` (+ M04 freeze care) | Hard | **Promotion intake adapter** lives here |
| `src/modules/m04-staff-doctors/services/person-service.ts` | `FROZEN` / `INT` | Hard | Prefer call existing `createPerson`; CR if signature change needed |
| `src/modules/m04-staff-doctors/repository/**` | `FROZEN` | Hard | M22 must **never** import |
| `src/app/api/auth/invitations/**` | `INT` / auth freeze | Hard | Reuse; thin promote orchestration API if added under `src/app/api/**` |
| `src/platform/auth/services/auth-admin-adapter.ts` | `FROZEN` | Hard | Consume only |
| `src/platform/auth/services/workforce-link-service.ts` | `FROZEN` | Hard | Edge relink only |
| `src/components/workspaces/**` | `INT` / `FROZEN` | Hard | Prefer module-local workspace |
| `package.json` / lockfile / eslint / next config | `INT` | Hard | Avoid unless required |

### 4.4 Evidence / QA

| Path | Owner | Collision | Notes |
|---|---|---|---|
| `docs/audits/WAVE7_BATCH*` (new) | `EVID` | Soft | Never rewrite older waves |
| `docs/audits/WAVE2_*` … `WAVE6_*` | `FROZEN` | Hard | Read-only |
| `docs/architecture/WORKFORCE_CONTRACTS.md` | `INT` / `PLAN` | Soft | Doc sync only |
| `.cursor/rules/hcdp-wave-control.mdc` | `CTRL` | Hard | Update only after owner accepts Wave 7 status |

### 4.5 Explicit exclusions for Wave 7 agents

| Path / area | Owner | Notes |
|---|---|---|
| `src/modules/m07-staff-pay/**` | `EXCL` / M07 | No M22 writes |
| `docs/plans/WAVE6_M07_PPA_*` | `EXCL` / PPA lane | Disjoint |
| `src/modules/m05-roster/**` | `FROZEN` | No hire-side roster creation in Wave 7 |
| `src/modules/m06-time-attendance/**` | `FROZEN` | |
| `src/modules/m11-training/**` | `FROZEN` | Do not conflate training credential promotion |
| M08 / payment / bank / STP | `EXCL` | |

---

## 5. Safe parallel combinations

| Combination | OK? | Condition |
|---|---|---|
| `W7-FEAT-M22` Batches 1–3 + `EXCL-PPA` planning | Yes | Disjoint paths |
| `W7-FEAT-M22` UI + `W7-EVID` for prior checkpoint | Yes | Evidence does not edit feature files |
| Two agents on `module-register.ts` | **No** | Hard collision |
| `W7-FEAT-M22` promote service + `W7-INT-PROMOTE` adapter | Only with **Interface First**: INT merges adapter façade before FEAT wires call |
| `W7-FEAT-M22` + edit `person-service.ts` | **No** without CR | Prefer adapter wrapping `createPerson` |
| Wave 7 + Wave 8 journey implementation | **No** | Wave 8 not authorised |

---

## 6. Suggested merge order (when authorised)

```text
Batch 0 decisions (docs)
  → Batch 1 FEAT shell (M22-only PR)
  → Batch 2–3 FEAT domain (M22-only PRs)
  → Batch 4 INT promotion adapter PR  THEN  FEAT promote wiring PR
  → Batch 5 INT auth invite orchestration + FEAT UI
  → Batch 6 projections/flags (INT register) + FEAT adapters/tests + EVID
  → CTRL wave-control update only after owner acceptance
```

Each batch PR should list **Claimed by** paths from this matrix.

---

## 7. Exact files likely to change (checklist)

### Almost certain (Wave 7 execution)

- All new/extended files under `src/modules/m22-recruitment/**`
- `src/platform/module-registry/module-register.ts`
- `src/components/workspaces/ModuleWorkspace.tsx` — only if mount wiring needs update (prefer keep thin)
- New: `src/modules/m04-staff-doctors/adapters/m04-promotion-intake.ts` (name TBD)
- New: M22 inbox/executive adapter files (mirror `m04-inbox-sync` / `m04-executive`)
- `PLATFORM_STORAGE_REGISTER.md` — document additive M22 keys when schemas expand
- New: `docs/audits/WAVE7_*` evidence
- Possibly: thin `src/app/api/recruitment/promote/route.ts` (or similar)

### Possible (owner/Integration dependent)

- `src/platform/workforce/contracts/workforce-events.ts` / `candidate-ref.ts` — **only** if payload/`personKind` added additively  
- `docs/architecture/WORKFORCE_CONTRACTS.md`  
- `src/platform/workforce/demo/workforce-demo-refs.ts`  
- `src/modules/index.ts` if export surface changes  
- `src/lib/extracted/nav.json` / `module-blueprints.json` / access extracts if still mirrored  
- `src/platform/workforce/services/identity-workforce-resolver.ts` — consume; change only with INT CR  

### Must not change for Wave 7 feature work

- Accepted Wave 2–6 audit JSON/MD evidence  
- M07 lock/export/PPA semantics  
- Auth core identity separation contracts (consume only)  
- Unrelated enterprise modules (website studio, etc.)  
- `public/pulse-html-prototype.html` as live SoT (reference for parity only; do not revive portal staff dual-write)

---

## 8. Collision handling

1. Soft collision: rebase/merge promptly; prefer module-local files.  
2. Hard collision: stop; Integration or Controller re-assigns.  
3. Accidental M04 repository import from M22: **fail CI / reject PR**.  
4. Accidental edit of frozen evidence: revert; open CR if genuinely needed.

---

## 9. Stop

This ownership draft supports **future** owner-authorised Wave 7 parallel work. It does not start implementation lanes, does not merge feature code, and does not modify frozen modules.

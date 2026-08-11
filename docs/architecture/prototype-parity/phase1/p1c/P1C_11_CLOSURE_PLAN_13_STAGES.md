# P1C Prioritised Closure Plan — 13 Stages

**Stamp:** `P1C — PLANNED, NOT AUTHORISED`
**Baseline tip:** `9142ec30b3b2efea1e959ad85ce1406562cd5faa`
**Access / planning date:** 2026-08-11

> Planning / audit only. Does **not** authorise implementation, approve P1-B1, change runtime behaviour, install dependencies, modify DB/migrations, or claim legal/security/accessibility certification.

## Status of all stages

Every stage below is `P1C — PLANNED, NOT AUTHORISED` — planned, **not authorised**. No stage auto-starts.

| Stage | Objective | Primary outputs | Depends on | Owner decisions | Verification | Exit | Links |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| S1 | Document control & SoT hygiene | Conflict banners plan; prefer re-audit; ADR process kickoff | P1A/P1B packs | OWN-P1C-001/002/004 | Conflict register reviewed | Owner accepts hygiene plan | CONF-P1C-* |
| S2 | Repo baseline docs | Accurate README; LICENSE; CONTRIBUTING; CoC; Node pin; Prettier policy | S1 | OWN-P1C-001 | Docs review | Merged docs-only tip (when auth) | DEV-GAP-001–003,005,008,009 |
| S3 | Secrets & security policy | `.env.example`; SECURITY.md; secret-scan policy | S2 | — | Ignore rules + example keys only | Accepted | DEV-GAP-004,007,022 |
| S4 | Quality engineering standards | Test runner docs; changelog/release policy; Playwright decision recorded | S2 | OWN-P1C-003 | Test docs match scripts | Accepted | DEV-GAP-006,010,011,027 |
| S5 | CI + supply chain | GitHub workflows; CODEOWNERS; templates; Dependabot; SBOM plan | S4 | — | CI green on tip | CI required on PRs | DEV-GAP-012–015,021 |
| S6 | Runtime packaging | Dockerfile/compose **plan** or platform-native deploy design | S5 | Deploy platform choice | Build in container/CI | Deploy path documented | DEV-GAP-016,017 |
| S7 | API/integration contracts | OpenAPI (if server APIs); connector policy; BP boundary freeze | Architecture ADR | — | Contract review | Contracts approved | INT-GAP-001/002 |
| S8 | Ops readiness | Runbooks IR/DR/backup; env topology | S6–S7 | — | Tabletop review | Ops accept | DEV-GAP-023 |
| S9 | Privacy & security baseline closure | PIA kickoff artefacts; threat model; ASVS L2/E8 ML2 mapping evidence plan | Counsel | OWN-P1A-002/003/005; OWN-P1C-005 | Specialist review | **Not** self-certified | DEV-GAP-024,025 |
| S10 | Accessibility evidence | WCAG 2.2 AA evidence harness aligned to Decision A | Design contract; P1-B4 | OWN-P1A-004 | Automated+manual a11y | AA evidence pack | DEV-GAP-026 |
| S11 | Data platform production path | Persistence ADR; migrations runner; tenant isolation tests | AUTH plan | ADR accept | Authz/isolation tests | Data path ready | DATA-01…06 |
| S12 | Module rebuild readiness (M08–M24) | Per-module spec packs from real BRD rows only | S7–S11; programme waves | Per-module auth | Spec completeness checklist | Ready for P3–P8 batches | P1-GAP-033–048 |
| S13 | Production go/no-go | Production scorecard; specialist sign-offs; P9 alignment | All prior | Prod go/no-go | Full gate matrix | Production approval **or** reject | Scorecard |

## Relationship to P1-B1

- S1–S5 may be authorised as **engineering-readiness** work without implementing Decision A shell.  
- **P1-B1** remains the recommended first *product* implementation batch after OWN-P1-001…003.  
- Do not fold CI/Dockerfile/OpenAPI into P1-B1 silently.

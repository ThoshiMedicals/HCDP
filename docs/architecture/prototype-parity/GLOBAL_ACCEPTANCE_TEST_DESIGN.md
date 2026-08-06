# Global Acceptance Test Design

**Generated:** `deterministic:baseline-b1152d36d3f4:decisionA-66e6e6488b27:proto-8843dbb315a6`

## Axes (independent)

1. UI implementation status  
2. Domain implementation status  
3. Cross-module integration status  
4. Evidence/acceptance status  
5. Production readiness (always separate; never implied by owner UI acceptance)

## Mandatory proof types

- Automated tests for services, permissions, isolation, audit, persistence  
- Visual QA against Decision A PNGs / design contract (exact viewports)  
- Work-Step QA for every named action/workflow  
- Immutable SHA evidence commits  
- Localhost handoff on port 3000 for the exact reported tip  

## Fail conditions

Toast/alert-only success · missing service transition · missing permission/isolation · fake seed as production truth · patient/clinical/payment boundary breach · self-approval by implementing agent · source change after final QA without re-QA

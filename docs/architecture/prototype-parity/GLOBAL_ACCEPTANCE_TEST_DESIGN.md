# Global Acceptance Test Design (Programme Scaffolding)

Progressive gates to add without weakening existing suites:

1. Prototype/BRD workspace coverage gate  
2. Named action and no-placeholder gate  
3. Canonical screen/route/deep-link gate  
4. Role-by-clinic/tenant access matrix  
5. Related-record identity integrity  
6. M02 action projection/source-link integrity  
7. M01 KPI source-completeness and drill-down integrity  
8. Global responsive/appearance matrix  
9. Meaningful-control clipping/occlusion gate  
10. Historical record integrity  
11. Demo-versus-production-data separation  
12. No patient-record or clinical-billing schema gate  
13. Cross-module repository boundary gate  
14. Audit/notification consistency gate  
15. Backup/offline/reconciliation gate (when production persistence authorised)

First-run delivers design only; implementation of these gates occurs in authorised waves.

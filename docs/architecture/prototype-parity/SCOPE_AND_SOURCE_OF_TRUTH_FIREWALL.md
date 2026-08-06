# Scope and Source-of-Truth Firewall

## Precedence

1. Current owner directive and permanent product-scope safeguards  
2. Accepted/frozen domain rules, contracts, permissions, isolation, audit, wave evidence  
3. Prototype HTML + consolidated BRD for not-yet-implemented capability (**default ADOPTED**)  
4. Nine final PNGs for visual hierarchy/density/shell  
5. Current React/Next presentation and earlier design packs  

## Patient / clinical boundary

Doctors Pulse does **not** own patient identities, appointments, clinical notes, prescriptions, referrals, patient invoices, Medicare claims, or Best Practice patient records.

Operational-only holdings are permitted (aggregates, de-identified classifications, connector status, workforce/compliance/assets, public booking links to external systems).

## Financial boundary

- M07 = staff payroll **preparation** only (not execution, bank files, STP, super, certified tax/award, mark-as-paid)
- M07 PPA = prior-period adjustment — separately authorised
- Unlock/reopen ≠ PPA
- M08 ≠ M07; no bank transfer execution in Doctors Pulse
- M09/M24 use approved aggregate summaries only
- M15 supplier invoices permitted; patient billing excluded
- M20/M21 commercial SaaS billing ≠ clinic patient billing
- Xero/accounting platform remains final financial SoT

## Privacy / seed data

Legacy prototype seed values (including real-looking personal/banking/credential data) must **not** be migrated into production code, tests, screenshots or fixtures. Use synthetic fixtures only.

## Prototype demo techniques — not adopted as-is

`alert()`, toast-only success, static fake records, insecure local-only permissions, real personal seed data, legacy iframe as a module.

## Disposition vocabulary

ADOPTED-AS-IS · ADOPTED-WITH-CONTROL-HARDENING · CONSOLIDATED · RELOCATED · DEFERRED-BY-DEPENDENCY · EXCLUDED-BY-PRODUCT-BOUNDARY · DECISION-REQUIRED

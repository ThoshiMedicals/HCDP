# M25 — Planned module-register entry

**Status:** `FUTURE — NOT IMPLEMENTED`  
**Runtime SoT:** `src/platform/module-registry/module-register.ts` remains **24 modules** until an authorised implementation batch applies this entry.  
**Planning SoT:** this document.

## Planned `PlatformModule` record (not applied to runtime)

```ts
{
  number: 25,
  id: "print-fleet",
  displayName: "Print Fleet, Cost, Security & Sustainability Management",
  shortName: "Print Fleet",
  purpose:
    "Enterprise workspace for printer assets, cost, consumables, maintenance, print security, waste reduction and sustainability across clinics — without storing patient or print-payload data.",
  mainRoute: "/print-fleet",
  legacyRoutes: ["/print-fleet"],
  sections: [
    { id: "print-command-centre", label: "Print Command Centre" },
    { id: "device-fleet", label: "Device Fleet" },
    { id: "live-monitoring", label: "Live Monitoring" },
    { id: "usage-analytics", label: "Usage Analytics" },
    { id: "cost-and-tco", label: "Cost and TCO" },
    { id: "consumables", label: "Consumables" },
    { id: "maintenance-lifecycle", label: "Maintenance and Lifecycle" },
    { id: "privacy-secure-print", label: "Privacy and Secure Print" },
    { id: "optimisation", label: "Optimisation" },
    { id: "sustainability", label: "Sustainability" },
    { id: "reports", label: "Reports" },
    { id: "settings-integrations", label: "Settings and Integrations" },
  ],
  icon: "box", // placeholder until IconName gains a printer glyph — IMPLEMENTATION-ASSUMPTION
  navigationFamily: "Assets",
  accessClassification: "operational",
  tier: "core",
  condition: "missing",
  forceNext: false,
  visibleForRoles: [
    "Director",
    "Practice Owner",
    "Practice Manager",
    "Clinic Manager",
    "IT Administrator",
    "Finance Manager",
    "Finance Officer",
    "Compliance Manager",
    "Location Manager",
  ],
  canCreateInboxEvents: true, // planned M02 projections
  contributesExecutiveSummary: true, // planned M01 KPIs
  relatedModuleIds: [
    "executive-command-centre",
    "action-inbox",
    "organisation-access",
    "compliance-quality",
    "documents-policies",
    "ticket-desk",
    "inventory-assets",
    "incidents-risk",
    "digital-ops",
    "analytics",
  ],
  legacyFeatures: [],
  familyAccent: "#0f766e",
  familySoft: "#f0fdfa",
  primaryHtmlId: "printFleet",
  htmlIds: ["printFleet"],
}
```

## Count impact

| Register | Count |
| --- | --- |
| Baseline V1 signed runtime register | 24 |
| Future planning count (M01–M25) | **25** |

## Application of this entry

Requires an owner-named implementation batch that also: adds route/shell, updates prototype blueprints (optional), regenerates parity pack, and updates IconName if a dedicated printer icon is approved.

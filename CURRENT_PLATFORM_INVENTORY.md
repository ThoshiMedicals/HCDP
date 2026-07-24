# CURRENT PLATFORM INVENTORY

**Product:** Medical Centre Operations Platform (Healthcare Doctors Pulse)  
**Inventory date:** 24 July 2026  
**Codebase inventoried:** `Development folder/` (Next.js App Router + TypeScript + Tailwind)  
**Baseline:** Approved 24-module product structure (`module-blueprints.json`)  
**Scope note:** Read-only inventory. No application code was modified, deleted, redesigned, or generated for this document.

**How to read implementation condition**

| Condition | Meaning in this codebase |
|---|---|
| Complete interactive rebuild | Forced Next.js workspace; no HTML iframe toggle; local-demo depth |
| Strong existing module | Substantial Next UI with tabs, forms, storage, audit |
| Partially implemented | Opt-in Next rebuild exists but thin vs HTML; or fragmented across routes |
| Placeholder | Next stub / empty panels only |
| Legacy HTML fallback | Default (or only) surface is `HtmlPrototypeFrame` → `/pulse-html-prototype.html#{htmlId}` |
| Missing | No route and no nav item for the approved capability |

**Important platform facts**

- Sidebar currently exposes **~48 distinct routes** (approved modules are split across many HTML-era nav items).
- Only **three** modules force the Next rebuild with no HTML toggle: Dashboard (Command Centre), Action Inbox, Organisation & Access (`settings`).
- All other routes default to **Exact HTML (complete)** iframe; a “Next rebuild” toggle shows thin React UIs where they exist.
- Module 1 (Command Centre) and Module 2 (Action Inbox) intentionally use **separate action stores** and do not exchange live data.
- Clinic selector (`pulse.activeLocation`) and Command Centre clinic multi-select (`pulse.cc.selectedClinics`) are **not the same store**.

---

## Module-by-module inventory (approved 1–24)

### 1. Executive Command Centre

| Field | Current state |
|---|---|
| **1. Approved module number** | 1 |
| **2. Approved display name** | Executive Command Centre |
| **3. Current sidebar display name** | Dashboard (group: Executive Command Centre) |
| **4. Current route** | `/dashboard` (`/` redirects here) |
| **5. Current page / workspace** | `DashboardWorkspace.tsx` → `command-centre/CommandCentre.tsx` |
| **6. Tabs / sub-workspaces** | Command Centre · My Day · KPI Scorecard · Reports. Dashboard sections include Priority Summary, Category Filters, AI Executive Briefing, Active Action List, Positive Health Summary, Completed Today, My Executive Actions, Clinic Operations & Comparison, Staffing & Roster, Compliance & Expiries, Finance & Pay, Incidents/Complaints/Risk, Tasks & Operational Delivery, Assets/Suppliers/Facilities, Websites/Systems/Security, Performance Trends, Recent Activity. |
| **7. Implementation condition** | **Complete interactive rebuild** |
| **8. Data source / storage** | `pulse.cc.*` and `pulse.cc.m1.*` localStorage; draft form in sessionStorage `pulse.cc.draftForm`; mock seeds in `lib/command-centre/mock-data.ts` |
| **9. Demonstration roles** | Hardcoded executive persona “Neil”; shell role selector elsewhere does not drive CC permissions |
| **10. Filters / saved views** | Clinic multi-select; period (Today…Custom); priority/category/status/assignee; demo day; saved dashboard layouts (`pulse.cc.layouts`, `pulse.cc.activeLayout`) |
| **11. Forms** | Create / escalate / note / intervention-style modals in `command-centre/Modals.tsx` |
| **12. Reports / exports** | Executive Operations Summary; Clinic Health and Benchmarking; Top-Risk and Overdue-Action; Monthly Management Pack; End-of-Day Summary — local demo exports (toast / client-side packs) |
| **13. Notifications** | In-module announcements; **not** Module 2 notification centre |
| **14. Audit activity** | `pulse.cc.m1.audit` via `action-repository.ts` |
| **15. Connections to Action Inbox** | **None (intentional separation).** Comment in `action-repository.ts`: separate from Module 2. |
| **16. Connections to Executive Command Centre** | N/A (this is the centre) |
| **17. Known limitations** | Local/demo only; many finance/incident/export/sign-out verbs toast-only; no live email/auth; Mobile urgent view is a toggle, not a full mobile product |
| **18. Duplicate functionality elsewhere** | Overlaps conceptually with Risk Centre, Compliance Centre, Analytics, Emergency Control as separate sidebar items; CC also shows its own action queue separate from Action Inbox |

---

### 2. Action Inbox & Notifications

| Field | Current state |
|---|---|
| **1. Approved module number** | 2 |
| **2. Approved display name** | Action Inbox & Notifications |
| **3. Current sidebar display name** | Action Inbox |
| **4. Current route** | `/action-inbox` (legacy `/approvals` redirects to `/action-inbox?category=Approval`) |
| **5. Current page / workspace** | `ActionInboxWorkspace.tsx` → `action-inbox/ActionInboxApp.tsx` |
| **6. Tabs / sub-workspaces** | Main views: My Actions · My Team (manager) · All Clinics (manager) · Delegated by Me · Watching · Completed · Archive. Category tabs: All · Approvals · Exceptions · Escalations · Reminders. Overlays: create, notifications, settings, analytics, delegations, drafts, export. |
| **7. Implementation condition** | **Complete interactive rebuild** |
| **8. Data source / storage** | `pulse.m2.inbox.*` (actions, notifications, settings, drafts, templates, savedViews, delegations, audit, ui, demoMode, demoRole, canSeeSensitive); legacy `pulse.m2.*` migrated once |
| **9. Demonstration roles** | DemoRole `manager` \| `staff` |
| **10. Filters / saved views** | Clinic, category, status, priority, owner, requester, due range, overdueOnly, escalationLevel, delegatedOnly, watchedOnly, hasAttachments, awaitingVerification, search; density compact/comfortable. Seed saved views: “Due today — my clinics”; “High risk escalations”; “Awaiting verification”. |
| **11. Forms** | Create Action workspace; review/decision modals (approve, decline, escalate, complete, verify, snooze, etc.) |
| **12. Reports / exports** | Analytics panel; export overlay (local demo) |
| **13. Notifications** | Full Notification Centre + Notification Settings (platform/email/SMS, quiet hours); badge drives Topbar + Sidebar counts |
| **14. Audit activity** | `pulse.m2.inbox.audit` |
| **15. Connections to Action Inbox** | N/A (this is the inbox) |
| **16. Connections to Executive Command Centre** | **None.** Separate action stores; executive cards do not open Module 2 records |
| **17. Known limitations** | Seed/demo data only; source-module deep links are demonstration URLs, not live record sync; Approvals removed from Governance nav but HTML prototype may still mention Approvals |
| **18. Duplicate functionality elsewhere** | Historical standalone Approvals nav item (now redirected); Command Centre Active Action List duplicates “queue” UX without shared data |

---

### 3. Organisation, Locations, Users & Permissions

| Field | Current state |
|---|---|
| **1. Approved module number** | 3 |
| **2. Approved display name** | Organisation, Locations, Users & Permissions |
| **3. Current sidebar display name** | Organisation & Access (group: Organisation & Tenant). Extra: Product Assurance |
| **4. Current route** | `/settings` (alias `/organisation` → `/settings`). Product Assurance: `/product-assurance` |
| **5. Current page / workspace** | `OrganisationWorkspace.tsx` + `lib/organisation/*`. Product Assurance: HTML/default fallback |
| **6. Tabs / sub-workspaces** | Overview · Organisation Structure · Locations · Departments & Rooms · Users · Roles & Permissions · Access Requests · Access Reviews · Security Monitoring · Audit History · Reports · Settings |
| **7. Implementation condition** | **Complete interactive rebuild** (Organisation & Access). Product Assurance = **Legacy HTML fallback** |
| **8. Data source / storage** | `pulse.org.m3.state` |
| **9. Demonstration roles** | Demo actors include Sarah Mitchell (Senior Administrator), David King (Director), Amelia Grant; OrgRoleName set Receptionist → Read-Only Auditor |
| **10. Filters / saved views** | In-module search; seed saved views e.g. “My overdue reviews”, “Clinics with warnings” |
| **11. Forms** | Location/user/role/access request/review/department flows within section components |
| **12. Reports / exports** | Clinic profile register; User/permission matrix; Access review; Inactive user/clinic; Sensitive activity audit; Temporary access expiry forecast; Security alert summary — CSV/PDF/print with audit |
| **13. Notifications** | In-module org notifications + critical-alert resolve modal |
| **14. Audit activity** | Audit History section + reportable sensitive activity |
| **15. Connections to Action Inbox** | Access requests/reviews conceptually belong in inbox; **not wired** into `pulse.m2.inbox.*` |
| **16. Connections to Executive Command Centre** | Dashboard strip can link to `/organisation` → settings; no shared org state with CC health model |
| **17. Known limitations** | Portal clinic list (`LOCATIONS` / portal context) vs org locations store can diverge; Product Assurance is a separate HTML surface |
| **18. Duplicate functionality elsewhere** | Departments & Rooms also appear under Assets (Rooms) and field schemas (`departments`, `rooms`); Tenant Administration (`/saas`) overlaps commercial org lifecycle |

---

### 4. Staff & Doctor Management

| Field | Current state |
|---|---|
| **1. Approved module number** | 4 |
| **2. Approved display name** | Staff & Doctor Management |
| **3. Current sidebar display name** | Staff · Doctors · HR Documents (People & Talent) |
| **4. Current route** | `/staff` · `/doctors` · `/hr-docs` |
| **5. Current page / workspace** | `StaffDirectoryWorkspace` / `DoctorsDirectoryWorkspace` (Next, opt-in) · HR Documents via HTML/fallback |
| **6. Tabs / sub-workspaces** | Staff: register table only. Doctors: register table only. No profile detail tabs in Next rebuild. |
| **7. Implementation condition** | **Partially implemented** (staff/doctors). HR Documents: **Legacy HTML fallback** |
| **8. Data source / storage** | Portal in-memory `records.staff` / `records.doctors` seeded from HTML extract; creates saved into portal `records` (session UI state, not dedicated LS module keys) |
| **9. Demonstration roles** | Shell exec role only; no workforce RBAC |
| **10. Filters / saved views** | Active clinic filter only; no saved views |
| **11. Forms** | Staff wizard (`openStaffWizard`); doctors create via FIELD_SCHEMAS; hrDocs schema exists for HTML/create drawer |
| **12. Reports / exports** | None in Next rebuild |
| **13. Notifications** | None module-native |
| **14. Audit activity** | None module-native |
| **15. Connections to Action Inbox** | None |
| **16. Connections to Executive Command Centre** | CC staffing section uses CC mock data, not staff register |
| **17. Known limitations** | Next tables capped/simple; no credential lifecycle, readiness gating, or effective-dated employment change; default route view is still HTML |
| **18. Duplicate functionality elsewhere** | HR Documents separate top-level nav (approved module folds hrDocs into Staff & Doctor); Training and Recruitment sit beside Staff |

---

### 5. Roster & Shift Management

| Field | Current state |
|---|---|
| **1. Approved module number** | 5 |
| **2. Approved display name** | Roster & Shift Management |
| **3. Current sidebar display name** | Roster & Shifts |
| **4. Current route** | `/roster` |
| **5. Current page / workspace** | Default: `HtmlPrototypeFrame`. Next toggle: `HtmlModuleFallback` (+ schema create if present) |
| **6. Tabs / sub-workspaces** | As in HTML prototype only (not rebuilt in Next) |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML prototype internal state; FIELD_SCHEMAS `roster`, `shiftswap` for optional Next create drawer |
| **9. Demonstration roles** | Shell only |
| **10. Filters / saved views** | HTML prototype only |
| **11. Forms** | HTML + schema keys `roster`, `shiftswap` |
| **12. Reports / exports** | HTML prototype only |
| **13. Notifications** | None in Next shell |
| **14. Audit activity** | None in Next shell |
| **15. Connections to Action Inbox** | None |
| **16. Connections to Executive Command Centre** | CC Staffing & Roster section is mock/local, not roster module |
| **17. Known limitations** | No Next interactive roster grid; publish/eligibility/fatigue not in React app |
| **18. Duplicate functionality elsewhere** | Leave and award rules exist as **FIELD_SCHEMAS** (`leave`, `awardRules`) without dedicated sidebar modules — risk of future duplicate nav |

---

### 6. Time & Attendance

| Field | Current state |
|---|---|
| **1. Approved module number** | 6 |
| **2. Approved display name** | Time & Attendance |
| **3. Current sidebar display name** | Time & Attendance · Offline Reconciliation |
| **4. Current route** | `/timeclock` · `/sync-centre` |
| **5. Current page / workspace** | Legacy HTML for both |
| **6. Tabs / sub-workspaces** | HTML prototype only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schema `timeclock` |
| **9. Demonstration roles** | Shell only |
| **10. Filters / saved views** | HTML only |
| **11. Forms** | HTML + FIELD_SCHEMAS `timeclock` |
| **12. Reports / exports** | HTML only |
| **13. Notifications** | None in Next |
| **14. Audit activity** | None in Next |
| **15. Connections to Action Inbox** | None |
| **16. Connections to Executive Command Centre** | Dashboard strip links to `/sync-centre` but no shared attendance data |
| **17. Known limitations** | Offline reconciliation is a separate top-level item, not integrated into a single Time & Attendance Next module |
| **18. Duplicate functionality elsewhere** | Sync Centre standalone vs approved packaging under Time & Attendance |

---

### 7. Staff Pay & Payroll Preparation

| Field | Current state |
|---|---|
| **1. Approved module number** | 7 |
| **2. Approved display name** | Staff Pay & Payroll Preparation |
| **3. Current sidebar display name** | Staff Pay |
| **4. Current route** | `/staffpay` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schema `staffpay` |
| **9–14.** | Shell role only; no Next filters/views/reports/notifications/audit |
| **15. Connections to Action Inbox** | None |
| **16. Connections to Executive Command Centre** | CC Finance & Pay section is mock; toast-heavy demo verbs |
| **17. Known limitations** | No Xero/connector; no pay-run readiness engine in Next |
| **18. Duplicate functionality elsewhere** | Overlaps Doctor Pay / BBPIP / Financial Forecast as separate finance nav items |

---

### 8. Doctor Pay Command Centre

| Field | Current state |
|---|---|
| **1. Approved module number** | 8 |
| **2. Approved display name** | Doctor Pay Command Centre |
| **3. Current sidebar display name** | Doctor Pay |
| **4. Current route** | `/doctorpay` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schemas `doctorpay`, `doctorportal` |
| **9–14.** | Not rebuilt in Next |
| **15–16. Inbox / CC** | None / CC finance mock only |
| **17. Known limitations** | No BP import, payslip, or dispute workflow in Next |
| **18. Duplicate functionality elsewhere** | Doctor register vs doctor pay settings; `doctorportal` schema without nav item |

---

### 9. BBPIP Forecast & Reconciliation

| Field | Current state |
|---|---|
| **1. Approved module number** | 9 |
| **2. Approved display name** | BBPIP Forecast & Reconciliation |
| **3. Current sidebar display name** | BBPIP |
| **4. Current route** | `/bbpip` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schema `bbpip` |
| **9–16.** | Not connected to Inbox or CC |
| **17. Known limitations** | Forecast/reconciliation only in HTML prototype |
| **18. Duplicate functionality elsewhere** | Financial Forecast module adjacent in Finance group |

---

### 10. Tasks, Checklists, Meetings & Actions

| Field | Current state |
|---|---|
| **1. Approved module number** | 10 |
| **2. Approved display name** | Tasks, Checklists, Meetings & Actions |
| **3. Current sidebar display name** | Tasks · Checklists · Opening / Closing · Meetings & Actions · Communication Book (related) |
| **4. Current route** | `/tasks` · `/checklists` · `/frontdesk` · `/meetings` · `/commbook` |
| **5. Current page / workspace** | `TasksWorkspace` (tasks + meetings routes); `ChecklistsWorkspace` (checklists + frontdesk); commbook HTML |
| **6. Tabs / sub-workspaces** | TasksWorkspace: Tasks & Checklists · Handover · Meetings & Actions. ChecklistsWorkspace: Checklist templates · Template item lists. Handover and Meetings panels are title/subtitle only (empty). |
| **7. Implementation condition** | **Partially implemented** |
| **8. Data source / storage** | Portal `tasks` / `records.checklists` (in-memory from HTML seeds); no dedicated LS keys |
| **9. Demonstration roles** | Shell only |
| **10. Filters / saved views** | Active clinic filter only |
| **11. Forms** | Task create (FIELD_SCHEMAS), checklist wizard, optional schema creates |
| **12. Reports / exports** | None in Next |
| **13. Notifications** | None |
| **14. Audit activity** | None |
| **15. Connections to Action Inbox** | None (operational tasks ≠ inbox actions) |
| **16. Connections to Executive Command Centre** | CC Tasks & Operational Delivery section is mock |
| **17. Known limitations** | Opening/Closing (`frontdesk`) shares ChecklistsWorkspace — not a distinct front-desk duty runner; Meetings nav duplicates Tasks meetings tab; default view remains HTML |
| **18. Duplicate functionality elsewhere** | **Opening / Closing** as top-level Operations item; **Meetings & Actions** injected as special nav while also a Tasks tab; Communication Book separate under Communications |

---

### 11. Training & Learning Management

| Field | Current state |
|---|---|
| **1. Approved module number** | 11 |
| **2. Approved display name** | Training & Learning Management |
| **3. Current sidebar display name** | Training |
| **4. Current route** | `/training` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schema `training` |
| **9–16.** | Not connected |
| **17. Known limitations** | No readiness matrix or quality-triggered escalation in Next |
| **18. Duplicate functionality elsewhere** | Overlaps Staff readiness / Accreditation evidence conceptually |

---

### 12. Accreditation, Quality & Regulatory Compliance

| Field | Current state |
|---|---|
| **1. Approved module number** | 12 |
| **2. Approved display name** | Accreditation, Quality & Regulatory Compliance |
| **3. Current sidebar display name** | Compliance Centre · Accreditation · QI / PDSA · Audit Log · Expiry Centre |
| **4. Current route** | `/compliance-centre` · `/accreditation` · `/qi` · `/audit` · `/expiry` |
| **5. Current page / workspace** | `AccreditationWorkspace` (partial Next); `RiskCentreWorkspace` reused for compliance-centre; others HTML |
| **6. Tabs / sub-workspaces** | Accreditation: single evidence table. Compliance Centre Next: same risk-card UI as Risk Centre (no compliance-specific tabs). |
| **7. Implementation condition** | **Partially implemented** (accreditation). Compliance Centre Next = **misaligned partial**. QI/Audit/Expiry = **Legacy HTML fallback** |
| **8. Data source / storage** | `records.accreditation`; `HTML_RISKS` static; incidents in portal records |
| **9–14.** | Minimal in Next |
| **15. Connections to Action Inbox** | None |
| **16. Connections to Executive Command Centre** | CC Compliance & Expiries is mock |
| **17. Known limitations** | Compliance Centre and Risk Centre share one Next component — Compliance is not a real readiness workspace in Next |
| **18. Duplicate functionality elsewhere** | Risk Centre (module 16) vs Compliance Centre; Expiry Centre overlaps Inventory/HR/accreditation expiries |

---

### 13. Documents, Policies, SOPs & Intake

| Field | Current state |
|---|---|
| **1. Approved module number** | 13 |
| **2. Approved display name** | Documents, Policies, SOPs & Intake |
| **3. Current sidebar display name** | Policies · Documents & Intake (special nav) |
| **4. Current route** | `/policies` · `/documents` |
| **5. Current page / workspace** | Legacy HTML for both |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schema `policies` (documents has special-route meta but no FIELD_SCHEMAS key named `documents`) |
| **9–16.** | Not connected |
| **17. Known limitations** | Split Policies vs Documents nav instead of one Documents module; intake queue not in Next |
| **18. Duplicate functionality elsewhere** | **HR Documents** under People; Audit Log under Governance |

---

### 14. Ticketing Desk & Work Orders

| Field | Current state |
|---|---|
| **1. Approved module number** | 14 |
| **2. Approved display name** | Ticketing Desk & Work Orders |
| **3. Current sidebar display name** | Ticketing Desk (special nav under Operations) |
| **4. Current route** | `/ticket-desk` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schema key `ticketing` (htmlId/schema naming mismatch with route `ticketDesk`) |
| **9–16.** | Not connected |
| **17. Known limitations** | Create schema id `ticketing` vs module htmlId `ticketDesk` may break Next create mapping |
| **18. Duplicate functionality elsewhere** | Incidents, Expiry, Inventory faults can all spawn similar “issue” work |

---

### 15. Inventory, Suppliers, Finance & Assets

| Field | Current state |
|---|---|
| **1. Approved module number** | 15 |
| **2. Approved display name** | Inventory, Suppliers, Finance & Assets |
| **3. Current sidebar display name** | Inventory · Stock · Equipment · Rooms · Website Monitoring (Assets group). Printers exist in schemas only. |
| **4. Current route** | `/inventory` · `/stock` · `/equipment` · `/rooms` · `/website` |
| **5. Current page / workspace** | Legacy HTML for all |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** (fragmented nav) |
| **8. Data source / storage** | HTML; schemas `inventory`, `stock`, `equipment`, `rooms`, `printers`, `finance`, `stocktransfer`, `cameraInventory` |
| **9–16.** | Not connected |
| **17. Known limitations** | Approved single module is five+ top-level nav items; suppliers/invoices not distinct Next workspaces; Website Monitoring also belongs to Digital Ops (18) |
| **18. Duplicate functionality elsewhere** | **Stock / Inventory / Equipment / Rooms** as separate top-level modules; Expiry Centre; Departments & Rooms in Organisation |

---

### 16. Incidents, Complaints, Risk & Continuity

| Field | Current state |
|---|---|
| **1. Approved module number** | 16 |
| **2. Approved display name** | Incidents, Complaints, Risk & Continuity |
| **3. Current sidebar display name** | Incidents & Continuity · Risk Centre · Emergency Control |
| **4. Current route** | `/incidents` · `/risk-centre` · `/emergency-centre` |
| **5. Current page / workspace** | Incidents/Emergency: HTML. Risk Centre: `RiskCentreWorkspace` (partial Next) |
| **6. Tabs / sub-workspaces** | Risk Next: static risk cards + optional incident creates; no RCA/CAPA tabs |
| **7. Implementation condition** | **Partially implemented** (Risk Centre). Incidents/Emergency: **Legacy HTML fallback** |
| **8. Data source / storage** | `HTML_RISKS`; portal `records.incidents` |
| **9–14.** | Minimal |
| **15. Connections to Action Inbox** | None |
| **16. Connections to Executive Command Centre** | CC Incidents section mock; dashboard strip links `/emergency-centre` |
| **17. Known limitations** | Complaints not a distinct nav item; Risk and Compliance share Next UI |
| **18. Duplicate functionality elsewhere** | Compliance Centre; Emergency Control vs continuity inside Incidents |

---

### 17. Email & SMS Communications

| Field | Current state |
|---|---|
| **1. Approved module number** | 17 |
| **2. Approved display name** | Email & SMS Communications |
| **3. Current sidebar display name** | Memos & News · Communication Book · Email Campaigns · SMS Campaigns · Noticeboards |
| **4. Current route** | `/memos` · `/commbook` · `/email` · `/sms` · `/noticeboards` |
| **5. Current page / workspace** | Legacy HTML for all |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** (fragmented) |
| **8. Data source / storage** | HTML; schemas `memos`, `commbook`, `email`, `sms`, `noticeboards`, `consent` |
| **9–16.** | Not connected; Action Inbox has its own email/SMS **notification preference** toggles (not campaign sending) |
| **17. Known limitations** | Five nav items for one approved communications module; no approval workflow in Next |
| **18. Duplicate functionality elsewhere** | Communication Book also listed under approved Tasks module routes in blueprints |

---

### 18. Digital Operations & Security

| Field | Current state |
|---|---|
| **1. Approved module number** | 18 |
| **2. Approved display name** | Digital Operations & Security |
| **3. Current sidebar display name** | Website Monitoring · Remote Access · Password Vault · Security Cameras (plus Security Monitoring inside Organisation) |
| **4. Current route** | `/website` · `/remote` · `/vault` · `/cameras` |
| **5. Current page / workspace** | Legacy HTML |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML; schemas `website`, `remote`, `vault`, `cameras`, `cameraInventory` |
| **9–16.** | Org Security Monitoring is separate Next section; not the same as cameras/vault |
| **17. Known limitations** | Website Monitoring lives under Assets; Website Builder is module 23 |
| **18. Duplicate functionality elsewhere** | Organisation Security Monitoring; Website Studio |

---

### 19. Clinic Analytics, Data Quality & Change

| Field | Current state |
|---|---|
| **1. Approved module number** | 19 |
| **2. Approved display name** | Clinic Analytics, Data Quality & Change |
| **3. Current sidebar display name** | Executive Analytics |
| **4. Current route** | `/analytics` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML only (no dedicated Next analytics store) |
| **9–16.** | CC KPI Scorecard / Reports partially overlap without shared metrics engine |
| **17. Known limitations** | No data-quality queue or change-management workspace in Next |
| **18. Duplicate functionality elsewhere** | Command Centre KPI Scorecard & Reports |

---

### 20. Commercial SaaS & Organisation Workspaces

| Field | Current state |
|---|---|
| **1. Approved module number** | 20 |
| **2. Approved display name** | Commercial SaaS & Organisation Workspaces |
| **3. Current sidebar display name** | Tenant Administration |
| **4. Current route** | `/saas` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML only (no FIELD_SCHEMAS entry for `saas`) |
| **9–16.** | Distinct from Module 3 Organisation & Access and Module 21 Vendor Console |
| **17. Known limitations** | No Next tenant billing/plan UI; boundary with vendor console unclear in UI |
| **18. Duplicate functionality elsewhere** | Organisation & Access; Vendor Command Console; Departments conceptually |

---

### 21. SaaS Vendor Operations & Tenant Provisioning

| Field | Current state |
|---|---|
| **1. Approved module number** | 21 |
| **2. Approved display name** | SaaS Vendor Operations & Tenant Provisioning |
| **3. Current sidebar display name** | Vendor Command Console (group: SaaS Vendor Administration) |
| **4. Current route** | `/vendor-console` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** (enterprise extension present in nav) |
| **8. Data source / storage** | HTML only |
| **9–16.** | Not connected to tenant SaaS or Organisation stores |
| **17. Known limitations** | Vendor/tenant boundary not enforced in Next; same demo shell as tenant users |
| **18. Duplicate functionality elsewhere** | Tenant Administration (`/saas`) |

---

### 22. Recruitment & Talent Acquisition

| Field | Current state |
|---|---|
| **1. Approved module number** | 22 |
| **2. Approved display name** | Recruitment & Talent Acquisition |
| **3. Current sidebar display name** | Recruitment |
| **4. Current route** | `/recruitment` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML only (no FIELD_SCHEMAS `recruitment`) |
| **9–16.** | Not connected to Staff promote-to-profile flow in Next |
| **17. Known limitations** | No Kanban/candidate Next UI; promotion to staff not wired |
| **18. Duplicate functionality elsewhere** | Staff onboarding |

---

### 23. Tenant Website Infrastructure & SEO Engine

| Field | Current state |
|---|---|
| **1. Approved module number** | 23 |
| **2. Approved display name** | Tenant Website Infrastructure & SEO Engine |
| **3. Current sidebar display name** | Website Builder & SEO |
| **4. Current route** | `/website-studio` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML only (no FIELD_SCHEMAS `websiteStudio`) |
| **9–16.** | Separate from `/website` monitoring |
| **17. Known limitations** | Builder vs monitoring split across families |
| **18. Duplicate functionality elsewhere** | Website Monitoring under Assets |

---

### 24. Practice Financial Forecast & Ledger Control

| Field | Current state |
|---|---|
| **1. Approved module number** | 24 |
| **2. Approved display name** | Practice Financial Forecast & Ledger Control |
| **3. Current sidebar display name** | Financial Forecast |
| **4. Current route** | `/financial-forecast` |
| **5. Current page / workspace** | Legacy HTML / HtmlModuleFallback |
| **6. Tabs / sub-workspaces** | HTML only |
| **7. Implementation condition** | **Legacy HTML fallback** |
| **8. Data source / storage** | HTML only (no FIELD_SCHEMAS `financialForecast`) |
| **9–16.** | Not fed by staffpay/doctorpay/bbpip Next data (those also HTML) |
| **17. Known limitations** | No locked baseline / variance engine in Next |
| **18. Duplicate functionality elsewhere** | BBPIP; CC Finance & Pay mock |

---

## A. CURRENT SIDEBAR ORDER

Exact visible navigation order from `NAV_GROUPS` (`nav.json` + `SPECIAL_NAV_BY_FAMILY`, Approvals hidden).

**Auxiliary (dynamic):** Favourites · Recent (user-dependent; defaults include dashboard, actionInbox, roster).

### Executive Command Centre
1. Dashboard  
2. Action Inbox  
3. Risk Centre  
4. Compliance Centre  
5. Executive Analytics  
6. Emergency Control  

### Operations
7. Tasks  
8. Checklists  
9. Opening / Closing  
10. Incidents & Continuity  
11. Expiry Centre  
12. Offline Reconciliation  
13. Ticketing Desk *(special)*  
14. Meetings & Actions *(special)*  

### People & Talent
15. Staff  
16. Doctors  
17. Recruitment  
18. Training  
19. HR Documents  

### Rostering & Attendance
20. Roster & Shifts  
21. Time & Attendance  

### Assets & Facilities
22. Inventory  
23. Stock  
24. Equipment  
25. Rooms  
26. Website Monitoring  

### Website & Digital Experience
27. Website Builder & SEO  

### Governance
28. Accreditation  
29. Policies  
30. QI / PDSA  
31. Audit Log  
32. Documents & Intake *(special)*  
*(Approvals removed from sidebar — redirects to Action Inbox)*  

### Finance & Forecasting
33. Staff Pay  
34. Doctor Pay  
35. BBPIP  
36. Financial Forecast  

### Communications
37. Memos & News  
38. Communication Book  
39. Email Campaigns  
40. SMS Campaigns  
41. Noticeboards  

### Security & Access
42. Remote Access  
43. Password Vault  
44. Security Cameras  

### Organisation & Tenant
45. Organisation & Access  
46. Tenant Administration  
47. Product Assurance *(special)*  

### SaaS Vendor Administration
48. Vendor Command Console  

**Footer:** Role display + “View as role” select (`EXEC_ROLES`).

---

## B. ROUTE REGISTER

| Route | Opens |
|---|---|
| `/` | Redirect → `/dashboard` |
| `/dashboard` | Executive Command Centre (Next forced) |
| `/action-inbox` | Action Inbox & Notification Centre (Next forced) |
| `/approvals` | Redirect → `/action-inbox?category=Approval` |
| `/organisation` | Redirect → `/settings` |
| `/settings` | Organisation & Access (Next forced) |
| `/risk-centre` | Risk Centre (HTML default; Next = RiskCentreWorkspace) |
| `/compliance-centre` | Compliance Centre (HTML default; Next = **same** RiskCentreWorkspace) |
| `/analytics` | Executive Analytics (HTML default) |
| `/emergency-centre` | Emergency Control (HTML default) |
| `/tasks` | Tasks (HTML default; Next = TasksWorkspace) |
| `/checklists` | Checklists (HTML default; Next = ChecklistsWorkspace) |
| `/frontdesk` | Opening / Closing (HTML default; Next = **same** ChecklistsWorkspace) |
| `/incidents` | Incidents & Continuity (HTML default) |
| `/expiry` | Expiry Centre (HTML default) |
| `/sync-centre` | Offline Reconciliation (HTML default) |
| `/ticket-desk` | Ticketing Desk (HTML default) |
| `/meetings` | Meetings & Actions (HTML default; Next = TasksWorkspace meetings tab) |
| `/staff` | Staff (HTML default; Next = StaffDirectoryWorkspace) |
| `/doctors` | Doctors (HTML default; Next = DoctorsDirectoryWorkspace) |
| `/recruitment` | Recruitment (HTML default) |
| `/training` | Training (HTML default) |
| `/hr-docs` | HR Documents (HTML default) |
| `/roster` | Roster & Shifts (HTML default) |
| `/timeclock` | Time & Attendance (HTML default) |
| `/inventory` | Inventory (HTML default) |
| `/stock` | Stock (HTML default) |
| `/equipment` | Equipment (HTML default) |
| `/rooms` | Rooms (HTML default) |
| `/website` | Website Monitoring (HTML default) |
| `/website-studio` | Website Builder & SEO (HTML default) |
| `/accreditation` | Accreditation (HTML default; Next = AccreditationWorkspace) |
| `/policies` | Policies (HTML default) |
| `/qi` | QI / PDSA (HTML default) |
| `/audit` | Audit Log (HTML default) |
| `/documents` | Documents & Intake (HTML default) |
| `/staffpay` | Staff Pay (HTML default) |
| `/doctorpay` | Doctor Pay (HTML default) |
| `/bbpip` | BBPIP (HTML default) |
| `/financial-forecast` | Financial Forecast (HTML default) |
| `/memos` | Memos & News (HTML default) |
| `/commbook` | Communication Book (HTML default) |
| `/email` | Email Campaigns (HTML default) |
| `/sms` | SMS Campaigns (HTML default) |
| `/noticeboards` | Noticeboards (HTML default) |
| `/remote` | Remote Access (HTML default) |
| `/vault` | Password Vault (HTML default) |
| `/cameras` | Security Cameras (HTML default) |
| `/saas` | Tenant Administration (HTML default) |
| `/product-assurance` | Product Assurance (HTML default) |
| `/vendor-console` | Vendor Command Console (HTML default) |
| `/prototype` | Full-page HTML prototype (`prototype/page.tsx`) |

Unknown module slugs → `notFound()`.

---

## C. DUPLICATE NAVIGATION

| Pattern | Current finding |
|---|---|
| **Approvals outside Action Inbox** | Governance Approvals **removed** from sidebar; `/approvals` redirects into Inbox Approvals category. HTML prototype may still contain Approvals UI if opened via iframe hash. |
| **Opening / Closing outside Tasks and Checklists** | Standalone `/frontdesk` under Operations; Next body reuses ChecklistsWorkspace (not opening/closing duties). |
| **HR Documents outside Staff and Doctor Management** | Standalone `/hr-docs` under People & Talent. |
| **Leave or Award Rules as separate modules** | **Not** top-level nav items today; exist as FIELD_SCHEMAS (`leave`, `awardRules`) — latent duplicate risk if promoted to nav. |
| **Stock, Inventory, Equipment or Printers as separate top-level modules** | Inventory, Stock, Equipment, Rooms are separate sidebar items; `printers` schema exists without nav. |
| **Departments outside Commercial SaaS / Organisation Workspaces** | Departments & Rooms live inside Organisation & Access (`/settings`); Rooms also under Assets; SaaS is separate `/saas`. |
| **Additional duplicates** | Meetings nav + Tasks meetings tab; Risk Centre ≡ Compliance Centre Next UI; Website Monitoring vs Website Builder; Communication Book vs Tasks blueprint; Product Assurance vs Organisation. |

---

## D. LEGACY FALLBACKS

Every MODULE route **except** `/dashboard`, `/action-inbox`, and `/settings` defaults to:

`HtmlPrototypeFrame` → `/pulse-html-prototype.html#{htmlId}`

Also:

| Route / entry | Legacy behaviour |
|---|---|
| `/prototype` | Full HTML prototype page |
| Topbar “Full HTML” control | Opens prototype experience |
| View source toggle | “Exact HTML (complete)” vs “Next rebuild” on non-forced modules |
| Modules without Next case | Next toggle shows `HtmlModuleFallback` (create drawer if schema exists) or unused `ModuleStub` path |

**Forced Next (no HTML toggle):** dashboard, actionInbox, settings.

---

## E. SHARED PLATFORM COMPONENTS

| Shared capability | Current location / notes |
|---|---|
| **Application shell** | `app/(portal)/layout.tsx` + portal providers |
| **Sidebar** | `components/shell/Sidebar.tsx` — family palette, search, favourites, groups, inbox badge, role select |
| **Top context bar** | `components/shell/Topbar.tsx` — clinic, search, online toggle, export, new entry, MFA, HTML link |
| **Clinic selector** | Topbar → `pulse.activeLocation` via `portal-context.tsx` (“All Sites Group” + locations) |
| **Date selector** | Not global; Command Centre demo day / period controls |
| **Search** | Topbar ribbon (module title/label/id match) + Sidebar “Find a workspace” + Organisation in-module search + Action Inbox filters |
| **Notification centre** | Action Inbox NotificationCentre; PageHeader bell → `/action-inbox`; Topbar/Sidebar badge from `lib/action-inbox/badge.ts` |
| **Drawers** | `components/ui/Drawer.tsx`; create forms / review panels |
| **Modals** | `components/ui/Modal.tsx`; CC Modals; Action Inbox ActionModals; Org critical resolve |
| **Forms** | `CreateFormProvider` + `SchemaForm` + wizards (staff, checklist, task) from extracted FIELD_SCHEMAS |
| **Tables** | `components/ui/Table.tsx` |
| **Status badges** | `components/ui/Badge.tsx` |
| **Audit timeline** | Module-local (CC action file; Inbox review; Org Audit section) — **not** one shared audit component across modules |
| **Saved views** | Inbox + Organisation seeds; CC saved **layouts** (not the same pattern) |
| **Export controls** | Topbar Export (toast); CC report packs; Inbox export overlay; Org reports CSV/PDF/print |
| **Role selector** | Sidebar `EXEC_ROLES` → `pulse.v27.executiveRole`; Inbox demoRole; Org demo actors — **three separate systems** |
| **Theme controls** | CC appearance light/dark/system → `pulse.cc.appearance` applied to `body.theme-dark` |
| **Demonstration-data controls** | CC QA demo menu / demo day / card state overrides; Inbox demo mode reset; Org reset demo / advance clock |

---

## F. DATA AND STORAGE REGISTER

### Shell / portal
| Key / area | Module |
|---|---|
| `pulse.activeLocation` | Global clinic |
| `pulse.lastModule` | Last visited module id |
| `pulse.v33.navPrefs` | Favourites / recents |
| `pulse.v32.navCollapsed` | Sidebar group collapse |
| `pulse.v27.executiveRole` | Shell role |
| `pulse.v31.online` | Online/offline demo toggle |
| `pulse.sidebarCollapsed` | Sidebar collapsed (CC extras) |
| Portal React state `records`, `tasks`, `actions`, `locations` | Shared seed/create bag (not module-isolated LS) |

### Module 1 — Command Centre
| Key | Purpose |
|---|---|
| `pulse.cc.appearance` | Theme |
| `pulse.cc.layouts` / `pulse.cc.activeLayout` | Saved layouts |
| `pulse.cc.privateNotes` | Private notes |
| `pulse.cc.draftForm` | Session draft |
| `pulse.cc.selectedClinics` | CC clinic multi-select |
| `pulse.cc.period` / `pulse.cc.customRange` | Period |
| `pulse.cc.healthOverrides` | Health overrides |
| `pulse.cc.demoDay` | Demo calendar day |
| `pulse.cc.templates` / `pulse.cc.recurring` / `pulse.cc.reportSchedules` / `pulse.cc.clinicGroups` | Extras |
| `pulse.cc.qa.cardState` | QA card overrides |
| `pulse.cc.m1.actions` / `pulse.cc.m1.audit` / `pulse.cc.m1.actionDrafts` | Executive actions |

### Module 2 — Action Inbox
| Key | Purpose |
|---|---|
| `pulse.m2.inbox.actions` | Actions |
| `pulse.m2.inbox.notifications` | Notifications |
| `pulse.m2.inbox.notificationSettings` | Settings |
| `pulse.m2.inbox.drafts` / `templates` / `savedViews` / `delegations` / `audit` / `ui` | Supporting |
| `pulse.m2.inbox.demoMode` / `demoRole` / `canSeeSensitive` | Demo controls |
| Legacy `pulse.m2.*` | Migrated then removed |

### Module 3 — Organisation
| Key | Purpose |
|---|---|
| `pulse.org.m3.state` | Full organisation module state |

### Duplicate / non-exchanging stores
| Problem | Detail |
|---|---|
| **CC actions ≠ Inbox actions** | Documented intentional split; cannot exchange |
| **Portal `actions` ≠ M1/M2** | Older ACTION_ITEMS in portal context unused by rebuilt Inbox |
| **Clinic selection split** | `pulse.activeLocation` vs `pulse.cc.selectedClinics` |
| **Roles split** | Shell / Inbox / Org demo roles independent |
| **Staff/doctors/tasks** | Portal memory only — lost on full reload unless re-seeded; not written to org or inbox stores |
| **HTML iframe** | Completely isolated from Next localStorage modules |

---

## G. CROSS-MODULE CONNECTIONS

| Question | Current answer |
|---|---|
| **Actions from each module appear in Action Inbox?** | **No.** Only Module 2 seed/created inbox actions. Source modules do not push to `pulse.m2.inbox.actions`. |
| **Executive cards open the correct source records?** | **No.** CC uses its own `pulse.cc.m1.actions` / mock sections; not Module 2 or source-module records. |
| **Related records open correctly?** | Inbox related-record links are demonstration destinations; HTML modules do not deep-link into Next detail pages. |
| **Clinic filters remain consistent?** | **Partial.** Topbar clinic filters portal-backed tables; CC uses separate multi-select; Org has its own location entities. |
| **Role changes apply consistently?** | **No.** Sidebar role, Inbox demoRole, Org actor are independent. |
| **Notification counts come from current module data?** | Badge counts come from **Action Inbox** storage only — not from other modules’ overdue work. |
| **Archived records remain searchable?** | Inbox Archive view exists for Module 2. Other modules: HTML-dependent; Next partials generally have no archive search. |

---

## H. BUTTON AND ROUTE ISSUES

| Issue type | Examples |
|---|---|
| **Dead / empty UI** | TasksWorkspace **Handover** and **Meetings & Actions** panels (title only); Compliance Centre Next = Risk list |
| **Toast-only without full workflow** | Topbar **Export**; Topbar **Enterprise Sign-In · MFA**; multiple Command Centre finance/incident/export/sign-out/intervention verbs; search miss toasts |
| **Broken / legacy redirects** | `/approvals` → Inbox (intentional). `/organisation` → `/settings` (intentional alias). |
| **Wrong destinations** | `/frontdesk` Next → Checklists library, not opening/closing. `/compliance-centre` Next → Risk cards. |
| **Duplicate destinations** | `/meetings` and Tasks meetings tab; Risk and Compliance Next UIs |
| **Buttons that open legacy screens** | Default HTML mode for ~45 routes; Topbar Full HTML; View source “Exact HTML” |
| **Lost clinic / record / filter context** | Switching to HTML iframe loses Next clinic/filter state; CC clinics ≠ Topbar clinic; opening Inbox from CC does not carry selected executive action |

---

## I. RESPONSIVE CONDITION

| Module / surface | Desktop | Tablet (~lg) | Mobile |
|---|---|---|---|
| **Shell (all modules)** | Full sidebar + topbar | Sidebar collapses; overlay + hamburger | Same; reduced topbar actions (Export/New Entry/MFA hide by breakpoint) |
| **1 Command Centre** | Strong multi-section dashboard | Grids compress; “Mobile urgent view” toggle | Usable but dense; not a dedicated mobile app |
| **2 Action Inbox** | Split list/review strong | Stacks; filters wrap | Usable triage; heavy forms cramped |
| **3 Organisation** | Side section nav + content | Section nav stacks | Usable; wide tables scroll |
| **4 Staff/Doctors Next** | Simple tables OK | OK | Horizontal scroll on tables |
| **10 Tasks/Checklists Next** | Simple tables OK | OK | Same |
| **12 Accreditation / 16 Risk Next** | Simple lists OK | OK | OK |
| **All HTML-fallback modules** | Depends on prototype CSS inside iframe | Iframe height `calc(100vh-52px)`; prototype responsiveness only | Prototype may not match Next shell breakpoints; double chrome risk (shell + HTML UI) |
| **Enterprise 21–24** | HTML only | HTML only | HTML only |

Overall: **shell is responsive**; **rebuilt modules are desktop-first but usable**; **HTML modules inherit prototype behaviour** and are the weakest mobile experience inside the Next shell.

---

## J. FINAL GAP TABLE

| # | Approved module | Gap colour | Rationale |
|---|---|---|---|
| 1 | Executive Command Centre | **Amber** | Strong interactive rebuild, but disconnected from Inbox and source modules |
| 2 | Action Inbox & Notifications | **Amber** | Strong interactive rebuild, but not fed by other modules; disconnected from CC |
| 3 | Organisation, Locations, Users & Permissions | **Amber** | Strong Module 3 rebuild; Product Assurance still HTML; not wired to Inbox |
| 4 | Staff & Doctor Management | **Amber** | Thin Next directories; HR Documents fragmented; default HTML |
| 5 | Roster & Shift Management | **Red** | Legacy HTML only as product surface |
| 6 | Time & Attendance | **Red** | Legacy HTML; Sync Centre fragmented |
| 7 | Staff Pay & Payroll Preparation | **Red** | Legacy HTML |
| 8 | Doctor Pay Command Centre | **Red** | Legacy HTML |
| 9 | BBPIP Forecast & Reconciliation | **Red** | Legacy HTML |
| 10 | Tasks, Checklists, Meetings & Actions | **Amber** | Partial Next; empty meetings/handover; frontdesk duplicate; default HTML |
| 11 | Training & Learning Management | **Red** | Legacy HTML |
| 12 | Accreditation, Quality & Regulatory Compliance | **Amber** | Thin accreditation table; compliance Next unsuitable; QI/audit/expiry HTML |
| 13 | Documents, Policies, SOPs & Intake | **Red** | Legacy HTML; split nav |
| 14 | Ticketing Desk & Work Orders | **Red** | Legacy HTML; schema id mismatch risk |
| 15 | Inventory, Suppliers, Finance & Assets | **Red** | Legacy HTML; heavily fragmented nav |
| 16 | Incidents, Complaints, Risk & Continuity | **Amber** | Thin risk UI; incidents/emergency HTML; complaints not distinct |
| 17 | Email & SMS Communications | **Red** | Legacy HTML; five nav fragments |
| 18 | Digital Operations & Security | **Red** | Legacy HTML; overlaps Org security |
| 19 | Clinic Analytics, Data Quality & Change | **Red** | Legacy HTML; overlaps CC analytics |
| 20 | Commercial SaaS & Organisation Workspaces | **Red** | Legacy HTML; boundary with M3/M21 unclear |
| 21 | SaaS Vendor Operations & Tenant Provisioning | **Grey** | Enterprise extension present in nav via HTML; intentionally not a Next rebuild yet |
| 22 | Recruitment & Talent Acquisition | **Grey** | Enterprise extension; HTML only; not Next-developed |
| 23 | Tenant Website Infrastructure & SEO Engine | **Grey** | Enterprise extension; HTML only |
| 24 | Practice Financial Forecast & Ledger Control | **Grey** | Enterprise extension; HTML only; depends on unpaid finance rebuilds |

**Colour key:** Green = strong and connected · Amber = working but incomplete or disconnected · Red = missing, placeholder, or unsuitable as current Next product · Grey = intentionally not yet developed as Next rebuild.

**No module is Green today** — none are both strong **and** cross-connected.

---

## K. RECOMMENDED DEVELOPMENT ORDER

Safest sequence that **preserves** completed Modules 1–3, **collapses duplicates**, and **avoids rework**:

1. **Integration spine (before new modules)**  
   - Define one action/event contract so source modules can create Action Inbox items.  
   - Decide whether Command Centre reads Inbox + source summaries (or a shared projection), then retire duplicate CC-only action queues for overlapping categories.  
   - Unify clinic context (`activeLocation` vs CC selected clinics) and role demonstration model.

2. **Nav consolidation pass (no new feature depth)**  
   - Map sidebar to the 24 approved modules (group Opening/Closing under Tasks/Checklists; HR Docs under Staff/Doctors; Stock/Equipment/Rooms under Inventory; Approvals already done).  
   - Hide or nest enterprise 21–24 until scheduled.  
   - Fix Compliance ≠ Risk Next alias; Meetings single entry; Ticketing schema id.

3. **Complete Module 10 (Tasks, Checklists, Meetings & Actions)**  
   - Finish handover + meetings; implement real Opening/Closing; stop defaulting to HTML once Next parity is acceptable.

4. **Complete Module 4 (Staff & Doctor Management)**  
   - Profile detail, credentials, fold HR Documents; feed readiness signals to Inbox/CC.

5. **Module 12 then 16 (Governance risk chain)**  
   - Real Compliance Centre readiness; then Incidents/Complaints/Risk/Continuity with Inbox escalation.

6. **Module 5 → 6 (Roster then Time & Attendance)**  
   - Preserve HTML as reference; rebuild shift-first roster; then attendance + sync under one module.

7. **Module 14 (Ticketing)** then **15 (Inventory/Assets)**  
   - Shared asset/ticket links; collapse Stock/Equipment/Rooms nav.

8. **Module 13 (Documents)** and **11 (Training)**  
   - Intake → Inbox; training readiness gates roster/staff.

9. **Communications 17** after Inbox notification model is stable (avoid two notification systems).

10. **Finance chain 7 → 8 → 9 → 24**  
    - Staff pay → Doctor pay → BBPIP → Financial Forecast last (depends on pay/roster summaries).

11. **Analytics 19** after operational data exists (wire to CC rather than a second disconnected analytics product).

12. **Digital Ops 18** and **Website 23** after tickets/assets exist.

13. **Commercial 20** then **Vendor 21** with explicit tenant/vendor boundary.

14. **Recruitment 22** last among people modules (promote-to-staff into Module 4).

**Do not:** rebuild HTML modules in parallel with conflicting stores; promote Leave/Award Rules/Printers as new top-level nav; deepen CC mock finance before Staff/Doctor Pay; treat iframe presence as “module complete.”

---

## Inventory metadata

| Item | Value |
|---|---|
| Primary app root | `C:\Users\ETB Sri Lanka\Desktop\HCDP\Development folder` |
| Blueprint / HTML sources | HCDP root (`*_v34_*.html`, Consolidated Business Blueprint, Module blueprints in `src/lib/extracted/`) |
| This inventory file | See path below |

---

**Exact path of this file:**

`C:\Users\ETB Sri Lanka\Desktop\HCDP\CURRENT_PLATFORM_INVENTORY.md`

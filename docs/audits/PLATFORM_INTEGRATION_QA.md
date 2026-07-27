# Platform Integration QA Report

- **Test date and time:** 2026-07-27T05:08:02.656Z
- **Browser / testing method:** Node HTTP harness + Cursor browser MCP (interactive)
- **Application URL:** http://localhost:3000
- **Commit:** 649333b
- **Build:** Wave 2 M04 next start — fresh interactive rerun 2026-07-27

## Summary

| Total | Pass | Fail | Blocked |
|---:|---:|---:|---:|
| 152 | 152 | 0 | 0 |

## Tests

### legacy.approvals — Legacy /approvals

- **Expected:** /action-inbox {"category":"Approval"}
- **Actual:** 307 → /action-inbox?category=Approval
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.staff — Legacy /staff

- **Expected:** /staff-doctors {"section":"people"}
- **Actual:** 307 → /staff-doctors?section=people
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.doctors — Legacy /doctors

- **Expected:** /staff-doctors {"section":"doctor-profiles"}
- **Actual:** 307 → /staff-doctors?section=doctor-profiles
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.hr-docs — Legacy /hr-docs

- **Expected:** /staff-doctors {"section":"credentials"}
- **Actual:** 307 → /staff-doctors?section=credentials
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.timeclock — Legacy /timeclock

- **Expected:** /time-attendance {"section":"attendance"}
- **Actual:** 307 → /time-attendance?section=attendance
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.sync-centre — Legacy /sync-centre

- **Expected:** /time-attendance {"section":"offline-reconciliation"}
- **Actual:** 307 → /time-attendance?section=offline-reconciliation
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.tasks — Legacy /tasks

- **Expected:** /tasks-actions {"section":"tasks"}
- **Actual:** 307 → /tasks-actions?section=tasks
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.checklists — Legacy /checklists

- **Expected:** /tasks-actions {"section":"checklists"}
- **Actual:** 307 → /tasks-actions?section=checklists
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.frontdesk — Legacy /frontdesk

- **Expected:** /tasks-actions {"section":"opening-closing"}
- **Actual:** 307 → /tasks-actions?section=opening-closing
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.meetings — Legacy /meetings

- **Expected:** /tasks-actions {"section":"meetings"}
- **Actual:** 307 → /tasks-actions?section=meetings
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.compliance-centre — Legacy /compliance-centre

- **Expected:** /compliance-quality {"section":"compliance-centre"}
- **Actual:** 307 → /compliance-quality?section=compliance-centre
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.accreditation — Legacy /accreditation

- **Expected:** /compliance-quality {"section":"accreditation"}
- **Actual:** 307 → /compliance-quality?section=accreditation
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.qi — Legacy /qi

- **Expected:** /compliance-quality {"section":"quality-improvement"}
- **Actual:** 307 → /compliance-quality?section=quality-improvement
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.audit — Legacy /audit

- **Expected:** /compliance-quality {"section":"audit-log"}
- **Actual:** 307 → /compliance-quality?section=audit-log
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.expiry — Legacy /expiry

- **Expected:** /compliance-quality {"section":"expiry-centre"}
- **Actual:** 307 → /compliance-quality?section=expiry-centre
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.documents — Legacy /documents

- **Expected:** /documents-policies {"section":"documents"}
- **Actual:** 307 → /documents-policies?section=documents
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.policies — Legacy /policies

- **Expected:** /documents-policies {"section":"policies"}
- **Actual:** 307 → /documents-policies?section=policies
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.inventory — Legacy /inventory

- **Expected:** /inventory-assets {"section":"inventory"}
- **Actual:** 307 → /inventory-assets?section=inventory
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.stock — Legacy /stock

- **Expected:** /inventory-assets {"section":"stock"}
- **Actual:** 307 → /inventory-assets?section=stock
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.equipment — Legacy /equipment

- **Expected:** /inventory-assets {"section":"equipment"}
- **Actual:** 307 → /inventory-assets?section=equipment
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.rooms — Legacy /rooms

- **Expected:** /inventory-assets {"section":"rooms"}
- **Actual:** 307 → /inventory-assets?section=rooms
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.incidents — Legacy /incidents

- **Expected:** /incidents-risk {"section":"incidents"}
- **Actual:** 307 → /incidents-risk?section=incidents
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.risk-centre — Legacy /risk-centre

- **Expected:** /incidents-risk {"section":"risk-centre"}
- **Actual:** 307 → /incidents-risk?section=risk-centre
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.emergency-centre — Legacy /emergency-centre

- **Expected:** /incidents-risk {"section":"emergency-control"}
- **Actual:** 307 → /incidents-risk?section=emergency-control
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.email — Legacy /email

- **Expected:** /communications {"section":"email"}
- **Actual:** 307 → /communications?section=email
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.sms — Legacy /sms

- **Expected:** /communications {"section":"sms"}
- **Actual:** 307 → /communications?section=sms
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.memos — Legacy /memos

- **Expected:** /communications {"section":"memos-news"}
- **Actual:** 307 → /communications?section=memos-news
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.commbook — Legacy /commbook

- **Expected:** /communications {"section":"communication-book"}
- **Actual:** 307 → /communications?section=communication-book
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.noticeboards — Legacy /noticeboards

- **Expected:** /communications {"section":"noticeboards"}
- **Actual:** 307 → /communications?section=noticeboards
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.website — Legacy /website

- **Expected:** /digital-ops {"section":"website-monitoring"}
- **Actual:** 307 → /digital-ops?section=website-monitoring
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.remote — Legacy /remote

- **Expected:** /digital-ops {"section":"remote-access"}
- **Actual:** 307 → /digital-ops?section=remote-access
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.vault — Legacy /vault

- **Expected:** /digital-ops {"section":"password-vault"}
- **Actual:** 307 → /digital-ops?section=password-vault
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.cameras — Legacy /cameras

- **Expected:** /digital-ops {"section":"security-cameras"}
- **Actual:** 307 → /digital-ops?section=security-cameras
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_dashboard — Load /dashboard

- **Expected:** 200 OK
- **Actual:** 200; rebuild=false; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_action_inbox — Load /action-inbox

- **Expected:** 200 OK
- **Actual:** 200; rebuild=false; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_settings — Load /settings

- **Expected:** 200 OK
- **Actual:** 200; rebuild=false; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_staff_doctors — Load /staff-doctors

- **Expected:** 200 OK
- **Actual:** 200; rebuild=false; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_roster — Load /roster

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_time_attendance — Load /time-attendance

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_staffpay — Load /staffpay

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_doctorpay — Load /doctorpay

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_bbpip — Load /bbpip

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_tasks_actions — Load /tasks-actions

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_training — Load /training

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_compliance_quality — Load /compliance-quality

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_documents_policies — Load /documents-policies

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_ticket_desk — Load /ticket-desk

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_inventory_assets — Load /inventory-assets

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_incidents_risk — Load /incidents-risk

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_communications — Load /communications

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_digital_ops — Load /digital-ops

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_analytics — Load /analytics

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_saas — Load /saas

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_vendor_console — Load /vendor-console

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_recruitment — Load /recruitment

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_website_studio — Load /website-studio

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_financial_forecast — Load /financial-forecast

- **Expected:** 200 OK
- **Actual:** 200; rebuild=true; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### page_prototype_reference — Load /prototype-reference

- **Expected:** 200 OK
- **Actual:** 200; rebuild=false; toggle=false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### proto.file — Prototype file retained

- **Expected:** exists
- **Actual:** exists
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### legacy.queryPreserve — Preserve query params on legacy redirect

- **Expected:** section+recordId+clinicId
- **Actual:** /staff-doctors?section=credentials&recordId=abc123&clinicId=loc_woolloongabba
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.enterpriseGroup — Enterprise Extensions group present (authorised)

- **Expected:** visible
- **Actual:** visible
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.enterpriseModules — Modules 21–24 under Enterprise Extensions

- **Expected:** 4 modules
- **Actual:** Vendor Console, Recruitment, Website Studio, Financial Forecast
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.noLegacyTopLevel — No separate top-level legacy entries

- **Expected:** none
- **Actual:** none
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.coreModules — Approved core modules in sidebar

- **Expected:** ≥18 of 20
- **Actual:** 20
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.groupToggle — Sidebar group expand/collapse

- **Expected:** aria-expanded toggles
- **Actual:** true→false→true
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.favourites — Favourites section

- **Expected:** present
- **Actual:** present
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.recents — Recents section

- **Expected:** present
- **Actual:** present
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### nav.searchControl — Module search control

- **Expected:** present
- **Actual:** present
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.usr_david — Enterprise visibility as Director

- **Expected:** true
- **Actual:** true
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.usr_sarah — Enterprise visibility as Senior Administrator

- **Expected:** true
- **Actual:** true
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.usr_james — Enterprise visibility as Clinic Manager

- **Expected:** false
- **Actual:** false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.usr_elena — Enterprise visibility as Practice Manager

- **Expected:** false
- **Actual:** false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.usr_owen — Enterprise visibility as Finance Manager

- **Expected:** true
- **Actual:** true
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.usr_amelia — Enterprise visibility as HR Manager

- **Expected:** true
- **Actual:** true
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.demo_compliance — Enterprise visibility as Compliance Manager

- **Expected:** false
- **Actual:** false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.usr_lucy — Enterprise visibility as Staff Member

- **Expected:** false
- **Actual:** false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.demo_auditor — Enterprise visibility as Read-Only Auditor

- **Expected:** false
- **Actual:** false
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.enterprise.demo_vendor — Enterprise visibility as SaaS Vendor Administrator

- **Expected:** true
- **Actual:** true
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.dualApproval — Sarah and David dual-approval controls

- **Expected:** both present
- **Actual:** both present
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### identity.persist — Identity persists after refresh

- **Expected:** usr_james
- **Actual:** usr_james
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.all — All Clinics selection

- **Expected:** all
- **Actual:** all
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.single — Single clinic selection

- **Expected:** single Woolloongabba
- **Actual:** {"version":1,"mode":"single","selectedClinicIds":["loc_woolloongabba"],"groupId":null,"label":"Single Clinic · Woolloongabba","updatedAt":"2026-07-27T01:17:42.819Z"}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.group — Clinic group selection

- **Expected:** group
- **Actual:** {"version":1,"mode":"group","selectedClinicIds":["loc_woolloongabba","loc_cannonhill","loc_eightmile"],"groupId":"grp_brisbane_south","label":"Clinic Group · Brisbane South","updatedAt":"2026-07-27T01:17:43.269Z"}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.persistNav — Clinic persists across modules

- **Expected:** group
- **Actual:** group
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.persistRefresh — Clinic persists after refresh

- **Expected:** group
- **Actual:** group
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.damagedJson — Damaged clinic JSON recovers safely

- **Expected:** usable UI
- **Actual:** {"version":1,"mode":"multiple","selectedClinicIds":["loc_woolloongabba","loc_can
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.authoritativeKey — pulse.platform.context.clinics authoritative

- **Expected:** present
- **Actual:** present
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### clinic.migrationFlag — Clinic migration recorded

- **Expected:** clinic-context
- **Actual:** {"clinic-context":1,"nav-prefs-module-ids":1,"identity-context":1,"m04-workforce-storage-v1":1,"m04-workforce-portal-seed-v1":1,"org-m3-inbox-bridge":1}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m3m2.projections — M3 Access Request/Review/Alert → M2 projections

- **Expected:** ≥3 linked
- **Actual:** [{"title":"Access request: Finance Officer onboarding — Forest Lake","sourceRecord":"/settings?section=access-requests&recordId=req1&recordType=access-request","status":"Awaiting Approval"},{"title":"Access review: Elena Brooks","sourceRecord":"/settings?section=access-reviews&recordId=rev1&recordType=access-review","status":"Open"},{"title":"Security alert: Account locked — Tom Nguyen","sourceRecord":"/settings?section=security&recordId=al1&recordType=security-alert","status":"Open"}]
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m3m2.noDupes — No duplicate M3→M2 inbox actions

- **Expected:** 0 dupes
- **Actual:** 0
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m3m2.returnToSource — M2 action returns to Module 3 source

- **Expected:** /settings
- **Actual:** http://localhost:3000/settings
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m3m2.unauthEnterprise — Unauthorised identity hides Enterprise Extensions

- **Expected:** hidden
- **Actual:** hidden
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m2m1.projection — Module 1 shows Module 2 projection values

- **Expected:** present
- **Actual:** present
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m2m1.distinguish — Executive vs operational actions distinguished

- **Expected:** clear
- **Actual:** clear
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m1.noHtmlToggle — No user-facing Exact HTML / Full HTML toggle on M1

- **Expected:** absent
- **Actual:** absent
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### m2m1.clickThrough — M1 projection opens Module 2

- **Expected:** /action-inbox
- **Actual:** http://localhost:3000/action-inbox
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### badge.sidebar — Sidebar Action Inbox badge/count from Module 2

- **Expected:** present
- **Actual:** Action Inbox & Notifications×
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_staff_doctors — Landing /staff-doctors

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":false,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_training — Landing /training

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_roster — Landing /roster

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_time_attendance — Landing /time-attendance

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_tasks_actions — Landing /tasks-actions

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_ticket_desk — Landing /ticket-desk

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_compliance_quality — Landing /compliance-quality

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_documents_policies — Landing /documents-policies

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_inventory_assets — Landing /inventory-assets

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_incidents_risk — Landing /incidents-risk

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_communications — Landing /communications

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_digital_ops — Landing /digital-ops

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_analytics — Landing /analytics

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_staffpay — Landing /staffpay

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_doctorpay — Landing /doctorpay

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_bbpip — Landing /bbpip

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_saas — Landing /saas

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_vendor_console — Landing /vendor-console

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_recruitment — Landing /recruitment

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_website_studio — Landing /website-studio

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### landing_financial_forecast — Landing /financial-forecast

- **Expected:** Rebuild pending + no iframe/toggle
- **Actual:** {"rebuild":true,"moduleN":true,"iframe":false,"htmlToggle":false,"blank":false}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### proto.page — Prototype reference labelled Development / QA Reference

- **Expected:** labelled
- **Actual:** labelled
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### proto.notInSidebar — Prototype not in normal sidebar

- **Expected:** absent
- **Actual:** absent
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Opening — Search "Opening"

- **Expected:** hit containing opening-closing
- **Actual:** Tasks, Checklists, Meetings & Actions | Tasks, Checklists, Meetings & Actions → Opening & Closing | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Closing — Search "Closing"

- **Expected:** hit containing opening-closing
- **Actual:** Tasks, Checklists, Meetings & Actions | Tasks, Checklists, Meetings & Actions → Opening & Closing | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Stock — Search "Stock"

- **Expected:** hit containing stock
- **Actual:** Inventory, Suppliers, Finance & Assets | Inventory, Suppliers, Finance & Assets → Stock | Inventory, Suppliers, Finance & Assets → Stock Transfers
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Equipment — Search "Equipment"

- **Expected:** hit containing equipment
- **Actual:** Inventory, Suppliers, Finance & Assets | Inventory, Suppliers, Finance & Assets → Equipment | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Rooms — Search "Rooms"

- **Expected:** hit containing rooms
- **Actual:** Organisation, Locations, Users & Permissions → Departments & Rooms | Inventory, Suppliers, Finance & Assets | Inventory, Suppliers, Finance & Assets → Rooms
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Printers — Search "Printers"

- **Expected:** hit containing printer
- **Actual:** Inventory, Suppliers, Finance & Assets | Inventory, Suppliers, Finance & Assets → Printers | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Risk_Centre — Search "Risk Centre"

- **Expected:** hit containing risk
- **Actual:** Incidents, Complaints, Risk & Continuity | Incidents, Complaints, Risk & Continuity → Risk Centre | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Emergency_Control — Search "Emergency Control"

- **Expected:** hit containing emergency
- **Actual:** Incidents, Complaints, Risk & Continuity | Incidents, Complaints, Risk & Continuity → Emergency Control | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.HR_Documents — Search "HR Documents"

- **Expected:** hit containing hr
- **Actual:** Staff & Doctor Management | Staff & Doctor Management → Credentials | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Offline_Reconciliation — Search "Offline Reconciliation"

- **Expected:** hit containing offline
- **Actual:** Time & Attendance → Offline Reconciliation | Action Inbox 6 | Open Emergency Control
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Expiry_Centre — Search "Expiry Centre"

- **Expected:** hit containing expiry
- **Actual:** Accreditation, Quality & Regulatory Compliance | Accreditation, Quality & Regulatory Compliance → Expiry Centre | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Communication_Book — Search "Communication Book"

- **Expected:** hit containing communication
- **Actual:** Email & SMS Communications | Email & SMS Communications → Communication Book | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Website_Monitoring — Search "Website Monitoring"

- **Expected:** hit containing website
- **Actual:** Digital Operations & Security | Digital Operations & Security → Website Monitoring | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### search.Approvals — Search "Approvals"

- **Expected:** hit containing approval
- **Actual:** Action Inbox & Notifications | Action Inbox & Notifications → Approvals | Action Inbox 6
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.w1440 — Responsive overflow-x @ 1440px

- **Expected:** 0
- **Actual:** 0
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.w1280 — Responsive overflow-x @ 1280px

- **Expected:** 0
- **Actual:** 0
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.w1024 — Responsive overflow-x @ 1024px

- **Expected:** 0
- **Actual:** 0
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.w768 — Responsive overflow-x @ 768px

- **Expected:** 0
- **Actual:** 0
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.mobileNav768 — Mobile nav affordance @ 768

- **Expected:** usable
- **Actual:** {"hasToggle":true}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.w430 — Responsive overflow-x @ 430px

- **Expected:** 0
- **Actual:** 0
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.mobileNav430 — Mobile nav affordance @ 430

- **Expected:** usable
- **Actual:** {"hasToggle":true}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.w390 — Responsive overflow-x @ 390px

- **Expected:** 0
- **Actual:** 0
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### responsive.mobileNav390 — Mobile nav affordance @ 390

- **Expected:** usable
- **Actual:** {"hasToggle":true}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### a11y.identityLabel — Act as User labelled

- **Expected:** aria-label
- **Actual:** ok
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### a11y.clinicLabel — Clinic scope labelled

- **Expected:** aria-label
- **Actual:** ok
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### a11y.groupsExpanded — Collapsible groups expose expanded state

- **Expected:** aria-expanded
- **Actual:** ok
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### a11y.currentNav — Active nav announced

- **Expected:** aria-current
- **Actual:** ok
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### a11y.escape — Escape closes overlays when present

- **Expected:** no crash
- **Actual:** no crash
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### storage.platformKeys — Platform context keys present

- **Expected:** clinics+identity
- **Actual:** ok
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### storage.migrationsIdempotent — Migrations registry present

- **Expected:** present
- **Actual:** {"clinic-context":1,"nav-prefs-module-ids":1,"identity-context":1,"m04-workforce-storage-v1":1,"m04-workforce-portal-seed-v1":1,"org-m3-inbox-bridge":1}
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### storage.noDupeRefresh — Refresh does not duplicate source links

- **Expected:** stable (3→3)
- **Actual:** 3→3
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

### a11y.tabOrder — Keyboard tab moves focus

- **Expected:** focus moves
- **Actual:** BUTTON:Open Organisation
- **Result:** pass
- **Defect:** —
- **File changed to repair:** —
- **Retest:** —
- **Remaining limitation:** —

## Remaining limitations

- Modules 4–24 remain Rebuild Pending by design (landing/partial only).
- Modules 1–3 UI remain in `components/workspaces` pending gradual migration.
- Some accessibility checks rely on visual browser inspection rather than axe-core automation.

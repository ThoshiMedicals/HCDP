# Defect reconciliation — 110 meaningful non-chrome clipping defects

- Source app SHA: `97a83d7beb219ce01a7b12c6f70a975a44614d59`
- Non-chrome overflow with flags: 604
- Meaningful defects after legitimate-scroll exemptions: **110**
- Unique route/viewport/control: 48
- Tags: {'button': 67, 'input': 31, 'select': 12}

| ID | Route | VP | Tag | Label | Flags | Status |
|---|---|---|---|---|---|---|
| D-012 | `/roster?section=open-shifts` | 1440 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-016 | `/time-attendance` | 1440 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-023 | `/time-attendance?section=approvals` | 1440 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-044 | `/roster?section=open-shifts` | 1440 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-048 | `/time-attendance` | 1440 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-055 | `/time-attendance?section=approvals` | 1440 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-076 | `/roster?section=open-shifts` | 1440 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-080 | `/time-attendance` | 1440 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-087 | `/time-attendance?section=approvals` | 1440 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-098 | `/staff-doctors` | 1280 | button | 'BLOCKED READINESS\n89' | outsideViewport,clippedByAncestor | OPEN |
| D-100 | `/staff-doctors?section=people` | 1280 | input | 'Email' | outsideViewport,clippedByAncestor | OPEN |
| D-102 | `/staff-doctors?section=credentials` | 1280 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-107 | `/roster` | 1280 | input | 'Clinic id' | outsideViewport,clippedByAncestor | OPEN |
| D-119 | `/time-attendance` | 1280 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-126 | `/time-attendance?section=approvals` | 1280 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-137 | `/staff-doctors` | 1280 | button | 'BLOCKED READINESS\n89' | outsideViewport,clippedByAncestor | OPEN |
| D-139 | `/staff-doctors?section=people` | 1280 | input | 'Email' | outsideViewport,clippedByAncestor | OPEN |
| D-141 | `/staff-doctors?section=credentials` | 1280 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-146 | `/roster` | 1280 | input | 'Clinic id' | outsideViewport,clippedByAncestor | OPEN |
| D-158 | `/time-attendance` | 1280 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-165 | `/time-attendance?section=approvals` | 1280 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-175 | `/staff-doctors` | 1024 | button | 'ACTIVE STAFF\n41' | outsideViewport,clippedByAncestor | OPEN |
| D-176 | `/staff-doctors` | 1024 | button | 'BLOCKED READINESS\n89' | outsideViewport,clippedByAncestor | OPEN |
| D-177 | `/staff-doctors?section=people` | 1024 | input | 'Preferred name' | outsideViewport,clippedByAncestor | OPEN |
| D-178 | `/staff-doctors?section=credentials` | 1024 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-184 | `/roster` | 1024 | input | 'Ends on' | outsideViewport,clippedByAncestor | OPEN |
| D-190 | `/roster?section=coverage` | 1024 | button | 'Evaluate coverage' | outsideViewport,clippedByAncestor | OPEN |
| D-194 | `/roster?section=open-shifts` | 1024 | input | 'Audience' | outsideViewport,clippedByAncestor | OPEN |
| D-199 | `/time-attendance` | 1024 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-206 | `/time-attendance?section=approvals` | 1024 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-216 | `/staff-doctors` | 1024 | button | 'ACTIVE STAFF\n41' | outsideViewport,clippedByAncestor | OPEN |
| D-217 | `/staff-doctors` | 1024 | button | 'BLOCKED READINESS\n89' | outsideViewport,clippedByAncestor | OPEN |
| D-218 | `/staff-doctors?section=people` | 1024 | input | 'Preferred name' | outsideViewport,clippedByAncestor | OPEN |
| D-219 | `/staff-doctors?section=credentials` | 1024 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-225 | `/roster` | 1024 | input | 'Ends on' | outsideViewport,clippedByAncestor | OPEN |
| D-231 | `/roster?section=coverage` | 1024 | button | 'Evaluate coverage' | outsideViewport,clippedByAncestor | OPEN |
| D-235 | `/roster?section=open-shifts` | 1024 | input | 'Audience' | outsideViewport,clippedByAncestor | OPEN |
| D-240 | `/time-attendance` | 1024 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-247 | `/time-attendance?section=approvals` | 1024 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-257 | `/staff-doctors` | 768 | button | 'ACTIVE DOCTORS\n48' | outsideViewport,clippedByAncestor | OPEN |
| D-258 | `/staff-doctors` | 768 | button | 'ON LEAVE TODAY\n0' | outsideViewport,clippedByAncestor | OPEN |
| D-259 | `/staff-doctors?section=people` | 768 | button | 'Create' | outsideViewport,clippedByAncestor | OPEN |
| D-260 | `/staff-doctors?section=credentials` | 768 | button | 'Add' | outsideViewport,clippedByAncestor | OPEN |
| D-279 | `/staff-doctors` | 768 | button | 'ACTIVE DOCTORS\n48' | outsideViewport,clippedByAncestor | OPEN |
| D-280 | `/staff-doctors` | 768 | button | 'ON LEAVE TODAY\n0' | outsideViewport,clippedByAncestor | OPEN |
| D-281 | `/staff-doctors?section=people` | 768 | button | 'Create' | outsideViewport,clippedByAncestor | OPEN |
| D-282 | `/staff-doctors?section=credentials` | 768 | button | 'Add' | outsideViewport,clippedByAncestor | OPEN |
| D-301 | `/staff-doctors` | 430 | button | 'ACTIVE STAFF\n41' | outsideViewport,clippedByAncestor | OPEN |
| D-302 | `/staff-doctors` | 430 | button | 'ACTIVE DOCTORS\n48' | outsideViewport,clippedByAncestor | OPEN |
| D-303 | `/staff-doctors` | 430 | button | 'BLOCKED READINESS\n89' | outsideViewport,clippedByAncestor | OPEN |
| D-304 | `/staff-doctors?section=people` | 430 | select | 'Staff\nDoctor' | outsideViewport,clippedByAncestor | OPEN |
| D-305 | `/staff-doctors?section=people` | 430 | input | 'Preferred name' | outsideViewport,clippedByAncestor | OPEN |
| D-306 | `/staff-doctors?section=people` | 430 | input | 'Email' | outsideViewport,clippedByAncestor | OPEN |
| D-307 | `/staff-doctors?section=people` | 430 | button | 'Create' | outsideViewport,clippedByAncestor | OPEN |
| D-308 | `/staff-doctors?section=credentials` | 430 | select | 'Akith Hettiarachchi\nAlana Cheney\nAlvina ' | outsideViewport,clippedByAncestor | OPEN |
| D-309 | `/staff-doctors?section=credentials` | 430 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-310 | `/staff-doctors?section=credentials` | 430 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-311 | `/staff-doctors?section=credentials` | 430 | button | 'Add' | outsideViewport,clippedByAncestor | OPEN |
| D-312 | `/roster?section=open-shifts` | 430 | select | 'Select shift…\nClinical Nurse · 2026-08-0' | outsideViewport,clippedByAncestor | OPEN |
| D-313 | `/roster?section=open-shifts` | 430 | input | 'Audience' | outsideViewport,clippedByAncestor | OPEN |
| D-314 | `/roster?section=open-shifts` | 430 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-324 | `/staff-doctors` | 430 | button | 'ACTIVE STAFF\n41' | outsideViewport,clippedByAncestor | OPEN |
| D-325 | `/staff-doctors` | 430 | button | 'ACTIVE DOCTORS\n48' | outsideViewport,clippedByAncestor | OPEN |
| D-326 | `/staff-doctors` | 430 | button | 'BLOCKED READINESS\n89' | outsideViewport,clippedByAncestor | OPEN |
| D-327 | `/staff-doctors?section=people` | 430 | select | 'Staff\nDoctor' | outsideViewport,clippedByAncestor | OPEN |
| D-328 | `/staff-doctors?section=people` | 430 | input | 'Preferred name' | outsideViewport,clippedByAncestor | OPEN |
| D-329 | `/staff-doctors?section=people` | 430 | input | 'Email' | outsideViewport,clippedByAncestor | OPEN |
| D-330 | `/staff-doctors?section=people` | 430 | button | 'Create' | outsideViewport,clippedByAncestor | OPEN |
| D-331 | `/staff-doctors?section=credentials` | 430 | select | 'Akith Hettiarachchi\nAlana Cheney\nAlvina ' | outsideViewport,clippedByAncestor | OPEN |
| D-332 | `/staff-doctors?section=credentials` | 430 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-333 | `/staff-doctors?section=credentials` | 430 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-334 | `/staff-doctors?section=credentials` | 430 | button | 'Add' | outsideViewport,clippedByAncestor | OPEN |
| D-335 | `/roster?section=open-shifts` | 430 | select | 'Select shift…\nClinical Nurse · 2026-08-0' | outsideViewport,clippedByAncestor | OPEN |
| D-336 | `/roster?section=open-shifts` | 430 | input | 'Audience' | outsideViewport,clippedByAncestor | OPEN |
| D-337 | `/roster?section=open-shifts` | 430 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-347 | `/roster?section=coverage` | 390 | select | 'Select period…\nDemo Roster — Week A (202' | outsideViewport,clippedByAncestor | OPEN |
| D-348 | `/roster?section=coverage` | 390 | button | 'Evaluate coverage' | outsideViewport,clippedByAncestor | OPEN |
| D-349 | `/roster?section=open-shifts` | 390 | select | 'Select shift…\nClinical Nurse · 2026-08-0' | outsideViewport,clippedByAncestor | OPEN |
| D-350 | `/roster?section=open-shifts` | 390 | input | 'Audience' | outsideViewport,clippedByAncestor | OPEN |
| D-351 | `/roster?section=open-shifts` | 390 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-361 | `/roster?section=coverage` | 390 | select | 'Select period…\nDemo Roster — Week A (202' | outsideViewport,clippedByAncestor | OPEN |
| D-362 | `/roster?section=coverage` | 390 | button | 'Evaluate coverage' | outsideViewport,clippedByAncestor | OPEN |
| D-363 | `/roster?section=open-shifts` | 390 | select | 'Select shift…\nClinical Nurse · 2026-08-0' | outsideViewport,clippedByAncestor | OPEN |
| D-364 | `/roster?section=open-shifts` | 390 | input | 'Audience' | outsideViewport,clippedByAncestor | OPEN |
| D-365 | `/roster?section=open-shifts` | 390 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-375 | `/roster?section=coverage` | 390 | select | 'Select period…\nDemo Roster — Week A (202' | outsideViewport,clippedByAncestor | OPEN |
| D-376 | `/roster?section=coverage` | 390 | button | 'Evaluate coverage' | outsideViewport,clippedByAncestor | OPEN |
| D-377 | `/roster?section=open-shifts` | 390 | select | 'Select shift…\nClinical Nurse · 2026-08-0' | outsideViewport,clippedByAncestor | OPEN |
| D-378 | `/roster?section=open-shifts` | 390 | input | 'Audience' | outsideViewport,clippedByAncestor | OPEN |
| D-379 | `/roster?section=open-shifts` | 390 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-389 | `/staff-doctors?section=engagements` | 1440 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-421 | `/roster?section=open-shifts` | 1440 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-425 | `/roster?section=availability-leave` | 1440 | input | 'Clinic id filter' | outsideViewport,clippedByAncestor | OPEN |
| D-430 | `/roster?section=conflicts-warnings` | 1440 | button | 'Evaluate conflicts' | outsideViewport,clippedByAncestor | OPEN |
| D-443 | `/roster?section=settings` | 1440 | button | 'Create draft' | outsideViewport,clippedByAncestor | OPEN |
| D-447 | `/time-attendance?section=live` | 1440 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-460 | `/time-attendance?section=corrections` | 1440 | button | 'Request correction' | outsideViewport,clippedByAncestor | OPEN |
| D-464 | `/time-attendance?section=approvals` | 1440 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-471 | `/time-attendance?section=history` | 1440 | button | 'Clear filter' | outsideViewport,clippedByAncestor | OPEN |
| D-478 | `/time-attendance?section=settings` | 1440 | button | 'Publish policy' | outsideViewport,clippedByAncestor | OPEN |
| D-497 | `/staff-doctors?section=engagements` | 1440 | input | '' | outsideViewport,clippedByAncestor | OPEN |
| D-529 | `/roster?section=open-shifts` | 1440 | button | 'Offer' | outsideViewport,clippedByAncestor | OPEN |
| D-533 | `/roster?section=availability-leave` | 1440 | input | 'Clinic id filter' | outsideViewport,clippedByAncestor | OPEN |
| D-538 | `/roster?section=conflicts-warnings` | 1440 | button | 'Evaluate conflicts' | outsideViewport,clippedByAncestor | OPEN |
| D-551 | `/roster?section=settings` | 1440 | button | 'Create draft' | outsideViewport,clippedByAncestor | OPEN |
| D-555 | `/time-attendance?section=live` | 1440 | button | 'Refresh live board' | outsideViewport,clippedByAncestor | OPEN |
| D-568 | `/time-attendance?section=corrections` | 1440 | button | 'Request correction' | outsideViewport,clippedByAncestor | OPEN |
| D-572 | `/time-attendance?section=approvals` | 1440 | button | 'Bulk approve pending' | outsideViewport,clippedByAncestor | OPEN |
| D-579 | `/time-attendance?section=history` | 1440 | button | 'Clear filter' | outsideViewport,clippedByAncestor | OPEN |
| D-586 | `/time-attendance?section=settings` | 1440 | button | 'Publish policy' | outsideViewport,clippedByAncestor | OPEN |

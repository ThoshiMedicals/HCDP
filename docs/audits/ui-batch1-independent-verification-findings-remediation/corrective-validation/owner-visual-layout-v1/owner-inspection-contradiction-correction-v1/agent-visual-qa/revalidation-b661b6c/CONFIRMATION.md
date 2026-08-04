# Visual QA confirmation — original resolution adjudication

**Agent:** Visual QA Agent (READ-ONLY against application source)  
**Frozen app SHA:** `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1`  
**Live base:** `http://127.0.0.1:3501`  
**Capture tool:** Playwright Chromium, `deviceScaleFactor: 1`

## Resolution confirmation

I inspected screenshots at **original screenshot resolution** (viewport CSS pixels with `deviceScaleFactor=1`). Screenshots were **not downscaled** for adjudication.

Verified sample pixel dimensions:

| File | Pixels |
| --- | --- |
| `light-430x932-staff-doctors.png` | 430×932 |
| `light-430x932-staff-doctors_section_people.png` | 430×932 |
| `light-1440x900-time-attendance.png` | 1440×900 |
| `dark-430x932-staff-doctors.png` | 430×932 |
| `system-390x844-roster_section_open-shifts.png` | 390×844 |
| `light-1024x600-dashboard.png` | 1024×600 |

## Appearance switching

Light / Dark / System were applied via the existing dashboard **Appearance** `<select aria-label="Appearance">` control (then navigated to target routes). System mode used `prefers-color-scheme: dark` emulation so dark tokens resolve.

## Authority

A DOM/matrix pass does **not** overrule Visual QA failures observed in screenshots. Geometry probes were used as supporting evidence only.

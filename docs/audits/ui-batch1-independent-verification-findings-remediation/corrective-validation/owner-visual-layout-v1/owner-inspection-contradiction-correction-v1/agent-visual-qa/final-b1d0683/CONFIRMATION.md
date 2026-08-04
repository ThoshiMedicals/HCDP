# Visual QA confirmation — original resolution adjudication

**Agent:** Visual QA Agent (READ-ONLY against application source)  
**Frozen app SHA:** `b1d0683057882546b68c73b1ae679630d8dbbcb8`  
**Live base:** `http://127.0.0.1:3501`  
**Capture tool:** Playwright Chromium, `deviceScaleFactor: 1`

## Resolution confirmation

I inspected screenshots at **original screenshot resolution** (viewport CSS pixels with `deviceScaleFactor=1`). Screenshots were **not downscaled** for adjudication.

Verified sample pixel dimensions:

| File | Pixels |
| --- | --- |
| `light-1024x768-dashboard.png` | 1024×768 |
| `light-1280x900-dashboard.png` | 1280×900 |
| `light-1440x900-dashboard.png` | 1440×900 |
| `light-1536x900-dashboard.png` | 1536×900 |
| `light-430x932-staff-doctors.png` | 430×932 |
| `light-430x932-staff-doctors_section_people.png` | 430×932 |
| `light-390x844-roster_section_open-shifts.png` | 390×844 |
| `light-1024x768-time-attendance.png` | 1024×768 |
| `dark-1024x768-dashboard.png` | 1024×768 |
| `system-1536x900-dashboard.png` | 1536×900 |
| `light-1024x600-dashboard.png` | 1024×600 |

## Appearance switching

Light / Dark / System were applied via the existing dashboard **Appearance** `<select aria-label="Appearance">` control (then navigated to target routes). System mode used `prefers-color-scheme: dark` emulation so dark tokens resolve.

## CSS / server preflight

- Production `next start` on `:3501` (not `:3000`); server left running
- Dashboard CSS asset `/_next/static/css/aef84fda6bfb6c30.css` returned **HTTP 200** and contains `.hidden{display:none}`
- `git diff b1d0683 -- src scripts` was empty (0 bytes)

## Authority

A DOM/matrix pass does **not** overrule Visual QA failures observed in screenshots. Geometry probes were used as supporting evidence only.

## Prior evidence

Prior VQA at `b661b6c` under `../revalidation-b661b6c/` was **not** overwritten.

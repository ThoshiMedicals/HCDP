# Healthcare Doctors Pulse (UI-first)

Next.js App Router + TypeScript + Tailwind shell that matches the v34 HTML concept.

## Design sources (kept at HCDP root)

- `Healthcare_Doctors_Pulse_Executive_Healthcare_Operations_Platform_v34_Stronger_Navigation_Palette.html` — UI + data source of truth
- `Healthcare_Doctors_Pulse_Consolidated_Business_Blueprint_v2_Gap_Audited.docx` — product context

## Extracted HTML data

JSON extracted into `src/lib/extracted/`:

| File | Contents |
|------|----------|
| `locations.json` | SEED_LOCATIONS (9 clinics) |
| `doctors.json` | SEED_DOCTORS (48) |
| `staff.json` | SEED_STAFF (100) |
| `checklists.json` | SEED_CHECKLISTS (10) |
| `accreditation.json` | SEED_ACCREDITATION_RECORDS |
| `risk-seed.json` / `compliance-seed.json` | RISK_SEED / COMPLIANCE_SEED |
| `nav.json` | v32 navigation (12 family groups) |
| `family-styles.json` | Family accent palette |
| `theme.json` | CSS tokens + theme packs |
| `brd-modules.json` | BRD_V2_MODULES (20) |
| `module-blueprints.json` | MODULE_BLUEPRINTS (24) |

Re-extract from the HTML:

```bash
node scripts/extract-html-data.js
```

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to the Executive Command Centre.

## This phase

- App shell (sidebar, clinic switch, topbar, page header)
- 20 module routes matching the HTML navigation
- Mock workspaces for Dashboard, Action Inbox, Organisation, and Tasks
- LocalStorage for active clinic and light UI state
- No backend, auth, payroll engines, or connectors

## Scripts

| Command       | Description        |
|---------------|--------------------|
| `npm run dev` | Local development  |
| `npm run build` | Production build |
| `npm run start` | Run production    |
| `npm run lint`  | ESLint            |

# AGENTS.md

## Cursor Cloud specific instructions

Healthcare Doctors Pulse is a single Next.js 16 (App Router) + TypeScript + Tailwind
front-end. There is no separate backend, database, or auth service to run for local
development — module state is in-memory / LocalStorage and seed data lives in
`src/lib/extracted/`. The `db/migrations/` folder is a design artifact and is not wired
into local dev.

Standard commands live in `package.json` and `README.md` (`npm run dev`, `npm run build`,
`npm run start`, `npm run lint`, `npm test`). Notes below are only the non-obvious caveats.

- Run the app with Turbopack, not webpack. The committed dev script is
  `next dev --webpack`, but on `main` the browser bundle currently fails to compile
  because `src/platform/workforce/contracts/published-timesheet-hash.ts` imports
  `node:crypto`, which webpack cannot bundle for the browser (`UnhandledSchemeError`).
  This is a known app-code issue being remediated on separate branches (e.g.
  `cursor/browser-crypto-remediation`), not an environment problem. Until that lands,
  start dev with `npx next dev --turbopack` (Next 16's default bundler stubs `node:`
  builtins), which serves all module routes fine. `npm run build`/`start` use webpack and
  will hit the same issue.
- Only one Next dev server can run per project directory at a time (Next 16 enforces
  this). Stop any existing dev server before starting another, or you'll get
  "Another next dev server is already running."
- `/` returns a 307 redirect to `/dashboard`. All module pages are served by the dynamic
  `/[module]` route.
- Tests use Node's built-in test runner via `tsx` (see the `test:*` scripts). They run
  outside Next/webpack, so they are unaffected by the `node:crypto` browser-bundle issue.
- `npm run lint` currently reports one pre-existing error in
  `src/modules/m07-staff-pay/context.tsx` (`react-hooks/set-state-in-effect`) plus some
  warnings. These are pre-existing in app code, not caused by environment setup.

# npm run build note @ b1d0683

Default `npm run build` FAILS on this worktree because `node_modules` is a symlink (Turbopack: "Symlink node_modules is invalid").

Accepted remediation path (same as prior owner-visual loops):
- `npx next build --webpack` PASS
- `npm run build -- --webpack` PASS (see `logs/27-npm-build-webpack-retry.log`)

Default turbopack `npm run build` remains environment-linked FAIL on symlinked node_modules; not an application defect.

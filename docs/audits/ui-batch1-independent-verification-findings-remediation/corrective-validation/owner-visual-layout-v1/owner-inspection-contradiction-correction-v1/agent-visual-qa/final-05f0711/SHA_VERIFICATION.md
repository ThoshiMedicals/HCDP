# SHA verification — Visual QA Agent (final-05f0711)

| Check | Result |
| --- | --- |
| Frozen app SHA | `05f07119ec2883b7ec7a2da6bbe3b5162257c2ec` |
| `git rev-parse 05f0711…` | matches |
| Worktree HEAD | `f8d27ea177b31697c664068436fdb7c329b4e61a` (docs tip; `src`/`scripts` match frozen app) |
| `git diff 05f0711 -- src scripts` | **empty (0 bytes)** |
| Live server | `http://127.0.0.1:3501` (production `next start`) |
| CSS asset | `/_next/static/css/fc4fccb65dcb8256.css` HTTP **200**, contains `.hidden` |

Application source under `src/` / `scripts/` was not modified by Visual QA.  
Prior evidence folders `../revalidation-b661b6c/` and `../final-b1d0683/` were **not** overwritten.

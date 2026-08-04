# SHA verification — Visual QA Agent (final-b1d0683)

| Check | Result |
| --- | --- |
| Frozen app SHA | `b1d0683057882546b68c73b1ae679630d8dbbcb8` |
| `git rev-parse b1d0683…` | matches |
| Worktree HEAD | `d8e49074053f2a41603c93b0e916963471585afe` (docs tip; `src`/`scripts` match frozen app) |
| `git diff b1d0683 -- src scripts` | **empty (0 bytes)** |
| Live server | `http://127.0.0.1:3501` (production `next start`) |
| CSS asset | `/_next/static/css/aef84fda6bfb6c30.css` HTTP **200**, contains `.hidden` |

Application source under `src/` / `scripts/` was not modified by Visual QA.

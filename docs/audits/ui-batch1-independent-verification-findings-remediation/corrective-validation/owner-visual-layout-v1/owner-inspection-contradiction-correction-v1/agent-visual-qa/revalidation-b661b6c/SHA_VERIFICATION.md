# SHA verification — Visual QA Agent

| Check | Result |
| --- | --- |
| Frozen app SHA | `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1` |
| `git rev-parse b661b6c…` | matches |
| Worktree HEAD | `15984ee1bb5c734e345d568f1ef485d66492e89d` (docs tip; includes frozen app commit) |
| `git diff b661b6c -- src scripts` | **empty (0 bytes)** |
| Live server | `http://127.0.0.1:3501` (production `next start`) |
| Regression matrix adjunct SHA | `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1` (`prod-matrix-complete-gate/run-meta.json`) |

Application source under `src/` / `scripts/` was not modified by Visual QA.

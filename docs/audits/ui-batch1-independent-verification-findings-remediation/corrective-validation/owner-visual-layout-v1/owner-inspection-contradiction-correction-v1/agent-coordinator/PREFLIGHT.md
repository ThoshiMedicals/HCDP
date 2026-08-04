# Pre-flight — owner-inspection contradiction correction v1

| Check | Result |
| --- | --- |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Required starting tip | `247048a58bee67b10fb885fad56b9653e76f1b7a` |
| Branch | `cursor/ui-batch1-owner-colour-readability-verification-fixes` |
| Claimed prior app SHA | `97a83d7beb219ce01a7b12c6f70a975a44614d59` |
| Ancestry | PASS (97a83d7 and main ancestors of tip) |
| PR / merge | NONE |
| Owner :3000 | PRESERVED |

## Contradiction
Commit `97a83d7` introduced `if (!h.chromeScoped) return false`, invalidating the complete clipping gate. Owner-readiness claim at `247048a` is **withdrawn**.

## Ports
| Role | Port | Worktree |
| --- | --- | --- |
| Owner handoff | 3000 | ui-batch1-vf-fixes (preserve) |
| Contradiction matrix / QA | 3501 | ui-batch1-contradiction-v1 |

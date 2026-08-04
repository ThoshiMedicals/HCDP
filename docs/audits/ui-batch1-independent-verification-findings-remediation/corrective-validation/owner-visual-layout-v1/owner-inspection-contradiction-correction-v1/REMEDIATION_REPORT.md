# Owner-inspection contradiction correction v1 — remediation report

## Why the `247048a` owner-readiness claim was withdrawn

The tip `247048a` claimed readiness after multi-agent QA against frozen app SHA `97a83d7`. That SHA introduced a **chrome-only** element-clip hard-fail bypass:

```js
if (!h.chromeScoped) return false
```

This prevented every non-chrome module control from failing the clipping/occlusion matrix, contradicting the authorised complete-control gate. Matrix evidence still recorded `nonChromeElementClipHits: 24953` with ≥604 flagged non-chrome overflow records and **110** meaningful defects after legitimate-scroll exemptions — while reporting 338/0 pass.

Additionally, the “final” Visual QA inspected only four Light screenshots and Work-Step QA ran only five spot-check workflows.

## How the chrome-only bypass invalidated the complete clipping gate

Hard-fail adjudication required `chromeScoped === true`. M04–M06 controls clipped by `overflow-x-hidden` (tables/`min-w-[800px]` blow-out, section-nav min-content ~1202px) were evidence-only and never matrix-failed. That is test weakening / missing required checks.

## 110-defect reconciliation

See `phase1-reproduction/DEFECT_RECONCILIATION_110.md` (offline re-adjudication of committed `revalidation-97a83d7` overflowHits with the complete predicate).

**Final:** all 110 CLOSED at app SHA `05f0711` (presentation containment + restored gate + complete Visual QA).

## Corrections (presentation only)

1. **Gate** — remove chrome bypass; hard-fail outsideViewport / clippedByAncestor / occluded / unintendedTruncation for every visible meaningful control (centre in viewport) subject to narrow scroll exemptions; summary aggregates added.
2. **M04–M06** — `Table`/`Panel`/`SectionFrame`/`grid-cols-[minmax(0,1fr)]` containment; form `min-w-0 w-full max-w-full`; workspace nav `min-w-0`; handlers unchanged.
3. **Topbar** — ribbon wrap/density: Export/New Entry/Enterprise at `2xl`; search min-width; shortened Enterprise MFA visible label with full aria-label; Online kept in-viewport through 1536.

## Final multi-agent results @ `05f0711`

| Agent | Evidence | Result |
| --- | --- | --- |
| Visual QA | `agent-visual-qa/final-05f0711/` | PASS — 858 screens; 0 open |
| Work-Step QA | `agent-workstep-qa/final-05f0711/` | PASS — 33 workflows; 0 fail |
| Regression | `agent-regression/revalidation-05f0711/` | PASS — 28/0 |
| Matrix | `agent-regression/prod-matrix-final-05f0711/` | PASS — 338/0; clip defects 0 |

## SHA traceability

| Ref | SHA |
| --- | --- |
| origin/main | `0afe87806cdc1e3e8e90da5293183ef1b2fd9c76` |
| Required start tip | `247048a58bee67b10fb885fad56b9653e76f1b7a` |
| Final app source | `05f07119ec2883b7ec7a2da6bbe3b5162257c2ec` |
| Branch tip (after docs) | (see push) |

Post-app commits are documentation/evidence-only (`git diff 05f0711..HEAD -- src scripts` empty).

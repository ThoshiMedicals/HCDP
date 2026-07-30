# HCDP Parallel PR Checklist

**Template version:** 1.0
**Use:** Paste into the PR body (or attach a filled copy under `docs/audits/`) before requesting owner review.
**Merge rule:** Do not merge to `main` unless the owner/Controller expressly instructs after gates pass.

---

## PR header

| Field | Value |
|---|---|
| Title | |
| Branch | |
| Base | `main` @ pinned SHA ________ |
| Authorised batch | |
| Implementer agent | |
| Integration agent | |
| Independent QA agent | |
| Completion report path | |

---

## A. Control gates

- [ ] PR targets `main` from a named `agent/...` branch (not a direct `main` commit)
- [ ] Branch created from Controller pinned baseline
- [ ] Pin SHA recorded in PR and completion report
- [ ] One authorised batch only; next batch not started
- [ ] File ownership claims respected (`docs/plans/HCDP_PARALLEL_AGENT_FILE_OWNERSHIP_MATRIX.md`)
- [ ] Hotspot files touched only by Integration/Controller
- [ ] No edits to `.cursor/rules/hcdp-wave-control.mdc` unless Controller+owner authorised
- [ ] No rewrites of accepted Wave 1A-5 / M07 Batch 1-6 evidence files
- [ ] `git diff --check` clean

---

## B. Explicit exclusions (must all remain true)

- [ ] No PPA implementation (unless this PR **is** an owner-authorised named PPA batch)
- [ ] Unlock/reopen not mislabeled as PPA
- [ ] No payment execution / net-pay / mark-as-paid
- [ ] No bank-file generation
- [ ] No STP
- [ ] No superannuation processing
- [ ] No provider-return processing
- [ ] No named Xero production integration
- [ ] No Module 8 / doctor-pay calculation inside M07
- [ ] No claim that export packages are paid
- [ ] No award/tax/super/employment-law certification claim
- [ ] No production-approval claim

---

## C. Architecture / freeze

- [ ] No cross-module `repository/` imports
- [ ] Storage uses correct `pulse.mXX.*` prefix via repositories
- [ ] Migrations additive; accepted history not rewritten
- [ ] Frozen M04/M05/M06/M11 untouched **or** covered by documented defect/CR + owner review
- [ ] M06 does not write `pulse.m07.*` except via authorised M07 intake contracts
- [ ] Platform register / clinic / identity / inbox contracts preserved

---

## D. Test gates

- [ ] Scoped module tests recorded (command + counts)
- [ ] Full `npm test` run when required (hotspots / cross-module / integration PR)
- [ ] `npm run lint` (integration/QA)
- [ ] `npm run build` (integration/QA/owner gate)
- [ ] `npm run test:platform-qa` if shell/platform touched
- [ ] Failures explained; pre-existing Batch 6 qualifications not silently "fixed" out of scope

Commands run:

```text
(paste)
```

---

## E. Evidence gates

- [ ] Browser workflow evidence attached/linked
- [ ] Responsive evidence for 1440, 1280, 1024, 768, 430, 390 (overflow-x = 0 on touched surfaces)
- [ ] Permission / SoD evidence for new or changed actions
- [ ] Storage / migration evidence
- [ ] Frozen-wave regression evidence as required by Controller

Evidence links/paths:

-

---

## F. Independent QA

- [ ] QA agent != implementer
- [ ] QA reviewed against pin or integration tip
- [ ] QA result: Accept / Rework / Block
- [ ] Rework items (if any) returned to owning agent

QA summary:

-

---

## G. Owner stop gate

- [ ] Completion report complete
- [ ] This checklist complete
- [ ] **Stop** -- awaiting owner acceptance
- [ ] Merge only after explicit instruction
- [ ] After merge, Controller re-pins baseline

**Owner decision:** _pending / accept / accept with qualifications / reject_

**Qualifications to retain:**

-

---

## H. Diff hygiene

- [ ] Only intended paths changed (no production drive-by)
- [ ] No secrets (`.env`, credentials) committed
- [ ] Docs-only PRs do not modify `src/**` unless expressly in scope

`git status -sb` / changed path summary:

```text
(paste)
```

---

*End of parallel PR checklist.*

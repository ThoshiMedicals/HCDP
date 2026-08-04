# Phase 4 gate — VQA-005 reopen → Implementation

**Frozen SHA invalidated for readiness:** `d822dfd4a80ed0c98635a0ff8631f9e39fe781f0`  
**Reason:** Visual QA Agent filed **VQA-005 OPEN (Critical)** — mid-width (1024×768) emergency card column collapse / text–button overlap.  
**Work-Step QA:** workflows PASS (no OPEN WQA); does not overrule Visual FAIL.  
**Regression Auditor:** aborted / NOT RUN against d822dfd — must run against next frozen SHA after fix.

## Root-cause hypothesis (Coordinator)

`md:grid-cols-[minmax(0,1fr)_auto]` + action cluster `md:w-auto` lets the action column take max-content width of nowrap buttons from 768px up, squeezing the copy column at ~1024 (content ~736px with sidebar).

## Authorised fix (Implementation only)

- Keep mobile wrap (VQA-001 must stay closed).
- Prefer single-column stack until `lg`/`xl`, **or** cap action column (`minmax(0, …)`) and keep `w-full min-w-0 flex-wrap` on actions at all breakpoints.
- No handler/behaviour changes.
- Update presentation tests for new breakpoint/classes.
- Commit; stop source editing; report new application source SHA.

## Revalidation required after new SHA

1. Rebuild VQA/WQA servers at new SHA (ports 3490/3491).
2. Visual QA reruns full final matrix; only Visual QA may close VQA-005.
3. Work-Step QA reruns affected emergency workflows.
4. Regression Auditor runs complete sequential suite against new SHA.

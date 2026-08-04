# Phase 4 reopen — VQA-C-001

**Invalidated frozen SHA:** `b661b6c1e3debdd8ba4d1e71b55fe9f7052f90b1`

**Reason:** Complete Visual QA at b661b6c closed the prior 110 module clipping defects and the complete-gate matrix reported 338/0, but Visual QA raised **VQA-C-001** (topbar Export / overcrowded ribbon-right clipped at 1024×768 and 1024×600). Per mandate, any later source change invalidates final Visual QA, Work-Step QA, and regression at the prior SHA.

**Authorised fix:** presentation-only Topbar ribbon-right containment — `min-w-0 max-w-full` on `.ribbon-right`; defer `+ New Entry`, `Export`, and `Enterprise Sign-In · MFA` to `xl:inline-flex` so mid-desktop widths keep Dashboard / Action Inbox / Online fully visible without viewport clipping. Handlers unchanged.

**Next freeze:** commit after Topbar fix; re-run complete Visual QA, Work-Step QA, regression, and complete-gate matrix against the new SHA.

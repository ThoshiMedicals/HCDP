# Phase 4 reopen — VQA-C-017

**Invalidated frozen SHA:** `b1d0683057882546b68c73b1ae679630d8dbbcb8`

**Reason:** Final Visual QA closed VQA-C-001 and the prior 110 module defects, but raised **VQA-C-017** (ribbon search crushed to ~44px / placeholder “Sear” at 1024).

**Fix in `5f2887b7faf5ffd276a03735835b7b61ec873508`:** `pulse-top-ribbon` nowrap deferred to `xl`; `ribbon-center` uses `xl:min-w-[12rem]` and full-width wrap below xl.

Work-Step QA at b1d0683 remains PASS evidence under `agent-workstep-qa/final-b1d0683/` but is invalidated for readiness by the source change.

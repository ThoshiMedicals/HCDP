# Hydration suppression governance — FINAL (Phase 3)

**Status:** Finalised for UI Batch 1 Phase 3.  
**Decision:** Retain `suppressHydrationWarning` on root `<html>` only — **unresolved owner/IV decision** for eventual removal (cookie/SSR theme). Do **not** claim no-suppression satisfied.  
**Input SHA (Phase 2 map):** `f837bdd08e1db30e68c63cfb2542e3120bc40d00`  
**App source SHA at Phase 2 map:** `e6e2f90ea42f39ddab1d5ce39c1e306f214a1742`  
**Scope:** Document why suppression exists; prove it cannot silence M04–M07 subtree mismatches; forbid adding it elsewhere.

---

## 1. Current wiring

### `src/app/layout.tsx`

```tsx
<html lang="en" className="h-full" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  </head>
  <body className="min-h-full antialiased">{children}</body>
</html>
```

- `suppressHydrationWarning` is present **only** on the root `<html>` element in application source.
- Tests assert: single occurrence in `layout.tsx`; absent from M04–M07 workspace trees.

### `src/components/shell/theme-init-script.ts`

Blocking IIFE mutates **`document.documentElement` only**:

| Mutation | Attribute / property |
| -------- | -------------------- |
| `classList.toggle("theme-dark", !!dark)` | `class` on `<html>` |
| `setAttribute("data-appearance", a)` | `data-appearance` |
| `style.colorScheme = dark ? "dark" : "light"` | inline `style` |

Storage key: `pulse.cc.appearance`. Invalid values → `"light"`. `"system"` uses `prefers-color-scheme`.

---

## 2. Why limited to root

React’s `suppressHydrationWarning` on a node suppresses **attribute/text mismatch warnings for that node only** (and one level of text children for that host). It does **not**:

- Cascade into the React subtree under `<body>`
- Silence mismatched M04/M05/M06/M07 client trees
- Hide console hydration errors emitted for nested components

Theme-init intentionally diverges SSR vs first paint on `<html>` attributes (`class`, `data-appearance`, `style`). Suppression belongs on that host element alone.

---

## 3. Proof it cannot suppress M04–M07 subtree mismatches

1. **Attribute placement:** Suppression is only on `<html>` in `layout.tsx`. M04–M07 workspaces render under `<body>{children}</body>` with no suppression props (guarded by tests).
2. **Theme-init target:** Script uses `document.documentElement` only — never mutates module workspace DOM before hydrate.
3. **Prior remediation:** Selective hydration fixes in M04/M05/M07 (deterministic bootstrap status, empty workforce counts, offline server snapshot) address real subtree mismatches without suppression.
4. **Validator:** Hydration signatures (incl. React #418) remain hard fails in `ui-batch1-iv-findings-remediation-validate.mjs` — root suppression does not allowlist those console/page errors.

---

## 4. Removability (owner/IV decision — unresolved)

| Option | Removes suppression? | Within UI Batch 1 scope? |
| ------ | -------------------- | ------------------------ |
| A. Keep on `<html>` + theme-init | No | **Yes — retained** |
| B. Remove suppression, keep theme-init | Yes | No — reintroduces html attribute warnings |
| C. Remove theme-init; theme after hydrate | Yes | No — theme flash / FOUC |
| D. Cookie/header SSR preference | Yes (eventually) | No — platform/auth change |

**Phase 3 outcome:** Suppression **retained** on `<html>`. Marked **unresolved** for owner/IV if a future batch authorises cookie-based SSR theme. Not safely removable within authorised UI layout defects without flash or false hydration noise.

---

## 5. Governance rules

- Do **NOT** add `suppressHydrationWarning` anywhere else.
- Do **NOT** silently claim “no-suppression satisfied” while root retention stands.
- Theme-init must continue targeting `document.documentElement` only for class / data-appearance / colorScheme.

---

## 6. Test coverage

`src/components/workspaces/tests/ui-batch1-iv-findings-remediation.test.ts`:

- Suppression only in `src/app/layout.tsx` (single site)
- Theme-init targets `document.documentElement`
- No `suppressHydrationWarning` in M04–M07 workspace sources

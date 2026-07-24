# Legacy area

This folder holds **references and adapters** for HTML-era / extracted prototype material.

## Rules

- Do **not** build new product features here.
- Prefer importing extracted schemas from `src/lib/extracted/` until they are relocated under `src/legacy/extracted/`.
- The HTML prototype remains at `public/pulse-html-prototype.html` with a QA pointer under `public/legacy/`.
- Development / QA entry: `/prototype-reference`.

## Intended contents (gradual)

| Path | Purpose |
|---|---|
| `src/legacy/extracted/` | Relocated FIELD_SCHEMAS, nav seeds, HTML extracts |
| `src/legacy/adapters/` | Thin adapters from prototype shapes → platform contracts |
| `public/legacy/` | Static QA pointers / copies of prototype assets |

Mass relocation of extracted JSON is deferred to avoid high-risk churn in this stage.

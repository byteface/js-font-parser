# Completeness Checklist

This project has broad coverage, but not every table and engine path is complete.
Use this checklist to keep progress measurable.

## 1) Table Parsing Coverage

- Run `npm run audit:tables`.
- Goal: `Missing from factory: 0`.
- If non-zero:
  - Decide per missing tag: `implement`, `intentionally unsupported`, or `defer`.
  - For deferred/unsupported tags, document rationale in `docs/WISHLIST.md`.

## 2) Behavioral Coverage

- Keep `tests/basic.test.mjs` and `tests/coverage-extra.test.mjs` green.
- For each new parser capability:
  - Add one happy-path test using a real fixture.
  - Add one unhappy-path test (truncated/invalid/missing table).

## 3) Rendering/Layout Fidelity

- Ensure each major path has a visual tool/demo:
  - GSUB/GPOS shaping
  - Kerning
  - Variable interpolation (gvar/CFF2)
  - Color fonts (COLR/CPAL/SVG)
  - Hinting preview (currently simulated)
- For high-risk changes, capture golden images before/after.

## 4) Known Not-Full Areas (as of now)

- Full TrueType hint VM execution (`fpgm`/`prep`/`cvt`/glyph instructions) is not implemented.
- Some OpenType/TrueType table tags in `Table.ts` are not yet wired in `TableFactory.ts`.

## 5) Definition of Done (for a “complete” subsystem)

- Table is parsed and exposed through public API.
- At least one real fixture exercises it.
- Invalid/truncated data handling is tested.
- A tool or demo can visualize/inspect it.
- Diagnostics are emitted for fallback/unsupported behavior.

# Wishlist

Prioritized by impact on parser correctness, release confidence, and npm usability.

## P0 (Do Next)

2. **Golden-image regression as a required gate**
   - Current status: required target set is now locked/validated and CI runs compare for visual-risk paths.
   - Do next:
     - Enable branch protection required status check: `Golden Images / visual-regression`.

## P1 (Important, After P0)

3. **TrueType hint VM execution (explicitly scoped)**
   - Keep this as a deliberate long-track item.
   - Scope clearly: `fpgm`/`prep`/glyph instruction execution goals, non-goals, and milestones.

## P2 (Nice-to-have / later)

4. **Docs tightening for release cadence**
   - Keep API + README + CLI docs aligned whenever behavior changes.
   - Add a short “release checklist” doc section for version bump, dry-run, and publish validation.

---

## Done Recently (Removed from active wishlist)

- **GPOS script sign-off**: canonical real-font expected-output fixtures are now locked for Latin (ligature+mark), Arabic (stacked marks and mixed mark stacks), Devanagari, Bengali, Hebrew, and Thai.
- **Table coverage closure**: `npm run audit:tables` now reports `Missing from factory: 0`.
- **NPM package metadata hardening**: `types`, `exports`, `repository`, `homepage`, `bugs`, license file, and dry-run publish checks are in place.
- **CI Node coverage expansion**: matrix now verifies Node `20.x`, `22.x`, and `24.x`.
- **Structured diagnostics cleanup**: remaining runtime parser console fallback logging removed from `FontParserTTF.load`.
- **WOFF2 runtime story (ship-ready)**: official browser decoder path documented (`wawoff2`), WOFF2 tool upgraded with local sample fixtures, and CI/docs smoke fixture path added (`truetypefonts/curated-extra/woff2/NotoSans-Regular-subset.woff2`).

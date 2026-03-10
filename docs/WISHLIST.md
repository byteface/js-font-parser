# Wishlist

Prioritized by impact on parser correctness, release confidence, and npm usability.

## P0 (Do Next)

1. **GPOS script sign-off**
   - Current status: broad paths work, but confidence still comes mainly from generic/fuzz coverage.
   - Do next:
     - Add explicit real-font expected outputs for tricky cases (mark+ligature+mark, stacked marks, mixed scripts).
     - Lock at least one canonical fixture per major script family used in demos/tools.

2. **Golden-image regression as a required gate**
   - Current status: golden workflow exists and runs, but should be treated as a hard release guard.
   - Do next:
     - Define required page set for visual lock.
     - Ensure CI/branch protection treats golden compare as a required check for high-risk visual/layout changes.

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

- **Table coverage closure**: `npm run audit:tables` now reports `Missing from factory: 0`.
- **NPM package metadata hardening**: `types`, `exports`, `repository`, `homepage`, `bugs`, license file, and dry-run publish checks are in place.
- **CI Node coverage expansion**: matrix now verifies Node `20.x`, `22.x`, and `24.x`.
- **Structured diagnostics cleanup**: remaining runtime parser console fallback logging removed from `FontParserTTF.load`.
- **WOFF2 runtime story (ship-ready)**: official browser decoder path documented (`wawoff2`), WOFF2 tool upgraded with local sample fixtures, and CI/docs smoke fixture path added (`truetypefonts/curated-extra/woff2/NotoSans-Regular-subset.woff2`).

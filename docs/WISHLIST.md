# Wishlist

1. **Golden-image tests**
   - Why still needed: harness exists, but baseline coverage is not yet enforced in CI and not all key demos/tools are locked.
   - Needed to close: define stable baseline set, run compare in CI, and gate regressions on changed targets.

2. **Full GPOS positioning across scripts**
   - Why still needed: major mark/base/mark/ligature paths are in, but script coverage confidence is still test-driven rather than sign-off complete.
   - Needed to close: expand real-font fixture matrix and add explicit expected outputs for complex mark+ligature combinations per script family.

3. **WOFF2 support (runtime packaging)**
   - Why still needed: parser + decoder hook exist, but decoder strategy is still external/injected.
   - Needed to close: publish a default decoder packaging approach (or official integration guide) and validate with real WOFF2 fixtures end-to-end.



Top next byte-cut steps, in order:

Move the remaining duplicated TTF/WOFF convenience layer into base

Big overlap still exists in FontParserTTF.ts and FontParserWOFF.ts: metadata (getFontNames/getOs2Metrics/getPostMetrics/getMetadata), color helpers, measureText/layoutToPoints, variation helpers.
Expected gain: ~4–10 KB minified.
Share the big getGlyph variation/composite logic between TTF and WOFF

This is still one of the largest duplicated blocks in both parser files.
Expected gain: ~3–8 KB minified.
Tighten webpack minification settings

Current config is minimal in webpack.config.cjs. Add explicit Terser options (compress.passes=2, pure_getters, module, toplevel where safe).
Expected gain: ~1–3 KB minified.
Remove dead compatibility/public aliases once tests are updated

Keep only one public path for GPOS/apply helpers if legacy direct calls are no longer required.
Expected gain: ~0.5–2 KB.
Clean tiny dead imports/legacy branches

Small wins (hundreds of bytes each), but worth doing after the big dedupe items.
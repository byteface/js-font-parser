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


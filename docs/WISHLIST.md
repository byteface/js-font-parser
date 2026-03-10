# Wishlist

Only active, unresolved work is listed here.

## P0

1. **Make golden-image regression a required GitHub gate**
   - Repo status: target validation and compare workflow are in place.
   - Remaining work: enable branch protection required status check for `Golden Images / visual-regression`.
   - Why it matters: this is the last step from "we capture diffs" to "visual regressions can block merges".

## P1

2. **Publish a support and limitations matrix**
   - Add one short doc section covering:
     - supported runtimes and browser class
     - format support (`TTF`, `OTF/CFF`, `WOFF`, `WOFF2`)
     - shaping confidence by script family
     - current non-goals such as hinting/raster parity with native text engines
   - Why it matters: the project is now stronger than its support story. Users still need a clear statement of what is solid, partial, or intentionally out of scope.

3. **Add a release checklist**
   - Cover version bump, build/test/golden checks, `npm pack`/dry-run validation, and publish sanity checks.
   - Why it matters: packaging is much healthier now, but release confidence still depends too much on memory.

## P2

4. **TrueType hint VM execution**
   - Keep this explicitly scoped as long-track work.
   - Add opcode milestone checklist:
     - `M1`: stack/math/control-flow completeness.
     - `M2`: vector/round/projection/freedom state parity.
     - `M3`: zone/twilight/reference semantics parity.
     - `M4`: delta and interpolation edge cases.
     - `M5`: final validation on real VM-active fixtures.
   - Why it matters: this is a real capability gap, but not the next thing to do before release/sign-off clarity.

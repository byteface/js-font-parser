# Wishlist

1. **Make golden-image regression a required GitHub gate**
   - Repo status: target validation and compare workflow are in place.
   - Remaining work: enable branch protection required status check for `Golden Images / visual-regression`.
   - Why it matters: this is the last step from "we capture diffs" to "visual regressions can block merges".

## Tech Debt Register

1. **Split `BaseFontParser` into focused components**
   - Current state: `src/data/BaseFontParser.ts` is carrying table wiring, glyph construction, layout bridging, diagnostics, and variation logic in one class.
   - Risk: high regression surface and slow iteration when adding parser features.
   - Suggested direction: extract table access, glyph building, and layout/positioning helpers into separate modules with narrower interfaces.

2. **Reduce `any` usage across parser and shaping layers**
   - Current state: parser/table boundaries still rely heavily on `any` and runtime duck-typing, especially in `src/data/BaseFontParser.ts`, `src/data/ParserApiShared.ts`, and `src/table/GsubTable.ts`.
   - Risk: type checks miss real integration errors, and refactors become harder to trust.
   - Suggested direction: introduce small shared interfaces for cmap/glyph/GSUB/GPOS collaborators and ratchet stricter linting over time.

3. **Make `npm test` self-contained**
   - Current state: tests import `dist/...` and fail immediately if the package has not been built first.
   - Risk: fragile local workflow and less reliable CI/test ergonomics.
   - Suggested direction: either build automatically before test runs or align tests to a single supported execution path.

4. **Separate GSUB parsing from GSUB application**
   - Current state: `src/table/GsubTable.ts` mixes table parsing, feature resolution, caching, and runtime substitution behavior.
   - Risk: shaping changes are harder to reason about and validate.
   - Suggested direction: keep the table model focused on parsed data and move substitution/application logic into a dedicated runtime layer.

5. **Modernize `ByteArray` incrementally without breaking semantics**
   - Current state: `src/utils/ByteArray.ts` is used widely, and some methods mix explicit offsets with cursor mutation.
   - Risk: ambiguous call semantics make optimization and parser cleanup harder, but a rewrite now would have high blast radius.
   - Suggested direction: add explicit `read*` versus `peek*At` APIs alongside the current methods, migrate hot paths gradually, and benchmark before wider changes.


6. - refactor to create a 'light' version without the hinting VM, GSUB shaping or colors etc


## Coverage Gaps

- Bitmap color font tables
  - You already identified this one: `CBDT`/`CBLC`, `sbix`.
  - You do have constants for `EBDT`/`EBLC`/`EBSC` in `Table.ts`, but no parser classes for them.

- Many other SFNT/OpenType tables are not implemented
  - Examples visible in `Table.ts` but not backed by parser classes: `BASE`, `JSTF`, `DSIG`, `LTSH`, `PCLT`, `VDMX`, `gasp`, `hdmx`, `vhea`, `vmtx`.

- Variable-font support is not full
  - You have `fvar` and `gvar`, but not the broader variation ecosystem like `avar`, `HVAR`, `VVAR`, `MVAR`, `STAT`.
  - At least, there are no parser classes for those in `src/table`.

- Layout parsing is partial, not total
  - You support a useful chunk of GSUB/GPOS, but not every lookup/table variation in the spec.
  - From the files present, GSUB/GPOS support is selective, not exhaustive.

- Bitmap/color rendering support is also incomplete
  - Even when a font loads and maps glyph IDs, that does not mean the actual embedded image/color payload is parsed and rendered.

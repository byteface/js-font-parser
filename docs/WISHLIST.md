# Wishlist

1. **Make golden-image regression a required GitHub gate**
   - Repo status: target validation and compare workflow are in place.
   - Remaining work: enable branch protection required status check for `Golden Images / visual-regression`.
   - Why it matters: this is the last step from "we capture diffs" to "visual regressions can block merges".




bitmap color font tables
You already identified this one:
CBDT/CBLC, sbix
You do have constants for EBDT/EBLC/EBSC in Table.ts, but no parser classes for them.

many other SFNT/OpenType tables are not implemented
Examples visible in Table.ts but not backed by parser classes:
BASE, JSTF, DSIG, LTSH, PCLT, VDMX, gasp, hdmx, vhea, vmtx

variable-font support is not full
You have fvar and gvar, but not the broader variation ecosystem like:
avar, HVAR, VVAR, MVAR, STAT
At least, there are no parser classes for those in src/table.

layout parsing is partial, not total
You support a useful chunk of GSUB/GPOS, but not every lookup/table variation in the spec.
From the files present, GSUB/GPOS support is selective, not exhaustive.

bitmap/color rendering support is also incomplete
Even when a font loads and maps glyph IDs, that does not mean the actual embedded image/color payload is parsed and rendered.
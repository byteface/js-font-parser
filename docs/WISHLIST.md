# Wishlist

## P0 — Core parser completeness (do first)
1. **Table coverage closure** — resolve the current missing table tags from factory wiring:
   `BASE`, `DSIG`, `EBDT`, `EBLC`, `EBSC`, `JSTF`, `LTSH`, `MMFX`, `MMSD`, `PCLT`, `VDMX`, `gasp`, `hdmx`, `prep`, `vhea`, `vmtx`.
2. **WOFF2 support** — decode Brotli-compressed tables with a stable decoder/runtime packaging strategy.
3. **Golden-image tests** — add rendering regression tests for key demos/tools to catch visual breakage early.

## P1 — Text shaping and layout fidelity
1. **Full GPOS positioning across scripts** — broaden real-font validation sweep for complex script/mark/ligature combinations.
2. **Structured diagnostics expansion** — continue surfacing fallback/unsupported paths as structured warnings instead of console-only signals.
3. **Direction/script validation sweep** — verify `layoutStringAuto` and script detection against multilingual fixtures.

## P2 — Hinting and outline quality
1. **TrueType hinting engine (VM)** — execute `fpgm`/`prep`/glyph bytecode + `cvt` for spec-accurate grid fitting.
2. **Hinted vs unhinted visual diff (real)** — upgrade current simulated auto-hint preview to true VM-backed hint diff.
3. **Glyph path simplifier** — reduce point counts while preserving visible shape for optimization workflows.

## P3 — Tooling and demo UX
1. **Tools shared-lib cleanup** — continue moving duplicated tool logic into shared modules.
2. **Inline docs / cleanup pass** — improve API/docs clarity and code readability around parser/layout hot paths.

## Maintenance
1. **Node version policy** — standardize on LTS (`22.x` preferred, `20.x` acceptable) via `.nvmrc` + `package.json` engines.

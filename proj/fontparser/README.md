# fontparser CLI (prototype)

Early CLI for inspection, SVG export, localization/subsetting, and sfnt/WOFF conversion.

## Usage

```bash
cd /Users/byteface/Desktop/projects/js-font-parser
npm run build:dist

# coverage
node proj/fontparser/index.mjs coverage --font truetypefonts/DiscoMo.ttf
node proj/fontparser/index.mjs coverage --font truetypefonts/DiscoMo.ttf --supported --min-coverage 80
node proj/fontparser/index.mjs coverage --font truetypefonts/DiscoMo.ttf --missing --lang hu
node proj/fontparser/index.mjs coverage --font truetypefonts/DiscoMo.ttf --missing --lang hu --json
node proj/fontparser/index.mjs coverage --list-languages

# inspect
node proj/fontparser/index.mjs inspect --font truetypefonts/DiscoMo.ttf
node proj/fontparser/index.mjs inspect --font truetypefonts/DiscoMo.ttf --min-coverage 95 --kerning-chars "AVWToY.,tafy" --kerning-limit 12

# svg
node proj/fontparser/index.mjs svg --font truetypefonts/GothamNarrow-Ultra.otf --text "AVATAR\nType test" --font-size 84 --fill "#111" --bg "#f8f8f8" --padding 20 --line-height 1.25 --use-kerning true --out /tmp/type-test.svg

# localise
node proj/fontparser/index.mjs localise --font truetypefonts/DiscoMo.ttf --lang es --out /tmp/DiscoMo-es.ttf

# subset
node proj/fontparser/index.mjs subset --font truetypefonts/noto/NotoSans-Regular.ttf --lang en,es --out /tmp/NotoSans-en-es-subset.ttf
node proj/fontparser/index.mjs subset --font truetypefonts/noto/NotoSans-Regular.ttf --chars "AVWToY.,tafy123" --file /tmp/custom_chars.txt --out /tmp/NotoSans-custom-subset.ttf

# convert
node proj/fontparser/index.mjs convert --font truetypefonts/noto/NotoSans-Regular.ttf --to woff --out /tmp/NotoSans-Regular.woff
node proj/fontparser/index.mjs convert --font /tmp/NotoSans-Regular.woff --to sfnt --out /tmp/NotoSans-Regular.roundtrip.ttf
node proj/fontparser/index.mjs convert --font truetypefonts/curated/SourceSerif4-Regular.otf --to woff --out /tmp/SourceSerif4-Regular.woff
node proj/fontparser/index.mjs convert --font /tmp/SourceSerif4-Regular.woff --to otf --out /tmp/SourceSerif4-Regular.roundtrip.otf

# machine-readable output
node proj/fontparser/index.mjs inspect --font truetypefonts/DiscoMo.ttf --json
node proj/fontparser/index.mjs coverage --font truetypefonts/DiscoMo.ttf --supported --min-coverage 90 --json
```

## Commands

- `coverage`
  - Default: full language coverage table
  - `--supported`: only languages meeting threshold (`--min-coverage`, default `100`)
  - `--missing --lang <code>`: missing chars for one language
  - `--list-languages`: print available language codes
  - `--json`: JSON output for coverage/supported/missing modes

- `inspect`
  - Consolidated report: metadata, glyph stats, table list, supported languages, kerning sample stats
  - Options: `--min-coverage`, `--kerning-chars`, `--kerning-limit`

- `svg`
  - Generate SVG text paths; stdout by default or `--out <file>`
  - Options: `--font-size`, `--fill`, `--stroke`, `--stroke-width`, `--padding`, `--line-height`, `--letter-spacing`, `--use-kerning`, `--bg`

- `localise`
  - Writes localized font variant and optional composition sidecar report
  - Options: `--lang <code>`, `--out <file>`

- `subset`
  - Writes subset TTF and sidecar report JSON
  - Sources can be combined: `--chars`, `--file`, `--lang`
  - Options: `--out <file>`, `--report <file>`

- `convert`
  - `--to woff`: TTF/OTF sfnt -> WOFF
  - `--to sfnt|ttf|otf`: WOFF -> sfnt output
  - Option: `--out <file>`

## Conversion Matrix

| Input | `--to` | Status | Notes |
|---|---|---|---|
| `ttf` | `woff` | supported | Wraps sfnt tables into WOFF 1.0 |
| `otf` | `woff` | supported | Wraps OTTO/CFF sfnt tables into WOFF 1.0 |
| `woff` (ttf payload) | `sfnt` | supported | Decodes to sfnt bytes; extension defaults to `.ttf` |
| `woff` (otf payload) | `sfnt` | supported | Decodes to sfnt bytes; extension defaults to `.otf` |
| `woff` (ttf payload) | `ttf` | supported | Validates payload flavor is TrueType |
| `woff` (otf payload) | `otf` | supported | Validates payload flavor is OTTO/CFF |
| `woff` (otf payload) | `ttf` | rejected | Use `--to otf` or `--to sfnt` |
| `woff` (ttf payload) | `otf` | rejected | Use `--to ttf` or `--to sfnt` |
| `woff2` | any | unsupported | CLI convert currently supports WOFF 1.0 only |

Important:
- The CLI does not transcode outlines between TrueType and CFF.
- `convert` is a container/table transformation path (`sfnt <-> woff`), not a glyph model conversion path.
- For `--to sfnt`, if your explicit `--out` extension mismatches decoded flavor, the CLI emits a warning.

## JSON Output Contract

All commands support `--json` with a consistent envelope:

- Success:

```json
{
  "ok": true,
  "command": "<subcommand>",
  "data": { }
}
```

- Error:

```json
{
  "ok": false,
  "command": "<subcommand-or-null>",
  "error": {
    "code": "E_USAGE|E_INPUT|E_IO|E_COMMAND|E_INTERNAL",
    "message": "human readable message"
  }
}
```

## Exit Codes

- `0`: success
- `2`: usage/argument error (`E_USAGE`)
- `3`: input validation error (`E_INPUT`)
- `4`: IO/file error (`E_IO`)
- `5`: command execution error (`E_COMMAND`)
- `10`: unexpected internal failure (`E_INTERNAL`)

## Limitations

- Composition currently targets BMP characters only (cmap format 4 rebuild).
- Subset currently targets BMP `cmap` output (format 4) and glyf/loca-based TTF fonts.
- CFF/CFF2 fonts are not supported for writing yet.
- Some marks may be missing in the source font; those composites will be skipped.
- WOFF conversion currently targets WOFF 1.0 only (`sfnt <-> woff`), not WOFF2.

## Fallback Rules (Current)

- Acute/grave/etc: fallback to `"."`, `"'"`, ``"`"``, `"^"`, `"~"` when marks are missing.
- Cedilla/ogonek: fallback to comma/dot below.
- Breve: fallback to `"v"` when missing.
- Stroke/overlay (`ł/Ł`): fallback to `"-"` or `"—"` and rotate `-12°` for a slanted bar.
- Dotless `ı`: prefer removing the dot if the `i` glyph is composite; otherwise fallback maps to `l`.

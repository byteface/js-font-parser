# fontparser CLI (prototype)

This is an early CLI for inspecting language coverage and writing a modified font file.

## Usage

```bash
cd /Users/byteface/Desktop/projects/js-font-parser
npm run build:dist
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --coverage
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --supported-languages
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --supported-languages --min-coverage 80
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --supported-languages-json --min-coverage 95
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --missing-chars --lang hu
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --missing-chars --lang hu --json
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --meta
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --meta-json
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --list-languages
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --tables
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --glyph-stats
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --kerning-stats --kerning-chars "AVWToY.,tafy" --kerning-limit 12
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --overview
node proj/fontparser/index.mjs --font truetypefonts/GothamNarrow-Ultra.otf --svg-text "AVATAR\nType test" --svg-font-size 84 --svg-fill "#111" --svg-bg "#f8f8f8" --svg-padding 20 --svg-line-height 1.25 --svg-use-kerning true --svg-out /tmp/type-test.svg
node proj/fontparser/index.mjs --font truetypefonts/DiscoMo.ttf --localise es --out /tmp/DiscoMo-es.ttf
node proj/fontparser/index.mjs --font truetypefonts/noto/NotoSans-Regular.ttf --subset --subset-lang en,es --out /tmp/NotoSans-en-es-subset.ttf
node proj/fontparser/index.mjs --font truetypefonts/noto/NotoSans-Regular.ttf --subset --subset-chars "AVWToY.,tafy123" --subset-file /tmp/custom_chars.txt --out /tmp/NotoSans-custom-subset.ttf
```

## Notes
- `--coverage` prints language coverage based on required character sets.
- `--supported-languages` prints only languages that meet `--min-coverage` (default `100`).
- `--supported-languages-json` emits the same filtered list in JSON.
- `--missing-chars --lang <code>` prints only missing required chars for one language.
- Add `--json` to emit missing-char output as JSON.
- `--meta` prints a concise metadata summary (name/style/OS2/post fields).
- `--meta-json` prints full metadata JSON.
- `--list-languages` prints available language codes for `--localise` and `--subset-lang`.
- `--tables` prints table tag/offset/length/checksum; `--tables-json` prints JSON.
- `--glyph-stats` prints simple/composite/empty counts; `--glyph-stats-json` prints JSON.
- `--kerning-stats` samples pair kerning over a character set; `--kerning-stats-json` prints JSON.
- Tune kerning sampling with `--kerning-chars` and `--kerning-limit`.
- `--overview` prints a consolidated report: metadata, glyph stats, table list, filtered supported languages, and kerning sample stats.
- `--svg-text` generates SVG text paths directly from a font and prints to stdout unless `--svg-out` is provided.
- SVG tuning flags: `--svg-font-size`, `--svg-fill`, `--svg-stroke`, `--svg-stroke-width`, `--svg-padding`, `--svg-line-height`, `--svg-letter-spacing`, `--svg-use-kerning`, `--svg-bg`.
- `--localise` writes a new font and attempts to compose missing Latin glyphs using base + combining marks.
- `--subset` writes a TTF subset by keeping only requested characters (plus required composite dependencies), and writes a sidecar report JSON.
- Subset character sources can be combined: `--subset-chars`, `--subset-file`, `--subset-lang`.
- Use `--subset-report <path>` to override the default report path (`<out>.report.json`).
- If combining marks are missing, it will try simple fallback punctuation (e.g. dot/comma) for proof-of-concept.
- When composition happens, a sidecar report is written to `<output>.report.json` listing how each glyph was generated.

## Limitations
- Composition currently targets BMP characters only (cmap format 4 rebuild).
- Subset currently targets BMP `cmap` output (format 4) and glyf/loca-based TTF fonts.
- CFF/CFF2 fonts are not supported for writing yet.
- Some marks may be missing in the source font; those composites will be skipped.

## Fallback Rules (Current)
- Acute/grave/etc: fallback to `"."`, `"'"`, ``"` ``, `"^"`, `"~"` when marks are missing.
- Cedilla/ogonek: fallback to comma/dot below.
- Breve: fallback to `"v"` when missing.
- Stroke/overlay (`ł/Ł`): fallback to `"-"` or `"—"` and **rotate -12°** for a slanted bar.
- Dotless `ı`: prefer removing the dot if the `i` glyph is composite; otherwise fallback maps to `l`.

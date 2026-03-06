export function parseArgs(argv = process.argv.slice(2)) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = val;
    }
  }
  return out;
}

export function parseBoolean(value, defaultValue = false) {
  if (value == null) return defaultValue;
  if (typeof value === "boolean") return value;
  const s = String(value).trim().toLowerCase();
  if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
  if (s === "0" || s === "false" || s === "no" || s === "off") return false;
  return defaultValue;
}

export function usageLines() {
  return [
    "fontparser --font path.ttf [--coverage] [--supported-languages] [--min-coverage 100] [--supported-languages-json] [--meta|--meta-json] [--list-languages]",
    "fontparser --font path.ttf --missing-chars --lang <code> [--json]",
    "fontparser --font path.ttf [--tables|--tables-json] [--glyph-stats|--glyph-stats-json]",
    "fontparser --font path.ttf [--kerning-stats|--kerning-stats-json] [--kerning-chars \"AVTo\"] [--kerning-limit 20]",
    "fontparser --font path.ttf --overview [--min-coverage 90] [--kerning-chars \"AVTo\"] [--kerning-limit 10]",
    "fontparser --font path.ttf --svg-text \"Hello\" [--svg-out out.svg] [--svg-font-size 96] [--svg-fill '#111'] [--svg-stroke none] [--svg-stroke-width 0] [--svg-padding 24] [--svg-line-height 1.2] [--svg-letter-spacing 0] [--svg-use-kerning true] [--svg-bg '#fff']",
    "fontparser --font path.ttf --localise <code> [--out output.ttf]",
    "fontparser --font path.ttf --subset [--subset-chars <text>] [--subset-file <txt>] [--subset-lang <code[,code]>] [--out output.ttf] [--subset-report report.json]"
  ];
}

export function printUsage() {
  usageLines().forEach(line => console.log(line));
}

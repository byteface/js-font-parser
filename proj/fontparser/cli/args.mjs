export function parseArgs(argv = process.argv.slice(2)) {
  const out = { command: null, args: {} };
  if (!Array.isArray(argv) || argv.length === 0) {
    return out;
  }

  const first = String(argv[0] || "");
  if (first === "-h" || first === "--help" || first === "help") {
    out.command = "help";
    return out;
  }

  out.command = first.toLowerCase();
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    out.args[key] = val;
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
    "fontparser coverage --font path.ttf [--supported] [--missing --lang <code>] [--min-coverage 100] [--json] [--list-languages] [--woff2-decoder <module-or-path>]",
    "fontparser inspect --font path.ttf [--min-coverage 90] [--kerning-chars \"AVTo\"] [--kerning-limit 10] [--woff2-decoder <module-or-path>]",
    "fontparser svg --font path.ttf --text \"Hello\" [--out out.svg] [--font-size 96] [--fill '#111'] [--stroke none] [--stroke-width 0] [--padding 24] [--line-height 1.2] [--letter-spacing 0] [--use-kerning true] [--bg '#fff'] [--woff2-decoder <module-or-path>]",
    "fontparser subset --font path.ttf [--chars <text>] [--file <txt>] [--lang <code[,code]>] [--out output.ttf] [--report report.json] [--woff2-decoder <module-or-path>]",
    "fontparser convert --font input.ttf --to woff [--out output.woff]",
    "fontparser convert --font input.woff --to sfnt|ttf|otf [--out output.ttf|output.otf]",
    "fontparser localise --font path.ttf --lang <code> [--out output.ttf] [--woff2-decoder <module-or-path>]"
  ];
}

export function printUsage() {
  usageLines().forEach(line => console.log(line));
}

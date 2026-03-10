import { getSupportedLanguages, listLanguages, supportsLanguage } from "../../../dist/utils/LanguageSupport.js";

export function getCoverageRows(font) {
  return getSupportedLanguages(font);
}

export function getSupportedRows(font, minCoverage = 1) {
  return getSupportedLanguages(font).filter(r => r.coverage >= minCoverage);
}

export function getMissingCharsPayload(font, langCode) {
  const info = supportsLanguage(font, langCode);
  if (!info) {
    throw new Error(`Unknown language code: ${langCode}`);
  }
  return {
    code: info.code,
    name: info.name,
    coverage: info.coverage,
    missingCount: info.missing.length,
    missing: info.missing
  };
}

export function getLanguages() {
  return listLanguages();
}

export function printCoverage(font, asJson = false) {
  const rows = getCoverageRows(font);
  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  rows.forEach(r => {
    const pct = Math.round(r.coverage * 100);
    const status = r.supported ? "yes" : "no";
    const missing = r.missing.slice(0, 12).join("");
    console.log(`${r.code.padEnd(4)} ${r.name.padEnd(24)} ${status.padEnd(4)} ${String(pct).padStart(3)}%  ${missing}`);
  });
}

export function printSupportedLanguages(font, minCoverage = 1, asJson = false) {
  const rows = getSupportedRows(font, minCoverage);
  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (rows.length === 0) {
    console.log("No languages met the requested coverage threshold.");
    return;
  }
  rows.forEach(r => {
    const pct = Math.round(r.coverage * 100);
    const missingCount = r.missing.length;
    console.log(`${r.code.padEnd(4)} ${r.name.padEnd(24)} ${String(pct).padStart(3)}%  missing:${String(missingCount).padStart(3)}${r.notes ? `  ${r.notes}` : ""}`);
  });
}

export function printMissingChars(font, langCode, asJson = false) {
  const payload = getMissingCharsPayload(font, langCode);
  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const pct = Math.round(payload.coverage * 100);
  console.log(`${payload.code} ${payload.name} coverage: ${pct}%`);
  if (payload.missing.length === 0) {
    console.log("Missing chars: (none)");
    return;
  }
  console.log(`Missing chars (${payload.missing.length}): ${payload.missing.join(" ")}`);
}

export function printLanguages() {
  const rows = getLanguages();
  rows.forEach(r => {
    console.log(`${r.code.padEnd(4)} ${r.name}${r.notes ? ` (${r.notes})` : ""}`);
  });
}

export function absoluteUrl(baseUrl, maybeRelativeUrl) {
  try {
    return new URL(maybeRelativeUrl, baseUrl).toString();
  } catch {
    return maybeRelativeUrl;
  }
}

export function detectFontMagic(bytes) {
  if (!bytes || bytes.length < 4) return "unknown";
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];
  const tag = String.fromCharCode(b0, b1, b2, b3);
  if (tag === "wOFF") return "woff";
  if (tag === "wOF2") return "woff2";
  if (tag === "OTTO") return "otf";
  if (tag === "true") return "ttf";
  if (b0 === 0x00 && b1 === 0x01 && b2 === 0x00 && b3 === 0x00) return "ttf";
  if (b0 === 0x3c && (b1 === 0x21 || b1 === 0x68 || b1 === 0x3f)) return "html";
  return "unknown";
}

export function pickBestFontUrlFromCss(cssText, cssUrl) {
  const matches = Array.from(cssText.matchAll(/url\(([^)]+)\)/gi))
    .map((m) => m[1].trim().replace(/^['"]|['"]$/g, ""))
    .filter((u) => !u.startsWith("data:"));
  if (matches.length === 0) return null;
  const abs = matches.map((u) => absoluteUrl(cssUrl, u));
  const score = (u) => {
    const value = u.toLowerCase();
    if (value.endsWith(".woff")) return 5;
    if (value.endsWith(".ttf")) return 4;
    if (value.endsWith(".otf")) return 3;
    if (value.endsWith(".woff2")) return 2;
    return 1;
  };
  abs.sort((a, b) => score(b) - score(a));
  return abs[0] || null;
}

export async function fetchArrayBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.arrayBuffer();
}

export async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.text();
}

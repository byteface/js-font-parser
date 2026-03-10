import { Table } from "../../../dist/table/Table.js";

export function getMetadataSummary(font) {
  const meta = font.getMetadata?.() ?? null;
  if (!meta) return null;

  return {
    raw: meta,
    summary: {
      family: meta.names?.family ?? "",
      subfamily: meta.names?.subfamily ?? "",
      fullName: meta.names?.fullName ?? "",
      postScriptName: meta.names?.postScriptName ?? "",
      version: meta.names?.version ?? "",
      vendorId: meta.os2?.vendorId ?? "",
      unitsPerEm: font.getTableByType(Table.head)?.unitsPerEm ?? null,
      glyphs: font.getTableByType(Table.maxp)?.numGlyphs ?? null,
      weightClass: meta.style?.weightClass ?? null,
      widthClass: meta.style?.widthClass ?? null,
      italicAngle: meta.post?.italicAngle ?? null,
      isBold: !!meta.style?.isBold,
      isItalic: !!meta.style?.isItalic,
      isMonospace: !!meta.style?.isMonospace,
      fsTypeFlags: meta.style?.fsTypeFlags ?? [],
      fsSelectionFlags: meta.style?.fsSelectionFlags ?? []
    }
  };
}

export function printMetadata(font, asJson = false) {
  const payload = getMetadataSummary(font);
  if (!payload) {
    console.log("No metadata available.");
    return;
  }
  if (asJson) {
    console.log(JSON.stringify(payload.raw, null, 2));
    return;
  }

  const s = payload.summary;

  console.log("Font metadata");
  console.log(`  family: ${s.family}`);
  console.log(`  subfamily: ${s.subfamily}`);
  console.log(`  fullName: ${s.fullName}`);
  console.log(`  postScriptName: ${s.postScriptName}`);
  console.log(`  version: ${s.version}`);
  console.log(`  vendorId: ${s.vendorId}`);
  console.log(`  unitsPerEm: ${s.unitsPerEm ?? ""}`);
  console.log(`  glyphs: ${s.glyphs ?? ""}`);
  console.log(`  weightClass: ${s.weightClass ?? ""}`);
  console.log(`  widthClass: ${s.widthClass ?? ""}`);
  console.log(`  italicAngle: ${s.italicAngle ?? ""}`);
  console.log(`  isBold/isItalic/isMonospace: ${s.isBold}/${s.isItalic}/${s.isMonospace}`);
  console.log(`  fsTypeFlags: ${s.fsTypeFlags.join(", ") || "(none)"}`);
  console.log(`  fsSelectionFlags: ${s.fsSelectionFlags.join(", ") || "(none)"}`);
}

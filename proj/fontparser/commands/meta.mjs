import { Table } from "../../../dist/table/Table.js";

export function printMetadata(font, asJson = false) {
  const meta = font.getMetadata?.() ?? null;
  if (!meta) {
    console.log("No metadata available.");
    return;
  }
  if (asJson) {
    console.log(JSON.stringify(meta, null, 2));
    return;
  }

  const names = meta.names ?? {};
  const os2 = meta.os2 ?? {};
  const post = meta.post ?? {};
  const style = meta.style ?? {};

  console.log("Font metadata");
  console.log(`  family: ${names.family ?? ""}`);
  console.log(`  subfamily: ${names.subfamily ?? ""}`);
  console.log(`  fullName: ${names.fullName ?? ""}`);
  console.log(`  postScriptName: ${names.postScriptName ?? ""}`);
  console.log(`  version: ${names.version ?? ""}`);
  console.log(`  vendorId: ${os2.vendorId ?? ""}`);
  console.log(`  unitsPerEm: ${font.getTableByType(Table.head)?.unitsPerEm ?? ""}`);
  console.log(`  glyphs: ${font.getTableByType(Table.maxp)?.numGlyphs ?? ""}`);
  console.log(`  weightClass: ${style.weightClass ?? ""}`);
  console.log(`  widthClass: ${style.widthClass ?? ""}`);
  console.log(`  italicAngle: ${post.italicAngle ?? ""}`);
  console.log(`  isBold/isItalic/isMonospace: ${!!style.isBold}/${!!style.isItalic}/${!!style.isMonospace}`);
  console.log(`  fsTypeFlags: ${(style.fsTypeFlags ?? []).join(", ") || "(none)"}`);
  console.log(`  fsSelectionFlags: ${(style.fsSelectionFlags ?? []).join(", ") || "(none)"}`);
}

import path from "node:path";
import zlib from "node:zlib";

const TAG_WOFF = 0x774f4646;
const FLAVOR_OTTO = 0x4f54544f;

function align4(n) {
  return (n + 3) & ~3;
}

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function parseSfnt(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("sfnt input must be a Buffer.");
  }
  if (buffer.length < 12) {
    throw new Error("Invalid sfnt input: too short.");
  }
  const flavor = buffer.readUInt32BE(0);
  const numTables = buffer.readUInt16BE(4);
  const dirEnd = 12 + numTables * 16;
  if (dirEnd > buffer.length) {
    throw new Error("Invalid sfnt input: table directory exceeds buffer length.");
  }
  const entries = [];
  for (let i = 0; i < numTables; i++) {
    const p = 12 + i * 16;
    const tag = buffer.readUInt32BE(p);
    const checksum = buffer.readUInt32BE(p + 4);
    const offset = buffer.readUInt32BE(p + 8);
    const length = buffer.readUInt32BE(p + 12);
    if (offset + length > buffer.length) {
      throw new Error("Invalid sfnt input: table offset/length out of bounds.");
    }
    entries.push({ tag, checksum, offset, length });
  }
  return { flavor, numTables, entries };
}

function parseWoff(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("WOFF input must be a Buffer.");
  }
  if (buffer.length < 44) {
    throw new Error("Invalid WOFF input: too short.");
  }
  const signature = buffer.readUInt32BE(0);
  if (signature !== TAG_WOFF) {
    throw new Error("Input is not a WOFF file.");
  }
  const flavor = buffer.readUInt32BE(4);
  const length = buffer.readUInt32BE(8);
  const numTables = buffer.readUInt16BE(12);
  const totalSfntSize = buffer.readUInt32BE(16);
  if (length > buffer.length) {
    throw new Error("Invalid WOFF header: declared length exceeds available bytes.");
  }
  const entries = [];
  const dirEnd = 44 + numTables * 20;
  if (dirEnd > buffer.length) {
    throw new Error("Invalid WOFF header: table directory exceeds available bytes.");
  }
  for (let i = 0; i < numTables; i++) {
    const p = 44 + i * 20;
    const tag = buffer.readUInt32BE(p);
    const offset = buffer.readUInt32BE(p + 4);
    const compLength = buffer.readUInt32BE(p + 8);
    const origLength = buffer.readUInt32BE(p + 12);
    const checksum = buffer.readUInt32BE(p + 16);
    if (offset + compLength > buffer.length) {
      throw new Error("Invalid WOFF table entry: offset/length out of bounds.");
    }
    entries.push({ tag, offset, compLength, origLength, checksum });
  }
  return { flavor, numTables, totalSfntSize, entries };
}

function calcSfntSearch(numTables) {
  const maxPower = 2 ** Math.floor(Math.log2(Math.max(1, numTables)));
  const searchRange = maxPower * 16;
  const entrySelector = Math.floor(Math.log2(maxPower));
  const rangeShift = numTables * 16 - searchRange;
  return { searchRange, entrySelector, rangeShift };
}

export function convertSfntToWoff(buffer) {
  const { flavor, numTables, entries } = parseSfnt(buffer);
  const compressedEntries = [];
  let dataOffset = 44 + numTables * 20;
  for (const entry of entries) {
    const raw = buffer.subarray(entry.offset, entry.offset + entry.length);
    const deflated = zlib.deflateSync(raw, { level: 9 });
    const useCompressed = deflated.length < raw.length;
    const data = useCompressed ? deflated : raw;
    dataOffset = align4(dataOffset);
    compressedEntries.push({
      tag: entry.tag,
      checksum: entry.checksum,
      origLength: raw.length,
      compLength: data.length,
      offset: dataOffset,
      data
    });
    dataOffset += data.length;
  }

  const outLength = align4(dataOffset);
  const out = Buffer.alloc(outLength);
  out.writeUInt32BE(TAG_WOFF, 0);
  out.writeUInt32BE(flavor, 4);
  out.writeUInt32BE(outLength, 8);
  out.writeUInt16BE(numTables, 12);
  out.writeUInt16BE(0, 14); // reserved
  out.writeUInt32BE(buffer.length, 16); // totalSfntSize
  out.writeUInt16BE(1, 20); // majorVersion (best-effort)
  out.writeUInt16BE(0, 22); // minorVersion
  out.writeUInt32BE(0, 24); // metaOffset
  out.writeUInt32BE(0, 28); // metaLength
  out.writeUInt32BE(0, 32); // metaOrigLength
  out.writeUInt32BE(0, 36); // privOffset
  out.writeUInt32BE(0, 40); // privLength

  compressedEntries.forEach((r, i) => {
    const p = 44 + i * 20;
    out.writeUInt32BE(r.tag, p);
    out.writeUInt32BE(r.offset, p + 4);
    out.writeUInt32BE(r.compLength, p + 8);
    out.writeUInt32BE(r.origLength, p + 12);
    out.writeUInt32BE(r.checksum, p + 16);
    r.data.copy(out, r.offset);
  });

  return out;
}

export function convertWoffToSfnt(buffer) {
  const { flavor, numTables, totalSfntSize, entries } = parseWoff(buffer);
  const sorted = [...entries].sort((a, b) => a.tag - b.tag);
  const { searchRange, entrySelector, rangeShift } = calcSfntSearch(numTables);

  let dataOffset = 12 + numTables * 16;
  const out = Buffer.alloc(Math.max(totalSfntSize, dataOffset));
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(rangeShift, 10);

  sorted.forEach((entry, i) => {
    dataOffset = align4(dataOffset);
    const raw = buffer.subarray(entry.offset, entry.offset + entry.compLength);
    const decoded = entry.compLength < entry.origLength ? zlib.inflateSync(raw) : raw;
    if (decoded.length < entry.origLength) {
      throw new Error("Invalid WOFF table entry: decompressed data shorter than origLength.");
    }
    const needed = dataOffset + entry.origLength;
    if (needed > out.length) {
      throw new Error("Invalid WOFF header: table data exceeds declared sfnt size.");
    }
    decoded.copy(out, dataOffset, 0, entry.origLength);

    const p = 12 + i * 16;
    out.writeUInt32BE(entry.tag, p);
    out.writeUInt32BE(entry.checksum, p + 4);
    out.writeUInt32BE(dataOffset, p + 8);
    out.writeUInt32BE(entry.origLength, p + 12);
    dataOffset += entry.origLength;
  });

  return out.subarray(0, align4(dataOffset));
}

export function defaultSfntExtension(sfntBuffer) {
  const flavor = sfntBuffer.readUInt32BE(0);
  return flavor === FLAVOR_OTTO ? ".otf" : ".ttf";
}

export function resolveConvertOutPath(inputPath, format, outPath, sfntBuffer = null) {
  if (outPath) return path.resolve(process.cwd(), String(outPath));
  const ext = format === "woff"
    ? ".woff"
    : (format === "otf" ? ".otf" : (format === "ttf" ? ".ttf" : defaultSfntExtension(sfntBuffer)));
  const base = path.basename(inputPath, path.extname(inputPath));
  return path.resolve(process.cwd(), `${base}${ext}`);
}

export function detectInputType(buffer) {
  if (!buffer || buffer.length < 4) return "unknown";
  const sig = buffer.readUInt32BE(0);
  if (sig === TAG_WOFF) return "woff";
  return "sfnt";
}

export function asArrayBuffer(buffer) {
  return toArrayBuffer(buffer);
}

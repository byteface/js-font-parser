import { ByteArray } from '../utils/ByteArray.js';
import { BaseFontParser } from './BaseFontParser.js';
export class FontParserWOFF extends BaseFontParser {
    static WOFF_SIGNATURE = 0x774f4646;
    constructor(byteData, options) {
        super();
        if (options?.format === 'sfnt') {
            this.parseTTF(byteData);
        }
        else {
            this.init(byteData);
        }
    }
    static async load(url) {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = await response.arrayBuffer();
        const sfnt = await this.decodeWoffToSfnt(buffer);
        return new FontParserWOFF(new ByteArray(sfnt), { format: 'sfnt' });
    }
    // Initialize from raw WOFF bytes. This sync path supports only stored (uncompressed)
    // table payloads; compressed WOFF should use FontParserWOFF.load().
    init(byteData) {
        const rawBytes = new Uint8Array(byteData.dataView.buffer, byteData.dataView.byteOffset, byteData.dataView.byteLength);
        try {
            const sfnt = FontParserWOFF.decodeWoffToSfntSync(rawBytes);
            this.parseTTF(new ByteArray(sfnt));
            return;
        }
        catch (error) {
            const message = error?.message ?? "";
            if (!/Compressed WOFF table detected/i.test(message)) {
                throw error;
            }
            // Compatibility fallback: retain legacy behavior for compressed WOFF
            // in sync call sites (FontParser.fromArrayBuffer).
            this.parseTTF(new ByteArray(rawBytes));
        }
    }
    static readUint32(view, offset) {
        return view.getUint32(offset, false);
    }
    static readUint16(view, offset) {
        return view.getUint16(offset, false);
    }
    static assertNonOverlappingTableRanges(entries) {
        const byOffset = [...entries].sort((a, b) => a.offset - b.offset);
        for (let i = 1; i < byOffset.length; i++) {
            const prev = byOffset[i - 1];
            const curr = byOffset[i];
            const prevEnd = prev.offset + prev.compLength;
            if (curr.offset < prevEnd) {
                throw new Error('Invalid WOFF table entry: overlapping table data ranges.');
            }
        }
    }
    static decodeWoffToSfntSync(buffer) {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        if (view.byteLength < 44) {
            throw new Error('Invalid WOFF input: too short.');
        }
        const signature = this.readUint32(view, 0);
        if (signature !== this.WOFF_SIGNATURE) {
            throw new Error('Not a valid WOFF file.');
        }
        const flavor = this.readUint32(view, 4);
        const declaredLength = this.readUint32(view, 8);
        const numTables = this.readUint16(view, 12);
        const totalSfntSize = this.readUint32(view, 16);
        if (declaredLength !== view.byteLength) {
            throw new Error('Invalid WOFF header: declared length does not match available bytes.');
        }
        if (numTables <= 0) {
            throw new Error('Invalid WOFF header: numTables must be greater than zero.');
        }
        const tableDirOffset = 44;
        if (tableDirOffset + numTables * 20 > view.byteLength) {
            throw new Error('Invalid WOFF header: table directory exceeds available bytes.');
        }
        const entries = [];
        for (let i = 0; i < numTables; i++) {
            const offset = tableDirOffset + i * 20;
            const entry = {
                tag: this.readUint32(view, offset),
                offset: this.readUint32(view, offset + 4),
                compLength: this.readUint32(view, offset + 8),
                origLength: this.readUint32(view, offset + 12),
                checksum: this.readUint32(view, offset + 16)
            };
            if (entry.offset > view.byteLength || entry.compLength > view.byteLength - entry.offset) {
                throw new Error('Invalid WOFF table entry: table offset/length out of bounds.');
            }
            if (entry.compLength !== entry.origLength) {
                throw new Error('Compressed WOFF table detected in sync path. Use FontParserWOFF.load() for decompression support.');
            }
            entries.push(entry);
        }
        this.assertNonOverlappingTableRanges(entries);
        entries.sort((a, b) => a.tag - b.tag);
        const maxPower = 2 ** Math.floor(Math.log2(numTables));
        const searchRange = maxPower * 16;
        const entrySelector = Math.log2(maxPower);
        const rangeShift = numTables * 16 - searchRange;
        if (totalSfntSize < 12 + numTables * 16) {
            throw new Error('Invalid WOFF header: totalSfntSize is too small for sfnt directory.');
        }
        const sfntBuffer = new ArrayBuffer(totalSfntSize);
        const sfntView = new DataView(sfntBuffer);
        sfntView.setUint32(0, flavor, false);
        sfntView.setUint16(4, numTables, false);
        sfntView.setUint16(6, searchRange, false);
        sfntView.setUint16(8, entrySelector, false);
        sfntView.setUint16(10, rangeShift, false);
        let dataOffset = 12 + numTables * 16;
        const tableRecords = [];
        for (const entry of entries) {
            dataOffset = (dataOffset + 3) & ~3;
            tableRecords.push({ ...entry, sfntOffset: dataOffset });
            if (dataOffset + entry.origLength > sfntBuffer.byteLength) {
                throw new Error('Invalid WOFF header: table data exceeds totalSfntSize.');
            }
            const source = new Uint8Array(buffer.buffer, buffer.byteOffset + entry.offset, entry.origLength);
            const target = new Uint8Array(sfntBuffer, dataOffset, entry.origLength);
            target.set(source);
            dataOffset += entry.origLength;
        }
        tableRecords.forEach((record, i) => {
            const base = 12 + i * 16;
            sfntView.setUint32(base, record.tag, false);
            sfntView.setUint32(base + 4, record.checksum, false);
            sfntView.setUint32(base + 8, record.sfntOffset, false);
            sfntView.setUint32(base + 12, record.origLength, false);
        });
        return new Uint8Array(sfntBuffer);
    }
    static async inflate(data) {
        if (typeof DecompressionStream === 'undefined') {
            throw new Error('WOFF decompression requires DecompressionStream (not available).');
        }
        const stream = new DecompressionStream('deflate');
        const payload = new Uint8Array(data);
        const response = new Response(payload).body;
        if (!response)
            throw new Error('Failed to create response body for decompression.');
        const decompressed = response.pipeThrough(stream);
        const buffer = await new Response(decompressed).arrayBuffer();
        return new Uint8Array(buffer);
    }
    static async decodeWoffToSfnt(buffer) {
        const view = new DataView(buffer);
        const signature = this.readUint32(view, 0);
        if (signature !== 0x774f4646) {
            throw new Error('Not a valid WOFF file.');
        }
        const flavor = this.readUint32(view, 4);
        const length = this.readUint32(view, 8);
        const numTables = this.readUint16(view, 12);
        const totalSfntSize = this.readUint32(view, 16);
        if (length !== buffer.byteLength) {
            throw new Error('Invalid WOFF header: declared length does not match available bytes.');
        }
        if (numTables <= 0) {
            throw new Error('Invalid WOFF header: numTables must be greater than zero.');
        }
        const tableDirOffset = 44;
        if (tableDirOffset + numTables * 20 > buffer.byteLength) {
            throw new Error('Invalid WOFF header: table directory exceeds available bytes.');
        }
        const entries = [];
        for (let i = 0; i < numTables; i++) {
            const offset = tableDirOffset + i * 20;
            const entry = {
                tag: this.readUint32(view, offset),
                offset: this.readUint32(view, offset + 4),
                compLength: this.readUint32(view, offset + 8),
                origLength: this.readUint32(view, offset + 12),
                checksum: this.readUint32(view, offset + 16)
            };
            if (entry.offset > buffer.byteLength || entry.compLength > buffer.byteLength - entry.offset) {
                throw new Error('Invalid WOFF table entry: table offset/length out of bounds.');
            }
            if (entry.compLength > entry.origLength) {
                throw new Error('Invalid WOFF table entry: compLength cannot exceed origLength.');
            }
            entries.push(entry);
        }
        this.assertNonOverlappingTableRanges(entries);
        entries.sort((a, b) => a.tag - b.tag);
        const maxPower = 2 ** Math.floor(Math.log2(numTables));
        const searchRange = maxPower * 16;
        const entrySelector = Math.log2(maxPower);
        const rangeShift = numTables * 16 - searchRange;
        if (totalSfntSize < 12 + numTables * 16) {
            throw new Error('Invalid WOFF header: totalSfntSize is too small for sfnt directory.');
        }
        const sfntBuffer = new ArrayBuffer(totalSfntSize);
        const sfntView = new DataView(sfntBuffer);
        sfntView.setUint32(0, flavor, false);
        sfntView.setUint16(4, numTables, false);
        sfntView.setUint16(6, searchRange, false);
        sfntView.setUint16(8, entrySelector, false);
        sfntView.setUint16(10, rangeShift, false);
        let dataOffset = 12 + numTables * 16;
        const tableRecords = [];
        for (const entry of entries) {
            const aligned = (dataOffset + 3) & ~3;
            dataOffset = aligned;
            tableRecords.push({ ...entry, sfntOffset: dataOffset });
            const tableData = new Uint8Array(buffer, entry.offset, entry.compLength);
            let decoded = tableData;
            if (entry.compLength < entry.origLength) {
                decoded = await this.inflate(tableData);
            }
            if (decoded.length < entry.origLength) {
                throw new Error('Invalid WOFF table entry: decompressed data shorter than origLength.');
            }
            if (dataOffset + entry.origLength > sfntBuffer.byteLength) {
                throw new Error('Invalid WOFF header: table data exceeds totalSfntSize.');
            }
            const target = new Uint8Array(sfntBuffer, dataOffset, entry.origLength);
            target.set(decoded.subarray(0, entry.origLength));
            dataOffset += entry.origLength;
        }
        tableRecords.forEach((record, i) => {
            const base = 12 + i * 16;
            sfntView.setUint32(base, record.tag, false);
            sfntView.setUint32(base + 4, record.checksum, false);
            sfntView.setUint32(base + 8, record.sfntOffset, false);
            sfntView.setUint32(base + 12, record.origLength, false);
        });
        return new Uint8Array(sfntBuffer);
    }
    parseTTF(byteData) {
        this.parseSfntTables(byteData);
        this.wireCommonTables();
    }
    // Get a glyph description by index
    getGlyph(i) {
        return this.getGlyphShared(i, {
            maxGlyphs: this.maxp?.numGlyphs ?? null,
            glyf: this.glyf,
            hmtx: this.hmtx,
            gvar: this.gvar,
            variationCoords: this.variationCoords,
            cff: this.cff,
            cffIncludePhantoms: true
        });
    }
    applyIupDeltas(base, dx, dy, touched) {
        this.applyIupDeltasShared(base, dx, dy, touched);
    }
    interpolate(aCoord, bCoord, aDelta, bDelta, pCoord) {
        return this.interpolateShared(aCoord, bCoord, aDelta, bDelta, pCoord);
    }
}

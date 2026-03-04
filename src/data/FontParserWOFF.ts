import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
import { CffTable } from '../table/CffTable.js';
import { HeadTable } from '../table/HeadTable.js';
import { HheaTable } from '../table/HheaTable.js';
import { HmtxTable } from '../table/HmtxTable.js';
import { LocaTable } from '../table/LocaTable.js';
import { MaxpTable } from '../table/MaxpTable.js';
import { NameTable } from '../table/NameTable.js';
import { PostTable } from '../table/PostTable.js';
import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from './GlyphData.js';
import { ITable } from '../table/ITable.js';
import { GsubTable } from '../table/GsubTable.js';
import { LigatureSubstFormat1 } from '../table/LigatureSubstFormat1.js';
import { ColrTable } from '../table/ColrTable.js';
import { CpalTable } from '../table/CpalTable.js';
import { GposTable } from '../table/GposTable.js';
import { MarkBasePosFormat1 } from '../table/MarkBasePosFormat1.js';
import { MarkLigPosFormat1 } from '../table/MarkLigPosFormat1.js';
import { MarkMarkPosFormat1 } from '../table/MarkMarkPosFormat1.js';
import { CursivePosFormat1 } from '../table/CursivePosFormat1.js';
import { PairPosFormat1 } from '../table/PairPosFormat1.js';
import { PairPosFormat2 } from '../table/PairPosFormat2.js';

export class FontParserWOFF {
    // Define properties
    private os2: Os2Table | null = null;
    private cmap: CmapTable | null = null;
    private glyf: GlyfTable | null = null;
    private cff: CffTable | null = null;
    private head: HeadTable | null = null;
    private hhea: HheaTable | null = null;
    private hmtx: HmtxTable | null = null;
    private loca: LocaTable | null = null;
    private maxp: MaxpTable | null = null;
    private pName: NameTable | null = null;
    private post: PostTable | null = null;
    private gsub: GsubTable | null = null;
    private kern: any | null = null;
    private colr: ColrTable | null = null;
    private cpal: CpalTable | null = null;
    private gpos: GposTable | null = null;

    // Table directory and tables
    private tableDir: TableDirectory | null = null;
    private tables: Array<any> = [];

    constructor(byteData: ByteArray, options?: { format?: 'woff' | 'sfnt' }) {
        if (options?.format === 'sfnt') {
            this.parseTTF(byteData);
        } else {
            this.init(byteData);
        }
    }

    static async load(url: string): Promise<FontParserWOFF> {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const buffer = await response.arrayBuffer();
        const sfnt = await this.decodeWoffToSfnt(buffer);
        return new FontParserWOFF(new ByteArray(sfnt), { format: 'sfnt' });
    }

    // Initialize the FontParserWOFF instance (legacy sync path; expects uncompressed WOFF)
    private init(byteData: ByteArray): void {
        // Read the WOFF header
        const woffVersion = byteData.readUInt(); // 4 bytes
        const woffSize = byteData.readUInt(); // 4 bytes
        const woffNumTables = byteData.readUnsignedShort(); // 2 bytes
        const woffReserved = byteData.readUnsignedShort(); // 2 bytes
        const woffTotalSfntSize = byteData.readUInt(); // 4 bytes
        const woffMajorVersion = byteData.readUnsignedShort(); // 2 bytes
        const woffMinorVersion = byteData.readUnsignedShort(); // 2 bytes
        const woffMetaOffset = byteData.readUInt(); // 4 bytes
        const woffMetaLength = byteData.readUInt(); // 4 bytes
        const woffMetadata = byteData.readUInt(); // 4 bytes

        // Initialize the table directory
        this.tables = [];
        let offset = 0;

        // Read each table
        for (let i = 0; i < woffNumTables; i++) {
            const tag = byteData.readUInt(); // 4 bytes
            const offsetTable = byteData.readUInt(); // 4 bytes
            const lengthTable = byteData.readUInt(); // 4 bytes
            const checksumTable = byteData.readUInt(); // 4 bytes

            // Store table information for later extraction
            this.tables.push({ tag, offset: offsetTable, length: lengthTable });
        }

        // Legacy path assumes uncompressed WOFF with contiguous tables (not generally safe).
        // Prefer FontParserWOFF.load which rebuilds an sfnt buffer with decompression support.
        const ttfData = new Uint8Array(byteData.dataView.buffer, byteData.dataView.byteOffset, byteData.dataView.byteLength);
        this.parseTTF(new ByteArray(ttfData));
    }

    private static readUint32(view: DataView, offset: number): number {
        return view.getUint32(offset, false);
    }

    private static readUint16(view: DataView, offset: number): number {
        return view.getUint16(offset, false);
    }

    private static async inflate(data: Uint8Array): Promise<Uint8Array> {
        if (typeof DecompressionStream === 'undefined') {
            throw new Error('WOFF decompression requires DecompressionStream (not available).');
        }
        const stream = new DecompressionStream('deflate');
        const response = new Response(data).body;
        if (!response) throw new Error('Failed to create response body for decompression.');
        const decompressed = response.pipeThrough(stream);
        const buffer = await new Response(decompressed).arrayBuffer();
        return new Uint8Array(buffer);
    }

    private static async decodeWoffToSfnt(buffer: ArrayBuffer): Promise<Uint8Array> {
        const view = new DataView(buffer);
        const signature = this.readUint32(view, 0);
        if (signature !== 0x774f4646) {
            throw new Error('Not a valid WOFF file.');
        }

        const flavor = this.readUint32(view, 4);
        const length = this.readUint32(view, 8);
        const numTables = this.readUint16(view, 12);
        const totalSfntSize = this.readUint32(view, 16);

        const tableDirOffset = 44;
        const entries = [];
        for (let i = 0; i < numTables; i++) {
            const offset = tableDirOffset + i * 20;
            entries.push({
                tag: this.readUint32(view, offset),
                offset: this.readUint32(view, offset + 4),
                compLength: this.readUint32(view, offset + 8),
                origLength: this.readUint32(view, offset + 12),
                checksum: this.readUint32(view, offset + 16)
            });
        }

        entries.sort((a, b) => a.tag - b.tag);

        const maxPower = 2 ** Math.floor(Math.log2(numTables));
        const searchRange = maxPower * 16;
        const entrySelector = Math.log2(maxPower);
        const rangeShift = numTables * 16 - searchRange;

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

    private parseTTF(byteData: ByteArray): void {
        // Load TTF tables from the extracted byte data
        const tf = new TableFactory();
        this.tableDir = new TableDirectory(byteData);
        
        for (let i = 0; i < this.tableDir.numTables; i++) {
            const tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) {
                this.tables.push(tab);
            }
        }

        // Get references to the tables
        this.os2 = this.getTable(Table.OS_2) as Os2Table | null;
        this.cmap = this.getTable(Table.cmap) as CmapTable | null;
        this.glyf = this.getTable(Table.glyf) as GlyfTable | null;
        this.cff = this.getTable(Table.CFF) as CffTable | null;
        this.head = this.getTable(Table.head) as HeadTable | null;
        this.hhea = this.getTable(Table.hhea) as HheaTable | null;
        this.hmtx = this.getTable(Table.hmtx) as HmtxTable | null;
        this.loca = this.getTable(Table.loca) as LocaTable | null;
        this.maxp = this.getTable(Table.maxp) as MaxpTable | null;
        this.pName = this.getTable(Table.pName) as NameTable | null;
        this.post = this.getTable(Table.post) as PostTable | null;
        this.gsub = this.getTable(Table.GSUB) as GsubTable | null;
        this.kern = this.getTable(Table.kern) as any | null;
        this.colr = this.getTable(Table.COLR) as ColrTable | null;
        this.cpal = this.getTable(Table.CPAL) as CpalTable | null;
        this.gpos = this.getTable(Table.GPOS) as GposTable | null;

        // Initialize the tables
        if (this.hmtx && this.maxp) {
            this.hmtx.run(this.hhea?.numberOfHMetrics ?? 0, this.maxp.numGlyphs - (this.hhea?.numberOfHMetrics ?? 0));
        }
        if (this.loca && this.maxp && this.head) {
            this.loca.run(this.maxp.numGlyphs, this.head.indexToLocFormat === 0);
        }
        if (this.glyf && this.loca && this.maxp) {
            this.glyf.run(this.maxp.numGlyphs, this.loca);
        }
    }

    // Get a glyph description by index
    public getGlyph(i: number): GlyphData | null {
        const description = this.glyf?.getDescription(i);
        if (description != null) {
            return new GlyphData(description, this.hmtx?.getLeftSideBearing(i) ?? 0, this.hmtx?.getAdvanceWidth(i) ?? 0);
        }
        if (this.cff) {
            const cffDesc = this.cff.getGlyphDescription(i);
            if (cffDesc) {
                return new GlyphData(cffDesc, this.hmtx?.getLeftSideBearing(i) ?? 0, this.hmtx?.getAdvanceWidth(i) ?? 0, { isCubic: true });
            }
        }
        return null;
    }

    // Get the number of glyphs
    public getNumGlyphs(): number {
        return this.maxp?.numGlyphs ?? 0;
    }

    // Get the ascent value
    public getAscent(): number {
        return this.hhea?.ascender ?? 0;
    }

    // Get the descent value
    public getDescent(): number {
        return this.hhea?.descender ?? 0;
    }

    public getColorLayersForGlyph(glyphId: number, paletteIndex: number = 0): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        if (!this.colr) return [];
        const layers = this.colr.getLayersForGlyph(glyphId);
        if (layers.length === 0) return [];

        const palette = this.cpal?.getPalette(paletteIndex) ?? [];
        return layers.map(layer => {
            if (layer.paletteIndex === 0xffff) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            const color = palette[layer.paletteIndex];
            if (!color) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            const rgba = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha / 255})`;
            return { glyphId: layer.glyphId, color: rgba, paletteIndex: layer.paletteIndex };
        });
    }

    public getColorLayersForChar(char: string, paletteIndex: number = 0): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        const glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null) return [];
        return this.getColorLayersForGlyph(glyphId, paletteIndex);
    }

    public getMarkAnchorsForGlyph(glyphId: number): Array<{ type: 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit'; classIndex: number; x: number; y: number }> {
        if (!this.gpos) return [];
        const anchors: Array<{ type: 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit'; classIndex: number; x: number; y: number }> = [];
        const lookups = this.gpos.lookupList?.getLookups?.() ?? [];
        for (const lookup of lookups) {
            if (!lookup) continue;
            for (let i = 0; i < lookup.getSubtableCount(); i++) {
                const st = lookup.getSubtable(i);
                if (st instanceof MarkBasePosFormat1) {
                    const markIndex = st.markCoverage?.findGlyph(glyphId) ?? -1;
                    if (markIndex >= 0 && st.markArray) {
                        const record = st.markArray.marks[markIndex];
                        if (record?.anchor) {
                            anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                        }
                    }
                    const baseIndex = st.baseCoverage?.findGlyph(glyphId) ?? -1;
                    if (baseIndex >= 0 && st.baseArray) {
                        const base = st.baseArray.baseRecords[baseIndex];
                        if (base?.anchors) {
                            base.anchors.forEach((anchor, classIndex) => {
                                if (anchor) {
                                    anchors.push({ type: 'base', classIndex, x: anchor.x, y: anchor.y });
                                }
                            });
                        }
                    }
                }
                if (st instanceof MarkLigPosFormat1) {
                    const markIndex = st.markCoverage?.findGlyph(glyphId) ?? -1;
                    if (markIndex >= 0 && st.markArray) {
                        const record = st.markArray.marks[markIndex];
                        if (record?.anchor) {
                            anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                        }
                    }
                    const ligIndex = st.ligatureCoverage?.findGlyph(glyphId) ?? -1;
                    if (ligIndex >= 0 && st.ligatureArray) {
                        const lig = st.ligatureArray.ligatures[ligIndex];
                        lig?.components?.forEach(component => {
                            component.forEach((anchor, classIndex) => {
                                if (anchor) {
                                    anchors.push({ type: 'ligature', classIndex, x: anchor.x, y: anchor.y });
                                }
                            });
                        });
                    }
                }
                if (st instanceof MarkMarkPosFormat1) {
                    const mark1Index = st.mark1Coverage?.findGlyph(glyphId) ?? -1;
                    if (mark1Index >= 0 && st.mark1Array) {
                        const record = st.mark1Array.marks[mark1Index];
                        if (record?.anchor) {
                            anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                        }
                    }
                    const mark2Index = st.mark2Coverage?.findGlyph(glyphId) ?? -1;
                    if (mark2Index >= 0 && st.mark2Array) {
                        const record = st.mark2Array.records[mark2Index];
                        record?.anchors?.forEach((anchor, classIndex) => {
                            if (anchor) {
                                anchors.push({ type: 'mark2', classIndex, x: anchor.x, y: anchor.y });
                            }
                        });
                    }
                }
                if (st instanceof CursivePosFormat1) {
                    const idx = st.coverage?.findGlyph(glyphId) ?? -1;
                    if (idx >= 0) {
                        const record = st.entryExitRecords[idx];
                        if (record?.entry) anchors.push({ type: 'cursive-entry', classIndex: 0, x: record.entry.x, y: record.entry.y });
                        if (record?.exit) anchors.push({ type: 'cursive-exit', classIndex: 0, x: record.exit.x, y: record.exit.y });
                    }
                }
            }
        }
        return anchors;
    }

    public getGlyphIndexByChar(char: string): number | null {
        if (!char || char.length === 0) {
            console.error("getGlyphIndexByChar expects a character");
            return null;
        }
        if (char.length > 2) {
            console.warn("getGlyphIndexByChar received multiple characters; using the first code point");
        }

        const codePoint = char.codePointAt(0);
        if (codePoint == null) return null;

        if (!this.cmap) return null;
        const cmapFormat = this.getBestCmapFormatFor(codePoint);
        if (!cmapFormat) return null;

        const glyphIndex = typeof cmapFormat.getGlyphIndex === "function"
            ? cmapFormat.getGlyphIndex(codePoint)
            : cmapFormat.mapCharCode(codePoint);

        if (glyphIndex == null || glyphIndex === 0) return null;
        return glyphIndex;
    }

    public getGlyphByChar(char: string): GlyphData | null {
        const idx = this.getGlyphIndexByChar(char);
        if (idx == null) return null;
        return this.getGlyph(idx);
    }

    public getGlyphIndicesForStringWithGsub(text: string, featureTags: string[] = ["liga"], scriptTags: string[] = ["DFLT", "latn"]): number[] {
        const glyphs = [];
        for (const ch of text) {
            const idx = this.getGlyphIndexByChar(ch);
            if (idx != null) glyphs.push(idx);
        }
        if (!this.gsub || glyphs.length === 0) return glyphs;

        const subtables = this.gsub.getSubtablesForFeatures(featureTags, scriptTags);
        let result = glyphs.slice();
        for (const st of subtables) {
            if (!st) continue;

            if (typeof (st as any).substitute === "function") {
                result = result.map(g => (st as any).substitute(g));
                continue;
            }

            if (st instanceof LigatureSubstFormat1) {
                const lig = st as LigatureSubstFormat1;
                const next: number[] = [];
                let i = 0;
                while (i < result.length) {
                    const match = lig.tryLigature(result, i);
                    if (match) {
                        next.push(match.glyphId);
                        i += match.length;
                    } else {
                        next.push(result[i]);
                        i += 1;
                    }
                }
                result = next;
            }
        }
        return result;
    }

    public getKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        if (!this.kern) return 0;
        if (typeof this.kern.getKerningValue === "function") {
            return this.kern.getKerningValue(leftGlyph, rightGlyph) ?? 0;
        }
        return 0;
    }

    public getGposKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        if (!this.gpos) return 0;
        const lookups = this.gpos.lookupList?.getLookups?.() ?? [];
        let value = 0;
        for (const lookup of lookups) {
            if (!lookup || lookup.getType() !== 2) continue;
            for (let i = 0; i < lookup.getSubtableCount(); i++) {
                const st = lookup.getSubtable(i);
                if (st instanceof PairPosFormat1 || st instanceof PairPosFormat2) {
                    value += st.getKerning(leftGlyph, rightGlyph);
                }
            }
        }
        return value;
    }

    public getKerningValue(leftChar: string, rightChar: string): number {
        const left = this.getGlyphIndexByChar(leftChar);
        const right = this.getGlyphIndexByChar(rightChar);
        if (left == null || right == null) return 0;
        const kern = this.getKerningValueByGlyphs(left, right);
        if (kern !== 0) return kern;
        return this.getGposKerningValueByGlyphs(left, right);
    }

    public layoutString(
        text: string,
        options: { gsubFeatures?: string[]; scriptTags?: string[]; gpos?: boolean } = {}
    ): Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }> {
        const gsubFeatures = options.gsubFeatures ?? ["liga"];
        const scriptTags = options.scriptTags ?? ["DFLT", "latn"];
        const glyphIndices = this.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);

        const positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }> = [];
        for (let i = 0; i < glyphIndices.length; i++) {
            const glyphIndex = glyphIndices[i];
            const glyph = this.getGlyph(glyphIndex);
            if (!glyph) continue;

            let kern = 0;
            if (i < glyphIndices.length - 1) {
                kern = this.getKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                if (kern === 0) {
                    kern = this.getGposKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                }
            }

            positioned.push({
                glyphIndex,
                xAdvance: glyph.advanceWidth + kern,
                xOffset: 0,
                yOffset: 0,
                yAdvance: 0,
            });
        }
        if (options.gpos) {
            this.applyGposPositioning(glyphIndices, positioned);
        }
        return positioned;
    }

    private applyGposPositioning(
        glyphIndices: number[],
        positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }>
    ): void {
        if (!this.gpos) return;
        const lookups = this.gpos.lookupList?.getLookups?.() ?? [];

        for (const lookup of lookups) {
            if (!lookup) continue;
            const type = lookup.getType();
            if (type === 1) {
                for (let i = 0; i < glyphIndices.length; i++) {
                    for (let j = 0; j < lookup.getSubtableCount(); j++) {
                        const st = lookup.getSubtable(j);
                        if (st && typeof (st as any).getAdjustment === "function") {
                            const adj = (st as any).getAdjustment(glyphIndices[i]);
                            if (!adj) continue;
                            positioned[i].xOffset += adj.xPlacement ?? 0;
                            positioned[i].yOffset += adj.yPlacement ?? 0;
                            positioned[i].xAdvance += adj.xAdvance ?? 0;
                            positioned[i].yAdvance += adj.yAdvance ?? 0;
                        }
                    }
                }
            }
            if (type === 2) {
                for (let i = 0; i < glyphIndices.length - 1; i++) {
                    for (let j = 0; j < lookup.getSubtableCount(); j++) {
                        const st = lookup.getSubtable(j);
                        if (!st) continue;
                        const getPair = (st as any).getPairValue as ((l: number, r: number) => { v1: any; v2: any } | null) | undefined;
                        if (!getPair) continue;
                        const pair = getPair(glyphIndices[i], glyphIndices[i + 1]);
                        if (!pair) continue;
                        const v1 = pair.v1 || {};
                        const v2 = pair.v2 || {};
                        positioned[i].xOffset += v1.xPlacement ?? 0;
                        positioned[i].yOffset += v1.yPlacement ?? 0;
                        positioned[i].xAdvance += v1.xAdvance ?? 0;
                        positioned[i].yAdvance += v1.yAdvance ?? 0;
                        positioned[i + 1].xOffset += v2.xPlacement ?? 0;
                        positioned[i + 1].yOffset += v2.yPlacement ?? 0;
                        positioned[i + 1].xAdvance += v2.xAdvance ?? 0;
                        positioned[i + 1].yAdvance += v2.yAdvance ?? 0;
                    }
                }
            }
        }

        const anchorsCache = new Map<number, ReturnType<FontParserWOFF['getMarkAnchorsForGlyph']>>();

        const getAnchors = (gid: number) => {
            if (anchorsCache.has(gid)) return anchorsCache.get(gid)!;
            const anchors = this.getMarkAnchorsForGlyph(gid);
            anchorsCache.set(gid, anchors);
            return anchors;
        };

        const getBaseAnchor = (anchors: ReturnType<FontParserWOFF['getMarkAnchorsForGlyph']>, classIndex: number) => {
            return anchors.find(a => (a.type === 'base' || a.type === 'ligature' || a.type === 'mark2') && a.classIndex === classIndex);
        };

        for (let i = 0; i < glyphIndices.length; i++) {
            const gid = glyphIndices[i];
            const anchors = getAnchors(gid);
            const markAnchor = anchors.find(a => a.type === 'mark');
            if (!markAnchor) continue;

            let baseIndex = i - 1;
            while (baseIndex >= 0) {
                const baseAnchors = getAnchors(glyphIndices[baseIndex]);
                const baseAnchor = getBaseAnchor(baseAnchors, markAnchor.classIndex);
                if (baseAnchor) {
                    positioned[i].xOffset += baseAnchor.x - markAnchor.x;
                    positioned[i].yOffset += baseAnchor.y - markAnchor.y;
                    positioned[i].xAdvance = 0;
                    break;
                }
                baseIndex--;
            }
        }

        for (let i = 1; i < glyphIndices.length; i++) {
            const prevAnchors = getAnchors(glyphIndices[i - 1]);
            const currAnchors = getAnchors(glyphIndices[i]);
            const exitAnchor = prevAnchors.find(a => a.type === 'cursive-exit');
            const entryAnchor = currAnchors.find(a => a.type === 'cursive-entry');
            if (exitAnchor && entryAnchor) {
                positioned[i].xOffset += exitAnchor.x - entryAnchor.x;
                positioned[i].yOffset += exitAnchor.y - entryAnchor.y;
            }
        }
    }

    public getTableByType(tableType: number): ITable | null {
        return this.getTable(tableType);
    }

    // Return a table by type
    private getTable(tableType: any): ITable | null {
        return this.tables.find(tab => tab?.getType() === tableType) || null;
    }

    private getBestCmapFormatFor(codePoint: number): any | null {
        if (!this.cmap) return null;
        const prefersUcs4 = codePoint > 0xffff;
        const preferred = prefersUcs4
            ? [
                { platformId: 3, encodingId: 10 },
                { platformId: 0, encodingId: 4 },
                { platformId: 3, encodingId: 1 },
                { platformId: 0, encodingId: 3 },
                { platformId: 0, encodingId: 1 },
                { platformId: 1, encodingId: 0 }
            ]
            : [
                { platformId: 3, encodingId: 1 },
                { platformId: 0, encodingId: 3 },
                { platformId: 0, encodingId: 1 },
                { platformId: 3, encodingId: 10 },
                { platformId: 0, encodingId: 4 },
                { platformId: 1, encodingId: 0 }
            ];

        for (const pref of preferred) {
            const formats = this.cmap.getCmapFormats(pref.platformId, pref.encodingId);
            if (formats.length > 0) {
                return this.pickBestFormat(formats);
            }
        }

        return this.cmap.formats.length > 0 ? this.pickBestFormat(this.cmap.formats) : null;
    }

    private pickBestFormat(formats: any[]): any | null {
        if (formats.length === 0) return null;
        const order = [4, 12, 10, 8, 6, 2, 0];
        for (const fmt of order) {
            const found = formats.find(f => (typeof f.getFormatType === "function" ? f.getFormatType() : f.format) === fmt);
            if (found) return found;
        }
        return formats[0];
    }
}

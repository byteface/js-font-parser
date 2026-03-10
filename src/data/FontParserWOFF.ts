import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
import { GlyfCompositeDescript } from '../table/GlyfCompositeDescript.js';
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
import { IGlyphDescription } from '../table/IGlyphDescription.js';
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
import { SinglePosSubtable } from '../table/SinglePosSubtable.js';
import { PairPosSubtable } from '../table/PairPosSubtable.js';
import { SvgTable } from '../table/SvgTable.js';
import { FvarTable } from '../table/FvarTable.js';
import { GvarTable } from '../table/GvarTable.js';
import { BaseFontParser } from './BaseFontParser.js';

export class FontParserWOFF extends BaseFontParser {
    private static readonly WOFF_SIGNATURE = 0x774f4646;
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
    private kern: { getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null } | null = null;
    private colr: ColrTable | null = null;
    private cpal: CpalTable | null = null;
    private gpos: GposTable | null = null;
    private gdef: { getGlyphClass?: (glyphId: number) => number } | null = null;
    private svg: SvgTable | null = null;
    private fvar: FvarTable | null = null;
    private gvar: GvarTable | null = null;
    private variationCoords: number[] = [];

    // Table directory and tables
    private tableDir: TableDirectory | null = null;
    private tables: ITable[] = [];

    constructor(byteData: ByteArray, options?: { format?: 'woff' | 'sfnt' }) {
        super();
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

    // Initialize from raw WOFF bytes. This sync path supports only stored (uncompressed)
    // table payloads; compressed WOFF should use FontParserWOFF.load().
    private init(byteData: ByteArray): void {
        const rawBytes = new Uint8Array(
            byteData.dataView.buffer,
            byteData.dataView.byteOffset,
            byteData.dataView.byteLength
        );
        try {
            const sfnt = FontParserWOFF.decodeWoffToSfntSync(rawBytes);
            this.parseTTF(new ByteArray(sfnt));
            return;
        } catch (error) {
            const message = (error as Error)?.message ?? "";
            if (!/Compressed WOFF table detected/i.test(message)) {
                throw error;
            }
            // Compatibility fallback: retain legacy behavior for compressed WOFF
            // in sync call sites (FontParser.fromArrayBuffer).
            this.parseTTF(new ByteArray(rawBytes));
        }
    }

    private static readUint32(view: DataView, offset: number): number {
        return view.getUint32(offset, false);
    }

    private static readUint16(view: DataView, offset: number): number {
        return view.getUint16(offset, false);
    }

    private static assertNonOverlappingTableRanges(entries: Array<{ offset: number; compLength: number }>): void {
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

    private static decodeWoffToSfntSync(buffer: Uint8Array): Uint8Array {
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

        const entries: Array<{ tag: number; offset: number; compLength: number; origLength: number; checksum: number }> = [];
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

    private static async inflate(data: Uint8Array): Promise<Uint8Array> {
        if (typeof DecompressionStream === 'undefined') {
            throw new Error('WOFF decompression requires DecompressionStream (not available).');
        }
        const stream = new DecompressionStream('deflate');
        const payload = new Uint8Array(data);
        const response = new Response(payload).body;
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
            let decoded: Uint8Array = tableData;
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

    private parseTTF(byteData: ByteArray): void {
        // Load TTF tables from the extracted byte data
        const tf = new TableFactory();
        // Reset any legacy WOFF directory entries so only parsed table objects remain.
        this.tables = [];
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
        this.kern = this.getTable(Table.kern) as { getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null } | null;
        this.colr = this.getTable(Table.COLR) as ColrTable | null;
        this.cpal = this.getTable(Table.CPAL) as CpalTable | null;
        this.gpos = this.getTable(Table.GPOS) as GposTable | null;
        this.gdef = this.getTable(Table.GDEF) as { getGlyphClass?: (glyphId: number) => number } | null;
        const maybeGsubWithGdef = this.gsub as GsubTable & { setGdef?: (gdef: { getGlyphClass?: (glyphId: number) => number } | null) => void };
        if (this.gsub && this.gdef && typeof maybeGsubWithGdef.setGdef === 'function') {
            maybeGsubWithGdef.setGdef(this.gdef);
        }
        this.svg = this.getTable(Table.SVG) as SvgTable | null;
        this.fvar = this.getTable(Table.fvar) as FvarTable | null;
        this.gvar = this.getTable(Table.gvar) as GvarTable | null;
        if (this.fvar && this.fvar.axes.length > 0) {
            const defaults: Record<string, number> = {};
            for (const axis of this.fvar.axes) defaults[axis.name] = axis.defaultValue;
            this.setVariationByAxes(defaults);
        }

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
            let desc = description;
            let lsb = this.hmtx?.getLeftSideBearing(i) ?? 0;
            let advance = this.hmtx?.getAdvanceWidth(i) ?? 0;
            if (this.gvar && this.variationCoords.length > 0) {
                const basePointCount = description.getPointCount();
                const isComposite = description.isComposite();
                const descriptionComponents = description instanceof GlyfCompositeDescript && Array.isArray(description.components)
                    ? description.components
                    : [];
                const componentCount = isComposite && description instanceof GlyfCompositeDescript
                    ? (descriptionComponents.length > 0 ? descriptionComponents.length : basePointCount)
                    : 0;
                let transformSlotCount = 0;
                if (isComposite && description instanceof GlyfCompositeDescript) {
                    for (const comp of descriptionComponents) {
                        transformSlotCount += comp.getTransformSlotCount();
                    }
                }
                const compositePointCount = isComposite ? (componentCount + transformSlotCount) : basePointCount;
                const gvarPointCount = compositePointCount + 4; // phantom points
                const deltas = this.gvar.getDeltasForGlyph(i, this.variationCoords, gvarPointCount);
                if (deltas) {
                    const self = this;
                    const base = description;
                    const compositeBase = isComposite && base instanceof GlyfCompositeDescript ? base : null;
                    const fullDx = deltas.dx;
                    const fullDy = deltas.dy;
                    let dx: number[] = [];
                    let dy: number[] = [];
                    let compDx: number[] | null = null;
                    let compDy: number[] | null = null;
                    let compXScale: number[] | null = null;
                    let compYScale: number[] | null = null;
                    let compScale01: number[] | null = null;
                    let compScale10: number[] | null = null;

                    if (!isComposite) {
                        dx = fullDx.slice(0, basePointCount);
                        dy = fullDy.slice(0, basePointCount);
                        const touched = deltas.touched.slice(0, basePointCount);
                        while (dx.length < basePointCount) dx.push(0);
                        while (dy.length < basePointCount) dy.push(0);
                        while (touched.length < basePointCount) touched.push(false);
                        this.applyIupDeltas(base, dx, dy, touched);
                    } else if (base instanceof GlyfCompositeDescript) {
                        compDx = new Array(componentCount).fill(0);
                        compDy = new Array(componentCount).fill(0);
                        compXScale = new Array(componentCount).fill(0);
                        compYScale = new Array(componentCount).fill(0);
                        compScale01 = new Array(componentCount).fill(0);
                        compScale10 = new Array(componentCount).fill(0);
                        for (let c = 0; c < componentCount; c++) {
                            const rawDx = fullDx[c] ?? 0;
                            const rawDy = fullDy[c] ?? 0;
                            compDx[c] = rawDx;
                            compDy[c] = rawDy;
                        }
                        let tIndex = componentCount;
                        for (let c = 0; c < componentCount; c++) {
                            const comp = descriptionComponents[c];
                            if (!comp) continue;
                            if (comp.hasTwoByTwo()) {
                                const idx1 = tIndex++;
                                const idx2 = tIndex++;
                                compXScale[c] = (fullDx[idx1] ?? 0) / 0x4000;
                                compScale01[c] = (fullDy[idx1] ?? 0) / 0x4000;
                                compScale10[c] = (fullDx[idx2] ?? 0) / 0x4000;
                                compYScale[c] = (fullDy[idx2] ?? 0) / 0x4000;
                            } else if (comp.hasXYScale()) {
                                const idx = tIndex++;
                                compXScale[c] = (fullDx[idx] ?? 0) / 0x4000;
                                compYScale[c] = (fullDy[idx] ?? 0) / 0x4000;
                            } else if (comp.hasScale()) {
                                const idx = tIndex++;
                                const delta = (fullDx[idx] ?? 0) / 0x4000;
                                compXScale[c] = delta;
                                compYScale[c] = delta;
                            }
                        }
                    }

                    const phantomBase = isComposite ? compositePointCount : basePointCount;
                    const lsbDelta = fullDx[phantomBase] ?? 0;
                    const rsbDelta = fullDx[phantomBase + 1] ?? 0;
                    lsb += lsbDelta;
                    advance += (rsbDelta - lsbDelta);

                    let minX = Infinity;
                    let maxX = -Infinity;
                    let minY = Infinity;
                    let maxY = -Infinity;
                    for (let p = 0; p < basePointCount; p++) {
                        const compositeBase = (isComposite && base instanceof GlyfCompositeDescript) ? base : null;
                        const comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                        const compIndex = comp && compositeBase ? compositeBase.components.indexOf(comp) : -1;
                        let x = base.getXCoordinate(p);
                        let y = base.getYCoordinate(p);
                        if (comp && compIndex >= 0 && self.glyf) {
                            const gd = self.glyf.getDescription(comp.glyphIndex);
                            if (gd) {
                                const localIndex = p - comp.firstIndex;
                                const px = gd.getXCoordinate(localIndex);
                                const py = gd.getYCoordinate(localIndex);
                                const xscale = comp.xscale + (compXScale?.[compIndex] ?? 0);
                                const yscale = comp.yscale + (compYScale?.[compIndex] ?? 0);
                                const scale01 = comp.scale01 + (compScale01?.[compIndex] ?? 0);
                                const scale10 = comp.scale10 + (compScale10?.[compIndex] ?? 0);
                                const ox = comp.xtranslate + (compDx?.[compIndex] ?? 0);
                                const oy = comp.ytranslate + (compDy?.[compIndex] ?? 0);
                                x = (px * xscale) + (py * scale10) + ox;
                                y = (px * scale01) + (py * yscale) + oy;
                            }
                        } else {
                            const ox = compIndex >= 0 && compDx ? compDx[compIndex] ?? 0 : 0;
                            const oy = compIndex >= 0 && compDy ? compDy[compIndex] ?? 0 : 0;
                            x = base.getXCoordinate(p) + (dx[p] ?? 0) + ox;
                            y = base.getYCoordinate(p) + (dy[p] ?? 0) + oy;
                        }
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }

                    desc = {
                        getPointCount: () => base.getPointCount(),
                        getContourCount: () => base.getContourCount(),
                        getEndPtOfContours: (c: number) => base.getEndPtOfContours(c),
                        getFlags: (p: number) => base.getFlags(p),
                        getXCoordinate: (p: number) => {
                            const compositeBase = (isComposite && base instanceof GlyfCompositeDescript) ? base : null;
                            const comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            const compIndex = comp && compositeBase ? compositeBase.components.indexOf(comp) : -1;
                            if (comp && compIndex >= 0 && self.glyf) {
                                const gd = self.glyf.getDescription(comp.glyphIndex);
                                if (gd) {
                                    const localIndex = p - comp.firstIndex;
                                    const px = gd.getXCoordinate(localIndex);
                                    const py = gd.getYCoordinate(localIndex);
                                    const xscale = comp.xscale + (compXScale?.[compIndex] ?? 0);
                                    const yscale = comp.yscale + (compYScale?.[compIndex] ?? 0);
                                    const scale01 = comp.scale01 + (compScale01?.[compIndex] ?? 0);
                                    const scale10 = comp.scale10 + (compScale10?.[compIndex] ?? 0);
                                    const ox = comp.xtranslate + (compDx?.[compIndex] ?? 0);
                                    return (px * xscale) + (py * scale10) + ox;
                                }
                            }
                            const ox = compIndex >= 0 && compDx ? compDx[compIndex] ?? 0 : 0;
                            return base.getXCoordinate(p) + (dx[p] ?? 0) + ox;
                        },
                        getYCoordinate: (p: number) => {
                            const compositeBase = (isComposite && base instanceof GlyfCompositeDescript) ? base : null;
                            const comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            const compIndex = comp && compositeBase ? compositeBase.components.indexOf(comp) : -1;
                            if (comp && compIndex >= 0 && self.glyf) {
                                const gd = self.glyf.getDescription(comp.glyphIndex);
                                if (gd) {
                                    const localIndex = p - comp.firstIndex;
                                    const px = gd.getXCoordinate(localIndex);
                                    const py = gd.getYCoordinate(localIndex);
                                    const xscale = comp.xscale + (compXScale?.[compIndex] ?? 0);
                                    const yscale = comp.yscale + (compYScale?.[compIndex] ?? 0);
                                    const scale01 = comp.scale01 + (compScale01?.[compIndex] ?? 0);
                                    const scale10 = comp.scale10 + (compScale10?.[compIndex] ?? 0);
                                    const oy = comp.ytranslate + (compDy?.[compIndex] ?? 0);
                                    return (px * scale01) + (py * yscale) + oy;
                                }
                            }
                            const oy = compIndex >= 0 && compDy ? compDy[compIndex] ?? 0 : 0;
                            return base.getYCoordinate(p) + (dy[p] ?? 0) + oy;
                        },
                        getXMaximum: () => (maxX !== -Infinity ? maxX : base.getXMaximum()),
                        getXMinimum: () => (minX !== Infinity ? minX : base.getXMinimum()),
                        getYMaximum: () => (maxY !== -Infinity ? maxY : base.getYMaximum()),
                        getYMinimum: () => (minY !== Infinity ? minY : base.getYMinimum()),
                        isComposite: () => base.isComposite(),
                        resolve: () => base.resolve()
                    };
                }
            }
            return new GlyphData(desc, lsb, advance);
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

    public getUnitsPerEm(): number {
        return this.head?.unitsPerEm ?? 1000;
    }

    public getGlyphPointsByChar(
        char: string,
        options: { sampleStep?: number } = {}
    ): Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean }> {
        const glyph = this.getGlyphByChar(char);
        if (!glyph) return [];
        const sampleStep = Math.max(1, Math.floor(options.sampleStep ?? 1));
        const points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean }> = [];
        for (let i = 0; i < glyph.getPointCount(); i += sampleStep) {
            const p = glyph.getPoint(i);
            if (!p) continue;
            points.push({
                x: p.x,
                y: p.y,
                onCurve: p.onCurve,
                endOfContour: p.endOfContour
            });
        }
        return points;
    }

    public measureText(
        text: string,
        options: { gsubFeatures?: string[]; scriptTags?: string[]; gpos?: boolean; gposFeatures?: string[]; letterSpacing?: number } = {}
    ): { advanceWidth: number; glyphCount: number } {
        const layout = this.layoutString(text, options);
        const letterSpacing = Number.isFinite(options.letterSpacing) ? (options.letterSpacing as number) : 0;
        let advanceWidth = 0;
        for (let i = 0; i < layout.length; i++) {
            const xAdvance = Number.isFinite(layout[i].xAdvance) ? layout[i].xAdvance : 0;
            advanceWidth += xAdvance;
            if (letterSpacing !== 0 && i < layout.length - 1) advanceWidth += letterSpacing;
        }
        return { advanceWidth: Number.isFinite(advanceWidth) ? advanceWidth : 0, glyphCount: layout.length };
    }

    public layoutToPoints(
        text: string,
        options: {
            x?: number;
            y?: number;
            fontSize?: number;
            sampleStep?: number;
            gsubFeatures?: string[];
            scriptTags?: string[];
            gpos?: boolean;
            gposFeatures?: string[];
            letterSpacing?: number;
        } = {}
    ): {
        points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean; glyphIndex: number; pointIndex: number }>;
        advanceWidth: number;
        scale: number;
    } {
        const layout = this.layoutString(text, options);
        const sampleBase = Number.isFinite(options.sampleStep) ? (options.sampleStep as number) : 1;
        const sampleStep = Math.max(1, Math.floor(sampleBase));
        const unitsPerEm = this.getUnitsPerEm();
        const safeUnitsPerEm = Number.isFinite(unitsPerEm) && unitsPerEm > 0 ? unitsPerEm : 1000;
        const fontSize = Number.isFinite(options.fontSize) && (options.fontSize as number) > 0
            ? (options.fontSize as number)
            : safeUnitsPerEm;
        const scale = fontSize / safeUnitsPerEm;
        const originX = Number.isFinite(options.x) ? (options.x as number) : 0;
        const originY = Number.isFinite(options.y) ? (options.y as number) : 0;
        const letterSpacing = Number.isFinite(options.letterSpacing) ? (options.letterSpacing as number) : 0;
        const points: Array<{ x: number; y: number; onCurve: boolean; endOfContour: boolean; glyphIndex: number; pointIndex: number }> = [];

        let penX = 0;
        for (let i = 0; i < layout.length; i++) {
            const item = layout[i];
            const glyph = this.getGlyph(item.glyphIndex);
            if (glyph) {
                for (let pIndex = 0; pIndex < glyph.getPointCount(); pIndex += sampleStep) {
                    const p = glyph.getPoint(pIndex);
                    if (!p) continue;
                    points.push({
                        x: originX + (penX + (Number.isFinite(item.xOffset) ? item.xOffset : 0) + p.x) * scale,
                        y: originY - ((Number.isFinite(item.yOffset) ? item.yOffset : 0) + p.y) * scale,
                        onCurve: p.onCurve,
                        endOfContour: p.endOfContour,
                        glyphIndex: item.glyphIndex,
                        pointIndex: pIndex
                    });
                }
            }
            penX += Number.isFinite(item.xAdvance) ? item.xAdvance : 0;
            if (letterSpacing !== 0 && i < layout.length - 1) penX += letterSpacing;
        }

        return { points, advanceWidth: Number.isFinite(penX) ? penX : 0, scale: Number.isFinite(scale) ? scale : 1 };
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

    public getColrV1LayersForGlyph(glyphId: number, paletteIndex: number = 0): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        if (!this.colr || this.colr.version === 0) return [];
        const paint = this.colr.getPaintForGlyph(glyphId);
        if (!paint) return [];
        return this.flattenColrV1Paint(paint, paletteIndex);
    }

    private flattenColrV1Paint(paint: any, paletteIndex: number): Array<{ glyphId: number; color: string | null; paletteIndex: number }> {
        if (!paint) return [];
        if (paint.format === 1 && Array.isArray(paint.layers)) {
            return paint.layers.flatMap((p: any) => this.flattenColrV1Paint(p, paletteIndex));
        }
        if (paint.format === 10) {
            const child = paint.paint;
            if (child && child.format === 2) {
                const color = this.cpal?.getPalette(paletteIndex)?.[child.paletteIndex];
                const rgba = color ? `rgba(${color.red}, ${color.green}, ${color.blue}, ${(color.alpha / 255) * (child.alpha ?? 1)})` : null;
                return [{ glyphId: paint.glyphID, color: rgba, paletteIndex: child.paletteIndex }];
            }
            return this.flattenColrV1Paint(child, paletteIndex).map(layer => ({ ...layer, glyphId: paint.glyphID }));
        }
        if (paint.format === 11) {
            return this.getColrV1LayersForGlyph(paint.glyphID, paletteIndex);
        }
        return [];
    }

    public getMarkAnchorsForGlyph(
        glyphId: number,
        subtables?: Array<any>
    ): Array<{ type: 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit'; classIndex: number; x: number; y: number; componentIndex?: number }> {
        if (!this.gpos) return [];
        const anchors: Array<{ type: 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit'; classIndex: number; x: number; y: number; componentIndex?: number }> = [];
        const activeSubtables = subtables ?? (() => {
            const lookups = this.gpos?.lookupList?.getLookups?.() ?? [];
            const all: any[] = [];
            for (const lookup of lookups) {
                if (!lookup) continue;
                for (let i = 0; i < lookup.getSubtableCount(); i++) {
                    const st = lookup.getSubtable(i);
                    if (st) all.push(st);
                }
            }
            return all;
        })();

        for (const st of activeSubtables) {
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
                        lig?.components?.forEach((component, componentIndex) => {
                            component.forEach((anchor, classIndex) => {
                                if (anchor) {
                                    anchors.push({ type: 'ligature', classIndex, x: anchor.x, y: anchor.y, componentIndex });
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
        return anchors;
    }

    public async getSvgDocumentForGlyphAsync(glyphId: number): Promise<{ svgText: string | null; isCompressed: boolean }> {
        if (!this.svg) return { svgText: null, isCompressed: false };
        return this.svg.getSvgDocumentForGlyphAsync(glyphId);
    }

    private applyIupDeltas(base: IGlyphDescription, dx: number[], dy: number[], touched: boolean[]): void {
        const pointCount = base.getPointCount();
        if (pointCount === 0) return;
        const endPts: number[] = [];
        for (let c = 0; c < base.getContourCount(); c++) {
            endPts.push(base.getEndPtOfContours(c));
        }

        let start = 0;
        for (const end of endPts) {
            const indices: number[] = [];
            const touchedIndices: number[] = [];
            for (let i = start; i <= end; i++) {
                indices.push(i);
                if (touched[i]) touchedIndices.push(i);
            }
            if (touchedIndices.length === 0) {
                start = end + 1;
                continue;
            }
            if (touchedIndices.length === 1) {
                const idx = touchedIndices[0];
                for (const i of indices) {
                    dx[i] = dx[idx];
                    dy[i] = dy[idx];
                }
                start = end + 1;
                continue;
            }

            const contour = indices;
            const total = contour.length;
            const order = touchedIndices.map(i => contour.indexOf(i)).sort((a, b) => a - b);
            const coordsX = contour.map(i => base.getXCoordinate(i));
            const coordsY = contour.map(i => base.getYCoordinate(i));

            for (let t = 0; t < order.length; t++) {
                const a = order[t];
                const b = order[(t + 1) % order.length];
                let idx = (a + 1) % total;
                while (idx !== b) {
                    const globalIndex = contour[idx];
                    const ax = coordsX[a];
                    const bx = coordsX[b];
                    const ay = coordsY[a];
                    const by = coordsY[b];
                    const px = coordsX[idx];
                    const py = coordsY[idx];
                    dx[globalIndex] = this.interpolate(ax, bx, dx[contour[a]], dx[contour[b]], px);
                    dy[globalIndex] = this.interpolate(ay, by, dy[contour[a]], dy[contour[b]], py);
                    idx = (idx + 1) % total;
                }
            }
            start = end + 1;
        }
    }

    private interpolate(aCoord: number, bCoord: number, aDelta: number, bDelta: number, pCoord: number): number {
        if (aCoord === bCoord) return aDelta;
        const t = (pCoord - aCoord) / (bCoord - aCoord);
        const clamped = Math.max(0, Math.min(1, t));
        return aDelta + (bDelta - aDelta) * clamped;
    }

    public getGlyphIndexByChar(char: string): number | null {
        if (!char || char.length === 0) {
            this.emitDiagnostic("INVALID_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar expects a character.");
            return null;
        }
        if (Array.from(char).length > 1) {
            this.emitDiagnostic(
                "MULTI_CHAR_INPUT",
                "warning",
                "parse",
                "getGlyphIndexByChar received multiple characters; using the first code point.",
                undefined,
                "MULTI_CHAR_INPUT"
            );
        }

        const codePoint = char.codePointAt(0);
        if (codePoint == null) {
            this.emitDiagnostic("CODE_POINT_RESOLVE_FAILED", "warning", "parse", "Failed to resolve code point for character.");
            return null;
        }

        if (!this.cmap) {
            this.emitDiagnostic("MISSING_TABLE_CMAP", "warning", "parse", "No cmap table available.", undefined, "MISSING_TABLE_CMAP");
            return null;
        }
        let cmapFormat: any = null;
        try {
            cmapFormat = this.getBestCmapFormatFor(codePoint);
        } catch {
            this.emitDiagnostic(
                "CMAP_FORMAT_RESOLVE_FAILED",
                "warning",
                "parse",
                "Failed while resolving preferred cmap format; using fallback format order.",
                { codePoint },
                "CMAP_FORMAT_RESOLVE_FAILED"
            );
            const fallbackFormats = Array.isArray(this.cmap.formats)
                ? this.cmap.formats.filter((fmt): fmt is NonNullable<typeof fmt> => fmt != null)
                : [];
            cmapFormat = this.pickBestFormat(fallbackFormats);
        }
        if (!cmapFormat) {
            this.emitDiagnostic("MISSING_CMAP_FORMAT", "warning", "parse", "No cmap format available for code point.", { codePoint });
            return null;
        }

        let glyphIndex: unknown = null;
        try {
            if (typeof cmapFormat.getGlyphIndex === "function") {
                glyphIndex = cmapFormat.getGlyphIndex(codePoint);
            } else if (typeof cmapFormat.mapCharCode === "function") {
                glyphIndex = cmapFormat.mapCharCode(codePoint);
            } else {
                this.emitDiagnostic(
                    "UNSUPPORTED_CMAP_FORMAT",
                    "warning",
                    "parse",
                    "Selected cmap format does not expose getGlyphIndex/mapCharCode.",
                    { codePoint },
                    "UNSUPPORTED_CMAP_FORMAT"
                );
                return null;
            }
        } catch {
            this.emitDiagnostic(
                "CMAP_LOOKUP_FAILED",
                "warning",
                "parse",
                "cmap glyph lookup failed for code point.",
                { codePoint }
            );
            return null;
        }

        if (typeof glyphIndex !== "number" || !Number.isFinite(glyphIndex) || glyphIndex === 0) return null;
        return glyphIndex;
    }

    public getGlyphByChar(char: string): GlyphData | null {
        const idx = this.getGlyphIndexByChar(char);
        if (idx == null) return null;
        return this.getGlyph(idx);
    }

    public getGlyphIndicesForStringWithGsub(text: string, featureTags: string[] = ["liga"], scriptTags: string[] = ["DFLT", "latn"]): number[] {
        const glyphs = [];
        for (const ch of Array.from(text)) {
            const idx = this.getGlyphIndexByChar(ch);
            if (idx != null) glyphs.push(idx);
        }
        if (!this.gsub || glyphs.length === 0) {
            if (!this.gsub && glyphs.length > 0) {
                this.emitDiagnostic("MISSING_TABLE_GSUB", "info", "layout", "GSUB table not present; using direct glyph mapping.", undefined, "MISSING_TABLE_GSUB");
            }
            return glyphs;
        }
        return this.gsub.applyFeatures(glyphs, featureTags, scriptTags);
    }

    public getKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        if (!this.kern) return 0;
        if (typeof this.kern.getKerningValue === "function") {
            try {
                const value = this.kern.getKerningValue(leftGlyph, rightGlyph);
                return typeof value === 'number' && Number.isFinite(value) ? value : 0;
            } catch {
                return 0;
            }
        }
        return 0;
    }

    public getGposKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        if (!this.gpos) {
            this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "GPOS table not present; kerning defaults to 0.", undefined, "MISSING_TABLE_GPOS");
            return 0;
        }
        const lookups = this.gpos.lookupList?.getLookups?.() ?? [];
        let value = 0;
        for (const lookup of lookups) {
            if (!lookup || lookup.getType() !== 2) continue;
            for (let i = 0; i < lookup.getSubtableCount(); i++) {
                const st = lookup.getSubtable(i);
                if (st instanceof PairPosFormat1 || st instanceof PairPosFormat2) {
                    try {
                        const kern = st.getKerning(leftGlyph, rightGlyph);
                        value += Number.isFinite(kern) ? kern : 0;
                    } catch {
                        // Ignore malformed pair subtables and continue.
                    }
                }
            }
        }
        return Number.isFinite(value) ? value : 0;
    }

    public getKerningValue(leftChar: string, rightChar: string): number {
        const left = this.getGlyphIndexByChar(leftChar);
        const right = this.getGlyphIndexByChar(rightChar);
        if (left == null || right == null) return 0;
        const kern = this.getKerningValueByGlyphs(left, right);
        if (kern !== 0) return kern;
        return this.getGposKerningValueByGlyphs(left, right);
    }

    public getVariationAxes(): FvarTable['axes'] {
        return this.fvar?.axes ?? [];
    }

    public setVariationCoords(coords: number[]): void {
        this.variationCoords = coords.slice();
        if (this.colr && typeof (this.colr as any).setVariationCoords === 'function') {
            (this.colr as any).setVariationCoords(coords);
        }
    }

    public setVariationByAxes(values: Record<string, number>): void {
        if (!this.fvar) return;
        const coords: number[] = [];
        for (const axis of this.fvar.axes) {
            const tag = axis.name;
            const value = values[tag] ?? axis.defaultValue;
            let norm = 0;
            if (value !== axis.defaultValue) {
                if (value > axis.defaultValue) {
                    const span = axis.maxValue - axis.defaultValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                } else {
                    const span = axis.defaultValue - axis.minValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                }
            }
            coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
        }
        this.setVariationCoords(coords);
    }

    public layoutString(
        text: string,
        options: { gsubFeatures?: string[]; scriptTags?: string[]; gpos?: boolean; gposFeatures?: string[] } = {}
    ): Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }> {
        const gsubFeatures = options.gsubFeatures ?? ["liga"];
        const scriptTags = options.scriptTags ?? ["DFLT", "latn"];
        const gposFeatures = options.gposFeatures ?? ["kern", "mark", "mkmk", "curs"];
        const glyphIndices = this.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);

        const positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }> = [];
        for (let i = 0; i < glyphIndices.length; i++) {
            const glyphIndex = glyphIndices[i];
            const glyph = this.getGlyph(glyphIndex);

            let kern = 0;
            if (i < glyphIndices.length - 1) {
                kern = this.getKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                if (kern === 0) {
                    kern = this.getGposKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                }
            }

            positioned.push({
                glyphIndex,
                xAdvance: this.isMarkGlyphClass(glyphIndex) ? 0 : (glyph?.advanceWidth ?? 0) + kern,
                xOffset: 0,
                yOffset: 0,
                yAdvance: 0,
            });
        }
        if (options.gpos) {
            if (!this.gpos) {
                this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "Requested GPOS positioning, but GPOS table is unavailable.", undefined, "MISSING_TABLE_GPOS");
            }
            this.applyGposPositioning(glyphIndices, positioned, gposFeatures, scriptTags);
        }
        return positioned;
    }

    private applyGposPositioning(
        glyphIndices: number[],
        positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }>,
        gposFeatures: string[],
        scriptTags: string[]
    ): void {
        if (!this.gpos) return;
        const subtables = this.gpos.getSubtablesForFeatures(gposFeatures, scriptTags);

        for (const st of subtables) {
            if (
                st instanceof SinglePosSubtable ||
                typeof (st as any).getAdjustment === 'function'
            ) {
                for (let i = 0; i < glyphIndices.length; i++) {
                    if (!positioned[i]) continue;
                    const adj = (st as any).getAdjustment?.(glyphIndices[i]);
                    if (!adj) continue;
                    positioned[i].xOffset += adj.xPlacement ?? 0;
                    positioned[i].yOffset += adj.yPlacement ?? 0;
                    positioned[i].xAdvance += adj.xAdvance ?? 0;
                    positioned[i].yAdvance += adj.yAdvance ?? 0;
                }
            }
            if (
                st instanceof PairPosSubtable ||
                st instanceof PairPosFormat1 ||
                st instanceof PairPosFormat2 ||
                typeof (st as any).getPairValue === 'function'
            ) {
                for (let i = 0; i < glyphIndices.length - 1; i++) {
                    if (!positioned[i] || !positioned[i + 1]) continue;
                    const pair = (st as any).getPairValue?.(glyphIndices[i], glyphIndices[i + 1]);
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
                continue;
            }
            // These attachment subtables are applied in the second pass below.
            if (
                st instanceof MarkBasePosFormat1 ||
                st instanceof MarkLigPosFormat1 ||
                st instanceof MarkMarkPosFormat1 ||
                st instanceof CursivePosFormat1
            ) {
                continue;
            }
            const constructorName = (st as any)?.constructor?.name ?? "unknown";
            this.emitDiagnostic(
                "UNSUPPORTED_GPOS_SUBTABLE",
                "info",
                "layout",
                `Encountered GPOS subtable not currently handled: ${constructorName}.`,
                { constructorName },
                `UNSUPPORTED_GPOS_SUBTABLE:${constructorName}`
            );
        }

        const markSubtables = subtables.filter(st =>
            st instanceof MarkBasePosFormat1 ||
            st instanceof MarkLigPosFormat1 ||
            st instanceof MarkMarkPosFormat1 ||
            st instanceof CursivePosFormat1
        );

        const anchorsCache = new Map<number, ReturnType<FontParserWOFF['getMarkAnchorsForGlyph']>>();

        const getAnchors = (gid: number) => {
            if (anchorsCache.has(gid)) return anchorsCache.get(gid)!;
            const anchors = this.getMarkAnchorsForGlyph(gid, markSubtables);
            anchorsCache.set(gid, anchors);
            return anchors;
        };

        const getBaseAnchor = (anchors: ReturnType<FontParserWOFF['getMarkAnchorsForGlyph']>, classIndex: number) => {
            const candidates = anchors.filter(a =>
                (a.type === 'base' || a.type === 'ligature' || a.type === 'mark2') && a.classIndex === classIndex
            );
            if (candidates.length === 0) return null;

            // For marks after ligatures, default to the trailing ligature component anchor.
            const ligatureCandidates = candidates.filter(a => a.type === 'ligature');
            if (ligatureCandidates.length > 0) {
                return ligatureCandidates.reduce((best, current) =>
                    (current.componentIndex ?? -1) > (best.componentIndex ?? -1) ? current : best
                );
            }
            return candidates[0];
        };

        const isMarkGlyph = (gid: number) => this.isMarkGlyphClass(gid);

        for (let i = 0; i < glyphIndices.length; i++) {
            if (!positioned[i]) continue;
            const gid = glyphIndices[i];
            const anchors = getAnchors(gid);
            const markAnchor = anchors.find(a => a.type === 'mark');
            if (!markAnchor) continue;

            let attached = false;
            // Prefer mark-to-mark attachment when available.
            let prev = i - 1;
            while (prev >= 0) {
                const prevGid = glyphIndices[prev];
                if (!isMarkGlyph(prevGid)) {
                    prev--;
                    continue;
                }
                const prevAnchors = getAnchors(prevGid);
                const mark2 = prevAnchors.find(a => a.type === 'mark2' && a.classIndex === markAnchor.classIndex);
                if (mark2) {
                    // Inherit parent mark placement so stacked marks follow prior attachments.
                    positioned[i].xOffset += (positioned[prev]?.xOffset ?? 0) + (mark2.x - markAnchor.x);
                    positioned[i].yOffset += (positioned[prev]?.yOffset ?? 0) + (mark2.y - markAnchor.y);
                    positioned[i].xAdvance = 0;
                    attached = true;
                    break;
                }
                prev--;
            }
            if (attached) continue;

            // Fall back to base/ligature anchor, skipping marks.
            let baseIndex = i - 1;
            while (baseIndex >= 0) {
                const baseGid = glyphIndices[baseIndex];
                if (isMarkGlyph(baseGid)) {
                    baseIndex--;
                    continue;
                }
                const baseAnchors = getAnchors(baseGid);
                const baseAnchor = getBaseAnchor(baseAnchors, markAnchor.classIndex);
                if (baseAnchor) {
                    // Inherit base placement so mark anchors remain stable after prior GPOS shifts.
                    positioned[i].xOffset += (positioned[baseIndex]?.xOffset ?? 0) + (baseAnchor.x - markAnchor.x);
                    positioned[i].yOffset += (positioned[baseIndex]?.yOffset ?? 0) + (baseAnchor.y - markAnchor.y);
                    positioned[i].xAdvance = 0;
                    break;
                }
                baseIndex--;
            }
        }

        for (let i = 1; i < glyphIndices.length; i++) {
            if (!positioned[i]) continue;
            const prevAnchors = getAnchors(glyphIndices[i - 1]);
            const currAnchors = getAnchors(glyphIndices[i]);
            const exitAnchor = prevAnchors.find(a => a.type === 'cursive-exit');
            const entryAnchor = currAnchors.find(a => a.type === 'cursive-entry');
            if (exitAnchor && entryAnchor) {
                positioned[i].xOffset += exitAnchor.x - entryAnchor.x;
                positioned[i].yOffset += exitAnchor.y - entryAnchor.y;
            }
        }

        for (let i = 0; i < glyphIndices.length; i++) {
            if (positioned[i] && this.isMarkGlyphClass(glyphIndices[i])) {
                positioned[i].xAdvance = 0;
            }
        }
    }

    private isMarkGlyphClass(glyphId: number): boolean {
        return (this.gdef?.getGlyphClass?.(glyphId) ?? 0) === 3;
    }

    public getNameRecord(nameId: number): string {
        return this.pName?.getRecord(nameId) ?? "";
    }

    public getAllNameRecords(): Array<{ nameId: number; record: string }> {
        if (!this.pName) return [];
        return this.pName.records.map(r => ({ nameId: r.nameId, record: r.record }));
    }

    public getAllNameRecordsDetailed(): Array<{ nameId: number; record: string; platformId: number; encodingId: number; languageId: number }> {
        if (!this.pName) return [];
        return this.pName.records.map(r => ({
            nameId: r.nameId,
            record: r.record,
            platformId: r.platformId,
            encodingId: r.encodingId,
            languageId: r.languageId
        }));
    }

    public getFontNames(): {
        family: string;
        subfamily: string;
        fullName: string;
        postScriptName: string;
        version: string;
        uniqueSubfamily: string;
        manufacturer: string;
        designer: string;
        description: string;
        vendorUrl: string;
        designerUrl: string;
        license: string;
        licenseUrl: string;
        typographicFamily: string;
        typographicSubfamily: string;
    } {
        return {
            family: this.getPreferredNameRecord(1),
            subfamily: this.getPreferredNameRecord(2),
            uniqueSubfamily: this.getPreferredNameRecord(3),
            fullName: this.getPreferredNameRecord(4),
            version: this.getPreferredNameRecord(5),
            postScriptName: this.getPreferredNameRecord(6),
            manufacturer: this.getPreferredNameRecord(8),
            designer: this.getPreferredNameRecord(9),
            description: this.getPreferredNameRecord(10),
            vendorUrl: this.getPreferredNameRecord(11),
            designerUrl: this.getPreferredNameRecord(12),
            license: this.getPreferredNameRecord(13),
            licenseUrl: this.getPreferredNameRecord(14),
            typographicFamily: this.getPreferredNameRecord(16),
            typographicSubfamily: this.getPreferredNameRecord(17)
        };
    }

    public getOs2Metrics(): {
        version: number;
        weightClass: number;
        widthClass: number;
        fsType: number;
        fsSelection: number;
        typoAscender: number;
        typoDescender: number;
        typoLineGap: number;
        winAscent: number;
        winDescent: number;
        firstCharIndex: number;
        lastCharIndex: number;
        vendorId: string;
        unicodeRanges: [number, number, number, number];
        codePageRanges: [number, number];
        xHeight: number | null;
        capHeight: number | null;
        defaultChar: number | null;
        breakChar: number | null;
        maxContext: number | null;
        lowerOpticalPointSize: number | null;
        upperOpticalPointSize: number | null;
        panose: {
            familyType: number;
            serifStyle: number;
            weight: number;
            proportion: number;
            contrast: number;
            strokeVariation: number;
            armStyle: number;
            letterform: number;
            midline: number;
            xHeight: number;
        } | null;
    } | null {
        if (!this.os2) return null;
        return {
            version: this.os2.version,
            weightClass: this.os2.usWeightClass,
            widthClass: this.os2.usWidthClass,
            fsType: this.os2.fsType,
            fsSelection: this.os2.fsSelection,
            typoAscender: this.os2.sTypoAscender,
            typoDescender: this.os2.sTypoDescender,
            typoLineGap: this.os2.sTypoLineGap,
            winAscent: this.os2.usWinAscent,
            winDescent: this.os2.usWinDescent,
            firstCharIndex: this.os2.usFirstCharIndex,
            lastCharIndex: this.os2.usLastCharIndex,
            vendorId: this.decodeOs2VendorId(this.os2.achVendorID),
            unicodeRanges: [
                this.os2.ulUnicodeRange1,
                this.os2.ulUnicodeRange2,
                this.os2.ulUnicodeRange3,
                this.os2.ulUnicodeRange4
            ],
            codePageRanges: [
                this.os2.ulCodePageRange1,
                this.os2.ulCodePageRange2
            ],
            xHeight: this.os2.version >= 2 ? this.os2.sxHeight : null,
            capHeight: this.os2.version >= 2 ? this.os2.sCapHeight : null,
            defaultChar: this.os2.version >= 2 ? this.os2.usDefaultChar : null,
            breakChar: this.os2.version >= 2 ? this.os2.usBreakChar : null,
            maxContext: this.os2.version >= 2 ? this.os2.usMaxContext : null,
            lowerOpticalPointSize: this.os2.version >= 5 ? this.os2.usLowerOpticalPointSize : null,
            upperOpticalPointSize: this.os2.version >= 5 ? this.os2.usUpperOpticalPointSize : null,
            panose: this.os2.panose
                ? {
                    familyType: this.os2.panose.bFamilyType,
                    serifStyle: this.os2.panose.bSerifStyle,
                    weight: this.os2.panose.bWeight,
                    proportion: this.os2.panose.bProportion,
                    contrast: this.os2.panose.bContrast,
                    strokeVariation: this.os2.panose.bStrokeVariation,
                    armStyle: this.os2.panose.bArmStyle,
                    letterform: this.os2.panose.bLetterform,
                    midline: this.os2.panose.bMidline,
                    xHeight: this.os2.panose.bXHeight
                }
                : null
        };
    }

    public getPostMetrics(): {
        version: number;
        italicAngle: number;
        underlinePosition: number;
        underlineThickness: number;
        isFixedPitch: boolean;
        rawIsFixedPitch: number;
    } | null {
        if (!this.post) return null;
        return {
            version: this.post.version / 65536,
            italicAngle: this.post.italicAngle / 65536,
            underlinePosition: this.post.underlinePosition,
            underlineThickness: this.post.underlineThickness,
            isFixedPitch: this.post.isFixedPitch !== 0,
            rawIsFixedPitch: this.post.isFixedPitch
        };
    }

    public getWeightClass(): number {
        return this.os2?.usWeightClass ?? 0;
    }

    public getWidthClass(): number {
        return this.os2?.usWidthClass ?? 0;
    }

    public getFsTypeFlags(): string[] {
        const fsType = this.os2?.fsType ?? 0;
        if (fsType === 0) return ['installable-embedding'];
        const flags: string[] = [];
        if (fsType & 0x0002) flags.push('restricted-license-embedding');
        if (fsType & 0x0004) flags.push('preview-print-embedding');
        if (fsType & 0x0008) flags.push('editable-embedding');
        if (fsType & 0x0100) flags.push('no-subsetting');
        if (fsType & 0x0200) flags.push('bitmap-embedding-only');
        return flags;
    }

    public getFsSelectionFlags(): string[] {
        const fsSelection = this.os2?.fsSelection ?? 0;
        const flags: string[] = [];
        if (fsSelection & 0x0001) flags.push('italic');
        if (fsSelection & 0x0002) flags.push('underscore');
        if (fsSelection & 0x0004) flags.push('negative');
        if (fsSelection & 0x0008) flags.push('outlined');
        if (fsSelection & 0x0010) flags.push('strikeout');
        if (fsSelection & 0x0020) flags.push('bold');
        if (fsSelection & 0x0040) flags.push('regular');
        if (fsSelection & 0x0080) flags.push('use-typo-metrics');
        if (fsSelection & 0x0100) flags.push('wws');
        if (fsSelection & 0x0200) flags.push('oblique');
        return flags;
    }

    public isItalic(): boolean {
        const fsSelection = this.os2?.fsSelection ?? 0;
        if (fsSelection & 0x0001) return true;
        if (fsSelection & 0x0200) return true;
        if ((this.post?.italicAngle ?? 0) !== 0) return true;
        const subfamily = this.getPreferredNameRecord(2).toLowerCase();
        return subfamily.includes('italic') || subfamily.includes('oblique');
    }

    public isBold(): boolean {
        const fsSelection = this.os2?.fsSelection ?? 0;
        if (fsSelection & 0x0020) return true;
        if ((this.os2?.usWeightClass ?? 0) >= 700) return true;
        return this.getPreferredNameRecord(2).toLowerCase().includes('bold');
    }

    public isMonospace(): boolean {
        return (this.post?.isFixedPitch ?? 0) !== 0;
    }

    public getMetadata(): {
        names: ReturnType<FontParserWOFF['getFontNames']>;
        nameRecords: ReturnType<FontParserWOFF['getAllNameRecordsDetailed']>;
        os2: ReturnType<FontParserWOFF['getOs2Metrics']>;
        post: ReturnType<FontParserWOFF['getPostMetrics']>;
        style: {
            isBold: boolean;
            isItalic: boolean;
            isMonospace: boolean;
            weightClass: number;
            widthClass: number;
            fsTypeFlags: string[];
            fsSelectionFlags: string[];
        };
    } {
        return {
            names: this.getFontNames(),
            nameRecords: this.getAllNameRecordsDetailed(),
            os2: this.getOs2Metrics(),
            post: this.getPostMetrics(),
            style: {
                isBold: this.isBold(),
                isItalic: this.isItalic(),
                isMonospace: this.isMonospace(),
                weightClass: this.getWeightClass(),
                widthClass: this.getWidthClass(),
                fsTypeFlags: this.getFsTypeFlags(),
                fsSelectionFlags: this.getFsSelectionFlags()
            }
        };
    }

    private getPreferredNameRecord(nameId: number): string {
        if (!this.pName || this.pName.records.length === 0) return '';
        const candidates = this.pName.records.filter(r => r.nameId === nameId && !!r.record && r.record.trim().length > 0);
        if (candidates.length === 0) return '';

        const score = (rec: { platformId: number; languageId: number }): number => {
            let s = 0;
            if (rec.platformId === Table.platformMicrosoft) s += 100;
            else if (rec.platformId === Table.platformAppleUnicode) s += 80;
            else if (rec.platformId === Table.platformMacintosh) s += 60;

            if (rec.languageId === 0x0409) s += 30; // English (US)
            if (rec.languageId === 0) s += 10;
            return s;
        };

        let best = candidates[0];
        let bestScore = score(best);
        for (let i = 1; i < candidates.length; i++) {
            const current = candidates[i];
            const currentScore = score(current);
            if (currentScore > bestScore) {
                best = current;
                bestScore = currentScore;
            }
        }
        return best.record;
    }

    private decodeOs2VendorId(vendor: number): string {
        const n = vendor >>> 0;
        const text = String.fromCharCode(
            (n >>> 24) & 0xff,
            (n >>> 16) & 0xff,
            (n >>> 8) & 0xff,
            n & 0xff
        );
        return text.replace(/\0/g, '').trim();
    }

    public getTableByType(tableType: number): ITable | null {
        return this.getTable(tableType);
    }

    public getNameInfo(): {
        family: string;
        subfamily: string;
        fullName: string;
        postScriptName: string;
        version: string;
        manufacturer: string;
        designer: string;
        description: string;
        typoFamily: string;
        typoSubfamily: string;
    } {
        return {
            family: this.getNameRecord(1),
            subfamily: this.getNameRecord(2),
            fullName: this.getNameRecord(4),
            postScriptName: this.getNameRecord(6),
            version: this.getNameRecord(5),
            manufacturer: this.getNameRecord(8),
            designer: this.getNameRecord(9),
            description: this.getNameRecord(10),
            typoFamily: this.getNameRecord(16),
            typoSubfamily: this.getNameRecord(17)
        };
    }

    public getOs2Info(): {
        weightClass: number;
        widthClass: number;
        typoAscender: number;
        typoDescender: number;
        typoLineGap: number;
        winAscent: number;
        winDescent: number;
        unicodeRanges: number[];
        codePageRanges: number[];
        vendorId: string;
        fsSelection: number;
    } | null {
        if (!this.os2) return null;
        const vendorId = String.fromCharCode(
            (this.os2.achVendorID >> 24) & 0xff,
            (this.os2.achVendorID >> 16) & 0xff,
            (this.os2.achVendorID >> 8) & 0xff,
            this.os2.achVendorID & 0xff
        ).replace(/\0/g, '');
        return {
            weightClass: this.os2.usWeightClass,
            widthClass: this.os2.usWidthClass,
            typoAscender: this.os2.sTypoAscender,
            typoDescender: this.os2.sTypoDescender,
            typoLineGap: this.os2.sTypoLineGap,
            winAscent: this.os2.usWinAscent,
            winDescent: this.os2.usWinDescent,
            unicodeRanges: [this.os2.ulUnicodeRange1, this.os2.ulUnicodeRange2, this.os2.ulUnicodeRange3, this.os2.ulUnicodeRange4],
            codePageRanges: [this.os2.ulCodePageRange1, this.os2.ulCodePageRange2],
            vendorId,
            fsSelection: this.os2.fsSelection
        };
    }

    public getPostInfo(): {
        italicAngle: number;
        underlinePosition: number;
        underlineThickness: number;
        isFixedPitch: number;
    } | null {
        if (!this.post) return null;
        return {
            italicAngle: this.post.italicAngle / 65536,
            underlinePosition: this.post.underlinePosition,
            underlineThickness: this.post.underlineThickness,
            isFixedPitch: this.post.isFixedPitch
        };
    }

    // Return a table by type
    private getTable(tableType: any): ITable | null {
        return this.tables.find(tab => tab?.getType() === tableType) || null;
    }

    protected getCmapTableForLookup(): any | null {
        return this.cmap as any;
    }
}

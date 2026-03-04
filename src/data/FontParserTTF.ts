import { ByteArray } from '../utils/ByteArray.js';
import { Os2Table } from '../table/Os2Table.js';
import { CmapTable } from '../table/CmapTable.js';
import { GlyfTable } from '../table/GlyfTable.js';
import { CffTable } from '../table/CffTable.js';
import { Cff2Table } from '../table/Cff2Table.js';
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
import { FvarTable } from '../table/FvarTable.js';
import { detectScriptTags } from '../utils/ScriptDetector.js';

export class FontParserTTF {
    // Define properties
    private os2: Os2Table | null = null;
    private cmap: CmapTable | null = null;
    private glyf: GlyfTable | null = null;
    private cff: CffTable | null = null;
    private cff2: Cff2Table | null = null;
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
    private fvar: FvarTable | null = null;

    // Table directory and tables
    private tableDir: TableDirectory | null = null;
    private tables: Array<any> = [];

    // Static load method that returns a Promise
    static load(url: string): Promise<FontParserTTF> {
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.arrayBuffer();
            })
            .then(arrayBuffer => new ByteArray(new Uint8Array(arrayBuffer))) // Wrap in ByteArray
            .then(byteArray => new FontParserTTF(byteArray)) // Create and initialize FontParserTTF
            .catch(error => {
                console.error('Error loading font:', error);
                throw error; // Propagate error for further handling if needed
            });
    }

    constructor(byteData: ByteArray) {
        this.init(byteData);
    }

    // Initialize the FontParserTTF instance
    private init(byteData: ByteArray): void {
        // Initialize the table directory
        this.tableDir = new TableDirectory(byteData);
        this.tables = [];

        // Load each of the tables
        for (let i = 0; i < this.tableDir.numTables; i++) {
            const tf = new TableFactory();
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
        this.cff2 = this.getTable(Table.CFF2) as Cff2Table | null;
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
        this.fvar = this.getTable(Table.fvar) as FvarTable | null;
        if (this.cff2 && this.fvar && this.fvar.axes.length > 0) {
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


    public getGlyphIndexByChar(char: string): number | null {
        if (!char || char.length === 0) {
            console.error("getGlyphIndexByChar expects a character");
            return null;
        }
        if (char.length > 2) {
            console.warn("getGlyphIndexByChar received multiple characters; using the first code point");
        }

        const codePoint = char.codePointAt(0); // Convert character to Unicode code point
        if (codePoint == null) {
            console.error("Failed to get code point for character");
            return null;
        }

        if (!this.cmap) {
            console.warn("No cmap table available");
            return null;
        }

        const cmapFormat = this.getBestCmapFormatFor(codePoint);
        if (!cmapFormat) {
            console.warn("No cmap format available");
            return null;
        }

        const glyphIndex = typeof cmapFormat.getGlyphIndex === "function"
            ? cmapFormat.getGlyphIndex(codePoint)
            : cmapFormat.mapCharCode(codePoint);

        if (glyphIndex == null || glyphIndex === 0) {
            return null;
        }

        return glyphIndex;
    }

    public getGlyphByChar(char: string): GlyphData | null {
        const glyphIndex = this.getGlyphIndexByChar(char);
        if (glyphIndex == null) return null;
        return this.getGlyph(glyphIndex);
    }

    public getGlyphIndicesForString(text: string): number[] {
        const indices: number[] = [];
        for (const ch of text) {
            const idx = this.getGlyphIndexByChar(ch);
            if (idx != null) indices.push(idx);
        }
        return indices;
    }

    public getGlyphIndicesForStringWithGsub(text: string, featureTags: string[] = ["liga"], scriptTags: string[] = ["DFLT", "latn"]): number[] {
        const glyphs = this.getGlyphIndicesForString(text);
        if (!this.gsub || glyphs.length === 0) return glyphs;

        const subtables = this.gsub.getSubtablesForFeatures(featureTags, scriptTags);

        let result = glyphs.slice();
        for (const st of subtables) {
            if (!st) continue;

            if (typeof (st as any).substitute === "function") {
                result = result.map(g => (st as any).substitute(g));
                continue;
            }

            if (typeof (st as any).applyToGlyphs === "function") {
                result = (st as any).applyToGlyphs(result);
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

    public getVariationAxes(): FvarTable['axes'] {
        return this.fvar?.axes ?? [];
    }

    public setVariationCoords(coords: number[]): void {
        if (!this.cff2) return;
        this.cff2.setVariationCoords(coords);
    }

    public setVariationByAxes(values: Record<string, number>): void {
        if (!this.cff2 || !this.fvar) return;
        const coords: number[] = [];
        for (const axis of this.fvar.axes) {
            const tag = axis.name;
            const value = values[tag] ?? axis.defaultValue;
            const norm = value === axis.defaultValue
                ? 0
                : value > axis.defaultValue
                    ? (value - axis.defaultValue) / (axis.maxValue - axis.defaultValue)
                    : (value - axis.defaultValue) / (axis.defaultValue - axis.minValue);
            coords.push(Math.max(-1, Math.min(1, norm)));
        }
        this.cff2.setVariationCoords(coords);
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

    public layoutStringAuto(
        text: string,
        options: { gpos?: boolean } = {}
    ): Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }> {
        const detection = detectScriptTags(text);
        return this.layoutString(text, {
            gsubFeatures: detection.features,
            scriptTags: detection.scripts,
            gpos: options.gpos ?? true
        });
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

        const anchorsCache = new Map<number, ReturnType<FontParserTTF['getMarkAnchorsForGlyph']>>();

        const getAnchors = (gid: number) => {
            if (anchorsCache.has(gid)) return anchorsCache.get(gid)!;
            const anchors = this.getMarkAnchorsForGlyph(gid);
            anchorsCache.set(gid, anchors);
            return anchors;
        };

        const getBaseAnchor = (anchors: ReturnType<FontParserTTF['getMarkAnchorsForGlyph']>, classIndex: number) => {
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

    // Get a glyph description by index
    public getGlyph(i: number): GlyphData | null {
        const description = this.glyf?.getDescription(i);
        if (description != null) {
            return new GlyphData(description, this.hmtx?.getLeftSideBearing(i) ?? 0, this.hmtx?.getAdvanceWidth(i) ?? 0);
        }
        if (this.cff2) {
            const cff2Desc = this.cff2.getGlyphDescription(i);
            if (cff2Desc) {
                return new GlyphData(cff2Desc, this.hmtx?.getLeftSideBearing(i) ?? 0, this.hmtx?.getAdvanceWidth(i) ?? 0, { isCubic: true });
            }
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
                        lig?.components?.forEach((component) => {
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

    public getNameRecord(nameId: number): string {
        return this.pName?.getRecord(nameId) ?? "";
    }

    public getAllNameRecords(): Array<{ nameId: number; record: string }> {
        if (!this.pName) return [];
        return this.pName.records.map(r => ({ nameId: r.nameId, record: r.record }));
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
                { platformId: 3, encodingId: 10 }, // Windows, UCS-4
                { platformId: 0, encodingId: 4 },  // Unicode, UCS-4
                { platformId: 3, encodingId: 1 },  // Windows, Unicode BMP
                { platformId: 0, encodingId: 3 },  // Unicode, BMP
                { platformId: 0, encodingId: 1 },  // Unicode, 1.1
                { platformId: 1, encodingId: 0 },  // Macintosh, Roman
            ]
            : [
                { platformId: 3, encodingId: 1 },  // Windows, Unicode BMP
                { platformId: 0, encodingId: 3 },  // Unicode, BMP
                { platformId: 0, encodingId: 1 },  // Unicode, 1.1
                { platformId: 3, encodingId: 10 }, // Windows, UCS-4
                { platformId: 0, encodingId: 4 },  // Unicode, UCS-4
                { platformId: 1, encodingId: 0 },  // Macintosh, Roman
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
//     private getTable( tableType:any )
//     {
//         for (var i=0; i < this.tables.length; i++)
//         {
//             if( (this.tables[i] != null) && (this.tables[i].getType() == tableType) )
//             {
//                 return this.tables[i];
//             }
//         }
//         return null;
//     } 


}

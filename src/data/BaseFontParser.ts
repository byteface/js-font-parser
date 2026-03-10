import type { Diagnostic as FontDiagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
import {
    clearDiagnostics as clearParserDiagnostics,
    emitDiagnostic as emitParserDiagnostic,
    getBestCmapFormatFor as selectBestCmapFormatFor,
    getDiagnostics as getParserDiagnostics,
    pickBestCmapFormat
} from './ParserShared.js';

type DiagnosticState = {
    diagnostics: FontDiagnostic[];
    diagnosticKeys: Set<string>;
};

export abstract class BaseFontParser {
    private diagnostics: FontDiagnostic[] = [];
    private diagnosticKeys = new Set<string>();

    protected emitDiagnostic(
        code: string,
        level: 'warning' | 'info',
        phase: 'parse' | 'layout',
        message: string,
        context?: Record<string, unknown>,
        onceKey?: string
    ): void {
        const state: DiagnosticState = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        emitParserDiagnostic(state, code, level, phase, message, context, onceKey);
        this.diagnostics = state.diagnostics ?? [];
        this.diagnosticKeys = state.diagnosticKeys ?? new Set<string>();
    }

    public getDiagnostics(filter?: DiagnosticFilter): FontDiagnostic[] {
        const state: DiagnosticState = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        const out = getParserDiagnostics(state, filter);
        this.diagnostics = state.diagnostics ?? [];
        this.diagnosticKeys = state.diagnosticKeys ?? new Set<string>();
        return out;
    }

    public clearDiagnostics(): void {
        const state: DiagnosticState = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        clearParserDiagnostics(state);
        this.diagnostics = state.diagnostics ?? [];
        this.diagnosticKeys = state.diagnosticKeys ?? new Set<string>();
    }

    protected abstract getCmapTableForLookup(): any | null;

    protected getBestCmapFormatFor(codePoint: number): any | null {
        return selectBestCmapFormatFor(this.getCmapTableForLookup(), codePoint);
    }

    protected pickBestFormat(formats: any[]): any | null {
        return pickBestCmapFormat(formats as any);
    }

    protected abstract getGsubTableForLayout(): any | null;
    protected abstract getKernTableForLayout(): { getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null } | null;
    protected abstract getGposTableForLayout(): any | null;
    protected abstract getGlyphByIndexForLayout(glyphIndex: number): { advanceWidth?: number } | null;
    protected abstract isMarkGlyphForLayout(glyphIndex: number): boolean;
    protected abstract applyGposPositioningForLayout(
        glyphIndices: number[],
        positioned: Array<{ glyphIndex: number; xAdvance: number; xOffset: number; yOffset: number; yAdvance: number }>,
        gposFeatures: string[],
        scriptTags: string[]
    ): void;
    protected abstract getTableByTypeInternal(tableType: number): any | null;
    protected abstract getNameRecordForInfo(nameId: number): string;
    protected abstract getOs2TableForInfo(): any | null;
    protected abstract getPostTableForInfo(): any | null;

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

        const cmap = this.getCmapTableForLookup();
        if (!cmap) {
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
            const fallbackFormats = Array.isArray(cmap.formats)
                ? cmap.formats.filter((fmt: any): fmt is NonNullable<typeof fmt> => fmt != null)
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

    public getGlyphByChar(char: string): any | null {
        const idx = this.getGlyphIndexByChar(char);
        if (idx == null) return null;
        return this.getGlyphByIndexForLayout(idx);
    }

    public getGlyphIndicesForString(text: string): number[] {
        const glyphs: number[] = [];
        for (const ch of Array.from(text)) {
            const idx = this.getGlyphIndexByChar(ch);
            if (idx != null) glyphs.push(idx);
        }
        return glyphs;
    }

    public getGlyphIndicesForStringWithGsub(text: string, featureTags: string[] = ["liga"], scriptTags: string[] = ["DFLT", "latn"]): number[] {
        const glyphs = this.getGlyphIndicesForString(text);
        const gsub = this.getGsubTableForLayout();
        if (!gsub || glyphs.length === 0) {
            if (!gsub && glyphs.length > 0) {
                this.emitDiagnostic("MISSING_TABLE_GSUB", "info", "layout", "GSUB table not present; using direct glyph mapping.", undefined, "MISSING_TABLE_GSUB");
            }
            return glyphs;
        }
        return gsub.applyFeatures(glyphs, featureTags, scriptTags);
    }

    public getKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        const kernTable = this.getKernTableForLayout();
        if (!kernTable) return 0;
        if (typeof kernTable.getKerningValue === "function") {
            try {
                const value = kernTable.getKerningValue(leftGlyph, rightGlyph);
                return typeof value === 'number' && Number.isFinite(value) ? value : 0;
            } catch {
                return 0;
            }
        }
        return 0;
    }

    public getGposKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number {
        const gpos = this.getGposTableForLayout();
        if (!gpos) {
            this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "GPOS table not present; kerning defaults to 0.", undefined, "MISSING_TABLE_GPOS");
            return 0;
        }
        const lookups = gpos.lookupList?.getLookups?.() ?? [];
        let value = 0;
        for (const lookup of lookups) {
            if (!lookup || lookup.getType() !== 2) continue;
            for (let i = 0; i < lookup.getSubtableCount(); i++) {
                const st = lookup.getSubtable(i);
                if (typeof st?.getKerning === 'function') {
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
            const glyph = this.getGlyphByIndexForLayout(glyphIndex);

            let kern = 0;
            if (i < glyphIndices.length - 1) {
                kern = this.getKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                if (kern === 0) {
                    kern = this.getGposKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                }
            }

            positioned.push({
                glyphIndex,
                xAdvance: this.isMarkGlyphForLayout(glyphIndex) ? 0 : (glyph?.advanceWidth ?? 0) + kern,
                xOffset: 0,
                yOffset: 0,
                yAdvance: 0
            });
        }
        if (options.gpos) {
            if (!this.getGposTableForLayout()) {
                this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "Requested GPOS positioning, but GPOS table is unavailable.", undefined, "MISSING_TABLE_GPOS");
            }
            this.applyGposPositioningForLayout(glyphIndices, positioned, gposFeatures, scriptTags);
        }
        return positioned;
    }

    public getTableByType(tableType: number): any | null {
        return this.getTableByTypeInternal(tableType);
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
            family: this.getNameRecordForInfo(1),
            subfamily: this.getNameRecordForInfo(2),
            fullName: this.getNameRecordForInfo(4),
            postScriptName: this.getNameRecordForInfo(6),
            version: this.getNameRecordForInfo(5),
            manufacturer: this.getNameRecordForInfo(8),
            designer: this.getNameRecordForInfo(9),
            description: this.getNameRecordForInfo(10),
            typoFamily: this.getNameRecordForInfo(16),
            typoSubfamily: this.getNameRecordForInfo(17)
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
        const os2 = this.getOs2TableForInfo();
        if (!os2) return null;
        const vendorRaw = os2.achVendorID >>> 0;
        const vendorId = String.fromCharCode(
            (vendorRaw >>> 24) & 0xff,
            (vendorRaw >>> 16) & 0xff,
            (vendorRaw >>> 8) & 0xff,
            vendorRaw & 0xff
        ).replace(/\0/g, '');
        return {
            weightClass: os2.usWeightClass,
            widthClass: os2.usWidthClass,
            typoAscender: os2.sTypoAscender,
            typoDescender: os2.sTypoDescender,
            typoLineGap: os2.sTypoLineGap,
            winAscent: os2.usWinAscent,
            winDescent: os2.usWinDescent,
            unicodeRanges: [os2.ulUnicodeRange1, os2.ulUnicodeRange2, os2.ulUnicodeRange3, os2.ulUnicodeRange4],
            codePageRanges: [os2.ulCodePageRange1, os2.ulCodePageRange2],
            vendorId,
            fsSelection: os2.fsSelection
        };
    }

    public getPostInfo(): {
        italicAngle: number;
        underlinePosition: number;
        underlineThickness: number;
        isFixedPitch: number;
    } | null {
        const post = this.getPostTableForInfo();
        if (!post) return null;
        return {
            italicAngle: post.italicAngle / 65536,
            underlinePosition: post.underlinePosition,
            underlineThickness: post.underlineThickness,
            isFixedPitch: post.isFixedPitch
        };
    }
}

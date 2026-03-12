import type { Diagnostic as FontDiagnostic, DiagnosticFilter } from '../types/Diagnostics.js';
import type { IGlyphDescription } from '../table/IGlyphDescription.js';
import { ByteArray } from '../utils/ByteArray.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { GlyphData } from './GlyphData.js';
import { TrueTypeHintVM, HintingMode, HintingOptions } from '../hint/TrueTypeHintVM.js';
type PositionedGlyph = {
    glyphIndex: number;
    xAdvance: number;
    xOffset: number;
    yOffset: number;
    yAdvance: number;
};
type MarkAnchorType = 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit';
type MarkAnchor = {
    type: MarkAnchorType;
    classIndex: number;
    x: number;
    y: number;
    componentIndex?: number;
};
type GlyphBuildOptions = {
    maxGlyphs?: number | null;
    glyf?: any | null;
    hmtx?: any | null;
    gvar?: any | null;
    variationCoords?: number[];
    cff?: any | null;
    cff2?: any | null;
    cffIncludePhantoms?: boolean;
    cvt?: any | null;
    fpgm?: any | null;
    prep?: any | null;
};
type CmapFormatLike = {
    format?: number;
    getFormatType?: () => number;
    getGlyphIndex?: (codePoint: number) => number | null;
    mapCharCode?: (codePoint: number) => number | null;
};
export declare abstract class BaseFontParser {
    private diagnostics;
    private diagnosticKeys;
    protected tableDir: TableDirectory | null;
    protected tables: any[];
    protected os2: any | null;
    protected cmap: any | null;
    protected cbdt: any | null;
    protected cblc: any | null;
    protected glyf: any | null;
    protected cff: any | null;
    protected head: any | null;
    protected hhea: any | null;
    protected hmtx: any | null;
    protected vhea: any | null;
    protected vmtx: any | null;
    protected loca: any | null;
    protected maxp: any | null;
    protected pName: any | null;
    protected post: any | null;
    protected sbix: any | null;
    protected gsub: any | null;
    protected kern: {
        getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null;
    } | null;
    protected colr: any | null;
    protected cpal: any | null;
    protected gpos: any | null;
    protected gdef: {
        getGlyphClass?: (glyphId: number) => number;
    } | null;
    protected fvar: any | null;
    protected svg: any | null;
    protected ebdt: any | null;
    protected eblc: any | null;
    protected ebsc: any | null;
    protected gvar: any | null;
    protected cvt: any | null;
    protected fpgm: any | null;
    protected prep: any | null;
    protected variationCoords: number[];
    protected hintingEnabled: boolean;
    protected hintingMode: HintingMode;
    protected hintingPpem: number;
    protected hintVm: TrueTypeHintVM;
    protected emitDiagnostic(code: string, level: 'warning' | 'info', phase: 'parse' | 'layout', message: string, context?: Record<string, unknown>, onceKey?: string): void;
    getDiagnostics(filter?: DiagnosticFilter): FontDiagnostic[];
    clearDiagnostics(): void;
    protected getCmapTableForLookup(): any | null;
    protected getBestCmapFormatFor(codePoint: number): any | null;
    protected pickBestFormat(formats: any[], order?: number[]): any | null;
    protected getOrderedCmapFormatsFor(codePoint: number): CmapFormatLike[];
    protected isNonRenderingFormatCodePoint(codePoint: number): boolean;
    protected getGsubTableForLayout(): any | null;
    protected getKernTableForLayout(): {
        getKerningValue?: (leftGlyph: number, rightGlyph: number) => number | null;
    } | null;
    protected getGposTableForLayout(): any | null;
    protected getGlyphByIndexForLayout(glyphIndex: number): any | null;
    protected isMarkGlyphForLayout(glyphIndex: number): boolean;
    protected applyGposPositioningForLayout(glyphIndices: number[], positioned: PositionedGlyph[], gposFeatures: string[], scriptTags: string[]): void;
    protected getNameRecordForInfo(nameId: number): string;
    protected getOs2TableForInfo(): any | null;
    protected getPostTableForInfo(): any | null;
    protected getNameTableForShared(): any | null;
    protected getOs2TableForShared(): any | null;
    protected getPostTableForShared(): any | null;
    protected getFvarTableForShared(): any | null;
    protected getAvarTableForShared(): any | null;
    protected getStatTableForShared(): any | null;
    protected getColrTableForShared(): any | null;
    protected getCpalTableForShared(): any | null;
    protected getUnitsPerEmForShared(): number;
    protected setVariationCoordsInternal(coords: number[]): void;
    protected onVariationCoordsUpdated(coords: number[]): void;
    setHintingOptions(options?: HintingOptions): void;
    getHintingOptions(): {
        enabled: boolean;
        mode: HintingMode;
        ppem: number;
    };
    abstract getGlyph(i: number): GlyphData | null;
    protected getGlyphShared(i: number, options: GlyphBuildOptions): GlyphData | null;
    protected applyHintingIfEnabled(glyph: GlyphData, desc: IGlyphDescription, tables: {
        cvt?: any | null;
        fpgm?: any | null;
        prep?: any | null;
    }): void;
    protected applyIupDeltasShared(base: IGlyphDescription, dx: number[], dy: number[], touched: boolean[]): void;
    protected interpolateShared(aCoord: number, bCoord: number, aDelta: number, bDelta: number, pCoord: number): number;
    protected getGposAttachmentAnchors(glyphId: number, subtables?: Array<any>): MarkAnchor[];
    protected applyGposPositioningShared(glyphIndices: number[], positioned: PositionedGlyph[], gposFeatures: string[], scriptTags: string[]): void;
    protected applyGposPositioningInternal(glyphIndices: number[], positioned: PositionedGlyph[], gposFeatures: string[], scriptTags: string[]): void;
    applyGposPositioning(glyphIndices: number[], positioned: PositionedGlyph[], gposFeatures: string[], scriptTags: string[]): void;
    protected isMarkGlyphClass(glyphId: number): boolean;
    protected getTable(tableType: number): any | null;
    protected parseSfntTables(byteData: ByteArray): void;
    protected wireCommonTables(): void;
    getGlyphIndexByChar(char: string): number | null;
    getGlyphByChar(char: string): any | null;
    getGlyphIndicesForString(text: string): number[];
    getGlyphIndicesForStringWithGsub(text: string, featureTags?: string[], scriptTags?: string[]): number[];
    getKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number;
    getGposKerningValueByGlyphs(leftGlyph: number, rightGlyph: number): number;
    getKerningValue(leftChar: string, rightChar: string): number;
    layoutString(text: string, options?: {
        gsubFeatures?: string[];
        scriptTags?: string[];
        gpos?: boolean;
        gposFeatures?: string[];
        kerning?: boolean;
    }): Array<{
        glyphIndex: number;
        xAdvance: number;
        xOffset: number;
        yOffset: number;
        yAdvance: number;
    }>;
    getTableByType(tableType: number): any | null;
    getNumGlyphs(): number;
    getAscent(): number;
    getDescent(): number;
    getUnitsPerEm(): number;
    getMarkAnchorsForGlyph(glyphId: number, subtables?: Array<any>): Array<{
        type: 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit';
        classIndex: number;
        x: number;
        y: number;
        componentIndex?: number;
    }>;
    getSvgDocumentForGlyphAsync(glyphId: number): Promise<{
        svgText: string | null;
        isCompressed: boolean;
    }>;
    getNameInfo(): {
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
    };
    getOs2Info(): {
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
    } | null;
    getPostInfo(): {
        italicAngle: number;
        underlinePosition: number;
        underlineThickness: number;
        isFixedPitch: number;
    } | null;
    layoutStringAuto(text: string, options?: {
        gpos?: boolean;
        gposFeatures?: string[];
        kerning?: boolean;
    }): PositionedGlyph[];
    getVariationAxes(): any[];
    setVariationCoords(coords: number[]): void;
    setVariationByAxes(values: Record<string, number>): void;
    getVariationInfo(): {
        axes: ReturnType<BaseFontParser['getVariationAxes']>;
        hasAvar: boolean;
        hasGvar: boolean;
        hasHvar: boolean;
        hasVvar: boolean;
        hasMvar: boolean;
        hasStat: boolean;
        stat: {
            designAxes: any[];
            axisValues: any[];
            elidedFallbackNameId: number | null;
        } | null;
    };
    getGlyphPointsByChar(char: string, options?: {
        sampleStep?: number;
    }): Array<{
        x: number;
        y: number;
        onCurve: boolean;
        endOfContour: boolean;
    }>;
    measureText(text: string, options?: {
        gsubFeatures?: string[];
        scriptTags?: string[];
        gpos?: boolean;
        gposFeatures?: string[];
        letterSpacing?: number;
    }): {
        advanceWidth: number;
        glyphCount: number;
    };
    layoutToPoints(text: string, options?: {
        x?: number;
        y?: number;
        fontSize?: number;
        sampleStep?: number;
        gsubFeatures?: string[];
        scriptTags?: string[];
        gpos?: boolean;
        gposFeatures?: string[];
        letterSpacing?: number;
    }): {
        points: Array<{
            x: number;
            y: number;
            onCurve: boolean;
            endOfContour: boolean;
            glyphIndex: number;
            pointIndex: number;
        }>;
        advanceWidth: number;
        scale: number;
    };
    getColorLayersForGlyph(glyphId: number, paletteIndex?: number): Array<{
        glyphId: number;
        color: string | null;
        paletteIndex: number;
    }>;
    getColorLayersForChar(char: string, paletteIndex?: number): Array<{
        glyphId: number;
        color: string | null;
        paletteIndex: number;
    }>;
    getColrV1LayersForGlyph(glyphId: number, paletteIndex?: number): Array<{
        glyphId: number;
        color: string | null;
        paletteIndex: number;
    }>;
    private flattenColrV1Paint;
    getNameRecord(nameId: number): string;
    getAllNameRecords(): Array<{
        nameId: number;
        record: string;
    }>;
    getAllNameRecordsDetailed(): Array<{
        nameId: number;
        record: string;
        platformId: number;
        encodingId: number;
        languageId: number;
    }>;
    getFontNames(): {
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
    };
    getOs2Metrics(): {
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
    } | null;
    getPostMetrics(): {
        version: number;
        italicAngle: number;
        underlinePosition: number;
        underlineThickness: number;
        isFixedPitch: boolean;
        rawIsFixedPitch: number;
    } | null;
    getVerticalMetrics(): {
        ascender: number;
        descender: number;
        lineGap: number;
        advanceHeightMax: number;
        minTopSideBearing: number;
        minBottomSideBearing: number;
        yMaxExtent: number;
        caretSlopeRise: number;
        caretSlopeRun: number;
        caretOffset: number;
        metricDataFormat: number;
        numberOfVMetrics: number;
        hasVerticalMetricsTable: boolean;
    } | null;
    getWeightClass(): number;
    getWidthClass(): number;
    getFsTypeFlags(): string[];
    getFsSelectionFlags(): string[];
    isItalic(): boolean;
    isBold(): boolean;
    isMonospace(): boolean;
    getMetadata(): {
        names: ReturnType<BaseFontParser['getFontNames']>;
        nameRecords: ReturnType<BaseFontParser['getAllNameRecordsDetailed']>;
        os2: ReturnType<BaseFontParser['getOs2Metrics']>;
        post: ReturnType<BaseFontParser['getPostMetrics']>;
        vertical: ReturnType<BaseFontParser['getVerticalMetrics']>;
        bitmapColor: ReturnType<BaseFontParser['getBitmapColorInfo']>;
        style: {
            isBold: boolean;
            isItalic: boolean;
            isMonospace: boolean;
            weightClass: number;
            widthClass: number;
            fsTypeFlags: string[];
            fsSelectionFlags: string[];
        };
    };
    getBitmapColorInfo(): {
        hasBitmapData: boolean;
        format: 'cbdt-cblc' | 'sbix' | 'ebdt-eblc' | null;
        tables: string[];
        tableLengths: Record<string, number>;
    };
    getBitmapStrikeForGlyph(glyphId: number, preferredPpem?: number): {
        glyphId: number;
        ppemX: number;
        ppemY: number;
        bitDepth: number;
        imageFormat: number | null;
        graphicType: string | null;
        metrics: {
            height: number;
            width: number;
            bearingX: number;
            bearingY: number;
            advance: number;
        } | null;
        mimeType: string | null;
        data: Uint8Array;
    } | null;
    private getCbdtBitmapStrikeForGlyph;
    private getSbixBitmapStrikeForGlyph;
    getBitmapStrikeForChar(char: string, preferredPpem?: number): ReturnType<BaseFontParser['getBitmapStrikeForGlyph']>;
    private getBitmapMimeType;
    private getBitmapImageDimensions;
    private getPreferredNameRecord;
    private decodeOs2VendorId;
}
export {};

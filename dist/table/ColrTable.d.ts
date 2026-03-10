import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
export type ColrLayerRecord = {
    glyphId: number;
    paletteIndex: number;
};
export type ColrBaseGlyphRecord = {
    glyphId: number;
    firstLayerIndex: number;
    numLayers: number;
};
export type ColrBaseGlyphPaintRecord = {
    glyphId: number;
    paintOffset: number;
};
type ClipBox = {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
};
export declare class ColrTable implements ITable {
    version: number;
    baseGlyphRecordsOffset: number;
    layerRecordsOffset: number;
    numBaseGlyphRecords: number;
    numLayerRecords: number;
    baseGlyphListOffset: number;
    layerListOffset: number;
    clipListOffset: number;
    varStoreOffset: number;
    baseGlyphRecords: ColrBaseGlyphRecord[];
    layerRecords: ColrLayerRecord[];
    baseGlyphPaintRecords: ColrBaseGlyphPaintRecord[];
    layerPaintOffsets: number[];
    private start;
    private view;
    private baseGlyphListStart;
    private layerListStart;
    private variationCoords;
    private varStore;
    private clipBoxes;
    constructor(de: DirectoryEntry, byteArray: ByteArray);
    getLayersForGlyph(glyphId: number): ColrLayerRecord[];
    getType(): string | number;
    setVariationCoords(coords: number[]): void;
    getClipForGlyph(glyphId: number): ClipBox | null;
    getPaintForGlyph(glyphId: number): any | null;
    readPaint(offset: number, baseOffset: number, depth?: number): any | null;
    private readOffset24;
    private readFixed16_16;
    private readF2Dot14;
    private readAffine2x3;
    private readColorLine;
    private readVariationStore;
    private getVarDeltas;
    private getVarDelta;
    private readClipList;
    private readClipBox;
}
export {};

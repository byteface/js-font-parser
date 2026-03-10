import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
import { IGlyphDescription } from './IGlyphDescription.js';
export declare class Cff2Table implements ITable {
    private baseOffset;
    private charStrings;
    private globalSubrs;
    private fdSelect;
    private privateInfos;
    private vstoreRegionCounts;
    private vstoreRegionIndices;
    private vstoreRegions;
    private vstoreAxisCount;
    private variationCoords;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
    getGlyphDescription(glyphId: number): IGlyphDescription | null;
    setVariationCoords(coords: number[]): void;
    private readFdSelect;
    private getSubrBias;
    private readVariationStore;
    private parseCharString;
    private readCharStringNumber;
}

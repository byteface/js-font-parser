import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
import { IGlyphDescription } from './IGlyphDescription.js';
export declare class CffTable implements ITable {
    private baseOffset;
    private data;
    private charStrings;
    private globalSubrs;
    private localSubrs;
    private fdSelect;
    private privateInfos;
    private privateInfoSources;
    private nominalWidthX;
    private defaultWidthX;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
    getGlyphDescription(glyphId: number): IGlyphDescription | null;
    getDefaultWidthX(): number;
    debugCharString(glyphId: number): Array<{
        op: string;
        args: number[];
        note?: string;
    }> | null;
    private getLocalSubrsForGlyph;
    private getPrivateInfo;
    private getSubrBias;
    private readFdSelect;
    private parseCharString;
    private readCharStringNumber;
}

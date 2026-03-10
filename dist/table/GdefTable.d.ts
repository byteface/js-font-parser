import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class GdefTable implements ITable {
    private glyphClassDef;
    private markAttachClassDef;
    private markGlyphSets;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
    getGlyphClass(glyphId: number): number;
    getMarkAttachmentClass(glyphId: number): number;
    isGlyphInMarkSet(setIndex: number, glyphId: number): boolean;
}

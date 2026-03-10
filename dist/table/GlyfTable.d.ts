import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { LocaTable } from "./LocaTable.js";
import { IGlyphDescription } from "./IGlyphDescription.js";
export declare class GlyfTable {
    private buf;
    private descript;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    run(numGlyphs: number, loca: LocaTable): void;
    getDescription(i: number): IGlyphDescription | null;
    getType(): number;
}

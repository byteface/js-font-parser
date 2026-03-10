import { ByteArray } from "../utils/ByteArray.js";
import { CmapIndexEntry } from "./CmapIndexEntry.js";
import { ICmapFormat } from "./ICmapFormat.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class CmapTable implements ITable {
    version: number;
    numTables: number;
    entries: CmapIndexEntry[];
    private _formats;
    private formatKinds;
    private loadedFormats;
    private baseOffset;
    private data;
    constructor(de: DirectoryEntry, byteArray: ByteArray);
    get formats(): Array<ICmapFormat | null>;
    getCmapFormat(platformId: number, encodingId: number): ICmapFormat | null;
    getCmapFormats(platformId: number, encodingId: number): ICmapFormat[];
    getType(): number;
    toString(): string;
    private ensureFormatLoaded;
    private loadFormat;
}

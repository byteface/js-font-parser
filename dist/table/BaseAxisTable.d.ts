import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { BaseTable } from "./BaseTable.js";
type BaseTagRecord = {
    tag: string;
    minMaxOffset: number | null;
    featMinMaxOffset: number | null;
};
export declare class BaseAxisTable extends BaseTable implements ITable {
    version: number;
    horizAxisOffset: number;
    vertAxisOffset: number;
    horizontal: {
        baseTagListOffset: number;
        baseScriptListOffset: number;
        tags: string[];
        scripts: BaseTagRecord[];
    } | null;
    vertical: {
        baseTagListOffset: number;
        baseScriptListOffset: number;
        tags: string[];
        scripts: BaseTagRecord[];
    } | null;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    private readAxis;
    private readTagList;
    private readScriptList;
    getType(): number;
}
export {};

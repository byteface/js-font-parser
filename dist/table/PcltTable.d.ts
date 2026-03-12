import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
export declare class PcltTable implements ITable {
    version: number;
    fontNumber: number;
    pitch: number;
    xHeight: number;
    style: number;
    typeFamily: number;
    capHeight: number;
    symbolSet: number;
    typeface: string;
    characterComplement: string;
    fileName: string;
    strokeWeight: number;
    widthType: number;
    serifStyle: number;
    reserved: number;
    constructor(de: DirectoryEntry, byte_ar: ByteArray);
    getType(): number;
}

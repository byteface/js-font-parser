import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";
export declare class CmapFormat10 implements ICmapFormat {
    format: number;
    length: number;
    version: number;
    glyphIdArray: number[];
    characterCodes: number[];
    constructor(byteArray: ByteArray);
    getFormatType(): number;
    getGlyphIndex(charCode: number): number;
    getFirst(): number;
    getLast(): number;
    mapCharCode(charCode: number): number;
    toString(): string;
}

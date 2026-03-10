import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";
export declare class CmapFormat0 implements ICmapFormat {
    glyphIdArray: number[];
    first: number;
    last: number;
    format: number;
    length: number;
    version: number;
    constructor(byteArray: ByteArray);
    getFirst(): number;
    getLast(): number;
    mapCharCode(charCode: number): number;
    getFormatType(): number;
    getGlyphIndex(codePoint: number): number | null;
    toString(): string;
}

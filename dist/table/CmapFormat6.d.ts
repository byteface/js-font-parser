import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";
export declare class CmapFormat6 implements ICmapFormat {
    format: number;
    length: number;
    version: number;
    firstCode: number;
    entryCount: number;
    glyphIdArray: number[];
    constructor(byteArray: ByteArray);
    getFirst(): number;
    getFormatType(): number;
    getGlyphIndex(codePoint: number): number | null;
    getLast(): number;
    mapCharCode(charCode: number): number;
    toString(): string;
}

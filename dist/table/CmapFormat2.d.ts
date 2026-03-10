import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";
export declare class CmapFormat2 implements ICmapFormat {
    subHeaderKeys: number[];
    subHeaders: any[];
    glyphIndexArray: number[];
    format: number;
    length: number;
    version: number;
    constructor(byteArray: ByteArray);
    parseSubHeader(byteArray: ByteArray): any;
    getFormatType(): number;
    getGlyphIndex(codePoint: number): number | null;
    getFirst(): number;
    getLast(): number;
    mapCharCode(charCode: number): number;
    toString(): string;
}

import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";
export declare class CmapFormat12 implements ICmapFormat {
    format: number;
    length: number;
    language: number;
    numGroups: number;
    groups: {
        start: number;
        end: number;
        glyphId: number;
    }[];
    constructor(byteArray: ByteArray);
    getFormatType(): number;
    getGlyphIndex(charCode: number): number;
    getFirst(): number;
    getLast(): number;
    mapCharCode(charCode: number): number;
    toString(): string;
}

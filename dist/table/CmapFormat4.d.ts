import { ByteArray } from "../utils/ByteArray.js";
import { ICmapFormat } from "./ICmapFormat.js";
export declare class CmapFormat4 implements ICmapFormat {
    format: number;
    length: number;
    language: number;
    segCountX2: number;
    searchRange: number;
    entrySelector: number;
    rangeShift: number;
    endCode: number[];
    startCode: number[];
    idDelta: number[];
    idRangeOffset: number[];
    glyphIdArray: number[];
    private idRangeOffsetStart;
    private glyphIdArrayStart;
    segCount: number;
    first: number;
    last: number;
    constructor(byteArray: ByteArray);
    getFirst(): number;
    getLast(): number;
    mapCharCode(charCode: number): number;
    generateMappingTable(): {
        charCode: number;
        glyphIndex: number;
    }[];
    getGlyphIndex(codePoint: number): number | null;
    getFormatType(): number;
    toString(): string;
}

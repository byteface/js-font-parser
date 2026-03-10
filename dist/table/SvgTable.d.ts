import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
export type SvgDocumentEntry = {
    startGlyphId: number;
    endGlyphId: number;
    svgDocOffset: number;
    svgDocLength: number;
};
export declare class SvgTable implements ITable {
    version: number;
    svgDocIndexOffset: number;
    entries: SvgDocumentEntry[];
    private startOffset;
    private view;
    constructor(de: DirectoryEntry, byteArray: ByteArray);
    getSvgDocumentForGlyph(glyphId: number): {
        svgText: string | null;
        isCompressed: boolean;
    };
    getSvgDocumentForGlyphAsync(glyphId: number): Promise<{
        svgText: string | null;
        isCompressed: boolean;
    }>;
    getType(): string | number;
}

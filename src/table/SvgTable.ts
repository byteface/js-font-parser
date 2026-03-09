import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
import { Table } from './Table.js';

export type SvgDocumentEntry = {
    startGlyphId: number;
    endGlyphId: number;
    svgDocOffset: number;
    svgDocLength: number;
};

export class SvgTable implements ITable {
    version: number = 0;
    svgDocIndexOffset: number = 0;
    entries: SvgDocumentEntry[] = [];

    private startOffset: number;
    private view: DataView;

    constructor(de: DirectoryEntry, byteArray: ByteArray) {
        const start = de.offset;
        this.startOffset = start;
        this.view = byteArray.dataView;

        byteArray.seek(start);
        this.version = byteArray.readUnsignedShort();
        this.svgDocIndexOffset = byteArray.readUnsignedInt();
        byteArray.readUnsignedInt(); // reserved

        if (this.svgDocIndexOffset === 0) return;

        const indexOffset = start + this.svgDocIndexOffset;
        const numEntries = this.view.getUint16(indexOffset, false);
        this.entries = [];
        let cursor = indexOffset + 2;

        for (let i = 0; i < numEntries; i++) {
            const startGlyphId = this.view.getUint16(cursor, false);
            const endGlyphId = this.view.getUint16(cursor + 2, false);
            const svgDocOffset = this.view.getUint32(cursor + 4, false);
            const svgDocLength = this.view.getUint32(cursor + 8, false);
            this.entries.push({ startGlyphId, endGlyphId, svgDocOffset, svgDocLength });
            cursor += 12;
        }
    }

    getSvgDocumentForGlyph(glyphId: number): { svgText: string | null; isCompressed: boolean } {
        const entry = this.entries.find(e => glyphId >= e.startGlyphId && glyphId <= e.endGlyphId);
        if (!entry) return { svgText: null, isCompressed: false };

        const docStart = this.startOffset + this.svgDocIndexOffset + entry.svgDocOffset;
        const bytes = new Uint8Array(this.view.buffer, docStart, entry.svgDocLength);
        const isCompressed = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

        if (isCompressed) {
            return { svgText: null, isCompressed: true };
        }

        const decoder = new TextDecoder('utf-8');
        return { svgText: decoder.decode(bytes), isCompressed: false };
    }

    async getSvgDocumentForGlyphAsync(glyphId: number): Promise<{ svgText: string | null; isCompressed: boolean }> {
        const base = this.getSvgDocumentForGlyph(glyphId);
        if (!base.isCompressed) return base;
        if (typeof DecompressionStream === 'undefined') {
            return { svgText: null, isCompressed: true };
        }
        const entry = this.entries.find(e => glyphId >= e.startGlyphId && glyphId <= e.endGlyphId);
        if (!entry) return { svgText: null, isCompressed: false };
        const docStart = this.startOffset + this.svgDocIndexOffset + entry.svgDocOffset;
        const bytes = new Uint8Array(this.view.buffer, docStart, entry.svgDocLength);
        const stream = new DecompressionStream('gzip');
        const payload = new Uint8Array(bytes);
        const response = new Response(payload).body;
        if (!response) return { svgText: null, isCompressed: true };
        const decompressed = response.pipeThrough(stream);
        const buffer = await new Response(decompressed).arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        return { svgText: decoder.decode(new Uint8Array(buffer)), isCompressed: false };
    }

    getType(): string | number {
        return Table.SVG;
    }
}

import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
import { Table } from './Table.js';

export type ColrLayerRecord = {
    glyphId: number;
    paletteIndex: number;
};

export type ColrBaseGlyphRecord = {
    glyphId: number;
    firstLayerIndex: number;
    numLayers: number;
};

export type ColrBaseGlyphPaintRecord = {
    glyphId: number;
    paintOffset: number;
};

export class ColrTable implements ITable {
    version: number = 0;

    // COLRv0 fields
    baseGlyphRecordsOffset: number = 0;
    layerRecordsOffset: number = 0;
    numBaseGlyphRecords: number = 0;
    numLayerRecords: number = 0;

    // COLRv1 fields
    baseGlyphListOffset: number = 0;
    layerListOffset: number = 0;
    clipListOffset: number = 0;
    varStoreOffset: number = 0;

    baseGlyphRecords: ColrBaseGlyphRecord[] = [];
    layerRecords: ColrLayerRecord[] = [];
    baseGlyphPaintRecords: ColrBaseGlyphPaintRecord[] = [];

    constructor(de: DirectoryEntry, byteArray: ByteArray) {
        const start = de.offset;
        const view = byteArray.dataView;
        byteArray.seek(start);

        this.version = byteArray.readUnsignedShort();

        if (this.version === 0) {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();

            const baseOffset = start + this.baseGlyphRecordsOffset;
            this.baseGlyphRecords = [];
            for (let i = 0; i < this.numBaseGlyphRecords; i++) {
                const offset = baseOffset + i * 6;
                this.baseGlyphRecords.push({
                    glyphId: view.getUint16(offset, false),
                    firstLayerIndex: view.getUint16(offset + 2, false),
                    numLayers: view.getUint16(offset + 4, false)
                });
            }

            const layerOffset = start + this.layerRecordsOffset;
            this.layerRecords = [];
            for (let i = 0; i < this.numLayerRecords; i++) {
                const offset = layerOffset + i * 4;
                this.layerRecords.push({
                    glyphId: view.getUint16(offset, false),
                    paletteIndex: view.getUint16(offset + 2, false)
                });
            }
        } else {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();
            this.baseGlyphListOffset = byteArray.readUnsignedInt();
            this.layerListOffset = byteArray.readUnsignedInt();
            this.clipListOffset = byteArray.readUnsignedInt();
            this.varStoreOffset = byteArray.readUnsignedInt();

            if (this.baseGlyphRecordsOffset && this.numBaseGlyphRecords) {
                const baseOffset = start + this.baseGlyphRecordsOffset;
                this.baseGlyphRecords = [];
                for (let i = 0; i < this.numBaseGlyphRecords; i++) {
                    const offset = baseOffset + i * 6;
                    this.baseGlyphRecords.push({
                        glyphId: view.getUint16(offset, false),
                        firstLayerIndex: view.getUint16(offset + 2, false),
                        numLayers: view.getUint16(offset + 4, false)
                    });
                }
            }

            if (this.layerRecordsOffset && this.numLayerRecords) {
                const layerOffset = start + this.layerRecordsOffset;
                this.layerRecords = [];
                for (let i = 0; i < this.numLayerRecords; i++) {
                    const offset = layerOffset + i * 4;
                    this.layerRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paletteIndex: view.getUint16(offset + 2, false)
                    });
                }
            }

            if (this.baseGlyphListOffset) {
                const listOffset = start + this.baseGlyphListOffset;
                const count = view.getUint32(listOffset, false);
                this.baseGlyphPaintRecords = [];
                for (let i = 0; i < count; i++) {
                    const offset = listOffset + 4 + i * 6;
                    this.baseGlyphPaintRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paintOffset: view.getUint32(offset + 2, false)
                    });
                }
            }

            if (this.layerListOffset) {
                const listOffset = start + this.layerListOffset;
                const count = view.getUint32(listOffset, false);
                this.layerRecords = [];
                for (let i = 0; i < count; i++) {
                    const offset = listOffset + 4 + i * 4;
                    this.layerRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paletteIndex: view.getUint16(offset + 2, false)
                    });
                }
            }
        }
    }

    getType(): string | number {
        return Table.COLR;
    }
}

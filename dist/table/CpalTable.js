import { Table } from './Table.js';
export class CpalTable {
    version = 0;
    numPaletteEntries = 0;
    numPalettes = 0;
    numColorRecords = 0;
    colorRecordsArrayOffset = 0;
    paletteTypesArrayOffset = 0;
    paletteLabelsArrayOffset = 0;
    paletteEntryLabelsArrayOffset = 0;
    colorRecordIndices = [];
    colorRecords = [];
    paletteTypes = [];
    paletteLabels = [];
    paletteEntryLabels = [];
    constructor(de, byteArray) {
        const start = de.offset;
        byteArray.seek(start);
        this.version = byteArray.readUnsignedShort();
        this.numPaletteEntries = byteArray.readUnsignedShort();
        this.numPalettes = byteArray.readUnsignedShort();
        this.numColorRecords = byteArray.readUnsignedShort();
        this.colorRecordsArrayOffset = byteArray.readUnsignedInt();
        const baseHeaderSize = 12;
        const indicesOffset = start + baseHeaderSize;
        const view = byteArray.dataView;
        this.colorRecordIndices = [];
        for (let i = 0; i < this.numPalettes; i++) {
            this.colorRecordIndices.push(view.getUint16(indicesOffset + i * 2, false));
        }
        if (this.version >= 1) {
            const offsetBase = indicesOffset + this.numPalettes * 2;
            this.paletteTypesArrayOffset = view.getUint32(offsetBase, false);
            this.paletteLabelsArrayOffset = view.getUint32(offsetBase + 4, false);
            this.paletteEntryLabelsArrayOffset = view.getUint32(offsetBase + 8, false);
        }
        const recordsOffset = start + this.colorRecordsArrayOffset;
        this.colorRecords = [];
        for (let i = 0; i < this.numColorRecords; i++) {
            const base = recordsOffset + i * 4;
            const blue = view.getUint8(base);
            const green = view.getUint8(base + 1);
            const red = view.getUint8(base + 2);
            const alpha = view.getUint8(base + 3);
            this.colorRecords.push({ red, green, blue, alpha });
        }
        if (this.paletteTypesArrayOffset) {
            const offset = start + this.paletteTypesArrayOffset;
            this.paletteTypes = [];
            for (let i = 0; i < this.numPalettes; i++) {
                this.paletteTypes.push(view.getUint32(offset + i * 4, false));
            }
        }
        if (this.paletteLabelsArrayOffset) {
            const offset = start + this.paletteLabelsArrayOffset;
            this.paletteLabels = [];
            for (let i = 0; i < this.numPalettes; i++) {
                this.paletteLabels.push(view.getUint16(offset + i * 2, false));
            }
        }
        if (this.paletteEntryLabelsArrayOffset) {
            const offset = start + this.paletteEntryLabelsArrayOffset;
            this.paletteEntryLabels = [];
            for (let i = 0; i < this.numPaletteEntries; i++) {
                this.paletteEntryLabels.push(view.getUint16(offset + i * 2, false));
            }
        }
    }
    getPalette(index) {
        if (index < 0 || index >= this.numPalettes)
            return [];
        const start = this.colorRecordIndices[index] ?? 0;
        const end = start + this.numPaletteEntries;
        return this.colorRecords.slice(start, end);
    }
    getType() {
        return Table.CPAL;
    }
}

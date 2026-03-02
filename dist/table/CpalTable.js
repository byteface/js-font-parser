import { Table } from './Table.js';
var CpalTable = /** @class */ (function () {
    function CpalTable(de, byteArray) {
        this.version = 0;
        this.numPaletteEntries = 0;
        this.numPalettes = 0;
        this.numColorRecords = 0;
        this.colorRecordsArrayOffset = 0;
        this.paletteTypesArrayOffset = 0;
        this.paletteLabelsArrayOffset = 0;
        this.paletteEntryLabelsArrayOffset = 0;
        this.colorRecordIndices = [];
        this.colorRecords = [];
        this.paletteTypes = [];
        this.paletteLabels = [];
        this.paletteEntryLabels = [];
        var start = de.offset;
        byteArray.seek(start);
        this.version = byteArray.readUnsignedShort();
        this.numPaletteEntries = byteArray.readUnsignedShort();
        this.numPalettes = byteArray.readUnsignedShort();
        this.numColorRecords = byteArray.readUnsignedShort();
        this.colorRecordsArrayOffset = byteArray.readUnsignedInt();
        var baseHeaderSize = 12;
        var indicesOffset = start + baseHeaderSize;
        var view = byteArray.dataView;
        this.colorRecordIndices = [];
        for (var i = 0; i < this.numPalettes; i++) {
            this.colorRecordIndices.push(view.getUint16(indicesOffset + i * 2, false));
        }
        if (this.version >= 1) {
            var offsetBase = indicesOffset + this.numPalettes * 2;
            this.paletteTypesArrayOffset = view.getUint32(offsetBase, false);
            this.paletteLabelsArrayOffset = view.getUint32(offsetBase + 4, false);
            this.paletteEntryLabelsArrayOffset = view.getUint32(offsetBase + 8, false);
        }
        var recordsOffset = start + this.colorRecordsArrayOffset;
        this.colorRecords = [];
        for (var i = 0; i < this.numColorRecords; i++) {
            var base = recordsOffset + i * 4;
            var blue = view.getUint8(base);
            var green = view.getUint8(base + 1);
            var red = view.getUint8(base + 2);
            var alpha = view.getUint8(base + 3);
            this.colorRecords.push({ red: red, green: green, blue: blue, alpha: alpha });
        }
        if (this.paletteTypesArrayOffset) {
            var offset = start + this.paletteTypesArrayOffset;
            this.paletteTypes = [];
            for (var i = 0; i < this.numPalettes; i++) {
                this.paletteTypes.push(view.getUint32(offset + i * 4, false));
            }
        }
        if (this.paletteLabelsArrayOffset) {
            var offset = start + this.paletteLabelsArrayOffset;
            this.paletteLabels = [];
            for (var i = 0; i < this.numPalettes; i++) {
                this.paletteLabels.push(view.getUint16(offset + i * 2, false));
            }
        }
        if (this.paletteEntryLabelsArrayOffset) {
            var offset = start + this.paletteEntryLabelsArrayOffset;
            this.paletteEntryLabels = [];
            for (var i = 0; i < this.numPaletteEntries; i++) {
                this.paletteEntryLabels.push(view.getUint16(offset + i * 2, false));
            }
        }
    }
    CpalTable.prototype.getPalette = function (index) {
        var _a;
        if (index < 0 || index >= this.numPalettes)
            return [];
        var start = (_a = this.colorRecordIndices[index]) !== null && _a !== void 0 ? _a : 0;
        var end = start + this.numPaletteEntries;
        return this.colorRecords.slice(start, end);
    };
    CpalTable.prototype.getType = function () {
        return Table.CPAL;
    };
    return CpalTable;
}());
export { CpalTable };

import { Table } from './Table.js';
var ColrTable = /** @class */ (function () {
    function ColrTable(de, byteArray) {
        this.version = 0;
        // COLRv0 fields
        this.baseGlyphRecordsOffset = 0;
        this.layerRecordsOffset = 0;
        this.numBaseGlyphRecords = 0;
        this.numLayerRecords = 0;
        // COLRv1 fields
        this.baseGlyphListOffset = 0;
        this.layerListOffset = 0;
        this.clipListOffset = 0;
        this.varStoreOffset = 0;
        this.baseGlyphRecords = [];
        this.layerRecords = [];
        this.baseGlyphPaintRecords = [];
        var start = de.offset;
        var view = byteArray.dataView;
        byteArray.seek(start);
        this.version = byteArray.readUnsignedShort();
        if (this.version === 0) {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();
            var baseOffset = start + this.baseGlyphRecordsOffset;
            this.baseGlyphRecords = [];
            for (var i = 0; i < this.numBaseGlyphRecords; i++) {
                var offset = baseOffset + i * 6;
                this.baseGlyphRecords.push({
                    glyphId: view.getUint16(offset, false),
                    firstLayerIndex: view.getUint16(offset + 2, false),
                    numLayers: view.getUint16(offset + 4, false)
                });
            }
            var layerOffset = start + this.layerRecordsOffset;
            this.layerRecords = [];
            for (var i = 0; i < this.numLayerRecords; i++) {
                var offset = layerOffset + i * 4;
                this.layerRecords.push({
                    glyphId: view.getUint16(offset, false),
                    paletteIndex: view.getUint16(offset + 2, false)
                });
            }
        }
        else {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();
            this.baseGlyphListOffset = byteArray.readUnsignedInt();
            this.layerListOffset = byteArray.readUnsignedInt();
            this.clipListOffset = byteArray.readUnsignedInt();
            this.varStoreOffset = byteArray.readUnsignedInt();
            if (this.baseGlyphRecordsOffset && this.numBaseGlyphRecords) {
                var baseOffset = start + this.baseGlyphRecordsOffset;
                this.baseGlyphRecords = [];
                for (var i = 0; i < this.numBaseGlyphRecords; i++) {
                    var offset = baseOffset + i * 6;
                    this.baseGlyphRecords.push({
                        glyphId: view.getUint16(offset, false),
                        firstLayerIndex: view.getUint16(offset + 2, false),
                        numLayers: view.getUint16(offset + 4, false)
                    });
                }
            }
            if (this.layerRecordsOffset && this.numLayerRecords) {
                var layerOffset = start + this.layerRecordsOffset;
                this.layerRecords = [];
                for (var i = 0; i < this.numLayerRecords; i++) {
                    var offset = layerOffset + i * 4;
                    this.layerRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paletteIndex: view.getUint16(offset + 2, false)
                    });
                }
            }
            if (this.baseGlyphListOffset) {
                var listOffset = start + this.baseGlyphListOffset;
                var count = view.getUint32(listOffset, false);
                this.baseGlyphPaintRecords = [];
                for (var i = 0; i < count; i++) {
                    var offset = listOffset + 4 + i * 6;
                    this.baseGlyphPaintRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paintOffset: view.getUint32(offset + 2, false)
                    });
                }
            }
            if (this.layerListOffset) {
                var listOffset = start + this.layerListOffset;
                var count = view.getUint32(listOffset, false);
                this.layerRecords = [];
                for (var i = 0; i < count; i++) {
                    var offset = listOffset + 4 + i * 4;
                    this.layerRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paletteIndex: view.getUint16(offset + 2, false)
                    });
                }
            }
        }
    }
    ColrTable.prototype.getType = function () {
        return Table.COLR;
    };
    return ColrTable;
}());
export { ColrTable };

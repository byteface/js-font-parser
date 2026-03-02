import { Table } from './Table.js';
var FvarTable = /** @class */ (function () {
    function FvarTable(de, byte_ar) {
        this.majorVersion = 0;
        this.minorVersion = 0;
        this.axesArrayOffset = 0;
        this.axisCount = 0;
        this.axisSize = 0;
        this.instanceCount = 0;
        this.instanceSize = 0;
        this.axes = [];
        this.instances = [];
        var start = de.offset;
        byte_ar.offset = start;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.axesArrayOffset = byte_ar.readUnsignedShort();
        byte_ar.readUnsignedShort(); // reserved
        this.axisCount = byte_ar.readUnsignedShort();
        this.axisSize = byte_ar.readUnsignedShort();
        this.instanceCount = byte_ar.readUnsignedShort();
        this.instanceSize = byte_ar.readUnsignedShort();
        this.axes = [];
        var axesStart = start + this.axesArrayOffset;
        for (var i = 0; i < this.axisCount; i++) {
            var offset = axesStart + i * this.axisSize;
            byte_ar.offset = offset;
            var tag = byte_ar.readUnsignedInt();
            var minValue = byte_ar.readFixed();
            var defaultValue = byte_ar.readFixed();
            var maxValue = byte_ar.readFixed();
            var flags = byte_ar.readUnsignedShort();
            var nameId = byte_ar.readUnsignedShort();
            this.axes.push({
                tag: tag,
                name: this.tagToString(tag),
                minValue: minValue,
                defaultValue: defaultValue,
                maxValue: maxValue,
                flags: flags,
                nameId: nameId
            });
        }
        this.instances = [];
        var instancesStart = axesStart + this.axisCount * this.axisSize;
        for (var i = 0; i < this.instanceCount; i++) {
            var offset = instancesStart + i * this.instanceSize;
            byte_ar.offset = offset;
            var nameId = byte_ar.readUnsignedShort();
            var flags = byte_ar.readUnsignedShort();
            var coordinates = [];
            for (var j = 0; j < this.axisCount; j++) {
                coordinates.push(byte_ar.readFixed());
            }
            var postScriptNameId = void 0;
            if (this.instanceSize >= 4 + this.axisCount * 4 + 2) {
                postScriptNameId = byte_ar.readUnsignedShort();
            }
            this.instances.push({ nameId: nameId, flags: flags, coordinates: coordinates, postScriptNameId: postScriptNameId });
        }
    }
    FvarTable.prototype.tagToString = function (tag) {
        return String.fromCharCode((tag >> 24) & 0xff, (tag >> 16) & 0xff, (tag >> 8) & 0xff, tag & 0xff).replace(/\0/g, '');
    };
    FvarTable.prototype.getType = function () {
        return Table.fvar;
    };
    return FvarTable;
}());
export { FvarTable };

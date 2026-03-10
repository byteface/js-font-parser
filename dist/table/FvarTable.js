import { Table } from './Table.js';
export class FvarTable {
    majorVersion = 0;
    minorVersion = 0;
    axesArrayOffset = 0;
    axisCount = 0;
    axisSize = 0;
    instanceCount = 0;
    instanceSize = 0;
    axes = [];
    instances = [];
    constructor(de, byte_ar) {
        const start = de.offset;
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
        const axesStart = start + this.axesArrayOffset;
        for (let i = 0; i < this.axisCount; i++) {
            const offset = axesStart + i * this.axisSize;
            byte_ar.offset = offset;
            const tag = byte_ar.readUnsignedInt();
            const minValue = byte_ar.readFixed();
            const defaultValue = byte_ar.readFixed();
            const maxValue = byte_ar.readFixed();
            const flags = byte_ar.readUnsignedShort();
            const nameId = byte_ar.readUnsignedShort();
            this.axes.push({
                tag,
                name: this.tagToString(tag),
                minValue,
                defaultValue,
                maxValue,
                flags,
                nameId
            });
        }
        this.instances = [];
        const instancesStart = axesStart + this.axisCount * this.axisSize;
        for (let i = 0; i < this.instanceCount; i++) {
            const offset = instancesStart + i * this.instanceSize;
            byte_ar.offset = offset;
            const nameId = byte_ar.readUnsignedShort();
            const flags = byte_ar.readUnsignedShort();
            const coordinates = [];
            for (let j = 0; j < this.axisCount; j++) {
                coordinates.push(byte_ar.readFixed());
            }
            let postScriptNameId;
            if (this.instanceSize >= 4 + this.axisCount * 4 + 2) {
                postScriptNameId = byte_ar.readUnsignedShort();
            }
            this.instances.push({ nameId, flags, coordinates, postScriptNameId });
        }
    }
    tagToString(tag) {
        return String.fromCharCode((tag >> 24) & 0xff, (tag >> 16) & 0xff, (tag >> 8) & 0xff, tag & 0xff).replace(/\0/g, '');
    }
    getType() {
        return Table.fvar;
    }
}

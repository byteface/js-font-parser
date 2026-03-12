import { Table } from "./Table.js";
import { BaseTable } from "./BaseTable.js";
export class BaseAxisTable extends BaseTable {
    version;
    horizAxisOffset;
    vertAxisOffset;
    horizontal;
    vertical;
    constructor(de, byte_ar) {
        super();
        byte_ar.offset = de.offset;
        this.version = byte_ar.readFixed();
        this.horizAxisOffset = byte_ar.readUnsignedShort();
        this.vertAxisOffset = byte_ar.readUnsignedShort();
        this.horizontal = this.horizAxisOffset ? this.readAxis(byte_ar, de.offset + this.horizAxisOffset) : null;
        this.vertical = this.vertAxisOffset ? this.readAxis(byte_ar, de.offset + this.vertAxisOffset) : null;
    }
    readAxis(byte_ar, axisOffset) {
        const prev = byte_ar.offset;
        byte_ar.offset = axisOffset;
        const baseTagListOffset = byte_ar.readUnsignedShort();
        const baseScriptListOffset = byte_ar.readUnsignedShort();
        const tags = this.readTagList(byte_ar, axisOffset + baseTagListOffset);
        const scripts = this.readScriptList(byte_ar, axisOffset + baseScriptListOffset);
        byte_ar.offset = prev;
        return { baseTagListOffset, baseScriptListOffset, tags, scripts };
    }
    readTagList(byte_ar, offset) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const count = byte_ar.readUnsignedShort();
        const tags = [];
        for (let i = 0; i < count; i++)
            tags.push(this.readTag(byte_ar));
        byte_ar.offset = prev;
        return tags;
    }
    readScriptList(byte_ar, offset) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const count = byte_ar.readUnsignedShort();
        const scripts = [];
        for (let i = 0; i < count; i++) {
            scripts.push({
                tag: this.readTag(byte_ar),
                minMaxOffset: byte_ar.readUnsignedShort() || null,
                featMinMaxOffset: byte_ar.readUnsignedShort() || null
            });
        }
        byte_ar.offset = prev;
        return scripts;
    }
    getType() {
        return Table.BASE;
    }
}

import { ByteArray } from "../utils/ByteArray.js";
import { DirectoryEntry } from "./DirectoryEntry.js";
import { ITable } from "./ITable.js";
import { Table } from "./Table.js";
import { BaseTable } from "./BaseTable.js";

type BaseTagRecord = { tag: string; minMaxOffset: number | null; featMinMaxOffset: number | null };

export class BaseAxisTable extends BaseTable implements ITable {
    version: number;
    horizAxisOffset: number;
    vertAxisOffset: number;
    horizontal: { baseTagListOffset: number; baseScriptListOffset: number; tags: string[]; scripts: BaseTagRecord[] } | null;
    vertical: { baseTagListOffset: number; baseScriptListOffset: number; tags: string[]; scripts: BaseTagRecord[] } | null;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        super();
        byte_ar.offset = de.offset;
        this.version = byte_ar.readFixed();
        this.horizAxisOffset = byte_ar.readUnsignedShort();
        this.vertAxisOffset = byte_ar.readUnsignedShort();
        this.horizontal = this.horizAxisOffset ? this.readAxis(byte_ar, de.offset + this.horizAxisOffset) : null;
        this.vertical = this.vertAxisOffset ? this.readAxis(byte_ar, de.offset + this.vertAxisOffset) : null;
    }

    private readAxis(byte_ar: ByteArray, axisOffset: number) {
        const prev = byte_ar.offset;
        byte_ar.offset = axisOffset;
        const baseTagListOffset = byte_ar.readUnsignedShort();
        const baseScriptListOffset = byte_ar.readUnsignedShort();
        const tags = this.readTagList(byte_ar, axisOffset + baseTagListOffset);
        const scripts = this.readScriptList(byte_ar, axisOffset + baseScriptListOffset);
        byte_ar.offset = prev;
        return { baseTagListOffset, baseScriptListOffset, tags, scripts };
    }

    private readTagList(byte_ar: ByteArray, offset: number): string[] {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const count = byte_ar.readUnsignedShort();
        const tags: string[] = [];
        for (let i = 0; i < count; i++) tags.push(this.readTag(byte_ar));
        byte_ar.offset = prev;
        return tags;
    }

    private readScriptList(byte_ar: ByteArray, offset: number): BaseTagRecord[] {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const count = byte_ar.readUnsignedShort();
        const scripts: BaseTagRecord[] = [];
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

    getType(): number {
        return Table.BASE;
    }
}

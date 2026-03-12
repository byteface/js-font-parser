import { Table } from "./Table.js";
export class StatTable {
    constructor(de, byte_ar) {
        const start = de.offset;
        byte_ar.offset = start;
        this.majorVersion = byte_ar.readUnsignedShort();
        this.minorVersion = byte_ar.readUnsignedShort();
        this.designAxisSize = byte_ar.readUnsignedShort();
        this.designAxisCount = byte_ar.readUnsignedShort();
        this.designAxesOffset = byte_ar.readUnsignedInt();
        this.axisValueCount = byte_ar.readUnsignedShort();
        this.offsetToAxisValueOffsets = byte_ar.readUnsignedInt();
        this.elidedFallbackNameId = byte_ar.readUnsignedShort();
        this.designAxes = [];
        this.axisValues = [];
        const axesStart = start + this.designAxesOffset;
        for (let i = 0; i < this.designAxisCount; i++) {
            byte_ar.offset = axesStart + (i * this.designAxisSize);
            this.designAxes.push({
                tag: String.fromCharCode(byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte(), byte_ar.readUnsignedByte()),
                nameId: byte_ar.readUnsignedShort(),
                ordering: byte_ar.readUnsignedShort()
            });
        }
        byte_ar.offset = start + this.offsetToAxisValueOffsets;
        const offsets = [];
        for (let i = 0; i < this.axisValueCount; i++)
            offsets.push(byte_ar.readUnsignedShort());
        for (const offset of offsets)
            this.axisValues.push(this.readAxisValue(byte_ar, start + offset));
    }
    readAxisValue(byte_ar, offset) {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedShort();
        let out = { format };
        if (format === 1) {
            out = { format, axisIndex: byte_ar.readUnsignedShort(), flags: byte_ar.readUnsignedShort(), valueNameId: byte_ar.readUnsignedShort(), value: byte_ar.readFixed() };
        }
        else if (format === 2) {
            out = {
                format,
                axisIndex: byte_ar.readUnsignedShort(),
                flags: byte_ar.readUnsignedShort(),
                valueNameId: byte_ar.readUnsignedShort(),
                nominalValue: byte_ar.readFixed(),
                rangeMinValue: byte_ar.readFixed(),
                rangeMaxValue: byte_ar.readFixed()
            };
        }
        else if (format === 3) {
            out = {
                format,
                axisIndex: byte_ar.readUnsignedShort(),
                flags: byte_ar.readUnsignedShort(),
                valueNameId: byte_ar.readUnsignedShort(),
                value: byte_ar.readFixed(),
                linkedValue: byte_ar.readFixed()
            };
        }
        else if (format === 4) {
            const axisCount = byte_ar.readUnsignedShort();
            const flags = byte_ar.readUnsignedShort();
            const valueNameId = byte_ar.readUnsignedShort();
            const axisValues = [];
            for (let i = 0; i < axisCount; i++) {
                axisValues.push({ axisIndex: byte_ar.readUnsignedShort(), value: byte_ar.readFixed() });
            }
            out = { format, flags, valueNameId, axisValues };
        }
        byte_ar.offset = prev;
        return out;
    }
    getType() {
        return Table.STAT;
    }
}

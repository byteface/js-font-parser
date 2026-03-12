import { Table } from "./Table.js";
function readAscii(byte_ar, length) {
    return String.fromCharCode(...byte_ar.readBytes(length)).replace(/\0+$/g, "");
}
export class PcltTable {
    version;
    fontNumber;
    pitch;
    xHeight;
    style;
    typeFamily;
    capHeight;
    symbolSet;
    typeface;
    characterComplement;
    fileName;
    strokeWeight;
    widthType;
    serifStyle;
    reserved;
    constructor(de, byte_ar) {
        byte_ar.offset = de.offset;
        this.version = byte_ar.readFixed();
        this.fontNumber = byte_ar.readUnsignedInt();
        this.pitch = byte_ar.readUnsignedShort();
        this.xHeight = byte_ar.readUnsignedShort();
        this.style = byte_ar.readUnsignedShort();
        this.typeFamily = byte_ar.readUnsignedShort();
        this.capHeight = byte_ar.readUnsignedShort();
        this.symbolSet = byte_ar.readUnsignedShort();
        this.typeface = readAscii(byte_ar, 16);
        this.characterComplement = readAscii(byte_ar, 8);
        this.fileName = readAscii(byte_ar, 6);
        this.strokeWeight = byte_ar.readByte();
        this.widthType = byte_ar.readByte();
        this.serifStyle = byte_ar.readUnsignedByte();
        this.reserved = byte_ar.readUnsignedByte();
    }
    getType() {
        return Table.PCLT;
    }
}

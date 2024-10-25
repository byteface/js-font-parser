import { Table } from "./Table.js";
var NameRecord = /** @class */ (function () {
    function NameRecord(byte_ar) {
        this.platformId = byte_ar.readShort();
        this.encodingId = byte_ar.readShort();
        this.languageId = byte_ar.readShort();
        this.nameId = byte_ar.readShort();
        this.stringLength = byte_ar.readShort();
        this.stringOffset = byte_ar.readShort();
        this.record = "";
        // console.log("NameRecord!!");
    }
    NameRecord.prototype.loadString = function (byte_ar, stringStorageOffset) {
        var sb = "";
        byte_ar.offset = stringStorageOffset + this.stringOffset; // Set the position in the ByteArray
        if (this.platformId === Table.platformAppleUnicode) {
            // Unicode (big-endian)
            for (var i = 0; i < this.stringLength / 2; i++) {
                sb += String.fromCharCode(byte_ar.readUnsignedByte());
                sb += String.fromCharCode(byte_ar.readUnsignedByte());
            }
        }
        else if (this.platformId === Table.platformMacintosh) {
            // Macintosh encoding, ASCII
            sb += String.fromCharCode(byte_ar.readUnsignedByte());
        }
        else if (this.platformId === Table.platformISO) {
            sb += String.fromCharCode(byte_ar.readUnsignedByte());
        }
        else if (this.platformId === Table.platformMicrosoft) {
            // Microsoft encoding, Unicode
            for (var h = 0; h < this.stringLength / 2; h++) {
                sb += String.fromCharCode(byte_ar.readUnsignedByte());
                sb += String.fromCharCode(byte_ar.readUnsignedByte());
            }
        }
        this.record = sb;
        // console.log('loadString::', this.record);
    };
    return NameRecord;
}());
export { NameRecord };

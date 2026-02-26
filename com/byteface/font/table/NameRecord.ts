import { ByteArray } from "../utils/ByteArray.js";
import { Table } from "./Table.js";

export class NameRecord {
    platformId: number;
    encodingId: number;
    languageId: number;
    nameId: number;
    stringLength: number;
    stringOffset: number;
    record: string;

    constructor(byte_ar: ByteArray) {
        this.platformId = byte_ar.readShort();
        this.encodingId = byte_ar.readShort();
        this.languageId = byte_ar.readShort();
        this.nameId = byte_ar.readShort();
        this.stringLength = byte_ar.readShort();
        this.stringOffset = byte_ar.readShort();
        this.record = "";

        // console.log("NameRecord!!");
    }

    loadString(byte_ar: ByteArray, stringStorageOffset: number): void {
        let sb = "";
        byte_ar.offset = stringStorageOffset + this.stringOffset; // Set the position in the ByteArray

        if (this.platformId === Table.platformAppleUnicode) {
            // Unicode (UTF-16BE)
            for (let i = 0; i < this.stringLength / 2; i++) {
                const hi = byte_ar.readUnsignedByte();
                const lo = byte_ar.readUnsignedByte();
                sb += String.fromCharCode((hi << 8) | lo);
            }
        } else if (this.platformId === Table.platformMacintosh) {
            // Macintosh encoding, ASCII/roman fallback
            for (let i = 0; i < this.stringLength; i++) {
                sb += String.fromCharCode(byte_ar.readUnsignedByte());
            }
        } else if (this.platformId === Table.platformISO) {
            for (let i = 0; i < this.stringLength; i++) {
                sb += String.fromCharCode(byte_ar.readUnsignedByte());
            }
        } else if (this.platformId === Table.platformMicrosoft) {
            // Microsoft encoding, Unicode (UTF-16BE)
            for (let h = 0; h < this.stringLength / 2; h++) {
                const hi = byte_ar.readUnsignedByte();
                const lo = byte_ar.readUnsignedByte();
                sb += String.fromCharCode((hi << 8) | lo);
            }
        }

        this.record = sb;
        // console.log('loadString::', this.record);
    }
}

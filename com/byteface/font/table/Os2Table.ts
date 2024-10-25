import { ByteArray } from '../utils/ByteArray.js';
import { Panose } from './Panose.js';
import { Table } from './Table.js';
import { DirectoryEntry } from './DirectoryEntry.js';

export class Os2Table {
    version: number = 0;
    xAvgCharWidth: number = 0;
    usWeightClass: number = 0;
    usWidthClass: number = 0;
    fsType: number = 0;
    ySubscriptXSize: number = 0;
    ySubscriptYSize: number = 0;
    ySubscriptXOffset: number = 0;
    ySubscriptYOffset: number = 0;
    ySuperscriptXSize: number = 0;
    ySuperscriptYSize: number = 0;
    ySuperscriptXOffset: number = 0;
    ySuperscriptYOffset: number = 0;
    yStrikeoutSize: number = 0;
    yStrikeoutPosition: number = 0;
    sFamilyClass: number = 0;
    panose: Panose | null = null;
    ulUnicodeRange1: number = 0;
    ulUnicodeRange2: number = 0;
    ulUnicodeRange3: number = 0;
    ulUnicodeRange4: number = 0;
    achVendorID: number = 0;
    fsSelection: number = 0;
    usFirstCharIndex: number = 0;
    usLastCharIndex: number = 0;
    sTypoAscender: number = 0;
    sTypoDescender: number = 0;
    sTypoLineGap: number = 0;
    usWinAscent: number = 0;
    usWinDescent: number = 0;
    ulCodePageRange1: number = 0;
    ulCodePageRange2: number = 0;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        byte_ar.offset = de.offset;

        this.version = byte_ar.readUnsignedShort();
        this.xAvgCharWidth = byte_ar.readShort();
        this.usWeightClass = byte_ar.readUnsignedShort();
        this.usWidthClass = byte_ar.readUnsignedShort();
        this.fsType = byte_ar.readShort();
        this.ySubscriptXSize = byte_ar.readShort();
        this.ySubscriptYSize = byte_ar.readShort();
        this.ySubscriptXOffset = byte_ar.readShort();
        this.ySubscriptYOffset = byte_ar.readShort();
        this.ySuperscriptXSize = byte_ar.readShort();
        this.ySuperscriptYSize = byte_ar.readShort();
        this.ySuperscriptXOffset = byte_ar.readShort();
        this.ySuperscriptYOffset = byte_ar.readShort();
        this.yStrikeoutSize = byte_ar.readShort();
        this.yStrikeoutPosition = byte_ar.readShort();
        this.sFamilyClass = byte_ar.readShort();

        byte_ar.offset = de.offset;

        const buf: number[] = [];
        for (let i = 0; i < 10; i++) {
            buf.push(byte_ar.readUnsignedByte());
        }
        this.panose = new Panose(buf);

        this.ulUnicodeRange1 = byte_ar.readInt();
        this.ulUnicodeRange2 = byte_ar.readInt();
        this.ulUnicodeRange3 = byte_ar.readInt();
        this.ulUnicodeRange4 = byte_ar.readInt();
        this.achVendorID = byte_ar.readInt();
        this.fsSelection = byte_ar.readShort();
        this.usFirstCharIndex = byte_ar.readShort();
        this.usLastCharIndex = byte_ar.readShort();
        this.sTypoAscender = byte_ar.readShort();
        this.sTypoDescender = byte_ar.readShort();
        this.sTypoLineGap = byte_ar.readShort();
        this.usWinAscent = byte_ar.readShort();
        this.usWinDescent = byte_ar.readShort();
        this.ulCodePageRange1 = byte_ar.readInt();
        this.ulCodePageRange2 = byte_ar.readInt();
    }

    getType(): number {
        return Table.OS_2;
    }
}

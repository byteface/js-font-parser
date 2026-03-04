import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
import { Table } from './Table.js';
import { CffIndex } from './CffIndex.js';
import { CffDict } from './CffDict.js';
import { CffGlyphDescription } from './CffGlyphDescription.js';
import { IGlyphDescription } from './IGlyphDescription.js';

type CffPoint = { x: number; y: number; onCurve: boolean; endOfContour: boolean };

export class CffTable implements ITable {
    private baseOffset: number;
    private charStrings: Uint8Array[] = [];
    private globalSubrs: Uint8Array[] = [];
    private localSubrs: Uint8Array[] = [];
    private fdSelect: number[] = [];
    private privateInfos: Array<{ subrs: Uint8Array[]; nominalWidthX: number; defaultWidthX: number }> = [];
    private nominalWidthX: number = 0;
    private defaultWidthX: number = 0;

    constructor(de: DirectoryEntry, byte_ar: ByteArray) {
        this.baseOffset = de.offset;
        byte_ar.offset = de.offset;

        const major = byte_ar.readUnsignedByte();
        const minor = byte_ar.readUnsignedByte();
        const hdrSize = byte_ar.readUnsignedByte();
        byte_ar.readUnsignedByte(); // offSize

        if (major !== 1) {
            // Only CFF v1 supported
            return;
        }

        byte_ar.offset = this.baseOffset + hdrSize;
        CffIndex.read(byte_ar); // Name INDEX (ignore)
        const topDictIndex = CffIndex.read(byte_ar);
        CffIndex.read(byte_ar); // String INDEX (ignore)
        const globalSubrIndex = CffIndex.read(byte_ar);
        this.globalSubrs = globalSubrIndex.objects;

        const topDictData = topDictIndex.objects[0];
        if (!topDictData) return;
        const topDict = CffDict.parse(topDictData);
        const charStringsOffset = topDict.getNumber('charStrings', 0);
        const privateInfo = topDict.getArray('private');
        const fdArrayOffset = topDict.getNumber('fdArray', 0);
        const fdSelectOffset = topDict.getNumber('fdSelect', 0);
        const ros = topDict.getArray('ros');

        if (privateInfo && privateInfo.length >= 2) {
            const size = privateInfo[0];
            const offset = privateInfo[1];
            const privateStart = this.baseOffset + offset;
            byte_ar.offset = privateStart;
            const privateBytes = byte_ar.readBytes(size);
            const privateDict = CffDict.parse(privateBytes);
            this.nominalWidthX = privateDict.getNumber('nominalWidthX', 0);
            this.defaultWidthX = privateDict.getNumber('defaultWidthX', 0);
            const subrsOffset = privateDict.getNumber('subrs', 0);
            if (subrsOffset > 0) {
                const subrsIndex = CffIndex.read(byte_ar, privateStart + subrsOffset);
                this.localSubrs = subrsIndex.objects;
            }
        }

        // CID-keyed CFF: use FDArray/FDSelect
        if (ros && fdArrayOffset > 0) {
            const fdArrayIndex = CffIndex.read(byte_ar, this.baseOffset + fdArrayOffset);
            this.privateInfos = fdArrayIndex.objects.map(bytes => {
                const fdDict = CffDict.parse(bytes);
                const info = fdDict.getArray('private');
                if (!info || info.length < 2) return { subrs: [], nominalWidthX: 0, defaultWidthX: 0 };
                const size = info[0];
                const offset = info[1];
                const privateStart = this.baseOffset + offset;
                byte_ar.offset = privateStart;
                const privateBytes = byte_ar.readBytes(size);
                const privateDict = CffDict.parse(privateBytes);
                const nominalWidthX = privateDict.getNumber('nominalWidthX', 0);
                const defaultWidthX = privateDict.getNumber('defaultWidthX', 0);
                const subrsOffset = privateDict.getNumber('subrs', 0);
                if (subrsOffset > 0) {
                    const subrsIndex = CffIndex.read(byte_ar, privateStart + subrsOffset);
                    return { subrs: subrsIndex.objects, nominalWidthX, defaultWidthX };
                }
                return { subrs: [], nominalWidthX, defaultWidthX };
            });
        }
        if (charStringsOffset > 0) {
            const charStringsIndex = CffIndex.read(byte_ar, this.baseOffset + charStringsOffset);
            this.charStrings = charStringsIndex.objects;
        }

        if (ros && fdSelectOffset > 0) {
            this.fdSelect = this.readFdSelect(byte_ar, this.baseOffset + fdSelectOffset, this.charStrings.length);
        } else {
            this.fdSelect = new Array(this.charStrings.length).fill(0);
        }
    }

    getType(): number {
        return Table.CFF;
    }

    getGlyphDescription(glyphId: number): IGlyphDescription | null {
        const charString = this.charStrings[glyphId];
        if (!charString) return null;
        const fdIndex = this.fdSelect[glyphId] ?? 0;
        const localSubrs = this.privateInfos[fdIndex]?.subrs ?? this.localSubrs;
        const { points, endPts } = this.parseCharString(charString, localSubrs);
        return new CffGlyphDescription(points, endPts);
    }

    getDefaultWidthX(): number {
        return this.defaultWidthX;
    }

    private getSubrBias(subrs: Uint8Array[]): number {
        const n = subrs.length;
        if (n < 1240) return 107;
        if (n < 33900) return 1131;
        return 32768;
    }

    private readFdSelect(byte_ar: ByteArray, offset: number, numGlyphs: number): number[] {
        const prev = byte_ar.offset;
        byte_ar.offset = offset;
        const format = byte_ar.readUnsignedByte();
        const fdSelect = new Array(numGlyphs).fill(0);
        if (format === 0) {
            for (let i = 0; i < numGlyphs; i++) {
                fdSelect[i] = byte_ar.readUnsignedByte();
            }
        } else if (format === 3) {
            const nRanges = byte_ar.readUnsignedShort();
            const ranges: { first: number; fd: number }[] = [];
            for (let i = 0; i < nRanges; i++) {
                ranges.push({ first: byte_ar.readUnsignedShort(), fd: byte_ar.readUnsignedShort() });
            }
            const sentinel = byte_ar.readUnsignedShort();
            for (let i = 0; i < ranges.length; i++) {
                const start = ranges[i].first;
                const end = (i + 1 < ranges.length ? ranges[i + 1].first : sentinel) - 1;
                for (let g = start; g <= end && g < numGlyphs; g++) {
                    fdSelect[g] = ranges[i].fd;
                }
            }
        } else if (format === 4) {
            const nRanges = byte_ar.readUnsignedInt();
            const ranges: { first: number; fd: number }[] = [];
            for (let i = 0; i < nRanges; i++) {
                ranges.push({ first: byte_ar.readUnsignedInt(), fd: byte_ar.readUnsignedShort() });
            }
            const sentinel = byte_ar.readUnsignedInt();
            for (let i = 0; i < ranges.length; i++) {
                const start = ranges[i].first;
                const end = (i + 1 < ranges.length ? ranges[i + 1].first : sentinel) - 1;
                for (let g = start; g <= end && g < numGlyphs; g++) {
                    fdSelect[g] = ranges[i].fd;
                }
            }
        }
        byte_ar.offset = prev;
        return fdSelect;
    }

    private parseCharString(charString: Uint8Array, localSubrs: Uint8Array[]): { points: CffPoint[]; endPts: number[] } {
        const points: CffPoint[] = [];
        const endPts: number[] = [];
        let x = 0;
        let y = 0;
        let contourOpen = false;
        let stemCount = 0;

        const stack: number[] = [];
        const gsubrs = this.globalSubrs;
        const lsubrs = localSubrs;
        const gBias = this.getSubrBias(gsubrs);
        const lBias = this.getSubrBias(lsubrs);

        const addPoint = (dx: number, dy: number, onCurve: boolean) => {
            x += dx;
            y += dy;
            points.push({ x, y, onCurve, endOfContour: false });
        };

        const closeContour = () => {
            if (!contourOpen || points.length === 0) return;
            points[points.length - 1].endOfContour = true;
            endPts.push(points.length - 1);
            contourOpen = false;
        };

        const ensureMove = () => {
            if (!contourOpen) {
                points.push({ x, y, onCurve: true, endOfContour: false });
                contourOpen = true;
            }
        };

        const parse = (bytes: Uint8Array) => {
            let i = 0;
            while (i < bytes.length) {
                const b0 = bytes[i++];
                if (b0 >= 32 || b0 === 28 || b0 === 255) {
                    const [num, next] = this.readCharStringNumber(bytes, i - 1);
                    stack.push(num);
                    i = next;
                    continue;
                }

                const args = stack.splice(0, stack.length);
                switch (b0) {
                    case 1: // hstem
                    case 3: // vstem
                    case 18: // hstemhm
                    case 23: // vstemhm
                        // width may be first if odd count
                        if (args.length % 2 === 1) args.shift();
                        stemCount += Math.floor(args.length / 2);
                        break;
                    case 4: { // vmoveto
                        if (args.length % 2 === 1) args.shift();
                        closeContour();
                        const dy = args.pop() ?? 0;
                        y += dy;
                        points.push({ x, y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 5: { // rlineto
                        ensureMove();
                        for (let j = 0; j < args.length; j += 2) {
                            addPoint(args[j] ?? 0, args[j + 1] ?? 0, true);
                        }
                        break;
                    }
                    case 6: { // hlineto
                        ensureMove();
                        let horizontal = true;
                        for (let j = 0; j < args.length; j++) {
                            if (horizontal) addPoint(args[j], 0, true);
                            else addPoint(0, args[j], true);
                            horizontal = !horizontal;
                        }
                        break;
                    }
                    case 7: { // vlineto
                        ensureMove();
                        let vertical = true;
                        for (let j = 0; j < args.length; j++) {
                            if (vertical) addPoint(0, args[j], true);
                            else addPoint(args[j], 0, true);
                            vertical = !vertical;
                        }
                        break;
                    }
                    case 8: { // rrcurveto
                        ensureMove();
                        for (let j = 0; j < args.length; j += 6) {
                            addPoint(args[j] ?? 0, args[j + 1] ?? 0, false);
                            addPoint(args[j + 2] ?? 0, args[j + 3] ?? 0, false);
                            addPoint(args[j + 4] ?? 0, args[j + 5] ?? 0, true);
                        }
                        break;
                    }
                    case 10: { // callsubr
                        const subrIndex = (args.pop() ?? 0) + lBias;
                        const subr = lsubrs[subrIndex];
                        if (subr) parse(subr);
                        break;
                    }
                    case 11: // return
                        return;
                    case 14: { // endchar
                        closeContour();
                        return;
                    }
                    case 19: // hintmask
                    case 20: { // cntrmask
                        // width may be first if odd count
                        if (args.length % 2 === 1) args.shift();
                        stemCount += Math.floor(args.length / 2);
                        const maskBytes = Math.ceil(stemCount / 8);
                        i += maskBytes;
                        break;
                    }
                    case 21: { // rmoveto
                        if (args.length % 2 === 1) args.shift();
                        closeContour();
                        const dy = args.pop() ?? 0;
                        const dx = args.pop() ?? 0;
                        x += dx;
                        y += dy;
                        points.push({ x, y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 22: { // hmoveto
                        if (args.length % 2 === 1) args.shift();
                        closeContour();
                        const dx = args.pop() ?? 0;
                        x += dx;
                        points.push({ x, y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 24: { // rcurveline
                        ensureMove();
                        const lineArgs = args.slice(-2);
                        const curveArgs = args.slice(0, -2);
                        for (let j = 0; j < curveArgs.length; j += 6) {
                            addPoint(curveArgs[j] ?? 0, curveArgs[j + 1] ?? 0, false);
                            addPoint(curveArgs[j + 2] ?? 0, curveArgs[j + 3] ?? 0, false);
                            addPoint(curveArgs[j + 4] ?? 0, curveArgs[j + 5] ?? 0, true);
                        }
                        if (lineArgs.length === 2) {
                            addPoint(lineArgs[0], lineArgs[1], true);
                        }
                        break;
                    }
                    case 25: { // rlinecurve
                        ensureMove();
                        const curveArgs = args.slice(-6);
                        const lineArgs = args.slice(0, -6);
                        for (let j = 0; j < lineArgs.length; j += 2) {
                            addPoint(lineArgs[j] ?? 0, lineArgs[j + 1] ?? 0, true);
                        }
                        if (curveArgs.length === 6) {
                            addPoint(curveArgs[0], curveArgs[1], false);
                            addPoint(curveArgs[2], curveArgs[3], false);
                            addPoint(curveArgs[4], curveArgs[5], true);
                        }
                        break;
                    }
                    case 26: { // vvcurveto
                        ensureMove();
                        let idx = 0;
                        let dx1 = 0;
                        if (args.length % 4 === 1) {
                            dx1 = args[idx++] ?? 0;
                        }
                        while (idx + 3 < args.length) {
                            const dy1 = args[idx++] ?? 0;
                            const dx2 = args[idx++] ?? 0;
                            const dy2 = args[idx++] ?? 0;
                            const dy3 = args[idx++] ?? 0;
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(0, dy3, true);
                            dx1 = 0;
                        }
                        break;
                    }
                    case 27: { // hhcurveto
                        ensureMove();
                        let idx = 0;
                        let dy1 = 0;
                        if (args.length % 4 === 1) {
                            dy1 = args[idx++] ?? 0;
                        }
                        while (idx + 3 < args.length) {
                            const dx1 = args[idx++] ?? 0;
                            const dx2 = args[idx++] ?? 0;
                            const dy2 = args[idx++] ?? 0;
                            const dx3 = args[idx++] ?? 0;
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(dx3, 0, true);
                            dy1 = 0;
                        }
                        break;
                    }
                    case 29: { // callgsubr
                        const subrIndex = (args.pop() ?? 0) + gBias;
                        const subr = gsubrs[subrIndex];
                        if (subr) parse(subr);
                        break;
                    }
                    case 30: // vhcurveto
                    case 31: { // hvcurveto
                        ensureMove();
                        let idx = 0;
                        let horizontal = b0 === 31;
                        while (idx + 3 < args.length) {
                            if (horizontal) {
                                const dx1 = args[idx++] ?? 0;
                                const dx2 = args[idx++] ?? 0;
                                const dy2 = args[idx++] ?? 0;
                                let dy3 = args[idx++] ?? 0;
                                let dx3 = 0;
                                if (idx === args.length - 1) {
                                    dx3 = args[idx++] ?? 0;
                                }
                                addPoint(dx1, 0, false);
                                addPoint(dx2, dy2, false);
                                addPoint(dx3, dy3, true);
                            } else {
                                const dy1 = args[idx++] ?? 0;
                                const dx2 = args[idx++] ?? 0;
                                const dy2 = args[idx++] ?? 0;
                                let dx3 = args[idx++] ?? 0;
                                let dy3 = 0;
                                if (idx === args.length - 1) {
                                    dy3 = args[idx++] ?? 0;
                                }
                                addPoint(0, dy1, false);
                                addPoint(dx2, dy2, false);
                                addPoint(dx3, dy3, true);
                            }
                            horizontal = !horizontal;
                        }
                        break;
                    }
                    case 12: { // escape
                        const op = bytes[i++];
                        // flex operators - approximate as curves
                        if (op === 34 || op === 35 || op === 36 || op === 37) {
                            if (args.length >= 12) {
                                addPoint(args[0], args[1], false);
                                addPoint(args[2], args[3], false);
                                addPoint(args[4], args[5], true);
                                addPoint(args[6], args[7], false);
                                addPoint(args[8], args[9], false);
                                addPoint(args[10], args[11], true);
                            }
                        }
                        break;
                    }
                    default:
                        break;
                }
            }
        };

        parse(charString);
        closeContour();
        return { points, endPts };
    }

    private readCharStringNumber(bytes: Uint8Array, start: number): [number, number] {
        const b0 = bytes[start];
        if (b0 >= 32 && b0 <= 246) return [b0 - 139, start + 1];
        if (b0 >= 247 && b0 <= 250) return [(b0 - 247) * 256 + bytes[start + 1] + 108, start + 2];
        if (b0 >= 251 && b0 <= 254) return [-(b0 - 251) * 256 - bytes[start + 1] - 108, start + 2];
        if (b0 === 28) {
            const v = (bytes[start + 1] << 8) | bytes[start + 2];
            return [v & 0x8000 ? v - 0x10000 : v, start + 3];
        }
        if (b0 === 255) {
            const v = (bytes[start + 1] << 24) | (bytes[start + 2] << 16) | (bytes[start + 3] << 8) | bytes[start + 4];
            return [v / 65536, start + 5];
        }
        return [0, start + 1];
    }
}

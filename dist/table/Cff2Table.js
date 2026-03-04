import { CffIndex } from './CffIndex.js';
import { CffDict } from './CffDict.js';
import { CffGlyphDescription } from './CffGlyphDescription.js';
import { Table } from './Table.js';
var Cff2Table = /** @class */ (function () {
    function Cff2Table(de, byte_ar) {
        var _this = this;
        this.charStrings = [];
        this.globalSubrs = [];
        this.fdSelect = [];
        this.privateInfos = [];
        this.baseOffset = de.offset;
        byte_ar.offset = de.offset;
        var major = byte_ar.readUnsignedByte();
        byte_ar.readUnsignedByte();
        var hdrSize = byte_ar.readUnsignedByte();
        var topDictLength = byte_ar.readUnsignedShort();
        if (major !== 2) {
            return;
        }
        var topDictStart = this.baseOffset + hdrSize;
        byte_ar.offset = topDictStart;
        var topDictData = byte_ar.readBytes(topDictLength);
        var topDict = CffDict.parse(topDictData);
        var globalSubrIndex = CffIndex.read(byte_ar, topDictStart + topDictLength);
        this.globalSubrs = globalSubrIndex.objects;
        var charStringsOffset = topDict.getNumber('charStrings', 0);
        if (charStringsOffset > 0) {
            var charStringsIndex = CffIndex.read(byte_ar, this.baseOffset + charStringsOffset);
            this.charStrings = charStringsIndex.objects;
        }
        var fdArrayOffset = topDict.getNumber('fdArray', 0);
        var fdSelectOffset = topDict.getNumber('fdSelect', 0);
        if (fdArrayOffset > 0) {
            var fdArrayIndex = CffIndex.read(byte_ar, this.baseOffset + fdArrayOffset);
            var fdDicts = fdArrayIndex.objects.map(function (bytes) { return CffDict.parse(bytes); });
            this.privateInfos = fdDicts.map(function (dict) {
                var info = dict.getArray('private');
                if (!info || info.length < 2)
                    return { subrs: [] };
                var size = info[0];
                var offset = info[1];
                var privateStart = _this.baseOffset + offset;
                byte_ar.offset = privateStart;
                var privateBytes = byte_ar.readBytes(size);
                var privateDict = CffDict.parse(privateBytes);
                var subrsOffset = privateDict.getNumber('subrs', 0);
                if (subrsOffset > 0) {
                    var subrsIndex = CffIndex.read(byte_ar, privateStart + subrsOffset);
                    return { subrs: subrsIndex.objects };
                }
                return { subrs: [] };
            });
        }
        if (fdSelectOffset > 0 && this.charStrings.length) {
            this.fdSelect = this.readFdSelect(byte_ar, this.baseOffset + fdSelectOffset, this.charStrings.length);
        }
        else {
            this.fdSelect = new Array(this.charStrings.length).fill(0);
        }
    }
    Cff2Table.prototype.getType = function () {
        return Table.CFF2;
    };
    Cff2Table.prototype.getGlyphDescription = function (glyphId) {
        var charString = this.charStrings[glyphId];
        if (!charString)
            return null;
        var fdIndex = this.fdSelect[glyphId] || 0;
        var localSubrs = (this.privateInfos[fdIndex] && this.privateInfos[fdIndex].subrs) || [];
        var _a = this.parseCharString(charString, localSubrs), points = _a.points, endPts = _a.endPts;
        return new CffGlyphDescription(points, endPts);
    };
    Cff2Table.prototype.readFdSelect = function (byte_ar, offset, numGlyphs) {
        var prev = byte_ar.offset;
        byte_ar.offset = offset;
        var format = byte_ar.readUnsignedByte();
        var fdSelect = new Array(numGlyphs).fill(0);
        if (format === 0) {
            for (var i = 0; i < numGlyphs; i++) {
                fdSelect[i] = byte_ar.readUnsignedByte();
            }
        }
        else if (format === 3) {
            var nRanges = byte_ar.readUnsignedShort();
            var ranges = [];
            for (var i = 0; i < nRanges; i++) {
                ranges.push({ first: byte_ar.readUnsignedShort(), fd: byte_ar.readUnsignedShort() });
            }
            var sentinel = byte_ar.readUnsignedShort();
            for (var i = 0; i < ranges.length; i++) {
                var start = ranges[i].first;
                var end = (i + 1 < ranges.length ? ranges[i + 1].first : sentinel) - 1;
                for (var g = start; g <= end && g < numGlyphs; g++) {
                    fdSelect[g] = ranges[i].fd;
                }
            }
        }
        else if (format === 4) {
            var nRanges = byte_ar.readUnsignedInt();
            var ranges = [];
            for (var i = 0; i < nRanges; i++) {
                ranges.push({ first: byte_ar.readUnsignedInt(), fd: byte_ar.readUnsignedShort() });
            }
            var sentinel = byte_ar.readUnsignedInt();
            for (var i = 0; i < ranges.length; i++) {
                var start = ranges[i].first;
                var end = (i + 1 < ranges.length ? ranges[i + 1].first : sentinel) - 1;
                for (var g = start; g <= end && g < numGlyphs; g++) {
                    fdSelect[g] = ranges[i].fd;
                }
            }
        }
        byte_ar.offset = prev;
        return fdSelect;
    };
    Cff2Table.prototype.getSubrBias = function (subrs) {
        var n = subrs.length;
        if (n < 1240)
            return 107;
        if (n < 33900)
            return 1131;
        return 32768;
    };
    Cff2Table.prototype.parseCharString = function (charString, localSubrs) {
        var _this = this;
        var points = [];
        var endPts = [];
        var x = 0;
        var y = 0;
        var contourOpen = false;
        var stemCount = 0;
        var widthUsed = false;
        var vsIndex = 0;
        var stack = [];
        var gsubrs = this.globalSubrs;
        var lsubrs = localSubrs;
        var gBias = this.getSubrBias(gsubrs);
        var lBias = this.getSubrBias(lsubrs);
        var addPoint = function (dx, dy, onCurve) {
            x += dx;
            y += dy;
            points.push({ x: x, y: y, onCurve: onCurve, endOfContour: false });
        };
        var closeContour = function () {
            if (!contourOpen || points.length === 0)
                return;
            points[points.length - 1].endOfContour = true;
            endPts.push(points.length - 1);
            contourOpen = false;
        };
        var ensureMove = function () {
            if (!contourOpen) {
                points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                contourOpen = true;
            }
        };
        var parse = function (bytes) {
            var i = 0;
            while (i < bytes.length) {
                var b0 = bytes[i++];
                if (b0 >= 32 || b0 === 28 || b0 === 255) {
                    var _a = _this.readCharStringNumber(bytes, i - 1), num = _a[0], next = _a[1];
                    stack.push(num);
                    i = next;
                    continue;
                }
                var args = stack.splice(0, stack.length);
                var consumeWidthIfOdd = function () {
                    if (!widthUsed && args.length % 2 === 1) {
                        args.shift();
                        widthUsed = true;
                    }
                };
                var consumeWidthIfMoreThanOne = function () {
                    if (!widthUsed && args.length > 1) {
                        args.shift();
                        widthUsed = true;
                    }
                };
                switch (b0) {
                    case 1:
                    case 3:
                    case 18:
                    case 23:
                        consumeWidthIfOdd();
                        stemCount += Math.floor(args.length / 2);
                        break;
                    case 4: {
                        consumeWidthIfMoreThanOne();
                        closeContour();
                        var dy = args.pop() || 0;
                        y += dy;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 5: {
                        ensureMove();
                        for (var j = 0; j < args.length; j += 2) {
                            addPoint(args[j] || 0, args[j + 1] || 0, true);
                        }
                        break;
                    }
                    case 6: {
                        ensureMove();
                        var horizontal = true;
                        for (var j = 0; j < args.length; j++) {
                            if (horizontal)
                                addPoint(args[j], 0, true);
                            else
                                addPoint(0, args[j], true);
                            horizontal = !horizontal;
                        }
                        break;
                    }
                    case 7: {
                        ensureMove();
                        var vertical = true;
                        for (var j = 0; j < args.length; j++) {
                            if (vertical)
                                addPoint(0, args[j], true);
                            else
                                addPoint(args[j], 0, true);
                            vertical = !vertical;
                        }
                        break;
                    }
                    case 8: {
                        ensureMove();
                        for (var j = 0; j < args.length; j += 6) {
                            addPoint(args[j] || 0, args[j + 1] || 0, false);
                            addPoint(args[j + 2] || 0, args[j + 3] || 0, false);
                            addPoint(args[j + 4] || 0, args[j + 5] || 0, true);
                        }
                        break;
                    }
                    case 10: {
                        var subrIndex = (args.pop() || 0) + lBias;
                        var subr = lsubrs[subrIndex];
                        if (subr)
                            parse(subr);
                        break;
                    }
                    case 11:
                        return;
                    case 14: {
                        closeContour();
                        return;
                    }
                    case 19:
                    case 20: {
                        consumeWidthIfOdd();
                        stemCount += Math.floor(args.length / 2);
                        var maskBytes = Math.ceil(stemCount / 8);
                        i += maskBytes;
                        break;
                    }
                    case 21: {
                        consumeWidthIfOdd();
                        closeContour();
                        var dy = args.pop() || 0;
                        var dx = args.pop() || 0;
                        x += dx;
                        y += dy;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 22: {
                        consumeWidthIfMoreThanOne();
                        closeContour();
                        var dx = args.pop() || 0;
                        x += dx;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 24: {
                        ensureMove();
                        var lineArgs = args.slice(-2);
                        var curveArgs = args.slice(0, -2);
                        for (var j = 0; j < curveArgs.length; j += 6) {
                            addPoint(curveArgs[j] || 0, curveArgs[j + 1] || 0, false);
                            addPoint(curveArgs[j + 2] || 0, curveArgs[j + 3] || 0, false);
                            addPoint(curveArgs[j + 4] || 0, curveArgs[j + 5] || 0, true);
                        }
                        if (lineArgs.length === 2) {
                            addPoint(lineArgs[0], lineArgs[1], true);
                        }
                        break;
                    }
                    case 25: {
                        ensureMove();
                        var curveArgs = args.slice(-6);
                        var lineArgs = args.slice(0, -6);
                        for (var j = 0; j < lineArgs.length; j += 2) {
                            addPoint(lineArgs[j] || 0, lineArgs[j + 1] || 0, true);
                        }
                        if (curveArgs.length === 6) {
                            addPoint(curveArgs[0], curveArgs[1], false);
                            addPoint(curveArgs[2], curveArgs[3], false);
                            addPoint(curveArgs[4], curveArgs[5], true);
                        }
                        break;
                    }
                    case 26: {
                        ensureMove();
                        var idx = 0;
                        var dx1 = 0;
                        if (args.length % 4 === 1) {
                            dx1 = args[idx++] || 0;
                        }
                        while (idx + 3 < args.length) {
                            var dy1 = args[idx++] || 0;
                            var dx2 = args[idx++] || 0;
                            var dy2 = args[idx++] || 0;
                            var dy3 = args[idx++] || 0;
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(0, dy3, true);
                            dx1 = 0;
                        }
                        break;
                    }
                    case 27: {
                        ensureMove();
                        var idx = 0;
                        var dy1 = 0;
                        if (args.length % 4 === 1) {
                            dy1 = args[idx++] || 0;
                        }
                        while (idx + 3 < args.length) {
                            var dx1 = args[idx++] || 0;
                            var dx2 = args[idx++] || 0;
                            var dy2 = args[idx++] || 0;
                            var dx3 = args[idx++] || 0;
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(dx3, 0, true);
                            dy1 = 0;
                        }
                        break;
                    }
                    case 29: {
                        var subrIndex = (args.pop() || 0) + gBias;
                        var subr = gsubrs[subrIndex];
                        if (subr)
                            parse(subr);
                        break;
                    }
                    case 30:
                    case 31: {
                        ensureMove();
                        var idx = 0;
                        var horizontal = b0 === 31;
                        while (idx + 3 < args.length) {
                            if (horizontal) {
                                var dx1 = args[idx++] || 0;
                                var dx2 = args[idx++] || 0;
                                var dy2 = args[idx++] || 0;
                                var dy3 = args[idx++] || 0;
                                var dx3 = 0;
                                if (idx === args.length - 1) {
                                    dx3 = args[idx++] || 0;
                                }
                                addPoint(dx1, 0, false);
                                addPoint(dx2, dy2, false);
                                addPoint(dx3, dy3, true);
                            }
                            else {
                                var dy1 = args[idx++] || 0;
                                var dx2 = args[idx++] || 0;
                                var dy2 = args[idx++] || 0;
                                var dx3 = args[idx++] || 0;
                                var dy3 = 0;
                                if (idx === args.length - 1) {
                                    dy3 = args[idx++] || 0;
                                }
                                addPoint(0, dy1, false);
                                addPoint(dx2, dy2, false);
                                addPoint(dx3, dy3, true);
                            }
                            horizontal = !horizontal;
                        }
                        break;
                    }
                    case 12: {
                        var op = bytes[i++];
                        if (op === 16) { // vsindex
                            vsIndex = args.pop() || 0;
                            break;
                        }
                        if (op === 17) { // blend
                            var n = args.pop() || 0;
                            var total = args.length;
                            if (n > 0 && total >= n) {
                                if (total % n === 0) {
                                    var numRegions = total / n - 1;
                                    var start = total - n * (numRegions + 1);
                                    var base = args.slice(start, start + n);
                                    args.length = start;
                                    args.push.apply(args, base);
                                }
                                else {
                                    var start = total - n;
                                    var base = args.slice(start);
                                    args.length = start;
                                    args.push.apply(args, base);
                                }
                            }
                            break;
                        }
                        if (op === 34 && args.length >= 7) { // hflex
                            var dx1 = args[0], dx2 = args[1], dy2 = args[2], dx3 = args[3], dx4 = args[4], dx5 = args[5], dx6 = args[6];
                            addPoint(dx1, 0, false);
                            addPoint(dx2, dy2, false);
                            addPoint(dx3, 0, true);
                            addPoint(dx4, 0, false);
                            addPoint(dx5, 0, false);
                            addPoint(dx6, 0, true);
                        }
                        else if (op === 35 && args.length >= 12) { // flex
                            var flexArgs = args.length >= 13 ? args.slice(0, 12) : args;
                            addPoint(flexArgs[0], flexArgs[1], false);
                            addPoint(flexArgs[2], flexArgs[3], false);
                            addPoint(flexArgs[4], flexArgs[5], true);
                            addPoint(flexArgs[6], flexArgs[7], false);
                            addPoint(flexArgs[8], flexArgs[9], false);
                            addPoint(flexArgs[10], flexArgs[11], true);
                        }
                        else if (op === 36 && args.length >= 9) { // hflex1
                            var dx1 = args[0], dy1 = args[1], dx2 = args[2], dy2 = args[3], dx3 = args[4], dx4 = args[5], dx5 = args[6], dy5 = args[7], dx6 = args[8];
                            var dy3 = 0;
                            var dy4 = 0;
                            var dy6 = -(dy1 + dy2 + dy3 + dy4 + dy5);
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(dx3, dy3, true);
                            addPoint(dx4, dy4, false);
                            addPoint(dx5, dy5, false);
                            addPoint(dx6, dy6, true);
                        }
                        else if (op === 37 && args.length >= 11) { // flex1
                            var dx1 = args[0], dy1 = args[1], dx2 = args[2], dy2 = args[3], dx3 = args[4], dy3 = args[5], dx4 = args[6], dy4 = args[7], dx5 = args[8], dy5 = args[9], d6 = args[10];
                            var sumdx = dx1 + dx2 + dx3 + dx4 + dx5;
                            var sumdy = dy1 + dy2 + dy3 + dy4 + dy5;
                            var dx6 = 0;
                            var dy6 = 0;
                            if (Math.abs(sumdx) > Math.abs(sumdy)) {
                                dx6 = d6;
                                dy6 = -sumdy;
                            }
                            else {
                                dx6 = -sumdx;
                                dy6 = d6;
                            }
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(dx3, dy3, true);
                            addPoint(dx4, dy4, false);
                            addPoint(dx5, dy5, false);
                            addPoint(dx6, dy6, true);
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
        return { points: points, endPts: endPts };
    };
    Cff2Table.prototype.readCharStringNumber = function (bytes, start) {
        var b0 = bytes[start];
        if (b0 >= 32 && b0 <= 246)
            return [b0 - 139, start + 1];
        if (b0 >= 247 && b0 <= 250)
            return [(b0 - 247) * 256 + bytes[start + 1] + 108, start + 2];
        if (b0 >= 251 && b0 <= 254)
            return [-(b0 - 251) * 256 - bytes[start + 1] - 108, start + 2];
        if (b0 === 28) {
            var v = (bytes[start + 1] << 8) | bytes[start + 2];
            return [v & 0x8000 ? v - 0x10000 : v, start + 3];
        }
        if (b0 === 255) {
            var v = (bytes[start + 1] << 24) | (bytes[start + 2] << 16) | (bytes[start + 3] << 8) | bytes[start + 4];
            return [v / 65536, start + 5];
        }
        return [0, start + 1];
    };
    return Cff2Table;
}());
export { Cff2Table };

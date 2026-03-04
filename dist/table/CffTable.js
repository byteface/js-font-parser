import { Table } from './Table.js';
import { CffIndex } from './CffIndex.js';
import { CffDict } from './CffDict.js';
import { CffGlyphDescription } from './CffGlyphDescription.js';
var CffTable = /** @class */ (function () {
    function CffTable(de, byte_ar) {
        this.charStrings = [];
        this.globalSubrs = [];
        this.localSubrs = [];
        this.fdSelect = [];
        this.privateInfos = [];
        this.nominalWidthX = 0;
        this.defaultWidthX = 0;
        this.baseOffset = de.offset;
        byte_ar.offset = de.offset;
        var major = byte_ar.readUnsignedByte();
        var minor = byte_ar.readUnsignedByte();
        var hdrSize = byte_ar.readUnsignedByte();
        byte_ar.readUnsignedByte(); // offSize
        if (major !== 1) {
            // Only CFF v1 supported
            return;
        }
        byte_ar.offset = this.baseOffset + hdrSize;
        CffIndex.read(byte_ar); // Name INDEX (ignore)
        var topDictIndex = CffIndex.read(byte_ar);
        CffIndex.read(byte_ar); // String INDEX (ignore)
        var globalSubrIndex = CffIndex.read(byte_ar);
        this.globalSubrs = globalSubrIndex.objects;
        var topDictData = topDictIndex.objects[0];
        if (!topDictData)
            return;
        var topDict = CffDict.parse(topDictData);
        var charStringsOffset = topDict.getNumber('charStrings', 0);
        var privateInfo = topDict.getArray('private');
        var fdArrayOffset = topDict.getNumber('fdArray', 0);
        var fdSelectOffset = topDict.getNumber('fdSelect', 0);
        var ros = topDict.getArray('ros');
        if (privateInfo && privateInfo.length >= 2) {
            var size = privateInfo[0];
            var offset = privateInfo[1];
            var privateStart = this.baseOffset + offset;
            byte_ar.offset = privateStart;
            var privateBytes = byte_ar.readBytes(size);
            var privateDict = CffDict.parse(privateBytes);
            this.nominalWidthX = privateDict.getNumber('nominalWidthX', 0);
            this.defaultWidthX = privateDict.getNumber('defaultWidthX', 0);
            var subrsOffset = privateDict.getNumber('subrs', 0);
            if (subrsOffset > 0) {
                var subrsIndex = CffIndex.read(byte_ar, privateStart + subrsOffset);
                this.localSubrs = subrsIndex.objects;
            }
        }
        // CID-keyed CFF: use FDArray/FDSelect
        if (ros && fdArrayOffset > 0) {
            var fdArrayIndex = CffIndex.read(byte_ar, this.baseOffset + fdArrayOffset);
            var _this_1 = this;
            this.privateInfos = fdArrayIndex.objects.map(function (bytes) {
                var fdDict = CffDict.parse(bytes);
                var info = fdDict.getArray('private');
                if (!info || info.length < 2)
                    return { subrs: [], nominalWidthX: 0, defaultWidthX: 0 };
                var size = info[0];
                var offset = info[1];
                var privateStart = _this_1.baseOffset + offset;
                byte_ar.offset = privateStart;
                var privateBytes = byte_ar.readBytes(size);
                var privateDict = CffDict.parse(privateBytes);
                var nominalWidthX = privateDict.getNumber('nominalWidthX', 0);
                var defaultWidthX = privateDict.getNumber('defaultWidthX', 0);
                var subrsOffset = privateDict.getNumber('subrs', 0);
                if (subrsOffset > 0) {
                    var subrsIndex = CffIndex.read(byte_ar, privateStart + subrsOffset);
                    return { subrs: subrsIndex.objects, nominalWidthX: nominalWidthX, defaultWidthX: defaultWidthX };
                }
                return { subrs: [], nominalWidthX: nominalWidthX, defaultWidthX: defaultWidthX };
            });
        }
        if (charStringsOffset > 0) {
            var charStringsIndex = CffIndex.read(byte_ar, this.baseOffset + charStringsOffset);
            this.charStrings = charStringsIndex.objects;
        }
        if (ros && fdSelectOffset > 0) {
            this.fdSelect = this.readFdSelect(byte_ar, this.baseOffset + fdSelectOffset, this.charStrings.length);
        }
        else {
            this.fdSelect = new Array(this.charStrings.length).fill(0);
        }
    }
    CffTable.prototype.getType = function () {
        return Table.CFF;
    };
    CffTable.prototype.getGlyphDescription = function (glyphId) {
        var charString = this.charStrings[glyphId];
        if (!charString)
            return null;
        var fdIndex = this.fdSelect[glyphId] || 0;
        var localSubrs = (this.privateInfos[fdIndex] && this.privateInfos[fdIndex].subrs) || this.localSubrs;
        var _a = this.parseCharString(charString, localSubrs), points = _a.points, endPts = _a.endPts;
        return new CffGlyphDescription(points, endPts);
    };
    CffTable.prototype.getDefaultWidthX = function () {
        return this.defaultWidthX;
    };
    CffTable.prototype.getSubrBias = function (subrs) {
        var n = subrs.length;
        if (n < 1240)
            return 107;
        if (n < 33900)
            return 1131;
        return 32768;
    };
    CffTable.prototype.readFdSelect = function (byte_ar, offset, numGlyphs) {
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
    CffTable.prototype.parseCharString = function (charString, localSubrs) {
        var _this = this;
        var points = [];
        var endPts = [];
        var x = 0;
        var y = 0;
        var contourOpen = false;
        var stemCount = 0;
        var widthUsed = false;
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17;
            var i = 0;
            while (i < bytes.length) {
                var b0 = bytes[i++];
                if (b0 >= 32 || b0 === 28 || b0 === 255) {
                    var _18 = _this.readCharStringNumber(bytes, i - 1), num = _18[0], next = _18[1];
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
                    case 1: // hstem
                    case 3: // vstem
                    case 18: // hstemhm
                    case 23: // vstemhm
                        consumeWidthIfOdd();
                        stemCount += Math.floor(args.length / 2);
                        break;
                    case 4: { // vmoveto
                        consumeWidthIfMoreThanOne();
                        closeContour();
                        var dy = (_a = args.pop()) !== null && _a !== void 0 ? _a : 0;
                        y += dy;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 5: { // rlineto
                        ensureMove();
                        for (var j = 0; j < args.length; j += 2) {
                            addPoint((_b = args[j]) !== null && _b !== void 0 ? _b : 0, (_c = args[j + 1]) !== null && _c !== void 0 ? _c : 0, true);
                        }
                        break;
                    }
                    case 6: { // hlineto
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
                    case 7: { // vlineto
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
                    case 8: { // rrcurveto
                        ensureMove();
                        for (var j = 0; j < args.length; j += 6) {
                            addPoint((_d = args[j]) !== null && _d !== void 0 ? _d : 0, (_e = args[j + 1]) !== null && _e !== void 0 ? _e : 0, false);
                            addPoint((_f = args[j + 2]) !== null && _f !== void 0 ? _f : 0, (_g = args[j + 3]) !== null && _g !== void 0 ? _g : 0, false);
                            addPoint((_h = args[j + 4]) !== null && _h !== void 0 ? _h : 0, (_j = args[j + 5]) !== null && _j !== void 0 ? _j : 0, true);
                        }
                        break;
                    }
                    case 10: { // callsubr
                        var subrIndex = ((_k = args.pop()) !== null && _k !== void 0 ? _k : 0) + lBias;
                        var subr = lsubrs[subrIndex];
                        if (subr)
                            parse(subr);
                        break;
                    }
                    case 11: // return
                        return;
                    case 14: { // endchar
                        if (args.length === 5) {
                            var _a = args, _b = _a[1], adx = _b === void 0 ? 0 : _b, _c = _a[2], ady = _c === void 0 ? 0 : _c, bchar = _a[3], achar = _a[4];
                            var baseBytes = this.charStrings[bchar];
                            var accentBytes = this.charStrings[achar];
                            if (baseBytes) {
                                var baseGlyph = this.parseCharString(baseBytes, localSubrs);
                                var baseOffset = points.length;
                                points.push.apply(points, baseGlyph.points);
                                for (var _i = 0, _d = baseGlyph.endPts; _i < _d.length; _i++) {
                                    var endPt = _d[_i];
                                    endPts.push(baseOffset + endPt);
                                }
                            }
                            if (accentBytes) {
                                var accentGlyph = this.parseCharString(accentBytes, localSubrs);
                                var accentOffset = points.length;
                                var translated = accentGlyph.points.map(function (p) { return ({
                                    x: p.x + adx,
                                    y: p.y + ady,
                                    onCurve: p.onCurve,
                                    endOfContour: p.endOfContour
                                }); });
                                points.push.apply(points, translated);
                                for (var _e = 0, _f = accentGlyph.endPts; _e < _f.length; _e++) {
                                    var endPt = _f[_e];
                                    endPts.push(accentOffset + endPt);
                                }
                            }
                            contourOpen = false;
                            return;
                        }
                        closeContour();
                        return;
                    }
                    case 19: // hintmask
                    case 20: { // cntrmask
                        consumeWidthIfOdd();
                        stemCount += Math.floor(args.length / 2);
                        var maskBytes = Math.ceil(stemCount / 8);
                        i += maskBytes;
                        break;
                    }
                    case 21: { // rmoveto
                        consumeWidthIfOdd();
                        closeContour();
                        var dy = (_l = args.pop()) !== null && _l !== void 0 ? _l : 0;
                        var dx = (_m = args.pop()) !== null && _m !== void 0 ? _m : 0;
                        x += dx;
                        y += dy;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 22: { // hmoveto
                        consumeWidthIfMoreThanOne();
                        closeContour();
                        var dx = (_o = args.pop()) !== null && _o !== void 0 ? _o : 0;
                        x += dx;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 24: { // rcurveline
                        ensureMove();
                        var lineArgs = args.slice(-2);
                        var curveArgs = args.slice(0, -2);
                        for (var j = 0; j < curveArgs.length; j += 6) {
                            addPoint((_p = curveArgs[j]) !== null && _p !== void 0 ? _p : 0, (_q = curveArgs[j + 1]) !== null && _q !== void 0 ? _q : 0, false);
                            addPoint((_r = curveArgs[j + 2]) !== null && _r !== void 0 ? _r : 0, (_s = curveArgs[j + 3]) !== null && _s !== void 0 ? _s : 0, false);
                            addPoint((_t = curveArgs[j + 4]) !== null && _t !== void 0 ? _t : 0, (_u = curveArgs[j + 5]) !== null && _u !== void 0 ? _u : 0, true);
                        }
                        if (lineArgs.length === 2) {
                            addPoint(lineArgs[0], lineArgs[1], true);
                        }
                        break;
                    }
                    case 25: { // rlinecurve
                        ensureMove();
                        var curveArgs = args.slice(-6);
                        var lineArgs = args.slice(0, -6);
                        for (var j = 0; j < lineArgs.length; j += 2) {
                            addPoint((_v = lineArgs[j]) !== null && _v !== void 0 ? _v : 0, (_w = lineArgs[j + 1]) !== null && _w !== void 0 ? _w : 0, true);
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
                        var idx = 0;
                        var dx1 = 0;
                        if (args.length % 4 === 1) {
                            dx1 = (_x = args[idx++]) !== null && _x !== void 0 ? _x : 0;
                        }
                        while (idx + 3 < args.length) {
                            var dy1 = (_y = args[idx++]) !== null && _y !== void 0 ? _y : 0;
                            var dx2 = (_z = args[idx++]) !== null && _z !== void 0 ? _z : 0;
                            var dy2 = (_0 = args[idx++]) !== null && _0 !== void 0 ? _0 : 0;
                            var dy3 = (_1 = args[idx++]) !== null && _1 !== void 0 ? _1 : 0;
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(0, dy3, true);
                            dx1 = 0;
                        }
                        break;
                    }
                    case 27: { // hhcurveto
                        ensureMove();
                        var idx = 0;
                        var dy1 = 0;
                        if (args.length % 4 === 1) {
                            dy1 = (_2 = args[idx++]) !== null && _2 !== void 0 ? _2 : 0;
                        }
                        while (idx + 3 < args.length) {
                            var dx1 = (_3 = args[idx++]) !== null && _3 !== void 0 ? _3 : 0;
                            var dx2 = (_4 = args[idx++]) !== null && _4 !== void 0 ? _4 : 0;
                            var dy2 = (_5 = args[idx++]) !== null && _5 !== void 0 ? _5 : 0;
                            var dx3 = (_6 = args[idx++]) !== null && _6 !== void 0 ? _6 : 0;
                            addPoint(dx1, dy1, false);
                            addPoint(dx2, dy2, false);
                            addPoint(dx3, 0, true);
                            dy1 = 0;
                        }
                        break;
                    }
                    case 29: { // callgsubr
                        var subrIndex = ((_7 = args.pop()) !== null && _7 !== void 0 ? _7 : 0) + gBias;
                        var subr = gsubrs[subrIndex];
                        if (subr)
                            parse(subr);
                        break;
                    }
                    case 30: // vhcurveto
                    case 31: { // hvcurveto
                        ensureMove();
                        var idx = 0;
                        var horizontal = b0 === 31;
                        while (idx + 3 < args.length) {
                            if (horizontal) {
                                var dx1 = (_8 = args[idx++]) !== null && _8 !== void 0 ? _8 : 0;
                                var dx2 = (_9 = args[idx++]) !== null && _9 !== void 0 ? _9 : 0;
                                var dy2 = (_10 = args[idx++]) !== null && _10 !== void 0 ? _10 : 0;
                                var dy3 = (_11 = args[idx++]) !== null && _11 !== void 0 ? _11 : 0;
                                var dx3 = 0;
                                if (idx === args.length - 1) {
                                    dx3 = (_12 = args[idx++]) !== null && _12 !== void 0 ? _12 : 0;
                                }
                                addPoint(dx1, 0, false);
                                addPoint(dx2, dy2, false);
                                addPoint(dx3, dy3, true);
                            }
                            else {
                                var dy1 = (_13 = args[idx++]) !== null && _13 !== void 0 ? _13 : 0;
                                var dx2 = (_14 = args[idx++]) !== null && _14 !== void 0 ? _14 : 0;
                                var dy2 = (_15 = args[idx++]) !== null && _15 !== void 0 ? _15 : 0;
                                var dx3 = (_16 = args[idx++]) !== null && _16 !== void 0 ? _16 : 0;
                                var dy3 = 0;
                                if (idx === args.length - 1) {
                                    dy3 = (_17 = args[idx++]) !== null && _17 !== void 0 ? _17 : 0;
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
                        var op = bytes[i++];
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
    CffTable.prototype.readCharStringNumber = function (bytes, start) {
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
    return CffTable;
}());
export { CffTable };

import { Table } from './Table.js';
import { CffIndex } from './CffIndex.js';
import { CffDict } from './CffDict.js';
import { CffGlyphDescription } from './CffGlyphDescription.js';
import { Debug } from '../utils/Debug.js';
var Cff2Table = /** @class */ (function () {
    function Cff2Table(de, byte_ar) {
        var _this = this;
        this.charStrings = [];
        this.globalSubrs = [];
        this.fdSelect = [];
        this.privateInfos = [];
        this.vstoreRegionCounts = [];
        this.vstoreRegionIndices = [];
        this.vstoreRegions = [];
        this.vstoreAxisCount = 0;
        this.variationCoords = [];
        this.baseOffset = de.offset;
        byte_ar.offset = de.offset;
        var major = byte_ar.readUnsignedByte();
        var minor = byte_ar.readUnsignedByte();
        var hdrSize = byte_ar.readUnsignedByte();
        var topDictLength = byte_ar.readUnsignedShort();
        if (major !== 2) {
            return;
        }
        var topDictStart = this.baseOffset + hdrSize;
        byte_ar.offset = topDictStart;
        var topDictData = byte_ar.readBytes(topDictLength);
        var topDict = CffDict.parse(topDictData);
        var globalSubrIndex = CffIndex.readCff2(byte_ar, topDictStart + topDictLength);
        this.globalSubrs = globalSubrIndex.objects;
        var charStringsOffset = topDict.getNumber('charStrings', 0);
        if (charStringsOffset > 0) {
            var charStringsIndex = CffIndex.readCff2(byte_ar, this.baseOffset + charStringsOffset);
            this.charStrings = charStringsIndex.objects;
        }
        var fdArrayOffset = topDict.getNumber('fdArray', 0);
        var fdSelectOffset = topDict.getNumber('fdSelect', 0);
        var vstoreOffset = topDict.getNumber('vstore', 0);
        if (fdArrayOffset > 0) {
            var fdArrayIndex = CffIndex.readCff2(byte_ar, this.baseOffset + fdArrayOffset);
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
                    var subrsIndex = CffIndex.readCff2(byte_ar, privateStart + subrsOffset);
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
        if (vstoreOffset > 0) {
            this.readVariationStore(byte_ar, this.baseOffset + vstoreOffset);
        }
    }
    Cff2Table.prototype.getType = function () {
        return Table.CFF2;
    };
    Cff2Table.prototype.getGlyphDescription = function (glyphId) {
        var _a, _b, _c;
        var charString = this.charStrings[glyphId];
        if (!charString)
            return null;
        var fdIndex = (_a = this.fdSelect[glyphId]) !== null && _a !== void 0 ? _a : 0;
        var localSubrs = (_c = (_b = this.privateInfos[fdIndex]) === null || _b === void 0 ? void 0 : _b.subrs) !== null && _c !== void 0 ? _c : [];
        var _d = this.parseCharString(charString, localSubrs), points = _d.points, endPts = _d.endPts;
        return new CffGlyphDescription(points, endPts);
    };
    Cff2Table.prototype.setVariationCoords = function (coords) {
        this.variationCoords = coords.slice();
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
    Cff2Table.prototype.readVariationStore = function (byte_ar, offset) {
        var prev = byte_ar.offset;
        var storeOffset = offset;
        byte_ar.offset = storeOffset;
        var format = byte_ar.readUnsignedShort();
        if (format !== 1) {
            // Some fonts appear to prefix the variation store with a 16-bit length.
            byte_ar.offset = storeOffset + 2;
            var altFormat = byte_ar.readUnsignedShort();
            if (altFormat === 1) {
                storeOffset += 2;
                format = altFormat;
            }
            else {
                byte_ar.offset = prev;
                return;
            }
        }
        var regionListOffset = byte_ar.readUnsignedInt();
        var ivdCount = byte_ar.readUnsignedShort();
        var ivdOffsets = [];
        for (var i = 0; i < ivdCount; i++) {
            ivdOffsets.push(byte_ar.readUnsignedInt());
        }
        var regionListPos = storeOffset + regionListOffset;
        byte_ar.offset = regionListPos;
        var axisCount = byte_ar.readUnsignedShort();
        var regionCount = byte_ar.readUnsignedShort();
        this.vstoreAxisCount = axisCount;
        this.vstoreRegions = [];
        for (var r = 0; r < regionCount; r++) {
            var region = [];
            for (var a = 0; a < axisCount; a++) {
                var start = byte_ar.readShort() / 16384;
                var peak = byte_ar.readShort() / 16384;
                var end = byte_ar.readShort() / 16384;
                region.push({ start: start, peak: peak, end: end });
            }
            this.vstoreRegions.push(region);
        }
        this.vstoreRegionCounts = new Array(ivdCount).fill(0);
        this.vstoreRegionIndices = new Array(ivdCount).fill(null).map(function () { return []; });
        for (var i = 0; i < ivdCount; i++) {
            var ivdPos = storeOffset + ivdOffsets[i];
            byte_ar.offset = ivdPos;
            byte_ar.readUnsignedShort(); // itemCount
            byte_ar.readUnsignedShort(); // shortDeltaCount
            var regionIndexCount = byte_ar.readUnsignedShort();
            this.vstoreRegionCounts[i] = regionIndexCount;
            var indices = [];
            for (var r = 0; r < regionIndexCount; r++) {
                indices.push(byte_ar.readUnsignedShort());
            }
            this.vstoreRegionIndices[i] = indices;
        }
        byte_ar.offset = prev;
    };
    Cff2Table.prototype.parseCharString = function (charString, localSubrs) {
        var _this = this;
        var points = [];
        var endPts = [];
        var x = 0;
        var y = 0;
        var contourOpen = false;
        var stemCount = 0;
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
        var applyBlendToStack = function (stack, vsIndexValue) {
            var _a, _b, _c, _d, _e;
            var n = stack.pop();
            if (n == null)
                return;
            var regionCount = (_a = _this.vstoreRegionCounts[vsIndexValue]) !== null && _a !== void 0 ? _a : 0;
            var regionIndices = (_b = _this.vstoreRegionIndices[vsIndexValue]) !== null && _b !== void 0 ? _b : [];
            var blendCount = n * (regionCount + 1);
            if (n <= 0 || stack.length < blendCount)
                return;
            var start = stack.length - blendCount;
            var blendArgs = stack.splice(start, blendCount);
            var base = blendArgs.slice(0, n);
            var deltas = blendArgs.slice(n);
            var coords = _this.variationCoords;
            var regionScalars = [];
            for (var r = 0; r < regionCount; r++) {
                var regionIndex = (_c = regionIndices[r]) !== null && _c !== void 0 ? _c : r;
                var region = _this.vstoreRegions[regionIndex];
                if (!region) {
                    regionScalars.push(0);
                    continue;
                }
                var scalar = 1;
                for (var a = 0; a < region.length; a++) {
                    var coord = (_d = coords[a]) !== null && _d !== void 0 ? _d : 0;
                    var _f = region[a], start_1 = _f.start, peak = _f.peak, end = _f.end;
                    if (start_1 === 0 && peak === 0 && end === 0) {
                        continue;
                    }
                    if (coord === 0) {
                        if (peak !== 0) {
                            scalar = 0;
                            break;
                        }
                        continue;
                    }
                    if (coord < start_1 || coord > end) {
                        scalar = 0;
                        break;
                    }
                    if (coord < peak)
                        scalar *= (coord - start_1) / (peak - start_1);
                    else if (coord > peak)
                        scalar *= (end - coord) / (end - peak);
                }
                regionScalars.push(scalar);
            }
            var out = base.slice();
            for (var r = 0; r < regionCount; r++) {
                var s = (_e = regionScalars[r]) !== null && _e !== void 0 ? _e : 0;
                if (!s)
                    continue;
                for (var i = 0; i < n; i++) {
                    out[i] += deltas[i * regionCount + r] * s;
                }
            }
            stack.push.apply(stack, out);
            if (globalThis === null || globalThis === void 0 ? void 0 : globalThis.__CFF2_TRACE) {
                globalThis.__CFF2_TRACE.push({
                    type: 'blend',
                    vsIndex: vsIndexValue,
                    n: n,
                    coords: coords.slice(),
                    regionIndices: regionIndices.slice(),
                    regionScalars: regionScalars.slice(),
                    base: base.slice(),
                    deltas: deltas.slice(),
                    out: out.slice()
                });
            }
        };
        var MAX_SUBR_DEPTH = 64;
        var parse = function (bytes, depth) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20;
            if (depth === void 0) { depth = 0; }
            if (depth > MAX_SUBR_DEPTH) {
                return;
            }
            var i = 0;
            var blendCount = 0;
            var _loop_1 = function () {
                var b0 = bytes[i++];
                if (b0 >= 32 || b0 === 28 || b0 === 255) {
                    var _21 = _this.readCharStringNumber(bytes, i - 1), num = _21[0], next = _21[1];
                    stack.push(num);
                    i = next;
                    return "continue";
                }
                if (b0 === 11) {
                    return { value: void 0 };
                }
                var args = stack.splice(0, stack.length);
                switch (b0) {
                    case 1:
                    case 3:
                    case 18:
                    case 23: {
                        stemCount += Math.floor(args.length / 2);
                        break;
                    }
                    case 4: {
                        closeContour();
                        var dy = (_a = args.pop()) !== null && _a !== void 0 ? _a : 0;
                        y += dy;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 5: {
                        ensureMove();
                        for (var j = 0; j < args.length; j += 2) {
                            addPoint((_b = args[j]) !== null && _b !== void 0 ? _b : 0, (_c = args[j + 1]) !== null && _c !== void 0 ? _c : 0, true);
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
                            addPoint((_d = args[j]) !== null && _d !== void 0 ? _d : 0, (_e = args[j + 1]) !== null && _e !== void 0 ? _e : 0, false);
                            addPoint((_f = args[j + 2]) !== null && _f !== void 0 ? _f : 0, (_g = args[j + 3]) !== null && _g !== void 0 ? _g : 0, false);
                            addPoint((_h = args[j + 4]) !== null && _h !== void 0 ? _h : 0, (_j = args[j + 5]) !== null && _j !== void 0 ? _j : 0, true);
                        }
                        break;
                    }
                    case 10: {
                        var subrIndex = ((_k = args.pop()) !== null && _k !== void 0 ? _k : 0) + lBias;
                        if (args.length)
                            stack.push.apply(stack, args);
                        var subr = lsubrs[subrIndex];
                        if (subr)
                            parse(subr, depth + 1);
                        break;
                    }
                    case 14: {
                        closeContour();
                        return { value: void 0 };
                    }
                    case 19:
                    case 20: {
                        stemCount += Math.floor(args.length / 2);
                        var maskBytes = Math.ceil(stemCount / 8);
                        i += Math.min(maskBytes, bytes.length - i);
                        break;
                    }
                    case 21: {
                        closeContour();
                        var dy = (_l = args.pop()) !== null && _l !== void 0 ? _l : 0;
                        var dx = (_m = args.pop()) !== null && _m !== void 0 ? _m : 0;
                        x += dx;
                        y += dy;
                        points.push({ x: x, y: y, onCurve: true, endOfContour: false });
                        contourOpen = true;
                        break;
                    }
                    case 22: {
                        closeContour();
                        var dx = (_o = args.pop()) !== null && _o !== void 0 ? _o : 0;
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
                            addPoint((_p = curveArgs[j]) !== null && _p !== void 0 ? _p : 0, (_q = curveArgs[j + 1]) !== null && _q !== void 0 ? _q : 0, false);
                            addPoint((_r = curveArgs[j + 2]) !== null && _r !== void 0 ? _r : 0, (_s = curveArgs[j + 3]) !== null && _s !== void 0 ? _s : 0, false);
                            addPoint((_t = curveArgs[j + 4]) !== null && _t !== void 0 ? _t : 0, (_u = curveArgs[j + 5]) !== null && _u !== void 0 ? _u : 0, true);
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
                            addPoint((_v = lineArgs[j]) !== null && _v !== void 0 ? _v : 0, (_w = lineArgs[j + 1]) !== null && _w !== void 0 ? _w : 0, true);
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
                    case 27: {
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
                    case 15: { // vsindex (CFF2 single-byte)
                        vsIndex = (_7 = args.pop()) !== null && _7 !== void 0 ? _7 : 0;
                        if (args.length)
                            stack.push.apply(stack, args);
                        // debug
                        if (globalThis === null || globalThis === void 0 ? void 0 : globalThis.__CFF2_DEBUG) {
                            Debug.log('CFF2 vsindex', vsIndex);
                        }
                        break;
                    }
                    case 16: { // blend (CFF2 single-byte)
                        stack.push.apply(// blend (CFF2 single-byte)
                        stack, args);
                        applyBlendToStack(stack, vsIndex);
                        blendCount++;
                        break;
                    }
                    case 29: {
                        var subrIndex = ((_8 = args.pop()) !== null && _8 !== void 0 ? _8 : 0) + gBias;
                        if (args.length)
                            stack.push.apply(stack, args);
                        var subr = gsubrs[subrIndex];
                        if (subr)
                            parse(subr, depth + 1);
                        break;
                    }
                    case 30:
                    case 31: {
                        ensureMove();
                        var idx = 0;
                        var horizontal = b0 === 31;
                        while (idx + 3 < args.length) {
                            if (horizontal) {
                                var dx1 = (_9 = args[idx++]) !== null && _9 !== void 0 ? _9 : 0;
                                var dx2 = (_10 = args[idx++]) !== null && _10 !== void 0 ? _10 : 0;
                                var dy2 = (_11 = args[idx++]) !== null && _11 !== void 0 ? _11 : 0;
                                var dy3 = (_12 = args[idx++]) !== null && _12 !== void 0 ? _12 : 0;
                                var dx3 = 0;
                                if (idx === args.length - 1) {
                                    dx3 = (_13 = args[idx++]) !== null && _13 !== void 0 ? _13 : 0;
                                }
                                addPoint(dx1, 0, false);
                                addPoint(dx2, dy2, false);
                                addPoint(dx3, dy3, true);
                            }
                            else {
                                var dy1 = (_14 = args[idx++]) !== null && _14 !== void 0 ? _14 : 0;
                                var dx2 = (_15 = args[idx++]) !== null && _15 !== void 0 ? _15 : 0;
                                var dy2 = (_16 = args[idx++]) !== null && _16 !== void 0 ? _16 : 0;
                                var dx3 = (_17 = args[idx++]) !== null && _17 !== void 0 ? _17 : 0;
                                var dy3 = 0;
                                if (idx === args.length - 1) {
                                    dy3 = (_18 = args[idx++]) !== null && _18 !== void 0 ? _18 : 0;
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
                            vsIndex = (_19 = args.pop()) !== null && _19 !== void 0 ? _19 : 0;
                            if (args.length)
                                stack.push.apply(stack, args);
                            if (globalThis === null || globalThis === void 0 ? void 0 : globalThis.__CFF2_DEBUG) {
                                Debug.log('CFF2 vsindex (esc)', vsIndex);
                            }
                            break;
                        }
                        if (op === 17) { // blend
                            stack.push.apply(// blend
                            stack, args);
                            applyBlendToStack(stack, vsIndex);
                            blendCount++;
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
                if (globalThis === null || globalThis === void 0 ? void 0 : globalThis.__CFF2_TRACE) {
                    globalThis.__CFF2_TRACE.push({
                        type: 'op',
                        op: b0,
                        args: args.slice()
                    });
                }
            };
            while (i < bytes.length) {
                var state_1 = _loop_1();
                if (typeof state_1 === "object")
                    return state_1.value;
            }
            if ((globalThis === null || globalThis === void 0 ? void 0 : globalThis.__CFF2_DEBUG) && blendCount) {
                var regionIndices = (_20 = _this.vstoreRegionIndices[vsIndex]) !== null && _20 !== void 0 ? _20 : [];
                Debug.log('CFF2 blends', blendCount, 'vsindex', vsIndex, 'regions', regionIndices);
            }
        };
        parse(charString, 0);
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

import { Table } from './Table.js';
var ColrTable = /** @class */ (function () {
    function ColrTable(de, byteArray) {
        this.version = 0;
        // COLRv0 fields
        this.baseGlyphRecordsOffset = 0;
        this.layerRecordsOffset = 0;
        this.numBaseGlyphRecords = 0;
        this.numLayerRecords = 0;
        // COLRv1 fields
        this.baseGlyphListOffset = 0;
        this.layerListOffset = 0;
        this.clipListOffset = 0;
        this.varStoreOffset = 0;
        this.baseGlyphRecords = [];
        this.layerRecords = [];
        this.baseGlyphPaintRecords = [];
        this.layerPaintOffsets = [];
        this.start = 0;
        this.baseGlyphListStart = 0;
        this.layerListStart = 0;
        this.variationCoords = [];
        this.varStore = null;
        this.clipBoxes = new Map();
        var start = de.offset;
        var view = byteArray.dataView;
        this.start = start;
        this.view = view;
        byteArray.seek(start);
        this.version = byteArray.readUnsignedShort();
        if (this.version === 0) {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();
            var baseOffset = start + this.baseGlyphRecordsOffset;
            this.baseGlyphRecords = [];
            for (var i = 0; i < this.numBaseGlyphRecords; i++) {
                var offset = baseOffset + i * 6;
                this.baseGlyphRecords.push({
                    glyphId: view.getUint16(offset, false),
                    firstLayerIndex: view.getUint16(offset + 2, false),
                    numLayers: view.getUint16(offset + 4, false)
                });
            }
            var layerOffset = start + this.layerRecordsOffset;
            this.layerRecords = [];
            for (var i = 0; i < this.numLayerRecords; i++) {
                var offset = layerOffset + i * 4;
                this.layerRecords.push({
                    glyphId: view.getUint16(offset, false),
                    paletteIndex: view.getUint16(offset + 2, false)
                });
            }
        }
        else {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();
            this.baseGlyphListOffset = byteArray.readUnsignedInt();
            this.layerListOffset = byteArray.readUnsignedInt();
            this.clipListOffset = byteArray.readUnsignedInt();
            this.varStoreOffset = byteArray.readUnsignedInt();
            if (this.baseGlyphRecordsOffset && this.numBaseGlyphRecords) {
                var baseOffset = start + this.baseGlyphRecordsOffset;
                this.baseGlyphRecords = [];
                for (var i = 0; i < this.numBaseGlyphRecords; i++) {
                    var offset = baseOffset + i * 6;
                    this.baseGlyphRecords.push({
                        glyphId: view.getUint16(offset, false),
                        firstLayerIndex: view.getUint16(offset + 2, false),
                        numLayers: view.getUint16(offset + 4, false)
                    });
                }
            }
            if (this.layerRecordsOffset && this.numLayerRecords) {
                var layerOffset = start + this.layerRecordsOffset;
                this.layerRecords = [];
                for (var i = 0; i < this.numLayerRecords; i++) {
                    var offset = layerOffset + i * 4;
                    this.layerRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paletteIndex: view.getUint16(offset + 2, false)
                    });
                }
            }
            if (this.baseGlyphListOffset) {
                var listOffset = start + this.baseGlyphListOffset;
                this.baseGlyphListStart = listOffset;
                var count = view.getUint32(listOffset, false);
                this.baseGlyphPaintRecords = [];
                for (var i = 0; i < count; i++) {
                    var offset = listOffset + 4 + i * 6;
                    this.baseGlyphPaintRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paintOffset: view.getUint32(offset + 2, false)
                    });
                }
            }
            if (this.layerListOffset) {
                var listOffset = start + this.layerListOffset;
                this.layerListStart = listOffset;
                var count = view.getUint32(listOffset, false);
                this.layerPaintOffsets = [];
                for (var i = 0; i < count; i++) {
                    var offset = listOffset + 4 + i * 4;
                    var rel = view.getUint32(offset, false);
                    this.layerPaintOffsets.push(listOffset + rel);
                }
            }
            if (this.clipListOffset) {
                this.readClipList(byteArray, start + this.clipListOffset);
            }
            if (this.varStoreOffset) {
                this.readVariationStore(byteArray, start + this.varStoreOffset);
            }
        }
    }
    ColrTable.prototype.getLayersForGlyph = function (glyphId) {
        if (this.baseGlyphRecords.length === 0 || this.layerRecords.length === 0)
            return [];
        var record = this.baseGlyphRecords.find(function (r) { return r.glyphId === glyphId; });
        if (!record)
            return [];
        var start = record.firstLayerIndex;
        var end = start + record.numLayers;
        return this.layerRecords.slice(start, end);
    };
    ColrTable.prototype.getType = function () {
        return Table.COLR;
    };
    ColrTable.prototype.setVariationCoords = function (coords) {
        this.variationCoords = coords.slice();
    };
    ColrTable.prototype.getClipForGlyph = function (glyphId) {
        var _a;
        return (_a = this.clipBoxes.get(glyphId)) !== null && _a !== void 0 ? _a : null;
    };
    ColrTable.prototype.getPaintForGlyph = function (glyphId) {
        if (!this.baseGlyphPaintRecords.length)
            return null;
        var record = this.baseGlyphPaintRecords.find(function (r) { return r.glyphId === glyphId; });
        if (!record)
            return null;
        var paintAbs = this.baseGlyphListStart + record.paintOffset;
        return this.readPaint(paintAbs, paintAbs, 0);
    };
    ColrTable.prototype.readPaint = function (offset, baseOffset, depth) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16;
        if (depth === void 0) { depth = 0; }
        if (depth > 64)
            return null;
        if (offset < 0 || offset >= this.view.byteLength)
            return null;
        var format = this.view.getUint8(offset);
        switch (format) {
            case 1: { // PaintColrLayers
                var numLayers = this.view.getUint8(offset + 1);
                var firstLayerIndex = this.view.getUint32(offset + 2, false);
                var layers = [];
                for (var i = 0; i < numLayers; i++) {
                    var paintOffset = this.layerPaintOffsets[firstLayerIndex + i];
                    if (paintOffset == null)
                        continue;
                    var paint = this.readPaint(paintOffset, paintOffset, depth + 1);
                    if (paint)
                        layers.push(paint);
                }
                return { format: format, layers: layers };
            }
            case 2: { // PaintSolid
                var paletteIndex = this.view.getUint16(offset + 1, false);
                var alphaRaw = this.view.getInt16(offset + 3, false);
                var alpha = alphaRaw / 16384;
                return { format: format, paletteIndex: paletteIndex, alpha: alpha };
            }
            case 3: { // PaintVarSolid
                var paletteIndex = this.view.getUint16(offset + 1, false);
                var alphaRaw = this.view.getInt16(offset + 3, false);
                var alpha = alphaRaw / 16384;
                var varIndexBase = this.view.getUint32(offset + 5, false);
                var deltas = this.getVarDeltas(varIndexBase, 1);
                return { format: format, paletteIndex: paletteIndex, alpha: alpha + ((_a = deltas[0]) !== null && _a !== void 0 ? _a : 0), varIndexBase: varIndexBase };
            }
            case 4: { // PaintLinearGradient
                var colorLineOffset = this.readOffset24(offset + 1);
                var x0 = this.view.getInt16(offset + 4, false);
                var y0 = this.view.getInt16(offset + 6, false);
                var x1 = this.view.getInt16(offset + 8, false);
                var y1 = this.view.getInt16(offset + 10, false);
                var x2 = this.view.getInt16(offset + 12, false);
                var y2 = this.view.getInt16(offset + 14, false);
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format: format, colorLine: colorLine, x0: x0, y0: y0, x1: x1, y1: y1, x2: x2, y2: y2 };
            }
            case 5: { // PaintVarLinearGradient
                var colorLineOffset = this.readOffset24(offset + 1);
                var x0 = this.view.getInt16(offset + 4, false);
                var y0 = this.view.getInt16(offset + 6, false);
                var x1 = this.view.getInt16(offset + 8, false);
                var y1 = this.view.getInt16(offset + 10, false);
                var x2 = this.view.getInt16(offset + 12, false);
                var y2 = this.view.getInt16(offset + 14, false);
                var varIndexBase = this.view.getUint32(offset + 16, false);
                var deltas = this.getVarDeltas(varIndexBase, 6);
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return {
                    format: format,
                    colorLine: colorLine,
                    x0: x0 + ((_b = deltas[0]) !== null && _b !== void 0 ? _b : 0),
                    y0: y0 + ((_c = deltas[1]) !== null && _c !== void 0 ? _c : 0),
                    x1: x1 + ((_d = deltas[2]) !== null && _d !== void 0 ? _d : 0),
                    y1: y1 + ((_e = deltas[3]) !== null && _e !== void 0 ? _e : 0),
                    x2: x2 + ((_f = deltas[4]) !== null && _f !== void 0 ? _f : 0),
                    y2: y2 + ((_g = deltas[5]) !== null && _g !== void 0 ? _g : 0),
                    varIndexBase: varIndexBase
                };
            }
            case 8: { // PaintRadialGradient
                var colorLineOffset = this.readOffset24(offset + 1);
                var x0 = this.view.getInt16(offset + 4, false);
                var y0 = this.view.getInt16(offset + 6, false);
                var x1 = this.view.getInt16(offset + 8, false);
                var y1 = this.view.getInt16(offset + 10, false);
                var r0 = this.view.getInt16(offset + 12, false);
                var r1 = this.view.getInt16(offset + 14, false);
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format: format, colorLine: colorLine, x0: x0, y0: y0, x1: x1, y1: y1, r0: r0, r1: r1 };
            }
            case 9: { // PaintVarRadialGradient
                var colorLineOffset = this.readOffset24(offset + 1);
                var x0 = this.view.getInt16(offset + 4, false);
                var y0 = this.view.getInt16(offset + 6, false);
                var x1 = this.view.getInt16(offset + 8, false);
                var y1 = this.view.getInt16(offset + 10, false);
                var r0 = this.view.getInt16(offset + 12, false);
                var r1 = this.view.getInt16(offset + 14, false);
                var varIndexBase = this.view.getUint32(offset + 16, false);
                var deltas = this.getVarDeltas(varIndexBase, 6);
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return {
                    format: format,
                    colorLine: colorLine,
                    x0: x0 + ((_h = deltas[0]) !== null && _h !== void 0 ? _h : 0),
                    y0: y0 + ((_j = deltas[1]) !== null && _j !== void 0 ? _j : 0),
                    x1: x1 + ((_k = deltas[2]) !== null && _k !== void 0 ? _k : 0),
                    y1: y1 + ((_l = deltas[3]) !== null && _l !== void 0 ? _l : 0),
                    r0: r0 + ((_m = deltas[4]) !== null && _m !== void 0 ? _m : 0),
                    r1: r1 + ((_o = deltas[5]) !== null && _o !== void 0 ? _o : 0),
                    varIndexBase: varIndexBase
                };
            }
            case 6: { // PaintSweepGradient
                var colorLineOffset = this.readOffset24(offset + 1);
                var centerX = this.view.getInt16(offset + 4, false);
                var centerY = this.view.getInt16(offset + 6, false);
                var startAngle = this.readF2Dot14(offset + 8);
                var endAngle = this.readF2Dot14(offset + 10);
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format: format, colorLine: colorLine, centerX: centerX, centerY: centerY, startAngle: startAngle, endAngle: endAngle };
            }
            case 7: { // PaintVarSweepGradient
                var colorLineOffset = this.readOffset24(offset + 1);
                var centerX = this.view.getInt16(offset + 4, false);
                var centerY = this.view.getInt16(offset + 6, false);
                var startAngle = this.readF2Dot14(offset + 8);
                var endAngle = this.readF2Dot14(offset + 10);
                var varIndexBase = this.view.getUint32(offset + 12, false);
                var deltas = this.getVarDeltas(varIndexBase, 4);
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return {
                    format: format,
                    colorLine: colorLine,
                    centerX: centerX + ((_p = deltas[0]) !== null && _p !== void 0 ? _p : 0),
                    centerY: centerY + ((_q = deltas[1]) !== null && _q !== void 0 ? _q : 0),
                    startAngle: startAngle + ((_r = deltas[2]) !== null && _r !== void 0 ? _r : 0),
                    endAngle: endAngle + ((_s = deltas[3]) !== null && _s !== void 0 ? _s : 0),
                    varIndexBase: varIndexBase
                };
            }
            case 10: { // PaintGlyph
                var paintOffset = this.readOffset24(offset + 1);
                var glyphID = this.view.getUint16(offset + 4, false);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, glyphID: glyphID, paint: paint };
            }
            case 11: { // PaintColrGlyph
                var glyphID = this.view.getUint16(offset + 1, false);
                return { format: format, glyphID: glyphID };
            }
            case 12: { // PaintTransform
                var paintOffset = this.readOffset24(offset + 1);
                var transformOffset = this.readOffset24(offset + 4);
                var transform = this.readAffine2x3(baseOffset + transformOffset);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, transform: transform };
            }
            case 13: { // PaintVarTransform
                var paintOffset = this.readOffset24(offset + 1);
                var transformOffset = this.readOffset24(offset + 4);
                var varIndexBase = this.view.getUint32(offset + 7, false);
                var transform = this.readAffine2x3(baseOffset + transformOffset);
                var deltas = this.getVarDeltas(varIndexBase, 6);
                var adjusted = {
                    xx: transform.xx + ((_t = deltas[0]) !== null && _t !== void 0 ? _t : 0),
                    yx: transform.yx + ((_u = deltas[1]) !== null && _u !== void 0 ? _u : 0),
                    xy: transform.xy + ((_v = deltas[2]) !== null && _v !== void 0 ? _v : 0),
                    yy: transform.yy + ((_w = deltas[3]) !== null && _w !== void 0 ? _w : 0),
                    dx: transform.dx + ((_x = deltas[4]) !== null && _x !== void 0 ? _x : 0),
                    dy: transform.dy + ((_y = deltas[5]) !== null && _y !== void 0 ? _y : 0)
                };
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, transform: adjusted, varIndexBase: varIndexBase };
            }
            case 14: { // PaintTranslate
                var paintOffset = this.readOffset24(offset + 1);
                var dx = this.view.getInt16(offset + 4, false);
                var dy = this.view.getInt16(offset + 6, false);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, dx: dx, dy: dy };
            }
            case 15: { // PaintVarTranslate
                var paintOffset = this.readOffset24(offset + 1);
                var dx = this.view.getInt16(offset + 4, false);
                var dy = this.view.getInt16(offset + 6, false);
                var varIndexBase = this.view.getUint32(offset + 8, false);
                var deltas = this.getVarDeltas(varIndexBase, 2);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, dx: dx + ((_z = deltas[0]) !== null && _z !== void 0 ? _z : 0), dy: dy + ((_0 = deltas[1]) !== null && _0 !== void 0 ? _0 : 0), varIndexBase: varIndexBase };
            }
            case 16: { // PaintScale
                var paintOffset = this.readOffset24(offset + 1);
                var scaleX = this.readF2Dot14(offset + 4);
                var scaleY = this.readF2Dot14(offset + 6);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scaleX: scaleX, scaleY: scaleY };
            }
            case 17: { // PaintVarScale
                var paintOffset = this.readOffset24(offset + 1);
                var scaleX = this.readF2Dot14(offset + 4);
                var scaleY = this.readF2Dot14(offset + 6);
                var varIndexBase = this.view.getUint32(offset + 8, false);
                var deltas = this.getVarDeltas(varIndexBase, 2);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scaleX: scaleX + ((_1 = deltas[0]) !== null && _1 !== void 0 ? _1 : 0), scaleY: scaleY + ((_2 = deltas[1]) !== null && _2 !== void 0 ? _2 : 0), varIndexBase: varIndexBase };
            }
            case 18: { // PaintScaleAroundCenter
                var paintOffset = this.readOffset24(offset + 1);
                var scaleX = this.readF2Dot14(offset + 4);
                var scaleY = this.readF2Dot14(offset + 6);
                var centerX = this.view.getInt16(offset + 8, false);
                var centerY = this.view.getInt16(offset + 10, false);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scaleX: scaleX, scaleY: scaleY, centerX: centerX, centerY: centerY };
            }
            case 19: { // PaintVarScaleAroundCenter
                var paintOffset = this.readOffset24(offset + 1);
                var scaleX = this.readF2Dot14(offset + 4);
                var scaleY = this.readF2Dot14(offset + 6);
                var centerX = this.view.getInt16(offset + 8, false);
                var centerY = this.view.getInt16(offset + 10, false);
                var varIndexBase = this.view.getUint32(offset + 12, false);
                var deltas = this.getVarDeltas(varIndexBase, 4);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return {
                    format: format,
                    paint: paint,
                    scaleX: scaleX + ((_3 = deltas[0]) !== null && _3 !== void 0 ? _3 : 0),
                    scaleY: scaleY + ((_4 = deltas[1]) !== null && _4 !== void 0 ? _4 : 0),
                    centerX: centerX + ((_5 = deltas[2]) !== null && _5 !== void 0 ? _5 : 0),
                    centerY: centerY + ((_6 = deltas[3]) !== null && _6 !== void 0 ? _6 : 0),
                    varIndexBase: varIndexBase
                };
            }
            case 22: { // PaintScaleUniformAroundCenter
                var paintOffset = this.readOffset24(offset + 1);
                var scale = this.readF2Dot14(offset + 4);
                var centerX = this.view.getInt16(offset + 6, false);
                var centerY = this.view.getInt16(offset + 8, false);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scale: scale, centerX: centerX, centerY: centerY };
            }
            case 20: { // PaintScaleUniform
                var paintOffset = this.readOffset24(offset + 1);
                var scale = this.readF2Dot14(offset + 4);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scale: scale };
            }
            case 21: { // PaintVarScaleUniform
                var paintOffset = this.readOffset24(offset + 1);
                var scale = this.readF2Dot14(offset + 4);
                var varIndexBase = this.view.getUint32(offset + 6, false);
                var deltas = this.getVarDeltas(varIndexBase, 1);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scale: scale + ((_7 = deltas[0]) !== null && _7 !== void 0 ? _7 : 0), varIndexBase: varIndexBase };
            }
            case 23: { // PaintVarScaleUniformAroundCenter
                var paintOffset = this.readOffset24(offset + 1);
                var scale = this.readF2Dot14(offset + 4);
                var centerX = this.view.getInt16(offset + 6, false);
                var centerY = this.view.getInt16(offset + 8, false);
                var varIndexBase = this.view.getUint32(offset + 10, false);
                var deltas = this.getVarDeltas(varIndexBase, 3);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return {
                    format: format,
                    paint: paint,
                    scale: scale + ((_8 = deltas[0]) !== null && _8 !== void 0 ? _8 : 0),
                    centerX: centerX + ((_9 = deltas[1]) !== null && _9 !== void 0 ? _9 : 0),
                    centerY: centerY + ((_10 = deltas[2]) !== null && _10 !== void 0 ? _10 : 0),
                    varIndexBase: varIndexBase
                };
            }
            case 24: { // PaintRotate
                var paintOffset = this.readOffset24(offset + 1);
                var angle = this.readF2Dot14(offset + 4);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, angle: angle };
            }
            case 25: { // PaintVarRotate
                var paintOffset = this.readOffset24(offset + 1);
                var angle = this.readF2Dot14(offset + 4);
                var varIndexBase = this.view.getUint32(offset + 6, false);
                var deltas = this.getVarDeltas(varIndexBase, 1);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, angle: angle + ((_11 = deltas[0]) !== null && _11 !== void 0 ? _11 : 0), varIndexBase: varIndexBase };
            }
            case 26: { // PaintRotateAroundCenter
                var paintOffset = this.readOffset24(offset + 1);
                var angle = this.readF2Dot14(offset + 4);
                var centerX = this.view.getInt16(offset + 6, false);
                var centerY = this.view.getInt16(offset + 8, false);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, angle: angle, centerX: centerX, centerY: centerY };
            }
            case 27: { // PaintVarRotateAroundCenter
                var paintOffset = this.readOffset24(offset + 1);
                var angle = this.readF2Dot14(offset + 4);
                var centerX = this.view.getInt16(offset + 6, false);
                var centerY = this.view.getInt16(offset + 8, false);
                var varIndexBase = this.view.getUint32(offset + 10, false);
                var deltas = this.getVarDeltas(varIndexBase, 3);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return {
                    format: format,
                    paint: paint,
                    angle: angle + ((_12 = deltas[0]) !== null && _12 !== void 0 ? _12 : 0),
                    centerX: centerX + ((_13 = deltas[1]) !== null && _13 !== void 0 ? _13 : 0),
                    centerY: centerY + ((_14 = deltas[2]) !== null && _14 !== void 0 ? _14 : 0),
                    varIndexBase: varIndexBase
                };
            }
            case 30: { // PaintSkew
                var paintOffset = this.readOffset24(offset + 1);
                var xSkew = this.readF2Dot14(offset + 4);
                var ySkew = this.readF2Dot14(offset + 6);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, xSkew: xSkew, ySkew: ySkew };
            }
            case 29: { // PaintVarSkew
                var paintOffset = this.readOffset24(offset + 1);
                var xSkew = this.readF2Dot14(offset + 4);
                var ySkew = this.readF2Dot14(offset + 6);
                var varIndexBase = this.view.getUint32(offset + 8, false);
                var deltas = this.getVarDeltas(varIndexBase, 2);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, xSkew: xSkew + ((_15 = deltas[0]) !== null && _15 !== void 0 ? _15 : 0), ySkew: ySkew + ((_16 = deltas[1]) !== null && _16 !== void 0 ? _16 : 0), varIndexBase: varIndexBase };
            }
            case 32: { // PaintComposite
                var sourceOffset = this.readOffset24(offset + 1);
                var backdropOffset = this.readOffset24(offset + 4);
                var compositeMode = this.view.getUint8(offset + 7);
                var sourcePaint = this.readPaint(baseOffset + sourceOffset, baseOffset + sourceOffset, depth + 1);
                var backdropPaint = this.readPaint(baseOffset + backdropOffset, baseOffset + backdropOffset, depth + 1);
                return { format: format, sourcePaint: sourcePaint, backdropPaint: backdropPaint, compositeMode: compositeMode };
            }
            case 31: { // PaintVarComposite
                var sourceOffset = this.readOffset24(offset + 1);
                var backdropOffset = this.readOffset24(offset + 4);
                var compositeMode = this.view.getUint8(offset + 7);
                var varIndexBase = this.view.getUint32(offset + 8, false);
                var sourcePaint = this.readPaint(baseOffset + sourceOffset, baseOffset + sourceOffset, depth + 1);
                var backdropPaint = this.readPaint(baseOffset + backdropOffset, baseOffset + backdropOffset, depth + 1);
                return { format: format, sourcePaint: sourcePaint, backdropPaint: backdropPaint, compositeMode: compositeMode, varIndexBase: varIndexBase };
            }
            default:
                return { format: format };
        }
    };
    ColrTable.prototype.readOffset24 = function (offset) {
        return (this.view.getUint8(offset) << 16) | (this.view.getUint8(offset + 1) << 8) | this.view.getUint8(offset + 2);
    };
    ColrTable.prototype.readFixed16_16 = function (offset) {
        var raw = this.view.getInt32(offset, false);
        return raw / 65536;
    };
    ColrTable.prototype.readF2Dot14 = function (offset) {
        var raw = this.view.getInt16(offset, false);
        return raw / 16384;
    };
    ColrTable.prototype.readAffine2x3 = function (offset) {
        return {
            xx: this.readFixed16_16(offset),
            yx: this.readFixed16_16(offset + 4),
            xy: this.readFixed16_16(offset + 8),
            yy: this.readFixed16_16(offset + 12),
            dx: this.readFixed16_16(offset + 16),
            dy: this.readFixed16_16(offset + 20)
        };
    };
    ColrTable.prototype.readColorLine = function (offset) {
        var extend = this.view.getUint8(offset);
        var numStops = this.view.getUint16(offset + 1, false);
        var stops = [];
        var cursor = offset + 3;
        for (var i = 0; i < numStops; i++) {
            var stopOffset = this.readF2Dot14(cursor);
            var paletteIndex = this.view.getUint16(cursor + 2, false);
            var alpha = this.readF2Dot14(cursor + 4);
            stops.push({ stopOffset: stopOffset, paletteIndex: paletteIndex, alpha: alpha });
            cursor += 6;
        }
        return { extend: extend, stops: stops };
    };
    ColrTable.prototype.readVariationStore = function (byteArray, offset) {
        var prev = byteArray.offset;
        byteArray.offset = offset;
        var format = byteArray.readUnsignedShort();
        if (format !== 1) {
            byteArray.offset = prev;
            return;
        }
        var regionListOffset = byteArray.readUnsignedInt();
        var dataCount = byteArray.readUnsignedShort();
        var dataOffsets = [];
        for (var i = 0; i < dataCount; i++) {
            dataOffsets.push(byteArray.readUnsignedInt());
        }
        var regionListPos = offset + regionListOffset;
        byteArray.offset = regionListPos;
        var axisCount = byteArray.readUnsignedShort();
        var regionCount = byteArray.readUnsignedShort();
        var regions = [];
        for (var r = 0; r < regionCount; r++) {
            var region = [];
            for (var a = 0; a < axisCount; a++) {
                var start = byteArray.readShort() / 16384;
                var peak = byteArray.readShort() / 16384;
                var end = byteArray.readShort() / 16384;
                region.push({ start: start, peak: peak, end: end });
            }
            regions.push(region);
        }
        this.varStore = { axisCount: axisCount, regions: regions, dataOffsets: dataOffsets, start: offset };
        byteArray.offset = prev;
    };
    ColrTable.prototype.getVarDeltas = function (varIndexBase, count) {
        var out = new Array(count).fill(0);
        for (var i = 0; i < count; i++) {
            out[i] = this.getVarDelta(varIndexBase + i);
        }
        return out;
    };
    ColrTable.prototype.getVarDelta = function (varIndex) {
        var _this = this;
        if (!this.varStore)
            return 0;
        var outer = (varIndex >>> 16) & 0xffff;
        var inner = varIndex & 0xffff;
        var dataOffset = this.varStore.dataOffsets[outer];
        if (dataOffset == null)
            return 0;
        var dataPos = this.varStore.start + dataOffset;
        var view = this.view;
        var itemCount = view.getUint16(dataPos, false);
        var shortDeltaCount = view.getUint16(dataPos + 2, false);
        var regionIndexCount = view.getUint16(dataPos + 4, false);
        if (inner >= itemCount)
            return 0;
        var regionIndices = [];
        var cursor = dataPos + 6;
        for (var i = 0; i < regionIndexCount; i++) {
            regionIndices.push(view.getUint16(cursor, false));
            cursor += 2;
        }
        var scalar = function (regionIndex) {
            var _a;
            var region = _this.varStore.regions[regionIndex];
            if (!region)
                return 0;
            var s = 1;
            for (var a = 0; a < region.length; a++) {
                var coord = (_a = _this.variationCoords[a]) !== null && _a !== void 0 ? _a : 0;
                var _b = region[a], start = _b.start, peak = _b.peak, end = _b.end;
                if (coord === 0 || (start === 0 && peak === 0 && end === 0))
                    continue;
                if (coord < start || coord > end) {
                    s = 0;
                    break;
                }
                if (coord < peak)
                    s *= (coord - start) / (peak - start);
                else if (coord > peak)
                    s *= (end - coord) / (end - peak);
            }
            return s;
        };
        var deltaRecordSize = shortDeltaCount * 2 + (regionIndexCount - shortDeltaCount);
        var recordStart = cursor + inner * deltaRecordSize;
        var delta = 0;
        var p = recordStart;
        for (var r = 0; r < regionIndexCount; r++) {
            var regionIdx = regionIndices[r];
            var s = scalar(regionIdx);
            var d = r < shortDeltaCount ? view.getInt16(p, false) : view.getInt8(p);
            p += r < shortDeltaCount ? 2 : 1;
            delta += d * s;
        }
        return delta;
    };
    ColrTable.prototype.readClipList = function (byteArray, offset) {
        var prev = byteArray.offset;
        byteArray.offset = offset;
        var format = byteArray.readUnsignedShort();
        if (format !== 1 && format !== 2) {
            var alt = byteArray.readUnsignedByte();
            if (alt === 1 || alt === 2) {
                format = alt;
            }
            else {
                byteArray.offset = prev;
                return;
            }
        }
        var clipCount = byteArray.readUnsignedShort();
        for (var i = 0; i < clipCount; i++) {
            var glyphId = byteArray.readUnsignedShort();
            var clipOffset = byteArray.readUnsignedInt();
            var box = this.readClipBox(offset + clipOffset);
            if (box)
                this.clipBoxes.set(glyphId, box);
        }
        byteArray.offset = prev;
    };
    ColrTable.prototype.readClipBox = function (offset) {
        var format = this.view.getUint16(offset, false);
        var cursor = offset + 2;
        if (format !== 1 && format !== 2) {
            format = this.view.getUint8(offset);
            cursor = offset + 1;
        }
        if (format !== 1 && format !== 2)
            return null;
        var xMin = this.view.getInt16(cursor, false);
        var yMin = this.view.getInt16(cursor + 2, false);
        var xMax = this.view.getInt16(cursor + 4, false);
        var yMax = this.view.getInt16(cursor + 6, false);
        if (format === 1) {
            return { xMin: xMin, yMin: yMin, xMax: xMax, yMax: yMax };
        }
        // ClipBoxVar: four VariationIndex values follow
        var varIndexBase = cursor + 8;
        var dxMin = this.getVarDelta(this.view.getUint32(varIndexBase, false));
        var dyMin = this.getVarDelta(this.view.getUint32(varIndexBase + 4, false));
        var dxMax = this.getVarDelta(this.view.getUint32(varIndexBase + 8, false));
        var dyMax = this.getVarDelta(this.view.getUint32(varIndexBase + 12, false));
        return {
            xMin: xMin + dxMin,
            yMin: yMin + dyMin,
            xMax: xMax + dxMax,
            yMax: yMax + dyMax
        };
    };
    return ColrTable;
}());
export { ColrTable };

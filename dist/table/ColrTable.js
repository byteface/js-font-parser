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
                return { format: format, paletteIndex: paletteIndex, alpha: alpha, varIndexBase: varIndexBase };
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
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format: format, colorLine: colorLine, x0: x0, y0: y0, x1: x1, y1: y1, x2: x2, y2: y2, varIndexBase: varIndexBase };
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
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format: format, colorLine: colorLine, x0: x0, y0: y0, x1: x1, y1: y1, r0: r0, r1: r1, varIndexBase: varIndexBase };
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
                var colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format: format, colorLine: colorLine, centerX: centerX, centerY: centerY, startAngle: startAngle, endAngle: endAngle, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, transform: transform, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, dx: dx, dy: dy, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scaleX: scaleX, scaleY: scaleY, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scaleX: scaleX, scaleY: scaleY, centerX: centerX, centerY: centerY, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scale: scale, varIndexBase: varIndexBase };
            }
            case 23: { // PaintVarScaleUniformAroundCenter
                var paintOffset = this.readOffset24(offset + 1);
                var scale = this.readF2Dot14(offset + 4);
                var centerX = this.view.getInt16(offset + 6, false);
                var centerY = this.view.getInt16(offset + 8, false);
                var varIndexBase = this.view.getUint32(offset + 10, false);
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, scale: scale, centerX: centerX, centerY: centerY, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, angle: angle, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, angle: angle, centerX: centerX, centerY: centerY, varIndexBase: varIndexBase };
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
                var paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format: format, paint: paint, xSkew: xSkew, ySkew: ySkew, varIndexBase: varIndexBase };
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
    return ColrTable;
}());
export { ColrTable };

import { Table } from './Table.js';
var GvarTable = /** @class */ (function () {
    function GvarTable(de, byte_ar) {
        this.axisCount = 0;
        this.glyphCount = 0;
        this.sharedTuples = [];
        this.offsets = [];
        this.dataOffset = 0;
        this.start = de.offset;
        this.view = byte_ar.dataView;
        byte_ar.seek(this.start);
        byte_ar.readFixed(); // version
        this.axisCount = byte_ar.readUnsignedShort();
        var sharedTupleCount = byte_ar.readUnsignedShort();
        var sharedTupleOffset = byte_ar.readUnsignedInt();
        this.glyphCount = byte_ar.readUnsignedShort();
        var flags = byte_ar.readUnsignedShort();
        var glyphVariationDataArrayOffset = byte_ar.readUnsignedInt();
        this.dataOffset = this.start + glyphVariationDataArrayOffset;
        var offsetCount = this.glyphCount + 1;
        this.offsets = [];
        if ((flags & 0x0001) === 0) {
            for (var i = 0; i < offsetCount; i++) {
                var val = byte_ar.readUnsignedShort();
                this.offsets.push(val * 2);
            }
        }
        else {
            for (var i = 0; i < offsetCount; i++) {
                this.offsets.push(byte_ar.readUnsignedInt());
            }
        }
        this.sharedTuples = [];
        if (sharedTupleCount > 0) {
            var cursor = this.start + sharedTupleOffset;
            for (var i = 0; i < sharedTupleCount; i++) {
                var tuple = [];
                for (var a = 0; a < this.axisCount; a++) {
                    tuple.push(this.readF2Dot14(cursor));
                    cursor += 2;
                }
                this.sharedTuples.push(tuple);
            }
        }
    }
    GvarTable.prototype.getType = function () {
        return Table.gvar;
    };
    GvarTable.prototype.getDeltasForGlyph = function (glyphId, coords, pointCount) {
        var _a;
        if (glyphId < 0 || glyphId >= this.glyphCount)
            return null;
        var start = this.dataOffset + this.offsets[glyphId];
        var end = this.dataOffset + this.offsets[glyphId + 1];
        if (start === end)
            return null;
        var cursor = start;
        var tupleVariationCount = this.view.getUint16(cursor, false);
        cursor += 2;
        var hasSharedPoints = (tupleVariationCount & 0x8000) !== 0;
        var count = tupleVariationCount & 0x0fff;
        var tuples = [];
        for (var i = 0; i < count; i++) {
            var dataSize = this.view.getUint16(cursor, false);
            var tupleIndex = this.view.getUint16(cursor + 2, false);
            cursor += 4;
            var hasEmbeddedPeak = (tupleIndex & 0x8000) !== 0;
            var hasIntermediate = (tupleIndex & 0x4000) !== 0;
            var hasPrivatePoints = (tupleIndex & 0x2000) !== 0;
            var sharedIndex = tupleIndex & 0x0fff;
            var peak = hasEmbeddedPeak
                ? this.readTuple(cursor)
                : ((_a = this.sharedTuples[sharedIndex]) !== null && _a !== void 0 ? _a : new Array(this.axisCount).fill(0));
            if (hasEmbeddedPeak)
                cursor += this.axisCount * 2;
            var startTuple = void 0;
            var endTuple = void 0;
            if (hasIntermediate) {
                startTuple = this.readTuple(cursor);
                cursor += this.axisCount * 2;
                endTuple = this.readTuple(cursor);
                cursor += this.axisCount * 2;
            }
            tuples.push({
                dataOffset: cursor,
                dataSize: dataSize,
                peak: peak,
                start: startTuple,
                end: endTuple,
                hasPrivatePoints: hasPrivatePoints
            });
            cursor += dataSize;
        }
        var sharedPoints = null;
        if (hasSharedPoints) {
            var result = this.readPointNumbers(cursor, pointCount);
            sharedPoints = result.points;
            cursor += result.size;
        }
        var dx = new Array(pointCount).fill(0);
        var dy = new Array(pointCount).fill(0);
        for (var _i = 0, tuples_1 = tuples; _i < tuples_1.length; _i++) {
            var tuple = tuples_1[_i];
            var scalar = this.computeScalar(coords, tuple.peak, tuple.start, tuple.end);
            if (scalar === 0)
                continue;
            var pCursor = tuple.dataOffset;
            var points = null;
            if (tuple.hasPrivatePoints) {
                var result = this.readPointNumbers(pCursor, pointCount);
                points = result.points;
                pCursor += result.size;
            }
            else if (sharedPoints) {
                points = sharedPoints;
            }
            var indices = points !== null && points !== void 0 ? points : this.rangePoints(pointCount);
            var deltasX = this.readPackedDeltas(pCursor, indices.length);
            pCursor += deltasX.size;
            var deltasY = this.readPackedDeltas(pCursor, indices.length);
            for (var i = 0; i < indices.length; i++) {
                var idx = indices[i];
                if (idx >= 0 && idx < pointCount) {
                    dx[idx] += deltasX.values[i] * scalar;
                    dy[idx] += deltasY.values[i] * scalar;
                }
            }
        }
        return { dx: dx, dy: dy };
    };
    GvarTable.prototype.rangePoints = function (count) {
        return Array.from({ length: count }, function (_, i) { return i; });
    };
    GvarTable.prototype.computeScalar = function (coords, peak, start, end) {
        var _a, _b, _c, _d;
        var scalar = 1;
        for (var i = 0; i < this.axisCount; i++) {
            var coord = (_a = coords[i]) !== null && _a !== void 0 ? _a : 0;
            var peakVal = (_b = peak[i]) !== null && _b !== void 0 ? _b : 0;
            if (coord === 0) {
                scalar = 0;
                break;
            }
            if (start && end) {
                var s = (_c = start[i]) !== null && _c !== void 0 ? _c : 0;
                var e = (_d = end[i]) !== null && _d !== void 0 ? _d : 0;
                if (coord < s || coord > e)
                    return 0;
                if (coord < peakVal)
                    scalar *= (coord - s) / (peakVal - s);
                else if (coord > peakVal)
                    scalar *= (e - coord) / (e - peakVal);
            }
            else {
                if ((coord > 0 && peakVal < 0) || (coord < 0 && peakVal > 0))
                    return 0;
                scalar *= coord / peakVal;
            }
        }
        return scalar;
    };
    GvarTable.prototype.readTuple = function (offset) {
        var tuple = [];
        for (var i = 0; i < this.axisCount; i++) {
            tuple.push(this.readF2Dot14(offset + i * 2));
        }
        return tuple;
    };
    GvarTable.prototype.readF2Dot14 = function (offset) {
        var raw = this.view.getInt16(offset, false);
        return raw / 16384;
    };
    GvarTable.prototype.readPointNumbers = function (offset, pointCount) {
        var cursor = offset;
        var count = this.view.getUint8(cursor++);
        if (count === 0) {
            return { points: this.rangePoints(pointCount), size: 1 };
        }
        if (count & 0x80) {
            count = ((count & 0x7f) << 8) | this.view.getUint8(cursor++);
        }
        var points = [];
        var last = 0;
        while (points.length < count) {
            var control = this.view.getUint8(cursor++);
            var runCount = (control & 0x7f) + 1;
            if (control & 0x80) {
                for (var i = 0; i < runCount; i++) {
                    last += this.view.getUint16(cursor, false);
                    cursor += 2;
                    points.push(last);
                }
            }
            else {
                for (var i = 0; i < runCount; i++) {
                    last += this.view.getUint8(cursor++);
                    points.push(last);
                }
            }
        }
        return { points: points, size: cursor - offset };
    };
    GvarTable.prototype.readPackedDeltas = function (offset, count) {
        var cursor = offset;
        var values = [];
        while (values.length < count) {
            var control = this.view.getUint8(cursor++);
            var runCount = (control & 0x3f) + 1;
            if (control & 0x80) {
                for (var i = 0; i < runCount; i++) {
                    values.push(this.view.getInt16(cursor, false));
                    cursor += 2;
                }
            }
            else if (control & 0x40) {
                for (var i = 0; i < runCount; i++)
                    values.push(0);
            }
            else {
                for (var i = 0; i < runCount; i++) {
                    values.push(this.view.getInt8(cursor++));
                }
            }
        }
        return { values: values, size: cursor - offset };
    };
    return GvarTable;
}());
export { GvarTable };

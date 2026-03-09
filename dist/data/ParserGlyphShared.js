var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
export function flattenColrV1Paint(paint, paletteIndex, getPalette, resolveGlyphLayers) {
    var _a, _b;
    if (!paint)
        return [];
    if (paint.format === 1 && Array.isArray(paint.layers)) {
        return paint.layers.flatMap(function (p) { return flattenColrV1Paint(p, paletteIndex, getPalette, resolveGlyphLayers); });
    }
    if (paint.format === 10) {
        var child = paint.paint;
        if (child && child.format === 2) {
            var color = (_a = getPalette(paletteIndex)) === null || _a === void 0 ? void 0 : _a[child.paletteIndex];
            var rgba = color ? "rgba(".concat(color.red, ", ").concat(color.green, ", ").concat(color.blue, ", ").concat((color.alpha / 255) * ((_b = child.alpha) !== null && _b !== void 0 ? _b : 1), ")") : null;
            return [{ glyphId: paint.glyphID, color: rgba, paletteIndex: child.paletteIndex }];
        }
        return flattenColrV1Paint(child, paletteIndex, getPalette, resolveGlyphLayers).map(function (layer) { return (__assign(__assign({}, layer), { glyphId: paint.glyphID })); });
    }
    if (paint.format === 11) {
        return resolveGlyphLayers(paint.glyphID, paletteIndex);
    }
    return [];
}
function collectLookupSubtables(gpos) {
    var _a, _b, _c;
    var lookups = (_c = (_b = (_a = gpos === null || gpos === void 0 ? void 0 : gpos.lookupList) === null || _a === void 0 ? void 0 : _a.getLookups) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
    var all = [];
    for (var _i = 0, lookups_1 = lookups; _i < lookups_1.length; _i++) {
        var lookup = lookups_1[_i];
        if (!lookup)
            continue;
        for (var i = 0; i < lookup.getSubtableCount(); i++) {
            var st = lookup.getSubtable(i);
            if (st)
                all.push(st);
        }
    }
    return all;
}
export function getMarkAnchorsForGlyph(glyphId, gpos, subtables, ctors) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    if (!gpos)
        return [];
    var anchors = [];
    var activeSubtables = subtables !== null && subtables !== void 0 ? subtables : collectLookupSubtables(gpos);
    for (var _i = 0, activeSubtables_1 = activeSubtables; _i < activeSubtables_1.length; _i++) {
        var st = activeSubtables_1[_i];
        if (st instanceof ctors.MarkBasePosFormat1) {
            var markIndex = (_b = (_a = st.markCoverage) === null || _a === void 0 ? void 0 : _a.findGlyph(glyphId)) !== null && _b !== void 0 ? _b : -1;
            if (markIndex >= 0 && st.markArray) {
                var record = st.markArray.marks[markIndex];
                if (record === null || record === void 0 ? void 0 : record.anchor) {
                    anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                }
            }
            var baseIndex = (_d = (_c = st.baseCoverage) === null || _c === void 0 ? void 0 : _c.findGlyph(glyphId)) !== null && _d !== void 0 ? _d : -1;
            if (baseIndex >= 0 && st.baseArray) {
                var base = st.baseArray.baseRecords[baseIndex];
                if (base === null || base === void 0 ? void 0 : base.anchors) {
                    base.anchors.forEach(function (anchor, classIndex) {
                        if (anchor) {
                            anchors.push({ type: 'base', classIndex: classIndex, x: anchor.x, y: anchor.y });
                        }
                    });
                }
            }
        }
        if (st instanceof ctors.MarkLigPosFormat1) {
            var markIndex = (_f = (_e = st.markCoverage) === null || _e === void 0 ? void 0 : _e.findGlyph(glyphId)) !== null && _f !== void 0 ? _f : -1;
            if (markIndex >= 0 && st.markArray) {
                var record = st.markArray.marks[markIndex];
                if (record === null || record === void 0 ? void 0 : record.anchor) {
                    anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                }
            }
            var ligIndex = (_h = (_g = st.ligatureCoverage) === null || _g === void 0 ? void 0 : _g.findGlyph(glyphId)) !== null && _h !== void 0 ? _h : -1;
            if (ligIndex >= 0 && st.ligatureArray) {
                var lig = st.ligatureArray.ligatures[ligIndex];
                (_j = lig === null || lig === void 0 ? void 0 : lig.components) === null || _j === void 0 ? void 0 : _j.forEach(function (component, componentIndex) {
                    component.forEach(function (anchor, classIndex) {
                        if (anchor) {
                            anchors.push({ type: 'ligature', classIndex: classIndex, x: anchor.x, y: anchor.y, componentIndex: componentIndex });
                        }
                    });
                });
            }
        }
        if (st instanceof ctors.MarkMarkPosFormat1) {
            var mark1Index = (_l = (_k = st.mark1Coverage) === null || _k === void 0 ? void 0 : _k.findGlyph(glyphId)) !== null && _l !== void 0 ? _l : -1;
            if (mark1Index >= 0 && st.mark1Array) {
                var record = st.mark1Array.marks[mark1Index];
                if (record === null || record === void 0 ? void 0 : record.anchor) {
                    anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                }
            }
            var mark2Index = (_o = (_m = st.mark2Coverage) === null || _m === void 0 ? void 0 : _m.findGlyph(glyphId)) !== null && _o !== void 0 ? _o : -1;
            if (mark2Index >= 0 && st.mark2Array) {
                var record = st.mark2Array.records[mark2Index];
                (_p = record === null || record === void 0 ? void 0 : record.anchors) === null || _p === void 0 ? void 0 : _p.forEach(function (anchor, classIndex) {
                    if (anchor) {
                        anchors.push({ type: 'mark2', classIndex: classIndex, x: anchor.x, y: anchor.y });
                    }
                });
            }
        }
        if (st instanceof ctors.CursivePosFormat1) {
            var idx = (_r = (_q = st.coverage) === null || _q === void 0 ? void 0 : _q.findGlyph(glyphId)) !== null && _r !== void 0 ? _r : -1;
            if (idx >= 0) {
                var record = st.entryExitRecords[idx];
                if (record === null || record === void 0 ? void 0 : record.entry)
                    anchors.push({ type: 'cursive-entry', classIndex: 0, x: record.entry.x, y: record.entry.y });
                if (record === null || record === void 0 ? void 0 : record.exit)
                    anchors.push({ type: 'cursive-exit', classIndex: 0, x: record.exit.x, y: record.exit.y });
            }
        }
    }
    return anchors;
}
export function interpolateDelta(aCoord, bCoord, aDelta, bDelta, pCoord) {
    if (aCoord === bCoord)
        return aDelta;
    var t = (pCoord - aCoord) / (bCoord - aCoord);
    var clamped = Math.max(0, Math.min(1, t));
    return aDelta + (bDelta - aDelta) * clamped;
}
export function applyIupDeltas(base, dx, dy, touched) {
    var pointCount = base.getPointCount();
    if (pointCount === 0)
        return;
    var endPts = [];
    for (var c = 0; c < base.getContourCount(); c++) {
        endPts.push(base.getEndPtOfContours(c));
    }
    var start = 0;
    var _loop_1 = function (end) {
        var indices = [];
        var touchedIndices = [];
        for (var i = start; i <= end; i++) {
            indices.push(i);
            if (touched[i])
                touchedIndices.push(i);
        }
        if (touchedIndices.length === 0) {
            start = end + 1;
            return "continue";
        }
        if (touchedIndices.length === 1) {
            var idx = touchedIndices[0];
            for (var _a = 0, indices_1 = indices; _a < indices_1.length; _a++) {
                var i = indices_1[_a];
                dx[i] = dx[idx];
                dy[i] = dy[idx];
            }
            start = end + 1;
            return "continue";
        }
        var contour = indices;
        var total = contour.length;
        var order = touchedIndices.map(function (i) { return contour.indexOf(i); }).sort(function (a, b) { return a - b; });
        var coordsX = contour.map(function (i) { return base.getXCoordinate(i); });
        var coordsY = contour.map(function (i) { return base.getYCoordinate(i); });
        for (var t = 0; t < order.length; t++) {
            var a = order[t];
            var b = order[(t + 1) % order.length];
            var idx = (a + 1) % total;
            while (idx !== b) {
                var globalIndex = contour[idx];
                var ax = coordsX[a];
                var bx = coordsX[b];
                var ay = coordsY[a];
                var by = coordsY[b];
                var px = coordsX[idx];
                var py = coordsY[idx];
                dx[globalIndex] = interpolateDelta(ax, bx, dx[contour[a]], dx[contour[b]], px);
                dy[globalIndex] = interpolateDelta(ay, by, dy[contour[a]], dy[contour[b]], py);
                idx = (idx + 1) % total;
            }
        }
        start = end + 1;
    };
    for (var _i = 0, endPts_1 = endPts; _i < endPts_1.length; _i++) {
        var end = endPts_1[_i];
        _loop_1(end);
    }
}

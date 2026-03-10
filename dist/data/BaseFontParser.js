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
import { GlyfCompositeDescript } from '../table/GlyfCompositeDescript.js';
import { Table } from '../table/Table.js';
import { CursivePosFormat1 } from '../table/CursivePosFormat1.js';
import { MarkBasePosFormat1 } from '../table/MarkBasePosFormat1.js';
import { MarkLigPosFormat1 } from '../table/MarkLigPosFormat1.js';
import { MarkMarkPosFormat1 } from '../table/MarkMarkPosFormat1.js';
import { PairPosFormat1 } from '../table/PairPosFormat1.js';
import { PairPosFormat2 } from '../table/PairPosFormat2.js';
import { PairPosSubtable } from '../table/PairPosSubtable.js';
import { SinglePosSubtable } from '../table/SinglePosSubtable.js';
import { detectScriptTags } from '../utils/ScriptDetector.js';
import { clearDiagnostics as clearParserDiagnostics, emitDiagnostic as emitParserDiagnostic, getBestCmapFormatFor as selectBestCmapFormatFor, getDiagnostics as getParserDiagnostics, pickBestCmapFormat } from './ParserShared.js';
import { GlyphData } from './GlyphData.js';
var BaseFontParser = /** @class */ (function () {
    function BaseFontParser() {
        this.diagnostics = [];
        this.diagnosticKeys = new Set();
    }
    BaseFontParser.prototype.emitDiagnostic = function (code, level, phase, message, context, onceKey) {
        var _a, _b;
        var state = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        emitParserDiagnostic(state, code, level, phase, message, context, onceKey);
        this.diagnostics = (_a = state.diagnostics) !== null && _a !== void 0 ? _a : [];
        this.diagnosticKeys = (_b = state.diagnosticKeys) !== null && _b !== void 0 ? _b : new Set();
    };
    BaseFontParser.prototype.getDiagnostics = function (filter) {
        var _a, _b;
        var state = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        var out = getParserDiagnostics(state, filter);
        this.diagnostics = (_a = state.diagnostics) !== null && _a !== void 0 ? _a : [];
        this.diagnosticKeys = (_b = state.diagnosticKeys) !== null && _b !== void 0 ? _b : new Set();
        return out;
    };
    BaseFontParser.prototype.clearDiagnostics = function () {
        var _a, _b;
        var state = { diagnostics: this.diagnostics, diagnosticKeys: this.diagnosticKeys };
        clearParserDiagnostics(state);
        this.diagnostics = (_a = state.diagnostics) !== null && _a !== void 0 ? _a : [];
        this.diagnosticKeys = (_b = state.diagnosticKeys) !== null && _b !== void 0 ? _b : new Set();
    };
    BaseFontParser.prototype.getBestCmapFormatFor = function (codePoint) {
        return selectBestCmapFormatFor(this.getCmapTableForLookup(), codePoint);
    };
    BaseFontParser.prototype.pickBestFormat = function (formats) {
        return pickBestCmapFormat(formats);
    };
    BaseFontParser.prototype.getGlyphShared = function (i, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24;
        var maxGlyphs = (_a = options.maxGlyphs) !== null && _a !== void 0 ? _a : null;
        if (i < 0 || (maxGlyphs != null && i >= maxGlyphs))
            return null;
        var glyf = (_b = options.glyf) !== null && _b !== void 0 ? _b : null;
        var hmtx = (_c = options.hmtx) !== null && _c !== void 0 ? _c : null;
        var gvar = (_d = options.gvar) !== null && _d !== void 0 ? _d : null;
        var variationCoords = (_e = options.variationCoords) !== null && _e !== void 0 ? _e : [];
        var cff = (_f = options.cff) !== null && _f !== void 0 ? _f : null;
        var cff2 = (_g = options.cff2) !== null && _g !== void 0 ? _g : null;
        var cffIncludePhantoms = (_h = options.cffIncludePhantoms) !== null && _h !== void 0 ? _h : true;
        var description = (_k = (_j = glyf === null || glyf === void 0 ? void 0 : glyf.getDescription) === null || _j === void 0 ? void 0 : _j.call(glyf, i)) !== null && _k !== void 0 ? _k : null;
        if (description != null) {
            var desc = description;
            var lsb = (_m = (_l = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getLeftSideBearing) === null || _l === void 0 ? void 0 : _l.call(hmtx, i)) !== null && _m !== void 0 ? _m : 0;
            var advance = (_p = (_o = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getAdvanceWidth) === null || _o === void 0 ? void 0 : _o.call(hmtx, i)) !== null && _p !== void 0 ? _p : 0;
            if (gvar && variationCoords.length > 0) {
                var basePointCount = description.getPointCount();
                var isComposite_1 = description.isComposite();
                var descriptionComponents = description instanceof GlyfCompositeDescript && Array.isArray(description.components)
                    ? description.components
                    : [];
                var componentCount = isComposite_1 && description instanceof GlyfCompositeDescript
                    ? (descriptionComponents.length > 0 ? descriptionComponents.length : basePointCount)
                    : 0;
                var transformSlotCount = 0;
                if (isComposite_1 && description instanceof GlyfCompositeDescript) {
                    for (var _i = 0, descriptionComponents_1 = descriptionComponents; _i < descriptionComponents_1.length; _i++) {
                        var comp = descriptionComponents_1[_i];
                        transformSlotCount += comp.getTransformSlotCount();
                    }
                }
                var compositePointCount = isComposite_1 ? (componentCount + transformSlotCount) : basePointCount;
                var gvarPointCount = compositePointCount + 4;
                var deltas = gvar.getDeltasForGlyph(i, variationCoords, gvarPointCount);
                if (deltas) {
                    var base_1 = description;
                    var fullDx_1 = deltas.dx;
                    var fullDy_1 = deltas.dy;
                    var dx = [];
                    var dy = [];
                    var compDx_1 = null;
                    var compDy_1 = null;
                    var compXScale_1 = null;
                    var compYScale_1 = null;
                    var compScale01_1 = null;
                    var compScale10_1 = null;
                    if (!isComposite_1) {
                        dx = fullDx_1.slice(0, basePointCount);
                        dy = fullDy_1.slice(0, basePointCount);
                        var touched = deltas.touched.slice(0, basePointCount);
                        while (dx.length < basePointCount)
                            dx.push(0);
                        while (dy.length < basePointCount)
                            dy.push(0);
                        while (touched.length < basePointCount)
                            touched.push(false);
                        this.applyIupDeltasShared(base_1, dx, dy, touched);
                    }
                    else if (base_1 instanceof GlyfCompositeDescript) {
                        compDx_1 = new Array(componentCount).fill(0);
                        compDy_1 = new Array(componentCount).fill(0);
                        compXScale_1 = new Array(componentCount).fill(0);
                        compYScale_1 = new Array(componentCount).fill(0);
                        compScale01_1 = new Array(componentCount).fill(0);
                        compScale10_1 = new Array(componentCount).fill(0);
                        for (var c = 0; c < componentCount; c++) {
                            compDx_1[c] = (_q = fullDx_1[c]) !== null && _q !== void 0 ? _q : 0;
                            compDy_1[c] = (_r = fullDy_1[c]) !== null && _r !== void 0 ? _r : 0;
                        }
                        var tIndex = componentCount;
                        for (var c = 0; c < componentCount; c++) {
                            var comp = descriptionComponents[c];
                            if (!comp)
                                continue;
                            if (comp.hasTwoByTwo()) {
                                var idx1 = tIndex++;
                                var idx2 = tIndex++;
                                compXScale_1[c] = ((_s = fullDx_1[idx1]) !== null && _s !== void 0 ? _s : 0) / 0x4000;
                                compScale01_1[c] = ((_t = fullDy_1[idx1]) !== null && _t !== void 0 ? _t : 0) / 0x4000;
                                compScale10_1[c] = ((_u = fullDx_1[idx2]) !== null && _u !== void 0 ? _u : 0) / 0x4000;
                                compYScale_1[c] = ((_v = fullDy_1[idx2]) !== null && _v !== void 0 ? _v : 0) / 0x4000;
                            }
                            else if (comp.hasXYScale()) {
                                var idx = tIndex++;
                                compXScale_1[c] = ((_w = fullDx_1[idx]) !== null && _w !== void 0 ? _w : 0) / 0x4000;
                                compYScale_1[c] = ((_x = fullDy_1[idx]) !== null && _x !== void 0 ? _x : 0) / 0x4000;
                            }
                            else if (comp.hasScale()) {
                                var idx = tIndex++;
                                var delta = ((_y = fullDx_1[idx]) !== null && _y !== void 0 ? _y : 0) / 0x4000;
                                compXScale_1[c] = delta;
                                compYScale_1[c] = delta;
                            }
                        }
                    }
                    var phantomBase = isComposite_1 ? compositePointCount : basePointCount;
                    var lsbDelta = (_z = fullDx_1[phantomBase]) !== null && _z !== void 0 ? _z : 0;
                    var rsbDelta = (_0 = fullDx_1[phantomBase + 1]) !== null && _0 !== void 0 ? _0 : 0;
                    lsb += lsbDelta;
                    advance += (rsbDelta - lsbDelta);
                    var minX_1 = Infinity;
                    var maxX_1 = -Infinity;
                    var minY_1 = Infinity;
                    var maxY_1 = -Infinity;
                    for (var p = 0; p < basePointCount; p++) {
                        var compositeBase = (isComposite_1 && base_1 instanceof GlyfCompositeDescript) ? base_1 : null;
                        var compositeComponents = compositeBase && Array.isArray(compositeBase.components) ? compositeBase.components : [];
                        var comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                        var compIndex = comp ? compositeComponents.indexOf(comp) : -1;
                        var x = base_1.getXCoordinate(p);
                        var y = base_1.getYCoordinate(p);
                        if (comp && compIndex >= 0 && glyf) {
                            var gd = glyf.getDescription(comp.glyphIndex);
                            if (gd) {
                                var localIndex = p - comp.firstIndex;
                                var px = gd.getXCoordinate(localIndex);
                                var py = gd.getYCoordinate(localIndex);
                                var xscale = comp.xscale + ((_1 = compXScale_1 === null || compXScale_1 === void 0 ? void 0 : compXScale_1[compIndex]) !== null && _1 !== void 0 ? _1 : 0);
                                var yscale = comp.yscale + ((_2 = compYScale_1 === null || compYScale_1 === void 0 ? void 0 : compYScale_1[compIndex]) !== null && _2 !== void 0 ? _2 : 0);
                                var scale01 = comp.scale01 + ((_3 = compScale01_1 === null || compScale01_1 === void 0 ? void 0 : compScale01_1[compIndex]) !== null && _3 !== void 0 ? _3 : 0);
                                var scale10 = comp.scale10 + ((_4 = compScale10_1 === null || compScale10_1 === void 0 ? void 0 : compScale10_1[compIndex]) !== null && _4 !== void 0 ? _4 : 0);
                                var ox = comp.xtranslate + ((_5 = compDx_1 === null || compDx_1 === void 0 ? void 0 : compDx_1[compIndex]) !== null && _5 !== void 0 ? _5 : 0);
                                var oy = comp.ytranslate + ((_6 = compDy_1 === null || compDy_1 === void 0 ? void 0 : compDy_1[compIndex]) !== null && _6 !== void 0 ? _6 : 0);
                                x = (px * xscale) + (py * scale10) + ox;
                                y = (px * scale01) + (py * yscale) + oy;
                            }
                        }
                        else {
                            var rawDx = (_7 = fullDx_1[p]) !== null && _7 !== void 0 ? _7 : 0;
                            var rawDy = (_8 = fullDy_1[p]) !== null && _8 !== void 0 ? _8 : 0;
                            var transformed = comp && typeof comp.hasTransform === 'function' && comp.hasTransform() && typeof comp.transformDelta === 'function'
                                ? comp.transformDelta(rawDx, rawDy)
                                : null;
                            var pointDx = transformed ? ((_9 = transformed.dx) !== null && _9 !== void 0 ? _9 : rawDx) : rawDx;
                            var pointDy = transformed ? ((_10 = transformed.dy) !== null && _10 !== void 0 ? _10 : rawDy) : rawDy;
                            var ox = compIndex >= 0 && compDx_1 ? (_11 = compDx_1[compIndex]) !== null && _11 !== void 0 ? _11 : 0 : 0;
                            var oy = compIndex >= 0 && compDy_1 ? (_12 = compDy_1[compIndex]) !== null && _12 !== void 0 ? _12 : 0 : 0;
                            x = base_1.getXCoordinate(p) + pointDx + ox;
                            y = base_1.getYCoordinate(p) + pointDy + oy;
                        }
                        if (x < minX_1)
                            minX_1 = x;
                        if (x > maxX_1)
                            maxX_1 = x;
                        if (y < minY_1)
                            minY_1 = y;
                        if (y > maxY_1)
                            maxY_1 = y;
                    }
                    desc = {
                        getPointCount: function () { return base_1.getPointCount(); },
                        getContourCount: function () { return base_1.getContourCount(); },
                        getEndPtOfContours: function (c) { return base_1.getEndPtOfContours(c); },
                        getFlags: function (p) { return base_1.getFlags(p); },
                        getXCoordinate: function (p) {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                            var compositeBase = (isComposite_1 && base_1 instanceof GlyfCompositeDescript) ? base_1 : null;
                            var compositeComponents = compositeBase && Array.isArray(compositeBase.components) ? compositeBase.components : [];
                            var comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            var compIndex = comp ? compositeComponents.indexOf(comp) : -1;
                            if (comp && compIndex >= 0 && glyf) {
                                var gd = glyf.getDescription(comp.glyphIndex);
                                if (gd) {
                                    var localIndex = p - comp.firstIndex;
                                    var px = gd.getXCoordinate(localIndex);
                                    var py = gd.getYCoordinate(localIndex);
                                    var xscale = comp.xscale + ((_a = compXScale_1 === null || compXScale_1 === void 0 ? void 0 : compXScale_1[compIndex]) !== null && _a !== void 0 ? _a : 0);
                                    var yscale = comp.yscale + ((_b = compYScale_1 === null || compYScale_1 === void 0 ? void 0 : compYScale_1[compIndex]) !== null && _b !== void 0 ? _b : 0);
                                    var scale01 = comp.scale01 + ((_c = compScale01_1 === null || compScale01_1 === void 0 ? void 0 : compScale01_1[compIndex]) !== null && _c !== void 0 ? _c : 0);
                                    var scale10 = comp.scale10 + ((_d = compScale10_1 === null || compScale10_1 === void 0 ? void 0 : compScale10_1[compIndex]) !== null && _d !== void 0 ? _d : 0);
                                    var ox_1 = comp.xtranslate + ((_e = compDx_1 === null || compDx_1 === void 0 ? void 0 : compDx_1[compIndex]) !== null && _e !== void 0 ? _e : 0);
                                    return (px * xscale) + (py * scale10) + ox_1;
                                }
                            }
                            var rawDx = (_f = fullDx_1[p]) !== null && _f !== void 0 ? _f : 0;
                            var rawDy = (_g = fullDy_1[p]) !== null && _g !== void 0 ? _g : 0;
                            var transformed = comp && typeof comp.hasTransform === 'function' && comp.hasTransform() && typeof comp.transformDelta === 'function'
                                ? comp.transformDelta(rawDx, rawDy)
                                : null;
                            var pointDx = transformed ? ((_h = transformed.dx) !== null && _h !== void 0 ? _h : rawDx) : rawDx;
                            var ox = compIndex >= 0 && compDx_1 ? (_j = compDx_1[compIndex]) !== null && _j !== void 0 ? _j : 0 : 0;
                            return base_1.getXCoordinate(p) + pointDx + ox;
                        },
                        getYCoordinate: function (p) {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                            var compositeBase = (isComposite_1 && base_1 instanceof GlyfCompositeDescript) ? base_1 : null;
                            var compositeComponents = compositeBase && Array.isArray(compositeBase.components) ? compositeBase.components : [];
                            var comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            var compIndex = comp ? compositeComponents.indexOf(comp) : -1;
                            if (comp && compIndex >= 0 && glyf) {
                                var gd = glyf.getDescription(comp.glyphIndex);
                                if (gd) {
                                    var localIndex = p - comp.firstIndex;
                                    var px = gd.getXCoordinate(localIndex);
                                    var py = gd.getYCoordinate(localIndex);
                                    var xscale = comp.xscale + ((_a = compXScale_1 === null || compXScale_1 === void 0 ? void 0 : compXScale_1[compIndex]) !== null && _a !== void 0 ? _a : 0);
                                    var yscale = comp.yscale + ((_b = compYScale_1 === null || compYScale_1 === void 0 ? void 0 : compYScale_1[compIndex]) !== null && _b !== void 0 ? _b : 0);
                                    var scale01 = comp.scale01 + ((_c = compScale01_1 === null || compScale01_1 === void 0 ? void 0 : compScale01_1[compIndex]) !== null && _c !== void 0 ? _c : 0);
                                    var scale10 = comp.scale10 + ((_d = compScale10_1 === null || compScale10_1 === void 0 ? void 0 : compScale10_1[compIndex]) !== null && _d !== void 0 ? _d : 0);
                                    var oy_1 = comp.ytranslate + ((_e = compDy_1 === null || compDy_1 === void 0 ? void 0 : compDy_1[compIndex]) !== null && _e !== void 0 ? _e : 0);
                                    return (px * scale01) + (py * yscale) + oy_1;
                                }
                            }
                            var rawDx = (_f = fullDx_1[p]) !== null && _f !== void 0 ? _f : 0;
                            var rawDy = (_g = fullDy_1[p]) !== null && _g !== void 0 ? _g : 0;
                            var transformed = comp && typeof comp.hasTransform === 'function' && comp.hasTransform() && typeof comp.transformDelta === 'function'
                                ? comp.transformDelta(rawDx, rawDy)
                                : null;
                            var pointDy = transformed ? ((_h = transformed.dy) !== null && _h !== void 0 ? _h : rawDy) : rawDy;
                            var oy = compIndex >= 0 && compDy_1 ? (_j = compDy_1[compIndex]) !== null && _j !== void 0 ? _j : 0 : 0;
                            return base_1.getYCoordinate(p) + pointDy + oy;
                        },
                        getXMaximum: function () { return (maxX_1 !== -Infinity ? maxX_1 : base_1.getXMaximum()); },
                        getXMinimum: function () { return (minX_1 !== Infinity ? minX_1 : base_1.getXMinimum()); },
                        getYMaximum: function () { return (maxY_1 !== -Infinity ? maxY_1 : base_1.getYMaximum()); },
                        getYMinimum: function () { return (minY_1 !== Infinity ? minY_1 : base_1.getYMinimum()); },
                        isComposite: function () { return base_1.isComposite(); },
                        resolve: function () { return base_1.resolve(); }
                    };
                }
            }
            return new GlyphData(desc, lsb, advance);
        }
        if (cff2) {
            var cff2Desc = cff2.getGlyphDescription(i);
            if (cff2Desc) {
                return new GlyphData(cff2Desc, (_14 = (_13 = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getLeftSideBearing) === null || _13 === void 0 ? void 0 : _13.call(hmtx, i)) !== null && _14 !== void 0 ? _14 : 0, (_16 = (_15 = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getAdvanceWidth) === null || _15 === void 0 ? void 0 : _15.call(hmtx, i)) !== null && _16 !== void 0 ? _16 : 0, { isCubic: true, includePhantoms: false });
            }
        }
        if (cff) {
            var cffDesc = cff.getGlyphDescription(i);
            if (cffDesc) {
                return new GlyphData(cffDesc, (_18 = (_17 = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getLeftSideBearing) === null || _17 === void 0 ? void 0 : _17.call(hmtx, i)) !== null && _18 !== void 0 ? _18 : 0, (_20 = (_19 = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getAdvanceWidth) === null || _19 === void 0 ? void 0 : _19.call(hmtx, i)) !== null && _20 !== void 0 ? _20 : 0, { isCubic: true, includePhantoms: cffIncludePhantoms });
            }
        }
        if (glyf) {
            var lsb = (_22 = (_21 = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getLeftSideBearing) === null || _21 === void 0 ? void 0 : _21.call(hmtx, i)) !== null && _22 !== void 0 ? _22 : 0;
            var advance = (_24 = (_23 = hmtx === null || hmtx === void 0 ? void 0 : hmtx.getAdvanceWidth) === null || _23 === void 0 ? void 0 : _23.call(hmtx, i)) !== null && _24 !== void 0 ? _24 : 0;
            var emptyDesc = {
                getPointCount: function () { return 0; },
                getContourCount: function () { return 0; },
                getEndPtOfContours: function () { return -1; },
                getFlags: function () { return 0; },
                getXCoordinate: function () { return 0; },
                getYCoordinate: function () { return 0; },
                getXMaximum: function () { return 0; },
                getXMinimum: function () { return 0; },
                getYMaximum: function () { return 0; },
                getYMinimum: function () { return 0; },
                isComposite: function () { return false; },
                resolve: function () { }
            };
            return new GlyphData(emptyDesc, lsb, advance);
        }
        return null;
    };
    BaseFontParser.prototype.applyIupDeltasShared = function (base, dx, dy, touched) {
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
                    var j = indices_1[_a];
                    dx[j] = dx[idx];
                    dy[j] = dy[idx];
                }
                start = end + 1;
                return "continue";
            }
            var contour = indices;
            var total = contour.length;
            var order = touchedIndices.map(function (idx) { return contour.indexOf(idx); }).sort(function (a, b) { return a - b; });
            var coordsX = contour.map(function (idx) { return base.getXCoordinate(idx); });
            var coordsY = contour.map(function (idx) { return base.getYCoordinate(idx); });
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
                    dx[globalIndex] = this_1.interpolateShared(ax, bx, dx[contour[a]], dx[contour[b]], px);
                    dy[globalIndex] = this_1.interpolateShared(ay, by, dy[contour[a]], dy[contour[b]], py);
                    idx = (idx + 1) % total;
                }
            }
            start = end + 1;
        };
        var this_1 = this;
        for (var _i = 0, endPts_1 = endPts; _i < endPts_1.length; _i++) {
            var end = endPts_1[_i];
            _loop_1(end);
        }
    };
    BaseFontParser.prototype.interpolateShared = function (aCoord, bCoord, aDelta, bDelta, pCoord) {
        if (aCoord === bCoord)
            return aDelta;
        var t = (pCoord - aCoord) / (bCoord - aCoord);
        var clamped = Math.max(0, Math.min(1, t));
        return aDelta + (bDelta - aDelta) * clamped;
    };
    BaseFontParser.prototype.getGposAttachmentAnchors = function (glyphId, subtables) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        var gpos = this.getGposTableForLayout();
        if (!gpos)
            return [];
        var anchors = [];
        var activeSubtables = subtables !== null && subtables !== void 0 ? subtables : (function () {
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
        })();
        for (var _i = 0, activeSubtables_1 = activeSubtables; _i < activeSubtables_1.length; _i++) {
            var st = activeSubtables_1[_i];
            if (st instanceof MarkBasePosFormat1) {
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
            if (st instanceof MarkLigPosFormat1) {
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
            if (st instanceof MarkMarkPosFormat1) {
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
            if (st instanceof CursivePosFormat1) {
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
    };
    BaseFontParser.prototype.applyGposPositioningShared = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1;
        var gpos = this.getGposTableForLayout();
        if (!gpos)
            return;
        var subtables = gpos.getSubtablesForFeatures(gposFeatures, scriptTags);
        for (var _i = 0, subtables_1 = subtables; _i < subtables_1.length; _i++) {
            var st = subtables_1[_i];
            if (st instanceof SinglePosSubtable ||
                typeof st.getAdjustment === 'function') {
                for (var i = 0; i < glyphIndices.length; i++) {
                    if (!positioned[i])
                        continue;
                    var adj = (_b = (_a = st).getAdjustment) === null || _b === void 0 ? void 0 : _b.call(_a, glyphIndices[i]);
                    if (!adj)
                        continue;
                    positioned[i].xOffset += (_c = adj.xPlacement) !== null && _c !== void 0 ? _c : 0;
                    positioned[i].yOffset += (_d = adj.yPlacement) !== null && _d !== void 0 ? _d : 0;
                    positioned[i].xAdvance += (_e = adj.xAdvance) !== null && _e !== void 0 ? _e : 0;
                    positioned[i].yAdvance += (_f = adj.yAdvance) !== null && _f !== void 0 ? _f : 0;
                }
            }
            if (st instanceof PairPosSubtable ||
                st instanceof PairPosFormat1 ||
                st instanceof PairPosFormat2 ||
                typeof st.getPairValue === 'function') {
                for (var i = 0; i < glyphIndices.length - 1; i++) {
                    if (!positioned[i] || !positioned[i + 1])
                        continue;
                    var pair = (_h = (_g = st).getPairValue) === null || _h === void 0 ? void 0 : _h.call(_g, glyphIndices[i], glyphIndices[i + 1]);
                    if (!pair)
                        continue;
                    var v1 = pair.v1 || {};
                    var v2 = pair.v2 || {};
                    positioned[i].xOffset += (_j = v1.xPlacement) !== null && _j !== void 0 ? _j : 0;
                    positioned[i].yOffset += (_k = v1.yPlacement) !== null && _k !== void 0 ? _k : 0;
                    positioned[i].xAdvance += (_l = v1.xAdvance) !== null && _l !== void 0 ? _l : 0;
                    positioned[i].yAdvance += (_m = v1.yAdvance) !== null && _m !== void 0 ? _m : 0;
                    positioned[i + 1].xOffset += (_o = v2.xPlacement) !== null && _o !== void 0 ? _o : 0;
                    positioned[i + 1].yOffset += (_p = v2.yPlacement) !== null && _p !== void 0 ? _p : 0;
                    positioned[i + 1].xAdvance += (_q = v2.xAdvance) !== null && _q !== void 0 ? _q : 0;
                    positioned[i + 1].yAdvance += (_r = v2.yAdvance) !== null && _r !== void 0 ? _r : 0;
                }
                continue;
            }
            if (st instanceof MarkBasePosFormat1 ||
                st instanceof MarkLigPosFormat1 ||
                st instanceof MarkMarkPosFormat1 ||
                st instanceof CursivePosFormat1) {
                continue;
            }
            var constructorName = (_t = (_s = st === null || st === void 0 ? void 0 : st.constructor) === null || _s === void 0 ? void 0 : _s.name) !== null && _t !== void 0 ? _t : "unknown";
            this.emitDiagnostic("UNSUPPORTED_GPOS_SUBTABLE", "info", "layout", "Encountered GPOS subtable not currently handled: ".concat(constructorName, "."), { constructorName: constructorName }, "UNSUPPORTED_GPOS_SUBTABLE:".concat(constructorName));
        }
        var markSubtables = subtables.filter(function (st) {
            return st instanceof MarkBasePosFormat1 ||
                st instanceof MarkLigPosFormat1 ||
                st instanceof MarkMarkPosFormat1 ||
                st instanceof CursivePosFormat1;
        });
        var anchorsCache = new Map();
        var getAnchors = function (gid) {
            if (anchorsCache.has(gid))
                return anchorsCache.get(gid);
            var anchors = _this.getGposAttachmentAnchors(gid, markSubtables);
            anchorsCache.set(gid, anchors);
            return anchors;
        };
        var getBaseAnchor = function (anchors, classIndex) {
            var candidates = anchors.filter(function (a) {
                return (a.type === 'base' || a.type === 'ligature' || a.type === 'mark2') && a.classIndex === classIndex;
            });
            if (candidates.length === 0)
                return null;
            var ligatureCandidates = candidates.filter(function (a) { return a.type === 'ligature'; });
            if (ligatureCandidates.length > 0) {
                return ligatureCandidates.reduce(function (best, current) { var _a, _b; return ((_a = current.componentIndex) !== null && _a !== void 0 ? _a : -1) > ((_b = best.componentIndex) !== null && _b !== void 0 ? _b : -1) ? current : best; });
            }
            return candidates[0];
        };
        var _loop_2 = function (i) {
            if (!positioned[i])
                return "continue";
            var anchors = getAnchors(glyphIndices[i]);
            var markAnchor = anchors.find(function (a) { return a.type === 'mark'; });
            if (!markAnchor)
                return "continue";
            var attached = false;
            var prev = i - 1;
            while (prev >= 0) {
                var prevGid = glyphIndices[prev];
                if (!this_2.isMarkGlyphForLayout(prevGid)) {
                    prev--;
                    continue;
                }
                var prevAnchors = getAnchors(prevGid);
                var mark2 = prevAnchors.find(function (a) { return a.type === 'mark2' && a.classIndex === markAnchor.classIndex; });
                if (mark2) {
                    positioned[i].xOffset += ((_v = (_u = positioned[prev]) === null || _u === void 0 ? void 0 : _u.xOffset) !== null && _v !== void 0 ? _v : 0) + (mark2.x - markAnchor.x);
                    positioned[i].yOffset += ((_x = (_w = positioned[prev]) === null || _w === void 0 ? void 0 : _w.yOffset) !== null && _x !== void 0 ? _x : 0) + (mark2.y - markAnchor.y);
                    positioned[i].xAdvance = 0;
                    attached = true;
                    break;
                }
                prev--;
            }
            if (attached)
                return "continue";
            var baseIndex = i - 1;
            while (baseIndex >= 0) {
                var baseGid = glyphIndices[baseIndex];
                if (this_2.isMarkGlyphForLayout(baseGid)) {
                    baseIndex--;
                    continue;
                }
                var baseAnchors = getAnchors(baseGid);
                var baseAnchor = getBaseAnchor(baseAnchors, markAnchor.classIndex);
                if (baseAnchor) {
                    positioned[i].xOffset += ((_z = (_y = positioned[baseIndex]) === null || _y === void 0 ? void 0 : _y.xOffset) !== null && _z !== void 0 ? _z : 0) + (baseAnchor.x - markAnchor.x);
                    positioned[i].yOffset += ((_1 = (_0 = positioned[baseIndex]) === null || _0 === void 0 ? void 0 : _0.yOffset) !== null && _1 !== void 0 ? _1 : 0) + (baseAnchor.y - markAnchor.y);
                    positioned[i].xAdvance = 0;
                    break;
                }
                baseIndex--;
            }
        };
        var this_2 = this;
        for (var i = 0; i < glyphIndices.length; i++) {
            _loop_2(i);
        }
        for (var i = 1; i < glyphIndices.length; i++) {
            if (!positioned[i])
                continue;
            var prevAnchors = getAnchors(glyphIndices[i - 1]);
            var currAnchors = getAnchors(glyphIndices[i]);
            var exitAnchor = prevAnchors.find(function (a) { return a.type === 'cursive-exit'; });
            var entryAnchor = currAnchors.find(function (a) { return a.type === 'cursive-entry'; });
            if (exitAnchor && entryAnchor) {
                positioned[i].xOffset += exitAnchor.x - entryAnchor.x;
                positioned[i].yOffset += exitAnchor.y - entryAnchor.y;
            }
        }
        for (var i = 0; i < glyphIndices.length; i++) {
            if (positioned[i] && this.isMarkGlyphForLayout(glyphIndices[i])) {
                positioned[i].xAdvance = 0;
            }
        }
    };
    BaseFontParser.prototype.getGlyphIndexByChar = function (char) {
        if (!char || char.length === 0) {
            this.emitDiagnostic("INVALID_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar expects a character.");
            return null;
        }
        if (Array.from(char).length > 1) {
            this.emitDiagnostic("MULTI_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar received multiple characters; using the first code point.", undefined, "MULTI_CHAR_INPUT");
        }
        var codePoint = char.codePointAt(0);
        if (codePoint == null) {
            this.emitDiagnostic("CODE_POINT_RESOLVE_FAILED", "warning", "parse", "Failed to resolve code point for character.");
            return null;
        }
        var cmap = this.getCmapTableForLookup();
        if (!cmap) {
            this.emitDiagnostic("MISSING_TABLE_CMAP", "warning", "parse", "No cmap table available.", undefined, "MISSING_TABLE_CMAP");
            return null;
        }
        var cmapFormat = null;
        try {
            cmapFormat = this.getBestCmapFormatFor(codePoint);
        }
        catch (_a) {
            this.emitDiagnostic("CMAP_FORMAT_RESOLVE_FAILED", "warning", "parse", "Failed while resolving preferred cmap format; using fallback format order.", { codePoint: codePoint }, "CMAP_FORMAT_RESOLVE_FAILED");
            var fallbackFormats = Array.isArray(cmap.formats)
                ? cmap.formats.filter(function (fmt) { return fmt != null; })
                : [];
            cmapFormat = this.pickBestFormat(fallbackFormats);
        }
        if (!cmapFormat) {
            this.emitDiagnostic("MISSING_CMAP_FORMAT", "warning", "parse", "No cmap format available for code point.", { codePoint: codePoint });
            return null;
        }
        var glyphIndex = null;
        try {
            if (typeof cmapFormat.getGlyphIndex === "function") {
                glyphIndex = cmapFormat.getGlyphIndex(codePoint);
            }
            else if (typeof cmapFormat.mapCharCode === "function") {
                glyphIndex = cmapFormat.mapCharCode(codePoint);
            }
            else {
                this.emitDiagnostic("UNSUPPORTED_CMAP_FORMAT", "warning", "parse", "Selected cmap format does not expose getGlyphIndex/mapCharCode.", { codePoint: codePoint }, "UNSUPPORTED_CMAP_FORMAT");
                return null;
            }
        }
        catch (_b) {
            this.emitDiagnostic("CMAP_LOOKUP_FAILED", "warning", "parse", "cmap glyph lookup failed for code point.", { codePoint: codePoint });
            return null;
        }
        if (typeof glyphIndex !== "number" || !Number.isFinite(glyphIndex) || glyphIndex === 0)
            return null;
        return glyphIndex;
    };
    BaseFontParser.prototype.getGlyphByChar = function (char) {
        var idx = this.getGlyphIndexByChar(char);
        if (idx == null)
            return null;
        return this.getGlyphByIndexForLayout(idx);
    };
    BaseFontParser.prototype.getGlyphIndicesForString = function (text) {
        var glyphs = [];
        for (var _i = 0, _a = Array.from(text); _i < _a.length; _i++) {
            var ch = _a[_i];
            var idx = this.getGlyphIndexByChar(ch);
            if (idx != null)
                glyphs.push(idx);
        }
        return glyphs;
    };
    BaseFontParser.prototype.getGlyphIndicesForStringWithGsub = function (text, featureTags, scriptTags) {
        if (featureTags === void 0) { featureTags = ["liga"]; }
        if (scriptTags === void 0) { scriptTags = ["DFLT", "latn"]; }
        var glyphs = this.getGlyphIndicesForString(text);
        var gsub = this.getGsubTableForLayout();
        if (!gsub || glyphs.length === 0) {
            if (!gsub && glyphs.length > 0) {
                this.emitDiagnostic("MISSING_TABLE_GSUB", "info", "layout", "GSUB table not present; using direct glyph mapping.", undefined, "MISSING_TABLE_GSUB");
            }
            return glyphs;
        }
        return gsub.applyFeatures(glyphs, featureTags, scriptTags);
    };
    BaseFontParser.prototype.getKerningValueByGlyphs = function (leftGlyph, rightGlyph) {
        var kernTable = this.getKernTableForLayout();
        if (!kernTable)
            return 0;
        if (typeof kernTable.getKerningValue === "function") {
            try {
                var value = kernTable.getKerningValue(leftGlyph, rightGlyph);
                return typeof value === 'number' && Number.isFinite(value) ? value : 0;
            }
            catch (_a) {
                return 0;
            }
        }
        return 0;
    };
    BaseFontParser.prototype.getGposKerningValueByGlyphs = function (leftGlyph, rightGlyph) {
        var _a, _b, _c;
        var gpos = this.getGposTableForLayout();
        if (!gpos) {
            this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "GPOS table not present; kerning defaults to 0.", undefined, "MISSING_TABLE_GPOS");
            return 0;
        }
        var lookups = (_c = (_b = (_a = gpos.lookupList) === null || _a === void 0 ? void 0 : _a.getLookups) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        var value = 0;
        for (var _i = 0, lookups_2 = lookups; _i < lookups_2.length; _i++) {
            var lookup = lookups_2[_i];
            if (!lookup || lookup.getType() !== 2)
                continue;
            for (var i = 0; i < lookup.getSubtableCount(); i++) {
                var st = lookup.getSubtable(i);
                if (typeof (st === null || st === void 0 ? void 0 : st.getKerning) === 'function') {
                    try {
                        var kern = st.getKerning(leftGlyph, rightGlyph);
                        value += Number.isFinite(kern) ? kern : 0;
                    }
                    catch (_d) {
                        // Ignore malformed pair subtables and continue.
                    }
                }
            }
        }
        return Number.isFinite(value) ? value : 0;
    };
    BaseFontParser.prototype.getKerningValue = function (leftChar, rightChar) {
        var left = this.getGlyphIndexByChar(leftChar);
        var right = this.getGlyphIndexByChar(rightChar);
        if (left == null || right == null)
            return 0;
        var kern = this.getKerningValueByGlyphs(left, right);
        if (kern !== 0)
            return kern;
        return this.getGposKerningValueByGlyphs(left, right);
    };
    BaseFontParser.prototype.layoutString = function (text, options) {
        var _a, _b, _c, _d;
        if (options === void 0) { options = {}; }
        var gsubFeatures = (_a = options.gsubFeatures) !== null && _a !== void 0 ? _a : ["liga"];
        var scriptTags = (_b = options.scriptTags) !== null && _b !== void 0 ? _b : ["DFLT", "latn"];
        var gposFeatures = (_c = options.gposFeatures) !== null && _c !== void 0 ? _c : ["kern", "mark", "mkmk", "curs"];
        var glyphIndices = this.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);
        var positioned = [];
        for (var i = 0; i < glyphIndices.length; i++) {
            var glyphIndex = glyphIndices[i];
            var glyph = this.getGlyphByIndexForLayout(glyphIndex);
            var kern = 0;
            if (i < glyphIndices.length - 1) {
                kern = this.getKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                if (kern === 0) {
                    kern = this.getGposKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                }
            }
            positioned.push({
                glyphIndex: glyphIndex,
                xAdvance: this.isMarkGlyphForLayout(glyphIndex) ? 0 : ((_d = glyph === null || glyph === void 0 ? void 0 : glyph.advanceWidth) !== null && _d !== void 0 ? _d : 0) + kern,
                xOffset: 0,
                yOffset: 0,
                yAdvance: 0
            });
        }
        if (options.gpos) {
            if (!this.getGposTableForLayout()) {
                this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "Requested GPOS positioning, but GPOS table is unavailable.", undefined, "MISSING_TABLE_GPOS");
            }
            this.applyGposPositioningForLayout(glyphIndices, positioned, gposFeatures, scriptTags);
        }
        return positioned;
    };
    BaseFontParser.prototype.getTableByType = function (tableType) {
        return this.getTableByTypeInternal(tableType);
    };
    BaseFontParser.prototype.getNameInfo = function () {
        return {
            family: this.getNameRecordForInfo(1),
            subfamily: this.getNameRecordForInfo(2),
            fullName: this.getNameRecordForInfo(4),
            postScriptName: this.getNameRecordForInfo(6),
            version: this.getNameRecordForInfo(5),
            manufacturer: this.getNameRecordForInfo(8),
            designer: this.getNameRecordForInfo(9),
            description: this.getNameRecordForInfo(10),
            typoFamily: this.getNameRecordForInfo(16),
            typoSubfamily: this.getNameRecordForInfo(17)
        };
    };
    BaseFontParser.prototype.getOs2Info = function () {
        var os2 = this.getOs2TableForInfo();
        if (!os2)
            return null;
        var vendorRaw = os2.achVendorID >>> 0;
        var vendorId = String.fromCharCode((vendorRaw >>> 24) & 0xff, (vendorRaw >>> 16) & 0xff, (vendorRaw >>> 8) & 0xff, vendorRaw & 0xff).replace(/\0/g, '');
        return {
            weightClass: os2.usWeightClass,
            widthClass: os2.usWidthClass,
            typoAscender: os2.sTypoAscender,
            typoDescender: os2.sTypoDescender,
            typoLineGap: os2.sTypoLineGap,
            winAscent: os2.usWinAscent,
            winDescent: os2.usWinDescent,
            unicodeRanges: [os2.ulUnicodeRange1, os2.ulUnicodeRange2, os2.ulUnicodeRange3, os2.ulUnicodeRange4],
            codePageRanges: [os2.ulCodePageRange1, os2.ulCodePageRange2],
            vendorId: vendorId,
            fsSelection: os2.fsSelection
        };
    };
    BaseFontParser.prototype.getPostInfo = function () {
        var post = this.getPostTableForInfo();
        if (!post)
            return null;
        return {
            italicAngle: post.italicAngle / 65536,
            underlinePosition: post.underlinePosition,
            underlineThickness: post.underlineThickness,
            isFixedPitch: post.isFixedPitch
        };
    };
    BaseFontParser.prototype.layoutStringAuto = function (text, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var detection = detectScriptTags(text);
        return this.layoutString(text, {
            gsubFeatures: detection.features,
            scriptTags: detection.scripts,
            gpos: (_a = options.gpos) !== null && _a !== void 0 ? _a : true,
            gposFeatures: options.gposFeatures
        });
    };
    BaseFontParser.prototype.getVariationAxes = function () {
        var _a, _b, _c, _d;
        return (_d = (_c = (_b = (_a = this).getFvarTableForShared) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.axes) !== null && _d !== void 0 ? _d : [];
    };
    BaseFontParser.prototype.setVariationCoords = function (coords) {
        var copy = coords.slice();
        if (typeof this.setVariationCoordsInternal === 'function') {
            this.setVariationCoordsInternal(copy);
        }
        else {
            this.variationCoords = copy;
        }
        if (typeof this.onVariationCoordsUpdated === 'function') {
            this.onVariationCoordsUpdated(copy);
        }
    };
    BaseFontParser.prototype.setVariationByAxes = function (values) {
        var _a, _b, _c, _d, _e, _f;
        var fvar = (_d = (_c = (_b = (_a = this).getFvarTableForShared) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : this.fvar) !== null && _d !== void 0 ? _d : null;
        if (!fvar)
            return;
        var coords = [];
        for (var _i = 0, _g = (_e = fvar.axes) !== null && _e !== void 0 ? _e : []; _i < _g.length; _i++) {
            var axis = _g[_i];
            var tag = axis.name;
            var value = (_f = values[tag]) !== null && _f !== void 0 ? _f : axis.defaultValue;
            var norm = 0;
            if (value !== axis.defaultValue) {
                if (value > axis.defaultValue) {
                    var span = axis.maxValue - axis.defaultValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                }
                else {
                    var span = axis.defaultValue - axis.minValue;
                    norm = span !== 0 ? (value - axis.defaultValue) / span : 0;
                }
            }
            coords.push(Number.isFinite(norm) ? Math.max(-1, Math.min(1, norm)) : 0);
        }
        this.setVariationCoords(coords);
    };
    BaseFontParser.prototype.getGlyphPointsByChar = function (char, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var glyph = this.getGlyphByChar(char);
        if (!glyph)
            return [];
        var sampleStep = Math.max(1, Math.floor((_a = options.sampleStep) !== null && _a !== void 0 ? _a : 1));
        var points = [];
        for (var i = 0; i < glyph.getPointCount(); i += sampleStep) {
            var p = glyph.getPoint(i);
            if (!p)
                continue;
            points.push({
                x: p.x,
                y: p.y,
                onCurve: p.onCurve,
                endOfContour: p.endOfContour
            });
        }
        return points;
    };
    BaseFontParser.prototype.measureText = function (text, options) {
        if (options === void 0) { options = {}; }
        var layout = this.layoutString(text, options);
        var letterSpacing = Number.isFinite(options.letterSpacing) ? options.letterSpacing : 0;
        var advanceWidth = 0;
        for (var i = 0; i < layout.length; i++) {
            var xAdvance = Number.isFinite(layout[i].xAdvance) ? layout[i].xAdvance : 0;
            advanceWidth += xAdvance;
            if (letterSpacing !== 0 && i < layout.length - 1)
                advanceWidth += letterSpacing;
        }
        return { advanceWidth: Number.isFinite(advanceWidth) ? advanceWidth : 0, glyphCount: layout.length };
    };
    BaseFontParser.prototype.layoutToPoints = function (text, options) {
        if (options === void 0) { options = {}; }
        var layout = this.layoutString(text, options);
        var sampleBase = Number.isFinite(options.sampleStep) ? options.sampleStep : 1;
        var sampleStep = Math.max(1, Math.floor(sampleBase));
        var unitsPerEm = this.getUnitsPerEmForShared();
        var safeUnitsPerEm = Number.isFinite(unitsPerEm) && unitsPerEm > 0 ? unitsPerEm : 1000;
        var fontSize = Number.isFinite(options.fontSize) && options.fontSize > 0
            ? options.fontSize
            : safeUnitsPerEm;
        var scale = fontSize / safeUnitsPerEm;
        var originX = Number.isFinite(options.x) ? options.x : 0;
        var originY = Number.isFinite(options.y) ? options.y : 0;
        var letterSpacing = Number.isFinite(options.letterSpacing) ? options.letterSpacing : 0;
        var points = [];
        var penX = 0;
        for (var i = 0; i < layout.length; i++) {
            var item = layout[i];
            var glyph = this.getGlyphByIndexForLayout(item.glyphIndex);
            if (glyph) {
                for (var pIndex = 0; pIndex < glyph.getPointCount(); pIndex += sampleStep) {
                    var p = glyph.getPoint(pIndex);
                    if (!p)
                        continue;
                    points.push({
                        x: originX + (penX + (Number.isFinite(item.xOffset) ? item.xOffset : 0) + p.x) * scale,
                        y: originY - ((Number.isFinite(item.yOffset) ? item.yOffset : 0) + p.y) * scale,
                        onCurve: p.onCurve,
                        endOfContour: p.endOfContour,
                        glyphIndex: item.glyphIndex,
                        pointIndex: pIndex
                    });
                }
            }
            penX += Number.isFinite(item.xAdvance) ? item.xAdvance : 0;
            if (letterSpacing !== 0 && i < layout.length - 1)
                penX += letterSpacing;
        }
        return { points: points, advanceWidth: Number.isFinite(penX) ? penX : 0, scale: Number.isFinite(scale) ? scale : 1 };
    };
    BaseFontParser.prototype.getColorLayersForGlyph = function (glyphId, paletteIndex) {
        var _a, _b;
        if (paletteIndex === void 0) { paletteIndex = 0; }
        var colr = this.getColrTableForShared();
        if (!colr)
            return [];
        var layers = colr.getLayersForGlyph(glyphId);
        if (layers.length === 0)
            return [];
        var palette = (_b = (_a = this.getCpalTableForShared()) === null || _a === void 0 ? void 0 : _a.getPalette(paletteIndex)) !== null && _b !== void 0 ? _b : [];
        return layers.map(function (layer) {
            if (layer.paletteIndex === 0xffff) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            var color = palette[layer.paletteIndex];
            if (!color) {
                return { glyphId: layer.glyphId, color: null, paletteIndex: layer.paletteIndex };
            }
            var rgba = "rgba(".concat(color.red, ", ").concat(color.green, ", ").concat(color.blue, ", ").concat(color.alpha / 255, ")");
            return { glyphId: layer.glyphId, color: rgba, paletteIndex: layer.paletteIndex };
        });
    };
    BaseFontParser.prototype.getColorLayersForChar = function (char, paletteIndex) {
        if (paletteIndex === void 0) { paletteIndex = 0; }
        var glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null)
            return [];
        return this.getColorLayersForGlyph(glyphId, paletteIndex);
    };
    BaseFontParser.prototype.getColrV1LayersForGlyph = function (glyphId, paletteIndex) {
        if (paletteIndex === void 0) { paletteIndex = 0; }
        var colr = this.getColrTableForShared();
        if (!colr || colr.version === 0)
            return [];
        var paint = colr.getPaintForGlyph(glyphId);
        if (!paint)
            return [];
        return this.flattenColrV1Paint(paint, paletteIndex);
    };
    BaseFontParser.prototype.flattenColrV1Paint = function (paint, paletteIndex) {
        var _this = this;
        var _a, _b, _c;
        if (!paint)
            return [];
        if (paint.format === 1 && Array.isArray(paint.layers)) {
            return paint.layers.flatMap(function (p) { return _this.flattenColrV1Paint(p, paletteIndex); });
        }
        if (paint.format === 10) {
            var child = paint.paint;
            if (child && child.format === 2) {
                var color = (_b = (_a = this.getCpalTableForShared()) === null || _a === void 0 ? void 0 : _a.getPalette(paletteIndex)) === null || _b === void 0 ? void 0 : _b[child.paletteIndex];
                var rgba = color ? "rgba(".concat(color.red, ", ").concat(color.green, ", ").concat(color.blue, ", ").concat((color.alpha / 255) * ((_c = child.alpha) !== null && _c !== void 0 ? _c : 1), ")") : null;
                return [{ glyphId: paint.glyphID, color: rgba, paletteIndex: child.paletteIndex }];
            }
            return this.flattenColrV1Paint(child, paletteIndex).map(function (layer) { return (__assign(__assign({}, layer), { glyphId: paint.glyphID })); });
        }
        if (paint.format === 11) {
            return this.getColrV1LayersForGlyph(paint.glyphID, paletteIndex);
        }
        return [];
    };
    BaseFontParser.prototype.getNameRecord = function (nameId) {
        var _a, _b;
        return (_b = (_a = this.getNameTableForShared()) === null || _a === void 0 ? void 0 : _a.getRecord(nameId)) !== null && _b !== void 0 ? _b : "";
    };
    BaseFontParser.prototype.getAllNameRecords = function () {
        var _a;
        var name = this.getNameTableForShared();
        if (!name)
            return [];
        return ((_a = name.records) !== null && _a !== void 0 ? _a : []).map(function (r) { return ({ nameId: r.nameId, record: r.record }); });
    };
    BaseFontParser.prototype.getAllNameRecordsDetailed = function () {
        var _a;
        var name = this.getNameTableForShared();
        if (!name)
            return [];
        return ((_a = name.records) !== null && _a !== void 0 ? _a : []).map(function (r) { return ({
            nameId: r.nameId,
            record: r.record,
            platformId: r.platformId,
            encodingId: r.encodingId,
            languageId: r.languageId
        }); });
    };
    BaseFontParser.prototype.getFontNames = function () {
        return {
            family: this.getPreferredNameRecord(1),
            subfamily: this.getPreferredNameRecord(2),
            uniqueSubfamily: this.getPreferredNameRecord(3),
            fullName: this.getPreferredNameRecord(4),
            version: this.getPreferredNameRecord(5),
            postScriptName: this.getPreferredNameRecord(6),
            manufacturer: this.getPreferredNameRecord(8),
            designer: this.getPreferredNameRecord(9),
            description: this.getPreferredNameRecord(10),
            vendorUrl: this.getPreferredNameRecord(11),
            designerUrl: this.getPreferredNameRecord(12),
            license: this.getPreferredNameRecord(13),
            licenseUrl: this.getPreferredNameRecord(14),
            typographicFamily: this.getPreferredNameRecord(16),
            typographicSubfamily: this.getPreferredNameRecord(17)
        };
    };
    BaseFontParser.prototype.getOs2Metrics = function () {
        var os2 = this.getOs2TableForShared();
        if (!os2)
            return null;
        return {
            version: os2.version,
            weightClass: os2.usWeightClass,
            widthClass: os2.usWidthClass,
            fsType: os2.fsType,
            fsSelection: os2.fsSelection,
            typoAscender: os2.sTypoAscender,
            typoDescender: os2.sTypoDescender,
            typoLineGap: os2.sTypoLineGap,
            winAscent: os2.usWinAscent,
            winDescent: os2.usWinDescent,
            firstCharIndex: os2.usFirstCharIndex,
            lastCharIndex: os2.usLastCharIndex,
            vendorId: this.decodeOs2VendorId(os2.achVendorID),
            unicodeRanges: [os2.ulUnicodeRange1, os2.ulUnicodeRange2, os2.ulUnicodeRange3, os2.ulUnicodeRange4],
            codePageRanges: [os2.ulCodePageRange1, os2.ulCodePageRange2],
            xHeight: os2.version >= 2 ? os2.sxHeight : null,
            capHeight: os2.version >= 2 ? os2.sCapHeight : null,
            defaultChar: os2.version >= 2 ? os2.usDefaultChar : null,
            breakChar: os2.version >= 2 ? os2.usBreakChar : null,
            maxContext: os2.version >= 2 ? os2.usMaxContext : null,
            lowerOpticalPointSize: os2.version >= 5 ? os2.usLowerOpticalPointSize : null,
            upperOpticalPointSize: os2.version >= 5 ? os2.usUpperOpticalPointSize : null,
            panose: os2.panose
                ? {
                    familyType: os2.panose.bFamilyType,
                    serifStyle: os2.panose.bSerifStyle,
                    weight: os2.panose.bWeight,
                    proportion: os2.panose.bProportion,
                    contrast: os2.panose.bContrast,
                    strokeVariation: os2.panose.bStrokeVariation,
                    armStyle: os2.panose.bArmStyle,
                    letterform: os2.panose.bLetterform,
                    midline: os2.panose.bMidline,
                    xHeight: os2.panose.bXHeight
                }
                : null
        };
    };
    BaseFontParser.prototype.getPostMetrics = function () {
        var post = this.getPostTableForShared();
        if (!post)
            return null;
        return {
            version: post.version / 65536,
            italicAngle: post.italicAngle / 65536,
            underlinePosition: post.underlinePosition,
            underlineThickness: post.underlineThickness,
            isFixedPitch: post.isFixedPitch !== 0,
            rawIsFixedPitch: post.isFixedPitch
        };
    };
    BaseFontParser.prototype.getWeightClass = function () {
        var _a, _b;
        return (_b = (_a = this.getOs2TableForShared()) === null || _a === void 0 ? void 0 : _a.usWeightClass) !== null && _b !== void 0 ? _b : 0;
    };
    BaseFontParser.prototype.getWidthClass = function () {
        var _a, _b;
        return (_b = (_a = this.getOs2TableForShared()) === null || _a === void 0 ? void 0 : _a.usWidthClass) !== null && _b !== void 0 ? _b : 0;
    };
    BaseFontParser.prototype.getFsTypeFlags = function () {
        var _a, _b;
        var fsType = (_b = (_a = this.getOs2TableForShared()) === null || _a === void 0 ? void 0 : _a.fsType) !== null && _b !== void 0 ? _b : 0;
        if (fsType === 0)
            return ['installable-embedding'];
        var flags = [];
        if (fsType & 0x0002)
            flags.push('restricted-license-embedding');
        if (fsType & 0x0004)
            flags.push('preview-print-embedding');
        if (fsType & 0x0008)
            flags.push('editable-embedding');
        if (fsType & 0x0100)
            flags.push('no-subsetting');
        if (fsType & 0x0200)
            flags.push('bitmap-embedding-only');
        return flags;
    };
    BaseFontParser.prototype.getFsSelectionFlags = function () {
        var _a, _b;
        var fsSelection = (_b = (_a = this.getOs2TableForShared()) === null || _a === void 0 ? void 0 : _a.fsSelection) !== null && _b !== void 0 ? _b : 0;
        var flags = [];
        if (fsSelection & 0x0001)
            flags.push('italic');
        if (fsSelection & 0x0002)
            flags.push('underscore');
        if (fsSelection & 0x0004)
            flags.push('negative');
        if (fsSelection & 0x0008)
            flags.push('outlined');
        if (fsSelection & 0x0010)
            flags.push('strikeout');
        if (fsSelection & 0x0020)
            flags.push('bold');
        if (fsSelection & 0x0040)
            flags.push('regular');
        if (fsSelection & 0x0080)
            flags.push('use-typo-metrics');
        if (fsSelection & 0x0100)
            flags.push('wws');
        if (fsSelection & 0x0200)
            flags.push('oblique');
        return flags;
    };
    BaseFontParser.prototype.isItalic = function () {
        var _a, _b, _c, _d;
        var fsSelection = (_b = (_a = this.getOs2TableForShared()) === null || _a === void 0 ? void 0 : _a.fsSelection) !== null && _b !== void 0 ? _b : 0;
        if (fsSelection & 0x0001)
            return true;
        if (fsSelection & 0x0200)
            return true;
        if (((_d = (_c = this.getPostTableForShared()) === null || _c === void 0 ? void 0 : _c.italicAngle) !== null && _d !== void 0 ? _d : 0) !== 0)
            return true;
        var subfamily = this.getPreferredNameRecord(2).toLowerCase();
        return subfamily.includes('italic') || subfamily.includes('oblique');
    };
    BaseFontParser.prototype.isBold = function () {
        var _a, _b, _c, _d;
        var fsSelection = (_b = (_a = this.getOs2TableForShared()) === null || _a === void 0 ? void 0 : _a.fsSelection) !== null && _b !== void 0 ? _b : 0;
        if (fsSelection & 0x0020)
            return true;
        if (((_d = (_c = this.getOs2TableForShared()) === null || _c === void 0 ? void 0 : _c.usWeightClass) !== null && _d !== void 0 ? _d : 0) >= 700)
            return true;
        return this.getPreferredNameRecord(2).toLowerCase().includes('bold');
    };
    BaseFontParser.prototype.isMonospace = function () {
        var _a, _b;
        return ((_b = (_a = this.getPostTableForShared()) === null || _a === void 0 ? void 0 : _a.isFixedPitch) !== null && _b !== void 0 ? _b : 0) !== 0;
    };
    BaseFontParser.prototype.getMetadata = function () {
        return {
            names: this.getFontNames(),
            nameRecords: this.getAllNameRecordsDetailed(),
            os2: this.getOs2Metrics(),
            post: this.getPostMetrics(),
            style: {
                isBold: this.isBold(),
                isItalic: this.isItalic(),
                isMonospace: this.isMonospace(),
                weightClass: this.getWeightClass(),
                widthClass: this.getWidthClass(),
                fsTypeFlags: this.getFsTypeFlags(),
                fsSelectionFlags: this.getFsSelectionFlags()
            }
        };
    };
    BaseFontParser.prototype.getPreferredNameRecord = function (nameId) {
        var _a, _b;
        var name = this.getNameTableForShared();
        if (!name || ((_a = name.records) !== null && _a !== void 0 ? _a : []).length === 0)
            return '';
        var candidates = ((_b = name.records) !== null && _b !== void 0 ? _b : []).filter(function (r) { return r.nameId === nameId && !!r.record && r.record.trim().length > 0; });
        if (candidates.length === 0)
            return '';
        var score = function (rec) {
            var s = 0;
            if (rec.platformId === Table.platformMicrosoft)
                s += 100;
            else if (rec.platformId === Table.platformAppleUnicode)
                s += 80;
            else if (rec.platformId === Table.platformMacintosh)
                s += 60;
            if (rec.languageId === 0x0409)
                s += 30;
            if (rec.languageId === 0)
                s += 10;
            return s;
        };
        var best = candidates[0];
        var bestScore = score(best);
        for (var i = 1; i < candidates.length; i++) {
            var current = candidates[i];
            var currentScore = score(current);
            if (currentScore > bestScore) {
                best = current;
                bestScore = currentScore;
            }
        }
        return best.record;
    };
    BaseFontParser.prototype.decodeOs2VendorId = function (vendor) {
        var n = vendor >>> 0;
        var text = String.fromCharCode((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
        return text.replace(/\0/g, '').trim();
    };
    return BaseFontParser;
}());
export { BaseFontParser };

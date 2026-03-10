var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { ByteArray } from '../utils/ByteArray.js';
import { GlyfCompositeDescript } from '../table/GlyfCompositeDescript.js';
import { Table } from '../table/Table.js';
import { TableDirectory } from '../table/TableDirectory.js';
import { TableFactory } from '../table/TableFactory.js';
import { GlyphData } from './GlyphData.js';
import { BaseFontParser } from './BaseFontParser.js';
var FontParserTTF = /** @class */ (function (_super) {
    __extends(FontParserTTF, _super);
    function FontParserTTF(byteData) {
        var _this = _super.call(this) || this;
        // Define properties
        _this.os2 = null;
        _this.cmap = null;
        _this.glyf = null;
        _this.cff = null;
        _this.cff2 = null;
        _this.head = null;
        _this.hhea = null;
        _this.hmtx = null;
        _this.loca = null;
        _this.maxp = null;
        _this.pName = null;
        _this.post = null;
        _this.gsub = null;
        _this.kern = null;
        _this.colr = null;
        _this.cpal = null;
        _this.gpos = null;
        _this.gdef = null;
        _this.fvar = null;
        _this.svg = null;
        _this.gvar = null;
        _this.variationCoords = [];
        // Table directory and tables
        _this.tableDir = null;
        _this.tables = [];
        _this.init(byteData);
        return _this;
    }
    // Static load method that returns a Promise
    FontParserTTF.load = function (url) {
        return fetch(url)
            .then(function (response) {
            if (!response.ok)
                throw new Error("HTTP error! Status: ".concat(response.status));
            return response.arrayBuffer();
        })
            .then(function (arrayBuffer) { return new ByteArray(new Uint8Array(arrayBuffer)); }) // Wrap in ByteArray
            .then(function (byteArray) { return new FontParserTTF(byteArray); }) // Create and initialize FontParserTTF
            .catch(function (error) {
            console.error('Error loading font:', error);
            throw error; // Propagate error for further handling if needed
        });
    };
    // Initialize the FontParserTTF instance
    FontParserTTF.prototype.init = function (byteData) {
        var _a, _b, _c, _d;
        // Initialize the table directory
        this.tableDir = new TableDirectory(byteData);
        this.tables = [];
        // Load each of the tables
        for (var i = 0; i < this.tableDir.numTables; i++) {
            var tf = new TableFactory();
            var tab = tf.create(this.tableDir.getEntry(i), byteData);
            if (tab !== null) {
                this.tables.push(tab);
            }
        }
        // Get references to the tables
        this.os2 = this.getTable(Table.OS_2);
        this.cmap = this.getTable(Table.cmap);
        this.glyf = this.getTable(Table.glyf);
        this.cff = this.getTable(Table.CFF);
        this.cff2 = this.getTable(Table.CFF2);
        this.head = this.getTable(Table.head);
        this.hhea = this.getTable(Table.hhea);
        this.hmtx = this.getTable(Table.hmtx);
        this.loca = this.getTable(Table.loca);
        this.maxp = this.getTable(Table.maxp);
        this.pName = this.getTable(Table.pName);
        this.post = this.getTable(Table.post);
        this.gsub = this.getTable(Table.GSUB);
        this.kern = this.getTable(Table.kern);
        this.colr = this.getTable(Table.COLR);
        this.cpal = this.getTable(Table.CPAL);
        this.gpos = this.getTable(Table.GPOS);
        this.gdef = this.getTable(Table.GDEF);
        var maybeGsubWithGdef = this.gsub;
        if (this.gsub && this.gdef && typeof maybeGsubWithGdef.setGdef === 'function') {
            maybeGsubWithGdef.setGdef(this.gdef);
        }
        this.fvar = this.getTable(Table.fvar);
        this.svg = this.getTable(Table.SVG);
        this.gvar = this.getTable(Table.gvar);
        if (this.fvar && this.fvar.axes.length > 0) {
            var defaults = {};
            for (var _i = 0, _e = this.fvar.axes; _i < _e.length; _i++) {
                var axis = _e[_i];
                defaults[axis.name] = axis.defaultValue;
            }
            this.setVariationByAxes(defaults);
        }
        // Initialize the tables
        if (this.hmtx && this.maxp) {
            this.hmtx.run((_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.numberOfHMetrics) !== null && _b !== void 0 ? _b : 0, this.maxp.numGlyphs - ((_d = (_c = this.hhea) === null || _c === void 0 ? void 0 : _c.numberOfHMetrics) !== null && _d !== void 0 ? _d : 0));
        }
        if (this.loca && this.maxp && this.head) {
            this.loca.run(this.maxp.numGlyphs, this.head.indexToLocFormat === 0);
        }
        if (this.glyf && this.loca && this.maxp) {
            this.glyf.run(this.maxp.numGlyphs, this.loca);
        }
    };
    /**
     * Apply GPOS value and attachment adjustments to an already-shaped run.
     * Attachment positioning runs after value positioning so mark anchors
     * inherit parent/base offsets introduced earlier in the run.
     */
    FontParserTTF.prototype.applyGposPositioningInternal = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningShared(glyphIndices, positioned, gposFeatures, scriptTags);
    };
    // Backward-compatible alias used by tests/tools that call this directly.
    FontParserTTF.prototype.applyGposPositioning = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    };
    FontParserTTF.prototype.isMarkGlyphClass = function (glyphId) {
        var _a, _b, _c;
        return ((_c = (_b = (_a = this.gdef) === null || _a === void 0 ? void 0 : _a.getGlyphClass) === null || _b === void 0 ? void 0 : _b.call(_a, glyphId)) !== null && _c !== void 0 ? _c : 0) === 3;
    };
    // Get a glyph description by index
    FontParserTTF.prototype.getGlyph = function (i) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11;
        var description = (_a = this.glyf) === null || _a === void 0 ? void 0 : _a.getDescription(i);
        if (description != null) {
            var desc = description;
            var lsb = (_c = (_b = this.hmtx) === null || _b === void 0 ? void 0 : _b.getLeftSideBearing(i)) !== null && _c !== void 0 ? _c : 0;
            var advance = (_e = (_d = this.hmtx) === null || _d === void 0 ? void 0 : _d.getAdvanceWidth(i)) !== null && _e !== void 0 ? _e : 0;
            if (this.gvar && this.variationCoords.length > 0) {
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
                var gvarPointCount = compositePointCount + 4; // phantom points
                var deltas = this.gvar.getDeltasForGlyph(i, this.variationCoords, gvarPointCount);
                if (deltas) {
                    var self_1 = this;
                    var base_1 = description;
                    var compositeBase = isComposite_1 && base_1 instanceof GlyfCompositeDescript ? base_1 : null;
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
                        this.applyIupDeltas(base_1, dx, dy, touched);
                    }
                    else if (base_1 instanceof GlyfCompositeDescript) {
                        compDx_1 = new Array(componentCount).fill(0);
                        compDy_1 = new Array(componentCount).fill(0);
                        compXScale_1 = new Array(componentCount).fill(0);
                        compYScale_1 = new Array(componentCount).fill(0);
                        compScale01_1 = new Array(componentCount).fill(0);
                        compScale10_1 = new Array(componentCount).fill(0);
                        for (var c = 0; c < componentCount; c++) {
                            var rawDx = (_f = fullDx_1[c]) !== null && _f !== void 0 ? _f : 0;
                            var rawDy = (_g = fullDy_1[c]) !== null && _g !== void 0 ? _g : 0;
                            compDx_1[c] = rawDx;
                            compDy_1[c] = rawDy;
                        }
                        var tIndex = componentCount;
                        for (var c = 0; c < componentCount; c++) {
                            var comp = descriptionComponents[c];
                            if (!comp)
                                continue;
                            if (comp.hasTwoByTwo()) {
                                var idx1 = tIndex++;
                                var idx2 = tIndex++;
                                compXScale_1[c] = ((_h = fullDx_1[idx1]) !== null && _h !== void 0 ? _h : 0) / 0x4000;
                                compScale01_1[c] = ((_j = fullDy_1[idx1]) !== null && _j !== void 0 ? _j : 0) / 0x4000;
                                compScale10_1[c] = ((_k = fullDx_1[idx2]) !== null && _k !== void 0 ? _k : 0) / 0x4000;
                                compYScale_1[c] = ((_l = fullDy_1[idx2]) !== null && _l !== void 0 ? _l : 0) / 0x4000;
                            }
                            else if (comp.hasXYScale()) {
                                var idx = tIndex++;
                                compXScale_1[c] = ((_m = fullDx_1[idx]) !== null && _m !== void 0 ? _m : 0) / 0x4000;
                                compYScale_1[c] = ((_o = fullDy_1[idx]) !== null && _o !== void 0 ? _o : 0) / 0x4000;
                            }
                            else if (comp.hasScale()) {
                                var idx = tIndex++;
                                var delta = ((_p = fullDx_1[idx]) !== null && _p !== void 0 ? _p : 0) / 0x4000;
                                compXScale_1[c] = delta;
                                compYScale_1[c] = delta;
                            }
                        }
                    }
                    var phantomBase = isComposite_1 ? compositePointCount : basePointCount;
                    var lsbDelta = (_q = fullDx_1[phantomBase]) !== null && _q !== void 0 ? _q : 0;
                    var rsbDelta = (_r = fullDx_1[phantomBase + 1]) !== null && _r !== void 0 ? _r : 0;
                    lsb += lsbDelta;
                    advance += (rsbDelta - lsbDelta);
                    var minX_1 = Infinity;
                    var maxX_1 = -Infinity;
                    var minY_1 = Infinity;
                    var maxY_1 = -Infinity;
                    for (var p = 0; p < basePointCount; p++) {
                        var compositeBase_1 = (isComposite_1 && base_1 instanceof GlyfCompositeDescript) ? base_1 : null;
                        var compositeComponents = compositeBase_1 && Array.isArray(compositeBase_1.components) ? compositeBase_1.components : [];
                        var comp = compositeBase_1 ? compositeBase_1.getComponentForPointIndex(p) : null;
                        var compIndex = comp ? compositeComponents.indexOf(comp) : -1;
                        var x = base_1.getXCoordinate(p);
                        var y = base_1.getYCoordinate(p);
                        if (comp && compIndex >= 0 && self_1.glyf) {
                            var gd = self_1.glyf.getDescription(comp.glyphIndex);
                            if (gd) {
                                var localIndex = p - comp.firstIndex;
                                var px = gd.getXCoordinate(localIndex);
                                var py = gd.getYCoordinate(localIndex);
                                var xscale = comp.xscale + ((_s = compXScale_1 === null || compXScale_1 === void 0 ? void 0 : compXScale_1[compIndex]) !== null && _s !== void 0 ? _s : 0);
                                var yscale = comp.yscale + ((_t = compYScale_1 === null || compYScale_1 === void 0 ? void 0 : compYScale_1[compIndex]) !== null && _t !== void 0 ? _t : 0);
                                var scale01 = comp.scale01 + ((_u = compScale01_1 === null || compScale01_1 === void 0 ? void 0 : compScale01_1[compIndex]) !== null && _u !== void 0 ? _u : 0);
                                var scale10 = comp.scale10 + ((_v = compScale10_1 === null || compScale10_1 === void 0 ? void 0 : compScale10_1[compIndex]) !== null && _v !== void 0 ? _v : 0);
                                var ox = comp.xtranslate + ((_w = compDx_1 === null || compDx_1 === void 0 ? void 0 : compDx_1[compIndex]) !== null && _w !== void 0 ? _w : 0);
                                var oy = comp.ytranslate + ((_x = compDy_1 === null || compDy_1 === void 0 ? void 0 : compDy_1[compIndex]) !== null && _x !== void 0 ? _x : 0);
                                x = (px * xscale) + (py * scale10) + ox;
                                y = (px * scale01) + (py * yscale) + oy;
                            }
                        }
                        else {
                            var rawDx = (_y = fullDx_1[p]) !== null && _y !== void 0 ? _y : 0;
                            var rawDy = (_z = fullDy_1[p]) !== null && _z !== void 0 ? _z : 0;
                            var transformed = comp && typeof comp.hasTransform === 'function' && comp.hasTransform() && typeof comp.transformDelta === 'function'
                                ? comp.transformDelta(rawDx, rawDy)
                                : null;
                            var pointDx = transformed ? ((_0 = transformed.dx) !== null && _0 !== void 0 ? _0 : rawDx) : rawDx;
                            var pointDy = transformed ? ((_1 = transformed.dy) !== null && _1 !== void 0 ? _1 : rawDy) : rawDy;
                            var ox = compIndex >= 0 && compDx_1 ? (_2 = compDx_1[compIndex]) !== null && _2 !== void 0 ? _2 : 0 : 0;
                            var oy = compIndex >= 0 && compDy_1 ? (_3 = compDy_1[compIndex]) !== null && _3 !== void 0 ? _3 : 0 : 0;
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
                            if (comp && compIndex >= 0 && self_1.glyf) {
                                var gd = self_1.glyf.getDescription(comp.glyphIndex);
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
                            if (comp && compIndex >= 0 && self_1.glyf) {
                                var gd = self_1.glyf.getDescription(comp.glyphIndex);
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
        if (this.cff2) {
            var cff2Desc = this.cff2.getGlyphDescription(i);
            if (cff2Desc) {
                return new GlyphData(cff2Desc, (_5 = (_4 = this.hmtx) === null || _4 === void 0 ? void 0 : _4.getLeftSideBearing(i)) !== null && _5 !== void 0 ? _5 : 0, (_7 = (_6 = this.hmtx) === null || _6 === void 0 ? void 0 : _6.getAdvanceWidth(i)) !== null && _7 !== void 0 ? _7 : 0, { isCubic: true, includePhantoms: false });
            }
        }
        if (this.cff) {
            var cffDesc = this.cff.getGlyphDescription(i);
            if (cffDesc) {
                return new GlyphData(cffDesc, (_9 = (_8 = this.hmtx) === null || _8 === void 0 ? void 0 : _8.getLeftSideBearing(i)) !== null && _9 !== void 0 ? _9 : 0, (_11 = (_10 = this.hmtx) === null || _10 === void 0 ? void 0 : _10.getAdvanceWidth(i)) !== null && _11 !== void 0 ? _11 : 0, { isCubic: true, includePhantoms: false });
            }
        }
        return null;
    };
    // Get the number of glyphs
    FontParserTTF.prototype.getNumGlyphs = function () {
        var _a, _b;
        return (_b = (_a = this.maxp) === null || _a === void 0 ? void 0 : _a.numGlyphs) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the ascent value
    FontParserTTF.prototype.getAscent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.ascender) !== null && _b !== void 0 ? _b : 0;
    };
    // Get the descent value
    FontParserTTF.prototype.getDescent = function () {
        var _a, _b;
        return (_b = (_a = this.hhea) === null || _a === void 0 ? void 0 : _a.descender) !== null && _b !== void 0 ? _b : 0;
    };
    FontParserTTF.prototype.getUnitsPerEm = function () {
        var _a, _b;
        return (_b = (_a = this.head) === null || _a === void 0 ? void 0 : _a.unitsPerEm) !== null && _b !== void 0 ? _b : 1000;
    };
    FontParserTTF.prototype.getMarkAnchorsForGlyph = function (glyphId, subtables) {
        return this.getGposAttachmentAnchors(glyphId, subtables);
    };
    FontParserTTF.prototype.getSvgDocumentForGlyphAsync = function (glyphId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.svg)
                    return [2 /*return*/, { svgText: null, isCompressed: false }];
                return [2 /*return*/, this.svg.getSvgDocumentForGlyphAsync(glyphId)];
            });
        });
    };
    FontParserTTF.prototype.applyIupDeltas = function (base, dx, dy, touched) {
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
                    dx[globalIndex] = this_1.interpolate(ax, bx, dx[contour[a]], dx[contour[b]], px);
                    dy[globalIndex] = this_1.interpolate(ay, by, dy[contour[a]], dy[contour[b]], py);
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
    FontParserTTF.prototype.interpolate = function (aCoord, bCoord, aDelta, bDelta, pCoord) {
        if (aCoord === bCoord)
            return aDelta;
        var t = (pCoord - aCoord) / (bCoord - aCoord);
        var clamped = Math.max(0, Math.min(1, t));
        return aDelta + (bDelta - aDelta) * clamped;
    };
    FontParserTTF.prototype.getTable = function (tableType) {
        return this.tables.find(function (tab) { return (tab === null || tab === void 0 ? void 0 : tab.getType()) === tableType; }) || null;
    };
    FontParserTTF.prototype.getGsubTableForLayout = function () {
        return this.gsub;
    };
    FontParserTTF.prototype.getKernTableForLayout = function () {
        return this.kern;
    };
    FontParserTTF.prototype.getGposTableForLayout = function () {
        return this.gpos;
    };
    FontParserTTF.prototype.getGlyphByIndexForLayout = function (glyphIndex) {
        return this.getGlyph(glyphIndex);
    };
    FontParserTTF.prototype.isMarkGlyphForLayout = function (glyphIndex) {
        return this.isMarkGlyphClass(glyphIndex);
    };
    FontParserTTF.prototype.applyGposPositioningForLayout = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        this.applyGposPositioningInternal(glyphIndices, positioned, gposFeatures, scriptTags);
    };
    FontParserTTF.prototype.getTableByTypeInternal = function (tableType) {
        return this.getTable(tableType);
    };
    FontParserTTF.prototype.getNameRecordForInfo = function (nameId) {
        return this.getNameRecord(nameId);
    };
    FontParserTTF.prototype.getOs2TableForInfo = function () {
        return this.os2;
    };
    FontParserTTF.prototype.getPostTableForInfo = function () {
        return this.post;
    };
    FontParserTTF.prototype.getCmapTableForLookup = function () {
        return this.cmap;
    };
    FontParserTTF.prototype.getNameTableForShared = function () {
        return this.pName;
    };
    FontParserTTF.prototype.getOs2TableForShared = function () {
        return this.os2;
    };
    FontParserTTF.prototype.getPostTableForShared = function () {
        return this.post;
    };
    FontParserTTF.prototype.getFvarTableForShared = function () {
        return this.fvar;
    };
    FontParserTTF.prototype.getColrTableForShared = function () {
        return this.colr;
    };
    FontParserTTF.prototype.getCpalTableForShared = function () {
        return this.cpal;
    };
    FontParserTTF.prototype.getUnitsPerEmForShared = function () {
        return this.getUnitsPerEm();
    };
    FontParserTTF.prototype.setVariationCoordsInternal = function (coords) {
        this.variationCoords = coords.slice();
    };
    FontParserTTF.prototype.onVariationCoordsUpdated = function (coords) {
        if (this.cff2)
            this.cff2.setVariationCoords(coords);
        if (this.colr && typeof this.colr.setVariationCoords === 'function') {
            this.colr.setVariationCoords(coords);
        }
    };
    return FontParserTTF;
}(BaseFontParser));
export { FontParserTTF };

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
import { MarkBasePosFormat1 } from '../table/MarkBasePosFormat1.js';
import { MarkLigPosFormat1 } from '../table/MarkLigPosFormat1.js';
import { MarkMarkPosFormat1 } from '../table/MarkMarkPosFormat1.js';
import { CursivePosFormat1 } from '../table/CursivePosFormat1.js';
import { PairPosFormat1 } from '../table/PairPosFormat1.js';
import { PairPosFormat2 } from '../table/PairPosFormat2.js';
import { SinglePosSubtable } from '../table/SinglePosSubtable.js';
import { PairPosSubtable } from '../table/PairPosSubtable.js';
import { detectScriptTags } from '../utils/ScriptDetector.js';
import { matchesDiagnosticFilter } from '../types/Diagnostics.js';
var FontParserTTF = /** @class */ (function () {
    function FontParserTTF(byteData) {
        // Define properties
        this.os2 = null;
        this.cmap = null;
        this.glyf = null;
        this.cff = null;
        this.cff2 = null;
        this.head = null;
        this.hhea = null;
        this.hmtx = null;
        this.loca = null;
        this.maxp = null;
        this.pName = null;
        this.post = null;
        this.gsub = null;
        this.kern = null;
        this.colr = null;
        this.cpal = null;
        this.gpos = null;
        this.gdef = null;
        this.fvar = null;
        this.svg = null;
        this.gvar = null;
        this.variationCoords = [];
        this.diagnostics = [];
        this.diagnosticKeys = new Set();
        // Table directory and tables
        this.tableDir = null;
        this.tables = [];
        this.init(byteData);
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
    FontParserTTF.prototype.emitDiagnostic = function (code, level, phase, message, context, onceKey) {
        if (onceKey) {
            if (this.diagnosticKeys.has(onceKey))
                return;
            this.diagnosticKeys.add(onceKey);
        }
        this.diagnostics.push({ code: code, level: level, phase: phase, message: message, context: context });
    };
    FontParserTTF.prototype.getDiagnostics = function (filter) {
        return this.diagnostics.filter(function (d) { return matchesDiagnosticFilter(d, filter); }).slice();
    };
    FontParserTTF.prototype.clearDiagnostics = function () {
        this.diagnostics = [];
        this.diagnosticKeys.clear();
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
        if (this.gsub && this.gdef && typeof this.gsub.setGdef === 'function') {
            this.gsub.setGdef(this.gdef);
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
    FontParserTTF.prototype.getGlyphIndexByChar = function (char) {
        if (!char || char.length === 0) {
            this.emitDiagnostic("INVALID_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar expects a character.");
            return null;
        }
        if (char.length > 2) {
            this.emitDiagnostic("MULTI_CHAR_INPUT", "warning", "parse", "getGlyphIndexByChar received multiple characters; using the first code point.", undefined, "MULTI_CHAR_INPUT");
        }
        var codePoint = char.codePointAt(0); // Convert character to Unicode code point
        if (codePoint == null) {
            this.emitDiagnostic("CODE_POINT_RESOLVE_FAILED", "warning", "parse", "Failed to resolve code point for character.");
            return null;
        }
        if (!this.cmap) {
            this.emitDiagnostic("MISSING_TABLE_CMAP", "warning", "parse", "No cmap table available.", undefined, "MISSING_TABLE_CMAP");
            return null;
        }
        var cmapFormat = this.getBestCmapFormatFor(codePoint);
        if (!cmapFormat) {
            this.emitDiagnostic("MISSING_CMAP_FORMAT", "warning", "parse", "No cmap format available for code point.", { codePoint: codePoint });
            return null;
        }
        var glyphIndex = typeof cmapFormat.getGlyphIndex === "function"
            ? cmapFormat.getGlyphIndex(codePoint)
            : cmapFormat.mapCharCode(codePoint);
        if (glyphIndex == null || glyphIndex === 0) {
            return null;
        }
        return glyphIndex;
    };
    FontParserTTF.prototype.getGlyphByChar = function (char) {
        var glyphIndex = this.getGlyphIndexByChar(char);
        if (glyphIndex == null)
            return null;
        return this.getGlyph(glyphIndex);
    };
    FontParserTTF.prototype.getGlyphIndicesForString = function (text) {
        var indices = [];
        for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
            var ch = text_1[_i];
            var idx = this.getGlyphIndexByChar(ch);
            if (idx != null)
                indices.push(idx);
        }
        return indices;
    };
    FontParserTTF.prototype.getGlyphIndicesForStringWithGsub = function (text, featureTags, scriptTags) {
        if (featureTags === void 0) { featureTags = ["liga"]; }
        if (scriptTags === void 0) { scriptTags = ["DFLT", "latn"]; }
        var glyphs = this.getGlyphIndicesForString(text);
        if (!this.gsub || glyphs.length === 0) {
            if (!this.gsub && glyphs.length > 0) {
                this.emitDiagnostic("MISSING_TABLE_GSUB", "info", "layout", "GSUB table not present; using direct glyph mapping.", undefined, "MISSING_TABLE_GSUB");
            }
            return glyphs;
        }
        return this.gsub.applyFeatures(glyphs, featureTags, scriptTags);
    };
    FontParserTTF.prototype.getKerningValueByGlyphs = function (leftGlyph, rightGlyph) {
        var _a;
        if (!this.kern)
            return 0;
        if (typeof this.kern.getKerningValue === "function") {
            return (_a = this.kern.getKerningValue(leftGlyph, rightGlyph)) !== null && _a !== void 0 ? _a : 0;
        }
        return 0;
    };
    FontParserTTF.prototype.getVariationAxes = function () {
        var _a, _b;
        return (_b = (_a = this.fvar) === null || _a === void 0 ? void 0 : _a.axes) !== null && _b !== void 0 ? _b : [];
    };
    FontParserTTF.prototype.setVariationCoords = function (coords) {
        this.variationCoords = coords.slice();
        if (this.cff2)
            this.cff2.setVariationCoords(coords);
        if (this.colr && typeof this.colr.setVariationCoords === 'function') {
            this.colr.setVariationCoords(coords);
        }
    };
    /**
     * Convert user-space axis values (for example `wght: 700`) to normalized
     * design coordinates in [-1, 1] for variation stores.
     */
    FontParserTTF.prototype.setVariationByAxes = function (values) {
        var _a;
        if (!this.fvar)
            return;
        var coords = [];
        for (var _i = 0, _b = this.fvar.axes; _i < _b.length; _i++) {
            var axis = _b[_i];
            var tag = axis.name;
            var value = (_a = values[tag]) !== null && _a !== void 0 ? _a : axis.defaultValue;
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
    FontParserTTF.prototype.getGposKerningValueByGlyphs = function (leftGlyph, rightGlyph) {
        var _a, _b, _c;
        if (!this.gpos) {
            this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "GPOS table not present; kerning defaults to 0.", undefined, "MISSING_TABLE_GPOS");
            return 0;
        }
        var lookups = (_c = (_b = (_a = this.gpos.lookupList) === null || _a === void 0 ? void 0 : _a.getLookups) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
        var value = 0;
        for (var _i = 0, lookups_1 = lookups; _i < lookups_1.length; _i++) {
            var lookup = lookups_1[_i];
            if (!lookup || lookup.getType() !== 2)
                continue;
            for (var i = 0; i < lookup.getSubtableCount(); i++) {
                var st = lookup.getSubtable(i);
                if (st instanceof PairPosFormat1 || st instanceof PairPosFormat2) {
                    value += st.getKerning(leftGlyph, rightGlyph);
                }
            }
        }
        return value;
    };
    FontParserTTF.prototype.getKerningValue = function (leftChar, rightChar) {
        var left = this.getGlyphIndexByChar(leftChar);
        var right = this.getGlyphIndexByChar(rightChar);
        if (left == null || right == null)
            return 0;
        var kern = this.getKerningValueByGlyphs(left, right);
        if (kern !== 0)
            return kern;
        return this.getGposKerningValueByGlyphs(left, right);
    };
    /**
     * Shape and position a single glyph run (no wrapping/line layout).
     * Applies GSUB substitutions first, then kerning + optional GPOS.
     */
    FontParserTTF.prototype.layoutString = function (text, options) {
        var _a, _b, _c;
        if (options === void 0) { options = {}; }
        var gsubFeatures = (_a = options.gsubFeatures) !== null && _a !== void 0 ? _a : ["liga"];
        var scriptTags = (_b = options.scriptTags) !== null && _b !== void 0 ? _b : ["DFLT", "latn"];
        var gposFeatures = (_c = options.gposFeatures) !== null && _c !== void 0 ? _c : ["kern", "mark", "mkmk", "curs"];
        var glyphIndices = this.getGlyphIndicesForStringWithGsub(text, gsubFeatures, scriptTags);
        var positioned = [];
        for (var i = 0; i < glyphIndices.length; i++) {
            var glyphIndex = glyphIndices[i];
            var glyph = this.getGlyph(glyphIndex);
            if (!glyph)
                continue;
            var kern = 0;
            if (i < glyphIndices.length - 1) {
                kern = this.getKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                if (kern === 0) {
                    kern = this.getGposKerningValueByGlyphs(glyphIndex, glyphIndices[i + 1]);
                }
            }
            positioned.push({
                glyphIndex: glyphIndex,
                xAdvance: glyph.advanceWidth + kern,
                xOffset: 0,
                yOffset: 0,
                yAdvance: 0,
            });
        }
        if (options.gpos) {
            if (!this.gpos) {
                this.emitDiagnostic("MISSING_TABLE_GPOS", "info", "layout", "Requested GPOS positioning, but GPOS table is unavailable.", undefined, "MISSING_TABLE_GPOS");
            }
            this.applyGposPositioning(glyphIndices, positioned, gposFeatures, scriptTags);
        }
        return positioned;
    };
    FontParserTTF.prototype.layoutStringAuto = function (text, options) {
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
    /**
     * Apply GPOS value and attachment adjustments to an already-shaped run.
     * Attachment positioning runs after value positioning so mark anchors
     * inherit parent/base offsets introduced earlier in the run.
     */
    FontParserTTF.prototype.applyGposPositioning = function (glyphIndices, positioned, gposFeatures, scriptTags) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1;
        if (!this.gpos)
            return;
        var subtables = this.gpos.getSubtablesForFeatures(gposFeatures, scriptTags);
        for (var _i = 0, subtables_1 = subtables; _i < subtables_1.length; _i++) {
            var st = subtables_1[_i];
            if (st instanceof SinglePosSubtable ||
                typeof st.getAdjustment === 'function') {
                for (var i = 0; i < glyphIndices.length; i++) {
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
            // These attachment subtables are applied in the second pass below.
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
            var anchors = _this.getMarkAnchorsForGlyph(gid, markSubtables);
            anchorsCache.set(gid, anchors);
            return anchors;
        };
        var getBaseAnchor = function (anchors, classIndex) {
            var candidates = anchors.filter(function (a) {
                return (a.type === 'base' || a.type === 'ligature' || a.type === 'mark2') && a.classIndex === classIndex;
            });
            if (candidates.length === 0)
                return null;
            // For marks after ligatures, default to the trailing ligature component anchor.
            var ligatureCandidates = candidates.filter(function (a) { return a.type === 'ligature'; });
            if (ligatureCandidates.length > 0) {
                return ligatureCandidates.reduce(function (best, current) { var _a, _b; return ((_a = current.componentIndex) !== null && _a !== void 0 ? _a : -1) > ((_b = best.componentIndex) !== null && _b !== void 0 ? _b : -1) ? current : best; });
            }
            return candidates[0];
        };
        var isMarkGlyph = function (gid) { var _a, _b, _c; return ((_c = (_b = (_a = _this.gdef) === null || _a === void 0 ? void 0 : _a.getGlyphClass) === null || _b === void 0 ? void 0 : _b.call(_a, gid)) !== null && _c !== void 0 ? _c : 0) === 3; };
        var _loop_1 = function (i) {
            var gid = glyphIndices[i];
            var anchors = getAnchors(gid);
            var markAnchor = anchors.find(function (a) { return a.type === 'mark'; });
            if (!markAnchor)
                return "continue";
            var attached = false;
            // Prefer mark-to-mark attachment when available.
            var prev = i - 1;
            while (prev >= 0) {
                var prevGid = glyphIndices[prev];
                if (!isMarkGlyph(prevGid)) {
                    prev--;
                    continue;
                }
                var prevAnchors = getAnchors(prevGid);
                var mark2 = prevAnchors.find(function (a) { return a.type === 'mark2' && a.classIndex === markAnchor.classIndex; });
                if (mark2) {
                    // Inherit parent mark placement so stacked marks follow prior attachments.
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
            // Fall back to base/ligature anchor, skipping marks.
            var baseIndex = i - 1;
            while (baseIndex >= 0) {
                var baseGid = glyphIndices[baseIndex];
                if (isMarkGlyph(baseGid)) {
                    baseIndex--;
                    continue;
                }
                var baseAnchors = getAnchors(baseGid);
                var baseAnchor = getBaseAnchor(baseAnchors, markAnchor.classIndex);
                if (baseAnchor) {
                    // Inherit base placement so mark anchors remain stable after prior GPOS shifts.
                    positioned[i].xOffset += ((_z = (_y = positioned[baseIndex]) === null || _y === void 0 ? void 0 : _y.xOffset) !== null && _z !== void 0 ? _z : 0) + (baseAnchor.x - markAnchor.x);
                    positioned[i].yOffset += ((_1 = (_0 = positioned[baseIndex]) === null || _0 === void 0 ? void 0 : _0.yOffset) !== null && _1 !== void 0 ? _1 : 0) + (baseAnchor.y - markAnchor.y);
                    positioned[i].xAdvance = 0;
                    break;
                }
                baseIndex--;
            }
        };
        for (var i = 0; i < glyphIndices.length; i++) {
            _loop_1(i);
        }
        for (var i = 1; i < glyphIndices.length; i++) {
            var prevAnchors = getAnchors(glyphIndices[i - 1]);
            var currAnchors = getAnchors(glyphIndices[i]);
            var exitAnchor = prevAnchors.find(function (a) { return a.type === 'cursive-exit'; });
            var entryAnchor = currAnchors.find(function (a) { return a.type === 'cursive-entry'; });
            if (exitAnchor && entryAnchor) {
                positioned[i].xOffset += exitAnchor.x - entryAnchor.x;
                positioned[i].yOffset += exitAnchor.y - entryAnchor.y;
            }
        }
    };
    // Get a glyph description by index
    FontParserTTF.prototype.getGlyph = function (i) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
        var description = (_a = this.glyf) === null || _a === void 0 ? void 0 : _a.getDescription(i);
        if (description != null) {
            var desc = description;
            var lsb = (_c = (_b = this.hmtx) === null || _b === void 0 ? void 0 : _b.getLeftSideBearing(i)) !== null && _c !== void 0 ? _c : 0;
            var advance = (_e = (_d = this.hmtx) === null || _d === void 0 ? void 0 : _d.getAdvanceWidth(i)) !== null && _e !== void 0 ? _e : 0;
            if (this.gvar && this.variationCoords.length > 0) {
                var basePointCount = description.getPointCount();
                var isComposite_1 = description.isComposite();
                var componentCount = isComposite_1 && description instanceof GlyfCompositeDescript
                    ? description.getComponentCount()
                    : 0;
                var transformSlotCount = 0;
                if (isComposite_1 && description instanceof GlyfCompositeDescript) {
                    for (var _i = 0, _10 = description.components; _i < _10.length; _i++) {
                        var comp = _10[_i];
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
                    var fullDx = deltas.dx;
                    var fullDy = deltas.dy;
                    var dx_1 = [];
                    var dy_1 = [];
                    var compDx_1 = null;
                    var compDy_1 = null;
                    var compXScale_1 = null;
                    var compYScale_1 = null;
                    var compScale01_1 = null;
                    var compScale10_1 = null;
                    if (!isComposite_1) {
                        dx_1 = fullDx.slice(0, basePointCount);
                        dy_1 = fullDy.slice(0, basePointCount);
                        var touched = deltas.touched.slice(0, basePointCount);
                        while (dx_1.length < basePointCount)
                            dx_1.push(0);
                        while (dy_1.length < basePointCount)
                            dy_1.push(0);
                        while (touched.length < basePointCount)
                            touched.push(false);
                        this.applyIupDeltas(base_1, dx_1, dy_1, touched);
                    }
                    else if (base_1 instanceof GlyfCompositeDescript) {
                        compDx_1 = new Array(componentCount).fill(0);
                        compDy_1 = new Array(componentCount).fill(0);
                        compXScale_1 = new Array(componentCount).fill(0);
                        compYScale_1 = new Array(componentCount).fill(0);
                        compScale01_1 = new Array(componentCount).fill(0);
                        compScale10_1 = new Array(componentCount).fill(0);
                        for (var c = 0; c < componentCount; c++) {
                            var rawDx = (_f = fullDx[c]) !== null && _f !== void 0 ? _f : 0;
                            var rawDy = (_g = fullDy[c]) !== null && _g !== void 0 ? _g : 0;
                            compDx_1[c] = rawDx;
                            compDy_1[c] = rawDy;
                        }
                        var tIndex = componentCount;
                        for (var c = 0; c < componentCount; c++) {
                            var comp = base_1.components[c];
                            if (!comp)
                                continue;
                            if (comp.hasTwoByTwo()) {
                                var idx1 = tIndex++;
                                var idx2 = tIndex++;
                                compXScale_1[c] = ((_h = fullDx[idx1]) !== null && _h !== void 0 ? _h : 0) / 0x4000;
                                compScale01_1[c] = ((_j = fullDy[idx1]) !== null && _j !== void 0 ? _j : 0) / 0x4000;
                                compScale10_1[c] = ((_k = fullDx[idx2]) !== null && _k !== void 0 ? _k : 0) / 0x4000;
                                compYScale_1[c] = ((_l = fullDy[idx2]) !== null && _l !== void 0 ? _l : 0) / 0x4000;
                            }
                            else if (comp.hasXYScale()) {
                                var idx = tIndex++;
                                compXScale_1[c] = ((_m = fullDx[idx]) !== null && _m !== void 0 ? _m : 0) / 0x4000;
                                compYScale_1[c] = ((_o = fullDy[idx]) !== null && _o !== void 0 ? _o : 0) / 0x4000;
                            }
                            else if (comp.hasScale()) {
                                var idx = tIndex++;
                                var delta = ((_p = fullDx[idx]) !== null && _p !== void 0 ? _p : 0) / 0x4000;
                                compXScale_1[c] = delta;
                                compYScale_1[c] = delta;
                            }
                        }
                    }
                    var phantomBase = isComposite_1 ? compositePointCount : basePointCount;
                    var lsbDelta = (_q = fullDx[phantomBase]) !== null && _q !== void 0 ? _q : 0;
                    var rsbDelta = (_r = fullDx[phantomBase + 1]) !== null && _r !== void 0 ? _r : 0;
                    lsb += lsbDelta;
                    advance += (rsbDelta - lsbDelta);
                    var minX_1 = Infinity;
                    var maxX_1 = -Infinity;
                    var minY_1 = Infinity;
                    var maxY_1 = -Infinity;
                    for (var p = 0; p < basePointCount; p++) {
                        var compositeBase_1 = (isComposite_1 && base_1 instanceof GlyfCompositeDescript) ? base_1 : null;
                        var comp = compositeBase_1 ? compositeBase_1.getComponentForPointIndex(p) : null;
                        var compIndex = comp && compositeBase_1 ? compositeBase_1.components.indexOf(comp) : -1;
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
                            var ox = compIndex >= 0 && compDx_1 ? (_y = compDx_1[compIndex]) !== null && _y !== void 0 ? _y : 0 : 0;
                            var oy = compIndex >= 0 && compDy_1 ? (_z = compDy_1[compIndex]) !== null && _z !== void 0 ? _z : 0 : 0;
                            x = base_1.getXCoordinate(p) + ((_0 = dx_1[p]) !== null && _0 !== void 0 ? _0 : 0) + ox;
                            y = base_1.getYCoordinate(p) + ((_1 = dy_1[p]) !== null && _1 !== void 0 ? _1 : 0) + oy;
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
                            var _a, _b, _c, _d, _e, _f, _g;
                            var compositeBase = (isComposite_1 && base_1 instanceof GlyfCompositeDescript) ? base_1 : null;
                            var comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            var compIndex = comp && compositeBase ? compositeBase.components.indexOf(comp) : -1;
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
                            var ox = compIndex >= 0 && compDx_1 ? (_f = compDx_1[compIndex]) !== null && _f !== void 0 ? _f : 0 : 0;
                            return base_1.getXCoordinate(p) + ((_g = dx_1[p]) !== null && _g !== void 0 ? _g : 0) + ox;
                        },
                        getYCoordinate: function (p) {
                            var _a, _b, _c, _d, _e, _f, _g;
                            var compositeBase = (isComposite_1 && base_1 instanceof GlyfCompositeDescript) ? base_1 : null;
                            var comp = compositeBase ? compositeBase.getComponentForPointIndex(p) : null;
                            var compIndex = comp && compositeBase ? compositeBase.components.indexOf(comp) : -1;
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
                            var oy = compIndex >= 0 && compDy_1 ? (_f = compDy_1[compIndex]) !== null && _f !== void 0 ? _f : 0 : 0;
                            return base_1.getYCoordinate(p) + ((_g = dy_1[p]) !== null && _g !== void 0 ? _g : 0) + oy;
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
                return new GlyphData(cff2Desc, (_3 = (_2 = this.hmtx) === null || _2 === void 0 ? void 0 : _2.getLeftSideBearing(i)) !== null && _3 !== void 0 ? _3 : 0, (_5 = (_4 = this.hmtx) === null || _4 === void 0 ? void 0 : _4.getAdvanceWidth(i)) !== null && _5 !== void 0 ? _5 : 0, { isCubic: true, includePhantoms: false });
            }
        }
        if (this.cff) {
            var cffDesc = this.cff.getGlyphDescription(i);
            if (cffDesc) {
                return new GlyphData(cffDesc, (_7 = (_6 = this.hmtx) === null || _6 === void 0 ? void 0 : _6.getLeftSideBearing(i)) !== null && _7 !== void 0 ? _7 : 0, (_9 = (_8 = this.hmtx) === null || _8 === void 0 ? void 0 : _8.getAdvanceWidth(i)) !== null && _9 !== void 0 ? _9 : 0, { isCubic: true, includePhantoms: false });
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
    FontParserTTF.prototype.getGlyphPointsByChar = function (char, options) {
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
    FontParserTTF.prototype.measureText = function (text, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var layout = this.layoutString(text, options);
        var letterSpacing = (_a = options.letterSpacing) !== null && _a !== void 0 ? _a : 0;
        var advanceWidth = 0;
        for (var i = 0; i < layout.length; i++) {
            advanceWidth += layout[i].xAdvance;
            if (letterSpacing !== 0 && i < layout.length - 1)
                advanceWidth += letterSpacing;
        }
        return { advanceWidth: advanceWidth, glyphCount: layout.length };
    };
    FontParserTTF.prototype.layoutToPoints = function (text, options) {
        var _a, _b, _c, _d, _e;
        if (options === void 0) { options = {}; }
        var layout = this.layoutString(text, options);
        var sampleStep = Math.max(1, Math.floor((_a = options.sampleStep) !== null && _a !== void 0 ? _a : 1));
        var fontSize = (_b = options.fontSize) !== null && _b !== void 0 ? _b : this.getUnitsPerEm();
        var scale = fontSize / this.getUnitsPerEm();
        var originX = (_c = options.x) !== null && _c !== void 0 ? _c : 0;
        var originY = (_d = options.y) !== null && _d !== void 0 ? _d : 0;
        var letterSpacing = (_e = options.letterSpacing) !== null && _e !== void 0 ? _e : 0;
        var points = [];
        var penX = 0;
        for (var i = 0; i < layout.length; i++) {
            var item = layout[i];
            var glyph = this.getGlyph(item.glyphIndex);
            if (glyph) {
                for (var pIndex = 0; pIndex < glyph.getPointCount(); pIndex += sampleStep) {
                    var p = glyph.getPoint(pIndex);
                    if (!p)
                        continue;
                    points.push({
                        x: originX + (penX + item.xOffset + p.x) * scale,
                        y: originY - (item.yOffset + p.y) * scale,
                        onCurve: p.onCurve,
                        endOfContour: p.endOfContour,
                        glyphIndex: item.glyphIndex,
                        pointIndex: pIndex
                    });
                }
            }
            penX += item.xAdvance;
            if (letterSpacing !== 0 && i < layout.length - 1)
                penX += letterSpacing;
        }
        return { points: points, advanceWidth: penX, scale: scale };
    };
    FontParserTTF.prototype.getColorLayersForGlyph = function (glyphId, paletteIndex) {
        var _a, _b;
        if (paletteIndex === void 0) { paletteIndex = 0; }
        if (!this.colr)
            return [];
        var layers = this.colr.getLayersForGlyph(glyphId);
        if (layers.length === 0)
            return [];
        var palette = (_b = (_a = this.cpal) === null || _a === void 0 ? void 0 : _a.getPalette(paletteIndex)) !== null && _b !== void 0 ? _b : [];
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
    FontParserTTF.prototype.getColorLayersForChar = function (char, paletteIndex) {
        if (paletteIndex === void 0) { paletteIndex = 0; }
        var glyphId = this.getGlyphIndexByChar(char);
        if (glyphId == null)
            return [];
        return this.getColorLayersForGlyph(glyphId, paletteIndex);
    };
    FontParserTTF.prototype.getColrV1LayersForGlyph = function (glyphId, paletteIndex) {
        if (paletteIndex === void 0) { paletteIndex = 0; }
        if (!this.colr || this.colr.version === 0)
            return [];
        var paint = this.colr.getPaintForGlyph(glyphId);
        if (!paint)
            return [];
        return this.flattenColrV1Paint(paint, paletteIndex);
    };
    FontParserTTF.prototype.flattenColrV1Paint = function (paint, paletteIndex) {
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
                var color = (_b = (_a = this.cpal) === null || _a === void 0 ? void 0 : _a.getPalette(paletteIndex)) === null || _b === void 0 ? void 0 : _b[child.paletteIndex];
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
    FontParserTTF.prototype.getMarkAnchorsForGlyph = function (glyphId, subtables) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        if (!this.gpos)
            return [];
        var anchors = [];
        var activeSubtables = subtables !== null && subtables !== void 0 ? subtables : (function () {
            var _a, _b, _c, _d;
            var lookups = (_d = (_c = (_b = (_a = _this.gpos) === null || _a === void 0 ? void 0 : _a.lookupList) === null || _b === void 0 ? void 0 : _b.getLookups) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : [];
            var all = [];
            for (var _i = 0, lookups_2 = lookups; _i < lookups_2.length; _i++) {
                var lookup = lookups_2[_i];
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
        var _loop_2 = function (end) {
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
            _loop_2(end);
        }
    };
    FontParserTTF.prototype.interpolate = function (aCoord, bCoord, aDelta, bDelta, pCoord) {
        if (aCoord === bCoord)
            return aDelta;
        var t = (pCoord - aCoord) / (bCoord - aCoord);
        var clamped = Math.max(0, Math.min(1, t));
        return aDelta + (bDelta - aDelta) * clamped;
    };
    FontParserTTF.prototype.getNameRecord = function (nameId) {
        var _a, _b;
        return (_b = (_a = this.pName) === null || _a === void 0 ? void 0 : _a.getRecord(nameId)) !== null && _b !== void 0 ? _b : "";
    };
    FontParserTTF.prototype.getAllNameRecords = function () {
        if (!this.pName)
            return [];
        return this.pName.records.map(function (r) { return ({ nameId: r.nameId, record: r.record }); });
    };
    FontParserTTF.prototype.getAllNameRecordsDetailed = function () {
        if (!this.pName)
            return [];
        return this.pName.records.map(function (r) { return ({
            nameId: r.nameId,
            record: r.record,
            platformId: r.platformId,
            encodingId: r.encodingId,
            languageId: r.languageId
        }); });
    };
    FontParserTTF.prototype.getFontNames = function () {
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
    FontParserTTF.prototype.getOs2Metrics = function () {
        if (!this.os2)
            return null;
        return {
            version: this.os2.version,
            weightClass: this.os2.usWeightClass,
            widthClass: this.os2.usWidthClass,
            fsType: this.os2.fsType,
            fsSelection: this.os2.fsSelection,
            typoAscender: this.os2.sTypoAscender,
            typoDescender: this.os2.sTypoDescender,
            typoLineGap: this.os2.sTypoLineGap,
            winAscent: this.os2.usWinAscent,
            winDescent: this.os2.usWinDescent,
            firstCharIndex: this.os2.usFirstCharIndex,
            lastCharIndex: this.os2.usLastCharIndex,
            vendorId: this.decodeOs2VendorId(this.os2.achVendorID),
            unicodeRanges: [
                this.os2.ulUnicodeRange1,
                this.os2.ulUnicodeRange2,
                this.os2.ulUnicodeRange3,
                this.os2.ulUnicodeRange4
            ],
            codePageRanges: [
                this.os2.ulCodePageRange1,
                this.os2.ulCodePageRange2
            ],
            xHeight: this.os2.version >= 2 ? this.os2.sxHeight : null,
            capHeight: this.os2.version >= 2 ? this.os2.sCapHeight : null,
            defaultChar: this.os2.version >= 2 ? this.os2.usDefaultChar : null,
            breakChar: this.os2.version >= 2 ? this.os2.usBreakChar : null,
            maxContext: this.os2.version >= 2 ? this.os2.usMaxContext : null,
            lowerOpticalPointSize: this.os2.version >= 5 ? this.os2.usLowerOpticalPointSize : null,
            upperOpticalPointSize: this.os2.version >= 5 ? this.os2.usUpperOpticalPointSize : null,
            panose: this.os2.panose
                ? {
                    familyType: this.os2.panose.bFamilyType,
                    serifStyle: this.os2.panose.bSerifStyle,
                    weight: this.os2.panose.bWeight,
                    proportion: this.os2.panose.bProportion,
                    contrast: this.os2.panose.bContrast,
                    strokeVariation: this.os2.panose.bStrokeVariation,
                    armStyle: this.os2.panose.bArmStyle,
                    letterform: this.os2.panose.bLetterform,
                    midline: this.os2.panose.bMidline,
                    xHeight: this.os2.panose.bXHeight
                }
                : null
        };
    };
    FontParserTTF.prototype.getPostMetrics = function () {
        if (!this.post)
            return null;
        return {
            version: this.post.version / 65536,
            italicAngle: this.post.italicAngle / 65536,
            underlinePosition: this.post.underlinePosition,
            underlineThickness: this.post.underlineThickness,
            isFixedPitch: this.post.isFixedPitch !== 0,
            rawIsFixedPitch: this.post.isFixedPitch
        };
    };
    FontParserTTF.prototype.getWeightClass = function () {
        var _a, _b;
        return (_b = (_a = this.os2) === null || _a === void 0 ? void 0 : _a.usWeightClass) !== null && _b !== void 0 ? _b : 0;
    };
    FontParserTTF.prototype.getWidthClass = function () {
        var _a, _b;
        return (_b = (_a = this.os2) === null || _a === void 0 ? void 0 : _a.usWidthClass) !== null && _b !== void 0 ? _b : 0;
    };
    FontParserTTF.prototype.getFsTypeFlags = function () {
        var _a, _b;
        var fsType = (_b = (_a = this.os2) === null || _a === void 0 ? void 0 : _a.fsType) !== null && _b !== void 0 ? _b : 0;
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
    FontParserTTF.prototype.getFsSelectionFlags = function () {
        var _a, _b;
        var fsSelection = (_b = (_a = this.os2) === null || _a === void 0 ? void 0 : _a.fsSelection) !== null && _b !== void 0 ? _b : 0;
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
    FontParserTTF.prototype.isItalic = function () {
        var _a, _b, _c, _d;
        var fsSelection = (_b = (_a = this.os2) === null || _a === void 0 ? void 0 : _a.fsSelection) !== null && _b !== void 0 ? _b : 0;
        if (fsSelection & 0x0001)
            return true;
        if (fsSelection & 0x0200)
            return true;
        if (((_d = (_c = this.post) === null || _c === void 0 ? void 0 : _c.italicAngle) !== null && _d !== void 0 ? _d : 0) !== 0)
            return true;
        var subfamily = this.getPreferredNameRecord(2).toLowerCase();
        return subfamily.includes('italic') || subfamily.includes('oblique');
    };
    FontParserTTF.prototype.isBold = function () {
        var _a, _b, _c, _d;
        var fsSelection = (_b = (_a = this.os2) === null || _a === void 0 ? void 0 : _a.fsSelection) !== null && _b !== void 0 ? _b : 0;
        if (fsSelection & 0x0020)
            return true;
        if (((_d = (_c = this.os2) === null || _c === void 0 ? void 0 : _c.usWeightClass) !== null && _d !== void 0 ? _d : 0) >= 700)
            return true;
        return this.getPreferredNameRecord(2).toLowerCase().includes('bold');
    };
    FontParserTTF.prototype.isMonospace = function () {
        var _a, _b;
        return ((_b = (_a = this.post) === null || _a === void 0 ? void 0 : _a.isFixedPitch) !== null && _b !== void 0 ? _b : 0) !== 0;
    };
    FontParserTTF.prototype.getMetadata = function () {
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
    FontParserTTF.prototype.getPreferredNameRecord = function (nameId) {
        if (!this.pName || this.pName.records.length === 0)
            return '';
        var candidates = this.pName.records.filter(function (r) { return r.nameId === nameId && !!r.record && r.record.trim().length > 0; });
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
                s += 30; // English (US)
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
    FontParserTTF.prototype.decodeOs2VendorId = function (vendor) {
        var n = vendor >>> 0;
        var text = String.fromCharCode((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff);
        return text.replace(/\0/g, '').trim();
    };
    FontParserTTF.prototype.getTableByType = function (tableType) {
        return this.getTable(tableType);
    };
    FontParserTTF.prototype.getNameInfo = function () {
        return {
            family: this.getNameRecord(1),
            subfamily: this.getNameRecord(2),
            fullName: this.getNameRecord(4),
            postScriptName: this.getNameRecord(6),
            version: this.getNameRecord(5),
            manufacturer: this.getNameRecord(8),
            designer: this.getNameRecord(9),
            description: this.getNameRecord(10),
            typoFamily: this.getNameRecord(16),
            typoSubfamily: this.getNameRecord(17)
        };
    };
    FontParserTTF.prototype.getOs2Info = function () {
        if (!this.os2)
            return null;
        var vendorId = String.fromCharCode((this.os2.achVendorID >> 24) & 0xff, (this.os2.achVendorID >> 16) & 0xff, (this.os2.achVendorID >> 8) & 0xff, this.os2.achVendorID & 0xff).replace(/\0/g, '');
        return {
            weightClass: this.os2.usWeightClass,
            widthClass: this.os2.usWidthClass,
            typoAscender: this.os2.sTypoAscender,
            typoDescender: this.os2.sTypoDescender,
            typoLineGap: this.os2.sTypoLineGap,
            winAscent: this.os2.usWinAscent,
            winDescent: this.os2.usWinDescent,
            unicodeRanges: [this.os2.ulUnicodeRange1, this.os2.ulUnicodeRange2, this.os2.ulUnicodeRange3, this.os2.ulUnicodeRange4],
            codePageRanges: [this.os2.ulCodePageRange1, this.os2.ulCodePageRange2],
            vendorId: vendorId,
            fsSelection: this.os2.fsSelection
        };
    };
    FontParserTTF.prototype.getPostInfo = function () {
        if (!this.post)
            return null;
        return {
            italicAngle: this.post.italicAngle / 65536,
            underlinePosition: this.post.underlinePosition,
            underlineThickness: this.post.underlineThickness,
            isFixedPitch: this.post.isFixedPitch
        };
    };
    // Return a table by type
    FontParserTTF.prototype.getTable = function (tableType) {
        return this.tables.find(function (tab) { return (tab === null || tab === void 0 ? void 0 : tab.getType()) === tableType; }) || null;
    };
    FontParserTTF.prototype.getBestCmapFormatFor = function (codePoint) {
        if (!this.cmap)
            return null;
        var prefersUcs4 = codePoint > 0xffff;
        var preferred = prefersUcs4
            ? [
                { platformId: 3, encodingId: 10 }, // Windows, UCS-4
                { platformId: 0, encodingId: 4 }, // Unicode, UCS-4
                { platformId: 3, encodingId: 1 }, // Windows, Unicode BMP
                { platformId: 0, encodingId: 3 }, // Unicode, BMP
                { platformId: 0, encodingId: 1 }, // Unicode, 1.1
                { platformId: 1, encodingId: 0 }, // Macintosh, Roman
            ]
            : [
                { platformId: 3, encodingId: 1 }, // Windows, Unicode BMP
                { platformId: 0, encodingId: 3 }, // Unicode, BMP
                { platformId: 0, encodingId: 1 }, // Unicode, 1.1
                { platformId: 3, encodingId: 10 }, // Windows, UCS-4
                { platformId: 0, encodingId: 4 }, // Unicode, UCS-4
                { platformId: 1, encodingId: 0 }, // Macintosh, Roman
            ];
        for (var _i = 0, preferred_1 = preferred; _i < preferred_1.length; _i++) {
            var pref = preferred_1[_i];
            var formats = this.cmap.getCmapFormats(pref.platformId, pref.encodingId);
            if (formats.length > 0) {
                return this.pickBestFormat(formats);
            }
        }
        return this.cmap.formats.length > 0 ? this.pickBestFormat(this.cmap.formats) : null;
    };
    FontParserTTF.prototype.pickBestFormat = function (formats) {
        if (formats.length === 0)
            return null;
        var order = [4, 12, 10, 8, 6, 2, 0];
        var _loop_3 = function (fmt) {
            var found = formats.find(function (f) { return (typeof f.getFormatType === "function" ? f.getFormatType() : f.format) === fmt; });
            if (found)
                return { value: found };
        };
        for (var _i = 0, order_1 = order; _i < order_1.length; _i++) {
            var fmt = order_1[_i];
            var state_1 = _loop_3(fmt);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return formats[0];
    };
    return FontParserTTF;
}());
export { FontParserTTF };

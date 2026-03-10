import { clearDiagnostics as clearParserDiagnostics, emitDiagnostic as emitParserDiagnostic, getBestCmapFormatFor as selectBestCmapFormatFor, getDiagnostics as getParserDiagnostics, pickBestCmapFormat } from './ParserShared.js';
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
        for (var _i = 0, lookups_1 = lookups; _i < lookups_1.length; _i++) {
            var lookup = lookups_1[_i];
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
    return BaseFontParser;
}());
export { BaseFontParser };

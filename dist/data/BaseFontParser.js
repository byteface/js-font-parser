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
    return BaseFontParser;
}());
export { BaseFontParser };

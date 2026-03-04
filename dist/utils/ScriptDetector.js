var SCRIPT_FEATURES = {
    arab: ['ccmp', 'locl', 'init', 'medi', 'fina', 'isol', 'rlig', 'liga', 'calt'],
    deva: ['ccmp', 'locl', 'rlig', 'liga', 'calt'],
    hebr: ['ccmp', 'locl', 'rlig', 'liga'],
    thai: ['ccmp', 'locl', 'liga'],
    grek: ['ccmp', 'locl', 'liga', 'calt'],
    cyrl: ['ccmp', 'locl', 'liga', 'calt'],
    latn: ['ccmp', 'locl', 'liga', 'calt']
};
export function detectScriptTags(text) {
    var _a;
    var scripts = new Set();
    for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
        var ch = text_1[_i];
        var cp = (_a = ch.codePointAt(0)) !== null && _a !== void 0 ? _a : 0;
        if (cp >= 0x0600 && cp <= 0x06FF)
            scripts.add('arab');
        else if (cp >= 0x0750 && cp <= 0x077F)
            scripts.add('arab');
        else if (cp >= 0x08A0 && cp <= 0x08FF)
            scripts.add('arab');
        else if (cp >= 0x0900 && cp <= 0x097F)
            scripts.add('deva');
        else if (cp >= 0x0590 && cp <= 0x05FF)
            scripts.add('hebr');
        else if (cp >= 0x0E00 && cp <= 0x0E7F)
            scripts.add('thai');
        else if (cp >= 0x0370 && cp <= 0x03FF)
            scripts.add('grek');
        else if (cp >= 0x0400 && cp <= 0x04FF)
            scripts.add('cyrl');
        else if ((cp >= 0x0041 && cp <= 0x007A) || (cp >= 0x00C0 && cp <= 0x024F))
            scripts.add('latn');
    }
    if (scripts.size === 0)
        scripts.add('DFLT');
    var ordered = Array.from(scripts);
    var features = ordered
        .flatMap(function (tag) { var _a; return (_a = SCRIPT_FEATURES[tag]) !== null && _a !== void 0 ? _a : []; })
        .filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    return { scripts: ordered.length ? ordered : ['DFLT'], features: features.length ? features : ['liga'] };
}

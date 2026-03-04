export type ScriptDetection = {
    scripts: string[];
    features: string[];
};

const SCRIPT_FEATURES: Record<string, string[]> = {
    arab: ['ccmp', 'locl', 'init', 'medi', 'fina', 'isol', 'rlig', 'liga', 'calt'],
    deva: ['ccmp', 'locl', 'rlig', 'liga', 'calt'],
    hebr: ['ccmp', 'locl', 'rlig', 'liga'],
    thai: ['ccmp', 'locl', 'liga'],
    grek: ['ccmp', 'locl', 'liga', 'calt'],
    cyrl: ['ccmp', 'locl', 'liga', 'calt'],
    latn: ['ccmp', 'locl', 'liga', 'calt']
};

export function detectScriptTags(text: string): ScriptDetection {
    const scripts = new Set<string>();
    for (const ch of text) {
        const cp = ch.codePointAt(0) ?? 0;
        if (cp >= 0x0600 && cp <= 0x06FF) scripts.add('arab');
        else if (cp >= 0x0750 && cp <= 0x077F) scripts.add('arab');
        else if (cp >= 0x08A0 && cp <= 0x08FF) scripts.add('arab');
        else if (cp >= 0x0900 && cp <= 0x097F) scripts.add('deva');
        else if (cp >= 0x0590 && cp <= 0x05FF) scripts.add('hebr');
        else if (cp >= 0x0E00 && cp <= 0x0E7F) scripts.add('thai');
        else if (cp >= 0x0370 && cp <= 0x03FF) scripts.add('grek');
        else if (cp >= 0x0400 && cp <= 0x04FF) scripts.add('cyrl');
        else if ((cp >= 0x0041 && cp <= 0x007A) || (cp >= 0x00C0 && cp <= 0x024F)) scripts.add('latn');
    }
    if (scripts.size === 0) scripts.add('DFLT');

    const ordered = Array.from(scripts);
    const features = ordered
        .flatMap(tag => SCRIPT_FEATURES[tag] ?? [])
        .filter((v, i, arr) => arr.indexOf(v) === i);

    return { scripts: ordered.length ? ordered : ['DFLT'], features: features.length ? features : ['liga'] };
}

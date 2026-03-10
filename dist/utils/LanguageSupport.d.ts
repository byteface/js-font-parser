export type LanguageDefinition = {
    code: string;
    name: string;
    required: string;
    optional?: string;
    notes?: string;
};
export type LanguageCheckResult = {
    code: string;
    name: string;
    supported: boolean;
    missing: string[];
    coverage: number;
    notes?: string;
};
export declare function supportsLanguage(font: {
    getGlyphIndexByChar: (ch: string) => number | null;
}, code: string): LanguageCheckResult | null;
export declare function getSupportedLanguages(font: {
    getGlyphIndexByChar: (ch: string) => number | null;
}): LanguageCheckResult[];
export declare function listLanguages(): LanguageDefinition[];

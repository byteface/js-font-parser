export type ScriptDetection = {
    scripts: string[];
    features: string[];
};
export declare function detectScriptTags(text: string): ScriptDetection;

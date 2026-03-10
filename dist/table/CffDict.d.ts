export type CffDictValue = number | number[];
export declare class CffDict {
    values: Map<string, CffDictValue>;
    getNumber(key: string, fallback?: number): number;
    getArray(key: string): number[] | null;
    static parse(bytes: Uint8Array): CffDict;
    private static readNumber;
}

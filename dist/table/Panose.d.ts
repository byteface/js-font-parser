export declare class Panose {
    bFamilyType: number;
    bSerifStyle: number;
    bWeight: number;
    bProportion: number;
    bContrast: number;
    bStrokeVariation: number;
    bArmStyle: number;
    bLetterform: number;
    bMidline: number;
    bXHeight: number;
    constructor(panose: number[]);
    toString(): string;
}

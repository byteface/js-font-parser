export interface ISingleSubst {
    getFormat(): number;
    substitute(glyphId: number): number;
}

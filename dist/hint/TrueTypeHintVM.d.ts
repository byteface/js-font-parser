import { GlyphData } from '../data/GlyphData.js';
export type HintingMode = 'none' | 'vm-experimental';
export type HintingOptions = {
    enabled?: boolean;
    mode?: HintingMode;
    ppem?: number;
};
export type HintVmRunResult = {
    executed: boolean;
    opCount: number;
    unsupportedOpcodeCount: number;
};
/**
 * Experimental TrueType hint VM scaffold.
 * Executes a practical opcode subset with real point/CVT effects.
 */
export declare class TrueTypeHintVM {
    runPrograms(glyph: GlyphData, programs: Array<number[] | null | undefined>, options?: {
        cvtValues?: number[];
        ppem?: number;
    }): HintVmRunResult;
    private executeProgram;
    private toSigned16;
    private pop;
    private findEndf;
    private seekElseOrEif;
    private seekEif;
    private getPointAxis;
    private getPointAxisOriginal;
    private axisFromVector;
    private pushVector;
    private getReferenceDelta;
    private movePointAlongFreedom;
    private roundByMode;
    private getCvt;
    private setCvt;
    private getStorage;
    private setStorage;
    private clampIp;
    private moveRelativePoint;
    private normalizeZone;
    private getZonePoint;
    private setPointOnCurve;
    private flipPointOnCurve;
    private getZoneOriginalPoint;
    private markTouched;
    private getTouchedAxis;
    private getOriginalPoints;
    private getZonePoints;
    private shiftContourByDelta;
    private shiftZoneByDelta;
    private applyIup;
    private collectContours;
    private interpolateIupDelta;
    private getAxis;
    private setAxis;
    private clearTouchedPoint;
    private applyDeltaPair;
    private decodeDeltaArg;
    private interpolatePointByRefs;
    private roundSuper;
    private safePositive;
}

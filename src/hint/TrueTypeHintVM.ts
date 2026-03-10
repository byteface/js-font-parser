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

type Axis = 'x' | 'y';
type RoundMode = 'grid' | 'half' | 'double' | 'off' | 'up' | 'down' | 'super';
type ZoneId = 0 | 1;

type HintVmState = {
    stack: number[];
    opCount: number;
    unsupportedOpcodeCount: number;
    cvt: number[];
    storage: number[];
    points: Array<{ x: number; y: number }>;
    originalPoints: Array<{ x: number; y: number }>;
    twilightPoints: Array<{ x: number; y: number }>;
    twilightOriginalPoints: Array<{ x: number; y: number }>;
    touchedX: boolean[];
    touchedY: boolean[];
    twilightTouchedX: boolean[];
    twilightTouchedY: boolean[];
    freedomAxis: Axis;
    projectionAxis: Axis;
    roundMode: RoundMode;
    roundPeriod: number;
    roundPhase: number;
    roundThreshold: number;
    minDistance: number;
    cvtCutIn: number;
    singleWidthCutIn: number;
    singleWidthValue: number;
    ppem: number;
    autoFlip: boolean;
    loop: number;
    rp0: number;
    rp1: number;
    rp2: number;
    rp0Zone: ZoneId;
    rp1Zone: ZoneId;
    rp2Zone: ZoneId;
    zp0: ZoneId;
    zp1: ZoneId;
    zp2: ZoneId;
    functions: Map<number, number[]>;
    callDepth: number;
    deltaBase: number;
    deltaShift: number;
};

const MAX_CALL_DEPTH = 8;
const MAX_LOOP_COUNT = 1024;

/**
 * Experimental TrueType hint VM scaffold.
 * Executes a practical opcode subset with real point/CVT effects.
 */
export class TrueTypeHintVM {
    runPrograms(
        glyph: GlyphData,
        programs: Array<number[] | null | undefined>,
        options: { cvtValues?: number[]; ppem?: number } = {}
    ): HintVmRunResult {
        const state: HintVmState = {
            stack: [],
            opCount: 0,
            unsupportedOpcodeCount: 0,
            cvt: Array.isArray(options.cvtValues) ? options.cvtValues.slice() : [],
            storage: [],
            points: Array.isArray(glyph.points) ? glyph.points : [],
            originalPoints: Array.isArray(glyph.points) ? glyph.points.map((p) => ({ x: p.x, y: p.y })) : [],
            twilightPoints: [],
            twilightOriginalPoints: [],
            touchedX: [],
            touchedY: [],
            twilightTouchedX: [],
            twilightTouchedY: [],
            freedomAxis: 'x',
            projectionAxis: 'x',
            roundMode: 'grid',
            roundPeriod: 1,
            roundPhase: 0,
            roundThreshold: 0.5,
            minDistance: 1,
            cvtCutIn: 1e9,
            singleWidthCutIn: 0,
            singleWidthValue: 0,
            ppem: Number.isFinite(options.ppem) ? Math.max(1, Math.round(options.ppem as number)) : 16,
            autoFlip: true,
            loop: 1,
            rp0: 0,
            rp1: 0,
            rp2: 0,
            rp0Zone: 1,
            rp1Zone: 1,
            rp2Zone: 1,
            zp0: 1,
            zp1: 1,
            zp2: 1,
            functions: new Map(),
            callDepth: 0,
            deltaBase: 9,
            deltaShift: 3
        };

        let executed = false;
        for (const program of programs) {
            if (!Array.isArray(program) || program.length === 0) continue;
            executed = true;
            this.executeProgram(program, state);
        }

        return {
            executed,
            opCount: state.opCount,
            unsupportedOpcodeCount: state.unsupportedOpcodeCount
        };
    }

    private executeProgram(program: number[], state: HintVmState): void {
        let ip = 0;
        while (ip < program.length) {
            const opcode = (program[ip] ?? 0) & 0xff;
            state.opCount++;

            if (opcode === 0x40) {
                const count = (program[ip + 1] ?? 0) & 0xff;
                for (let i = 0; i < count; i++) state.stack.push((program[ip + 2 + i] ?? 0) & 0xff);
                ip += 2 + count;
                continue;
            }

            if (opcode === 0x41) {
                const count = (program[ip + 1] ?? 0) & 0xff;
                for (let i = 0; i < count; i++) {
                    const hi = (program[ip + 2 + (i * 2)] ?? 0) & 0xff;
                    const lo = (program[ip + 3 + (i * 2)] ?? 0) & 0xff;
                    state.stack.push(this.toSigned16((hi << 8) | lo));
                }
                ip += 2 + (count * 2);
                continue;
            }

            if (opcode >= 0xb0 && opcode <= 0xb7) {
                const count = (opcode - 0xb0) + 1;
                for (let i = 0; i < count; i++) state.stack.push((program[ip + 1 + i] ?? 0) & 0xff);
                ip += 1 + count;
                continue;
            }

            if (opcode >= 0xb8 && opcode <= 0xbf) {
                const count = (opcode - 0xb8) + 1;
                for (let i = 0; i < count; i++) {
                    const hi = (program[ip + 1 + (i * 2)] ?? 0) & 0xff;
                    const lo = (program[ip + 2 + (i * 2)] ?? 0) & 0xff;
                    state.stack.push(this.toSigned16((hi << 8) | lo));
                }
                ip += 1 + (count * 2);
                continue;
            }

            if (opcode === 0x2c) {
                const fnId = this.pop(state);
                const end = this.findEndf(program, ip + 1);
                if (end >= 0) {
                    const body = program.slice(ip + 1, end);
                    state.functions.set(fnId, body);
                    ip = end + 1;
                    continue;
                }
                state.unsupportedOpcodeCount++;
                ip += 1;
                continue;
            }

            if (opcode === 0x2b) {
                const fnId = this.pop(state);
                const fn = state.functions.get(fnId);
                if (fn && state.callDepth < MAX_CALL_DEPTH) {
                    state.callDepth++;
                    this.executeProgram(fn, state);
                    state.callDepth--;
                }
                ip += 1;
                continue;
            }

            if (opcode === 0x2a) {
                const count = Math.max(0, Math.min(this.pop(state), MAX_LOOP_COUNT));
                const fnId = this.pop(state);
                const fn = state.functions.get(fnId);
                if (fn && state.callDepth < MAX_CALL_DEPTH) {
                    state.callDepth++;
                    for (let i = 0; i < count; i++) this.executeProgram(fn, state);
                    state.callDepth--;
                }
                ip += 1;
                continue;
            }
            if (opcode === 0x2d) {
                // ENDF outside FDEF body is harmless.
                ip += 1;
                continue;
            }

            if (opcode === 0x58) {
                const cond = this.pop(state);
                if (cond === 0) {
                    ip = this.seekElseOrEif(program, ip + 1);
                    continue;
                }
                ip += 1;
                continue;
            }

            if (opcode === 0x1b) {
                ip = this.seekEif(program, ip + 1);
                continue;
            }

            if (opcode === 0x59) {
                ip += 1;
                continue;
            }

            if (opcode === 0x1c) {
                const delta = this.pop(state);
                ip = this.clampIp(ip + 1 + delta, program.length);
                continue;
            }
            if (opcode === 0x78 || opcode === 0x79) {
                const delta = this.pop(state);
                const cond = this.pop(state);
                const jump = (opcode === 0x78 && cond !== 0) || (opcode === 0x79 && cond === 0);
                if (jump) {
                    ip = this.clampIp(ip + 1 + delta, program.length);
                    continue;
                }
                ip += 1;
                continue;
            }

            if (opcode === 0x20) {
                state.stack.push(state.stack.length > 0 ? state.stack[state.stack.length - 1] : 0);
                ip += 1;
                continue;
            }
            if (opcode === 0x21) {
                if (state.stack.length > 0) state.stack.pop();
                ip += 1;
                continue;
            }
            if (opcode === 0x22) {
                state.stack.length = 0;
                ip += 1;
                continue;
            }
            if (opcode === 0x23) {
                if (state.stack.length >= 2) {
                    const a = state.stack[state.stack.length - 1];
                    const b = state.stack[state.stack.length - 2];
                    state.stack[state.stack.length - 1] = b;
                    state.stack[state.stack.length - 2] = a;
                }
                ip += 1;
                continue;
            }
            if (opcode === 0x24) {
                state.stack.push(state.stack.length);
                ip += 1;
                continue;
            }
            if (opcode === 0x25) {
                const k = Math.max(1, this.pop(state));
                const idx = state.stack.length - k;
                state.stack.push(idx >= 0 ? (state.stack[idx] ?? 0) : 0);
                ip += 1;
                continue;
            }
            if (opcode === 0x26) {
                const k = Math.max(1, this.pop(state));
                const idx = state.stack.length - k;
                if (idx >= 0) {
                    const v = state.stack.splice(idx, 1)[0] ?? 0;
                    state.stack.push(v);
                } else {
                    state.stack.push(0);
                }
                ip += 1;
                continue;
            }
            if (opcode === 0x27) {
                const p2 = this.pop(state);
                const p1 = this.pop(state);
                const a = this.getPointAxis(state, state.zp1, p1, state.projectionAxis);
                const b = this.getPointAxis(state, state.zp0, p2, state.projectionAxis);
                const target = (a + b) * 0.5;
                this.movePointAlongFreedom(state, state.zp1, p1, target - a);
                this.movePointAlongFreedom(state, state.zp0, p2, target - b);
                ip += 1;
                continue;
            }

            if (opcode >= 0x50 && opcode <= 0x55) {
                const b = this.pop(state);
                const a = this.pop(state);
                let out = 0;
                if (opcode === 0x50) out = a < b ? 1 : 0;
                if (opcode === 0x51) out = a <= b ? 1 : 0;
                if (opcode === 0x52) out = a > b ? 1 : 0;
                if (opcode === 0x53) out = a >= b ? 1 : 0;
                if (opcode === 0x54) out = a === b ? 1 : 0;
                if (opcode === 0x55) out = a !== b ? 1 : 0;
                state.stack.push(out);
                ip += 1;
                continue;
            }
            if (opcode === 0x56 || opcode === 0x57) {
                const value = this.pop(state);
                const rounded = Math.floor(this.roundByMode(value, state.roundMode, state));
                const isEven = Math.abs(rounded % 2) === 0;
                state.stack.push(opcode === 0x57 ? (isEven ? 1 : 0) : (isEven ? 0 : 1));
                ip += 1;
                continue;
            }
            if (opcode === 0x5a || opcode === 0x5b) {
                const b = this.pop(state);
                const a = this.pop(state);
                state.stack.push(opcode === 0x5a ? ((a !== 0 && b !== 0) ? 1 : 0) : ((a !== 0 || b !== 0) ? 1 : 0));
                ip += 1;
                continue;
            }
            if (opcode === 0x5c) {
                const a = this.pop(state);
                state.stack.push(a === 0 ? 1 : 0);
                ip += 1;
                continue;
            }

            if (opcode >= 0x60 && opcode <= 0x67) {
                let out = 0;
                if (opcode >= 0x60 && opcode <= 0x63) {
                    const b = this.pop(state);
                    const a = this.pop(state);
                    if (opcode === 0x60) out = a + b;
                    if (opcode === 0x61) out = a - b;
                    if (opcode === 0x62) out = b === 0 ? 0 : (a / b);
                    if (opcode === 0x63) out = a * b;
                } else {
                    const a = this.pop(state);
                    if (opcode === 0x64) out = Math.abs(a);
                    if (opcode === 0x65) out = -a;
                    if (opcode === 0x66) out = Math.floor(a);
                    if (opcode === 0x67) out = Math.ceil(a);
                }
                state.stack.push(Number.isFinite(out) ? out : 0);
                ip += 1;
                continue;
            }
            if (opcode === 0x8a) {
                if (state.stack.length >= 3) {
                    const c = state.stack.pop() ?? 0;
                    const b = state.stack.pop() ?? 0;
                    const a = state.stack.pop() ?? 0;
                    state.stack.push(c, a, b);
                }
                ip += 1;
                continue;
            }
            if (opcode === 0x8b || opcode === 0x8c) {
                const b = this.pop(state);
                const a = this.pop(state);
                const out = opcode === 0x8b ? Math.max(a, b) : Math.min(a, b);
                state.stack.push(Number.isFinite(out) ? out : 0);
                ip += 1;
                continue;
            }
            if (opcode >= 0x68 && opcode <= 0x6b) {
                const value = this.pop(state);
                state.stack.push(this.roundByMode(value, state.roundMode, state));
                ip += 1;
                continue;
            }
            if (opcode >= 0x6c && opcode <= 0x6f) {
                const value = this.pop(state);
                state.stack.push(Number.isFinite(value) ? value : 0);
                ip += 1;
                continue;
            }

            if (opcode === 0x00 || opcode === 0x02 || opcode === 0x04) {
                state.projectionAxis = 'y';
                if (opcode === 0x00) state.freedomAxis = 'y';
                if (opcode === 0x04) state.freedomAxis = 'y';
                ip += 1;
                continue;
            }
            if (opcode === 0x01 || opcode === 0x03 || opcode === 0x05) {
                state.projectionAxis = 'x';
                if (opcode === 0x01) state.freedomAxis = 'x';
                if (opcode === 0x05) state.freedomAxis = 'x';
                ip += 1;
                continue;
            }
            if (opcode === 0x06 || opcode === 0x07 || opcode === 0x08 || opcode === 0x09) {
                const p2 = this.pop(state);
                const p1 = this.pop(state);
                const x1 = this.getPointAxis(state, state.zp1, p1, 'x');
                const y1 = this.getPointAxis(state, state.zp1, p1, 'y');
                const x2 = this.getPointAxis(state, state.zp2, p2, 'x');
                const y2 = this.getPointAxis(state, state.zp2, p2, 'y');
                const dx = x2 - x1;
                const dy = y2 - y1;
                let axis: Axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
                if (opcode === 0x08 || opcode === 0x09) axis = axis === 'x' ? 'y' : 'x';
                if (opcode === 0x06 || opcode === 0x08) state.projectionAxis = axis;
                if (opcode === 0x07 || opcode === 0x09) state.freedomAxis = axis;
                ip += 1;
                continue;
            }
            if (opcode === 0x0a || opcode === 0x0b) {
                const y = this.pop(state);
                const x = this.pop(state);
                const axis = this.axisFromVector(x, y);
                if (opcode === 0x0a) state.projectionAxis = axis;
                else state.freedomAxis = axis;
                ip += 1;
                continue;
            }
            if (opcode === 0x0c) {
                this.pushVector(state, state.freedomAxis);
                ip += 1;
                continue;
            }
            if (opcode === 0x0d) {
                this.pushVector(state, state.projectionAxis);
                ip += 1;
                continue;
            }
            if (opcode === 0x0e) {
                state.freedomAxis = state.projectionAxis;
                ip += 1;
                continue;
            }

            if (opcode === 0x17) {
                state.loop = Math.max(1, Math.min(this.pop(state), MAX_LOOP_COUNT));
                ip += 1;
                continue;
            }
            if (opcode === 0x1a) {
                const v = this.pop(state);
                state.minDistance = Number.isFinite(v) ? Math.max(0, Math.abs(v)) : state.minDistance;
                ip += 1;
                continue;
            }
            if (opcode === 0x1d) {
                const v = this.pop(state);
                state.cvtCutIn = Number.isFinite(v) ? Math.max(0, Math.abs(v)) : state.cvtCutIn;
                ip += 1;
                continue;
            }
            if (opcode === 0x1e) {
                const v = this.pop(state);
                state.singleWidthCutIn = Number.isFinite(v) ? Math.max(0, Math.abs(v)) : state.singleWidthCutIn;
                ip += 1;
                continue;
            }
            if (opcode === 0x1f) {
                const v = this.pop(state);
                state.singleWidthValue = Number.isFinite(v) ? v : state.singleWidthValue;
                ip += 1;
                continue;
            }

            if (opcode === 0x10) {
                state.rp0 = this.pop(state);
                state.rp0Zone = state.zp0;
                ip += 1;
                continue;
            }
            if (opcode === 0x11) {
                state.rp1 = this.pop(state);
                state.rp1Zone = state.zp0;
                ip += 1;
                continue;
            }
            if (opcode === 0x12) {
                state.rp2 = this.pop(state);
                state.rp2Zone = state.zp0;
                ip += 1;
                continue;
            }

            if (opcode === 0x13) {
                state.zp0 = this.normalizeZone(this.pop(state));
                ip += 1;
                continue;
            }
            if (opcode === 0x14) {
                state.zp1 = this.normalizeZone(this.pop(state));
                ip += 1;
                continue;
            }
            if (opcode === 0x15) {
                state.zp2 = this.normalizeZone(this.pop(state));
                ip += 1;
                continue;
            }
            if (opcode === 0x16) {
                const z = this.normalizeZone(this.pop(state));
                state.zp0 = z;
                state.zp1 = z;
                state.zp2 = z;
                ip += 1;
                continue;
            }

            if (opcode === 0x18) {
                state.roundMode = 'grid';
                ip += 1;
                continue;
            }
            if (opcode === 0x19) {
                state.roundMode = 'half';
                ip += 1;
                continue;
            }
            if (opcode === 0x3d) {
                state.roundMode = 'double';
                state.roundPeriod = 0.5;
                state.roundPhase = 0;
                state.roundThreshold = 0.25;
                ip += 1;
                continue;
            }
            if (opcode === 0x7a) {
                state.roundMode = 'off';
                ip += 1;
                continue;
            }
            if (opcode === 0x7c) {
                state.roundMode = 'up';
                ip += 1;
                continue;
            }
            if (opcode === 0x7d) {
                state.roundMode = 'down';
                ip += 1;
                continue;
            }
            if (opcode === 0x76 || opcode === 0x77) {
                const selector = this.pop(state) & 0xff;
                const periodBits = selector & 0x03;
                const phaseBits = (selector >> 2) & 0x03;
                const thresholdBits = (selector >> 4) & 0x0f;
                const basePeriod = periodBits === 0 ? 0.5 : periodBits === 1 ? 1 : periodBits === 2 ? 2 : 1;
                state.roundPeriod = basePeriod;
                state.roundPhase = (phaseBits / 4) * basePeriod;
                state.roundThreshold = thresholdBits === 0 ? 0.5 : Math.min(0.96875, thresholdBits / 16);
                state.roundMode = 'super';
                ip += 1;
                continue;
            }

            if (opcode === 0x45) {
                const cvtIndex = this.pop(state);
                state.stack.push(this.getCvt(state, cvtIndex));
                ip += 1;
                continue;
            }
            if (opcode === 0x46 || opcode === 0x47) {
                const pointIndex = this.pop(state);
                const value = opcode === 0x47
                    ? this.getPointAxisOriginal(state, state.zp2, pointIndex, state.projectionAxis)
                    : this.getPointAxis(state, state.zp2, pointIndex, state.projectionAxis);
                state.stack.push(value);
                ip += 1;
                continue;
            }
            if (opcode === 0x49 || opcode === 0x4a) {
                const p2 = this.pop(state);
                const p1 = this.pop(state);
                const useOriginal = opcode === 0x4a;
                const a = useOriginal
                    ? this.getPointAxisOriginal(state, state.zp0, p1, state.projectionAxis)
                    : this.getPointAxis(state, state.zp0, p1, state.projectionAxis);
                const b = useOriginal
                    ? this.getPointAxisOriginal(state, state.zp1, p2, state.projectionAxis)
                    : this.getPointAxis(state, state.zp1, p2, state.projectionAxis);
                const d = b - a;
                state.stack.push(Number.isFinite(d) ? d : 0);
                ip += 1;
                continue;
            }
            if (opcode === 0x4b || opcode === 0x4c) {
                state.stack.push(state.ppem);
                ip += 1;
                continue;
            }
            if (opcode === 0x4d) {
                state.autoFlip = true;
                ip += 1;
                continue;
            }
            if (opcode === 0x4e) {
                state.autoFlip = false;
                ip += 1;
                continue;
            }
            if (opcode === 0x48) {
                const value = this.pop(state);
                const pointIndex = this.pop(state);
                const current = this.getPointAxis(state, state.zp2, pointIndex, state.projectionAxis);
                this.movePointAlongFreedom(state, state.zp2, pointIndex, value - current);
                ip += 1;
                continue;
            }

            if (opcode === 0x44 || opcode === 0x70) {
                const value = this.pop(state);
                const cvtIndex = this.pop(state);
                this.setCvt(state, cvtIndex, value);
                ip += 1;
                continue;
            }
            if (opcode === 0x42) {
                const value = this.pop(state);
                const storageIndex = this.pop(state);
                this.setStorage(state, storageIndex, value);
                ip += 1;
                continue;
            }
            if (opcode === 0x43) {
                const storageIndex = this.pop(state);
                state.stack.push(this.getStorage(state, storageIndex));
                ip += 1;
                continue;
            }
            if (opcode === 0x88) {
                this.pop(state);
                state.stack.push(0);
                ip += 1;
                continue;
            }
            if (opcode === 0x4f) {
                // DEBUG has no VM-side geometry effect here.
                ip += 1;
                continue;
            }
            if (opcode === 0x85 || opcode === 0x8d) {
                // SCANCTRL / SCANTYPE: raster-scan controls (no geometry effect in this VM)
                this.pop(state);
                ip += 1;
                continue;
            }
            if (opcode === 0x8e || opcode === 0x87) {
                // INSTCTRL and related execution controls: consume args, no geometry effect.
                this.pop(state);
                this.pop(state);
                ip += 1;
                continue;
            }
            if (opcode === 0x80) {
                const loop = Math.max(1, Math.min(state.loop, MAX_LOOP_COUNT));
                for (let i = 0; i < loop; i++) {
                    const pointIndex = this.pop(state);
                    this.flipPointOnCurve(state, state.zp0, pointIndex);
                }
                state.loop = 1;
                ip += 1;
                continue;
            }
            if (opcode === 0x81 || opcode === 0x82) {
                const end = this.pop(state);
                const start = this.pop(state);
                const onCurve = opcode === 0x81;
                const lo = Math.min(start, end);
                const hi = Math.max(start, end);
                for (let p = lo; p <= hi; p++) {
                    this.setPointOnCurve(state, state.zp0, p, onCurve);
                }
                ip += 1;
                continue;
            }
            if (opcode === 0x5e || opcode === 0x5f) {
                const value = this.pop(state);
                if (opcode === 0x5e) {
                    state.deltaBase = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : state.deltaBase;
                } else {
                    state.deltaShift = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : state.deltaShift;
                }
                ip += 1;
                continue;
            }
            if (opcode === 0x5d || opcode === 0x71 || opcode === 0x72 || opcode === 0x73 || opcode === 0x74 || opcode === 0x75) {
                const pairCount = Math.max(0, this.pop(state));
                const pairs: Array<{ target: number; arg: number }> = [];
                for (let i = 0; i < pairCount; i++) {
                    const arg = this.pop(state);
                    const target = this.pop(state);
                    pairs.push({ target, arg });
                }
                for (const pair of pairs) {
                    this.applyDeltaPair(state, opcode, pair.target, pair.arg);
                }
                ip += 1;
                continue;
            }

            if (opcode === 0x2e || opcode === 0x2f) {
                const pointIndex = this.pop(state);
                const current = this.getPointAxis(state, state.zp0, pointIndex, state.projectionAxis);
                const target = (opcode & 1) === 1 ? this.roundByMode(current, state.roundMode, state) : current;
                this.movePointAlongFreedom(state, state.zp0, pointIndex, target - current);
                state.rp0 = pointIndex;
                state.rp0Zone = state.zp0;
                state.rp1 = pointIndex;
                state.rp1Zone = state.zp0;
                ip += 1;
                continue;
            }

            if (opcode === 0x3e || opcode === 0x3f) {
                const cvtIndex = this.pop(state);
                const pointIndex = this.pop(state);
                const current = this.getPointAxis(state, state.zp0, pointIndex, state.projectionAxis);
                let target = this.getCvt(state, cvtIndex);
                if ((opcode & 1) === 1) target = this.roundByMode(target, state.roundMode, state);
                this.movePointAlongFreedom(state, state.zp0, pointIndex, target - current);
                state.rp0 = pointIndex;
                state.rp0Zone = state.zp0;
                state.rp1 = pointIndex;
                state.rp1Zone = state.zp0;
                ip += 1;
                continue;
            }

            if (opcode === 0x38) {
                const distance = this.pop(state);
                const loop = Math.max(1, Math.min(state.loop, MAX_LOOP_COUNT));
                for (let i = 0; i < loop; i++) {
                    const pointIndex = this.pop(state);
                    this.movePointAlongFreedom(state, state.zp2, pointIndex, distance);
                }
                state.loop = 1;
                ip += 1;
                continue;
            }
            if (opcode === 0x3c) {
                const loop = Math.max(1, Math.min(state.loop, MAX_LOOP_COUNT));
                const ref = this.getPointAxis(state, state.rp0Zone, state.rp0, state.projectionAxis);
                for (let i = 0; i < loop; i++) {
                    const pointIndex = this.pop(state);
                    const current = this.getPointAxis(state, state.zp1, pointIndex, state.projectionAxis);
                    this.movePointAlongFreedom(state, state.zp1, pointIndex, ref - current);
                }
                state.loop = 1;
                ip += 1;
                continue;
            }

            if (opcode === 0x39) {
                const loop = Math.max(1, Math.min(state.loop, MAX_LOOP_COUNT));
                for (let i = 0; i < loop; i++) {
                    const pointIndex = this.pop(state);
                    this.interpolatePointByRefs(state, state.zp2, pointIndex);
                }
                state.loop = 1;
                ip += 1;
                continue;
            }
            if (opcode === 0x32 || opcode === 0x33) {
                const loop = Math.max(1, Math.min(state.loop, MAX_LOOP_COUNT));
                const refIndex = (opcode & 1) === 1 ? state.rp1 : state.rp2;
                const refZone = (opcode & 1) === 1 ? state.rp1Zone : state.rp2Zone;
                const refCurrent = this.getPointAxis(state, refZone, refIndex, state.projectionAxis);
                const refOriginal = this.getPointAxisOriginal(state, refZone, refIndex, state.projectionAxis);
                const delta = refCurrent - refOriginal;
                for (let i = 0; i < loop; i++) {
                    const pointIndex = this.pop(state);
                    this.movePointAlongFreedom(state, state.zp2, pointIndex, delta);
                }
                state.loop = 1;
                ip += 1;
                continue;
            }
            if (opcode === 0x34 || opcode === 0x35) {
                const loop = Math.max(1, Math.min(state.loop, MAX_LOOP_COUNT));
                const refIndex = (opcode & 1) === 1 ? state.rp1 : state.rp2;
                const refZone = (opcode & 1) === 1 ? state.rp1Zone : state.rp2Zone;
                const delta = this.getReferenceDelta(state, refZone, refIndex);
                for (let i = 0; i < loop; i++) {
                    const contourIndex = this.pop(state);
                    this.shiftContourByDelta(state, state.zp2, contourIndex, delta);
                }
                state.loop = 1;
                ip += 1;
                continue;
            }
            if (opcode === 0x36 || opcode === 0x37) {
                const refIndex = (opcode & 1) === 1 ? state.rp1 : state.rp2;
                const refZone = (opcode & 1) === 1 ? state.rp1Zone : state.rp2Zone;
                const zone = this.normalizeZone(this.pop(state));
                const delta = this.getReferenceDelta(state, refZone, refIndex);
                this.shiftZoneByDelta(state, zone, delta);
                ip += 1;
                continue;
            }

            if (opcode === 0x30 || opcode === 0x31) {
                this.applyIup(state, opcode === 0x30 ? 'y' : 'x');
                ip += 1;
                continue;
            }
            if (opcode === 0x29) {
                const pointIndex = this.pop(state);
                this.clearTouchedPoint(state, state.zp0, pointIndex);
                ip += 1;
                continue;
            }

            // MSIRP[0/1]
            if (opcode === 0x3a || opcode === 0x3b) {
                const pointIndex = this.pop(state);
                const distance = this.pop(state);
                const refValue = this.getPointAxis(state, state.rp0Zone, state.rp0, state.projectionAxis);
                const current = this.getPointAxis(state, state.zp1, pointIndex, state.projectionAxis);
                const target = refValue + distance;
                this.movePointAlongFreedom(state, state.zp1, pointIndex, target - current);
                state.rp1 = state.rp0;
                state.rp1Zone = state.rp0Zone;
                state.rp2 = pointIndex;
                state.rp2Zone = state.zp1;
                if ((opcode & 1) === 1) {
                    state.rp0 = pointIndex;
                    state.rp0Zone = state.zp1;
                }
                ip += 1;
                continue;
            }

            // MDRP[0..31]
            if (opcode >= 0xc0 && opcode <= 0xdf) {
                const pointIndex = this.pop(state);
                this.moveRelativePoint(state, pointIndex, null, opcode, state.zp1);
                ip += 1;
                continue;
            }

            // MIRP[0..31]
            if (opcode >= 0xe0 && opcode <= 0xff) {
                const pointIndex = this.pop(state);
                const cvtIndex = this.pop(state);
                this.moveRelativePoint(state, pointIndex, cvtIndex, opcode, state.zp1);
                ip += 1;
                continue;
            }

            state.unsupportedOpcodeCount++;
            ip += 1;
        }
    }

    private toSigned16(value: number): number {
        const v = value & 0xffff;
        return v >= 0x8000 ? v - 0x10000 : v;
    }

    private pop(state: HintVmState): number {
        return state.stack.length > 0 ? (state.stack.pop() ?? 0) : 0;
    }

    private findEndf(program: number[], start: number): number {
        for (let i = start; i < program.length; i++) {
            if (((program[i] ?? 0) & 0xff) === 0x2d) return i;
        }
        return -1;
    }

    private seekElseOrEif(program: number[], start: number): number {
        let depth = 0;
        for (let i = start; i < program.length; i++) {
            const op = (program[i] ?? 0) & 0xff;
            if (op === 0x58) depth++;
            if (op === 0x59) {
                if (depth === 0) return i + 1;
                depth--;
            }
            if (op === 0x1b && depth === 0) return i + 1;
        }
        return program.length;
    }

    private seekEif(program: number[], start: number): number {
        let depth = 0;
        for (let i = start; i < program.length; i++) {
            const op = (program[i] ?? 0) & 0xff;
            if (op === 0x58) depth++;
            if (op === 0x59) {
                if (depth === 0) return i + 1;
                depth--;
            }
        }
        return program.length;
    }

    private getPointAxis(state: HintVmState, zone: ZoneId, pointIndex: number, axis: Axis): number {
        const p = this.getZonePoint(state, zone, pointIndex);
        if (!p) return 0;
        return axis === 'x' ? p.x : p.y;
    }

    private getPointAxisOriginal(state: HintVmState, zone: ZoneId, pointIndex: number, axis: Axis): number {
        const p = this.getZoneOriginalPoint(state, zone, pointIndex);
        if (!p) return 0;
        return axis === 'x' ? p.x : p.y;
    }

    private axisFromVector(x: number, y: number): Axis {
        const ax = Number.isFinite(x) ? Math.abs(x) : 0;
        const ay = Number.isFinite(y) ? Math.abs(y) : 0;
        return ax >= ay ? 'x' : 'y';
    }

    private pushVector(state: HintVmState, axis: Axis): void {
        // 2.14 unit vectors
        if (axis === 'x') {
            state.stack.push(0x4000);
            state.stack.push(0);
            return;
        }
        state.stack.push(0);
        state.stack.push(0x4000);
    }

    private getReferenceDelta(state: HintVmState, zone: ZoneId, pointIndex: number): number {
        const current = this.getPointAxis(state, zone, pointIndex, state.projectionAxis);
        const original = this.getPointAxisOriginal(state, zone, pointIndex, state.projectionAxis);
        return current - original;
    }

    private movePointAlongFreedom(state: HintVmState, zone: ZoneId, pointIndex: number, delta: number): void {
        const p = this.getZonePoint(state, zone, pointIndex);
        if (!p || !Number.isFinite(delta)) return;
        if (state.freedomAxis === 'x') {
            p.x += delta;
            this.markTouched(state, zone, 'x', pointIndex);
        } else {
            p.y += delta;
            this.markTouched(state, zone, 'y', pointIndex);
        }
    }

    private roundByMode(value: number, mode: RoundMode, state: HintVmState): number {
        if (!Number.isFinite(value)) return value;
        if (mode === 'off') return value;
        if (mode === 'up') return Math.ceil(value);
        if (mode === 'down') return Math.floor(value);
        if (mode === 'half') return Math.floor(value) + 0.5;
        if (mode === 'double') return Math.round(value * 2) / 2;
        if (mode === 'super') return this.roundSuper(value, state);
        return Math.round(value);
    }

    private getCvt(state: HintVmState, index: number): number {
        if (index < 0 || index >= state.cvt.length) return 0;
        const v = state.cvt[index];
        return Number.isFinite(v) ? v : 0;
    }

    private setCvt(state: HintVmState, index: number, value: number): void {
        if (!Number.isFinite(index) || index < 0) return;
        const idx = Math.floor(index);
        if (idx >= state.cvt.length) {
            state.cvt.length = idx + 1;
            for (let i = 0; i < state.cvt.length; i++) {
                if (!Number.isFinite(state.cvt[i])) state.cvt[i] = 0;
            }
        }
        state.cvt[idx] = Number.isFinite(value) ? value : 0;
    }

    private getStorage(state: HintVmState, index: number): number {
        if (!Number.isFinite(index) || index < 0) return 0;
        const idx = Math.floor(index);
        const value = state.storage[idx];
        return Number.isFinite(value) ? value : 0;
    }

    private setStorage(state: HintVmState, index: number, value: number): void {
        if (!Number.isFinite(index) || index < 0) return;
        const idx = Math.floor(index);
        if (idx >= state.storage.length) {
            state.storage.length = idx + 1;
            for (let i = 0; i < state.storage.length; i++) {
                if (!Number.isFinite(state.storage[i])) state.storage[i] = 0;
            }
        }
        state.storage[idx] = Number.isFinite(value) ? value : 0;
    }

    private clampIp(value: number, length: number): number {
        if (!Number.isFinite(value)) return length;
        if (value < 0) return 0;
        if (value > length) return length;
        return Math.floor(value);
    }

    private moveRelativePoint(state: HintVmState, pointIndex: number, cvtIndex: number | null, opcode: number, pointZone: ZoneId): void {
        const refValue = this.getPointAxis(state, state.rp0Zone, state.rp0, state.projectionAxis);
        const current = this.getPointAxis(state, pointZone, pointIndex, state.projectionAxis);
        const signedDist = current - refValue;
        const sign = signedDist < 0 ? -1 : 1;
        const roundFlag = (opcode & 0x04) !== 0;
        const minDistFlag = (opcode & 0x08) !== 0;
        const setRp0Flag = (opcode & 0x10) !== 0;

        const originalAbsDistance = Math.abs(signedDist);
        let targetAbsDistance = originalAbsDistance;
        if (cvtIndex != null) {
            const cvtValue = Math.abs(this.getCvt(state, cvtIndex));
            targetAbsDistance = Math.abs(cvtValue - originalAbsDistance) > state.cvtCutIn ? originalAbsDistance : cvtValue;
            if (Math.abs(targetAbsDistance - state.singleWidthValue) < state.singleWidthCutIn) {
                targetAbsDistance = Math.abs(state.singleWidthValue);
            }
        }
        if (roundFlag) targetAbsDistance = Math.abs(this.roundByMode(targetAbsDistance, state.roundMode, state));
        if (minDistFlag) targetAbsDistance = Math.max(state.minDistance, targetAbsDistance);

        const target = refValue + (targetAbsDistance * sign);
        this.movePointAlongFreedom(state, pointZone, pointIndex, target - current);

        state.rp1 = state.rp0;
        state.rp1Zone = state.rp0Zone;
        state.rp2 = pointIndex;
        state.rp2Zone = pointZone;
        if (setRp0Flag) {
            state.rp0 = pointIndex;
            state.rp0Zone = pointZone;
        }
    }

    private normalizeZone(value: number): ZoneId {
        return value === 0 ? 0 : 1;
    }

    private getZonePoint(state: HintVmState, zone: ZoneId, pointIndex: number): { x: number; y: number } | null {
        if (!Number.isFinite(pointIndex) || pointIndex < 0) return null;
        const idx = Math.floor(pointIndex);
        if (zone === 1) {
            return state.points[idx] ?? null;
        }
        while (state.twilightPoints.length <= idx) {
            state.twilightPoints.push({ x: 0, y: 0 });
            state.twilightOriginalPoints.push({ x: 0, y: 0 });
            state.twilightTouchedX.push(false);
            state.twilightTouchedY.push(false);
        }
        return state.twilightPoints[idx] ?? null;
    }

    private setPointOnCurve(state: HintVmState, zone: ZoneId, pointIndex: number, onCurve: boolean): void {
        const p = this.getZonePoint(state, zone, pointIndex) as ({ onCurve?: boolean } & { x: number; y: number }) | null;
        if (!p) return;
        p.onCurve = onCurve;
    }

    private flipPointOnCurve(state: HintVmState, zone: ZoneId, pointIndex: number): void {
        const p = this.getZonePoint(state, zone, pointIndex) as ({ onCurve?: boolean } & { x: number; y: number }) | null;
        if (!p) return;
        p.onCurve = !p.onCurve;
    }

    private getZoneOriginalPoint(state: HintVmState, zone: ZoneId, pointIndex: number): { x: number; y: number } | null {
        if (!Number.isFinite(pointIndex) || pointIndex < 0) return null;
        const idx = Math.floor(pointIndex);
        if (zone === 1) return state.originalPoints[idx] ?? null;
        while (state.twilightOriginalPoints.length <= idx) {
            state.twilightOriginalPoints.push({ x: 0, y: 0 });
            state.twilightPoints.push({ x: 0, y: 0 });
            state.twilightTouchedX.push(false);
            state.twilightTouchedY.push(false);
        }
        return state.twilightOriginalPoints[idx] ?? null;
    }

    private markTouched(state: HintVmState, zone: ZoneId, axis: Axis, pointIndex: number): void {
        if (!Number.isFinite(pointIndex) || pointIndex < 0) return;
        const idx = Math.floor(pointIndex);
        const touched = this.getTouchedAxis(state, zone, axis);
        while (touched.length <= idx) touched.push(false);
        touched[idx] = true;
    }

    private getTouchedAxis(state: HintVmState, zone: ZoneId, axis: Axis): boolean[] {
        if (zone === 0) return axis === 'x' ? state.twilightTouchedX : state.twilightTouchedY;
        return axis === 'x' ? state.touchedX : state.touchedY;
    }

    private getOriginalPoints(state: HintVmState, zone: ZoneId): Array<{ x: number; y: number }> {
        return zone === 0 ? state.twilightOriginalPoints : state.originalPoints;
    }

    private getZonePoints(state: HintVmState, zone: ZoneId): Array<{ x: number; y: number }> {
        return zone === 0 ? state.twilightPoints : state.points;
    }

    private shiftContourByDelta(state: HintVmState, zone: ZoneId, contourIndex: number, delta: number): void {
        if (!Number.isFinite(contourIndex) || contourIndex < 0 || !Number.isFinite(delta) || delta === 0) return;
        const points = this.getZonePoints(state, zone) as Array<{ x: number; y: number; endOfContour?: boolean }>;
        const contours = this.collectContours(points);
        const ci = Math.floor(contourIndex);
        if (ci < 0 || ci >= contours.length) return;
        for (const pointIndex of contours[ci]) {
            this.movePointAlongFreedom(state, zone, pointIndex, delta);
        }
    }

    private shiftZoneByDelta(state: HintVmState, zone: ZoneId, delta: number): void {
        if (!Number.isFinite(delta) || delta === 0) return;
        const points = this.getZonePoints(state, zone);
        for (let i = 0; i < points.length; i++) {
            this.movePointAlongFreedom(state, zone, i, delta);
        }
    }

    private applyIup(state: HintVmState, axis: Axis): void {
        const zone = state.zp2;
        const points = this.getZonePoints(state, zone);
        const original = this.getOriginalPoints(state, zone);
        const touched = this.getTouchedAxis(state, zone, axis);
        if (!Array.isArray(points) || points.length === 0) return;

        const contours = this.collectContours(points);
        for (const contour of contours) {
            if (contour.length === 0) continue;
            const touchedLocal: number[] = [];
            for (let i = 0; i < contour.length; i++) {
                if (touched[contour[i]]) touchedLocal.push(i);
            }
            if (touchedLocal.length === 0) continue;
            if (touchedLocal.length === 1) {
                const ti = contour[touchedLocal[0]];
                const d = this.getAxis(points[ti], axis) - this.getAxis(original[ti], axis);
                for (let i = 0; i < contour.length; i++) {
                    const gi = contour[i];
                    if (touched[gi]) continue;
                    this.setAxis(points[gi], axis, this.getAxis(original[gi], axis) + d);
                }
                continue;
            }

            for (let t = 0; t < touchedLocal.length; t++) {
                const aLocal = touchedLocal[t];
                const bLocal = touchedLocal[(t + 1) % touchedLocal.length];
                const aIndex = contour[aLocal];
                const bIndex = contour[bLocal];
                const oa = this.getAxis(original[aIndex], axis);
                const ob = this.getAxis(original[bIndex], axis);
                const da = this.getAxis(points[aIndex], axis) - oa;
                const db = this.getAxis(points[bIndex], axis) - ob;

                let i = (aLocal + 1) % contour.length;
                while (i !== bLocal) {
                    const gi = contour[i];
                    if (!touched[gi]) {
                        const op = this.getAxis(original[gi], axis);
                        const d = this.interpolateIupDelta(oa, ob, da, db, op);
                        this.setAxis(points[gi], axis, op + d);
                    }
                    i = (i + 1) % contour.length;
                }
            }
        }
    }

    private collectContours(points: Array<{ x: number; y: number; endOfContour?: boolean }>): number[][] {
        const contours: number[][] = [];
        let start = 0;
        for (let i = 0; i < points.length; i++) {
            if ((points[i] as any)?.endOfContour) {
                const contour: number[] = [];
                for (let p = start; p <= i; p++) contour.push(p);
                if (contour.length > 0) contours.push(contour);
                start = i + 1;
            }
        }
        if (start < points.length) {
            const contour: number[] = [];
            for (let p = start; p < points.length; p++) contour.push(p);
            if (contour.length > 0) contours.push(contour);
        }
        return contours;
    }

    private interpolateIupDelta(oa: number, ob: number, da: number, db: number, op: number): number {
        if (!Number.isFinite(oa) || !Number.isFinite(ob) || !Number.isFinite(op)) return 0;
        if (!Number.isFinite(da)) da = 0;
        if (!Number.isFinite(db)) db = 0;
        if (oa === ob) return da;

        const minOrig = Math.min(oa, ob);
        const maxOrig = Math.max(oa, ob);
        if (op <= minOrig) return oa <= ob ? da : db;
        if (op >= maxOrig) return oa <= ob ? db : da;

        const t = (op - oa) / (ob - oa);
        return da + ((db - da) * t);
    }

    private getAxis(point: { x: number; y: number } | undefined, axis: Axis): number {
        if (!point) return 0;
        return axis === 'x' ? point.x : point.y;
    }

    private setAxis(point: { x: number; y: number } | undefined, axis: Axis, value: number): void {
        if (!point || !Number.isFinite(value)) return;
        if (axis === 'x') point.x = value;
        else point.y = value;
    }

    private clearTouchedPoint(state: HintVmState, zone: ZoneId, pointIndex: number): void {
        if (!Number.isFinite(pointIndex) || pointIndex < 0) return;
        const idx = Math.floor(pointIndex);
        const touchedX = this.getTouchedAxis(state, zone, 'x');
        const touchedY = this.getTouchedAxis(state, zone, 'y');
        while (touchedX.length <= idx) touchedX.push(false);
        while (touchedY.length <= idx) touchedY.push(false);
        touchedX[idx] = false;
        touchedY[idx] = false;
    }

    private applyDeltaPair(state: HintVmState, opcode: number, target: number, arg: number): void {
        const decoded = this.decodeDeltaArg(state, opcode, arg);
        if (!decoded || decoded.ppem !== state.ppem) return;

        if (opcode === 0x5d || opcode === 0x71 || opcode === 0x72) {
            this.movePointAlongFreedom(state, state.zp0, target, decoded.delta);
            return;
        }

        const current = this.getCvt(state, target);
        this.setCvt(state, target, current + decoded.delta);
    }

    private decodeDeltaArg(state: HintVmState, opcode: number, arg: number): { ppem: number; delta: number } | null {
        if (!Number.isFinite(arg)) return null;
        const value = Math.floor(arg) & 0xff;
        const upper = (value >> 4) & 0x0f;
        const lower = value & 0x0f;

        let bandOffset = 0;
        if (opcode === 0x71 || opcode === 0x74) bandOffset = 16;
        if (opcode === 0x72 || opcode === 0x75) bandOffset = 32;

        const ppem = state.deltaBase + bandOffset + upper;
        const step = lower - 8;
        const scale = Math.pow(2, state.deltaShift);
        if (!Number.isFinite(scale) || scale <= 0) return null;
        return { ppem, delta: step / scale };
    }

    private interpolatePointByRefs(state: HintVmState, zone: ZoneId, pointIndex: number): void {
        const axis = state.projectionAxis;
        const pCurrent = this.getPointAxis(state, zone, pointIndex, axis);
        const pOriginal = this.getAxis(this.getZoneOriginalPoint(state, zone, pointIndex) ?? undefined, axis);

        const r1Current = this.getPointAxis(state, state.rp1Zone, state.rp1, axis);
        const r2Current = this.getPointAxis(state, state.rp2Zone, state.rp2, axis);
        const r1Original = this.getAxis(this.getZoneOriginalPoint(state, state.rp1Zone, state.rp1) ?? undefined, axis);
        const r2Original = this.getAxis(this.getZoneOriginalPoint(state, state.rp2Zone, state.rp2) ?? undefined, axis);

        let target = pCurrent;
        if (r1Original === r2Original) {
            const midpointDelta = (((r1Current + r2Current) * 0.5) - r1Original);
            target = pOriginal + midpointDelta;
        } else {
            const t = (pOriginal - r1Original) / (r2Original - r1Original);
            target = r1Current + (t * (r2Current - r1Current));
        }

        this.movePointAlongFreedom(state, zone, pointIndex, target - pCurrent);
    }

    private roundSuper(value: number, state: HintVmState): number {
        const period = this.safePositive(state.roundPeriod);
        const phase = Number.isFinite(state.roundPhase) ? state.roundPhase : 0;
        const threshold = Number.isFinite(state.roundThreshold) ? state.roundThreshold : 0.5;
        const shifted = (value - phase) / period;
        const base = Math.floor(shifted);
        const frac = shifted - base;
        const rounded = frac >= threshold ? (base + 1) : base;
        return (rounded * period) + phase;
    }

    private safePositive(value: number): number {
        return Number.isFinite(value) && value > 0 ? value : 1;
    }
}

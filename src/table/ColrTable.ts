import { ByteArray } from '../utils/ByteArray.js';
import { DirectoryEntry } from './DirectoryEntry.js';
import { ITable } from './ITable.js';
import { Table } from './Table.js';

export type ColrLayerRecord = {
    glyphId: number;
    paletteIndex: number;
};

export type ColrBaseGlyphRecord = {
    glyphId: number;
    firstLayerIndex: number;
    numLayers: number;
};

export type ColrBaseGlyphPaintRecord = {
    glyphId: number;
    paintOffset: number;
};

export class ColrTable implements ITable {
    version: number = 0;

    // COLRv0 fields
    baseGlyphRecordsOffset: number = 0;
    layerRecordsOffset: number = 0;
    numBaseGlyphRecords: number = 0;
    numLayerRecords: number = 0;

    // COLRv1 fields
    baseGlyphListOffset: number = 0;
    layerListOffset: number = 0;
    clipListOffset: number = 0;
    varStoreOffset: number = 0;

    baseGlyphRecords: ColrBaseGlyphRecord[] = [];
    layerRecords: ColrLayerRecord[] = [];
    baseGlyphPaintRecords: ColrBaseGlyphPaintRecord[] = [];
    layerPaintOffsets: number[] = [];
    private start: number = 0;
    private view: DataView;
    private baseGlyphListStart: number = 0;
    private layerListStart: number = 0;

    constructor(de: DirectoryEntry, byteArray: ByteArray) {
        const start = de.offset;
        const view = byteArray.dataView;
        this.start = start;
        this.view = view;
        byteArray.seek(start);

        this.version = byteArray.readUnsignedShort();

        if (this.version === 0) {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();

            const baseOffset = start + this.baseGlyphRecordsOffset;
            this.baseGlyphRecords = [];
            for (let i = 0; i < this.numBaseGlyphRecords; i++) {
                const offset = baseOffset + i * 6;
                this.baseGlyphRecords.push({
                    glyphId: view.getUint16(offset, false),
                    firstLayerIndex: view.getUint16(offset + 2, false),
                    numLayers: view.getUint16(offset + 4, false)
                });
            }

            const layerOffset = start + this.layerRecordsOffset;
            this.layerRecords = [];
            for (let i = 0; i < this.numLayerRecords; i++) {
                const offset = layerOffset + i * 4;
                this.layerRecords.push({
                    glyphId: view.getUint16(offset, false),
                    paletteIndex: view.getUint16(offset + 2, false)
                });
            }
        } else {
            this.numBaseGlyphRecords = byteArray.readUnsignedShort();
            this.baseGlyphRecordsOffset = byteArray.readUnsignedInt();
            this.layerRecordsOffset = byteArray.readUnsignedInt();
            this.numLayerRecords = byteArray.readUnsignedShort();
            this.baseGlyphListOffset = byteArray.readUnsignedInt();
            this.layerListOffset = byteArray.readUnsignedInt();
            this.clipListOffset = byteArray.readUnsignedInt();
            this.varStoreOffset = byteArray.readUnsignedInt();

            if (this.baseGlyphRecordsOffset && this.numBaseGlyphRecords) {
                const baseOffset = start + this.baseGlyphRecordsOffset;
                this.baseGlyphRecords = [];
                for (let i = 0; i < this.numBaseGlyphRecords; i++) {
                    const offset = baseOffset + i * 6;
                    this.baseGlyphRecords.push({
                        glyphId: view.getUint16(offset, false),
                        firstLayerIndex: view.getUint16(offset + 2, false),
                        numLayers: view.getUint16(offset + 4, false)
                    });
                }
            }

            if (this.layerRecordsOffset && this.numLayerRecords) {
                const layerOffset = start + this.layerRecordsOffset;
                this.layerRecords = [];
                for (let i = 0; i < this.numLayerRecords; i++) {
                    const offset = layerOffset + i * 4;
                    this.layerRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paletteIndex: view.getUint16(offset + 2, false)
                    });
                }
            }

            if (this.baseGlyphListOffset) {
                const listOffset = start + this.baseGlyphListOffset;
                this.baseGlyphListStart = listOffset;
                const count = view.getUint32(listOffset, false);
                this.baseGlyphPaintRecords = [];
                for (let i = 0; i < count; i++) {
                    const offset = listOffset + 4 + i * 6;
                    this.baseGlyphPaintRecords.push({
                        glyphId: view.getUint16(offset, false),
                        paintOffset: view.getUint32(offset + 2, false)
                    });
                }
            }

            if (this.layerListOffset) {
                const listOffset = start + this.layerListOffset;
                this.layerListStart = listOffset;
                const count = view.getUint32(listOffset, false);
                this.layerPaintOffsets = [];
                for (let i = 0; i < count; i++) {
                    const offset = listOffset + 4 + i * 4;
                    const rel = view.getUint32(offset, false);
                    this.layerPaintOffsets.push(listOffset + rel);
                }
            }
        }
    }

    getLayersForGlyph(glyphId: number): ColrLayerRecord[] {
        if (this.baseGlyphRecords.length === 0 || this.layerRecords.length === 0) return [];
        const record = this.baseGlyphRecords.find(r => r.glyphId === glyphId);
        if (!record) return [];
        const start = record.firstLayerIndex;
        const end = start + record.numLayers;
        return this.layerRecords.slice(start, end);
    }

    getType(): string | number {
        return Table.COLR;
    }

    getPaintForGlyph(glyphId: number): any | null {
        if (!this.baseGlyphPaintRecords.length) return null;
        const record = this.baseGlyphPaintRecords.find(r => r.glyphId === glyphId);
        if (!record) return null;
        const paintAbs = this.baseGlyphListStart + record.paintOffset;
        return this.readPaint(paintAbs, paintAbs, 0);
    }

    readPaint(offset: number, baseOffset: number, depth: number = 0): any | null {
        if (depth > 64) return null;
        if (offset < 0 || offset >= this.view.byteLength) return null;
        const format = this.view.getUint8(offset);
        switch (format) {
            case 1: { // PaintColrLayers
                const numLayers = this.view.getUint8(offset + 1);
                const firstLayerIndex = this.view.getUint32(offset + 2, false);
                const layers: any[] = [];
                for (let i = 0; i < numLayers; i++) {
                    const paintOffset = this.layerPaintOffsets[firstLayerIndex + i];
                    if (paintOffset == null) continue;
                    const paint = this.readPaint(paintOffset, paintOffset, depth + 1);
                    if (paint) layers.push(paint);
                }
                return { format, layers };
            }
            case 2: { // PaintSolid
                const paletteIndex = this.view.getUint16(offset + 1, false);
                const alphaRaw = this.view.getInt16(offset + 3, false);
                const alpha = alphaRaw / 16384;
                return { format, paletteIndex, alpha };
            }
            case 3: { // PaintVarSolid
                const paletteIndex = this.view.getUint16(offset + 1, false);
                const alphaRaw = this.view.getInt16(offset + 3, false);
                const alpha = alphaRaw / 16384;
                const varIndexBase = this.view.getUint32(offset + 5, false);
                return { format, paletteIndex, alpha, varIndexBase };
            }
            case 4: { // PaintLinearGradient
                const colorLineOffset = this.readOffset24(offset + 1);
                const x0 = this.view.getInt16(offset + 4, false);
                const y0 = this.view.getInt16(offset + 6, false);
                const x1 = this.view.getInt16(offset + 8, false);
                const y1 = this.view.getInt16(offset + 10, false);
                const x2 = this.view.getInt16(offset + 12, false);
                const y2 = this.view.getInt16(offset + 14, false);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format, colorLine, x0, y0, x1, y1, x2, y2 };
            }
            case 5: { // PaintVarLinearGradient
                const colorLineOffset = this.readOffset24(offset + 1);
                const x0 = this.view.getInt16(offset + 4, false);
                const y0 = this.view.getInt16(offset + 6, false);
                const x1 = this.view.getInt16(offset + 8, false);
                const y1 = this.view.getInt16(offset + 10, false);
                const x2 = this.view.getInt16(offset + 12, false);
                const y2 = this.view.getInt16(offset + 14, false);
                const varIndexBase = this.view.getUint32(offset + 16, false);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format, colorLine, x0, y0, x1, y1, x2, y2, varIndexBase };
            }
            case 8: { // PaintRadialGradient
                const colorLineOffset = this.readOffset24(offset + 1);
                const x0 = this.view.getInt16(offset + 4, false);
                const y0 = this.view.getInt16(offset + 6, false);
                const x1 = this.view.getInt16(offset + 8, false);
                const y1 = this.view.getInt16(offset + 10, false);
                const r0 = this.view.getInt16(offset + 12, false);
                const r1 = this.view.getInt16(offset + 14, false);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format, colorLine, x0, y0, x1, y1, r0, r1 };
            }
            case 9: { // PaintVarRadialGradient
                const colorLineOffset = this.readOffset24(offset + 1);
                const x0 = this.view.getInt16(offset + 4, false);
                const y0 = this.view.getInt16(offset + 6, false);
                const x1 = this.view.getInt16(offset + 8, false);
                const y1 = this.view.getInt16(offset + 10, false);
                const r0 = this.view.getInt16(offset + 12, false);
                const r1 = this.view.getInt16(offset + 14, false);
                const varIndexBase = this.view.getUint32(offset + 16, false);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format, colorLine, x0, y0, x1, y1, r0, r1, varIndexBase };
            }
            case 6: { // PaintSweepGradient
                const colorLineOffset = this.readOffset24(offset + 1);
                const centerX = this.view.getInt16(offset + 4, false);
                const centerY = this.view.getInt16(offset + 6, false);
                const startAngle = this.readF2Dot14(offset + 8);
                const endAngle = this.readF2Dot14(offset + 10);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format, colorLine, centerX, centerY, startAngle, endAngle };
            }
            case 7: { // PaintVarSweepGradient
                const colorLineOffset = this.readOffset24(offset + 1);
                const centerX = this.view.getInt16(offset + 4, false);
                const centerY = this.view.getInt16(offset + 6, false);
                const startAngle = this.readF2Dot14(offset + 8);
                const endAngle = this.readF2Dot14(offset + 10);
                const varIndexBase = this.view.getUint32(offset + 12, false);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return { format, colorLine, centerX, centerY, startAngle, endAngle, varIndexBase };
            }
            case 10: { // PaintGlyph
                const paintOffset = this.readOffset24(offset + 1);
                const glyphID = this.view.getUint16(offset + 4, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, glyphID, paint };
            }
            case 11: { // PaintColrGlyph
                const glyphID = this.view.getUint16(offset + 1, false);
                return { format, glyphID };
            }
            case 12: { // PaintTransform
                const paintOffset = this.readOffset24(offset + 1);
                const transformOffset = this.readOffset24(offset + 4);
                const transform = this.readAffine2x3(baseOffset + transformOffset);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, transform };
            }
            case 13: { // PaintVarTransform
                const paintOffset = this.readOffset24(offset + 1);
                const transformOffset = this.readOffset24(offset + 4);
                const varIndexBase = this.view.getUint32(offset + 7, false);
                const transform = this.readAffine2x3(baseOffset + transformOffset);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, transform, varIndexBase };
            }
            case 14: { // PaintTranslate
                const paintOffset = this.readOffset24(offset + 1);
                const dx = this.view.getInt16(offset + 4, false);
                const dy = this.view.getInt16(offset + 6, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, dx, dy };
            }
            case 15: { // PaintVarTranslate
                const paintOffset = this.readOffset24(offset + 1);
                const dx = this.view.getInt16(offset + 4, false);
                const dy = this.view.getInt16(offset + 6, false);
                const varIndexBase = this.view.getUint32(offset + 8, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, dx, dy, varIndexBase };
            }
            case 16: { // PaintScale
                const paintOffset = this.readOffset24(offset + 1);
                const scaleX = this.readF2Dot14(offset + 4);
                const scaleY = this.readF2Dot14(offset + 6);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scaleX, scaleY };
            }
            case 17: { // PaintVarScale
                const paintOffset = this.readOffset24(offset + 1);
                const scaleX = this.readF2Dot14(offset + 4);
                const scaleY = this.readF2Dot14(offset + 6);
                const varIndexBase = this.view.getUint32(offset + 8, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scaleX, scaleY, varIndexBase };
            }
            case 18: { // PaintScaleAroundCenter
                const paintOffset = this.readOffset24(offset + 1);
                const scaleX = this.readF2Dot14(offset + 4);
                const scaleY = this.readF2Dot14(offset + 6);
                const centerX = this.view.getInt16(offset + 8, false);
                const centerY = this.view.getInt16(offset + 10, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scaleX, scaleY, centerX, centerY };
            }
            case 19: { // PaintVarScaleAroundCenter
                const paintOffset = this.readOffset24(offset + 1);
                const scaleX = this.readF2Dot14(offset + 4);
                const scaleY = this.readF2Dot14(offset + 6);
                const centerX = this.view.getInt16(offset + 8, false);
                const centerY = this.view.getInt16(offset + 10, false);
                const varIndexBase = this.view.getUint32(offset + 12, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scaleX, scaleY, centerX, centerY, varIndexBase };
            }
            case 22: { // PaintScaleUniformAroundCenter
                const paintOffset = this.readOffset24(offset + 1);
                const scale = this.readF2Dot14(offset + 4);
                const centerX = this.view.getInt16(offset + 6, false);
                const centerY = this.view.getInt16(offset + 8, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scale, centerX, centerY };
            }
            case 20: { // PaintScaleUniform
                const paintOffset = this.readOffset24(offset + 1);
                const scale = this.readF2Dot14(offset + 4);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scale };
            }
            case 21: { // PaintVarScaleUniform
                const paintOffset = this.readOffset24(offset + 1);
                const scale = this.readF2Dot14(offset + 4);
                const varIndexBase = this.view.getUint32(offset + 6, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scale, varIndexBase };
            }
            case 23: { // PaintVarScaleUniformAroundCenter
                const paintOffset = this.readOffset24(offset + 1);
                const scale = this.readF2Dot14(offset + 4);
                const centerX = this.view.getInt16(offset + 6, false);
                const centerY = this.view.getInt16(offset + 8, false);
                const varIndexBase = this.view.getUint32(offset + 10, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scale, centerX, centerY, varIndexBase };
            }
            case 24: { // PaintRotate
                const paintOffset = this.readOffset24(offset + 1);
                const angle = this.readF2Dot14(offset + 4);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, angle };
            }
            case 25: { // PaintVarRotate
                const paintOffset = this.readOffset24(offset + 1);
                const angle = this.readF2Dot14(offset + 4);
                const varIndexBase = this.view.getUint32(offset + 6, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, angle, varIndexBase };
            }
            case 26: { // PaintRotateAroundCenter
                const paintOffset = this.readOffset24(offset + 1);
                const angle = this.readF2Dot14(offset + 4);
                const centerX = this.view.getInt16(offset + 6, false);
                const centerY = this.view.getInt16(offset + 8, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, angle, centerX, centerY };
            }
            case 27: { // PaintVarRotateAroundCenter
                const paintOffset = this.readOffset24(offset + 1);
                const angle = this.readF2Dot14(offset + 4);
                const centerX = this.view.getInt16(offset + 6, false);
                const centerY = this.view.getInt16(offset + 8, false);
                const varIndexBase = this.view.getUint32(offset + 10, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, angle, centerX, centerY, varIndexBase };
            }
            case 30: { // PaintSkew
                const paintOffset = this.readOffset24(offset + 1);
                const xSkew = this.readF2Dot14(offset + 4);
                const ySkew = this.readF2Dot14(offset + 6);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, xSkew, ySkew };
            }
            case 29: { // PaintVarSkew
                const paintOffset = this.readOffset24(offset + 1);
                const xSkew = this.readF2Dot14(offset + 4);
                const ySkew = this.readF2Dot14(offset + 6);
                const varIndexBase = this.view.getUint32(offset + 8, false);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, xSkew, ySkew, varIndexBase };
            }
            case 32: { // PaintComposite
                const sourceOffset = this.readOffset24(offset + 1);
                const backdropOffset = this.readOffset24(offset + 4);
                const compositeMode = this.view.getUint8(offset + 7);
                const sourcePaint = this.readPaint(baseOffset + sourceOffset, baseOffset + sourceOffset, depth + 1);
                const backdropPaint = this.readPaint(baseOffset + backdropOffset, baseOffset + backdropOffset, depth + 1);
                return { format, sourcePaint, backdropPaint, compositeMode };
            }
            case 31: { // PaintVarComposite
                const sourceOffset = this.readOffset24(offset + 1);
                const backdropOffset = this.readOffset24(offset + 4);
                const compositeMode = this.view.getUint8(offset + 7);
                const varIndexBase = this.view.getUint32(offset + 8, false);
                const sourcePaint = this.readPaint(baseOffset + sourceOffset, baseOffset + sourceOffset, depth + 1);
                const backdropPaint = this.readPaint(baseOffset + backdropOffset, baseOffset + backdropOffset, depth + 1);
                return { format, sourcePaint, backdropPaint, compositeMode, varIndexBase };
            }
            default:
                return { format };
        }
    }

    private readOffset24(offset: number): number {
        return (this.view.getUint8(offset) << 16) | (this.view.getUint8(offset + 1) << 8) | this.view.getUint8(offset + 2);
    }

    private readFixed16_16(offset: number): number {
        const raw = this.view.getInt32(offset, false);
        return raw / 65536;
    }

    private readF2Dot14(offset: number): number {
        const raw = this.view.getInt16(offset, false);
        return raw / 16384;
    }

    private readAffine2x3(offset: number): { xx: number; yx: number; xy: number; yy: number; dx: number; dy: number } {
        return {
            xx: this.readFixed16_16(offset),
            yx: this.readFixed16_16(offset + 4),
            xy: this.readFixed16_16(offset + 8),
            yy: this.readFixed16_16(offset + 12),
            dx: this.readFixed16_16(offset + 16),
            dy: this.readFixed16_16(offset + 20)
        };
    }

    private readColorLine(offset: number): { extend: number; stops: Array<{ stopOffset: number; paletteIndex: number; alpha: number }> } {
        const extend = this.view.getUint8(offset);
        const numStops = this.view.getUint16(offset + 1, false);
        const stops: Array<{ stopOffset: number; paletteIndex: number; alpha: number }> = [];
        let cursor = offset + 3;
        for (let i = 0; i < numStops; i++) {
            const stopOffset = this.readF2Dot14(cursor);
            const paletteIndex = this.view.getUint16(cursor + 2, false);
            const alpha = this.readF2Dot14(cursor + 4);
            stops.push({ stopOffset, paletteIndex, alpha });
            cursor += 6;
        }
        return { extend, stops };
    }
}

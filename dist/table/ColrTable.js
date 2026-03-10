import { Table } from './Table.js';
export class ColrTable {
    version = 0;
    // COLRv0 fields
    baseGlyphRecordsOffset = 0;
    layerRecordsOffset = 0;
    numBaseGlyphRecords = 0;
    numLayerRecords = 0;
    // COLRv1 fields
    baseGlyphListOffset = 0;
    layerListOffset = 0;
    clipListOffset = 0;
    varStoreOffset = 0;
    baseGlyphRecords = [];
    layerRecords = [];
    baseGlyphPaintRecords = [];
    layerPaintOffsets = [];
    start = 0;
    view;
    baseGlyphListStart = 0;
    layerListStart = 0;
    variationCoords = [];
    varStore = null;
    clipBoxes = new Map();
    constructor(de, byteArray) {
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
        }
        else {
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
            if (this.clipListOffset) {
                this.readClipList(byteArray, start + this.clipListOffset);
            }
            if (this.varStoreOffset) {
                this.readVariationStore(byteArray, start + this.varStoreOffset);
            }
        }
    }
    getLayersForGlyph(glyphId) {
        if (this.baseGlyphRecords.length === 0 || this.layerRecords.length === 0)
            return [];
        const record = this.baseGlyphRecords.find(r => r.glyphId === glyphId);
        if (!record)
            return [];
        const start = record.firstLayerIndex;
        const end = start + record.numLayers;
        return this.layerRecords.slice(start, end);
    }
    getType() {
        return Table.COLR;
    }
    setVariationCoords(coords) {
        this.variationCoords = coords.slice();
    }
    getClipForGlyph(glyphId) {
        return this.clipBoxes.get(glyphId) ?? null;
    }
    getPaintForGlyph(glyphId) {
        if (!this.baseGlyphPaintRecords.length)
            return null;
        const record = this.baseGlyphPaintRecords.find(r => r.glyphId === glyphId);
        if (!record)
            return null;
        const paintAbs = this.baseGlyphListStart + record.paintOffset;
        return this.readPaint(paintAbs, paintAbs, 0);
    }
    readPaint(offset, baseOffset, depth = 0) {
        if (depth > 64)
            return null;
        if (offset < 0 || offset >= this.view.byteLength)
            return null;
        const format = this.view.getUint8(offset);
        switch (format) {
            case 1: { // PaintColrLayers
                const numLayers = this.view.getUint8(offset + 1);
                const firstLayerIndex = this.view.getUint32(offset + 2, false);
                const layers = [];
                for (let i = 0; i < numLayers; i++) {
                    const paintOffset = this.layerPaintOffsets[firstLayerIndex + i];
                    if (paintOffset == null)
                        continue;
                    const paint = this.readPaint(paintOffset, paintOffset, depth + 1);
                    if (paint)
                        layers.push(paint);
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
                const deltas = this.getVarDeltas(varIndexBase, 1);
                return { format, paletteIndex, alpha: alpha + (deltas[0] ?? 0), varIndexBase };
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
                const deltas = this.getVarDeltas(varIndexBase, 6);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return {
                    format,
                    colorLine,
                    x0: x0 + (deltas[0] ?? 0),
                    y0: y0 + (deltas[1] ?? 0),
                    x1: x1 + (deltas[2] ?? 0),
                    y1: y1 + (deltas[3] ?? 0),
                    x2: x2 + (deltas[4] ?? 0),
                    y2: y2 + (deltas[5] ?? 0),
                    varIndexBase
                };
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
                const deltas = this.getVarDeltas(varIndexBase, 6);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return {
                    format,
                    colorLine,
                    x0: x0 + (deltas[0] ?? 0),
                    y0: y0 + (deltas[1] ?? 0),
                    x1: x1 + (deltas[2] ?? 0),
                    y1: y1 + (deltas[3] ?? 0),
                    r0: r0 + (deltas[4] ?? 0),
                    r1: r1 + (deltas[5] ?? 0),
                    varIndexBase
                };
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
                const deltas = this.getVarDeltas(varIndexBase, 4);
                const colorLine = this.readColorLine(baseOffset + colorLineOffset);
                return {
                    format,
                    colorLine,
                    centerX: centerX + (deltas[0] ?? 0),
                    centerY: centerY + (deltas[1] ?? 0),
                    startAngle: startAngle + (deltas[2] ?? 0),
                    endAngle: endAngle + (deltas[3] ?? 0),
                    varIndexBase
                };
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
                const deltas = this.getVarDeltas(varIndexBase, 6);
                const adjusted = {
                    xx: transform.xx + (deltas[0] ?? 0),
                    yx: transform.yx + (deltas[1] ?? 0),
                    xy: transform.xy + (deltas[2] ?? 0),
                    yy: transform.yy + (deltas[3] ?? 0),
                    dx: transform.dx + (deltas[4] ?? 0),
                    dy: transform.dy + (deltas[5] ?? 0)
                };
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, transform: adjusted, varIndexBase };
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
                const deltas = this.getVarDeltas(varIndexBase, 2);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, dx: dx + (deltas[0] ?? 0), dy: dy + (deltas[1] ?? 0), varIndexBase };
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
                const deltas = this.getVarDeltas(varIndexBase, 2);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scaleX: scaleX + (deltas[0] ?? 0), scaleY: scaleY + (deltas[1] ?? 0), varIndexBase };
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
                const deltas = this.getVarDeltas(varIndexBase, 4);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return {
                    format,
                    paint,
                    scaleX: scaleX + (deltas[0] ?? 0),
                    scaleY: scaleY + (deltas[1] ?? 0),
                    centerX: centerX + (deltas[2] ?? 0),
                    centerY: centerY + (deltas[3] ?? 0),
                    varIndexBase
                };
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
                const deltas = this.getVarDeltas(varIndexBase, 1);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, scale: scale + (deltas[0] ?? 0), varIndexBase };
            }
            case 23: { // PaintVarScaleUniformAroundCenter
                const paintOffset = this.readOffset24(offset + 1);
                const scale = this.readF2Dot14(offset + 4);
                const centerX = this.view.getInt16(offset + 6, false);
                const centerY = this.view.getInt16(offset + 8, false);
                const varIndexBase = this.view.getUint32(offset + 10, false);
                const deltas = this.getVarDeltas(varIndexBase, 3);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return {
                    format,
                    paint,
                    scale: scale + (deltas[0] ?? 0),
                    centerX: centerX + (deltas[1] ?? 0),
                    centerY: centerY + (deltas[2] ?? 0),
                    varIndexBase
                };
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
                const deltas = this.getVarDeltas(varIndexBase, 1);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, angle: angle + (deltas[0] ?? 0), varIndexBase };
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
                const deltas = this.getVarDeltas(varIndexBase, 3);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return {
                    format,
                    paint,
                    angle: angle + (deltas[0] ?? 0),
                    centerX: centerX + (deltas[1] ?? 0),
                    centerY: centerY + (deltas[2] ?? 0),
                    varIndexBase
                };
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
                const deltas = this.getVarDeltas(varIndexBase, 2);
                const paint = this.readPaint(baseOffset + paintOffset, baseOffset + paintOffset, depth + 1);
                return { format, paint, xSkew: xSkew + (deltas[0] ?? 0), ySkew: ySkew + (deltas[1] ?? 0), varIndexBase };
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
    readOffset24(offset) {
        return (this.view.getUint8(offset) << 16) | (this.view.getUint8(offset + 1) << 8) | this.view.getUint8(offset + 2);
    }
    readFixed16_16(offset) {
        const raw = this.view.getInt32(offset, false);
        return raw / 65536;
    }
    readF2Dot14(offset) {
        const raw = this.view.getInt16(offset, false);
        return raw / 16384;
    }
    readAffine2x3(offset) {
        return {
            xx: this.readFixed16_16(offset),
            yx: this.readFixed16_16(offset + 4),
            xy: this.readFixed16_16(offset + 8),
            yy: this.readFixed16_16(offset + 12),
            dx: this.readFixed16_16(offset + 16),
            dy: this.readFixed16_16(offset + 20)
        };
    }
    readColorLine(offset) {
        const extend = this.view.getUint8(offset);
        const numStops = this.view.getUint16(offset + 1, false);
        const stops = [];
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
    readVariationStore(byteArray, offset) {
        const prev = byteArray.offset;
        byteArray.offset = offset;
        const format = byteArray.readUnsignedShort();
        if (format !== 1) {
            byteArray.offset = prev;
            return;
        }
        const regionListOffset = byteArray.readUnsignedInt();
        const dataCount = byteArray.readUnsignedShort();
        const dataOffsets = [];
        for (let i = 0; i < dataCount; i++) {
            dataOffsets.push(byteArray.readUnsignedInt());
        }
        const regionListPos = offset + regionListOffset;
        byteArray.offset = regionListPos;
        const axisCount = byteArray.readUnsignedShort();
        const regionCount = byteArray.readUnsignedShort();
        const regions = [];
        for (let r = 0; r < regionCount; r++) {
            const region = [];
            for (let a = 0; a < axisCount; a++) {
                const start = byteArray.readShort() / 16384;
                const peak = byteArray.readShort() / 16384;
                const end = byteArray.readShort() / 16384;
                region.push({ start, peak, end });
            }
            regions.push(region);
        }
        this.varStore = { axisCount, regions, dataOffsets, start: offset };
        byteArray.offset = prev;
    }
    getVarDeltas(varIndexBase, count) {
        const out = new Array(count).fill(0);
        for (let i = 0; i < count; i++) {
            out[i] = this.getVarDelta(varIndexBase + i);
        }
        return out;
    }
    getVarDelta(varIndex) {
        if (!this.varStore)
            return 0;
        const outer = (varIndex >>> 16) & 0xffff;
        const inner = varIndex & 0xffff;
        const dataOffset = this.varStore.dataOffsets[outer];
        if (dataOffset == null)
            return 0;
        const dataPos = this.varStore.start + dataOffset;
        const view = this.view;
        const itemCount = view.getUint16(dataPos, false);
        const shortDeltaCount = view.getUint16(dataPos + 2, false);
        const regionIndexCount = view.getUint16(dataPos + 4, false);
        if (inner >= itemCount)
            return 0;
        const regionIndices = [];
        let cursor = dataPos + 6;
        for (let i = 0; i < regionIndexCount; i++) {
            regionIndices.push(view.getUint16(cursor, false));
            cursor += 2;
        }
        const scalar = (regionIndex) => {
            const region = this.varStore.regions[regionIndex];
            if (!region)
                return 0;
            let s = 1;
            for (let a = 0; a < region.length; a++) {
                const coord = this.variationCoords[a] ?? 0;
                const { start, peak, end } = region[a];
                if (coord === 0 || (start === 0 && peak === 0 && end === 0))
                    continue;
                if (coord < start || coord > end) {
                    s = 0;
                    break;
                }
                if (coord < peak)
                    s *= (coord - start) / (peak - start);
                else if (coord > peak)
                    s *= (end - coord) / (end - peak);
            }
            return s;
        };
        const deltaRecordSize = shortDeltaCount * 2 + (regionIndexCount - shortDeltaCount);
        const recordStart = cursor + inner * deltaRecordSize;
        let delta = 0;
        let p = recordStart;
        for (let r = 0; r < regionIndexCount; r++) {
            const regionIdx = regionIndices[r];
            const s = scalar(regionIdx);
            const d = r < shortDeltaCount ? view.getInt16(p, false) : view.getInt8(p);
            p += r < shortDeltaCount ? 2 : 1;
            delta += d * s;
        }
        return delta;
    }
    readClipList(byteArray, offset) {
        const prev = byteArray.offset;
        byteArray.offset = offset;
        let format = byteArray.readUnsignedShort();
        if (format !== 1 && format !== 2) {
            const alt = byteArray.readUnsignedByte();
            if (alt === 1 || alt === 2) {
                format = alt;
            }
            else {
                byteArray.offset = prev;
                return;
            }
        }
        const clipCount = byteArray.readUnsignedShort();
        for (let i = 0; i < clipCount; i++) {
            const glyphId = byteArray.readUnsignedShort();
            const clipOffset = byteArray.readUnsignedInt();
            const box = this.readClipBox(offset + clipOffset);
            if (box)
                this.clipBoxes.set(glyphId, box);
        }
        byteArray.offset = prev;
    }
    readClipBox(offset) {
        let format = this.view.getUint16(offset, false);
        let cursor = offset + 2;
        if (format !== 1 && format !== 2) {
            format = this.view.getUint8(offset);
            cursor = offset + 1;
        }
        if (format !== 1 && format !== 2)
            return null;
        const xMin = this.view.getInt16(cursor, false);
        const yMin = this.view.getInt16(cursor + 2, false);
        const xMax = this.view.getInt16(cursor + 4, false);
        const yMax = this.view.getInt16(cursor + 6, false);
        if (format === 1) {
            return { xMin, yMin, xMax, yMax };
        }
        // ClipBoxVar: four VariationIndex values follow
        const varIndexBase = cursor + 8;
        const dxMin = this.getVarDelta(this.view.getUint32(varIndexBase, false));
        const dyMin = this.getVarDelta(this.view.getUint32(varIndexBase + 4, false));
        const dxMax = this.getVarDelta(this.view.getUint32(varIndexBase + 8, false));
        const dyMax = this.getVarDelta(this.view.getUint32(varIndexBase + 12, false));
        return {
            xMin: xMin + dxMin,
            yMin: yMin + dyMin,
            xMax: xMax + dxMax,
            yMax: yMax + dyMax
        };
    }
}

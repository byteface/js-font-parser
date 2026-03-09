import type { IGlyphDescription } from '../table/IGlyphDescription.js';

export type ColrLayer = { glyphId: number; color: string | null; paletteIndex: number };

export type MarkAnchor = {
    type: 'mark' | 'base' | 'ligature' | 'mark2' | 'cursive-entry' | 'cursive-exit';
    classIndex: number;
    x: number;
    y: number;
    componentIndex?: number;
};

type ConstructorLike = any;

type MarkAnchorCtors = {
    MarkBasePosFormat1: ConstructorLike;
    MarkLigPosFormat1: ConstructorLike;
    MarkMarkPosFormat1: ConstructorLike;
    CursivePosFormat1: ConstructorLike;
};

export function flattenColrV1Paint(
    paint: any,
    paletteIndex: number,
    getPalette: (paletteIndex: number) => Array<{ red: number; green: number; blue: number; alpha: number }>,
    resolveGlyphLayers: (glyphId: number, paletteIndex: number) => ColrLayer[]
): ColrLayer[] {
    if (!paint) return [];
    if (paint.format === 1 && Array.isArray(paint.layers)) {
        return paint.layers.flatMap((p: any) => flattenColrV1Paint(p, paletteIndex, getPalette, resolveGlyphLayers));
    }
    if (paint.format === 10) {
        const child = paint.paint;
        if (child && child.format === 2) {
            const color = getPalette(paletteIndex)?.[child.paletteIndex];
            const rgba = color ? `rgba(${color.red}, ${color.green}, ${color.blue}, ${(color.alpha / 255) * (child.alpha ?? 1)})` : null;
            return [{ glyphId: paint.glyphID, color: rgba, paletteIndex: child.paletteIndex }];
        }
        return flattenColrV1Paint(child, paletteIndex, getPalette, resolveGlyphLayers).map(layer => ({ ...layer, glyphId: paint.glyphID }));
    }
    if (paint.format === 11) {
        return resolveGlyphLayers(paint.glyphID, paletteIndex);
    }
    return [];
}

function collectLookupSubtables(gpos: any): any[] {
    const lookups = gpos?.lookupList?.getLookups?.() ?? [];
    const all: any[] = [];
    for (const lookup of lookups) {
        if (!lookup) continue;
        for (let i = 0; i < lookup.getSubtableCount(); i++) {
            const st = lookup.getSubtable(i);
            if (st) all.push(st);
        }
    }
    return all;
}

export function getMarkAnchorsForGlyph(
    glyphId: number,
    gpos: any,
    subtables: Array<any> | undefined,
    ctors: MarkAnchorCtors
): MarkAnchor[] {
    if (!gpos) return [];

    const anchors: MarkAnchor[] = [];
    const activeSubtables = subtables ?? collectLookupSubtables(gpos);

    for (const st of activeSubtables) {
        if (st instanceof ctors.MarkBasePosFormat1) {
            const markIndex = st.markCoverage?.findGlyph(glyphId) ?? -1;
            if (markIndex >= 0 && st.markArray) {
                const record = st.markArray.marks[markIndex];
                if (record?.anchor) {
                    anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                }
            }
            const baseIndex = st.baseCoverage?.findGlyph(glyphId) ?? -1;
            if (baseIndex >= 0 && st.baseArray) {
                const base = st.baseArray.baseRecords[baseIndex];
                if (base?.anchors) {
                    base.anchors.forEach((anchor: any, classIndex: number) => {
                        if (anchor) {
                            anchors.push({ type: 'base', classIndex, x: anchor.x, y: anchor.y });
                        }
                    });
                }
            }
        }
        if (st instanceof ctors.MarkLigPosFormat1) {
            const markIndex = st.markCoverage?.findGlyph(glyphId) ?? -1;
            if (markIndex >= 0 && st.markArray) {
                const record = st.markArray.marks[markIndex];
                if (record?.anchor) {
                    anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                }
            }
            const ligIndex = st.ligatureCoverage?.findGlyph(glyphId) ?? -1;
            if (ligIndex >= 0 && st.ligatureArray) {
                const lig = st.ligatureArray.ligatures[ligIndex];
                lig?.components?.forEach((component: any[], componentIndex: number) => {
                    component.forEach((anchor: any, classIndex: number) => {
                        if (anchor) {
                            anchors.push({ type: 'ligature', classIndex, x: anchor.x, y: anchor.y, componentIndex });
                        }
                    });
                });
            }
        }
        if (st instanceof ctors.MarkMarkPosFormat1) {
            const mark1Index = st.mark1Coverage?.findGlyph(glyphId) ?? -1;
            if (mark1Index >= 0 && st.mark1Array) {
                const record = st.mark1Array.marks[mark1Index];
                if (record?.anchor) {
                    anchors.push({ type: 'mark', classIndex: record.markClass, x: record.anchor.x, y: record.anchor.y });
                }
            }
            const mark2Index = st.mark2Coverage?.findGlyph(glyphId) ?? -1;
            if (mark2Index >= 0 && st.mark2Array) {
                const record = st.mark2Array.records[mark2Index];
                record?.anchors?.forEach((anchor: any, classIndex: number) => {
                    if (anchor) {
                        anchors.push({ type: 'mark2', classIndex, x: anchor.x, y: anchor.y });
                    }
                });
            }
        }
        if (st instanceof ctors.CursivePosFormat1) {
            const idx = st.coverage?.findGlyph(glyphId) ?? -1;
            if (idx >= 0) {
                const record = st.entryExitRecords[idx];
                if (record?.entry) anchors.push({ type: 'cursive-entry', classIndex: 0, x: record.entry.x, y: record.entry.y });
                if (record?.exit) anchors.push({ type: 'cursive-exit', classIndex: 0, x: record.exit.x, y: record.exit.y });
            }
        }
    }

    return anchors;
}

export function interpolateDelta(aCoord: number, bCoord: number, aDelta: number, bDelta: number, pCoord: number): number {
    if (aCoord === bCoord) return aDelta;
    const t = (pCoord - aCoord) / (bCoord - aCoord);
    const clamped = Math.max(0, Math.min(1, t));
    return aDelta + (bDelta - aDelta) * clamped;
}

export function applyIupDeltas(base: IGlyphDescription, dx: number[], dy: number[], touched: boolean[]): void {
    const pointCount = base.getPointCount();
    if (pointCount === 0) return;

    const endPts: number[] = [];
    for (let c = 0; c < base.getContourCount(); c++) {
        endPts.push(base.getEndPtOfContours(c));
    }

    let start = 0;
    for (const end of endPts) {
        const indices: number[] = [];
        const touchedIndices: number[] = [];
        for (let i = start; i <= end; i++) {
            indices.push(i);
            if (touched[i]) touchedIndices.push(i);
        }
        if (touchedIndices.length === 0) {
            start = end + 1;
            continue;
        }
        if (touchedIndices.length === 1) {
            const idx = touchedIndices[0];
            for (const i of indices) {
                dx[i] = dx[idx];
                dy[i] = dy[idx];
            }
            start = end + 1;
            continue;
        }

        const contour = indices;
        const total = contour.length;
        const order = touchedIndices.map(i => contour.indexOf(i)).sort((a, b) => a - b);
        const coordsX = contour.map(i => base.getXCoordinate(i));
        const coordsY = contour.map(i => base.getYCoordinate(i));

        for (let t = 0; t < order.length; t++) {
            const a = order[t];
            const b = order[(t + 1) % order.length];
            let idx = (a + 1) % total;
            while (idx !== b) {
                const globalIndex = contour[idx];
                const ax = coordsX[a];
                const bx = coordsX[b];
                const ay = coordsY[a];
                const by = coordsY[b];
                const px = coordsX[idx];
                const py = coordsY[idx];
                dx[globalIndex] = interpolateDelta(ax, bx, dx[contour[a]], dx[contour[b]], px);
                dy[globalIndex] = interpolateDelta(ay, by, dy[contour[a]], dy[contour[b]], py);
                idx = (idx + 1) % total;
            }
        }
        start = end + 1;
    }
}

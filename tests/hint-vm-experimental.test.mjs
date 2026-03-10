import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TrueTypeHintVM } from '../dist/hint/TrueTypeHintVM.js';
import { FontParser } from '../dist/index.js';

function makeGlyph(points) {
  return {
    points: points.map((p) => ({ ...p })),
    getPointCount() { return this.points.length; },
    getPoint(i) { return this.points[i]; }
  };
}

test('hint vm experimental: MIAP moves point to CVT value on active axis', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 10, y: 0, onCurve: true, endOfContour: true }]);

  // SVTCA[x], PUSH point(0), PUSH cvt(0), MIAP[round]
  const program = [0x01, 0xB0, 0x00, 0xB0, 0x00, 0x3F];
  const result = vm.runPrograms(glyph, [program], { cvtValues: [64] });

  assert.equal(result.executed, true);
  assert.equal(glyph.points[0].x, 64);
});

test('hint vm experimental: MDAP rounds coordinate in-place and SHPIX applies loop distance', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 10.2, y: 0, onCurve: true, endOfContour: false },
    { x: 20.2, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], PUSH p0, MDAP[round], SLOOP=2, PUSH p1,p0,distance=1, SHPIX
  const program = [
    0x01,
    0xB0, 0x00, 0x2F,
    0xB0, 0x02, 0x17,
    0xB0, 0x01, 0xB0, 0x00, 0xB0, 0x01, 0x38
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });

  assert.equal(glyph.points[0].x, 11);
  assert.equal(glyph.points[1].x, 21.2);
});

test('hint vm experimental: FDEF/CALL executes stored function body', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 4, y: 0, onCurve: true, endOfContour: true }]);

  // PUSH fnId=5, FDEF, (PUSH p0, PUSH cvt0, MIAP[round]), ENDF, PUSH fnId=5, CALL
  const program = [
    0xB0, 0x05, 0x2C,
      0xB0, 0x00, 0xB0, 0x00, 0x3F,
    0x2D,
    0xB0, 0x05, 0x2B
  ];

  vm.runPrograms(glyph, [program], { cvtValues: [32] });
  assert.equal(glyph.points[0].x, 32);
});

test('hint vm experimental: MSIRP sets point relative to rp0 and updates reference points', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 30, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(point0), PUSH dist=8, point1, MSIRP[1]
  const program = [0x01, 0xB0, 0x00, 0x10, 0xB0, 0x08, 0xB0, 0x01, 0x3B];
  vm.runPrograms(glyph, [program], { cvtValues: [] });

  assert.equal(glyph.points[1].x, 18);
});

test('hint vm experimental: MIRP moves point to CVT distance from rp0 on projection axis', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 50, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(point0), PUSH cvt0, point1, MIRP
  const program = [0x01, 0xB0, 0x00, 0x10, 0xB0, 0x00, 0xB0, 0x01, 0xE0];
  vm.runPrograms(glyph, [program], { cvtValues: [16] });

  assert.equal(glyph.points[1].x, 26);
});

test('hint vm experimental: arithmetic + conditional branch updates point via SCFS', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 2, y: 0, onCurve: true, endOfContour: true }]);

  // SVTCA[x], PUSH 3,4,ADD =>7, PUSH 7,EQ =>1, IF { PUSH p0, PUSH 33, SCFS } EIF
  const program = [
    0x01,
    0xB0, 0x03, 0xB0, 0x04, 0x60,
    0xB0, 0x07, 0x54,
    0x58,
      0xB0, 0x00, 0xB0, 0x21, 0x48,
    0x59
  ];

  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 33);
});

test('hint vm experimental: DELTAP stack consumption path is safe', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 1, y: 0, onCurve: true, endOfContour: true }]);

  // PUSH arg,arg,count=1 then DELTAP1 (consumes two args + count)
  const program = [0xB0, 0x10, 0xB0, 0x20, 0xB0, 0x01, 0x5D];
  const result = vm.runPrograms(glyph, [program], { cvtValues: [] });

  assert.equal(result.executed, true);
  assert.equal(Number.isFinite(result.unsupportedOpcodeCount), true);
  assert.equal(glyph.points[0].x, 1);
});

test('hint vm experimental: zone pointers isolate twilight point moves from glyph zone', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(glyph point 0), SZP1(twilight), MIRP(point0 in zone1)
  const program = [0x01, 0xB0, 0x00, 0x10, 0xB0, 0x00, 0x14, 0xB0, 0x00, 0xB0, 0x00, 0xE0];
  vm.runPrograms(glyph, [program], { cvtValues: [16] });

  // MIRP targeted twilight zone, so glyph zone point remains unchanged.
  assert.equal(glyph.points[0].x, 10);
});

test('hint vm experimental: SROUND + ROUND influence scalar rounding outcome', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);

  // SVTCA[x], SROUND(selector=0xC1), PUSH p0, PUSH 53, PUSH 5, DIV=10.6, ROUND, SCFS
  const program = [0x01, 0xB0, 0xC1, 0x76, 0xB0, 0x00, 0xB0, 0x35, 0xB0, 0x05, 0x62, 0x68, 0x48];
  vm.runPrograms(glyph, [program], { cvtValues: [] });

  assert.equal(glyph.points[0].x, 10);
});

test('hint vm experimental: IUP[x] interpolates untouched points between touched endpoints', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SCFS p0->0, SCFS p2->30, IUP[x]
  const program = [
    0x01,
    0xB0, 0x00, 0xB0, 0x00, 0x48,
    0xB0, 0x02, 0xB0, 0x1E, 0x48,
    0x31
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });

  assert.equal(glyph.points[0].x, 0);
  assert.equal(glyph.points[2].x, 30);
  assert.equal(glyph.points[1].x, 15);
});

test('hint vm experimental: IUP on twilight zone does not mutate glyph zone points', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 1, y: 0, onCurve: true, endOfContour: false },
    { x: 2, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SZP2(twilight), SCFS tw0->5, SCFS tw2->15, IUP[x]
  const program = [
    0x01,
    0xB0, 0x00, 0x15,
    0xB0, 0x00, 0xB0, 0x05, 0x48,
    0xB0, 0x02, 0xB0, 0x0F, 0x48,
    0x31
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 1);
  assert.equal(glyph.points[1].x, 2);
});

test('hint vm experimental: visual glyph shape differs between hinting off and vm-experimental for known fixture', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const fixturePath = path.resolve(here, '../truetypefonts/JoeJack.ttf');
  const bytes = fs.readFileSync(fixturePath);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  const parserOff = FontParser.fromArrayBuffer(buffer.slice(0));
  parserOff.setHintingOptions({ enabled: false, mode: 'none', ppem: 12 });
  const offGlyph = parserOff.getGlyphByChar('A');
  assert.ok(offGlyph && offGlyph.points && offGlyph.points.length > 0);

  const parserOn = FontParser.fromArrayBuffer(buffer.slice(0));
  parserOn.setHintingOptions({ enabled: true, mode: 'vm-experimental', ppem: 12 });
  const onGlyph = parserOn.getGlyphByChar('A');
  assert.ok(onGlyph && onGlyph.points && onGlyph.points.length === offGlyph.points.length);

  let movedPoints = 0;
  for (let i = 0; i < offGlyph.points.length; i++) {
    const a = offGlyph.points[i];
    const b = onGlyph.points[i];
    if (!a || !b) continue;
    if (Math.abs(a.x - b.x) > 0.001 || Math.abs(a.y - b.y) > 0.001) movedPoints++;
  }

  // Shape-level assertion for the hinting preview path: VM-on should move at least one point.
  assert.ok(movedPoints > 0);
});

test('hint vm experimental: SMD controls minimum distance for MIRP min-distance flag', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 1, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(p0), SMD(4), PUSH cvt0, p1, MIRP[minDist]
  const program = [0x01, 0xB0, 0x00, 0x10, 0xB0, 0x04, 0x1A, 0xB0, 0x00, 0xB0, 0x01, 0xE8];
  vm.runPrograms(glyph, [program], { cvtValues: [0] });

  assert.equal(glyph.points[1].x, 4);
});

test('hint vm experimental: SCVTCI makes MIRP keep original distance when CVT is outside cut-in', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(p0), SCVTCI(0), PUSH cvt0, p1, MIRP
  const program = [0x01, 0xB0, 0x00, 0x10, 0xB0, 0x00, 0x1D, 0xB0, 0x00, 0xB0, 0x01, 0xE0];
  vm.runPrograms(glyph, [program], { cvtValues: [100] });

  assert.equal(glyph.points[1].x, 20);
});

test('hint vm experimental: SSW + SSWCI can snap MIRP distance to single-width value', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(p0), SSW(12), SSWCI(3), PUSH cvt0=10, p1, MIRP
  const program = [0x01, 0xB0, 0x00, 0x10, 0xB0, 0x0C, 0x1F, 0xB0, 0x03, 0x1E, 0xB0, 0x00, 0xB0, 0x01, 0xE0];
  vm.runPrograms(glyph, [program], { cvtValues: [10] });

  assert.equal(glyph.points[1].x, 12);
});

test('hint vm experimental: IP interpolates point using rp1/rp2 movement', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP1(p0), SRP2(p2), move p2->30 via SCFS, then IP(p1)
  const program = [0x01, 0xB0, 0x00, 0x11, 0xB0, 0x02, 0x12, 0xB0, 0x02, 0xB0, 0x1E, 0x48, 0xB0, 0x01, 0x39];
  vm.runPrograms(glyph, [program], { cvtValues: [] });

  assert.equal(glyph.points[1].x, 15);
});

test('hint vm experimental: IP in twilight zone stays isolated from glyph zone', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 1, y: 0, onCurve: true, endOfContour: false },
    { x: 2, y: 0, onCurve: true, endOfContour: true }
  ]);

  // Work only in twilight: SZP0/1/2=0, SRP1(tw0), SRP2(tw2), SCFS tw2->30, IP tw1
  const program = [
    0x01,
    0xB0, 0x00, 0x13, 0xB0, 0x00, 0x14, 0xB0, 0x00, 0x15,
    0xB0, 0x00, 0x11, 0xB0, 0x02, 0x12,
    0xB0, 0x02, 0xB0, 0x1E, 0x48,
    0xB0, 0x01, 0x39
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });

  assert.equal(glyph.points[0].x, 1);
  assert.equal(glyph.points[1].x, 2);
});

test('hint vm experimental: MPPEM writes configured ppem value through SCFS', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);

  // PUSH p0, MPPEM, SCFS => p0.x = ppem
  const program = [0xB0, 0x00, 0x4B, 0x48];
  vm.runPrograms(glyph, [program], { cvtValues: [], ppem: 17 });
  assert.equal(glyph.points[0].x, 17);
});

test('hint vm experimental: GC[original] reads pre-hint coordinate', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // Move p0 to 30; write GC[original](p0) into p1 via SCFS.
  const program = [0x01, 0xB0, 0x00, 0xB0, 0x1E, 0x48, 0xB0, 0x01, 0xB0, 0x00, 0x47, 0x48];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 30);
  assert.equal(glyph.points[1].x, 10);
});

test('hint vm experimental: ALIGNRP aligns looped points to rp0 projection coordinate', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 5, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(p0), ALIGNRP(p1)
  const program = [0x01, 0xB0, 0x00, 0x10, 0xB0, 0x01, 0x3C];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[1].x, 5);
});

test('hint vm experimental: SHP uses rp2 movement to shift points', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP2(p2), move p2->30, SHP[rp2] p1
  const program = [0x01, 0xB0, 0x02, 0x12, 0xB0, 0x02, 0xB0, 0x1E, 0x48, 0xB0, 0x01, 0x32];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[2].x, 30);
  assert.equal(glyph.points[1].x, 20);
});

test('hint vm experimental: MD[original] measures original distance between zones', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // Move p1 to 30. Then MD[orig](p0,p1) should still be 10; write into p2.
  const program = [0x01, 0xB0, 0x01, 0xB0, 0x1E, 0x48, 0xB0, 0x02, 0xB0, 0x00, 0xB0, 0x01, 0x4A, 0x48];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[1].x, 30);
  assert.equal(glyph.points[2].x, 10);
});

test('hint vm experimental: WS/RS roundtrip through storage area', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);

  // WS(index=3,value=42), RS(3), write into p0.x
  const program = [0xB0, 0x03, 0xB0, 0x2A, 0x42, 0xB0, 0x00, 0xB0, 0x03, 0x43, 0x48];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 42);
});

test('hint vm experimental: MIN/MAX push expected extrema', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // MIN(30,12)->12 -> p0; MAX(30,12)->30 -> p1
  const program = [
    0xB0, 0x00, 0xB0, 0x1E, 0xB0, 0x0C, 0x8C, 0x48,
    0xB0, 0x01, 0xB0, 0x1E, 0xB0, 0x0C, 0x8B, 0x48
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 12);
  assert.equal(glyph.points[1].x, 30);
});

test('hint vm experimental: ODD/EVEN evaluate rounded parity', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // ODD(3)->1 -> p0; EVEN(4)->1 -> p1
  const program = [
    0xB0, 0x00, 0xB0, 0x03, 0x56, 0x48,
    0xB0, 0x01, 0xB0, 0x04, 0x57, 0x48
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 1);
  assert.equal(glyph.points[1].x, 1);
});

test('hint vm experimental: FLIPPT toggles on-curve flags for selected points', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: false, endOfContour: true }
  ]);

  // FLIPPT p0,p1
  const program = [0xB0, 0x02, 0x17, 0xB0, 0x01, 0xB0, 0x00, 0x80];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].onCurve, false);
  assert.equal(glyph.points[1].onCurve, true);
});

test('hint vm experimental: FLIPRGON/OFF set on-curve ranges explicitly', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: false, endOfContour: false },
    { x: 10, y: 0, onCurve: false, endOfContour: false },
    { x: 20, y: 0, onCurve: false, endOfContour: true }
  ]);

  // FLIPRGON 0..2 then FLIPRGOFF 1..1
  const program = [0xB0, 0x00, 0xB0, 0x02, 0x81, 0xB0, 0x01, 0xB0, 0x01, 0x82];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].onCurve, true);
  assert.equal(glyph.points[1].onCurve, false);
  assert.equal(glyph.points[2].onCurve, true);
});

test('hint vm experimental: unary arithmetic ops do not consume extra stack entries', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // p0<-ABS(-7)=7, p1<-NEG(7)=-7, p2<-FLOOR(7.9)=7, p3<-CEIL(7.1)=8
  const program = [
    0xB0, 0x00, 0xB8, 0xFF, 0xF9, 0x64, 0x48,
    0xB0, 0x01, 0xB0, 0x07, 0x65, 0x48,
    0xB0, 0x02, 0xB8, 0x00, 0x07, 0x66, 0x48,
    0xB0, 0x03, 0xB8, 0x00, 0x07, 0x67, 0x48
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 7);
  assert.equal(glyph.points[1].x, -7);
  assert.equal(glyph.points[2].x, 7);
  assert.equal(glyph.points[3].x, 7);
});

test('hint vm experimental: ROLL rotates top three stack values', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // stack [1,2,3] -> ROLL => [3,1,2]; with this write pattern p0=2, p1=1, p2=3
  const program = [
    0xB0, 0x01, 0xB0, 0x02, 0xB0, 0x03, 0x8A,
    0xB0, 0x00, 0x23, 0x48,
    0xB0, 0x01, 0x23, 0x48,
    0xB0, 0x02, 0x23, 0x48
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 2);
  assert.equal(glyph.points[1].x, 1);
  assert.equal(glyph.points[2].x, 3);
});

test('hint vm experimental: ALIGNPTS aligns two points to midpoint on projection axis', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], ALIGNPTS(p0,p1)
  const program = [0x01, 0xB0, 0x00, 0xB0, 0x01, 0x27];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 10);
  assert.equal(glyph.points[1].x, 10);
});

test('hint vm experimental: SHC shifts selected contour by rp2 delta', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true },
    { x: 100, y: 0, onCurve: true, endOfContour: false },
    { x: 110, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP2(p3), move p3 110->130, SHC[rp2] contour 0
  const program = [0x01, 0xB0, 0x03, 0x12, 0xB0, 0x03, 0xB0, 0x82, 0x48, 0xB0, 0x00, 0x34];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 20);
  assert.equal(glyph.points[1].x, 30);
  assert.equal(glyph.points[2].x, 100);
  assert.equal(glyph.points[3].x, 130);
});

test('hint vm experimental: SHZ shifts entire zone by rp2 delta', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP2(p1), move p1 10->30, SHZ[rp2] zone 1
  const program = [0x01, 0xB0, 0x01, 0x12, 0xB0, 0x01, 0xB0, 0x1E, 0x48, 0xB0, 0x01, 0x36];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 20);
  assert.equal(glyph.points[1].x, 50);
});

test('hint vm experimental: SCANCTRL/SCANTYPE consume one arg without changing geometry', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SCANCTRL(255), SCANTYPE(4), write depth into p0. Only point-index push remains => depth 1.
  const program = [0xB0, 0xFF, 0x85, 0xB0, 0x04, 0x8D, 0xB0, 0x00, 0x24, 0x48];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 1);
  assert.equal(glyph.points[1].x, 0);
});

test('hint vm experimental: INSTCTRL-like controls consume two args', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 0, y: 0, onCurve: true, endOfContour: true }
  ]);

  // INSTCTRL(1,1), then write depth into p1. Only point-index push remains => depth 1.
  const program = [
    0xB0, 0x01, 0xB0, 0x01, 0x8E,
    0xB0, 0x01, 0x24, 0x48
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[1].x, 1);
});

test('hint vm experimental: UTP clears touched state so IUP re-interpolates from remaining touched points', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 10, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // Touch p0 and p2, then UTP p2 so only p0 remains touched before IUP[x].
  const program = [
    0x01,
    0xB0, 0x00, 0xB0, 0x00, 0x48,
    0xB0, 0x02, 0xB0, 0x1E, 0x48,
    0xB0, 0x02, 0x29,
    0x31
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[0].x, 0);
  assert.equal(glyph.points[1].x, 10);
  assert.equal(glyph.points[2].x, 20);
});

test('hint vm experimental: DELTAP1 applies point delta only on matching ppem', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 10, y: 0, onCurve: true, endOfContour: true }]);

  // arg 0x3A => ppem=(base 9 + 3)=12, step=(10-8)=2 => +2/8 = +0.25
  const program = [0x01, 0xB0, 0x00, 0xB0, 0x3A, 0xB0, 0x01, 0x5D];
  vm.runPrograms(glyph, [program], { cvtValues: [], ppem: 12 });
  assert.equal(Math.abs(glyph.points[0].x - 10.25) < 1e-6, true);
});

test('hint vm experimental: DELTAP1 does not apply when ppem does not match', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 10, y: 0, onCurve: true, endOfContour: true }]);

  const program = [0x01, 0xB0, 0x00, 0xB0, 0x3A, 0xB0, 0x01, 0x5D];
  vm.runPrograms(glyph, [program], { cvtValues: [], ppem: 13 });
  assert.equal(glyph.points[0].x, 10);
});

test('hint vm experimental: DELTAC1 mutates CVT used by MIRP', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // arg 0x3C => ppem 12, step 4 => +0.5 CVT delta.
  const program = [
    0x01,
    0xB0, 0x00, 0x10,
    0xB0, 0x00, 0xB0, 0x3C, 0xB0, 0x01, 0x73,
    0xB0, 0x00, 0xB0, 0x01, 0xE0
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [16], ppem: 12 });
  assert.equal(Math.abs(glyph.points[1].x - 16.5) < 1e-6, true);
});

test('hint vm experimental: SDB/SDS adjust DELTA ppem band and delta scale', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 10, y: 0, onCurve: true, endOfContour: true }]);

  // SDB=20, SDS=2 => scale 4. arg 0x29 => ppem 22, step 1 => +0.25
  const program = [0x01, 0xB0, 0x14, 0x5E, 0xB0, 0x02, 0x5F, 0xB0, 0x00, 0xB0, 0x29, 0xB0, 0x01, 0x5D];
  vm.runPrograms(glyph, [program], { cvtValues: [], ppem: 22 });
  assert.equal(Math.abs(glyph.points[0].x - 10.25) < 1e-6, true);
});

test('hint vm experimental: top-level ENDF is treated as no-op', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);
  const result = vm.runPrograms(glyph, [[0x2D]], { cvtValues: [] });
  assert.equal(result.executed, true);
  assert.equal(result.unsupportedOpcodeCount, 0);
});

test('hint vm experimental: SDPVTL[1] uses original-point line and rotates projection axis', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // First move p1 in current space, then set projection from ORIGINAL p0->p1 rotated (0x87),
  // and read GC current/projection into p0.y. Rotated axis should be y, so p0.y stays 0.
  const program = [
    0x01,
    0xB0, 0x01, 0xB0, 0x1E, 0x48,
    0xB0, 0x00, 0xB0, 0x01, 0x87,
    0x00,
    0xB0, 0x00, 0xB0, 0x00, 0x46, 0x48
  ];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(glyph.points[1].x, 30);
  assert.equal(glyph.points[0].y, 0);
});

test('hint vm experimental: ISECT moves point to intersection of two lines', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },   // a0
    { x: 10, y: 10, onCurve: true, endOfContour: false }, // a1
    { x: 0, y: 10, onCurve: true, endOfContour: false },  // b0
    { x: 10, y: 0, onCurve: true, endOfContour: false },  // b1
    { x: 99, y: 99, onCurve: true, endOfContour: true }   // p
  ]);

  // ISECT p=4, b0=2, b1=3, a0=0, a1=1
  const program = [0xB0, 0x04, 0xB0, 0x02, 0xB0, 0x03, 0xB0, 0x00, 0xB0, 0x01, 0x0F];
  vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(Math.abs(glyph.points[4].x - 5) < 1e-6, true);
  assert.equal(Math.abs(glyph.points[4].y - 5) < 1e-6, true);
});

test('hint vm experimental: IDEF can define and execute a custom opcode body', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([{ x: 0, y: 0, onCurve: true, endOfContour: true }]);

  // IDEF(op=0x90){ PUSH 42 } ENDF; invoke 0x90; write result into p0.x via SCFS.
  const program = [0xB0, 0x90, 0x89, 0xB0, 0x2A, 0x2D, 0x90, 0xB0, 0x00, 0x23, 0x48];
  const result = vm.runPrograms(glyph, [program], { cvtValues: [] });
  assert.equal(result.unsupportedOpcodeCount, 0);
  assert.equal(glyph.points[0].x, 42);
});

test('hint vm experimental: MIRP respects autoFlip=false with signed CVT direction', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(p0), FLIPOFF, MIRP p1 to cvt0=-16 => p1 ends at -16
  const program = [0x01, 0xB0, 0x00, 0x10, 0x4E, 0xB0, 0x00, 0xB0, 0x01, 0xE0];
  vm.runPrograms(glyph, [program], { cvtValues: [-16] });
  assert.equal(glyph.points[1].x, -16);
});

test('hint vm experimental: MIRP keeps original direction when autoFlip=true', () => {
  const vm = new TrueTypeHintVM();
  const glyph = makeGlyph([
    { x: 0, y: 0, onCurve: true, endOfContour: false },
    { x: 20, y: 0, onCurve: true, endOfContour: true }
  ]);

  // SVTCA[x], SRP0(p0), FLIPON, MIRP p1 with cvt0=-16 => keep original (+x) side
  const program = [0x01, 0xB0, 0x00, 0x10, 0x4D, 0xB0, 0x00, 0xB0, 0x01, 0xE0];
  vm.runPrograms(glyph, [program], { cvtValues: [-16] });
  assert.equal(glyph.points[1].x, 16);
});

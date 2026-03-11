export const FontParser = window.FontParser?.FontParser;

export function resizeCanvas(canvas, ctx) {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function randomBetween(min, max, step = 1) {
  const value = min + Math.random() * (max - min);
  if (step === 1) return Math.round(value);
  return Math.round(value / step) * step;
}

export function wireFoldawayPanel(panel, toggleButton, randomizeButton, onRandomize) {
  toggleButton?.addEventListener('click', () => {
    panel?.classList.toggle('collapsed');
    toggleButton.textContent = panel?.classList.contains('collapsed') ? 'Show' : 'Hide';
  });
  randomizeButton?.addEventListener('click', () => {
    onRandomize?.();
  });
}

export function bindMouse(canvas, mouse) {
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
  });
}

export function buildGlyphHomes(font, text, { scale = 0.2, density = 2, originX = window.innerWidth * 0.56, originY = window.innerHeight * 0.56, letterSpacing = 18, maxPoints = null } = {}) {
  const chars = Array.from((text || '').slice(0, 10));
  const runs = [];
  let penX = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const ch of chars) {
    const glyph = font.getGlyphByChar(ch);
    if (!glyph) continue;
    const points = [];
    for (let i = 0; i < glyph.getPointCount(); i += density) {
      const point = glyph.getPoint(i);
      points.push(point);
      const x = penX + point.x * scale;
      const y = -point.y * scale;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    runs.push({ glyph, penX, points });
    penX += (glyph.advanceWidth || 0) * scale + letterSpacing;
  }

  if (!runs.length) return [];

  const centerOffsetX = -((minX + maxX) * 0.5);
  const centerOffsetY = -((minY + maxY) * 0.5);
  const homes = [];
  let index = 0;

  for (const run of runs) {
    for (const point of run.points) {
      homes.push({
        x: originX + centerOffsetX + run.penX + point.x * scale,
        y: originY + centerOffsetY - point.y * scale,
        index: index++
      });
    }
  }

  if (!maxPoints || homes.length <= maxPoints) return homes;

  const sampled = [];
  const stride = homes.length / maxPoints;
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(homes[Math.floor(i * stride)]);
  }
  return sampled;
}

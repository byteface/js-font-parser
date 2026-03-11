import { Particle } from '../../dist/utils/Particle.js';
import { FontParser, bindMouse, buildGlyphHomes, randomBetween, resizeCanvas, wireFoldawayPanel } from './particle-common.js';

const FONT_OPTIONS = [
  { name: 'Minecraft', url: '../../truetypefonts/Minecraft.ttf' },
  { name: 'Source Code Pro', url: '../../truetypefonts/source-code-pro/SourceCodePro-Regular.otf' },
  { name: 'JoeJack', url: '../../truetypefonts/JoeJack.ttf' },
  { name: 'Quill', url: '../../truetypefonts/Quill.ttf' },
  { name: 'Gotham Narrow Ultra', url: '../../truetypefonts/GothamNarrow-Ultra.otf' },
  { name: 'RENAV', url: '../../truetypefonts/RENAV___.TTF' }
];

const PALETTES = {
  volt: { bg: 'rgba(6, 10, 18, ', lines: ['#90f7ff', '#52d9ff', '#ffd866'] },
  ember: { bg: 'rgba(18, 9, 8, ', lines: ['#ffd3a1', '#ff9966', '#ff5e62'] },
  mint: { bg: 'rgba(7, 13, 12, ', lines: ['#ddffd2', '#8ce99a', '#53d39b'] }
};

document.body.innerHTML += `
  <style>
    :root { --ink:#eef5ff; --muted:#94a5ba; --line:rgba(150,188,255,0.14); --panel:rgba(8,13,24,0.82); }
    * { box-sizing:border-box; }
    body { margin:0; overflow:hidden; color:var(--ink); font-family:"IBM Plex Sans", system-ui, sans-serif; background:radial-gradient(circle at 18% 12%, rgba(102,170,255,0.14), transparent 24%), linear-gradient(180deg, #070b12 0%, #0d1320 100%); }
    .panel { position:fixed; top:58px; left:14px; z-index:10; width:min(232px, calc(100vw - 28px)); max-height:calc(100vh - 74px); overflow-y:auto; display:grid; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--line); background:var(--panel); }
    .panel.collapsed .panelBody { display:none; }
    .bar { display:flex; justify-content:space-between; gap:8px; }
    .title strong { display:block; margin-bottom:4px; font-size:20px; letter-spacing:-0.03em; }
    .title span { color:var(--muted); font-size:12px; line-height:1.35; }
    .actions { display:flex; gap:6px; }
    .actions button { border:1px solid var(--line); border-radius:999px; padding:6px 10px; color:var(--ink); background:rgba(255,255,255,0.05); font:inherit; cursor:pointer; }
    .grid { display:grid; gap:8px; }
    label { display:grid; gap:4px; color:var(--muted); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; }
    input, select { width:100%; border:1px solid var(--line); border-radius:12px; padding:10px 12px; color:var(--ink); background:rgba(255,255,255,0.06); font:inherit; }
    input[type="range"] { padding:0; accent-color:#8ddfff; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { padding:5px 10px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,0.05); color:var(--muted); font-size:12px; }
    canvas { display:block; width:100vw; height:100vh; }
  </style>
  <section class="panel" id="panel">
    <div class="bar">
      <div class="title">
        <strong>Particle p7</strong>
        <span>Vibrating wireframe lines ride the particle headings instead of drawing another dot cloud.</span>
      </div>
      <div class="actions">
        <button id="randomizeButton" type="button">Shuffle</button>
        <button id="togglePanelButton" type="button">Hide</button>
      </div>
    </div>
    <div class="panelBody">
      <div class="grid">
        <label>Font<select id="fontSelect"></select></label>
        <label>Text<input id="textInput" value="HUM" maxlength="4" /></label>
        <label>Scale<input id="scaleInput" type="range" min="16" max="34" value="24" /></label>
        <label>Line Length<input id="lengthInput" type="range" min="6" max="24" value="12" /></label>
        <label>Vibration<input id="vibeInput" type="range" min="0" max="20" value="7" /></label>
        <label>Spring<input id="springInput" type="range" min="4" max="20" value="10" /></label>
        <label>Wander<input id="wanderInput" type="range" min="0" max="16" value="4" /></label>
        <label>Trail<input id="trailInput" type="range" min="4" max="20" value="9" /></label>
        <label>Palette<select id="paletteInput"><option value="volt">Volt</option><option value="ember">Ember</option><option value="mint">Mint</option></select></label>
      </div>
      <div class="chips"><div class="chip" id="particleChip">0 lines</div><div class="chip" id="fontChip">loading…</div></div>
    </div>
  </section>
  <canvas id="stage"></canvas>
`;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const fontSelect = document.getElementById('fontSelect');
const textInput = document.getElementById('textInput');
const scaleInput = document.getElementById('scaleInput');
const lengthInput = document.getElementById('lengthInput');
const vibeInput = document.getElementById('vibeInput');
const springInput = document.getElementById('springInput');
const wanderInput = document.getElementById('wanderInput');
const trailInput = document.getElementById('trailInput');
const paletteInput = document.getElementById('paletteInput');
const particleChip = document.getElementById('particleChip');
const fontChip = document.getElementById('fontChip');

const fontCache = new Map();
const mouse = { x: 0, y: 0, active: false };
let font = null;
let particles = [];
let rebuildToken = 0;

for (const entry of FONT_OPTIONS) {
  const option = document.createElement('option');
  option.value = entry.url;
  option.textContent = entry.name;
  fontSelect.appendChild(option);
}
fontSelect.value = FONT_OPTIONS[0].url;
bindMouse(canvas, mouse);
wireFoldawayPanel(document.getElementById('panel'), document.getElementById('togglePanelButton'), document.getElementById('randomizeButton'), () => {
  scaleInput.value = String(randomBetween(18, 30));
  lengthInput.value = String(randomBetween(8, 18));
  vibeInput.value = String(randomBetween(4, 14));
  springInput.value = String(randomBetween(7, 15));
  wanderInput.value = String(randomBetween(2, 8));
  trailInput.value = String(randomBetween(8, 15));
  paletteInput.value = ['volt', 'ember', 'mint'][randomBetween(0, 2)];
  rebuild();
});

async function ensureFont() {
  const url = fontSelect.value;
  if (!fontCache.has(url)) fontCache.set(url, FontParser.load(url));
  font = await fontCache.get(url);
  fontChip.textContent = fontSelect.selectedOptions[0]?.textContent || 'font';
}

async function rebuild() {
  if (!FontParser) return;
  const token = ++rebuildToken;
  await ensureFont();
  if (token !== rebuildToken) return;
  const homes = buildGlyphHomes(font, textInput.value || 'HUM', {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.56,
    originY: window.innerHeight * 0.56,
    letterSpacing: 22,
    maxPoints: 190
  });
  const colors = (PALETTES[paletteInput.value] || PALETTES.volt).lines;
  particles = homes.map((home, index) => {
    const p = new Particle();
    p.x = home.x + (Math.random() - 0.5) * 40;
    p.y = home.y + (Math.random() - 0.5) * 40;
    p.vx = (Math.random() - 0.5) * 2;
    p.vy = (Math.random() - 0.5) * 2;
    p.width = 4;
    p.height = 4;
    p.damp = 0.93;
    p.bounce = -0.65;
    p.maxSpeed = 12;
    p.wander = Number(wanderInput.value) * 0.02;
    p.setBounds({ xMin: 0, yMin: 0, xMax: window.innerWidth, yMax: window.innerHeight });
    p.setEdgeBehavior('bounce');
    p.turnToPath(true);
    p.homeX = home.x;
    p.homeY = home.y;
    p.phase = index * 0.21;
    p.color = colors[index % colors.length];
    return p;
  });
  particleChip.textContent = `${particles.length} lines`;
}

function drawFrame(time) {
  const palette = PALETTES[paletteInput.value] || PALETTES.volt;
  ctx.fillStyle = `${palette.bg}${Number(trailInput.value) / 100})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const baseLength = Number(lengthInput.value);
  const vibe = Number(vibeInput.value);

  for (const p of particles) {
    const spring = Number(springInput.value) * 0.0014;
    const hum = Math.sin(time * 0.004 + p.phase) * vibe;
    p.__springClips = [{ clip: { x: p.homeX, y: p.homeY }, k: spring }];
    p.wander = Number(wanderInput.value) * 0.02;
    p.xMouse = mouse.x;
    p.yMouse = mouse.y;
    p.repelMouse = mouse.active;
    p.repelMouseMinDist = 72;
    p.repelMouseK = 0.1;
    p.update();

    const angle = p.rotation + Math.sin(time * 0.006 + p.phase) * 0.7;
    const length = baseLength + hum;
    const dx = Math.cos(angle) * length;
    const dy = Math.sin(angle) * length;
    const nx = Math.cos(angle + Math.PI * 0.5) * hum * 0.45;
    const ny = Math.sin(angle + Math.PI * 0.5) * hum * 0.45;

    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x - dx - nx, p.y - dy - ny);
    ctx.lineTo(p.x + dx + nx, p.y + dy + ny);
    ctx.stroke();
  }
}

function animate(time) {
  drawFrame(time);
  requestAnimationFrame(animate);
}

[fontSelect, textInput, scaleInput, paletteInput].forEach((el) => el.addEventListener('input', rebuild));
[lengthInput, vibeInput, springInput, wanderInput, trailInput].forEach((el) => el.addEventListener('input', () => {}));
window.addEventListener('resize', () => { resizeCanvas(canvas, ctx); rebuild(); });

resizeCanvas(canvas, ctx);
rebuild();
requestAnimationFrame(animate);

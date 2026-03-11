import { Particle } from '../../dist/utils/Particle.js';
import { FontParser, bindMouse, buildGlyphHomes, randomBetween, resizeCanvas, wireFoldawayPanel } from './particle-common.js';

const FONT_OPTIONS = [
  { name: 'DiscoMo', url: '../../truetypefonts/DiscoMo.ttf' },
  { name: 'JoeJack', url: '../../truetypefonts/JoeJack.ttf' },
  { name: 'Quill', url: '../../truetypefonts/Quill.ttf' },
  { name: 'AUGIE', url: '../../truetypefonts/AUGIE___.TTF' },
  { name: 'CARDS', url: '../../truetypefonts/CARDS.TTF' },
  { name: 'ELLO', url: '../../truetypefonts/ELLO____.TTF' },
  { name: 'Gotham Narrow Ultra', url: '../../truetypefonts/GothamNarrow-Ultra.otf' },
  { name: 'Source Sans 3', url: '../../truetypefonts/curated/SourceSans3-Regular.otf' },
  { name: 'Playwrite GB S Variable', url: '../../truetypefonts/Playwrite_GB_S/PlaywriteGBS-VariableFont_wght.ttf' },
  { name: 'Noto Sans', url: '../../truetypefonts/noto/NotoSans-Regular.ttf' }
];

const PALETTES = {
  ember: ['#ff6b6b', '#ffb347', '#ffe66d'],
  lagoon: ['#6fffe9', '#5bc0eb', '#9cf6f6'],
  dusk: ['#c084fc', '#7c83fd', '#f9a8d4']
};

const THEME = {
  title: 'Particle p22',
  subtitle: 'Free-falling particles get caught by the glyph and keep fluttering around their anchor points.',
  background: 'radial-gradient(circle at 18% 10%, rgba(255,120,84,0.18), transparent 24%), radial-gradient(circle at 86% 14%, rgba(111,196,255,0.14), transparent 24%), linear-gradient(180deg, #081019 0%, #101925 100%)',
  panel: 'rgba(11, 18, 30, 0.82)',
  line: 'rgba(138, 183, 255, 0.18)',
  ink: '#eff6ff',
  muted: '#96a9c4'
};

function injectStyles() {
  let style = document.getElementById('particle-p22-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'particle-p22-style';
    document.head.appendChild(style);
  }
  style.textContent = `
    :root { --ink:${THEME.ink}; --muted:${THEME.muted}; --line:${THEME.line}; --panel:${THEME.panel}; }
    * { box-sizing:border-box; }
    body { margin:0; overflow:hidden; color:var(--ink); font-family:"IBM Plex Sans", system-ui, sans-serif; background:${THEME.background}; }
    .panel { position:fixed; top:58px; left:14px; z-index:10; width:min(245px, calc(100vw - 28px)); max-height:calc(100vh - 74px); overflow-y:auto; display:grid; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--line); background:var(--panel); }
    .panel.collapsed .panelBody { display:none; }
    .bar { display:flex; justify-content:space-between; gap:8px; }
    .title strong { display:block; margin-bottom:4px; font-size:20px; letter-spacing:-0.03em; }
    .title span { color:var(--muted); font-size:12px; line-height:1.35; }
    .actions { display:flex; gap:6px; }
    .actions button { border:1px solid var(--line); border-radius:999px; padding:6px 10px; color:var(--ink); background:rgba(255,255,255,0.05); font:inherit; cursor:pointer; }
    .grid { display:grid; grid-template-columns:1fr; gap:8px; }
    label { display:grid; gap:4px; color:var(--muted); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; }
    input, select { width:100%; border:1px solid var(--line); border-radius:12px; padding:10px 12px; color:var(--ink); background:rgba(255,255,255,0.06); font:inherit; }
    input[type="range"] { padding:0; accent-color:#ffb347; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { padding:5px 10px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,0.05); color:var(--muted); font-size:12px; }
    canvas { display:block; width:100vw; height:100vh; }
  `;
}

function buildMarkup() {
  document.body.innerHTML += `
    <section class="panel" id="panel">
      <div class="bar">
        <div class="title">
          <strong>${THEME.title}</strong>
          <span>${THEME.subtitle}</span>
        </div>
        <div class="actions">
          <button id="randomizeButton" type="button">Shuffle</button>
          <button id="togglePanelButton" type="button">Hide</button>
        </div>
      </div>
      <div class="panelBody">
        <div class="grid">
          <label>Font<select id="fontSelect"></select></label>
          <label>Text<input id="textInput" value="RAIN" maxlength="4" /></label>
          <label>Scale<input id="scaleInput" type="range" min="16" max="34" value="23" /></label>
          <label>Particle Size<input id="particleSizeInput" type="range" min="0.5" max="3.5" step="0.1" value="1.6" /></label>
          <label>Catch Strength<input id="springInput" type="range" min="4" max="20" value="10" /></label>
          <label>Fall Speed<input id="fallInput" type="range" min="1" max="12" value="5" /></label>
          <label>Flutter<input id="wanderInput" type="range" min="0" max="16" value="5" /></label>
          <label>Trail<input id="trailInput" type="range" min="6" max="20" value="10" /></label>
          <label>Palette<select id="paletteInput"><option value="ember">Ember</option><option value="lagoon">Lagoon</option><option value="dusk">Dusk</option></select></label>
          <label>Mouse<select id="mouseModeInput"><option value="attract">Attract</option><option value="repel">Repel</option><option value="off">Off</option></select></label>
        </div>
        <div class="chips">
          <div class="chip" id="particleChip">0 particles</div>
          <div class="chip" id="fontChip">loading…</div>
        </div>
      </div>
    </section>
    <canvas id="stage"></canvas>
  `;
}

injectStyles();
buildMarkup();

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const fontSelect = document.getElementById('fontSelect');
const textInput = document.getElementById('textInput');
const scaleInput = document.getElementById('scaleInput');
const particleSizeInput = document.getElementById('particleSizeInput');
const springInput = document.getElementById('springInput');
const fallInput = document.getElementById('fallInput');
const wanderInput = document.getElementById('wanderInput');
const trailInput = document.getElementById('trailInput');
const paletteInput = document.getElementById('paletteInput');
const mouseModeInput = document.getElementById('mouseModeInput');
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
  particleSizeInput.value = String(randomBetween(1.1, 2.6, 0.1));
  springInput.value = String(randomBetween(8, 16));
  fallInput.value = String(randomBetween(3, 9));
  wanderInput.value = String(randomBetween(2, 10));
  trailInput.value = String(randomBetween(8, 16));
  paletteInput.value = ['ember', 'lagoon', 'dusk'][randomBetween(0, 2)];
  mouseModeInput.value = ['attract', 'repel', 'off'][randomBetween(0, 2)];
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
  const homes = buildGlyphHomes(font, textInput.value || 'RAIN', {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.56,
    originY: window.innerHeight * 0.58,
    letterSpacing: 18,
    maxPoints: 420
  });
  const palette = PALETTES[paletteInput.value] || PALETTES.ember;
  particles = homes.map((home, index) => {
    const p = new Particle();
    p.x = home.x + (Math.random() - 0.5) * 140;
    p.y = -Math.random() * window.innerHeight;
    p.vx = (Math.random() - 0.5) * 1.2;
    p.vy = 2 + Math.random() * 2;
    p.width = 4;
    p.height = 4;
    p.damp = 0.94;
    p.bounce = -0.65;
    p.maxSpeed = 18;
    p.setBounds({ xMin: 0, yMin: -40, xMax: window.innerWidth, yMax: window.innerHeight });
    p.setEdgeBehavior('bounce');
    p.homeX = home.x;
    p.homeY = home.y;
    p.color = palette[index % palette.length];
    p.phase = index * 0.11;
    return p;
  });
  particleChip.textContent = `${particles.length} particles`;
}

function updateForces(time) {
  const spring = Number(springInput.value) * 0.0012;
  const fall = Number(fallInput.value) * 0.015;
  const wander = Number(wanderInput.value) * 0.02;
  const mouseMode = mouseModeInput.value;
  for (const p of particles) {
    p.__springClips = [{ clip: { x: p.homeX, y: p.homeY + Math.sin(time * 0.001 + p.phase) * 2 }, k: spring }];
    p.grav = fall;
    p.wander = wander;
    p.xMouse = mouse.x;
    p.yMouse = mouse.y;
    p.gravToMouse = mouse.active && mouseMode === 'attract';
    p.gravMouseForce = 1200;
    p.repelMouse = mouse.active && mouseMode === 'repel';
    p.repelMouseMinDist = 84;
    p.repelMouseK = 0.14;
  }
}

function drawFrame() {
  ctx.fillStyle = `rgba(8, 16, 25, ${Number(trailInput.value) / 100})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const radius = Number(particleSizeInput.value);
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function animate(time) {
  updateForces(time);
  for (const p of particles) p.update();
  drawFrame();
  requestAnimationFrame(animate);
}

[fontSelect, textInput, scaleInput, paletteInput].forEach((el) => el.addEventListener('input', rebuild));
[particleSizeInput, springInput, fallInput, wanderInput, trailInput, mouseModeInput].forEach((el) => el.addEventListener('input', () => {}));
window.addEventListener('resize', () => { resizeCanvas(canvas, ctx); rebuild(); });

resizeCanvas(canvas, ctx);
rebuild();
requestAnimationFrame(animate);

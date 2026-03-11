import { Particle } from '../../dist/utils/Particle.js';
import { FontParser, bindMouse, buildGlyphHomes, randomBetween, resizeCanvas, wireFoldawayPanel } from './particle-common.js';

const FONT_OPTIONS = [
  { name: 'Quill', url: '../../truetypefonts/Quill.ttf' },
  { name: 'Source Serif 4 Variable', url: '../../truetypefonts/OTF/source-serif4/SourceSerif4Variable-Roman.otf' },
  { name: 'JoeJack', url: '../../truetypefonts/JoeJack.ttf' },
  { name: 'Source Sans 3', url: '../../truetypefonts/curated/SourceSans3-Regular.otf' },
  { name: 'Playwrite GB S Variable', url: '../../truetypefonts/Playwrite_GB_S/PlaywriteGBS-VariableFont_wght.ttf' },
  { name: 'Aims in your Life', url: '../../truetypefonts/Aims in your Life normal.ttf' }
];

const PALETTES = {
  pearl: ['#fef3c7', '#e0f2fe', '#f5d0fe'],
  forest: ['#b7f7d8', '#84dcc6', '#95a78d'],
  ember: ['#fed7aa', '#fdba74', '#fca5a5']
};

document.body.innerHTML += `
  <style>
    :root { --ink:#f7fafc; --muted:#a9b8c8; --line:rgba(150,193,255,0.14); --panel:rgba(9,13,25,0.78); }
    * { box-sizing:border-box; }
    body { margin:0; overflow:hidden; color:var(--ink); font-family:"IBM Plex Sans", system-ui, sans-serif; background:radial-gradient(circle at 30% 16%, rgba(170,218,255,0.12), transparent 26%), linear-gradient(180deg, #060a14 0%, #0b1320 100%); }
    .panel { position:fixed; top:58px; left:14px; z-index:10; width:min(230px, calc(100vw - 28px)); max-height:calc(100vh - 74px); overflow-y:auto; display:grid; gap:10px; padding:12px; border-radius:18px; border:1px solid var(--line); background:var(--panel); }
    .panel.collapsed .panelBody { display:none; }
    .bar { display:flex; justify-content:space-between; gap:8px; }
    .title strong { display:block; margin-bottom:4px; font-size:20px; letter-spacing:-0.03em; }
    .title span { color:var(--muted); font-size:12px; line-height:1.35; }
    .actions { display:flex; gap:6px; }
    .actions button { border:1px solid var(--line); border-radius:999px; padding:6px 10px; color:var(--ink); background:rgba(255,255,255,0.05); font:inherit; cursor:pointer; }
    .grid { display:grid; gap:8px; }
    label { display:grid; gap:4px; color:var(--muted); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; }
    input, select { width:100%; border:1px solid var(--line); border-radius:12px; padding:10px 12px; color:var(--ink); background:rgba(255,255,255,0.06); font:inherit; }
    input[type="range"] { padding:0; accent-color:#e0f2fe; }
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
    .chip { padding:5px 10px; border-radius:999px; border:1px solid var(--line); background:rgba(255,255,255,0.05); color:var(--muted); font-size:12px; }
    canvas { display:block; width:100vw; height:100vh; }
  </style>
  <section class="panel" id="panel">
    <div class="bar">
      <div class="title">
        <strong>Particle p23</strong>
        <span>Ambient drift with periodic gather pulses. It spends most of its time not behaving like a logo.</span>
      </div>
      <div class="actions">
        <button id="randomizeButton" type="button">Shuffle</button>
        <button id="togglePanelButton" type="button">Hide</button>
      </div>
    </div>
    <div class="panelBody">
      <div class="grid">
        <label>Font<select id="fontSelect"></select></label>
        <label>Text<input id="textInput" value="TIDE" maxlength="4" /></label>
        <label>Scale<input id="scaleInput" type="range" min="16" max="34" value="22" /></label>
        <label>Particle Size<input id="particleSizeInput" type="range" min="0.4" max="2.6" step="0.1" value="1.2" /></label>
        <label>Gather<input id="pulseInput" type="range" min="2" max="20" value="10" /></label>
        <label>Drift<input id="wanderInput" type="range" min="0" max="16" value="7" /></label>
        <label>Trail<input id="trailInput" type="range" min="6" max="22" value="14" /></label>
        <label>Palette<select id="paletteInput"><option value="pearl">Pearl</option><option value="forest">Forest</option><option value="ember">Ember</option></select></label>
      </div>
      <div class="chips"><div class="chip" id="particleChip">0 particles</div><div class="chip" id="fontChip">loading…</div></div>
    </div>
  </section>
  <canvas id="stage"></canvas>
`;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const fontSelect = document.getElementById('fontSelect');
const textInput = document.getElementById('textInput');
const scaleInput = document.getElementById('scaleInput');
const particleSizeInput = document.getElementById('particleSizeInput');
const pulseInput = document.getElementById('pulseInput');
const wanderInput = document.getElementById('wanderInput');
const trailInput = document.getElementById('trailInput');
const paletteInput = document.getElementById('paletteInput');
const particleChip = document.getElementById('particleChip');
const fontChip = document.getElementById('fontChip');
const fontCache = new Map();
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
wireFoldawayPanel(document.getElementById('panel'), document.getElementById('togglePanelButton'), document.getElementById('randomizeButton'), () => {
  scaleInput.value = String(randomBetween(18, 30));
  particleSizeInput.value = String(randomBetween(0.6, 2, 0.1));
  pulseInput.value = String(randomBetween(6, 16));
  wanderInput.value = String(randomBetween(3, 11));
  trailInput.value = String(randomBetween(10, 18));
  paletteInput.value = ['pearl', 'forest', 'ember'][randomBetween(0, 2)];
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
  const homes = buildGlyphHomes(font, textInput.value || 'TIDE', {
    scale: Number(scaleInput.value) * 0.01,
    density: 1,
    originX: window.innerWidth * 0.56,
    originY: window.innerHeight * 0.56,
    letterSpacing: 22,
    maxPoints: 360
  });
  const palette = PALETTES[paletteInput.value] || PALETTES.pearl;
  particles = homes.map((home, index) => {
    const p = new Particle();
    p.x = home.x + (Math.random() - 0.5) * 180;
    p.y = home.y + (Math.random() - 0.5) * 180;
    p.vx = (Math.random() - 0.5) * 2;
    p.vy = (Math.random() - 0.5) * 2;
    p.width = 4;
    p.height = 4;
    p.damp = 0.965;
    p.bounce = -0.6;
    p.maxSpeed = 12;
    p.wander = 0.08;
    p.setBounds({ xMin: 0, yMin: 0, xMax: window.innerWidth, yMax: window.innerHeight });
    p.setEdgeBehavior('wrap');
    p.homeX = home.x;
    p.homeY = home.y;
    p.phase = index * 0.12;
    p.color = palette[index % palette.length];
    return p;
  });
  particleChip.textContent = `${particles.length} particles`;
}

function animate(time) {
  ctx.fillStyle = `rgba(6, 10, 18, ${Number(trailInput.value) / 100})`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const pulse = (Math.sin(time * 0.0008) * 0.5 + 0.5) * Number(pulseInput.value) * 0.001;
  const radius = Number(particleSizeInput.value);
  for (const p of particles) {
    p.__springClips = [{ clip: { x: p.homeX, y: p.homeY }, k: pulse }];
    p.wander = Number(wanderInput.value) * 0.02;
    p.update();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(animate);
}

[fontSelect, textInput, scaleInput, paletteInput].forEach((el) => el.addEventListener('input', rebuild));
window.addEventListener('resize', () => { resizeCanvas(canvas, ctx); rebuild(); });
resizeCanvas(canvas, ctx);
rebuild();
requestAnimationFrame(animate);

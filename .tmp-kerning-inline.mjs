
    import { FontParser } from '../dist/data/FontParser.js';
    import { getFontList } from './shared/font-catalog.js';
    import { createFontDrawer, createFontLoader, getSelectedFont } from './shared/font-ui.js';
    import { createSharedToolbar, persistInputValue } from './shared/shared-toolbar.js';
    import { CanvasRenderer } from '../dist/render/CanvasRenderer.js';

    const fontDrawerMount = document.getElementById('fontDrawerMount');
    const input = document.getElementById('textInput');
    const charsInput = document.getElementById('charsInput');
    const fontSelect = document.getElementById('fontSelect');
    const kernInput = document.getElementById('kernInput');
    const kernStrength = document.getElementById('kernStrength');
    const plainCanvas = document.getElementById('plain');
    const kernCanvas = document.getElementById('kerned');
    const kernInfo = document.getElementById('kernInfo');
    const diagnosticsEl = document.getElementById('diagnostics');
    const heatmap = document.getElementById('heatmap');
    const pairSummary = document.getElementById('pairSummary');
    const pairNegSummary = document.getElementById('pairNegSummary');
    const pairPosSummary = document.getElementById('pairPosSummary');

    const fonts = getFontList('kerning');
    const loadFont = createFontLoader(FontParser.load);
    let font = null;
    const TOOL_KEY = "tool:kerning";
    const SCRIPT_PRESETS = {
      latin: {
        text: 'AVATAR WA To VA Type Wow, Yay.',
        chars: 'AVWToY.,tafy'
      },
      arabic: {
        text: 'مرحبا بالعالم',
        chars: 'مرحبا لعم'
      },
      hebrew: {
        text: 'שלום עולם',
        chars: 'שלוםעולמ'
      },
      devanagari: {
        text: 'नमस्ते दुनिया',
        chars: 'नमस्तेदुनिय'
      },
      thai: {
        text: 'ผู้ใหญ่ ใจดี',
        chars: 'ผู้ใหญใจด'
      }
    };

    function uniqueChars(value) {
      const chars = [];
      const seen = new Set();
      for (const ch of value) {
        if (ch === ' ' || seen.has(ch)) continue;
        seen.add(ch);
        chars.push(ch);
      }
      return chars.slice(0, 14);
    }

    function sampleChars() {
      const fromInput = uniqueChars(charsInput.value);
      if (fromInput.length >= 2) return fromInput;
      const fromText = uniqueChars(input.value);
      if (fromText.length >= 2) return fromText;
      return uniqueChars('AVWToY.,tafy');
    }

    function colorFor(value, maxAbs) {
      if (!maxAbs || value === 0) return 'rgb(247, 242, 236)';
      const strength = Math.min(1, Math.abs(value) / maxAbs);
      if (value < 0) {
        const light = 92 - Math.round(strength * 44);
        return `hsl(2 58% ${light}%)`;
      }
      const light = 92 - Math.round(strength * 44);
      return `hsl(219 54% ${light}%)`;
    }

    function drawPairHeatmap(chars) {
      const matrix = [];
      let maxAbs = 0;
      for (const left of chars) {
        const row = [];
        for (const right of chars) {
          const value = font.getKerningValue(left, right) || 0;
          row.push(value);
          maxAbs = Math.max(maxAbs, Math.abs(value));
        }
        matrix.push(row);
      }

      heatmap.innerHTML = '';
      const head = document.createElement('tr');
      const corner = document.createElement('th');
      corner.textContent = 'L/R';
      corner.className = 'corner';
      head.appendChild(corner);
      for (const right of chars) {
        const th = document.createElement('th');
        th.className = 'top';
        th.textContent = right;
        head.appendChild(th);
      }
      heatmap.appendChild(head);

      for (let i = 0; i < chars.length; i++) {
        const tr = document.createElement('tr');
        const left = document.createElement('th');
        left.className = 'left';
        left.textContent = chars[i];
        tr.appendChild(left);

        for (let j = 0; j < chars.length; j++) {
          const value = matrix[i][j];
          const td = document.createElement('td');
          td.textContent = value === 0 ? '' : String(value);
          td.style.background = colorFor(value, maxAbs);
          td.title = `${chars[i]}${chars[j]} = ${value}`;
          td.addEventListener('click', () => {
            const pair = `${chars[i]}${chars[j]}`;
            input.value = `${pair} ${pair} ${pair}`;
            render();
          });
          tr.appendChild(td);
        }
        heatmap.appendChild(tr);
      }

      const nonZero = [];
      for (let i = 0; i < chars.length; i++) {
        for (let j = 0; j < chars.length; j++) {
          const value = matrix[i][j];
          if (value !== 0) nonZero.push({ pair: `${chars[i]}${chars[j]}`, value });
        }
      }
      nonZero.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
      const top = nonZero.slice(0, 10).map(p => `${p.pair}:${p.value}`).join(' | ');
      pairSummary.textContent = nonZero.length > 0
        ? `Strongest pairs in grid: ${top}`
        : 'No non-zero kerning pairs for this character set.';
      const negatives = nonZero.filter((p) => p.value < 0).sort((a, b) => a.value - b.value).slice(0, 8);
      const positives = nonZero.filter((p) => p.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);
      pairNegSummary.textContent = negatives.length
        ? `Largest negative: ${negatives.map((p) => `${p.pair}:${p.value}`).join(' | ')}`
        : 'Largest negative: none';
      pairPosSummary.textContent = positives.length
        ? `Largest positive: ${positives.map((p) => `${p.pair}:${p.value}`).join(' | ')}`
        : 'Largest positive: none';
    }

    function drawPreviews(text, scale) {
      const plainCtx = plainCanvas.getContext('2d');
      const kernCtx = kernCanvas.getContext('2d');
      plainCtx.clearRect(0, 0, plainCanvas.width, plainCanvas.height);
      kernCtx.clearRect(0, 0, kernCanvas.width, kernCanvas.height);

      CanvasRenderer.drawString(font, text, plainCanvas, {
        x: 20, y: 138, scale: 0.12, spacing: 2, styles: { fillStyle: '#111', strokeStyle: '#111' }
      });
      CanvasRenderer.drawStringWithKerning(font, text, kernCanvas, {
        x: 20, y: 138, scale: 0.12, spacing: 2, kerningScale: scale, styles: { fillStyle: '#111', strokeStyle: '#111' }
      });

      plainCtx.fillStyle = '#6a6058';
      plainCtx.font = '14px Baskervville, serif';
      plainCtx.fillText('Raw spacing', 20, 24);
      kernCtx.fillStyle = '#6a6058';
      kernCtx.font = '14px Baskervville, serif';
      kernCtx.fillText('With kerning', 20, 24);
    }

    function render() {
      if (!font) return;
      if (typeof font.clearDiagnostics === 'function') {
        font.clearDiagnostics();
      }
      const text = input.value || 'AV';
      const scale = Number(kernInput.value);
      kernStrength.textContent = `x${scale.toFixed(2)}`;
      drawPreviews(text, scale);

      const chars = sampleChars();
      drawPairHeatmap(chars);

      const seen = [];
      for (let i = 0; i < text.length - 1; i++) {
        const pair = `${text[i]}${text[i + 1]}`;
        const value = font.getKerningValue(text[i], text[i + 1]) || 0;
        if (value !== 0) seen.push(`${pair}:${value}`);
      }
      const kernTable = font.getTableByType?.(0x6b65726e);
      const gposTable = font.getTableByType?.(0x47504f53);
      const tables = `kern:${kernTable ? 'yes' : 'no'} gpos:${gposTable ? 'yes' : 'no'}`;
      const measured = typeof font.measureText === 'function'
        ? font.measureText(text, { gpos: true })
        : null;
      kernInfo.textContent = seen.length > 0
        ? `Pairs in preview text: ${seen.join(' | ')} | ${tables}${measured ? ` | advance:${Math.round(measured.advanceWidth)}` : ''}`
        : `No kerning pairs detected in preview text. | ${tables}${measured ? ` | advance:${Math.round(measured.advanceWidth)}` : ''}`;

      const diagnostics = typeof font.getDiagnostics === 'function' ? font.getDiagnostics() : [];
      diagnosticsEl.textContent = diagnostics.length
        ? diagnostics.slice(0, 16).map(d => `[${d.phase}/${d.level}] ${d.code}: ${d.message}`).join('\n')
        : 'No diagnostics.';
    }

    input.addEventListener('input', render);
    charsInput.addEventListener('input', render);
    kernInput.addEventListener('input', render);
    persistInputValue(input, TOOL_KEY, "text");
    persistInputValue(charsInput, TOOL_KEY, "chars");
    persistInputValue(kernInput, TOOL_KEY, "scale");
    const savedFontIndexRaw = localStorage.getItem(`${TOOL_KEY}:font`);
    const savedFontIndex = Number.isFinite(Number(savedFontIndexRaw)) ? Number(savedFontIndexRaw) : 0;

    createFontDrawer({
      mount: fontDrawerMount,
      select: fontSelect,
      fonts,
      allowUrl: true,
      title: 'Font'
    });

    createSharedToolbar({
      mount: document.body,
      fontSelect,
      includeFontSelect: false,
      scriptOptions: [
        { value: "latin", label: "Latin" },
        { value: "arabic", label: "Arabic" },
        { value: "hebrew", label: "Hebrew" },
        { value: "devanagari", label: "Devanagari" },
        { value: "thai", label: "Thai" }
      ],
      onScriptChange: (value) => {
        const preset = SCRIPT_PRESETS[value] || SCRIPT_PRESETS.latin;
        input.value = preset.text;
        charsInput.value = preset.chars;
        render();
      },
      getExportData: () => ({
        tool: "kerning",
        text: input.value,
        chars: charsInput.value,
        kerningScale: Number(kernInput.value),
        diagnostics: typeof font?.getDiagnostics === 'function' ? font.getDiagnostics() : []
      }),
      exportFilename: "kerning-report.json",
      getDiagnosticsText: () => diagnosticsEl.textContent || "No diagnostics."
    });

    if (fonts.length > 0) {
      fontSelect.value = String(Math.max(0, Math.min(savedFontIndex, fonts.length - 1)));
    }

    async function loadAndRender() {
      try {
        const selected = getSelectedFont(fontSelect, fonts);
        font = await loadFont(selected.url);
        localStorage.setItem(`${TOOL_KEY}:font`, fontSelect.value);
        render();
      } catch (err) {
        kernInfo.textContent = `Failed to load font: ${err?.message ?? err}`;
      }
    }

    fontSelect.addEventListener('change', loadAndRender);
    loadAndRender();
  </script>
  <script type="module" src="../tools/shared/main-nav.js">
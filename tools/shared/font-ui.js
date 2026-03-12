function ensureFontUiStyles() {
  if (document.getElementById("sharedFontUiStyles")) return;
  const style = document.createElement("style");
  style.id = "sharedFontUiStyles";
  style.textContent = `
    .font-source-ui {
      display: grid;
      gap: 4px;
      margin-top: 6px;
    }
    .font-source-ui input[type="file"] {
      width: 100%;
      min-width: 0;
      max-width: 100%;
    }
    .font-source-note {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.35;
    }
    .font-drawer {
      position: sticky;
      top: 0;
      z-index: 25;
      display: grid;
      justify-items: start;
      margin: 0 24px 14px;
      pointer-events: none;
    }
    .font-drawer-tabs {
      display: flex;
      align-items: start;
      gap: 8px;
      pointer-events: auto;
    }
    .font-drawer-tab {
      border: 1px solid rgba(66, 76, 96, 0.28);
      border-bottom: none;
      background: rgba(255, 255, 255, 0.94);
      color: #233044;
      border-radius: 0 0 12px 12px;
      padding: 8px 11px 9px;
      font: 700 15px/1 serif;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(20, 30, 60, 0.12);
      transition: transform 180ms ease, box-shadow 180ms ease;
      pointer-events: auto;
      position: relative;
      text-decoration: none;
    }
    .font-drawer-panel {
      width: min(1080px, calc(100vw - 48px));
      display: grid;
      gap: 14px;
      align-items: end;
      grid-template-columns: minmax(220px, 1.1fr) minmax(260px, 1.2fr) minmax(340px, 1.7fr);
      padding: 14px 16px;
      margin-top: 2px;
      border: 1px solid rgba(66, 76, 96, 0.2);
      border-radius: 14px 0 14px 14px;
      background: rgba(255, 255, 255, 0.97);
      box-shadow: 0 18px 36px rgba(20, 30, 60, 0.16);
      transform-origin: top left;
      transform: translateY(0);
      opacity: 1;
      max-height: 220px;
      overflow: hidden;
      transition: transform 220ms ease, opacity 220ms ease, max-height 220ms ease, padding 220ms ease, margin-top 220ms ease;
      pointer-events: auto;
    }
    .font-drawer:not(.open) .font-drawer-panel {
      transform: translateY(-14px);
      opacity: 0;
      max-height: 0;
      padding-top: 0;
      padding-bottom: 0;
      margin-top: 0;
      pointer-events: none;
      border-width: 0 1px 1px;
    }
    .font-drawer:not(.open) .font-drawer-tab {
      transform: translateY(-1px);
      box-shadow: 0 6px 14px rgba(20, 30, 60, 0.1);
    }
    .font-drawer-group {
      display: grid;
      gap: 6px;
      min-width: 0;
    }
    .font-drawer-group--url {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
      gap: 8px;
    }
    .font-drawer-group--url label {
      grid-column: 1 / -1;
    }
    .font-drawer-group label {
      font: 600 11px/1.2 sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #5a6477;
    }
    .font-drawer-group input,
    .font-drawer-group select,
    .font-drawer-group button {
      width: 100%;
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      border: 1px solid #d8dce5;
      border-radius: 10px;
      background: #fcfcfd;
      color: #1f2b3a;
      padding: 9px 10px;
      font: 14px/1.2 sans-serif;
    }
    .font-drawer-group input[type="file"] {
      overflow: hidden;
      padding: 7px 8px;
    }
    .font-drawer-group button {
      cursor: pointer;
      background: #243144;
      color: #fff;
      border-color: #243144;
      font-weight: 700;
    }
    .font-drawer-group--url button {
      width: 116px;
    }
  `;
  document.head.appendChild(style);
}

function revokeCustomUrl(control) {
  if (control?.customUrl) URL.revokeObjectURL(control.customUrl);
  if (control) {
    control.customUrl = null;
    control.customName = null;
  }
}

function getStorageKey(select) {
  return `font-source:${select.id || "font"}`;
}

function ensureFontSourceControl(select) {
  if (!select || select.__fontSourceControl) return select?.__fontSourceControl || null;
  if (select?.dataset?.fontSourceUi === "off") return null;
  ensureFontUiStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "font-source-ui";
  wrapper.innerHTML = `
    <input type="file" accept=".ttf,.otf,.woff,.woff2" />
    <div class="font-source-note">Or pick a local font file.</div>
  `;

  const fileInput = wrapper.querySelector('input[type="file"]');
  const note = wrapper.querySelector(".font-source-note");
  const control = {
    fileInput,
    note,
    customUrl: null,
    customName: null,
    getSelectedFont(fonts) {
      if (this.customUrl) {
        return {
          name: this.customName || "Custom font",
          url: this.customUrl,
          isCustom: true
        };
      }
      const selectedIndex = Number(select.value);
      return fonts[selectedIndex] ?? fonts[0];
    },
    updateUi() {
      if (this.customUrl) {
        note.textContent = this.customName
          ? `Using local file: ${this.customName}`
          : "Choose a local .ttf, .otf, .woff, or .woff2 file.";
      } else {
        note.textContent = "Or pick a local font file.";
      }
    }
  };

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      revokeCustomUrl(control);
      control.updateUi();
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    revokeCustomUrl(control);
    control.customUrl = URL.createObjectURL(file);
    control.customName = file.name;
    control.updateUi();
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  select.addEventListener("change", (event) => {
    if ((control.customUrl || fileInput.value) && event.isTrusted) {
      revokeCustomUrl(control);
      fileInput.value = "";
      control.updateUi();
    }
  });

  select.insertAdjacentElement("afterend", wrapper);
  select.__fontSourceControl = control;
  control.updateUi();
  return control;
}

export function attachFontSourceControl(select) {
  return ensureFontSourceControl(select);
}

function setQueryFontUrl(value) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("fontUrl", value);
  else url.searchParams.delete("fontUrl");
  window.history.replaceState({}, "", url);
}

function deriveDisplayNameFromUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    const part = parsed.pathname.split("/").pop();
    return part || url;
  } catch {
    const part = String(url).split("/").pop();
    return part || String(url);
  }
}

export function createFontDrawer({
  mount,
  select,
  fonts,
  allowUrl = false,
  title = "Font"
}) {
  if (!select) return null;
  ensureFontUiStyles();
  select.dataset.fontSourceUi = "off";
  populateFontSelect(select, fonts);
  select.hidden = true;

  const host = mount || document.body;
  const drawer = document.createElement("div");
  drawer.className = "font-drawer";
  drawer.innerHTML = `
    <div class="font-drawer-tabs">
      <a class="font-drawer-tab" href="./index.html" aria-label="Back to tools home">🔧</a>
      <button type="button" class="font-drawer-tab" aria-label="Toggle font drawer">Aa</button>
    </div>
    <div class="font-drawer-panel">
      <div class="font-drawer-group">
        <label>${title} Catalog</label>
      </div>
      <div class="font-drawer-group">
        <label>Local File</label>
        <input type="file" accept=".ttf,.otf,.woff,.woff2" />
      </div>
      ${allowUrl ? `
      <div class="font-drawer-group font-drawer-group--url">
        <label>Font URL</label>
        <input type="text" placeholder="https://.../font.woff" />
        <button type="button">Load URL</button>
      </div>
      ` : ``}
    </div>
  `;

  const tab = drawer.querySelector('button.font-drawer-tab');
  const panel = drawer.querySelector(".font-drawer-panel");
  const catalogGroup = drawer.querySelector(".font-drawer-group");
  const fileInput = drawer.querySelector('input[type="file"]');
  const urlInput = allowUrl ? panel.querySelector('input[type="text"]') : null;
  const urlButton = allowUrl ? panel.querySelector('button[type="button"]') : null;

  catalogGroup.appendChild(select);
  select.hidden = false;

  const control = {
    customUrl: null,
    customName: null,
    getSelectedFont(currentFonts) {
      if (this.customUrl) {
        return {
          name: this.customName || "Custom font",
          url: this.customUrl,
          isCustom: true
        };
      }
      return currentFonts[Number(select.value)] ?? currentFonts[0];
    }
  };
  select.__fontDrawerControl = control;

  tab.addEventListener("click", () => {
    drawer.classList.toggle("open");
  });

  select.addEventListener("change", (event) => {
    if (!event.isTrusted) return;
    if (control.customUrl) {
      revokeCustomUrl(control);
    }
    if (fileInput) fileInput.value = "";
    if (urlInput) urlInput.value = "";
    setQueryFontUrl("");
  });

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      revokeCustomUrl(control);
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    revokeCustomUrl(control);
    control.customUrl = URL.createObjectURL(file);
    control.customName = file.name;
    if (urlInput) urlInput.value = "";
    setQueryFontUrl("");
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  const loadUrl = () => {
    const value = urlInput?.value.trim();
    if (!value) return;
    revokeCustomUrl(control);
    control.customUrl = value;
    control.customName = deriveDisplayNameFromUrl(value);
    if (fileInput) fileInput.value = "";
    setQueryFontUrl(value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };
  urlButton?.addEventListener("click", loadUrl);
  urlInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadUrl();
    }
  });

  if (allowUrl) {
    const initialUrl = new URL(window.location.href).searchParams.get("fontUrl")?.trim();
    if (initialUrl) {
      control.customUrl = initialUrl;
      control.customName = deriveDisplayNameFromUrl(initialUrl);
      if (urlInput) urlInput.value = initialUrl;
      drawer.classList.add("open");
    }
  }
  host.prepend(drawer);
  return control;
}

export function populateFontSelect(select, fonts) {
  select.innerHTML = "";
  fonts.forEach((font, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = font.name;
    select.appendChild(option);
  });
  ensureFontSourceControl(select);
}

export function getSelectedFont(select, fonts) {
  const drawerControl = select?.__fontDrawerControl;
  if (drawerControl) return drawerControl.getSelectedFont(fonts);
  const control = ensureFontSourceControl(select);
  return control ? control.getSelectedFont(fonts) : (fonts[Number(select.value)] ?? fonts[0]);
}

export function createFontLoader(loadFontFn) {
  const cache = new Map();
  return async function loadFont(url) {
    if (cache.has(url)) return cache.get(url);
    const font = await loadFontFn(url);
    cache.set(url, font);
    return font;
  };
}

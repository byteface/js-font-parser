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

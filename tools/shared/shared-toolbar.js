function toKey(storageKey, suffix) {
  return `${storageKey}:${suffix}`;
}

export function persistSelectValue(select, storageKey, suffix = "select") {
  if (!select || !storageKey) return;
  const key = toKey(storageKey, suffix);
  const saved = localStorage.getItem(key);
  if (saved != null) {
    const has = Array.from(select.options || []).some((opt) => opt.value === saved);
    if (has) select.value = saved;
  }
  select.addEventListener("change", () => {
    localStorage.setItem(key, select.value);
  });
}

export function persistInputValue(input, storageKey, suffix = "input") {
  if (!input || !storageKey) return;
  const key = toKey(storageKey, suffix);
  const saved = localStorage.getItem(key);
  if (saved != null) {
    input.value = saved;
  }
  input.addEventListener("input", () => {
    localStorage.setItem(key, input.value);
  });
}

export function exportJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function ensureBaseStyles() {
  if (document.getElementById("sharedToolbarStyles")) return;
  const style = document.createElement("style");
  style.id = "sharedToolbarStyles";
  style.textContent = `
    .shared-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 14px;
      margin: 10px 0 14px;
      padding: 10px 12px;
      border: 1px solid #d8dde8;
      border-radius: 10px;
      background: #ffffff;
    }
    .shared-toolbar-group {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .shared-toolbar label {
      font-size: 12px;
      color: #4a5671;
      white-space: nowrap;
    }
    .shared-toolbar button {
      cursor: pointer;
      border: 1px solid #c7cfdd;
      background: #f8faff;
      border-radius: 8px;
      padding: 7px 10px;
      color: #24324a;
    }
    .shared-toolbar pre {
      width: 100%;
      margin: 0;
      padding: 8px 10px;
      border: 1px solid #d8dde8;
      border-radius: 8px;
      background: #fafbfe;
      color: #4a5671;
      font-size: 12px;
      max-height: 200px;
      overflow: auto;
      white-space: pre-wrap;
      display: none;
    }
    .shared-toolbar pre.open {
      display: block;
    }
  `;
  document.head.appendChild(style);
}

export function createSharedToolbar({
  mount,
  fontSelect,
  sizeInput = null,
  scriptOptions = [],
  onScriptChange = null,
  getExportData = null,
  exportFilename = "tool-export.json",
  getDiagnosticsText = null
}) {
  ensureBaseStyles();
  const host = mount || document.body;
  const bar = document.createElement("div");
  bar.className = "shared-toolbar";

  function makeMirroredSelect(source) {
    const mirror = source.cloneNode(true);
    mirror.id = `${source.id || "fontSelect"}ToolbarMirror`;
    mirror.value = source.value;
    mirror.addEventListener("change", () => {
      source.value = mirror.value;
      source.dispatchEvent(new Event("change", { bubbles: true }));
    });
    source.addEventListener("change", () => {
      if (mirror.value !== source.value) mirror.value = source.value;
    });
    return mirror;
  }

  function makeMirroredRange(source) {
    const mirror = source.cloneNode(true);
    mirror.id = `${source.id || "sizeInput"}ToolbarMirror`;
    mirror.value = source.value;
    mirror.addEventListener("input", () => {
      source.value = mirror.value;
      source.dispatchEvent(new Event("input", { bubbles: true }));
    });
    source.addEventListener("input", () => {
      if (mirror.value !== source.value) mirror.value = source.value;
    });
    return mirror;
  }

  if (fontSelect) {
    const group = document.createElement("div");
    group.className = "shared-toolbar-group";
    const label = document.createElement("label");
    label.textContent = "Font";
    group.appendChild(label);
    group.appendChild(makeMirroredSelect(fontSelect));
    bar.appendChild(group);
  }

  let scriptSelect = null;
  if (Array.isArray(scriptOptions) && scriptOptions.length > 0) {
    const group = document.createElement("div");
    group.className = "shared-toolbar-group";
    const label = document.createElement("label");
    label.textContent = "Script";
    scriptSelect = document.createElement("select");
    scriptOptions.forEach((item, idx) => {
      const opt = document.createElement("option");
      opt.value = item.value ?? String(idx);
      opt.textContent = item.label ?? String(item.value ?? idx);
      scriptSelect.appendChild(opt);
    });
    scriptSelect.addEventListener("change", () => {
      onScriptChange?.(scriptSelect.value);
    });
    group.appendChild(label);
    group.appendChild(scriptSelect);
    bar.appendChild(group);
  }

  if (sizeInput) {
    const group = document.createElement("div");
    group.className = "shared-toolbar-group";
    const label = document.createElement("label");
    label.textContent = "Size";
    group.appendChild(label);
    group.appendChild(makeMirroredRange(sizeInput));
    bar.appendChild(group);
  }

  const actions = document.createElement("div");
  actions.className = "shared-toolbar-group";
  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.textContent = "Export JSON";
  exportBtn.addEventListener("click", () => {
    const payload = getExportData?.();
    if (!payload) return;
    exportJsonFile(exportFilename, payload);
  });
  actions.appendChild(exportBtn);

  const diagBtn = document.createElement("button");
  diagBtn.type = "button";
  diagBtn.textContent = "Diagnostics";
  actions.appendChild(diagBtn);
  bar.appendChild(actions);

  const diag = document.createElement("pre");
  bar.appendChild(diag);
  diagBtn.addEventListener("click", () => {
    const open = diag.classList.toggle("open");
    if (open) {
      const text = getDiagnosticsText?.() || "No diagnostics.";
      diag.textContent = text;
    }
  });

  host.prepend(bar);
  return {
    bar,
    scriptSelect,
    refreshDiagnostics() {
      if (diag.classList.contains("open")) {
        diag.textContent = getDiagnosticsText?.() || "No diagnostics.";
      }
    }
  };
}

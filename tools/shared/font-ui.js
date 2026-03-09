export function populateFontSelect(select, fonts) {
  select.innerHTML = "";
  fonts.forEach((font, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = font.name;
    select.appendChild(option);
  });
}

export function getSelectedFont(select, fonts) {
  const selectedIndex = Number(select.value);
  return fonts[selectedIndex] ?? fonts[0];
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

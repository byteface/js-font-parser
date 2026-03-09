export const DEFAULT_DEMO_FONTS = [
  { name: "Noto Sans", url: "../truetypefonts/noto/NotoSans-Regular.ttf" },
  { name: "Roboto VF", url: "../truetypefonts/curated/Roboto-VF.ttf" },
  { name: "Source Code Pro", url: "../truetypefonts/curated-extra/SourceCodePro-Regular.otf" },
  { name: "Font Awesome 4.7", url: "../truetypefonts/curated-extra/FontAwesome-4.7.0.ttf" }
];

export function populateFontSelect(select, fonts = DEFAULT_DEMO_FONTS) {
  select.innerHTML = "";
  fonts.forEach((font, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = font.name;
    select.appendChild(option);
  });
}

export function getSelectedFont(select, fonts = DEFAULT_DEMO_FONTS) {
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

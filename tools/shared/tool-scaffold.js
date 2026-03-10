import { getSelectedFont, populateFontSelect } from "./font-ui.js";

export async function loadSelectedFont(select, fonts, loadFont) {
  const selected = getSelectedFont(select, fonts);
  const font = await loadFont(selected.url);
  return { font, selected };
}

export function wireFontSelect({
  select,
  fonts,
  loadFont,
  onLoaded,
  onError,
  initialIndex = 0
}) {
  populateFontSelect(select, fonts);
  if (fonts.length > 0) {
    const safeIndex = Math.max(0, Math.min(initialIndex, fonts.length - 1));
    select.value = String(safeIndex);
  }

  const run = async () => {
    try {
      const { font, selected } = await loadSelectedFont(select, fonts, loadFont);
      await onLoaded?.(font, selected);
    } catch (error) {
      await onError?.(error, getSelectedFont(select, fonts));
    }
  };

  select.addEventListener("change", run);
  return { run };
}

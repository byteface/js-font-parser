const STATUS_STYLES = {
  info: { color: "#666", warn: false },
  success: { color: "#2f6f31", warn: false },
  warning: { color: "#9b1c1c", warn: true },
  neutral: { color: "", warn: false }
};

export function setStatus(element, text, level = "info") {
  if (!element) return;
  const style = STATUS_STYLES[level] || STATUS_STYLES.info;
  element.textContent = text ?? "";
  if (style.color) {
    element.style.color = style.color;
  } else {
    element.style.removeProperty("color");
  }
  if (element.classList) {
    element.classList.toggle("warn", !!style.warn);
  }
}

export function clearStatus(element, level = "info") {
  setStatus(element, "", level);
}

export function clearCanvas(canvas, context, fillStyle = null) {
  if (!canvas || !context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (fillStyle) {
    context.fillStyle = fillStyle;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
}

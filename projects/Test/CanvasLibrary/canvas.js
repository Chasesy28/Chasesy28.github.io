export function fillScreen(canvas) {
  canvas.style.width = "100dvw";
  canvas.style.height = "100dvh";

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));

  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

export function fillScreenOnResize(canvas) {
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => fillScreen(canvas));
  }
  window.addEventListener("resize", () => fillScreen(canvas));
  window.addEventListener("orientationchange", () => fillScreen(canvas));
}

export function setBackgroundColor(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function rgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

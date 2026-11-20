export function rect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

export function square(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

export function circle(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
  ctx.fill();
}

export function semicircle(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.ellipse(x, y, radius, radius, 0, 0, Math.PI);
  ctx.fill();
}

export function triangle(ctx, x1, y1, x2, y2, x3, y3, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

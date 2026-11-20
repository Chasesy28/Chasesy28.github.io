import { fillScreen, fillScreenOnResize, setBackgroundColor, rgb, rgba } from './canvas.js';
import { rect, square, circle, semicircle, triangle, line } from './shapes.js';

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

fillScreen(canvas);
fillScreenOnResize(canvas);

function draw() {
  setBackgroundColor(ctx, "red");

  rect(ctx, 50, 50, 200, 100, "blue");
  square(ctx, 300, 50, 100, "yellow");
  circle(ctx, 800, 300, 75, rgb(0, 255, 0));
  semicircle(ctx, 600, 300, 75, "purple");
  triangle(ctx, 400, 400, 120, 50, 35, 65, rgba(255, 255, 0, 0.5));
  line(ctx, 100, 100, 200, 200, "black", 2);

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

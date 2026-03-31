const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl2");

canvas.style.width = "100dvw";
canvas.style.height = "100dvh";
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

if (!gl) {
  alert("WebGL not supported in this browser.");
}

//Stuff from tutorials

function loop() {
  let time = performance.now() / 1000; // Time in seconds
  let x1 = Math.sin(time) * 0.5 * Math.cos(time * 0.5);
  let y1 = Math.cos(time + 1) * 0.5 * Math.cos((time + 1) * 0.5);
  let x2 = Math.sin(time + 2) * 0.5 * Math.cos((time + 2) * 0.5);
  let y2 = Math.cos(time + 3) * 0.5 * Math.cos((time + 3) * 0.5);
  let x3 = Math.sin(time + 4) * 0.5 * Math.cos((time + 4) * 0.5);
  let y3 = Math.cos(time + 5) * 0.5 * Math.cos((time + 5) * 0.5);
  triangle(x1, y1, x2, y2, x3, y3, 255, 196, 0, 1.0);
  requestAnimationFrame(loop);
}
loop();

const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl");

canvas.style.width = "100dvw";
canvas.style.height = "100dvh";
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

if (!gl) {
  alert("WebGL not supported in this browser.");
}

backgroundColor(gl, [0.0, 0.0, 0.0, 1.0]); // Set background color to black
line(gl, -0.5, -0.5, 0.5, 0.5); // Draw a diagonal line from bottom-left to top-right

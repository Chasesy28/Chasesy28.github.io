const canvas = document.getElementById("canvas");
const gl = canvas.getContext("2d");

/*canvas.style.width = "100dvw";
canvas.style.height = "100dvh";
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;*/

if (!gl) {
  alert("WebGL not supported in this browser.");
}

//backgroundColor(gl, [0.0, 0.0, 0.0, 1.0]); // Set background color to black

//gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set background color to black
//gl.clear(gl.COLOR_BUFFER_BIT); // Clear the color buffer with the specified clear color
gl.fillStyle = "red";
gl.fillRect(50, 50, 100, 100); // Draw a red square at (50, 50) with width and height of 100 pixels

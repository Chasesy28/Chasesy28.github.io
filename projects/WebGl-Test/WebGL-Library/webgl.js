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
function helloTriangle() {
  const triangleVertices = [
    //Top middle
    0.0, 0.5,
    //Bottom left
    -0.5, -0.5,
    //Bottom right
    0.5, -0.5
  ];
  const triangleVerticesCPUBuffer = new Float32Array(triangleVertices);

  const triangleGeoBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleVerticesCPUBuffer, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const vertexShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec2 vertexPosition;

  uniform vec2 canvasSize;
  uniform vec2 shapeLocation;
  uniform float shapeSize;

  void main() {
    vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
    vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

    gl_Position = vec4(clipPosition, 0.0, 1.0);
  }`;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader compilation error: " + gl.getShaderInfoLog(vertexShader));
    return;
  }

  const fragmentShaderSourceCode = `#version 300 es
  precision mediump float;

  out vec4 outputColor;

  void main() {
    outputColor = vec4(0.294, 0.0, 0.51, 1.0);
  }`;

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error("Fragment shader compilation error: " + gl.getShaderInfoLog(fragmentShader));
    return;
  }

  const triangleShaderProgram = gl.createProgram();
  gl.attachShader(triangleShaderProgram, vertexShader);
  gl.attachShader(triangleShaderProgram, fragmentShader);
  gl.linkProgram(triangleShaderProgram);
  if (!gl.getProgramParameter(triangleShaderProgram, gl.LINK_STATUS)) {
    console.error("Shader program linking error: " + gl.getProgramInfoLog(triangleShaderProgram));
    return;
  }
  const vertexPositionAttributeLocation = gl.getAttribLocation(triangleShaderProgram, "vertexPosition");
  if (vertexPositionAttributeLocation < 0) {
    console.error("Failed to get the attribute location for vertexPosition");
    return;
  }

  const shapeLocationUniform = gl.getUniformLocation(triangleShaderProgram, "shapeLocation");
  const shapeSizeUniform = gl.getUniformLocation(triangleShaderProgram, "shapeSize");
  const canvasSizeUniform = gl.getUniformLocation(triangleShaderProgram, "canvasSize");
  if (shapeLocationUniform === null || shapeSizeUniform === null || canvasSizeUniform === null) {
    console.error("Failed to get uniform locations");
    return;
  }

  // Output merger - how to merge the shaded pixel fragment with the existing output image
  /*canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;*/


  // Rasterizer - what pixels are part of a triangle
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set GPU program (vertex and fragment shader)
  gl.useProgram(triangleShaderProgram);
  gl.enableVertexAttribArray(vertexPositionAttributeLocation);

  // Input assembler - how to read vertices from our GPU triangle buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleGeoBuffer);
  gl.vertexAttribPointer(
    /*index=: which attribute to use*/
    vertexPositionAttributeLocation,
    /*size=: how many components in that attribute*/
    2,
    /*type=: what is the data type stored in the GPU buffer for this attribute*/
    gl.FLOAT,
    /*normalized=: determines how to convert ints to floats*/
    false,
    /*stride=: how many bytes to move forward into the buffer to find the same attribute for the next vertex*/
    0, //0 is automatic
    /*offset=: how many bytes should the input assembler skip into the buffer when reading attributes*/
    0
  );

  // Draw call (Primitive assembler - how to make triangles from those vertices)
  gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

  gl.uniform1f(shapeSizeUniform, 300.0);
  gl.uniform2f(shapeLocationUniform, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function loop() {
  backgroundColor(gl, 20, 20, 20, 1.0);
  let time = performance.now() / 1000; // Time in seconds
  let x1 = Math.sin(time) * 0.5 * Math.cos(time * 0.5);
  let y1 = Math.cos(time + 1) * 0.5 * Math.cos((time + 1) * 0.5);
  let x2 = Math.sin(time + 2) * 0.5 * Math.cos((time + 2) * 0.5);
  let y2 = Math.cos(time + 3) * 0.5 * Math.cos((time + 3) * 0.5);
  let x3 = Math.sin(time + 4) * 0.5 * Math.cos((time + 4) * 0.5);
  let y3 = Math.cos(time + 5) * 0.5 * Math.cos((time + 5) * 0.5);

  triangle([
    x1, y1,
    x2, y2,
    x3, y3
  ], 255, 0, 255, 1.0);
  triangle([
    x1 + 0.1, y1 + 0.1,
    x2 + 0.1, y2 + 0.1,
    x3 + 0.1, y3 + 0.1
  ], 255, 255, 0, 1.0);
  requestAnimationFrame(loop);
}
loop();

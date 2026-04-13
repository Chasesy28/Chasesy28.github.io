let shadersInitialized = false;

// Shader code adapted from tutorial and other online references
const vertexShaderSourceCode = `#version 300 es
precision mediump float;

in vec2 vertexPosition;
in vec3 vertexColor;

out vec3 fragmentColor;

uniform vec2 canvasSize;
uniform vec2 shapeLocation;
uniform float shapeSize;

void main() {
  fragmentColor = vertexColor;

  vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
  vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

  gl_Position = vec4(clipPosition * vec2(1.0, -1.0), 0.0, 1.0);
}`;

const fragmentShaderSourceCode = `#version 300 es
precision mediump float;

in vec3 fragmentColor;
out vec4 outputColor;
uniform float uAlpha;

void main() {
  outputColor = vec4(fragmentColor, uAlpha);
}`;

const squareVertices = new Float32Array([
  // Bottom left
  0, 1,
  // Top left
  0, 0,
  // Top right
  1, 0,
  // Bottom left
  0, 1,
  // Top right
  1, 0,
  // Bottom right
  1, 1
]);

function createMonochromeSquareColors(r, g, b) {
  const colors = new Uint8Array([
    r, g, b,
    r, g, b,
    r, g, b,
    r, g, b,
    r, g, b,
    r, g, b
  ]);
  return colors;
}

function createStaticVertexBuffer(gl = WebGL2RenderingContext, data = ArrayBuffer) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return buffer;
}

function createTwoBufferVAO(gl = WebGL2RenderingContext, positionBuffer = WebGLBuffer, colorBuffer = WebGLBuffer, positionAttribLocation = number, colorAttribLocation = number) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.UNSIGNED_BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  return vao;
}

function webGlBackgroundColor(r, g, b, a) {
  gl.clearColor(r/255, g/255, b/255, a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


function createShaderProgram() {
  const squareGeoBuffer = createStaticVertexBuffer(gl, squareVertices);
  if (!squareGeoBuffer) {
    console.error("Failed to create buffers");
    return null;
  }
  const squareColorBuffers = [];
  for (let key in blockTypes) {
    let colors = createMonochromeSquareColors(
      blockTypes[key].colorR,
      blockTypes[key].colorG,
      blockTypes[key].colorB
    );
    squareColorBuffers.push(colors);
  }
  for (let key in enemyTypes) {
    let colors = createMonochromeSquareColors(
      enemyTypes[key].colorR,
      enemyTypes[key].colorG,
      enemyTypes[key].colorB
    );
    squareColorBuffers.push(colors);
  }
  squareColorBuffers.push(createMonochromeSquareColors(player.r, player.g, player.b));

  for (let i = 0; i < squareColorBuffers.length; i++) {
    squareColorBuffers[i] = createStaticVertexBuffer(gl, squareColorBuffers[i]);
    if (!squareColorBuffers[i]) {
      console.error("Failed to create buffers");
      return null;
    }
  }

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader compilation error:", gl.getShaderInfoLog(vertexShader));
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error("Fragment shader compilation error:", gl.getShaderInfoLog(fragmentShader));
    return null;
  }

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Shader program linking error:", gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  const positionAttribLocation = gl.getAttribLocation(shaderProgram, "vertexPosition");
  const colorAttribLocation = gl.getAttribLocation(shaderProgram, "vertexColor");
  if (positionAttribLocation === -1 || colorAttribLocation === -1) {
    console.error("Failed to get attribute locations");
    return null;
  }

  const shapeLocationUniform = gl.getUniformLocation(shaderProgram, "shapeLocation");
  const shapeSizeUniform = gl.getUniformLocation(shaderProgram, "shapeSize");
  const canvasSizeUniform = gl.getUniformLocation(shaderProgram, "canvasSize");
  const uAlphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
  if (!shapeLocationUniform || !shapeSizeUniform || !canvasSizeUniform || !uAlphaUniform) {
    console.error("Failed to get uniform locations");
    return null;
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const vaos = [];
  for (let i = 0; i < squareColorBuffers.length; i++) {
    vaos.push(createTwoBufferVAO(gl, squareGeoBuffer, squareColorBuffers[i], positionAttribLocation, colorAttribLocation));
  }

  return {
    shaderProgram,
    vaos,
    shapeLocationUniform,
    shapeSizeUniform,
    canvasSizeUniform,
    uAlphaUniform
  }
}

function webGLRender2D() {
  webGlBackgroundColor(173, 216, 230, 1);
  gl.viewport(0, 0, webGlCanvas.width, webGlCanvas.height);
}

shaderProgramInfo = null;

function initializeWebGL() {
  shaderProgramInfo = createShaderProgram();
  if (!shaderProgramInfo) {
    console.error("Failed to initialize shader program");
    return;
  } else {shadersInitialized = true;}
}

function renderSquare(x, y, size, vaoIndex, alpha = 1.0) {
  gl.useProgram(shaderProgramInfo.shaderProgram);
  gl.uniform2f(shaderProgramInfo.canvasSizeUniform, webGlCanvas.width, webGlCanvas.height);
  gl.uniform2f(shaderProgramInfo.shapeLocationUniform, x, y);
  gl.uniform1f(shaderProgramInfo.shapeSizeUniform, size);
  gl.uniform1f(shaderProgramInfo.uAlphaUniform, alpha);

  gl.bindVertexArray(shaderProgramInfo.vaos[vaoIndex]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}

if (webGl) {
  initializeWebGL();
  webGlBackgroundColor(105, 105, 105, 1);
}

// apProject2dWebGl.js
let shadersInitialized = false;

// Shader code adapted from online tutorials
const vertexShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec2 vertexPosition;
  in vec3 vertexColor;

  out vec3 fragmentColor;

  uniform vec2 canvasSize;
  uniform vec2 shapeLocation;
  uniform vec2 shapeSize;

  void main() {
    fragmentColor = vertexColor;

    vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
    vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

    gl_Position = vec4(clipPosition * vec2(1.0, -1.0), 0.0, 1.0);
  }
`;

const fragmentShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec3 fragmentColor;
  out vec4 outputColor;
  uniform float uAlpha;

  void main() {
    outputColor = vec4(fragmentColor, uAlpha);
  }
`;

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

const playerVertices = new Float32Array([
  // Bottom left
  0, 1,
  // Top left
  0, 0,
  // Top right
  0.74, 0,
  // Bottom left
  0, 1,
  // Top right
  0.74, 0,
  // Bottom right
  0.74, 1
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

function createShapeShaderProgram() {
  const squareGeoBuffer = createStaticVertexBuffer(gl, squareVertices);
  if (!squareGeoBuffer) {
    console.error("Failed to create buffers");
    return null;
  }
  const playerGeoBuffer = createStaticVertexBuffer(gl, playerVertices);
  if (!playerGeoBuffer) {
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
    if (i === squareColorBuffers.length - 1) {
      vaos.push(createTwoBufferVAO(gl, playerGeoBuffer, squareColorBuffers[i], positionAttribLocation, colorAttribLocation));
      break;
    }
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

const imageVertexShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec2 vertexPosition;
  in vec2 texCoord;

  out vec2 v_texCoord;

  uniform vec2 canvasSize;
  uniform vec2 shapeLocation;
  uniform vec2 shapeSize;

  void main() {
    v_texCoord = texCoord;
    vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
    vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

    gl_Position = vec4(clipPosition * vec2(1.0, -1.0), 0.0, 1.0);
  }
`;

const imageFragmentShaderSourceCode = `#version 300 es
  precision highp float;

  uniform sampler2D uTexture;
  uniform float uAlpha;

  in vec2 v_texCoord;

  out vec4 outputColor;

  void main() {
    vec4 color = texture(uTexture, v_texCoord);
    outputColor = vec4(color.rgb, color.a * uAlpha);
  }
`;

const imageTextureCache = new WeakMap();

function createImageShaderProgram() {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, imageVertexShaderSourceCode);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader compilation error: " + gl.getShaderInfoLog(vertexShader));
    return;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, imageFragmentShaderSourceCode);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error("Fragment shader compilation error: " + gl.getShaderInfoLog(fragmentShader));
    return;
  }

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("Shader program linking error: " + gl.getProgramInfoLog(shaderProgram));
    return;
  }

  const vertexPositionAttributeLocation = gl.getAttribLocation(shaderProgram, "vertexPosition");
  const texCoordAttributeLocation = gl.getAttribLocation(shaderProgram, "texCoord");
  if (vertexPositionAttributeLocation < 0 || texCoordAttributeLocation < 0) {
    console.error("Failed to get the attribute location for vertexPosition or texCoord");
  }
  const canvasSizeUniform = gl.getUniformLocation(shaderProgram, "canvasSize");
  const shapeLocationUniform = gl.getUniformLocation(shaderProgram, "shapeLocation");
  const shapeSizeUniform = gl.getUniformLocation(shaderProgram, "shapeSize");
  const uTextureUniform = gl.getUniformLocation(shaderProgram, "uTexture");
  const uAlphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
  if (canvasSizeUniform === null || shapeLocationUniform === null || shapeSizeUniform === null || uTextureUniform === null || uAlphaUniform === null) {
    console.error("Failed to get uniform locations");
    return;
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // Vertex position buffer
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.error("Failed to create vertex buffer");
    gl.bindVertexArray(null);
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     0, 0,
     1, 0,
     0, 1,
     0, 1,
     1, 0,
     1, 1
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(vertexPositionAttributeLocation);
  gl.vertexAttribPointer(vertexPositionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Texture coordinate buffer
  var texCoordBuffer = gl.createBuffer();
  if (!texCoordBuffer) {
    console.error("Failed to create texture coordinate buffer");
    gl.bindVertexArray(null);
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordAttributeLocation);
  gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  return {
    shaderProgram,
    vao,
    canvasSizeUniform,
    shapeLocationUniform,
    shapeSizeUniform,
    uTextureUniform,
    uAlphaUniform
  };
}

function webGLRender2D() {
  gl.viewport(0, 0, webGlCanvas.width, webGlCanvas.height);
  webGlBackgroundColor(173, 216, 230, 1);
}

shapeShaderProgramInfo = null;
imageShaderProgramInfo = null;

function initializeWebGL() {
  shapeShaderProgramInfo = createShapeShaderProgram();
  imageShaderProgramInfo = createImageShaderProgram();
  if (!shapeShaderProgramInfo || !imageShaderProgramInfo) {
    console.error("Failed to initialize shader program");
    return;
  } else {shadersInitialized = true;}
}

function renderRect(x, y, width, height, vaoIndex, alpha = 1.0) {
  gl.useProgram(shapeShaderProgramInfo.shaderProgram);
  gl.uniform2f(shapeShaderProgramInfo.canvasSizeUniform, webGlCanvas.width, webGlCanvas.height);
  gl.uniform2f(shapeShaderProgramInfo.shapeLocationUniform, x, y);
  gl.uniform2f(shapeShaderProgramInfo.shapeSizeUniform, width, height);
  gl.uniform1f(shapeShaderProgramInfo.uAlphaUniform, alpha);

  gl.bindVertexArray(shapeShaderProgramInfo.vaos[vaoIndex]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}

function renderImage(image, x, y, width, height, alpha = 1.0) {
  if (!image) return;
  if ("complete" in image && !image.complete) return;

  let texture = imageTextureCache.get(image);
  if (!texture) {
    texture = gl.createTexture();
    if (!texture) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.hint(gl.GENERATE_MIPMAP_HINT, gl.NICEST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    imageTextureCache.set(image, texture);
  }


  gl.viewport(0, 0, webGlCanvas.width, webGlCanvas.height);

  gl.useProgram(imageShaderProgramInfo.shaderProgram);
  gl.bindVertexArray(imageShaderProgramInfo.vao);

  gl.uniform2f(imageShaderProgramInfo.canvasSizeUniform, webGlCanvas.width, webGlCanvas.height);
  gl.uniform2f(imageShaderProgramInfo.shapeLocationUniform, x, y);
  gl.uniform2f(imageShaderProgramInfo.shapeSizeUniform, width, height);
  gl.uniform1f(imageShaderProgramInfo.uAlphaUniform, alpha);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.uniform1i(imageShaderProgramInfo.uTextureUniform, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.bindVertexArray(null);
}

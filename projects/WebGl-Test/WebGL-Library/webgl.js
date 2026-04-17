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
const SPAWNER_CHANGE_TIME = 5;
const SPAWN_RATE = 0.08;
const MIN_SHAPE_TIME = 0.5;
const MAX_SHAPE_TIME = 6;
const MIN_SHAPE_SPEED = 125;
const MAX_SHAPE_SPEED = 300;
const MIN_SHAPE_FORCE = 100;
const MAX_SHAPE_FORCE = 300;
const MIN_SHAPE_SIZE = 5;
const MAX_SHAPE_SIZE = 50;
const MAX_SHAPE_COUNT = 250;
const CIRCLE_SEGMENT_COUNT = 40;

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

    gl_Position = vec4(clipPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSourceCode = `#version 300 es
  precision mediump float;

  in vec3 fragmentColor;
  out vec4 outputColor;

  void main() {
    outputColor = vec4(fragmentColor, 1.0);
  }
`;

function buildCircleVertexBufferData() {
  const vertexData = [];

  for (let i = 0; i < CIRCLE_SEGMENT_COUNT; i++) {
    vertex1Angle = i * Math.PI * 2 / CIRCLE_SEGMENT_COUNT;
    vertex2Angle = (i + 1) * Math.PI * 2 / CIRCLE_SEGMENT_COUNT;

    const x1 = Math.cos(vertex1Angle);
    const y1 = Math.sin(vertex1Angle);
    const x2 = Math.cos(vertex2Angle);
    const y2 = Math.sin(vertex2Angle);

    vertexData.push(
      // Position
      0, 0,
      // Color
      0.678, 0.851, 0.957
    );
    vertexData.push(x1, y1, 0.251, 0.353, 0.856);
    vertexData.push(x2, y2, 0.251, 0.353, 0.856);
  }

  return new Float32Array(vertexData);
}

const triangleVertices = new Float32Array([0, 1, -1, -1, 1, -1]);
const squareVertices = new Float32Array([-1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1]);
const rgbTriangleColors = new Uint8Array([
  255, 0, 0,
  0, 255, 0,
  0, 0, 255
]);
const fireyTriangleColors = new Uint8Array([
  229, 47, 15,
  246, 206, 29,
  233, 154, 26
]);
const indigoGradientSquareColors = new Uint8Array([
  167, 153, 255,
  88, 62, 122,
  88, 62, 122,
  167, 153, 255,
  88, 62, 122,
  167, 153, 255
]);
const graySquareColors = new Uint8Array([
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45,
  45, 45, 45
]);

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

function createInterleavedBufferVAO(gl = WebGL2RenderingContext, interleavedBuffer = WebGLBuffer, positionAttribLocation = number, colorAttribLocation = number) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, interleavedBuffer);
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.UNSIGNED_BYTE, true, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  return vao;
}

function getRandomInRange(min = number, max = number) {
  return Math.random() * (max - min) + min;
}

class MovingShape {
  constructor(
    position = [number, number],
    velocity = [number, number],
    force = [number, number],
    size = number,
    timeRemaining = number,
    vao = WebGLVertexArrayObject,
    numVertices = number
  ) {
    this.position = position;
    this.velocity = velocity;
    this.force = force;
    this.size = size;
    this.timeRemaining = timeRemaining;
    this.vao = vao;
    this.numVertices = numVertices;
  }

  update(dt = number) {
    this.velocity[0] += this.force[0] * dt;
    this.velocity[1] += this.force[1] * dt;

    this.position[0] += this.velocity[0] * dt;
    this.position[1] += this.velocity[1] * dt;

    this.timeRemaining -= dt;
  }

  isAlive() {
    return this.timeRemaining > 0;
  }
}

function helloTriangle() {
  const triangleGeoBuffer = createStaticVertexBuffer(gl, triangleVertices);
  const rgbTriangleColorBuffer = createStaticVertexBuffer(gl, rgbTriangleColors);
  const fireyTriangleColorBuffer = createStaticVertexBuffer(gl, fireyTriangleColors);

  const squareGeoBuffer = createStaticVertexBuffer(gl, squareVertices);
  const indigoGradientSquareColorBuffer = createStaticVertexBuffer(gl, indigoGradientSquareColors);
  const graySquareColorBuffer = createStaticVertexBuffer(gl, graySquareColors);

  const circleInterleavedBuffer = createStaticVertexBuffer(gl, buildCircleVertexBufferData());

  if (!triangleGeoBuffer || !rgbTriangleColorBuffer || !fireyTriangleColorBuffer || !squareGeoBuffer || !indigoGradientSquareColorBuffer || !graySquareColorBuffer || !circleInterleavedBuffer) {
    console.error("Failed to create buffers");
    return;
  }

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader compilation error: " + gl.getShaderInfoLog(vertexShader));
    return;
  }

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
  const vertexColorAttributeLocation = gl.getAttribLocation(triangleShaderProgram, "vertexColor");
  if (vertexPositionAttributeLocation < 0 || vertexColorAttributeLocation < 0) {
    console.error("Failed to get the attribute location for vertexPosition or vertexColor");
    return;
  }

  const shapeLocationUniform = gl.getUniformLocation(triangleShaderProgram, "shapeLocation");
  const shapeSizeUniform = gl.getUniformLocation(triangleShaderProgram, "shapeSize");
  const canvasSizeUniform = gl.getUniformLocation(triangleShaderProgram, "canvasSize");
  if (shapeLocationUniform === null || shapeSizeUniform === null || canvasSizeUniform === null) {
    console.error("Failed to get uniform locations");
    return;
  }

  const rgbTriangleVAO = createTwoBufferVAO(gl, triangleGeoBuffer, rgbTriangleColorBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const fireyTriangleVAO = createTwoBufferVAO(gl, triangleGeoBuffer, fireyTriangleColorBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const indigoGradientSquareVAO = createTwoBufferVAO(gl, squareGeoBuffer, indigoGradientSquareColorBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const graySquareVAO = createTwoBufferVAO(gl, squareGeoBuffer, graySquareColorBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);
  const circleVAO = createInterleavedBufferVAO(gl, circleInterleavedBuffer, vertexPositionAttributeLocation, vertexColorAttributeLocation);

  if (!rgbTriangleVAO || !fireyTriangleVAO || !indigoGradientSquareVAO || !graySquareVAO || !circleVAO) {
    console.error("Failed to create VAOs");
    return;
  }

  const geometryList = [
    { vao: rgbTriangleVAO, numVertices: 3 },
    { vao: fireyTriangleVAO, numVertices: 3 },
    { vao: indigoGradientSquareVAO, numVertices: 6 },
    { vao: graySquareVAO, numVertices: 6 },
    { vao: circleVAO, numVertices: CIRCLE_SEGMENT_COUNT * 3 }

  ]

  // Set up logical objects
  let shapes = [];
  let timeToNextSpawn = SPAWN_RATE;
  let spawnPosition = [getRandomInRange(canvas.width * 0.1, canvas.width * 0.9), getRandomInRange(canvas.height * 0.1, canvas.height * 0.9)];
  let timeToSpawnerChange = SPAWNER_CHANGE_TIME;

  let lastFrameTime = performance.now();
  const frame = function() {
    const thisFrameTime = performance.now();
    const dt = (thisFrameTime - lastFrameTime) / 1000;
    lastFrameTime = thisFrameTime;

    timeToSpawnerChange -= dt;
    if (timeToSpawnerChange < 0) {
      timeToSpawnerChange = SPAWNER_CHANGE_TIME;
      spawnPosition = [getRandomInRange(canvas.width * 0.1, canvas.width * 0.9), getRandomInRange(canvas.height * 0.1, canvas.height * 0.9)];
    }

    timeToNextSpawn -= dt;
    while (timeToNextSpawn < 0) {
      timeToNextSpawn += SPAWN_RATE;

      const movementAngle = getRandomInRange(0, 2 * Math.PI);
      const movementSpeed = getRandomInRange(MIN_SHAPE_SPEED, MAX_SHAPE_SPEED);
      const forceAngle = getRandomInRange(0, 2 * Math.PI);
      const forceSpeed = getRandomInRange(MIN_SHAPE_FORCE, MAX_SHAPE_FORCE);

      const position = [spawnPosition[0], spawnPosition[1]];
      const velocity = [Math.sin(movementAngle) * movementSpeed, Math.cos(movementAngle) * movementSpeed];
      const force = [Math.sin(forceAngle) * forceSpeed, Math.cos(forceAngle) * forceSpeed];
      const size = getRandomInRange(MIN_SHAPE_SIZE, MAX_SHAPE_SIZE);
      const timeRemaining = getRandomInRange(MIN_SHAPE_TIME, MAX_SHAPE_TIME);

      const geometryIdx = Math.floor(Math.random() * geometryList.length);
      const geometry = geometryList[geometryIdx];

      if (geometry.vao === circleVAO) {
        console.log("Spawning circle");
      }

      const shape = new MovingShape(position, velocity, force, size, timeRemaining, geometry.vao, geometry.numVertices);

      if (shapes.length < MAX_SHAPE_COUNT) {
        shapes.push(shape);
      }
    }

    for (let shape of shapes) {
      shape.update(dt);
    }
    shapes = shapes.filter(shape => shape.isAlive());

    backgroundColor(gl, 20, 20, 20, 1.0);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set GPU program (vertex and fragment shader)
    gl.useProgram(triangleShaderProgram);

    // Draw call (Primitive assembler - how to make triangles from those vertices)
    gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);

    for (let shape of shapes) {
      gl.uniform1f(shapeSizeUniform, shape.size);
      gl.uniform2f(shapeLocationUniform, shape.position[0], shape.position[1]);
      gl.bindVertexArray(shape.vao);
      gl.drawArrays(gl.TRIANGLES, 0, shape.numVertices);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
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

  triangle(
    x1, y1,
    x2, y2,
    x3, y3,
    255, 0, 255, 1.0
  );



  requestAnimationFrame(loop);
}
//loop();
//helloTriangle();

function imageProcessing(image, x, y, alpha = 1.0, size) {
  const vertexShaderSourceCode = `#version 300 es
    precision mediump float;

    in vec2 vertexPosition;
    in vec2 texCoord;

    out vec2 v_texCoord;

    uniform vec2 canvasSize;
    uniform vec2 shapeLocation;
    uniform float shapeSize;

    void main() {
      v_texCoord = texCoord;
      vec2 finalVertexPosition = vertexPosition * shapeSize + shapeLocation;
      vec2 clipPosition = (finalVertexPosition / canvasSize) * 2.0 - 1.0;

      gl_Position = vec4(clipPosition * vec2(1.0, -1.0), 0.0, 1.0);
    }
  `;

  const fragmentShaderSourceCode = `#version 300 es
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

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSourceCode);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader compilation error: " + gl.getShaderInfoLog(vertexShader));
    return;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSourceCode);
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
    return;
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

  // Vertex position buffer
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     0, 0,
     1, 0,
     0, 1,
     0, 1,
     1, 0,
     1, 1
  ]), gl.STATIC_DRAW);
  if (!vertexBuffer) {
    console.error("Failed to create vertex buffer");
    return;
  }
  gl.enableVertexAttribArray(vertexPositionAttributeLocation);
  gl.vertexAttribPointer(vertexPositionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Texture coordinate buffer
  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1
  ]), gl.STATIC_DRAW);
  if (!texCoordBuffer) {
    console.error("Failed to create texture coordinate buffer");
    return;
  }
  gl.enableVertexAttribArray(texCoordAttributeLocation);
  gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  //Texture stuff
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.useProgram(shaderProgram);

  gl.uniform2f(canvasSizeUniform, canvas.width, canvas.height);
  gl.uniform2f(shapeLocationUniform, x, y);
  gl.uniform1f(shapeSizeUniform, size);
  gl.uniform1f(uAlphaUniform, alpha);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

var image = new Image();
image.src = "/images/SuperMarioTitle.png";
image.onload = function() {
  //imageProcessing(image, 50, 50, 1, 50);
}
